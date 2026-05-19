import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import type { User } from '@supabase/supabase-js';
import { useHistory } from '../hooks';
import {
  LayersIcon, GlobeIcon, LinkIcon, FileTextIcon,
  PlayIcon, DownloadIcon, TrashIcon, PlusIcon, LogOutIcon,
  MenuIcon, XIcon, ClockIcon, ZapIcon, HistoryIcon, CpuIcon, AlertIcon,
  TAB_ICONS, ClipboardCheck
} from '../icons';
import { TABS, TAB_META, API, type TabKey, type StepStatus, type Results, type Statuses, type HistoryItem } from '../lib';

marked.setOptions({ breaks: true, gfm: true });

const parseMd = (t: string) => {
  if (!t) return '';
  const s = t.length > 8000 ? t.slice(0, 8000) + '\n\n… (truncated)' : t;
  return marked.parse(s) as string;
};

const dotCls: Record<StepStatus, string> = {
  idle:       'bg-txt3',
  processing: 'bg-wheat animate-blink shadow-[0_0_6px_theme(colors.wheat)]',
  complete:   'bg-sage shadow-[0_0_8px_rgba(143,170,148,0.5)]',
  error:      'bg-rose',
};
const badgeCls: Record<StepStatus, string> = {
  idle:       'bg-txt3/10 border-txt3/20 text-txt3',
  processing: 'bg-wheat/10 border-wheat/20 text-wheat',
  complete:   'bg-sage/10 border-sage/20 text-sage',
  error:      'bg-rose/10 border-rose/20 text-rose',
};
const badgeLbl: Record<StepStatus, string> = {
  idle:'Waiting', processing:'Processing…', complete:'Complete', error:'Failed',
};

type Props = { user: User; logout: ()=>void; onNavigate: (page: 'home' | 'research' | 'auth') => void };

export default function ResearchPage({ user, logout, onNavigate }: Props) {
  const { history, loadingHistory, addHistory, removeHistory } = useHistory(user.id);
  const [topic, setTopic]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab]     = useState<TabKey>('search');
  const [error, setError]             = useState('');
  const [cached, setCached]           = useState(false);
  const [durationMs, setDurationMs]   = useState(0);
  const [results, setResults]         = useState<Results>({ search:'', scrape:'', report:'', feedback:'' });
  const [statuses, setStatuses]       = useState<Statuses>({ search:'idle', scrape:'idle', report:'idle', feedback:'idle' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeHistId, setActiveHistId] = useState<string|null>(null);
  const esRef  = useRef<EventSource|null>(null);
  const mainRef = useRef<HTMLDivElement>(null);


  const stopStream = useCallback(() => { esRef.current?.close(); esRef.current = null; }, []);

  const resetPipeline = useCallback(() => {
    setResults({ search:'', scrape:'', report:'', feedback:'' });
    setStatuses({ search:'idle', scrape:'idle', report:'idle', feedback:'idle' });
    setCached(false); setDurationMs(0); setActiveHistId(null);
  }, []);

  const run = useCallback(() => {
    const t = topic.trim();
    if (!t || loading) return;
    stopStream();
    setLoading(true); setError(''); setShowResults(true); setActiveTab('search');
    resetPipeline();

    const es = new EventSource(`${API}/api/research/stream?topic=${encodeURIComponent(t)}`);
    esRef.current = es;
    let finalResults: Partial<Results> = {};

    es.onmessage = (e: MessageEvent) => {
      try {
        const { step, status: st, data } = JSON.parse(e.data);
        if (step === 'cache' && st === 'hit') { setCached(true); return; }
        if (step === 'done') {
          try { const m = JSON.parse(data); if(m.duration_ms) setDurationMs(m.duration_ms); if(m.cached) setCached(true); } catch{}
          setLoading(false); stopStream();
          setActiveTab('report');
          addHistory({
            topic: t,
            search_results: finalResults.search ?? '',
            scraped_content: finalResults.scrape ?? '',
            report: finalResults.report ?? '',
            feedback: finalResults.feedback ?? '',
          });
          return;
        }
        if (step === 'error') { setError(data || 'Pipeline error.'); setLoading(false); stopStream(); return; }
        const key = step as TabKey;
        if (step === 'report_chunk' && st === 'streaming') {
          setResults(p => { const n = { ...p, report: p.report + data }; finalResults = n; return n; });
          setStatuses(p => ({ ...p, report: 'processing' }));
          setActiveTab('report');
          return;
        }
        
        if (!TABS.includes(key)) return;
        const s: StepStatus = st==='complete' ? 'complete' : st==='error' ? 'error' : 'processing';
        setStatuses(p => ({ ...p, [key]: s }));
        if (st === 'complete' && data) {
          setResults(p => { const n = { ...p, [key]: data }; finalResults = n; return n; });
          setActiveTab(key);
        }
      } catch {}
    };
    es.onerror = () => { setError('Lost connection. Check the backend is running.'); setLoading(false); stopStream(); };
  }, [topic, loading, stopStream, resetPipeline, addHistory]);

  const loadHistItem = useCallback((item: HistoryItem) => {
    stopStream(); setLoading(false); setError('');
    setTopic(item.topic);
    setResults({ search: item.search_results, scrape: item.scraped_content, report: item.report, feedback: item.feedback });
    setStatuses({ search:'complete', scrape:'complete', report:'complete', feedback:'complete' });
    setShowResults(true); setActiveTab('report'); setActiveHistId(item.id);
    setSidebarOpen(false);
  }, [stopStream]);

  const newResearch = useCallback(() => {
    stopStream(); setTopic(''); setShowResults(false); setError('');
    setLoading(false); resetPipeline(); setSidebarOpen(false);
  }, [stopStream, resetPipeline]);

  const download = useCallback(() => {
    const body = TABS.map(t => `${'─'.repeat(60)}\n${TAB_META[t].title.toUpperCase()}\n${'─'.repeat(60)}\n${results[t]}`).join('\n\n');
    const txt = `MULTIAGENT RESEARCH REPORT\nTopic: ${topic}\nGenerated: ${new Date().toLocaleString()}\n\n${body}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
    a.download = `report-${topic.replace(/\s+/g,'-').slice(0,40)}.txt`;
    a.click(); URL.revokeObjectURL(a.href);
  }, [topic, results]);

  const richResults = useMemo(() => ({
    search:   parseMd(results.search),
    scrape:   parseMd(results.scrape),
    report:   parseMd(results.report),
    feedback: parseMd(results.feedback),
  }), [results]);

  const avatarLetter = user.email?.[0]?.toUpperCase() ?? 'U';

  const Sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-bdr cursor-pointer hover:bg-white/3 transition-colors flex-shrink-0" onClick={() => onNavigate('home')}>
        <div className="w-8 h-8 rounded-lg bg-sage/10 border border-sage/25 flex items-center justify-center text-sage flex-shrink-0">
          <LayersIcon size={16}/>
        </div>
        <div>
          <p className="font-serif text-sm text-txt leading-none">MultiAgent Research</p>
          <p className="text-[10px] uppercase tracking-widest text-txt3 mt-0.5">Research Intelligence</p>
        </div>
      </div>
      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-bdr flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-lav/10 border border-lav/20 flex items-center justify-center text-[11px] font-bold text-lav flex-shrink-0">
          {avatarLetter}
        </div>
        <p className="text-xs text-txt2 truncate flex-1">{user.email}</p>
      </div>
      {/* New */}
      <div className="px-3 pt-3 flex-shrink-0">
        <button onClick={newResearch} className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-sage/10 border border-sage/20 text-sage text-xs font-semibold hover:bg-sage/18 transition-all">
          <PlusIcon size={13}/> New Research
        </button>
      </div>
      {/* History */}
      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-txt3 flex items-center gap-1.5">
          <HistoryIcon size={11}/> History
        </p>
        {loadingHistory && <p className="text-[11px] text-txt3 italic px-3 py-2">Loading…</p>}
        {!loadingHistory && history.length === 0 && (
          <p className="text-[11px] text-txt3 italic px-3 py-2">No history yet. Run a research query to start.</p>
        )}
        {history.map(item => (
          <div key={item.id}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all mb-0.5 border
              ${activeHistId===item.id ? 'bg-sage/10 border-sage/20' : 'border-transparent hover:bg-white/3 hover:border-bdr'}`}
            onClick={() => loadHistItem(item)}>
            <FileTextIcon size={12} className="text-txt3 flex-shrink-0 group-hover:text-sage transition-colors"/>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-txt font-medium truncate">{item.topic}</p>
              <p className="text-[10px] text-txt3 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={e=>{ e.stopPropagation(); removeHistory(item.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-txt3 hover:text-rose hover:bg-rose/10 transition-all flex-shrink-0">
              <TrashIcon size={11}/>
            </button>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="px-3 py-3 border-t border-bdr flex-shrink-0">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-txt2 border border-bdr hover:text-rose hover:bg-rose/10 hover:border-rose/25 transition-all">
          <LogOutIcon size={13}/> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-bg2 border-r border-bdr">
        {Sidebar}
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={()=>setSidebarOpen(false)}/>
            <motion.aside
              initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}}
              transition={{type:'spring',stiffness:300,damping:30}}
              className="fixed left-0 top-0 bottom-0 w-72 bg-bg2 border-r border-bdr z-50 flex flex-col md:hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-bdr">
                <span className="font-serif text-sm text-txt">Navigation</span>
                <button onClick={()=>setSidebarOpen(false)} className="p-1 text-txt2 hover:text-txt"><XIcon size={16}/></button>
              </div>
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-bdr bg-bg2 flex-shrink-0 min-h-[57px] ${!showResults ? 'md:hidden' : ''}`}>
          <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-1.5 text-txt2 hover:text-txt hover:bg-white/5 rounded-lg">
            <MenuIcon size={18}/>
          </button>
          {showResults && (
            <>
              <input
                className="input-base flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
                placeholder="Enter a research topic…"
                value={topic}
                onChange={e=>setTopic(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') run(); }}
                disabled={loading}
                maxLength={500}
              />
              <button className="btn-primary flex-shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm" onClick={run} disabled={loading}>
                {loading
                  ? <><span className="w-3.5 h-3.5 border border-sage/30 border-t-sage rounded-full animate-spin"/><span className="hidden sm:inline">Running…</span></>
                  : <><PlayIcon size={13}/><span className="hidden sm:inline">Run Pipeline</span></>}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-rose/10 border border-rose/20 text-rose text-xs rounded-lg px-3 py-2.5">
            <AlertIcon size={13}/>{error}
          </div>
        )}

        <div ref={mainRef} className="flex-1 overflow-y-auto">
          {showResults ? (
            <div className="p-4 flex flex-col gap-3">
              {/* Meta chips */}
              {(cached || durationMs > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {cached && <span className="badge bg-sage/10 border-sage/20 text-sage gap-1"><ZapIcon size={10}/>Cached</span>}
                  {durationMs > 0 && <span className="badge bg-lav/10 border-lav/20 text-lav gap-1"><ClockIcon size={10}/>{(durationMs/1000).toFixed(1)}s</span>}
                  <button className="btn-ghost py-1 px-2.5 text-xs ml-auto" onClick={download} disabled={!results.report}>
                    <DownloadIcon size={12}/><span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              )}

              {/* Tab nav */}
              <div className="flex gap-1 overflow-x-auto pb-px scrollbar-thin">
                {TABS.map(tab => {
                  const Icon = TAB_ICONS[tab];
                  return (
                    <button key={tab}
                      onClick={()=>setActiveTab(tab)}
                      className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-t-xl border border-b-0 text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                        ${activeTab===tab ? 'bg-sur border-bdr text-txt' : 'bg-transparent border-transparent text-txt2 hover:text-txt hover:bg-white/3'}`}>
                      <Icon size={12}/>
                      {TAB_META[tab].label}
                      <span className={`step-dot ${dotCls[statuses[tab]]}`}/>
                    </button>
                  );
                })}
              </div>

              {/* Panel */}
              <AnimatePresence mode="wait">
                {TABS.map(tab => activeTab === tab && (
                  <motion.div key={tab}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                    transition={{ duration:0.2, ease:[0.22,1,0.36,1] }}
                    className="card rounded-tl-none overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-bdr flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0
                          ${tab==='search' ? 'bg-sage/8 border-sage/20 text-sage' : tab==='scrape' ? 'bg-sky/8 border-sky/20 text-sky' : tab==='report' ? 'bg-lav/8 border-lav/20 text-lav' : 'bg-rose/8 border-rose/20 text-rose'}`}>
                          {(() => { const Icon = TAB_ICONS[tab]; return <Icon size={14}/>; })()}
                        </div>
                        <h2 className="font-serif text-sm sm:text-base text-txt">{TAB_META[tab].title}</h2>
                      </div>
                      <span className={`badge ${badgeCls[statuses[tab]]}`}>{badgeLbl[statuses[tab]]}</span>
                    </div>
                    <div className="px-3 sm:px-5 py-4 sm:py-5 min-h-[200px]">
                      {statuses[tab] === 'processing' && !results[tab] && (
                        <div className="flex items-center gap-3 text-wheat text-sm py-4">
                           <span className="w-4 h-4 border border-wheat/20 border-t-wheat rounded-full animate-spin"/>
                           Agent is working…
                        </div>
                      )}
                      {results[tab] && (
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: richResults[tab] }}/>
                      )}
                      {statuses[tab] === 'processing' && results[tab] && (
                        <div className="flex items-center gap-2 mt-4 text-wheat/80 text-xs italic">
                           <span className="w-3 h-3 border border-wheat/20 border-t-wheat rounded-full animate-spin"/>
                           Generating…
                        </div>
                      )}
                      {statuses[tab] !== 'processing' && !results[tab] && (
                        <p className="text-txt3 text-sm italic">Awaiting pipeline execution…</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Empty state */
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.4}}
              className="flex-1 flex flex-col items-center justify-center p-4 sm:p-10 text-center min-h-full gap-3">
              <div className="w-14 h-14 rounded-2xl bg-sage/10 border border-sage/20 flex items-center justify-center text-sage mb-1 sm:mb-2">
                <CpuIcon size={24}/>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-txt">Start your research</h2>
              <p className="text-txt3 text-xs sm:text-sm max-w-xs leading-relaxed">Enter any topic below and watch 4 AI agents collaborate in real time to deliver a structured report.</p>
              
              {/* Centered Search Bar */}
              <div className="w-full max-w-lg mt-3 mb-2 flex items-center gap-2 p-1.5 bg-white border border-bdr rounded-xl shadow-sm focus-within:border-sage focus-within:ring-2 focus-within:ring-[#A7ABDB]/10 transition-all duration-200">
                <input
                  className="w-full bg-transparent border-0 px-3 py-2 text-sm placeholder-txt3 outline-none text-txt"
                  placeholder="Enter a research topic…"
                  value={topic}
                  onChange={e=>setTopic(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') run(); }}
                  disabled={loading}
                  maxLength={500}
                />
                <button 
                  className="btn-primary flex-shrink-0 px-4 py-2 text-xs sm:text-sm" 
                  onClick={run} 
                  disabled={loading || !topic.trim()}
                >
                  {loading
                    ? <><span className="w-3.5 h-3.5 border border-sage/30 border-t-sage rounded-full animate-spin"/><span className="hidden sm:inline">Running…</span></>
                    : <><PlayIcon size={13}/><span className="hidden sm:inline">Run Pipeline</span></>}
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:gap-2.5 mt-4 text-left w-full max-w-xs">
                {[
                  { label: 'Web search via Tavily', Icon: GlobeIcon, cls: 'text-sage' },
                  { label: 'Deep-scrape top source', Icon: LinkIcon, cls: 'text-sky' },
                  { label: 'AI report generation', Icon: FileTextIcon, cls: 'text-lav' },
                  { label: 'Quality critique review', Icon: ClipboardCheck, cls: 'text-rose' },
                ].map(({ label, Icon, cls }, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-txt3">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-sage/10 border border-sage/20 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-sage flex-shrink-0">{i+1}</span>
                    <span className={`${cls} flex-shrink-0`}><Icon size={13}/></span>
                    {label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// @ts-nocheck
const { useEffect, useMemo, useState } = React;

type TabKey = 'search' | 'scrape' | 'report' | 'feedback';
type StepStatus = 'processing' | 'complete' | 'error';

type ResultState = {
  search: string;
  scrape: string;
  report: string;
  feedback: string;
};

type ApiResponse = {
  status: string;
  search_results: string;
  scraped_content: string;
  report: string;
  feedback: string;
};

const initialResults: ResultState = {
  search: 'Searching for information...',
  scrape: 'Scraping relevant content...',
  report: 'Generating comprehensive report...',
  feedback: 'Reviewing report quality...'
};

const initialStatus: Record<TabKey, StepStatus> = {
  search: 'processing',
  scrape: 'processing',
  report: 'processing',
  feedback: 'processing'
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createLink(url: string, label: string): string {
  const linkClass = 'text-sky-400 underline decoration-sky-400/70 underline-offset-2 hover:text-sky-300 break-all';
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${label}</a>`;
}

function formatText(text: string): string {
  if (!text) {
    return '';
  }

  let cleaned = String(text);
  cleaned = cleaned.replace(/\{\s*['\"]type['\"]\s*:\s*['\"]reference['\"][^}]*\}/gi, '');
  cleaned = cleaned.replace(/^\s*#{1,6}\s*/gm, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  cleaned = cleaned.replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|$)/g, '$1$2');
  cleaned = cleaned.replace(/^\s*---+\s*$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  const maxLength = 5000;
  if (cleaned.length > maxLength) {
    return `${cleaned.substring(0, maxLength)}\n\n... (truncated)`;
  }
  return cleaned;
}

function renderRichText(text: string): string {
  const cleaned = formatText(text);
  const escaped = escapeHtml(cleaned);
  const placeholders: string[] = [];

  let html = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label: string, url: string) => {
    const marker = `@@LINK_${placeholders.length}@@`;
    placeholders.push(createLink(url, label));
    return marker;
  });

  html = html.replace(/https?:\/\/[^\s<]+/g, (rawUrl: string) => {
    let url = rawUrl;
    let trailing = '';
    while (/[),.!?;:]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    return `${createLink(url, url)}${trailing}`;
  });

  html = html.replace(/(^|\s)(www\.[^\s<]+)/g, (_m: string, prefix: string, rawUrl: string) => {
    let url = rawUrl;
    let trailing = '';
    while (/[),.!?;:]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    return `${prefix}${createLink(`https://${url}`, url)}${trailing}`;
  });

  html = html.replace(/@@LINK_(\d+)@@/g, (_m: string, index: string) => placeholders[Number(index)] || '');
  return html.replace(/\n/g, '<br>');
}

function statusBadgeClass(status: StepStatus): string {
  if (status === 'complete') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300';
  if (status === 'error') return 'border-rose-400/30 bg-rose-400/10 text-rose-300';
  return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
}

function sideDotClass(status: StepStatus): string {
  if (status === 'complete') return 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]';
  if (status === 'error') return 'bg-rose-300 shadow-[0_0_12px_rgba(253,164,175,0.8)]';
  return 'animate-pulse bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]';
}

function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('search');
  const [error, setError] = useState('');
  const [results, setResults] = useState<ResultState>(initialResults);
  const [status, setStatus] = useState<Record<TabKey, StepStatus>>(initialStatus);

  useEffect(() => {
    fetch('/api/health').catch(() => {
      console.warn('Server not running. Please start FastAPI with: python app.py');
    });
  }, []);

  const richResults = useMemo(() => ({
    search: renderRichText(results.search),
    scrape: renderRichText(results.scrape),
    report: renderRichText(results.report),
    feedback: renderRichText(results.feedback)
  }), [results]);

  const resetPipelineState = () => {
    setResults(initialResults);
    setStatus(initialStatus);
  };

  const startResearch = async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      setError('Please enter a research topic');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setError('');
    setShowResults(true);
    setActiveTab('search');
    resetPipelineState();

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || 'An error occurred during research');
      }

      const data = (await response.json()) as ApiResponse;

      setResults({
        search: data.search_results || 'No search results found',
        scrape: data.scraped_content || 'No content could be scraped',
        report: data.report || 'Report generation failed',
        feedback: data.feedback || 'Feedback generation failed'
      });

      setStatus({
        search: 'complete',
        scrape: 'complete',
        report: 'complete',
        feedback: 'complete'
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to connect to the server. Make sure FastAPI is running.';
      setError(message);
      setShowResults(false);
      setStatus({ search: 'error', scrape: 'error', report: 'error', feedback: 'error' });
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setShowResults(false);
    setActiveTab('search');
    setError('');
    resetPipelineState();
  };

  const downloadReport = () => {
    const fullReport = `
================================================================================
                    MULTI-AGENT RESEARCH REPORT
================================================================================

TOPIC: ${topic}
Generated: ${new Date().toLocaleString()}

================================================================================
1. SEARCH RESULTS
================================================================================
${formatText(results.search)}

================================================================================
2. DETAILED CONTENT
================================================================================
${formatText(results.scrape)}

================================================================================
3. AI-GENERATED REPORT
================================================================================
${formatText(results.report)}

================================================================================
4. CRITIC FEEDBACK
================================================================================
${formatText(results.feedback)}

================================================================================
Report generated by Multi-Agent Research System
================================================================================
`;

    const blob = new Blob([fullReport], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${topic.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const tabLabel: Record<TabKey, string> = {
    search: 'Search',
    scrape: 'Scrape',
    report: 'Report',
    feedback: 'Critic'
  };

  const stepTitle: Record<TabKey, string> = {
    search: 'Step 1. Search Results',
    scrape: 'Step 2. Scraped Content',
    report: 'Step 3. AI-Generated Report',
    feedback: 'Step 4. Critic Review'
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.12),transparent_34%)]"></div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-premium backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">Agentic Research Studio</p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Multi-Agent Research System</h1>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">Search, scrape, synthesize, and critique with a premium dark workflow.</p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-xs text-slate-300 shadow-glow">FastAPI + LangChain + Tailwind + TSX</div>
          </div>
        </header>

        <main className="flex-1">
          <section className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-premium backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Enter a research topic..."
                autoComplete="off"
                value={topic}
                onChange={(e: any) => setTopic((e.target as HTMLInputElement).value)}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' && !loading) startResearch();
                }}
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={startResearch}
                disabled={loading}
              >
                <span className={loading ? 'hidden' : ''}>Start Research</span>
                <span className={loading ? '' : 'hidden'}>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30"></circle>
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" className="opacity-90"></path>
                  </svg>
                </span>
              </button>
            </div>
          </section>

          {showResults ? (
            <section className="gap-4 lg:grid lg:grid-cols-[280px_1fr]">
              <aside className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-3 shadow-premium backdrop-blur-xl lg:sticky lg:top-6 lg:h-fit">
                <div className="mb-2 border-b border-slate-700/70 px-3 pb-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Pipeline Navigator</p>
                </div>
                <nav className="space-y-2">
                  {(Object.keys(tabLabel) as TabKey[]).map((tab) => (
                    <button
                      key={tab}
                      className={`group flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                        activeTab === tab
                          ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                          : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      <span className="font-medium">{tabLabel[tab]}</span>
                      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${sideDotClass(status[tab])}`}></span>
                    </button>
                  ))}
                </nav>
                <div className="mt-4 grid gap-2">
                  <button className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-cyan-400/60 hover:text-cyan-200" onClick={downloadReport}>Download Report</button>
                  <button className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-fuchsia-400/60 hover:text-fuchsia-200" onClick={resetForm}>New Research</button>
                </div>
              </aside>

              <div className="space-y-4">
                {(Object.keys(tabLabel) as TabKey[]).map((tab) => (
                  <div key={tab} className={`${activeTab === tab ? '' : 'hidden '}rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-premium backdrop-blur-xl`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 p-4 sm:p-5">
                      <h2 className="font-display text-lg font-bold text-white">{stepTitle[tab]}</h2>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status[tab])}`}>
                        {status[tab] === 'complete' ? 'Complete' : status[tab] === 'error' ? 'Error' : 'Processing...'}
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200" dangerouslySetInnerHTML={{ __html: richResults[tab] }}></p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-10 text-center shadow-premium backdrop-blur-xl">
              <div className="mx-auto mb-3 h-12 w-12 rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-2xl leading-[3rem]">+</div>
              <h3 className="font-display text-2xl font-bold text-white">Start Your Research Flow</h3>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">Enter a topic and launch the 4-agent pipeline.</p>
            </section>
          )}

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          ) : null}
        </main>

        <footer className="mt-8 rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-center text-xs text-slate-400 backdrop-blur-xl">
          Premium Dark Research Console
        </footer>
      </div>
    </>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}

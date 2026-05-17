import { motion } from 'framer-motion';
import { LayersIcon, ArrowRight, SearchIcon, FileTextIcon, HelpCircleIcon, CheckCircleIcon, PlayIcon, ShieldAlertIcon } from 'lucide-react';

interface Props {
  user: any;
  onNavigate: (page: 'home' | 'research' | 'auth') => void;
  logout: () => void;
}

export default function LandingPage({ user, onNavigate, logout }: Props) {
  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      {/* ── Floating Header/Navbar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-bdr">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 rounded-lg bg-sage/10 border border-sage/25 flex items-center justify-center text-sage">
              <LayersIcon size={20}/>
            </div>
            <div>
              <p className="font-serif text-lg text-txt leading-none">MultiAgent Research</p>
              <p className="text-xs uppercase tracking-widest text-txt3 mt-0.5">Research Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-txt2">
            <a href="#features" className="hover:text-sage transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-sage transition-colors">How it works</a>
            <a href="#about" className="hover:text-sage transition-colors">Tech Stack</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('research')}
                  className="btn-ghost py-1.5 px-3 text-xs gap-1.5 border border-bdr hover:bg-sur2/40"
                >
                  Go to Console <ArrowRight size={13}/>
                </button>
                <button
                  onClick={logout}
                  className="text-xs text-txt3 hover:text-txt2 transition-colors font-semibold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('auth')}
                  className="text-xs text-txt2 hover:text-txt transition-colors font-semibold px-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('auth')}
                  className="btn-primary py-1.5 px-4 text-xs gap-1.5 shadow-sm"
                >
                  Start Free <ArrowRight size={13}/>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 max-w-7xl mx-auto px-6 flex flex-col items-center text-center relative">
        {/* Glow Effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-sage/5 blur-[120px] rounded-full -z-10 pointer-events-none"/>
        <div className="absolute top-20 left-1/3 w-[300px] h-[200px] bg-lav/5 blur-[100px] rounded-full -z-10 pointer-events-none"/>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-sage/10 border border-sage/20 px-3.5 py-1.5 rounded-full text-xs text-txt font-semibold tracking-wide mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"/>
          Multi-Agent Research Swarm v3.0 is Live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-4xl sm:text-6xl md:text-7xl text-txt max-w-4xl tracking-tight leading-[1.05]"
        >
          Supercharge your intelligence with a parallel swarm of AI agents
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-txt2 text-sm sm:text-base md:text-lg max-w-2xl mt-6 leading-relaxed"
        >
          Enter any topic and watch 4 highly specialized AI agents collaborate in real-time. We search the web, scrape deep content, draft structured technical reports, and run rigorous double-agent critique loops.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-10"
        >
          <button
            onClick={() => onNavigate(user ? 'research' : 'auth')}
            className="btn-primary py-3 px-6 text-sm gap-2 shadow-sm font-semibold hover:scale-[1.01] transition-transform"
          >
            Launch Research Console <ArrowRight size={16}/>
          </button>
          <a
            href="#pipeline"
            className="btn-ghost py-3 px-6 text-sm gap-2 border border-bdr hover:bg-sur2/40 font-semibold"
          >
            <PlayIcon size={14} className="fill-current"/> Watch How it Works
          </a>
        </motion.div>
      </section>

      {/* ── Pipeline Showcase Section ───────────────────────────────────── */}
      <section id="pipeline" className="py-20 bg-sur/30 border-y border-bdr relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-txt">Meet the Agent Swarm</h2>
            <p className="text-txt2 text-xs uppercase tracking-widest font-bold mt-2">Continuous Collaborative Chain</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Agent 1 */}
            <div className="card p-6 flex flex-col h-full hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center text-sage mb-5">
                <SearchIcon size={18}/>
              </div>
              <h3 className="font-serif text-xl text-txt mb-2">1. Web Search Agent</h3>
              <p className="text-txt2 text-xs leading-relaxed flex-grow">
                Queries the live web using Tavily API. Extracts multi-perspective search listings, news, and academic papers simultaneously.
              </p>
              <div className="mt-4 pt-3 border-t border-bdr flex items-center justify-between text-[10px] text-txt3 font-semibold uppercase tracking-wider">
                <span>Core Tool</span>
                <span className="text-sage">Tavily Engine</span>
              </div>
            </div>

            {/* Agent 2 */}
            <div className="card p-6 flex flex-col h-full hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky/10 border border-sky/20 flex items-center justify-center text-sky mb-5">
                <ArrowRight size={18} className="rotate-45"/>
              </div>
              <h3 className="font-serif text-xl text-txt mb-2">2. Deep Scrape Agent</h3>
              <p className="text-txt2 text-xs leading-relaxed flex-grow">
                Bypasses surface metrics. Deeply parses text from top-ranked URLs to isolate facts, dates, and empirical metrics.
              </p>
              <div className="mt-4 pt-3 border-t border-bdr flex items-center justify-between text-[10px] text-txt3 font-semibold uppercase tracking-wider">
                <span>Core Tool</span>
                <span className="text-sky">Jina Scraper</span>
              </div>
            </div>

            {/* Agent 3 */}
            <div className="card p-6 flex flex-col h-full hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-lav/10 border border-lav/20 flex items-center justify-center text-lav mb-5">
                <FileTextIcon size={18}/>
              </div>
              <h3 className="font-serif text-xl text-txt mb-2">3. AI Research Writer</h3>
              <p className="text-txt2 text-xs leading-relaxed flex-grow">
                Synthesizes raw inputs into structured, print-ready Markdown reports with inline citations, timelines, and summaries.
              </p>
              <div className="mt-4 pt-3 border-t border-bdr flex items-center justify-between text-[10px] text-txt3 font-semibold uppercase tracking-wider">
                <span>Core Tool</span>
                <span className="text-lav">Llama 3 70B</span>
              </div>
            </div>

            {/* Agent 4 */}
            <div className="card p-6 flex flex-col h-full hover:border-sage/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose/15 border border-rose/25 flex items-center justify-center text-rose mb-5">
                <ShieldAlertIcon size={18}/>
              </div>
              <h3 className="font-serif text-xl text-txt mb-2">4. Quality Critic Agent</h3>
              <p className="text-txt2 text-xs leading-relaxed flex-grow">
                Rigorously reviews drafts for literature gaps, inaccuracies, and structural weaknesses, offering strict refinement suggestions.
              </p>
              <div className="mt-4 pt-3 border-t border-bdr flex items-center justify-between text-[10px] text-txt3 font-semibold uppercase tracking-wider">
                <span>Core Tool</span>
                <span className="text-rose">Double-Loop Critic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features Grid ───────────────────────────────────────────── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1">
            <p className="text-[10px] uppercase tracking-widest text-sage font-bold">Uncompromising Quality</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-txt mt-2">Why multi-agent systems win</h2>
            <p className="text-txt2 text-sm leading-relaxed mt-4">
              Single prompt LLMs tend to generalize, hallucinate, and overlook details. By splitting the task into specialized agents, each loop focuses on a single strict operational standard.
            </p>
            <button
              onClick={() => onNavigate('auth')}
              className="btn-primary mt-6 py-2 px-5 text-xs gap-1.5 shadow-sm"
            >
              Get Started Now <ArrowRight size={13}/>
            </button>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-sur border border-bdr p-6 rounded-xl">
              <CheckCircleIcon size={18} className="text-sage mb-4" />
              <h4 className="font-serif text-lg text-txt mb-2">Supabase Sync</h4>
              <p className="text-txt2 text-xs leading-relaxed">
                Connect your database and automatically sync search history. Complete with RLS policies ensuring secure individual queries.
              </p>
            </div>

            <div className="bg-sur border border-bdr p-6 rounded-xl">
              <CheckCircleIcon size={18} className="text-sage mb-4" />
              <h4 className="font-serif text-lg text-txt mb-2">Real-Time Event Streams</h4>
              <p className="text-txt2 text-xs leading-relaxed">
                Never wait blindly. Watch the pipeline update character-by-character as search logs and reports are assembled live.
              </p>
            </div>

            <div className="bg-sur border border-bdr p-6 rounded-xl">
              <CheckCircleIcon size={18} className="text-sage mb-4" />
              <h4 className="font-serif text-lg text-txt mb-2">Print-Ready Exports</h4>
              <p className="text-txt2 text-xs leading-relaxed">
                Export compiled reports directly to Markdown, HTML, or PDFs for business papers, reviews, and quick sharing.
              </p>
            </div>

            <div className="bg-sur border border-bdr p-6 rounded-xl">
              <CheckCircleIcon size={18} className="text-sage mb-4" />
              <h4 className="font-serif text-lg text-txt mb-2">Offline Local Mode</h4>
              <p className="text-txt2 text-xs leading-relaxed">
                No database? No problem. Slide straight into the local developer sandbox using localStorage for instant testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer id="about" className="border-t border-bdr bg-sur/20 py-12 text-center text-txt3 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sage/10 border border-sage/20 flex items-center justify-center text-sage">
              <LayersIcon size={16}/>
            </div>
            <span className="font-serif text-txt text-base">MultiAgent Research System</span>
          </div>

          <p>© 2026 MultiAgent Research System. All rights reserved. Powered by Llama 3 & Tavily.</p>
        </div>
      </footer>
    </div>
  );
}

import { LayersIcon, ArrowRight } from 'lucide-react';

interface Props {
  user: any;
  onNavigate: (page: 'home' | 'research' | 'auth') => void;
  logout: () => void;
  showLinks?: boolean;
}

export default function Navbar({ user, onNavigate, logout, showLinks = true }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-bdr">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 rounded-lg bg-sage/10 border border-sage/25 flex items-center justify-center text-sage flex-shrink-0">
            <LayersIcon size={20}/>
          </div>
          <div>
            <p className="font-serif text-lg text-txt leading-none">MultiAgent Research</p>
            <p className="text-xs uppercase tracking-widest text-txt3 mt-0.5">Research Intelligence</p>
          </div>
        </div>

        {showLinks && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-txt2">
            <a href="#features" className="hover:text-sage transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-sage transition-colors">How it works</a>
            <a href="#about" className="hover:text-sage transition-colors">Tech Stack</a>
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
                className="hidden sm:block text-xs text-txt3 hover:text-txt2 transition-colors font-semibold"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('auth')}
                className="hidden sm:block text-xs text-txt2 hover:text-txt transition-colors font-semibold px-2"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('auth')}
                className="btn-primary py-1.5 px-3 sm:px-4 text-xs gap-1 sm:gap-1.5 shadow-sm"
              >
                Start Free <ArrowRight size={13}/>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

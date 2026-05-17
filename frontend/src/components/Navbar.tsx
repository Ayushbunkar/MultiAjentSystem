import { useState } from 'react';
import { LayersIcon, ArrowRight, Menu, X } from 'lucide-react';

interface Props {
  user: any;
  onNavigate: (page: 'home' | 'research' | 'auth') => void;
  logout: () => void;
  showLinks?: boolean;
}

export default function Navbar({ user, onNavigate, logout, showLinks = true }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (page: 'home' | 'research' | 'auth') => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-bdr">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={() => handleNavigate('home')}>
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

        {/* Actions - Desktop */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <button
                onClick={() => handleNavigate('research')}
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
                onClick={() => handleNavigate('auth')}
                className="text-xs text-txt2 hover:text-txt transition-colors font-semibold px-2"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavigate('auth')}
                className="btn-primary py-1.5 px-4 text-xs gap-1.5 shadow-sm"
              >
                Start Free <ArrowRight size={13}/>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={() => handleNavigate('research')}
              className="btn-ghost py-1 px-2.5 text-[11px] gap-1 border border-bdr hover:bg-sur2/40 mr-1"
            >
              Console <ArrowRight size={11}/>
            </button>
          )}
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-txt2 hover:text-txt transition-colors rounded-lg bg-sage/5 border border-bdr"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer/Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-bdr bg-bg absolute top-16 left-0 right-0 py-6 px-6 shadow-xl flex flex-col gap-6 z-[100]">
          {showLinks && (
            <nav className="flex flex-col gap-4 text-xs font-semibold uppercase tracking-widest text-txt2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-sage py-1.5 transition-colors border-b border-bdr/40">Features</a>
              <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="hover:text-sage py-1.5 transition-colors border-b border-bdr/40">How it works</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-sage py-1.5 transition-colors border-b border-bdr/40">Tech Stack</a>
            </nav>
          )}
          
          <div className="flex flex-col gap-3 pt-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNavigate('research')}
                  className="btn-primary w-full justify-center py-2.5 text-xs gap-1.5"
                >
                  Go to Console <ArrowRight size={13}/>
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="btn-ghost w-full justify-center py-2.5 text-xs text-rose hover:bg-rose/5"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('auth')}
                  className="btn-ghost w-full justify-center py-2.5 text-xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigate('auth')}
                  className="btn-primary w-full justify-center py-2.5 text-xs gap-1.5 shadow-sm"
                >
                  Start Free <ArrowRight size={13}/>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

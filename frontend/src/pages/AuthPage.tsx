import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib';
import { LayersIcon, AlertIcon } from '../icons';

type Props = {
  onLoginLocal: (email: string) => void;
};

export default function AuthPage({ onLoginLocal }: Props) {
  const [mode, setMode]       = useState<'login'|'signup'>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase not configured. Please use local mode.');
      return;
    }
    setBusy(true); setError('');
    const { error: err } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (err) { setError(err.message); setBusy(false); }
    else if (mode === 'signup') setDone(true);
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      onLoginLocal('local-google-user@domain.local');
      return;
    }
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6"
      style={{ backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(143,170,148,0.08), transparent 60%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="card p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center text-sage">
              <LayersIcon size={20}/>
            </div>
            <div>
              <p className="font-serif text-xl text-txt leading-tight">MultiAgent Research</p>
              <p className="text-xs uppercase tracking-widest text-txt3 mt-0.5">Research Intelligence</p>
            </div>
          </div>

          {!supabase ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h2 className="font-serif text-2xl text-txt">Local mode active</h2>
              <p className="text-txt2 text-sm leading-relaxed">
                Supabase database credentials are not configured in your <code className="bg-black/35 px-1 py-0.5 rounded text-xs border border-bdr">.env</code> file.
              </p>
              <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 text-sage text-xs rounded-lg px-3 py-2.5">
                <AlertIcon size={13}/>
                <span>History will be saved locally in localStorage.</span>
              </div>
              <button
                className="btn-primary w-full justify-center mt-2 py-3"
                onClick={() => onLoginLocal('local-developer@domain.local')}
              >
                Start in Local Mode
              </button>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="btn-ghost w-full justify-center gap-3 py-2.5 hover:bg-white/5 transition-all text-xs mt-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </motion.div>
          ) : done ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <h2 className="font-serif text-2xl text-txt mb-2">Check your inbox</h2>
              <p className="text-txt2 text-sm leading-relaxed">We sent a confirmation link to <strong className="text-txt">{email}</strong>. Click it to activate your account, then come back to sign in.</p>
              <button className="btn-ghost mt-6 w-full justify-center" onClick={()=>{ setMode('login'); setDone(false); }}>
                Back to sign in
              </button>
            </motion.div>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-txt mb-1">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-txt2 text-sm mb-7">
                {mode === 'login' ? 'Sign in to continue your research.' : 'Start your AI research journey.'}
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-rose/10 border border-rose/20 text-rose text-xs rounded-lg px-3 py-2.5 mb-5">
                  <AlertIcon size={13}/>{error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-txt3">Email</label>
                  <input className="input-base" type="email" placeholder="you@example.com"
                    value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-txt3">Password</label>
                  <input className="input-base" type="password" placeholder="••••••••"
                    value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}/>
                </div>
                <button className="btn-primary w-full justify-center mt-2" type="submit" disabled={busy}>
                  {busy
                    ? <><span className="w-3.5 h-3.5 border border-sage/30 border-t-sage rounded-full animate-spin"/>{mode==='login'?'Signing in…':'Creating account…'}</>
                    : mode==='login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-bdr"></div>
                </div>
                <span className="relative bg-sur px-3.5 text-[9px] uppercase tracking-widest text-txt3 font-bold">Or continue with</span>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={busy}
                className="btn-ghost w-full justify-center gap-3 py-2.5 hover:bg-white/5 transition-all text-xs"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                className="btn-ghost w-full justify-center mt-3 text-xs text-txt3 hover:text-txt2"
                onClick={() => onLoginLocal('local-developer@domain.local')}
              >
                Or continue in Local Mode
              </button>

              <div className="mt-6 pt-5 border-t border-bdr text-center">
                <p className="text-xs text-txt2">
                  {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
                  <button className="text-sage font-semibold underline underline-offset-2 hover:text-sage/80"
                    onClick={()=>{ setMode(mode==='login'?'signup':'login'); setError(''); }}>
                    {mode==='login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

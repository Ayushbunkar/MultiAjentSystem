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
            <div className="w-9 h-9 rounded-xl bg-sage/10 border border-sage/20 flex items-center justify-center text-sage">
              <LayersIcon size={18}/>
            </div>
            <div>
              <p className="font-serif text-base text-txt leading-tight">MultiAgent Research</p>
              <p className="text-[10px] uppercase tracking-widest text-txt3 mt-0.5">Research Intelligence</p>
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

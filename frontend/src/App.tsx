import './index.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks';
import AuthPage from './pages/AuthPage';
import ResearchPage from './pages/ResearchPage';

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center gap-3 text-txt3 text-sm">
      <span className="w-5 h-5 border-2 border-sage/20 border-t-sage rounded-full animate-spin"/>
      Loading…
    </div>
  );
}

export default function App() {
  const { user, loading, logout, loginLocal } = useAuth();

  if (loading) return <Loader/>;

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div key="auth"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.25 }}>
          <AuthPage onLoginLocal={loginLocal}/>
        </motion.div>
      ) : (
        <motion.div key="app"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.25 }}>
          <ResearchPage user={user} logout={logout}/>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import './index.css';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks';
import AuthPage from './pages/AuthPage';
import ResearchPage from './pages/ResearchPage';
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';

// Loader component
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
  const [page, setPage] = useState<'home' | 'research' | 'auth'>('home');

  // Automatically forward authenticated users to research console
  useEffect(() => {
    if (user && page === 'auth') {
      setPage('research');
    }
  }, [user, page]);

  if (loading) return <Loader/>;

  const handleLoginLocal = (email: string) => {
    loginLocal(email);
    setPage('research');
  };

  const handleLogout = () => {
    logout();
    setPage('home');
  };

  return (
    <>
      {page !== 'research' && (
        <Navbar user={user} onNavigate={setPage} logout={handleLogout} showLinks={page === 'home'} />
      )}
      <AnimatePresence mode="wait">
        {page === 'home' ? (
          <motion.div key="home"
            className="min-h-screen bg-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LandingPage user={user} onNavigate={setPage} logout={handleLogout} />
          </motion.div>
        ) : page === 'auth' && !user ? (
          <motion.div key="auth"
            className="min-h-screen bg-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AuthPage onLoginLocal={handleLoginLocal} />
          </motion.div>
        ) : (
          <motion.div key="app"
            className="min-h-screen bg-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ResearchPage user={user!} logout={handleLogout} onNavigate={setPage} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

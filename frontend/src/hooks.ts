import { useState, useEffect, useCallback } from 'react';
import { supabase, type HistoryItem } from './lib';
import type { User, Session } from '@supabase/supabase-js';

// ── Auth hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local session
    const localSession = localStorage.getItem('local_research_session');
    if (localSession) {
      try {
        setUser(JSON.parse(localSession));
        setLoading(false);
        return;
      } catch (e) {}
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null }}) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_: string, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const loginLocal = useCallback((email: string) => {
    const dummyUser: any = {
      id: 'local_user_' + Math.random().toString(36).substring(2, 9),
      email: email || 'local-developer@domain.local',
      role: 'authenticated'
    };
    localStorage.setItem('local_research_session', JSON.stringify(dummyUser));
    setUser(dummyUser);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('local_research_session');
    setUser(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  return { user, loading, logout, loginLocal };
}

// ── History hook ───────────────────────────────────────────────────────────────
export function useHistory(userId: string | null) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoadingHistory(true);

    if (!supabase) {
      try {
        const stored = localStorage.getItem(`search_history_${userId}`);
        if (stored) {
          setHistory(JSON.parse(stored));
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.error('Failed to load local history:', e);
      }
      setLoadingHistory(false);
      return;
    }

    const { data } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);
    if (data) setHistory(data);
    setLoadingHistory(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addHistory = useCallback(async (item: Omit<HistoryItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;

    if (!supabase) {
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        user_id: userId,
        created_at: new Date().toISOString(),
        ...item
      };
      setHistory(p => {
        const updated = [newItem, ...p];
        localStorage.setItem(`search_history_${userId}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const { data } = await supabase
      .from('search_history')
      .insert({ ...item, user_id: userId })
      .select()
      .single();
    if (data) setHistory(p => [data, ...p]);
  }, [userId]);

  const removeHistory = useCallback(async (id: string) => {
    if (!userId) return;

    if (!supabase) {
      setHistory(p => {
        const updated = p.filter(h => h.id !== id);
        localStorage.setItem(`search_history_${userId}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    await supabase.from('search_history').delete().eq('id', id);
    setHistory(p => p.filter(h => h.id !== id));
  }, [userId]);

  return { history, loadingHistory, addHistory, removeHistory, reloadHistory: load };
}

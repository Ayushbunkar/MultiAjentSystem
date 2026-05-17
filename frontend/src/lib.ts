import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const initSupabase = () => {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL.startsWith('http')) {
    return null;
  }
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('Supabase client failed to initialize:', e);
    return null;
  }
};

export const supabase = initSupabase();

export type HistoryItem = {
  id:              string;
  user_id:         string;
  topic:           string;
  search_results:  string;
  scraped_content: string;
  report:          string;
  feedback:        string;
  created_at:      string;
};

export type TabKey = 'search' | 'scrape' | 'report' | 'feedback';
export type StepStatus = 'idle' | 'processing' | 'complete' | 'error';
export type Results = Record<TabKey, string>;
export type Statuses = Record<TabKey, StepStatus>;

export const TABS: TabKey[] = ['search', 'scrape', 'report', 'feedback'];

export const TAB_META: Record<TabKey, { label: string; title: string }> = {
  search:   { label: 'Web Search',    title: 'Search Results'  },
  scrape:   { label: 'Deep Scrape',   title: 'Scraped Content' },
  report:   { label: 'AI Report',     title: 'Research Report' },
  feedback: { label: 'Critic Review', title: 'Quality Critique'},
};

export const API = '';

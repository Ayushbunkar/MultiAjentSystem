-- Multi-Agent Research System
-- PostgreSQL Schema Setup for Supabase
-- Place this in the Supabase SQL Editor and run it to initialize your database!

-- 1. Create the search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    search_results TEXT NOT NULL,
    scraped_content TEXT NOT NULL,
    report TEXT NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy A: Allow users to view only their own search history
CREATE POLICY "Allow users to select their own history" 
ON public.search_history 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy B: Allow users to insert their own search history
CREATE POLICY "Allow users to insert their own history" 
ON public.search_history 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy C: Allow users to delete their own search history
CREATE POLICY "Allow users to delete their own history" 
ON public.search_history 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Create indexes for maximum performance and fast retrieval
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- 5. Enable real-time replication for this table (optional, but great for dynamic state sync)
alter publication supabase_realtime add table public.search_history;

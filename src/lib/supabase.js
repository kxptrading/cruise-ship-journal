// ─────────────────────────────────────────────────────────────────────────────
// lib/supabase.js — Supabase client singleton
//
// Initialises one shared Supabase client for the entire app using the project
// URL and anon key from environment variables. Import `supabase` from here
// wherever you need to query the database, manage auth, or upload files.
//
// The anon key is safe to expose in the browser — it is not a secret. Row
// Level Security (RLS) policies on each table enforce what data a user can
// actually read or write.
//
// Environment variables are set in .env.local for local development and in
// the Vercel project settings for production. Both must be prefixed VITE_
// so Vite includes them in the browser bundle.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail fast in development if the env vars are missing, so the error is
// obvious rather than producing cryptic network failures later.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
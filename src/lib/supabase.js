import { createClient } from '@supabase/supabase-js'

// These values come from your Supabase project settings
// They are set as environment variables in Vercel (see setup guide)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

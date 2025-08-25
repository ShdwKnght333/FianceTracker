import { createClient } from '@supabase/supabase-js';

// Expect these to be defined in your Expo public env (app.config.js or .env for expo)
// EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL='https://zvgdozooibldlxogqfnv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2Z2Rvem9vaWJsZGx4b2dxZm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDUwNjksImV4cCI6MjA3MTQyMTA2OX0.sZBOzjIqZDUqpWQeKBDYR1-52QYw5QrIOaBr7QMkYQU'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Environment variables EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set.');
}

export const supabase = createClient(
  SUPABASE_URL ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY ?? 'public-anon-key-placeholder'
);

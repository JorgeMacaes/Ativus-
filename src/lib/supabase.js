import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const backendConfigured = Boolean(url && anonKey);

// The anon/publishable key is intended for client use only when Row Level
// Security (RLS) is enabled and correctly configured on every exposed table.
// Never place a Supabase service-role key in a browser or mobile app.
export const supabase = backendConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getBackendStatus() {
  return backendConfigured
    ? { configured: true, message: 'Backend configurado; autenticação e políticas ainda têm de ser testadas.' }
    : { configured: false, message: 'Backend ainda não configurado. A aplicação permanece em modo de demonstração local.' };
}

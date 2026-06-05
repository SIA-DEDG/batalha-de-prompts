import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas. Configure as variáveis de ambiente na Vercel.');
}

export const supabase = createClient(url ?? '', key ?? '');

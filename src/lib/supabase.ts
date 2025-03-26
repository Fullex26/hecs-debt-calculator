import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const explicitEnv = import.meta.env.VITE_ENV;

// Improved environment detection logic
const environment = explicitEnv || 
  (window.location.hostname.includes('vercel.app') && !window.location.hostname.includes('-preview') ? 
  'production' : 'development');

// Add debugging information to the console
console.log(`Environment Detection:`);
console.log(`- Hostname: ${window.location.hostname}`);
console.log(`- Explicit VITE_ENV: ${explicitEnv || '(not set)'}`);
console.log(`- Detected environment: ${environment}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`Environment variables missing for ${environment} environment`);
  console.error(`VITE_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
  console.error(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}`);
  throw new Error(`Missing Supabase environment variables for ${environment} environment`);
}

console.log(`Using Supabase in ${environment} environment with URL: ${supabaseUrl.substring(0, 30)}...`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CalculatorInput {
  id?: string;
  created_at?: string;
  current_debt: number;
  annual_income: number;
  expected_salary_increase: number;
  voluntary_payment_year?: number | null;
  voluntary_payment_amount?: number | null;
  apply_one_off_cut?: boolean;
  years_to_repay: number;
  total_interest: number;
  total_repayments: number;
} 
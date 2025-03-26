import { createClient } from '@supabase/supabase-js';

// Get environment from Vite or detect it based on hostname
const explicitEnv = import.meta.env.VITE_ENV;
const environment = explicitEnv || 
  (window.location.hostname.includes('vercel.app') && !window.location.hostname.includes('-preview') ? 
  'production' : 'development');

// Add debugging information to the console
console.log(`Environment Detection:`);
console.log(`- Hostname: ${window.location.hostname}`);
console.log(`- Explicit VITE_ENV: ${explicitEnv || '(not set)'}`);
console.log(`- Detected environment: ${environment}`);

// Get environment variables based on detected environment
// Try Vercel's environment-prefixed variables first, then fall back to Vite variables for local development
let supabaseUrl: string;
let supabaseAnonKey: string;

if (environment === 'production') {
  // For production, use PRODUCTION_* variables from Vercel or fallback to VITE_* variables
  supabaseUrl = import.meta.env.PRODUCTION_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.PRODUCTION_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
} else {
  // For development, use DEVELOPMENT_* variables from Vercel or fallback to VITE_* variables
  supabaseUrl = import.meta.env.DEVELOPMENT_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.DEVELOPMENT_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
}

// Validate environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`Environment variables missing for ${environment} environment`);
  
  if (environment === 'production') {
    console.error(`PRODUCTION_SUPABASE_URL or VITE_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    console.error(`PRODUCTION_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}`);
  } else {
    console.error(`DEVELOPMENT_SUPABASE_URL or VITE_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    console.error(`DEVELOPMENT_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'Missing'}`);
  }
  
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
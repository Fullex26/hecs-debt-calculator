import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const environment = import.meta.env.VITE_ENV || 'development';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables for ${environment} environment`);
}

console.log(`Using Supabase in ${environment} environment`);

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
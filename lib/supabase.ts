import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with full access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Plan quotas
export const PLAN_QUOTAS: Record<string, number> = {
  free: 3,
  pro: 100,
  business: 500,
};

export const PLAN_PRICES: Record<string, { monthly: number; label: string }> = {
  free: { monthly: 0, label: 'Free' },
  pro: { monthly: 9, label: 'Pro' },
  business: { monthly: 29, label: 'Business' },
};

// Get or create user
export async function getOrCreateUser(email: string, name?: string, image?: string) {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabaseAdmin
    .from('users')
    .insert({ email, name, image, plan: 'free' })
    .select()
    .single();

  if (error) throw error;
  return created;
}

// Get current month usage
export async function getMonthlyUsage(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  return count || 0;
}

// Check if user can process image
export async function canProcess(userId: string, plan: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const used = await getMonthlyUsage(userId);
  const limit = PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;
  return { allowed: used < limit, used, limit };
}

// Record usage
export async function recordUsage(userId: string) {
  const { error } = await supabaseAdmin
    .from('usage_records')
    .insert({ user_id: userId });
  if (error) throw error;
}

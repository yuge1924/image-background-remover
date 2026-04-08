import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getOrCreateUser, getMonthlyUsage, PLAN_QUOTAS, PLAN_PRICES } from '@/lib/supabase';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/');

  try {
    const user = await getOrCreateUser(
      session.user.email,
      session.user.name ?? undefined,
      session.user.image ?? undefined
    );
    
    // 防御性编程：如果 user 为空，强制跳转
    if (!user) redirect('/');

    const used = await getMonthlyUsage(user.id);
    const limit = PLAN_QUOTAS[user.plan] || 3;

    return (
      <DashboardClient
        user={{
          name: user.name || session.user.name || '',
          email: user.email,
          image: user.image || session.user.image || '',
          plan: user.plan || 'free', // 增加默认值
          createdAt: user.created_at,
        }}
        usage={{ used, limit }}
        planPrices={PLAN_PRICES}
      />
    );
  } catch (error: any) {
    console.error("Dashboard Error details:", error);
    return (
        <div style={{padding: '40px', fontFamily: 'sans-serif', lineHeight: '1.6'}}>
            <h2 style={{color: '#d32f2f'}}>Dashboard 无法加载</h2>
            <p><strong>错误信息:</strong> {error.message || JSON.stringify(error)}</p>
            <p>请联系管理员检查 Supabase 配置是否正确。</p>
        </div>
    );
  }
}

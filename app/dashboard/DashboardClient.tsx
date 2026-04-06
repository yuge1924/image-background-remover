'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Props {
  user: { name: string; email: string; image: string; plan: string; createdAt: string };
  usage: { used: number; limit: number };
  planPrices: Record<string, { monthly: number; label: string }>;
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['3 images/month', 'Standard quality', 'PNG download'],
  pro: ['100 images/month', 'High quality', 'PNG download', 'Priority processing'],
  business: ['500 images/month', 'Max quality', 'PNG download', 'API access', 'Priority support'],
};

export default function DashboardClient({ user, usage, planPrices }: Props) {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded');
  const cancelled = searchParams.get('cancelled');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const usagePct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const isNearLimit = usagePct >= 80;

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await fetch('/api/paypal/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Upgrade initiation failed');
        setUpgrading(null);
      }
    } catch {
      alert('Network error, please try again.');
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-indigo-600 rounded-xl text-white group-hover:scale-105 transition-transform">✂️</div>
            <span className="font-bold text-xl tracking-tight">BG Remover</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-slate-500 hover:text-indigo-600 font-medium px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {(upgraded || cancelled) && (
          <div className={`rounded-2xl p-4 text-center font-medium ${upgraded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {upgraded ? '🎉 Upgrade successful! Your plan has been activated.' : 'Checkout cancelled. You can upgrade anytime.'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center gap-6">
            <img src={user.image} alt="avatar" className="w-20 h-20 rounded-2xl ring-4 ring-slate-100 object-cover" />
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-slate-500 mb-2">{user.email}</p>
              <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-600">
                {planPrices[user.plan]?.label} Plan
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Usage</h2>
            <div className="text-4xl font-black mb-1">{usage.used}<span className="text-lg text-slate-400 font-normal"> / {usage.limit}</span></div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div className={`h-full rounded-full transition-all duration-1000 ${isNearLimit ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        </div>

        <section id="plans">
          <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(planPrices).map(([plan, info]) => {
              const isCurrent = user.plan === plan;
              return (
                <div key={plan} className={`rounded-3xl border p-7 transition-all ${isCurrent ? 'bg-indigo-900 text-white shadow-xl shadow-indigo-200' : 'bg-white'}`}>
                  <h3 className="text-xl font-bold mb-2">{info.label}</h3>
                  <div className="text-4xl font-black mb-6">{info.monthly === 0 ? 'Free' : `$${info.monthly}`}<span className="text-lg font-normal opacity-70">/mo</span></div>
                  <ul className="space-y-3 mb-8">
                    {PLAN_FEATURES[plan].map(f => <li key={f} className="flex items-center gap-2 text-sm opacity-90">✓ {f}</li>)}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrent || upgrading === plan}
                    className={`w-full font-bold py-3.5 rounded-2xl transition-all ${isCurrent ? 'bg-white/10' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {isCurrent ? 'Current Plan' : (upgrading === plan ? '...' : 'Select Plan')}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

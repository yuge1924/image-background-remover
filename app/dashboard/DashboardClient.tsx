'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

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
  const usagePct = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const isNearLimit = usagePct >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-bold text-gray-900">Background Remover</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          {user.image && (
            <img src={user.image} alt="avatar" className="w-16 h-16 rounded-full ring-2 ring-indigo-100" />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full
              ${user.plan === 'free' ? 'bg-gray-100 text-gray-600' :
                user.plan === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                'bg-amber-100 text-amber-700'}`}>
              {planPrices[user.plan]?.label || 'Free'} Plan
            </span>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">This Month&apos;s Usage</h2>
          <div className="flex items-end justify-between mb-3">
            <span className="text-3xl font-bold text-gray-900">{usage.used}</span>
            <span className="text-sm text-gray-400">/ {usage.limit} images</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {isNearLimit && (
            <p className="mt-2 text-sm text-red-500">⚠️ You&apos;re running low — consider upgrading</p>
          )}
          {usage.used === 0 && (
            <p className="mt-2 text-sm text-gray-400">No images processed this month yet.</p>
          )}
        </div>

        {/* Plan Cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(planPrices).map(([plan, info]) => {
              const isCurrent = user.plan === plan;
              const features = PLAN_FEATURES[plan] || [];
              return (
                <div key={plan} className={`rounded-2xl border p-5 transition-all
                  ${isCurrent ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-100 bg-white hover:border-indigo-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{info.label}</h3>
                    {isCurrent && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    {info.monthly === 0 ? 'Free' : `$${info.monthly}/mo`}
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {features.map(f => (
                      <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all text-sm">
                      Upgrade — Coming Soon
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Back to tool */}
        <div className="text-center">
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            ← Back to Background Remover
          </Link>
        </div>
      </div>
    </div>
  );
}

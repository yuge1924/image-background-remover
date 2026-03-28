'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

type Stage = 'upload' | 'preview' | 'loading' | 'result' | 'error';

const PLANS = [
  {
    key: 'free', label: 'Free', price: '$0', period: '/month',
    quota: '3 images/month', features: ['3 images per month', 'Standard quality', 'PNG download', 'No credit card required'],
    cta: 'Get Started', highlight: false,
  },
  {
    key: 'pro', label: 'Pro', price: '$9', period: '/month',
    quota: '100 images/month', features: ['100 images per month', 'High quality output', 'PNG download', 'Priority processing', 'Email support'],
    cta: 'Upgrade to Pro', highlight: true,
  },
  {
    key: 'business', label: 'Business', price: '$29', period: '/month',
    quota: '500 images/month', features: ['500 images per month', 'Max quality output', 'PNG download', 'API access', 'Priority support', 'Team sharing'],
    cta: 'Upgrade to Business', highlight: false,
  },
];

const FAQS = [
  { q: 'What is the free plan limit?', a: 'Free users can process 3 images per month. No credit card required to sign up.' },
  { q: 'What image formats are supported?', a: 'We support JPG, PNG, and WEBP formats up to 12MB per image.' },
  { q: 'Are my images stored?', a: 'No. Images are processed in memory and never stored on our servers. Your privacy is our priority.' },
  { q: 'How accurate is the background removal?', a: 'We use remove.bg\'s AI which achieves industry-leading accuracy, especially for portraits, products, and animals.' },
  { q: 'When will paid plans be available?', a: 'Paid plans (Pro & Business) are coming soon. Sign up now to get notified and receive early-bird pricing.' },
  { q: 'Can I get a refund?', a: 'Yes. We offer a 7-day money-back guarantee on all paid plans, no questions asked.' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setErrorMsg('Only JPG, PNG, WEBP formats are supported.');
      setStage('error'); return;
    }
    if (f.size > 12 * 1024 * 1024) {
      setErrorMsg('File size must be under 12MB.');
      setStage('error'); return;
    }
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setStage('preview');
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  };

  const removeBackground = async () => {
    if (!file) return;
    if (!session) { signIn('google'); return; }
    setStage('loading'); setErrorMsg('');
    const formData = new FormData();
    formData.append('image', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch('/api/remove-bg', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (err.code === 'QUOTA_EXCEEDED') {
          setErrorMsg(`Monthly quota reached (${err.used}/${err.limit}). Upgrade your plan to continue.`);
        } else {
          setErrorMsg(err.error || `HTTP ${res.status}`);
        }
        setStage('error'); return;
      }
      const blob = await res.blob();
      setResultBlob(blob); setResultUrl(URL.createObjectURL(blob)); setStage('result');
    } catch (err) {
      clearTimeout(timeout);
      setErrorMsg(err instanceof Error && err.name === 'AbortError' ? 'Request timed out. Please try again.' : 'Processing failed, please try again.');
      setStage('error');
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob); a.download = 'removed-bg.png'; a.click();
  };

  const reset = () => {
    setFile(null); setOriginalUrl(''); setResultBlob(null); setResultUrl(''); setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStage('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <span className="font-bold text-gray-900">Background Remover</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Dashboard
                </Link>
                <img src={session.user?.image || ''} alt="avatar" className="w-8 h-8 rounded-full" />
              </>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto w-full px-4 pt-14 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Remove Image Backgrounds<br />
          <span className="text-indigo-600">Instantly & Free</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          AI-powered background removal in seconds. No design skills needed. Free plan available — no credit card required.
        </p>

        {/* Tool */}
        <div className="max-w-3xl mx-auto">
          {stage === 'upload' && (
            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all select-none
                ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'}`}
            >
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-lg font-semibold text-gray-700">Drag & drop your image here</p>
              <p className="text-sm text-gray-400 mt-2">or click to select · JPG · PNG · WEBP · Max 12MB</p>
              {!session && <p className="text-xs text-indigo-400 mt-4">💡 Sign in required to download results</p>}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} className="hidden" />
            </div>
          )}

          {stage === 'preview' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex justify-center mb-6">
                <img src={originalUrl} alt="Original" className="max-h-72 rounded-xl object-contain shadow" />
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={removeBackground} className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-10 py-3 rounded-xl transition-all">
                  {session ? '✂️ Remove Background' : '🔐 Sign in & Remove'}
                </button>
                <button onClick={reset} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-all">Cancel</button>
              </div>
            </div>
          )}

          {stage === 'loading' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="text-6xl mb-5 animate-spin inline-block">⚙️</div>
              <p className="text-lg font-semibold text-gray-700">Removing background...</p>
              <p className="text-sm text-gray-400 mt-2">Usually takes 3–8 seconds</p>
              <div className="mt-6 w-48 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Original</p>
                  <div className="flex items-center justify-center min-h-48 bg-gray-50 rounded-xl overflow-hidden">
                    <img src={originalUrl} alt="Original" className="max-h-64 object-contain" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Background Removed</p>
                  <div className="flex items-center justify-center min-h-48 rounded-xl overflow-hidden"
                    style={{ backgroundImage: 'linear-gradient(45deg,#d1d5db 25%,transparent 25%),linear-gradient(-45deg,#d1d5db 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d1d5db 75%),linear-gradient(-45deg,transparent 75%,#d1d5db 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0', backgroundColor: '#f9fafb' }}>
                    <img src={resultUrl} alt="Result" className="max-h-64 object-contain" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={download} className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold px-10 py-3 rounded-xl transition-all">⬇️ Download PNG</button>
                <button onClick={reset} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-all">🔄 Try Another</button>
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-600 font-semibold text-lg">{errorMsg}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={reset} className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-8 py-2.5 rounded-xl transition-all">Try Again</button>
                {errorMsg.includes('quota') && (
                  <a href="#pricing" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-2.5 rounded-xl transition-all">View Plans</a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Instant Results', desc: 'AI processes your image in 3–8 seconds with industry-leading accuracy.' },
            { icon: '🔒', title: '100% Private', desc: 'Images are processed in memory and never stored on our servers.' },
            { icon: '🎯', title: 'High Accuracy', desc: 'Powered by remove.bg AI — perfect for portraits, products, and more.' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto w-full px-4 py-12">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">Simple, Transparent Pricing</h2>
        <p className="text-center text-gray-500 mb-10">Start free. Upgrade when you need more.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.key} className={`rounded-2xl border p-6 relative transition-all
              ${plan.highlight ? 'border-indigo-400 bg-indigo-600 text-white shadow-xl scale-105' : 'border-gray-100 bg-white shadow-sm'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.label}</h3>
              <div className={`text-4xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                {plan.price}<span className={`text-base font-normal ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>{plan.period}</span>
              </div>
              <p className={`text-sm mb-5 ${plan.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>{plan.quota}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className={`text-sm flex items-center gap-2 ${plan.highlight ? 'text-indigo-100' : 'text-gray-600'}`}>
                    <span className={plan.highlight ? 'text-indigo-200' : 'text-green-500'}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !session && signIn('google')}
                className={`w-full font-semibold py-3 rounded-xl transition-all text-sm
                  ${plan.highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                {plan.key === 'free' ? (session ? 'Current Plan' : 'Get Started Free') : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto w-full px-4 py-12">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-gray-800">{faq.q}</span>
                <span className={`text-indigo-500 text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-gray-500 border-t border-gray-50 pt-3">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 mt-auto">
        Powered by <a href="https://remove.bg" className="underline" target="_blank" rel="noreferrer">remove.bg</a>
        {' '}· Images processed in memory, never stored
        {session && (
          <> · <Link href="/dashboard" className="underline">My Dashboard</Link></>
        )}
      </footer>
    </div>
  );
}

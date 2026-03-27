'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

type Stage = 'upload' | 'preview' | 'loading' | 'result' | 'error';

export default function Home() {
  const { data: session, status } = useSession();
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 12;

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrorMsg('仅支持 JPG、PNG、WEBP 格式');
      setStage('error');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`文件大小不能超过 ${MAX_SIZE_MB}MB`);
      setStage('error');
      return;
    }
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setStage('preview');
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const removeBackground = async () => {
    if (!file) return;

    // 未登录则弹出登录
    if (!session) {
      signIn('google');
      return;
    }

    setStage('loading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('image', file);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setStage('result');
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMsg('请求超时，请重试');
      } else {
        setErrorMsg(err instanceof Error ? err.message : '处理失败，请重试');
      }
      setStage('error');
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    a.download = 'removed-bg.png';
    a.click();
  };

  const reset = () => {
    setFile(null);
    setOriginalUrl('');
    setResultBlob(null);
    setResultUrl('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStage('upload');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✂️</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Background Remover</h1>
              <p className="text-sm text-gray-500">免费在线去背景工具 · 图片不上传存储</p>
            </div>
          </div>

          {/* 登录区域 */}
          <div>
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm text-gray-700 hidden sm:block">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm transition-all hover:shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                用 Google 登录
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">

        {/* Upload Zone */}
        {stage === 'upload' && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-20 text-center cursor-pointer transition-all select-none
              ${isDragging
                ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
                : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
              }`}
          >
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-lg font-semibold text-gray-700">拖拽图片到这里，或点击上传</p>
            <p className="text-sm text-gray-400 mt-2">支持 JPG · PNG · WEBP · 最大 12MB</p>
            {!session && (
              <p className="text-xs text-indigo-400 mt-4">💡 点击「Remove Background」时需要 Google 登录</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Preview */}
        {stage === 'preview' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">原始图片</h2>
            <div className="flex justify-center mb-8">
              <img src={originalUrl} alt="Original" className="max-h-80 rounded-xl object-contain shadow" />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={removeBackground}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-10 py-3 rounded-xl transition-all"
              >
                {session ? '✂️ Remove Background' : '🔐 登录后去除背景'}
              </button>
              <button
                onClick={reset}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-all"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {stage === 'loading' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
            <div className="text-6xl mb-5 animate-spin inline-block">⚙️</div>
            <p className="text-lg font-semibold text-gray-700">正在去除背景...</p>
            <p className="text-sm text-gray-400 mt-2">通常需要 3–8 秒，请稍候</p>
            <div className="mt-6 w-48 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Result */}
        {stage === 'result' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">原始图片</h2>
                <div className="flex items-center justify-center min-h-48 bg-gray-50 rounded-xl overflow-hidden">
                  <img src={originalUrl} alt="Original" className="max-h-64 object-contain" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">去除背景</h2>
                <div
                  className="flex items-center justify-center min-h-48 rounded-xl overflow-hidden"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #d1d5db 25%, transparent 25%),
                      linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #d1d5db 75%),
                      linear-gradient(-45deg, transparent 75%, #d1d5db 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <img src={resultUrl} alt="Result" className="max-h-64 object-contain" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={download}
                className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold px-10 py-3 rounded-xl transition-all"
              >
                ⬇️ Download PNG
              </button>
              <button
                onClick={reset}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-all"
              >
                🔄 Try Another Image
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg">{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-5 bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-8 py-2.5 rounded-xl transition-all"
            >
              重新上传
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-5 border-t border-gray-100">
        Powered by{' '}
        <a href="https://remove.bg" className="underline" target="_blank" rel="noreferrer">remove.bg</a>
        {' '}· 图片仅在内存中处理，不存储，不记录
      </footer>
    </main>
  );
}

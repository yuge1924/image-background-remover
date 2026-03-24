'use client';

import { useState, useRef, useCallback } from 'react';

type Stage = 'upload' | 'preview' | 'loading' | 'result' | 'error';

export default function Home() {
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

  // Drag & drop handlers
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
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-3xl">✂️</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Background Remover</h1>
            <p className="text-sm text-gray-500">免费在线去背景工具 · 图片不上传存储</p>
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
              <img
                src={originalUrl}
                alt="Original"
                className="max-h-80 rounded-xl object-contain shadow"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={removeBackground}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-10 py-3 rounded-xl transition-all"
              >
                ✂️ Remove Background
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
              {/* Original */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">原始图片</h2>
                <div className="flex items-center justify-center min-h-48 bg-gray-50 rounded-xl overflow-hidden">
                  <img src={originalUrl} alt="Original" className="max-h-64 object-contain" />
                </div>
              </div>
              {/* Result with checkerboard */}
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
        <a href="https://remove.bg" className="underline" target="_blank" rel="noreferrer">
          remove.bg
        </a>{' '}
        · 图片仅在内存中处理，不存储，不记录
      </footer>
    </main>
  );
}

'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult('');
      setError('');
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process');
      }
      
      if (contentType && contentType.includes('image')) {
        const blob = await response.blob();
        setResult(URL.createObjectURL(blob));
      } else {
        throw new Error('Invalid response type');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Error processing image');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = 'removed-bg.png';
    a.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">Image Background Remover</h1>
        <p className="text-center text-gray-600 mb-8">Upload an image and remove its background instantly</p>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block w-full">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div className="text-gray-400 text-5xl mb-2">📁</div>
                <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </label>
          </div>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
          )}
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              Processing... This may take 10-15 seconds
            </div>
          )}
          {preview && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Original</h3>
                <img src={preview} alt="Original" className="w-full rounded-lg border" />
              </div>
              {result && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Result</h3>
                  <img src={result} alt="Result" className="w-full rounded-lg border" />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4">
            <button onClick={handleRemoveBackground} disabled={!selectedFile || loading} className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
              {loading ? 'Processing...' : 'Remove Background'}
            </button>
            {result && (
              <button onClick={handleDownload} className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition">Download</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

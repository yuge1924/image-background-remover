
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
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
                  <div className="relative">
                    <div className="absolute inset-0 bg-gray-200" style={{backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, #e5e7eb 0% 50%)', backgroundSize: '20px 20px'}}></div>
                    <img src={result} alt="Result" className="relative w-full rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleRemoveBackground}
              disabled={!selectedFile || loading}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Remove Background'}
            </button>
            {result && (
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

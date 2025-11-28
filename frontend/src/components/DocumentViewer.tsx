import { useState } from 'react';

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
}

export default function DocumentViewer({ fileUrl, fileName }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">Failed to load document preview</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      )}
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
        className="w-full border-0"
        style={{ minHeight: '600px', height: '80vh' }}
        title={fileName}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

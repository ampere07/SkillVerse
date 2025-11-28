import { useState } from 'react';
import { X } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

export default function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
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
        <p className="text-sm text-red-700">Failed to load PDF preview</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
        >
          Open PDF in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}
      <iframe
        src={`${fileUrl}#view=FitH`}
        className="w-full border-0"
        style={{ minHeight: '600px', height: '80vh' }}
        title={fileName}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

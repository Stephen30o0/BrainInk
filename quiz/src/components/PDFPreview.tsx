import React, { Component } from 'react';
import { Maximize2 } from 'lucide-react';
interface PDFPreviewProps {
  pdfUrl: string;
  title: string;
  onOpenFull: () => void;
}
const PDFPreview: React.FC<PDFPreviewProps> = ({
  pdfUrl,
  title,
  onOpenFull
}) => {
  // Using Mozilla's PDF viewer with the sample PDF
  const samplePdfUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(samplePdfUrl)}`;
  return <div className="bg-[#141b2d] rounded-lg border border-[#1a223a] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
        <h3 className="font-medium">{title}</h3>
        <button onClick={onOpenFull} className="p-2 hover:bg-[#1a223a] rounded-md transition-colors">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <div className="relative h-[400px] overflow-hidden">
        <iframe src={viewerUrl} className="w-full h-full border-0" title={`${title} Preview`} sandbox="allow-scripts allow-same-origin" />
      </div>
    </div>;
};
export default PDFPreview;
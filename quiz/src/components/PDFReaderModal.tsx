import React, { Component } from 'react';
import { X } from 'lucide-react';
interface PDFReaderModalProps {
  pdfUrl: string;
  onClose: () => void;
}
const PDFReaderModal: React.FC<PDFReaderModalProps> = ({
  pdfUrl,
  onClose
}) => {
  // Using Mozilla's PDF viewer with the sample PDF
  const samplePdfUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(samplePdfUrl)}`;
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-[#0a0e17] border border-[#1a223a] rounded-lg w-[90%] h-[90vh] flex flex-col m-auto">
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h3 className="font-medium">PDF Viewer</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#141b2d] rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe src={viewerUrl} className="w-full h-full border-0" title="PDF Document" sandbox="allow-scripts allow-same-origin" />
        </div>
      </div>
    </div>;
};
export default PDFReaderModal;
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import PDFReaderModal from './PDFReaderModal';
import QuizHistoryPanel from './QuizHistoryPanel';
interface ActiveChat {
  id: number;
  subject: string;
  title: string;
}
const Layout = () => {
  const [isPDFReaderOpen, setIsPDFReaderOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState('');
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const openPDFReader = (pdfUrl: string) => {
    setSelectedPDF(pdfUrl);
    setIsPDFReaderOpen(true);
  };
  const handleChatSelect = (chat: ActiveChat) => {
    setActiveChat(chat);
  };
  const handleNewChat = () => {
    setActiveChat(null);
  };
  return <div className="flex h-full w-full bg-[#0a0e17] text-white overflow-hidden">
      <Sidebar onChatSelect={handleChatSelect} activeChat={activeChat} />
      <ChatArea openPDFReader={openPDFReader} toggleHistoryPanel={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)} activeChat={activeChat} onChatSelect={handleChatSelect} />
      {isPDFReaderOpen && <PDFReaderModal pdfUrl={selectedPDF} onClose={() => setIsPDFReaderOpen(false)} />}
      <QuizHistoryPanel isOpen={isHistoryPanelOpen} onClose={() => setIsHistoryPanelOpen(false)} />
    </div>;
};
export default Layout;
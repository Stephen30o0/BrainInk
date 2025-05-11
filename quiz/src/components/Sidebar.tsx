import React, { useMemo, useState } from 'react';
import { Search, BookOpen, BarChart2, FileText, Settings, ChevronDown, ChevronRight, MessageSquare, Plus } from 'lucide-react';
import UserLevel from './UserLevel';
import ProgressStatsPanel from './ProgressStatsPanel';
import StudyMaterialsPanel from './StudyMaterialsPanel';
import SettingsPanel from './SettingsPanel';
import { useMessages } from '../lib/store'; // Fixed import path
interface SidebarProps {
  onChatSelect: (chat: {
    id: number;
    subject: string;
    title: string;
  }) => void;
  activeChat: {
    id: number;
    subject: string;
    title: string;
  } | null;
}
const Sidebar: React.FC<SidebarProps> = ({
  onChatSelect,
  activeChat
}) => {
  const {
    messages,
    getUniqueSubjects,
    getConversationsBySubject
  } = useMessages();
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProgressStatsOpen, setIsProgressStatsOpen] = useState(false);
  const [isStudyMaterialsOpen, setIsStudyMaterialsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Get all unique subjects and their conversations
  const subjectChats = useMemo(() => {
    const subjects = getUniqueSubjects();
    return subjects.map(subject => ({
      name: subject,
      conversations: getConversationsBySubject(subject)
    }));
  }, [getUniqueSubjects, getConversationsBySubject]);
  // Filter based on search
  const filteredSubjects = useMemo(() => {
    return subjectChats.map(subject => ({
      ...subject,
      conversations: subject.conversations.filter(conv => conv.title.toLowerCase().includes(searchTerm.toLowerCase()) || conv.lastMessage.content.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(subject => subject.conversations.length > 0 || subject.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [subjectChats, searchTerm]);
  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };
  return <div className="w-64 h-full border-r border-[#1a223a] flex flex-col">
      {/* Header section */}
      <div className="p-4 border-b border-[#1a223a]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">K</span>
          </div>
          <span className="font-bold text-blue-400">K.A.N.A.</span>
        </div>
        <UserLevel level={5} xp={350} maxXp={500} />
      </div>
      {/* New Chat button */}
      <div className="p-3 border-b border-[#1a223a]">
        <button onClick={() => onChatSelect({
        id: Date.now(),
        subject: 'General',
        title: 'New Chat'
      })} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium flex items-center justify-center">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </button>
      </div>
      {/* Search section */}
      <div className="p-3">
        <div className="relative">
          <input type="text" placeholder="Search conversations..." className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 pl-8 pr-3 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      {/* Subjects and chats */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-400 mb-2 px-2">
            SUBJECTS
          </div>
          {filteredSubjects.map(subject => <div key={subject.name} className="mb-1">
              <div className="flex items-center justify-between px-2 py-1.5 hover:bg-[#141b2d] rounded cursor-pointer" onClick={() => toggleSubject(subject.name)}>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm">{subject.name}</span>
                </div>
                {expandedSubjects.includes(subject.name) ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </div>
              {expandedSubjects.includes(subject.name) && <div className="ml-2">
                  {subject.conversations.map(chat => <div key={chat.id} onClick={() => onChatSelect({
              id: parseInt(chat.id),
              subject: subject.name,
              title: chat.title
            })} className={`flex items-center px-4 py-1.5 hover:bg-[#141b2d] rounded cursor-pointer ${activeChat?.id === parseInt(chat.id) ? 'bg-[#141b2d] border-l-2 border-blue-500' : ''}`}>
                      <MessageSquare className="h-3 w-3 mr-2 text-gray-400" />
                      <div className="truncate">
                        <div className="text-sm truncate">{chat.title}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {chat.lastMessage.content.toString()}
                        </div>
                      </div>
                    </div>)}
                </div>}
            </div>)}
        </div>
      </div>
      {/* Footer actions */}
      <div className="p-3 border-t border-[#1a223a]">
        <div className="flex items-center justify-between py-2 px-2 hover:bg-[#141b2d] rounded cursor-pointer" onClick={() => setIsProgressStatsOpen(true)}>
          <div className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-sm">Progress Stats</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-2 px-2 hover:bg-[#141b2d] rounded cursor-pointer" onClick={() => setIsStudyMaterialsOpen(true)}>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-sm">Study Materials</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-2 px-2 hover:bg-[#141b2d] rounded cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2 text-blue-400" />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </div>
      {/* Panels */}
      <ProgressStatsPanel isOpen={isProgressStatsOpen} onClose={() => setIsProgressStatsOpen(false)} />
      <StudyMaterialsPanel isOpen={isStudyMaterialsOpen} onClose={() => setIsStudyMaterialsOpen(false)} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>;
};
export default Sidebar;
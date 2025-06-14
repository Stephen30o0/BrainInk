import React, { useEffect, useState, useRef } from 'react';
import { Search, Phone, Video, Image as ImageIcon, Smile, Send, Heart, MoreHorizontal, X, Camera } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { SuperEnhancedMessagingHub } from '../../../messages/components/SuperEnhancedMessagingHub';

// Define types locally since import is causing issues
interface User {
  id: number;
  username: string;
  fname: string;
  lname: string;
  avatar: string;
  email?: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
  read_at?: string;
  sender_info?: User;
  isMe?: boolean;
  timestamp?: string;
}

interface Chat {
  id: string;
  user: User;
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
}

interface ConversationResponse {
  messages: Message[];
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export const MessagesPanel = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[90vh] bg-dark border border-primary/20 rounded-lg overflow-hidden">
        <div className="h-full relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
          <SuperEnhancedMessagingHub />
        </div>
      </div>
    </div>
  );
};
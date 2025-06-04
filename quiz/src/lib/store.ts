import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Quiz, QuizAttempt, PastPaper } from './types';
// Local storage keys
const MESSAGES_STORAGE_KEY = 'kana-messages';
const CONVERSATIONS_STORAGE_KEY = 'kana-conversations';
const SUBJECT_MESSAGES_KEY = 'kana-subject-messages';
const QUIZ_ATTEMPTS_STORAGE_KEY = 'kana-quiz-attempts';
const XP_STORAGE_KEY = 'kana-xp';
// Helper for localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};
const setToStorage = <T,>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
// Messages store with subject support
export interface MessageWithSubject extends Message {
  subject?: string;
  conversationId?: string;
  content: string | React.ReactNode | any;
  type: 'text' | 'quiz-start' | 'quiz-question' | 'quiz-result' | 'past-paper' | 'pdf';
  title?: string;
}
export const useMessages = () => {
  const [messages, setMessages] = useState<MessageWithSubject[]>(() => getFromStorage(MESSAGES_STORAGE_KEY, []));
  const [subjectMessages, setSubjectMessages] = useState<Record<string, MessageWithSubject[]>>(() => getFromStorage(SUBJECT_MESSAGES_KEY, {}));
  useEffect(() => {
    setToStorage(MESSAGES_STORAGE_KEY, messages);
  }, [messages]);
  useEffect(() => {
    setToStorage(SUBJECT_MESSAGES_KEY, subjectMessages);
  }, [subjectMessages]);
  // Add a message with subject tagging
  const addMessage = useCallback((message: MessageWithSubject) => {
    const currentSubject = message.subject || 'General';
    const messageWithDefaults: MessageWithSubject = {
      ...message,
      conversationId: message.conversationId || uuidv4(),
      timestamp: message.timestamp || Date.now(),
      subject: currentSubject,
      title: message.title || (typeof message.content === 'string' ? message.content.slice(0, 50) + '...' : 'New Chat')
    };
    setMessages(prev => [...prev, messageWithDefaults]);
    // Update subject messages
    setSubjectMessages(prev => {
      const existingMessages = prev[currentSubject] || [];
      return {
        ...prev,
        [currentSubject]: [...existingMessages, messageWithDefaults]
      };
    });
  }, []);
  // Add clearCurrentChat function
  const clearCurrentChat = useCallback(() => {
    // We don't actually clear the messages, we just start a new conversation
    return uuidv4();
  }, []);
  // Add a function to add a past paper to history
  const addPastPaper = useCallback((paper: any, subject: string) => {
    const message: MessageWithSubject = {
      id: paper.id,
      sender: 'kana',
      content: paper,
      timestamp: Date.now(),
      type: 'past-paper',
      subject,
      conversationId: uuidv4()
    };
    setMessages(prev => [...prev, message]);
    // Update subject messages
    setSubjectMessages(prev => {
      const existingMessages = prev[subject] || [];
      return {
        ...prev,
        [subject]: [...existingMessages, message]
      };
    });
  }, []);
  // Get messages for a specific conversation
  const getConversationMessages = useCallback((conversationId: string) => {
    return messages.filter(msg => msg.conversationId === conversationId);
  }, [messages]);
  // Get all conversations for a subject
  const getSubjectConversations = useCallback((subject: string) => {
    const subjectMsgs = subjectMessages[subject] || [];
    const conversations = new Map<string, MessageWithSubject[]>();
    subjectMsgs.forEach(msg => {
      if (msg.conversationId) {
        const existing = conversations.get(msg.conversationId) || [];
        conversations.set(msg.conversationId, [...existing, msg]);
      }
    });
    return Array.from(conversations.values());
  }, [subjectMessages]);
  // Add a function to get all unique subjects
  const getUniqueSubjects = useCallback(() => {
    const subjects = new Set<string>();
    messages.forEach(message => {
      if (message.subject) {
        subjects.add(message.subject);
      }
    });
    return Array.from(subjects);
  }, [messages]);
  // Add a function to get conversations by subject
  const getConversationsBySubject = useCallback((subject: string) => {
    const conversations = new Map<string, MessageWithSubject[]>();
    messages.forEach(message => {
      if (message.subject === subject && message.conversationId) {
        const existing = conversations.get(message.conversationId) || [];
        conversations.set(message.conversationId, [...existing, message]);
      }
    });
    return Array.from(conversations.values()).map(msgs => ({
      id: msgs[0].conversationId!,
      title: msgs[0].title || msgs[0].content.toString().slice(0, 50) + '...',
      messages: msgs,
      lastMessage: msgs[msgs.length - 1],
      timestamp: msgs[msgs.length - 1].timestamp,
      subject: msgs[0].subject
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);
  return {
    messages,
    setMessages,
    addMessage,
    addPastPaper,
    getMessagesForSubject: useCallback((subject: string) => subjectMessages[subject] || [], [subjectMessages]),
    getConversationMessages,
    getUniqueSubjects,
    getConversationsBySubject,
    subjectMessages
  };
};
// Quiz attempts store
export const useQuizAttempts = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => getFromStorage(QUIZ_ATTEMPTS_STORAGE_KEY, []));
  useEffect(() => {
    setToStorage(QUIZ_ATTEMPTS_STORAGE_KEY, attempts);
  }, [attempts]);
  return {
    attempts,
    setAttempts
  };
};
// XP and level store
export const useXP = () => {
  const [xp, setXp] = useState(() => getFromStorage(XP_STORAGE_KEY, 0));
  const [level, setLevel] = useState(1);
  const [maxXp, setMaxXp] = useState(100);
  useEffect(() => {
    // Calculate level based on XP
    const newLevel = Math.floor(xp / 100) + 1;
    setLevel(newLevel);
    setMaxXp(newLevel * 100);
    setToStorage(XP_STORAGE_KEY, xp);
  }, [xp]);
  return {
    xp,
    setXp,
    level,
    maxXp
  };
};
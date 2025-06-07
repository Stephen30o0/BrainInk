import React, { useEffect, useMemo, useState, useRef, isValidElement } from 'react';
import { Send, Mic, Search, X, File, BarChart2, BookOpen } from 'lucide-react';
import { useMessages, useXP, useQuizAttempts, MessageWithSubject } from '../lib/store';
import { v4 as uuidv4 } from 'uuid';
import MessageAnimation from './MessageAnimation';
import { useTimer } from '../lib/hooks/useTimer';
import quizzes from './data/QuizData';
import pastPapers from './data/PastPaperData';
import QuizSelectionModal from './QuizSelectionModal';
import { Quiz, QuizQuestion, QuizAttempt } from '../lib/types';
import { useQuiz } from '../lib/hooks/useQuiz';
import QuizSession from './quiz/QuizSession';
import QuizReview from './quiz/QuizReview';
import PDFPreview from './PDFPreview';
interface ChatAreaProps {
  openPDFReader: (pdfUrl: string) => void;
  toggleHistoryPanel: () => void;
  activeChat: {
    id: number;
    subject: string;
    title: string;
  } | null;
  onChatSelect: (chat: {
    id: number;
    subject: string;
    title: string;
  }) => void;
}
const ChatArea: React.FC<ChatAreaProps> = ({
  openPDFReader,
  toggleHistoryPanel,
  activeChat,
  onChatSelect
}) => {
  const {
    messages,
    addMessage,
    setMessages
  } = useMessages();
  const {
    setXp
  } = useXP();
  const {
    setAttempts
  } = useQuizAttempts();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [showingExplanation, setShowingExplanation] = useState<string | null>(null);
  const [isKanaTyping, setIsKanaTyping] = useState<boolean>(false);
  const [typingKanaMessage, setTypingKanaMessage] = useState<{ id: string; fullText: string; currentIndex: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activePdfContextUrl, setActivePdfContextUrl] = useState<string | null>(null);
  const [useDocumentContext, setUseDocumentContext] = useState(true); // Default to using document context
  const [quizSession, setQuizSession] = useState<{
    id: string;
    type: 'quiz' | 'pastpaper';
    startTime: number;
  } | null>(null);

  useEffect(() => {
    if (typingKanaMessage && typingKanaMessage.fullText) {
      // Instantly set the full message content
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === typingKanaMessage.id 
            ? { ...msg, content: typingKanaMessage.fullText } 
            : msg
        )
      );
      // Reset typing state immediately after setting the full message
      setTypingKanaMessage(null);
    }
  }, [typingKanaMessage, setMessages]);
  const {
    formattedTime,
    reset: resetTimer,
    setTimeLeft
  } = useTimer({
    initialTime: currentQuiz?.timeLimit || 60,
    onTimeUp: () => {
      if (currentQuiz) {
        // Auto-submit the quiz when time runs out
        finishQuiz();
      }
    }
  });
  const [isQuizSelectionOpen, setIsQuizSelectionOpen] = useState(false);
  const [quizSelectionType, setQuizSelectionType] = useState<'quiz' | 'pastpaper'>('quiz');
  const quiz = useQuiz();
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // Get messages to display based on search term and active chat
  const messagesToDisplay = useMemo(() => {
    if (searchTerm) {
      return messages.filter(message => typeof message.content === 'string' && message.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // If no active chat, show all messages
    if (!activeChat) {
      return messages;
    }
    // Show messages for active chat's subject
    return messages.filter(message => message.subject === activeChat.subject);
  }, [messages, searchTerm, activeChat]);
  // Update the useEffect for search filtering
  useEffect(() => {
    if (searchTerm) {
      const filtered = messages.filter(message => typeof message.content === 'string' && message.content.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchTerm, messages]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const handleSendMessage = () => {
    if (!input.trim()) return;
    // Create a conversation ID if none exists
    const conversationId = activeChat?.id?.toString() || uuidv4();
    const subject = activeChat?.subject || 'General';
    const title = activeChat?.title || input.slice(0, 50) + '...';
    // Add user message
    const userMessage: MessageWithSubject = {
      id: uuidv4(),
      sender: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      type: 'text',
      subject,
      conversationId,
      title // Add title for new conversations
    };
    addMessage(userMessage);
    const userMessageContent = input.trim();
    setInput('');
    setIsKanaTyping(true);

    // Call the backend API to get K.A.N.A.'s response
    fetch('http://localhost:3001/api/kana/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessageContent,
        ...(useDocumentContext && activePdfContextUrl && { activePdfUrl: activePdfContextUrl }),
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setIsKanaTyping(false); // K.A.N.A. is no longer "thinking", will start "typing"
      if (data.kanaResponse) {
        const newKanaMessageId = uuidv4();
        const responseMessagePlaceholder: MessageWithSubject = {
          id: newKanaMessageId,
          sender: 'kana',
          content: '', // Start with empty content
          timestamp: Date.now(),
          type: 'text',
          subject,
          conversationId,
          title // Use same title for the conversation
        };
        addMessage(responseMessagePlaceholder);
        setTypingKanaMessage({ id: newKanaMessageId, fullText: data.kanaResponse, currentIndex: 0 });
        setXp(prev => prev + 5); // Keep XP gain for now
      } else {
        throw new Error('Invalid response structure from backend');
      }
    })
    .catch(error => {
      console.error('Error fetching K.A.N.A. response:', error);
      setIsKanaTyping(false); // Also stop "thinking" indicator on error
      // Optionally, add a message to the chat indicating an error
      const errorMessage: MessageWithSubject = {
        id: uuidv4(),
        sender: 'kana',
        content: 'Sorry, I encountered an error trying to respond. Please try again later.',
        timestamp: Date.now(),
        type: 'text',
        subject,
        conversationId,
        title
      };
      addMessage(errorMessage);
    });
  };
  const startQuiz = (quizId: string) => {
    setActivePdfContextUrl(null); // Clear PDF context when starting a quiz
    const selectedQuiz = quizzes.find(q => q.id === quizId);
    if (!selectedQuiz) return;
    // Initialize quiz
    quiz.startQuiz(selectedQuiz);
    // Create quiz session
    setQuizSession({
      id: uuidv4(),
      type: 'quiz',
      startTime: Date.now()
    });
    // Set current quiz
    setCurrentQuiz(selectedQuiz);
    // Add quiz start message
    const startMessage: MessageWithSubject = {
      id: uuidv4(),
      sender: 'kana',
      content: <div className="space-y-4">
          <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
            <h3 className="text-lg font-medium mb-2">{selectedQuiz.title}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {selectedQuiz.questions.length} questions •{' '}
              {Math.floor(selectedQuiz.timeLimit / 60)} minutes
            </p>
            <QuizSession question={selectedQuiz.questions[0]} questionNumber={1} totalQuestions={selectedQuiz.questions.length} timeRemaining={selectedQuiz.timeLimit} onAnswer={answer => {
            quiz.submitAnswer(answer);
          }} />
          </div>
        </div>,
      timestamp: Date.now(),
      type: 'quiz-start',
      subject: selectedQuiz.subject
    };
    addMessage(startMessage);
  };
  const startPastPaper = (paperId: string) => {
    setCurrentQuiz(null); // Clear any active quiz
    setQuizCompleted(false);
    setUserAnswers({});
    const paper = pastPapers.find(p => p.id === paperId);
    if (!paper) return;
    setActivePdfContextUrl(paper.pdfUrl); // Set active PDF for Q&A
    // Use existing conversation ID from activeChat or create new one
    const conversationId = activeChat?.id?.toString() || Date.now().toString();
    const subject = activeChat?.subject || paper.subject;
    // Create the initial message for this past paper
    const paperMessage: MessageWithSubject = {
      id: uuidv4(),
      sender: 'kana',
      content: <div className="space-y-4">
          <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
            <h3 className="text-lg font-medium mb-2">{paper.title}</h3>
            <div className="flex items-center text-sm text-gray-400 mb-3">
              <File className="h-4 w-4 mr-2" />
              <span>
                {paper.examBody} • {paper.year} • {paper.pages} pages
              </span>
            </div>
            <p className="text-sm mb-4">{paper.description}</p>
            <div className="flex space-x-3">
              <button onClick={() => openPDFReader(paper.pdfUrl)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors">
                View Full Paper
              </button>
            </div>
          </div>
          <PDFPreview title={paper.title} pdfUrl={paper.pdfUrl} onOpenFull={() => openPDFReader(paper.pdfUrl)} />
        </div>,
      timestamp: Date.now(),
      type: 'past-paper',
      subject: subject,
      conversationId: conversationId,
      title: paper.title
    };
    // Add the message using addMessage
    addMessage(paperMessage);
    // Add a follow-up message
    const followUpMessage: MessageWithSubject = {
      id: uuidv4(),
      sender: 'kana',
      content: `Would you like to:
        1. Practice questions from this paper
        2. View more past papers in ${paper.subject}
        3. Get explanations for specific topics`,
      timestamp: Date.now() + 100,
      type: 'text',
      subject: subject,
      conversationId: conversationId,
      title: paper.title
    };
    addMessage(followUpMessage);
  };
  // Function to render a quiz question
  const renderQuizQuestion = (question: QuizQuestion, index: number) => {
    if (!currentQuiz || !question) {
      return <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
          <p>Loading question...</p>
        </div>;
    }
    return <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">
            {currentQuiz.title} - Question {index + 1}/
            {currentQuiz.questions.length}
          </h3>
          {formattedTime}
        </div>
        <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
          <p className="mb-4">{question.question}</p>
          {question.type === 'multiple-choice' && question.options && <div className="space-y-2">
              {question.options.map((option: string, idx: number) => <button key={idx} onClick={() => answerQuestion(question.id, idx)} className="w-full text-left p-3 bg-[#1a223a] hover:bg-[#232d4a] rounded-md transition-colors">
                  {option}
                </button>)}
            </div>}
          {question.type === 'theoretical' && <div className="mt-2">
              <textarea className="w-full bg-[#1a223a] border border-[#2a324a] rounded-md p-3 min-h-[100px] text-white" placeholder="Type your answer here..." onChange={e => setInput(e.target.value)}></textarea>
              <button onClick={() => answerQuestion(question.id, input)} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors">
                Submit Answer
              </button>
            </div>}
        </div>
      </div>;
  };

  const handleQuizCompletion = () => {
    if (!currentQuiz || !quizSession) return; // Ensure currentQuiz and quizSession are available

    // Calculate the score
    const correctCount = Object.keys(userAnswers).filter(id => {
      const question = currentQuiz.questions.find(q => q.id === id);
      return question && userAnswers[id] === question.correctAnswer;
    }).length;
    
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    const earnedXP = score >= 70 ? 100 : score >= 50 ? 50 : 25;
    
    // Add XP
    setXp(prevXP => prevXP + earnedXP);
    
    // Save the attempt
    const attemptId = uuidv4();
    const endTime = Date.now();
    const newAttempt: QuizAttempt = {
      id: attemptId,
      quizId: currentQuiz.id,
      startTime: quizSession.startTime, 
      endTime: endTime,
      answers: userAnswers,
      score: score,
      completed: true,
    };
    setAttempts(prev => [...prev, newAttempt]);
    
    // Mark quiz as completed in local state if needed (quizCompleted state variable)
    setQuizCompleted(true);
    
    // Add result message
    const resultMessage: MessageWithSubject = {
      id: uuidv4(),
      sender: 'kana',
      subject: activeChat?.subject || 'Quiz',
      conversationId: activeChat?.id?.toString() || uuidv4(),
      content: (<>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 bg-[#1a223a]/50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Score</p>
              <p className={`text-xl font-bold ${score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {score}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">XP Earned</p>
              <p className="text-xl font-bold text-blue-400">
                +{earnedXP} XP
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Time Taken</p>
              <p className="text-xl font-bold">
                {Math.round((endTime - quizSession.startTime) / (1000 * 60))} min
              </p>
            </div>
          </div>
          <div className="space-y-4 mt-6">
            <h4 className="font-medium">Question Review</h4>
            {currentQuiz.questions.map((question, idx) => {
              const isCorrect = userAnswers[question.id] === question.correctAnswer;
              return <div key={question.id} className={`p-3 rounded-md border ${isCorrect ? 'border-green-500 bg-green-500 bg-opacity-10' : 'border-red-500 bg-red-500 bg-opacity-10'}`}>
                <div className="flex justify-between">
                  <p className="font-medium">Question {idx + 1}</p>
                  {isCorrect ? <span className="text-green-500 font-medium">
                      Correct
                    </span> : <span className="text-red-500 font-medium">
                      Incorrect
                    </span>}
                </div>
                <p className="text-sm mt-1">{question.question}</p>
                <button onClick={() => setShowingExplanation(prev => prev === question.id ? null : question.id)} className="text-xs text-blue-400 mt-2 flex items-center">
                  View Explanation
                </button>
                {showingExplanation === question.id && <div className="mt-2 p-2 bg-[#1a223a] rounded text-sm">
                    <p className="font-medium mb-1">Explanation:</p>
                    <p>{question.explanation}</p>
                  </div>}
              </div>;
            })}
          </div>
          <div className="flex space-x-3 mt-6">
            <button onClick={toggleHistoryPanel} className="flex-1 py-2 bg-[#1a223a] hover:bg-[#232d4a] rounded-md font-medium transition-colors flex items-center justify-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              View History
            </button>
            <button onClick={() => startQuiz(currentQuiz.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors">
              Try Again
            </button>
          </div>
        </div>
        <div>
          <p>Great job completing the quiz! Would you like to:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => {
              const randomQuiz = quizzes.find(q => q.id !== currentQuiz.id);
              if (randomQuiz) startQuiz(randomQuiz.id);
            }} className="px-3 py-1 bg-[#1a223a] hover:bg-[#232d4a] rounded-md text-sm transition-colors">
              Try another quiz
            </button>
            <button className="px-3 py-1 bg-[#1a223a] hover:bg-[#232d4a] rounded-md text-sm transition-colors">
              Practice weak areas
            </button>
            <button className="px-3 py-1 bg-[#1a223a] hover:bg-[#232d4a] rounded-md text-sm transition-colors">
              Continue learning
            </button>
          </div>
        </div>
      </>),
      timestamp: Date.now(),
      type: 'quiz-result'
    };
    setMessages(prevMessages => [...prevMessages, resultMessage]);
    
    // Optionally, reset quiz state here if not handled by a parent component or effect
    // setQuizSession(null);
    // setCurrentQuiz(null);
    // setUserAnswers({});
    // setCurrentQuizQuestion(0);
  };

  const answerQuestion = (questionId: string, answer: any) => {
    if (!currentQuiz || !quizSession) return;
    // Save answer
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    // Move to next question or finish quiz
    if (currentQuizQuestion < currentQuiz.questions.length - 1) {
      // Progress to next question
      const nextQuestionIndex = currentQuizQuestion + 1;
      setCurrentQuizQuestion(nextQuestionIndex);
      // Add next question message
      const nextQuestion = currentQuiz.questions[nextQuestionIndex];
      const questionMessage: MessageWithSubject = {
        id: uuidv4(),
        sender: 'kana',
        content: renderQuizQuestion(nextQuestion, nextQuestionIndex),
        timestamp: Date.now(),
        type: 'quiz-question'
      };
      setMessages(prevMessages => [...prevMessages, questionMessage]);
      setInput('');
    } else {
      handleQuizCompletion();
    }
  };

  // Function to finish the quiz (handles premature ending, e.g., timer out)
  const finishQuiz = () => {
    if (!currentQuiz || !quizSession) return;
    // Save incomplete attempt if not already completed by answering last question
    if (!quizCompleted) { // Check if quiz wasn't completed via normal flow
      const attemptId = uuidv4();
      const newAttempt: QuizAttempt = {
        id: attemptId,
        quizId: currentQuiz.id,
        startTime: quizSession.startTime,
        endTime: Date.now(),
        answers: userAnswers,
        // Score might be 0 or partially calculated if desired for incomplete attempts
        score: 0, 
        completed: false, // Explicitly false for premature finish
      };
      setAttempts(prev => [...prev, newAttempt]);
      
      // Add a message indicating the quiz ended, if desired
      const prematureFinishMessage: MessageWithSubject = {
        id: uuidv4(),
        sender: 'kana',
        subject: activeChat?.subject || 'Quiz',
        conversationId: activeChat?.id?.toString() || uuidv4(),
        content: 'The quiz time ran out or was ended prematurely.',
        timestamp: Date.now(),
        type: 'text' // Or a specific type like 'quiz-ended-prematurely'
      };
      addMessage(prematureFinishMessage);
    }

    // Reset quiz session states
    setQuizSession(null);
    setCurrentQuiz(null);
    setUserAnswers({});
    setCurrentQuizQuestion(0);
    setQuizCompleted(false); // Reset for next quiz
    resetTimer(); // Reset the timer as well
  };
  const handlePastPapersClick = () => {
    setQuizSelectionType('pastpaper');
    setIsQuizSelectionOpen(true);
  };
  const handlePracticeQuizClick = () => {
    setQuizSelectionType('quiz');
    setIsQuizSelectionOpen(true);
  };
  const handleQuizSelection = (type: 'quiz' | 'pastpaper', id: string) => {
    setIsQuizSelectionOpen(false);
    // Create new chat if none exists
    if (!activeChat) {
      const newChatId = Date.now();
      const item = type === 'quiz' ? quizzes.find(q => q.id === id) : pastPapers.find(p => p.id === id);
      if (item) {
        const newChat = {
          id: newChatId,
          subject: item.subject,
          title: item.title
        };
        onChatSelect(newChat);
      }
    }
    if (type === 'quiz') {
      startQuiz(id);
    } else {
      startPastPaper(id);
    }
  };
  useEffect(() => {
    if (currentQuiz && quizSession) {
      resetTimer();
      setTimeLeft(currentQuiz.timeLimit);
    }
  }, [currentQuiz, quizSession, resetTimer, setTimeLeft]);
  useEffect(() => {
    if (quiz.status === 'completed' && quiz.quiz) {
      const results = quiz.calculateResults();
      if (results) {
        setAttempts(prev => [...prev, results]);
        // Add review message
        const reviewMessage: MessageWithSubject = {
          id: uuidv4(),
          sender: 'kana',
          content: <QuizReview title={results.title} questions={results.questions} answers={results.answers} score={results.score} onRetry={() => startQuiz(results.quizId)} />,
          timestamp: Date.now(),
          type: 'quiz-result'
        };
        addMessage(reviewMessage);
        // Reset quiz session
        setQuizSession(null);
        setCurrentQuiz(null);
      }
    }
  }, [quiz.status, quiz.quiz, setAttempts, addMessage]);
  const welcomeMessage = <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <BookOpen className="h-12 w-12 text-blue-400 mb-4" />
      <h2 className="text-xl font-medium mb-2">Welcome to K.A.N.A.</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        Your Knowledge Assistant for Natural Academics. Ask me anything about
        your studies, try a practice quiz, or explore past papers across any
        subject.
      </p>
      <div className="flex space-x-4">
        <button onClick={handlePracticeQuizClick} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center">
          <BarChart2 className="h-4 w-4 mr-2" />
          Try a Quiz
        </button>
        <button onClick={handlePastPapersClick} className="px-4 py-2 bg-[#1a223a] hover:bg-[#232d4a] rounded-md flex items-center">
          <File className="h-4 w-4 mr-2" />
          Browse Past Papers
        </button>
      </div>
    </div>;

  return (<>
      <div className="flex-1 h-full flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#1a223a]">
          <h2 className="text-lg font-medium">
            {activeChat ? <span>{activeChat.title}</span> : 'Chat with K.A.N.A.'}
          </h2>
          <div className="flex space-x-2">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 rounded-full hover:bg-[#141b2d]">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={toggleHistoryPanel} className="p-2 rounded-full hover:bg-[#141b2d]">
              <BarChart2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Search bar */}
        {isSearchOpen && <div className="p-3 border-b border-[#1a223a]">
            <div className="relative">
              <input type="text" placeholder="Search in conversation..." className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-2 pl-8 pr-8 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>}
            </div>
            {searchTerm && <div className="text-xs text-gray-400 mt-1">
                {filteredMessages.length} results
              </div>}
          </div>}
        {/* Messages */}
        {!messagesToDisplay || messagesToDisplay.length === 0 ? welcomeMessage : <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
{messagesToDisplay.map(message => {
                const isUser = message.sender === 'user';
                // Basic timestamp - you might want to format this more nicely later
                const timestamp = new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <MessageAnimation key={message.id} isVisible={true}>
                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                      <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar Placeholder */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm ${isUser ? 'ml-2' : 'mr-2'}`}>
                          {isUser ? 'U' : 'K'}
                        </div>
                        {/* Message Bubble */}
                        <div
                          className={`
                            ${isUser ? 'bg-blue-600 text-white' : 'bg-[#2a3b5f] text-gray-200'} 
                            rounded-xl p-3 shadow-md
                          `}
                        >
                          {/* Message Content */}
                          {isValidElement(message.content) ? message.content : <p className="text-sm">{String(message.content)}</p>}
                          
                          {/* Subject (if any) - styling can be improved */}
                          {message.subject && (
                            <div className="mt-1.5 pt-1.5 border-t border-white/20 text-xs text-gray-400">
                              Subject: {message.subject}
                            </div>
                          )}
                          {/* Timestamp */}
                          <div className={`text-xs mt-1.5 ${isUser ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                            {timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  </MessageAnimation>
                );
              })}

              {/* K.A.N.A. Typing Indicator - updated to match K.A.N.A. bubble style */}
              {isKanaTyping && (
                <div className="flex justify-start w-full">
                  <div className="flex items-end gap-2 max-w-[80%] flex-row">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm mr-2">
                      K
                    </div>
                    <div className="bg-[#2a3b5f] text-gray-200 rounded-xl p-3 shadow-md animate-pulse">
                      <p className="text-sm text-gray-400 italic">K.A.N.A. is typing...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>}
        {/* Input */}
        <div className="p-3 border-t border-[#1a223a]">
          <div className="relative">
            <input type="text" placeholder="Ask K.A.N.A. anything..." className="w-full bg-[#141b2d] border border-[#1a223a] rounded-md py-3 pl-4 pr-20 text-sm" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
            <div className="absolute right-2 top-2 flex items-center">
              <button onClick={() => setIsRecording(!isRecording)} className={`p-1.5 rounded-full mr-1 ${isRecording ? 'bg-red-500' : 'hover:bg-[#1a223a]'}`}>
                <Mic className="h-4 w-4" />
              </button>
              <button onClick={handleSendMessage} disabled={!input.trim()} className={`p-1.5 rounded-full ${input.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1a223a] opacity-50'}`}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex space-x-2 mt-2">
            <button onClick={handlePastPapersClick} className="px-3 py-1.5 bg-[#1a223a] hover:bg-[#232d4a] rounded-full text-sm transition-colors flex items-center">
              <File className="h-3.5 w-3.5 mr-1.5" />
              Past Papers
            </button>
            <button onClick={handlePracticeQuizClick} className="px-3 py-1.5 bg-[#1a223a] hover:bg-[#232d4a] rounded-full text-sm transition-colors flex items-center">
              <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
              Practice Quiz
            </button>
          </div>
          {/* Toggle for using document context */}
          {activePdfContextUrl && (
            <div className="flex items-center mt-3">
              <input
                type="checkbox"
                id="useDocContextToggle"
                checked={useDocumentContext}
                onChange={(e) => setUseDocumentContext(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <label htmlFor="useDocContextToggle" className="text-sm text-gray-400 cursor-pointer select-none">
                Use Document Context ({activePdfContextUrl ? 'PDF Loaded' : 'No PDF Loaded'})
              </label>
            </div>
          )}
      
    </div>
  </div>
    <QuizSelectionModal isOpen={isQuizSelectionOpen} onClose={() => setIsQuizSelectionOpen(false)} onSelectQuiz={handleQuizSelection} type={quizSelectionType} />
  </>);
};

export default ChatArea;
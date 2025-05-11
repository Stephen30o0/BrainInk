import React, { useEffect, useMemo, useState, useRef, isValidElement } from 'react';
import { Send, Mic, Search, X, File, BarChart2, Clock, AlertCircle, BookOpen, Plus } from 'lucide-react';
import { useMessages, useXP, useQuizAttempts } from '../lib/store';
import { v4 as uuidv4 } from 'uuid';
import MessageAnimation from './MessageAnimation';
import { useTimer } from '../lib/hooks/useTimer';
import quizzes from './data/QuizData';
import pastPapers from './data/PastPaperData';
import QuizSelectionModal from './QuizSelectionModal';
import { Quiz, QuizQuestion } from '../lib/types';
import { useQuiz } from '../lib/hooks/useQuiz';
import QuizCard from './quiz/QuizCard';
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
    getMessagesForSubject,
    setMessages
  } = useMessages();
  const {
    xp,
    setXp
  } = useXP();
  const {
    attempts,
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
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showingExplanation, setShowingExplanation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [quizSession, setQuizSession] = useState<{
    id: string;
    type: 'quiz' | 'pastpaper';
    startTime: number;
  } | null>(null);
  const {
    timeLeft,
    formattedTime,
    start: startTimer,
    isActive: timerActive,
    reset: resetTimer,
    setTimeLeft
  } = useTimer({
    initialTime: currentQuiz?.timeLimit || 60,
    onTimeUp: () => {
      if (currentQuiz) {
        handleQuizTimeout();
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
    const subject = activeChat?.subject || detectSubject(input) || 'General';
    const title = activeChat?.title || input.slice(0, 50) + '...';
    // Add user message
    const userMessage = {
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
    setInput('');
    // Process user message and generate response
    setTimeout(() => {
      let responseText = '';
      // Generate response based on input
      if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
        responseText = "Hello! I'm K.A.N.A., your Knowledge Assistant for Natural Academics. How can I help with your studies today?";
      } else if (input.toLowerCase().includes('photosynthesis')) {
        responseText = "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with carbon dioxide and water. It's how plants convert light energy into chemical energy!";
      } else if (input.toLowerCase().includes('math') || input.toLowerCase().includes('algebra')) {
        responseText = 'I can help with mathematics! Would you like to practice some algebra problems? I can generate a quiz or explain specific concepts.';
      } else {
        responseText = `I understand you're asking about "${input}". I can help you learn about this topic. Would you like a detailed explanation, a quiz to test your knowledge, or some past paper questions on this subject?`;
      }
      // Create response message with same conversationId and subject
      const responseMessage = {
        id: uuidv4(),
        sender: 'kana',
        content: responseText,
        timestamp: Date.now(),
        type: 'text',
        subject,
        conversationId,
        title // Use same title for the conversation
      };
      addMessage(responseMessage);
      setXp(prev => prev + 5);
    }, 1000);
  };
  const startQuiz = (quizId: string) => {
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
    const startMessage = {
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
    const paper = pastPapers.find(p => p.id === paperId);
    if (!paper) return;
    // Use existing conversation ID from activeChat or create new one
    const conversationId = activeChat?.id?.toString() || Date.now().toString();
    const subject = activeChat?.subject || paper.subject;
    // Create the initial message for this past paper
    const paperMessage = {
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
    const followUpMessage = {
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
      const questionMessage = {
        id: uuidv4(),
        sender: 'kana',
        content: renderQuizQuestion(nextQuestion, nextQuestionIndex),
        timestamp: Date.now(),
        type: 'quiz-question'
      };
      setMessages(prevMessages => [...prevMessages, questionMessage]);
      setInput('');
    } else {
      // Complete quiz
      finishQuiz();
    }
  };
  const finishQuiz = () => {
    if (!currentQuiz || !quizSession) return;
    // Calculate score
    let correctAnswers = 0;
    currentQuiz.questions.forEach(question => {
      if (userAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    const score = Math.round(correctAnswers / currentQuiz.questions.length * 100);
    setQuizCompleted(true);
    // Add XP based on score
    const earnedXP = Math.round(score / 10) * 5;
    setXp(prev => prev + earnedXP);
    // Save quiz attempt
    const attempt = {
      id: uuidv4(),
      quizId: currentQuiz.id,
      startTime: quizSession.startTime,
      endTime: Date.now(),
      answers: userAnswers,
      score,
      completed: true
    };
    setAttempts(prev => [...prev, attempt]);
    // Reset quiz session
    setQuizSession(null);
    // Show results
    const resultMessage = {
      id: uuidv4(),
      sender: 'kana',
      content: <div className="space-y-4">
          <div className="bg-[#141b2d] p-4 rounded-lg border border-[#1a223a]">
            <h3 className="text-lg font-medium mb-2">
              Quiz Results: {currentQuiz.title}
            </h3>
            <div className="flex justify-between items-center mb-4">
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
                  {Math.round((currentQuiz.timeLimit - timeLeft) / 60)} min
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
                    <button onClick={() => setShowingExplanation(question.id)} className="text-xs text-blue-400 mt-2 flex items-center">
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
        </div>,
      timestamp: Date.now(),
      type: 'quiz-result'
    };
    setMessages(prevMessages => [...prevMessages, resultMessage]);
  };
  const handleQuizTimeout = () => {
    if (!currentQuiz || !quizSession) return;
    // Save incomplete attempt
    const attempt = {
      id: uuidv4(),
      quizId: currentQuiz.id,
      startTime: quizSession.startTime,
      endTime: Date.now(),
      answers: userAnswers,
      score: 0,
      completed: false
    };
    setAttempts(prev => [...prev, attempt]);
    // Reset quiz session
    setQuizSession(null);
    setQuizCompleted(true);
    // Add timeout message
    const timeoutMessage = {
      id: uuidv4(),
      sender: 'kana',
      content: <div className="space-y-4">
          <div className="bg-[#141b2d] p-4 rounded-lg border border-red-500">
            <div className="flex items-center mb-3">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-500">Time's Up!</h3>
            </div>
            <p>
              You've run out of time for this quiz. Don't worry, you can always
              try again!
            </p>
            <div className="flex space-x-3 mt-4">
              <button onClick={() => startQuiz(currentQuiz.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors">
                Try Again
              </button>
              <button className="flex-1 py-2 bg-[#1a223a] hover:bg-[#232d4a] rounded-md font-medium transition-colors">
                Review Material
              </button>
            </div>
          </div>
        </div>,
      timestamp: Date.now(),
      type: 'quiz-result'
    };
    setMessages(prevMessages => [...prevMessages, timeoutMessage]);
  };
  const renderTimer = () => {
    const percentage = timeLeft / (currentQuiz?.timeLimit || 60) * 100;
    const color = percentage > 50 ? 'text-green-500' : percentage > 25 ? 'text-yellow-500' : 'text-red-500';
    return <div className="relative inline-flex items-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-12 h-12">
            <circle className="text-[#1a223a]" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
            <circle className={`${color} transition-all duration-1000 ease-in-out`} strokeWidth="4" strokeDasharray={125.6} strokeDashoffset={125.6 * ((100 - percentage) / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
          </svg>
        </div>
        <span className={`text-sm font-medium ${color} ml-3 relative z-10`}>
          {formattedTime}
        </span>
      </div>;
  };
  const renderQuizQuestion = (question: QuizQuestion | undefined, index: number) => {
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
          {renderTimer()}
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
        const reviewMessage = {
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
  const detectSubject = (message: string): string | null => {
    const subjects = {
      Mathematics: ['math', 'algebra', 'geometry', 'calculus'],
      Physics: ['physics', 'force', 'motion', 'energy'],
      Chemistry: ['chemistry', 'molecule', 'reaction', 'acid'],
      Biology: ['biology', 'cell', 'organism', 'photosynthesis'],
      English: ['english', 'grammar', 'literature', 'writing']
    };
    const lowercaseMessage = message.toLowerCase();
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        return subject;
      }
    }
    return null;
  };
  return <>
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
              {messagesToDisplay.map(message => <MessageAnimation key={message.id} isVisible={true}>
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'ml-auto bg-blue-600' : 'bg-[#141b2d]'} rounded-lg p-4`}>
                    {isValidElement(message.content) ? message.content : <p>{String(message.content)}</p>}
                    {message.subject && <div className="mt-2 text-xs text-gray-400">
                        Subject: {message.subject}
                      </div>}
                  </div>
                </MessageAnimation>)}
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
        </div>
      </div>
      <QuizSelectionModal isOpen={isQuizSelectionOpen} onClose={() => setIsQuizSelectionOpen(false)} onSelectQuiz={handleQuizSelection} type={quizSelectionType} />
    </>;
};
export default ChatArea;
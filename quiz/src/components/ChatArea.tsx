import * as React from 'react';
import { Send, XCircle, BookOpen, FileText, BarChart2, File, UploadCloud, X } from 'lucide-react'; // Cleaned up unused icons
import { useMessages, useXP, useQuizAttempts, MessageWithSubject } from '../lib/store';
import { Chat, PastPaper } from '../lib/types'; // Moved PastPaper here too for consistency, Chat added
import { v4 as uuidv4 } from 'uuid';
import { useTimer } from '../lib/hooks/useTimer';
import { PixelButton as Button } from '../../../src/components/shared/PixelButton'; // Used relative import path 
import quizzes from './data/QuizData';
import pastPapers from './data/PastPaperData';
import MessageItem from './MessageItem'; // Removed duplicate import
import { Quiz, QuizQuestion, QuizAttempt } from '../lib/types';
import { useQuiz } from '../lib/hooks/useQuiz';
import QuizSession from './quiz/QuizSession';
import QuizReview from './quiz/QuizReview';
import PDFPreview from './PDFPreview';
// import MessageItem from './MessageItem'; // Temporarily commented out

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
const ChatArea = ({
  openPDFReader,
  toggleHistoryPanel,
  activeChat,
  onChatSelect
}: ChatAreaProps): JSX.Element => {
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
  const [input, setInput] = React.useState('');
  const [searchTerm] = React.useState(''); // setSearchTerm removed as it's unused
  const [currentQuiz, setCurrentQuiz] = React.useState<Quiz | null>(null);
  const [currentQuizQuestion, setCurrentQuizQuestion] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<Record<string, string | number>>({});
  const [quizCompleted, setQuizCompleted] = React.useState(false);
  const [showingExplanation, setShowingExplanation] = React.useState<string | null>(null);
  const [isKanaTyping, setIsKanaTyping] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadedNoteName, setUploadedNoteName] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [pastedImageFile, setPastedImageFile] = React.useState<File | null>(null);
  const [isSendingImage, setIsSendingImage] = React.useState<boolean>(false);
  const [typingKanaMessage, setTypingKanaMessage] = React.useState<{ id: string; fullText: string; currentIndex: number } | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [activePdfContextUrl, setActivePdfContextUrl] = React.useState<string | null>(null);
  const [useDocumentContext] = React.useState(true); // Default to using document context, setUseDocumentContext removed as it's unused
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const [isQuizMode, setIsQuizMode] = React.useState(false); // Default to false
  const [quizSession, setQuizSession] = React.useState<{
    id: string;
    type: 'quiz' | 'pastpaper';
    startTime: number;
  } | null>(null);

  React.useEffect(() => {
    if (typingKanaMessage && typingKanaMessage.fullText) {
      // Instantly set the full message content
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === typingKanaMessage.id 
            ? { ...msg, content: typingKanaMessage.fullText } 
            : msg
        )
      );
      setIsQuizMode(false);
      // Reset typing state immediately after setting the full message
      setTypingKanaMessage(null);
    }
  }, [typingKanaMessage, setMessages]);

  const {
    formattedTime,
    reset: resetTimer,
    setTimeLeft,
    timeLeft, // Added
    isActive  // Added
  } = useTimer({
    initialTime: currentQuiz?.timeLimit || 60
  });

  // Function to finish the quiz (handles premature ending, e.g., timer out)
  const finishQuiz = React.useCallback(() => {
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
  }, [
    currentQuiz, quizSession, quizCompleted, userAnswers, 
    setAttempts, addMessage, activeChat, 
    setQuizSession, setCurrentQuiz, setUserAnswers, 
    setCurrentQuizQuestion, setQuizCompleted, resetTimer
  ]);

  React.useEffect(() => {
    if (isActive && timeLeft === 0 && currentQuiz) {
      finishQuiz();
    }
  }, [isActive, timeLeft, currentQuiz, finishQuiz]);

  const [isQuizSelectionOpen, setIsQuizSelectionOpen] = React.useState(false); // Controls visibility of quiz/past paper selection modal
  const [quizSelectionType, setQuizSelectionType] = React.useState<'quiz' | 'pastpaper'>('quiz'); // 'quiz' or 'pastpaper'
  const quiz = useQuiz();
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // Get messages to display based on search term and active chat
  const messagesToDisplay = React.useMemo(() => {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const handleSendMessage = async () => {
    if (!input.trim() && !pastedImageFile) return;

    const currentInput = input.trim(); // Capture input before clearing
    const currentPastedFile = pastedImageFile; // Capture file before clearing

    // Define subject, conversationId, and title based on activeChat or defaults
    const subject = activeChat?.subject || 'General';
    const conversationId = activeChat?.id?.toString() || uuidv4();
    // For title, if it's a new chat (no activeChat.id yet), use a generic or input-derived title
    // If it's an existing chat, use activeChat.title
    const title = activeChat?.title || (currentInput.length > 0 ? currentInput.slice(0, 30) + '...' : 'New Chat');

    // Add user message to UI immediately if there's text
    if (currentInput) {
      const userMessage: MessageWithSubject = {
        id: uuidv4(),
        sender: 'user',
        content: currentInput,
        timestamp: Date.now(),
        type: 'text',
        subject,
        conversationId,
        title
      };
      addMessage(userMessage);
    }
    // If only an image is sent, we might want a placeholder, or handle it on the backend response.
    // For now, a text message is added if text exists. Image is handled below.

    setInput(''); // Clear text input now
    setPastedImageFile(null); // Clear pasted image from UI preview now

    if (currentPastedFile) {
      setIsSendingImage(true);
      setIsKanaTyping(true); // Also set general typing indicator

      const formData = new FormData();
      formData.append('imageFile', currentPastedFile);
      formData.append('message', currentInput); // Send text input along with image
      formData.append('subject', subject);
      formData.append('conversationId', conversationId);
      formData.append('title', title);
      if (activePdfContextUrl) formData.append('activePdfUrl', activePdfContextUrl);
      if (uploadedNoteName) formData.append('uploadedNoteName', uploadedNoteName);

      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Image analysis failed with non-JSON response from server.' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const kanaResponseData = await response.json();
        
        // Expecting backend to return a message object or content for K.A.N.A.
        const kanaMessage: MessageWithSubject = {
          id: uuidv4(),
          sender: 'kana',
          // content could be complex, e.g., text + image URL, or just text
          content: kanaResponseData.kanaResponse || 'Image processed.', 
          imageUrl: kanaResponseData.imageUrl, // URL of the image as processed/stored by backend
          explanation: kanaResponseData.explanation, // Text explanation from K.A.N.A.
          timestamp: Date.now(),
          type: kanaResponseData.type || 'image_with_explanation', // Backend should define this, e.g., 'image_analysis'
          subject,
          conversationId,
          title
        };
        addMessage(kanaMessage);
        // Potentially add XP here if image analysis is a feature to reward
        // setXp(prev => prev + 3); 

      } catch (error: any) {
        console.error('Error sending/analyzing image:', error);
        addMessage({
          id: uuidv4(),
          sender: 'system',
          content: `Error analyzing image: ${error.message}`,
          timestamp: Date.now(),
          type: 'text',
          subject,
          conversationId,
          title
        });
      } finally {
        setIsSendingImage(false);
        setIsKanaTyping(false);
      }
    } else if (currentInput) { // Standard text message, no pasted image
      setIsKanaTyping(true);
      // The user message is already added above. Now fetch K.A.N.A.'s response.

      // Logic for image *generation* requests (keywords like 'draw', 'generate image')
      const imageRequestPatterns = [
        /^draw (.*)/i,
        /^generate image of (.*)/i,
        /^create an image of (.*)/i,
        /^show me an image of (.*)/i,
        /^generate an image of (.*?) and explain it$/i,
        /^generate image: (.*)$/i
      ];
      let isImageGenerationRequest = false;
      for (const pattern of imageRequestPatterns) {
        if (currentInput.match(pattern)) {
          isImageGenerationRequest = true;
          break;
        }
      }

      if (isImageGenerationRequest) {
        fetch('/api/generate-and-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: currentInput, subject, conversationId, title }),
        })
        .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
        .then(data => {
          addMessage({
            id: uuidv4(),
            sender: 'kana',
            content: data.explanation || 'Here is the image you requested.',
            timestamp: Date.now(),
            type: 'image_with_explanation',
            imageUrl: data.generatedImageUrl,
            explanation: data.explanation,
            subject,
            conversationId,
            title
          });
        })
        .catch(error => {
          console.error('Error fetching K.A.N.A. image generation response:', error);
          addMessage({
            id: uuidv4(), sender: 'kana', content: `Sorry, error generating image: ${error.message || 'Unknown error'}`,
            timestamp: Date.now(), type: 'text', subject, conversationId, title
          });
        })
        .finally(() => setIsKanaTyping(false));
      } else {
        // Standard chat API call (non-image-generation)
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            subject,
            conversationId,
            title,
            ...(useDocumentContext && activePdfContextUrl ? { activePdfUrl: activePdfContextUrl } : {}),
            ...(uploadedNoteName ? { uploadedNoteName: uploadedNoteName } : {})
          }),
        })
        .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
        .then(data => {
          if (data.type === "mathematical_graph" && data.generatedImageUrl && data.kanaResponse) {
            addMessage({
              id: uuidv4(), sender: 'kana', content: data.kanaResponse,
              timestamp: Date.now(), type: 'mathematical_graph', imageUrl: data.generatedImageUrl,
              subject, conversationId, title
            });
            setXp(prev => prev + 2);
          } else if (data.kanaResponse) {
            const newKanaMessageId = uuidv4();
            addMessage({
              id: newKanaMessageId, sender: 'kana', content: '', // Placeholder for typing effect
              timestamp: Date.now(), type: 'text', subject, conversationId, title
            });
            setTypingKanaMessage({ id: newKanaMessageId, fullText: data.kanaResponse, currentIndex: 0 });
            setXp(prev => prev + 5);
          } else {
            throw new Error('Invalid response structure from backend chat');
          }
        })
        .catch(error => {
          console.error('Error fetching K.A.N.A. chat response:', error);
          addMessage({
            id: uuidv4(), sender: 'kana', content: `Sorry, error fetching response: ${error.message || 'Unknown error'}`,
            timestamp: Date.now(), type: 'text', subject, conversationId, title
          });
        })
        .finally(() => setIsKanaTyping(false));
      }
    } else if (!currentPastedFile && !currentInput) {
      // This case should ideally be prevented by the initial check,
      // but as a fallback, ensure we don't proceed with no content.
      setIsKanaTyping(false); // Ensure typing indicator is off
      setIsSendingImage(false); // Ensure image sending indicator is off
    }

  }; // End of handleSendMessage

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadError(null); // Clear previous errors
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('noteFile', selectedFile);

    const subject = activeChat?.subject || 'General';
    const conversationId = activeChat?.id?.toString() || uuidv4();
    const title = activeChat?.title || 'System Message';

    try {
      const response = await fetch('/api/upload-note', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const noteName = data.filename || selectedFile.name;
        setUploadedNoteName(noteName);
        setSelectedFile(null); 
        addMessage({
          id: uuidv4(),
          sender: 'system',
          content: `Note "${noteName}" uploaded successfully. K.A.N.A. will now use this for context.`, 
          timestamp: Date.now(),
          type: 'text',
          subject,
          conversationId,
          title
        });
      } else {
        setUploadError(data.error || 'Failed to upload note.');
        setUploadedNoteName(null);
        addMessage({
          id: uuidv4(),
          sender: 'system',
          content: `Failed to upload note: ${data.error || 'Unknown error'}`,
          timestamp: Date.now(),
          type: 'text',
          subject,
          conversationId,
          title
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError('An error occurred during upload.');
      setUploadedNoteName(null);
      addMessage({
        id: uuidv4(),
        sender: 'system',
        content: `Upload error: ${error.message || 'Network error'}`,
        timestamp: Date.now(),
        type: 'text',
        subject,
        conversationId,
        title
      });
    }
    setIsUploading(false);
  };

  const handleStartNewChat = () => {
    const newChatId = Date.now(); // Or use uuidv4 for more uniqueness if preferred
    const newChat: Chat = {
      id: newChatId,
      subject: 'General',
      title: `Chat ${new Date(newChatId).toLocaleTimeString()}` // Or simply 'New Chat'
    };
    onChatSelect(newChat);
    handleClearNoteContext(); // Clear note context for the new chat
    // Optionally, clear local message input or other states if needed
    // setInput(''); 
    // setMessages([]); // messagesToDisplay should update based on activeChat.id
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setPastedImageFile(blob);
            event.preventDefault(); // Prevent pasting image data as text
            // Optionally, clear the text input if an image is pasted
            // setInput(''); 
            return;
          }
        }
      }
    }
  };

  const handleClearNoteContext = async () => {
    const subject = activeChat?.subject || 'General';
    const conversationId = activeChat?.id?.toString() || uuidv4();
    const title = activeChat?.title || 'System Message';
    try {
      const response = await fetch('/api/clear-note-context', {
        method: 'POST',
      });
      if (response.ok) {
        setUploadedNoteName(null);
        setUploadError(null);
        addMessage({
          id: uuidv4(),
          sender: 'system',
          content: 'Uploaded note context has been cleared.',
          timestamp: Date.now(),
          type: 'text',
          subject,
          conversationId,
          title
        });
      } else {
        const data = await response.json();
        setUploadError(data.error || 'Failed to clear note context.');
        addMessage({
          id: uuidv4(),
          sender: 'system',
          content: `Failed to clear note context: ${data.error || 'Unknown error'}`,
          timestamp: Date.now(),
          type: 'text',
          subject,
          conversationId,
          title
        });
      }
    } catch (error: any) {
      console.error('Clear context error:', error);
      setUploadError('An error occurred while clearing context.');
       addMessage({
        id: uuidv4(),
        sender: 'system',
        content: `Error clearing note context: ${error.message || 'Network error'}`,
        timestamp: Date.now(),
        type: 'text',
        subject,
        conversationId,
        title
      });
    }
  };

  const startQuiz = (quizId: string) => {
    setIsQuizMode(true);
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
            <QuizSession question={selectedQuiz.questions[0]} questionNumber={1} totalQuestions={selectedQuiz.questions.length} timeRemaining={selectedQuiz.timeLimit} onAnswer={(answer: string) => {
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
      content: (
        <div className="space-y-4">
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
              <button 
                onClick={() => openPDFReader(paper.pdfUrl)} 
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
              >
                View Full Paper
              </button>
            </div>
          </div>
          <PDFPreview title={paper.title} pdfUrl={paper.pdfUrl} onOpenFull={() => openPDFReader(paper.pdfUrl)} />
        </div>
      ),
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

  const answerQuestion = (questionId: string, answer: string | number) => {
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

  // Function to render a quiz question
  const renderQuizQuestion = React.useCallback((question: QuizQuestion, index: number) => {
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
              <textarea className="w-full bg-[#1a223a] border border-[#2a324a] rounded-md p-3 min-h-[100px] text-white" placeholder="Type your answer here..." onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}></textarea>
              <button onClick={() => answerQuestion(question.id, input)} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors">
                Submit Answer
              </button>
            </div>}
        </div>
      </div>;
  }, [currentQuiz, formattedTime, answerQuestion, setInput, input]);


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
    setIsQuizMode(false);
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
        handleClearNoteContext(); // Clear note context if a new chat is created for quiz/past paper
      }
    }
    if (type === 'quiz') {
      startQuiz(id);
    } else {
      startPastPaper(id);
    }
  };

  React.useEffect(() => {
    if (currentQuiz && quizSession) {
      resetTimer();
      setTimeLeft(currentQuiz.timeLimit);
    }
  }, [currentQuiz, quizSession, resetTimer, setTimeLeft]);

  React.useEffect(() => {
    // Clear note context on initial mount if no specific chat is active
    // This handles page reloads to ensure a fresh context
    if (!activeChat) {
      handleClearNoteContext();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  React.useEffect(() => {
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
        setIsQuizMode(false);
      }
    }
  }, [quiz.status, quiz.quiz, userAnswers, handleQuizCompletion, setAttempts, addMessage, setQuizSession, setCurrentQuiz, activeChat, quizSession]);

  // Parent container for all views and the modal
  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#0d1117]">
      {(() => {
        // Main Chat View
        if (activeChat || (messages && messages.length > 0)) {
          return (
            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden h-full">
              {/* Chat Header */}
              {activeChat && (
                <div className="p-3 border-b border-[#1a223a] flex items-center justify-between bg-[#141b2d]">
                  <h2 className="text-lg font-medium text-white">{activeChat.title}</h2>
                  {/* Add any header actions here if needed */}
                </div>
              )}

              {/* Message List */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#2a324a] scrollbar-track-[#141b2d]">
                {messagesToDisplay.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))}
                {isKanaTyping && activeChat && (
                  <MessageItem message={{ id: 'typingIndicator', sender: 'kana', content: 'K.A.N.A. is typing...', timestamp: Date.now(), type: 'typing', subject: activeChat.subject, conversationId: activeChat.id.toString(), title: activeChat.title }} />
                )}
              </div> {/* This closes the message list div */}

              {/* Input Area */}
              <div className="p-4 border-t border-[#1a223a] bg-[#141b2d]">
                {/* Buttons to open Quiz/Past Paper Selection Modals */}
                <div className="flex justify-center space-x-3 mb-3">
                  <Button onClick={handlePracticeQuizClick} small>
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Select Quiz
                  </Button>
                  <Button onClick={handlePastPapersClick} small>
                    <FileText className="h-4 w-4 mr-1.5" />
                    Select Past Paper
                  </Button>
                </div>
                {activePdfContextUrl && (
                  <div className="mb-2 p-2 text-xs bg-[#1a223a] rounded-md text-blue-300 flex justify-between items-center">
                    <span>Context: {activePdfContextUrl.substring(activePdfContextUrl.lastIndexOf('/') + 1)}</span>
                    <button onClick={() => setActivePdfContextUrl(null)} className="text-red-400 hover:text-red-300">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div> /* This closes the activePdfContextUrl div */
                )}

                {/* Note Upload Section */}
                <div className="mb-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="note-upload-input"
                      onChange={handleFileChange}
                      accept=".txt,.pdf"
                      className="hidden" // Hidden: styled via label
                    />
                    <label
                      htmlFor="note-upload-input"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors"
                    >
                      <UploadCloud className="h-4 w-4 mr-1.5" />
                      Choose Note (.txt, .pdf)
                    </label>
                    {selectedFile && (
                      <Button onClick={handleFileUpload} disabled={isUploading} small>
                        {isUploading ? 'Uploading...' : 'Upload Selected Note'}
                      </Button>
                    )}
                  </div>
                  {selectedFile && !isUploading && (
                    <p className="text-xs text-gray-400">Selected file: {selectedFile.name}</p>
                  )}
                  {uploadedNoteName && (
                    <div className="p-2 text-xs bg-green-500 bg-opacity-20 rounded-md text-green-300 flex justify-between items-center">
                      <span>Active Note: {uploadedNoteName}</span>
                      <button onClick={handleClearNoteContext} className="text-red-400 hover:text-red-300 ml-2 p-1 rounded-full hover:bg-red-500 hover:bg-opacity-20">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-xs text-red-400 mt-1">Error: {uploadError}</p>
                  )}
                </div>

                {/* Pasted Image Preview Section */}
                {pastedImageFile && (
                  <div className="mb-2 flex items-center p-2 bg-[#1a223a] rounded-md">
                    <img 
                      src={URL.createObjectURL(pastedImageFile)}
                      alt="Pasted preview"
                      className="max-w-[80px] max-h-[80px] rounded-md mr-3 border border-gray-600"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Clean up object URL after load
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1 truncate max-w-[200px]">{pastedImageFile.name}</span>
                      <Button 
                        onClick={() => {
                          if (pastedImageFile) {
                            // It's good practice to revoke the object URL when it's no longer needed
                            // However, the img's onLoad will handle it. If image fails to load, this won't be called.
                            // Consider revoking here if there are issues with onLoad not firing for all cases.
                          }
                          setPastedImageFile(null);
                        }}
                        small 
                        // variant="danger_ghost" // PixelButton does not have this variant
                        className="text-xs text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500 hover:bg-opacity-10 px-2 py-1 rounded-md flex items-center"
                      >
                        <X className="h-3 w-3 mr-1" /> Clear Image
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={handlePaste}
                    placeholder={isKanaTyping ? "K.A.N.A. is thinking..." : "Ask K.A.N.A. anything..."}
                    className="w-full p-3 rounded-l-md bg-[#1a223a] text-white focus:ring-1 focus:ring-blue-500 focus:outline-none border border-transparent focus:border-blue-500 placeholder-gray-500"
                    disabled={isKanaTyping || isSendingImage}
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-r-md text-white font-medium disabled:opacity-50 flex items-center justify-center h-[50px] w-[50px]"
                    disabled={(!input.trim() && !pastedImageFile) || isKanaTyping || isSendingImage}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          );
        }

        // Quiz View
        if (isQuizMode && currentQuiz && !quizCompleted) {
          const currentQuestionInstance = currentQuiz.questions[currentQuizQuestion];
          return (
            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-y-auto p-4 md:p-6 items-center justify-center">
              <div className="w-full max-w-2xl bg-[#141b2d] p-6 rounded-lg shadow-xl border border-[#1a223a]">
                {currentQuestionInstance ? 
                  renderQuizQuestion(currentQuestionInstance, currentQuizQuestion) :
                  <p className="text-white text-center">Loading quiz question...</p>
                }
              </div>
            </div>
          );
        }

        // Fallback to Welcome Screen
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-4xl font-bold mb-4 text-white">Welcome to K.A.N.A.</h1>
            <p className="text-xl text-gray-400 mb-8">Your Knowledge and Assistance Neural Agent.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleStartNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Start New Chat
              </button>
              <button
                onClick={() => handlePracticeQuizClick()} 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Take a Quiz
              </button>
              <button
                onClick={() => handlePastPapersClick()} 
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Past Papers
              </button>
            </div>
          </div>
        );
      })()}

      {/* Quiz Selection Modal */}
      {isQuizSelectionOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[#141b2d] p-6 rounded-lg shadow-xl w-full max-w-md md:max-w-lg border border-[#1a223a]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">
                {quizSelectionType === 'quiz' ? 'Select a Quiz' : 'Select a Past Paper'}
              </h2>
              <button
                onClick={() => setIsQuizSelectionOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close quiz selection"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[#2a324a] scrollbar-track-[#141b2d] pr-2">
              {(quizSelectionType === 'quiz' ? quizzes : pastPapers).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleQuizSelection(quizSelectionType, item.id)}
                  className="w-full text-left p-3 bg-[#1a223a] hover:bg-[#2a324a] rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <h3 className="font-medium">{item.title}</h3>
                  {quizSelectionType === 'pastpaper' && (item as PastPaper).description && <p className="text-sm text-gray-400 mt-1">{(item as PastPaper).description}</p>}
                  {(item as PastPaper).subject && quizSelectionType === 'pastpaper' && (
                    <p className="text-xs text-blue-400 mt-1">Subject: {(item as any).subject}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatArea;
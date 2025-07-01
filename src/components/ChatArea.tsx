import React, { useState, useRef, useEffect } from 'react';
import { Send, XCircle, UploadCloud, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_BASE_URL = import.meta.env.VITE_KANA_API_BASE_URL?.replace('/api/kana', '') || 'http://localhost:10000';

interface Message {
    id: string;
    sender: 'user' | 'kana' | 'system';
    content: string;
    timestamp: number;
    type: 'text' | 'image_with_explanation' | 'mathematical_graph';
    imageUrl?: string;
    explanation?: string;
}

interface ChatAreaProps {
    className?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ className = '' }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: uuidv4(),
            sender: 'kana',
            content: 'Hello! I\'m K.A.N.A., your Knowledge and Assistance Neural Agent. I can help you with learning, answer questions, analyze images, generate graphs, and much more. How can I assist you today?',
            timestamp: Date.now(),
            type: 'text'
        }
    ]);
    const [input, setInput] = useState('');
    const [isKanaTyping, setIsKanaTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedNoteName, setUploadedNoteName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [pastedImageFile, setPastedImageFile] = useState<File | null>(null);
    const [isSendingImage, setIsSendingImage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [conversationId] = useState<string>(uuidv4());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const handleSendMessage = async () => {
        if (!input.trim() && !pastedImageFile) return;

        const currentInput = input.trim();
        const currentPastedFile = pastedImageFile;

        // Add user message
        const userMessage: Message = {
            id: uuidv4(),
            sender: 'user',
            content: currentInput,
            timestamp: Date.now(),
            type: 'text',
            imageUrl: currentPastedFile ? URL.createObjectURL(currentPastedFile) : undefined
        };
        addMessage(userMessage);

        // Clear inputs
        setInput('');
        setPastedImageFile(null);

        if (currentPastedFile) {
            setIsSendingImage(true);
            setIsKanaTyping(true);

            const formData = new FormData();
            formData.append('imageFile', currentPastedFile);
            formData.append('message', currentInput);
            formData.append('subject', 'General');
            formData.append('conversationId', conversationId);
            formData.append('title', 'K.A.N.A. Chat');
            if (uploadedNoteName) formData.append('uploadedNoteName', uploadedNoteName);

            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/analyze-image`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Image analysis failed.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const kanaResponseData = await response.json();

                const kanaMessage: Message = {
                    id: uuidv4(),
                    sender: 'kana',
                    content: kanaResponseData.kanaResponse || 'Image processed.',
                    imageUrl: kanaResponseData.imageUrl,
                    explanation: kanaResponseData.explanation,
                    timestamp: Date.now(),
                    type: kanaResponseData.type || 'image_with_explanation'
                };
                addMessage(kanaMessage);

            } catch (error: any) {
                console.error('Error sending/analyzing image:', error);
                addMessage({
                    id: uuidv4(),
                    sender: 'system',
                    content: `Error analyzing image: ${error.message}`,
                    timestamp: Date.now(),
                    type: 'text'
                });
            } finally {
                setIsSendingImage(false);
                setIsKanaTyping(false);
            }
        } else if (currentInput) {
            setIsKanaTyping(true);

            // Check for image generation requests
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

            const payload = {
                message: currentInput,
                subject: 'General',
                conversationId,
                title: 'K.A.N.A. Chat',
                uploadedNoteName: uploadedNoteName || undefined,
            };

            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Chat request failed.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.type === "mathematical_graph" && data.generatedImageUrl && data.kanaResponse) {
                    const fullImageUrl = `${BACKEND_BASE_URL}${data.generatedImageUrl}`;
                    addMessage({
                        id: uuidv4(),
                        sender: 'kana',
                        content: data.kanaResponse,
                        timestamp: Date.now(),
                        type: 'mathematical_graph',
                        imageUrl: fullImageUrl
                    });
                } else if (data.kanaResponse !== undefined) {
                    addMessage({
                        id: uuidv4(),
                        sender: 'kana',
                        content: data.kanaResponse,
                        timestamp: Date.now(),
                        type: 'text'
                    });
                } else {
                    throw new Error('Invalid response structure from backend chat');
                }
            } catch (error: any) {
                console.error('Error fetching K.A.N.A. chat response:', error);
                addMessage({
                    id: uuidv4(),
                    sender: 'kana',
                    content: `Sorry, error fetching response: ${error.message || 'Unknown error'}`,
                    timestamp: Date.now(),
                    type: 'text'
                });
            } finally {
                setIsKanaTyping(false);
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setUploadError(null);
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
        formData.append('studyMaterial', selectedFile);
        formData.append('conversationId', conversationId);

        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/upload-study-material`, {
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
                    type: 'text'
                });
            } else {
                setUploadError(data.error || 'Failed to upload note.');
                addMessage({
                    id: uuidv4(),
                    sender: 'system',
                    content: `Failed to upload note: ${data.error || 'Unknown error'}`,
                    timestamp: Date.now(),
                    type: 'text'
                });
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadError('An error occurred during upload.');
            addMessage({
                id: uuidv4(),
                sender: 'system',
                content: `Upload error: ${error.message || 'Network error'}`,
                timestamp: Date.now(),
                type: 'text'
            });
        }
        setIsUploading(false);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const items = event.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        setPastedImageFile(blob);
                        event.preventDefault();
                        return;
                    }
                }
            }
        }
    };

    const handleClearNoteContext = async () => {
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/clear-note-context`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId }),
            });
            if (response.ok) {
                setUploadedNoteName(null);
                setUploadError(null);
                addMessage({
                    id: uuidv4(),
                    sender: 'system',
                    content: 'Uploaded note context has been cleared.',
                    timestamp: Date.now(),
                    type: 'text'
                });
            } else {
                const data = await response.json();
                setUploadError(data.error || 'Failed to clear note context.');
            }
        } catch (error: any) {
            console.error('Clear context error:', error);
            setUploadError('An error occurred while clearing context.');
        }
    };

    const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
        const isUser = message.sender === 'user';
        const isSystem = message.sender === 'system';

        return (
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${isUser
                        ? 'bg-blue-600 text-white'
                        : isSystem
                            ? 'bg-yellow-600 text-white'
                            : 'bg-[#1a223a] text-white border border-[#2a324a]'
                    }`}>
                    {message.imageUrl && (
                        <img
                            src={message.imageUrl}
                            alt="Shared image"
                            className="max-w-full rounded-md mb-2"
                        />
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.explanation && (
                        <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-sm">
                            <p className="font-medium mb-1">Explanation:</p>
                            <p>{message.explanation}</p>
                        </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex flex-col h-full bg-[#0d1117] ${className}`}>
            {/* Header */}
            <div className="p-3 border-b border-[#1a223a] bg-[#141b2d]">
                <h2 className="text-lg font-medium text-white">K.A.N.A. Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#2a324a] scrollbar-track-[#141b2d]">
                {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
                {isKanaTyping && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-[#1a223a] text-white border border-[#2a324a] rounded-lg p-3 max-w-[80%]">
                            K.A.N.A. is typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#1a223a] bg-[#141b2d]">
                {/* Note Upload Section */}
                <div className="mb-3 space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="file"
                            id="note-upload-input"
                            onChange={handleFileChange}
                            accept=".txt,.pdf"
                            className="hidden"
                        />
                        <label
                            htmlFor="note-upload-input"
                            className="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors"
                        >
                            <UploadCloud className="h-4 w-4 mr-1.5" />
                            Choose Note (.txt, .pdf)
                        </label>
                        {selectedFile && (
                            <button
                                onClick={handleFileUpload}
                                disabled={isUploading}
                                className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
                            >
                                {isUploading ? 'Uploading...' : 'Upload Selected Note'}
                            </button>
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

                {/* Pasted Image Preview */}
                {pastedImageFile && (
                    <div className="mb-2 flex items-center p-2 bg-[#1a223a] rounded-md">
                        <img
                            src={URL.createObjectURL(pastedImageFile)}
                            alt="Pasted preview"
                            className="max-w-[80px] max-h-[80px] rounded-md mr-3 border border-gray-600"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 mb-1 truncate max-w-[200px]">{pastedImageFile.name}</span>
                            <button
                                onClick={() => setPastedImageFile(null)}
                                className="text-xs text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500 hover:bg-opacity-10 px-2 py-1 rounded-md flex items-center"
                            >
                                <X className="h-3 w-3 mr-1" /> Clear Image
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Form */}
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
};

export default ChatArea;

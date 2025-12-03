'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, ChevronDown, GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUI, useProject, useAuth } from '@/lib/store';
import ReactMarkdown from 'react-markdown';

// Assistant UI inspired components with custom styling
function MessageBubble({ 
  role, 
  content, 
  isLoading = false 
}: { 
  role: 'user' | 'assistant'; 
  content: string; 
  isLoading?: boolean;
}) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm shadow-sm ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-600 rounded-bl-md'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-gray-600 dark:text-slate-300">Thinking...</span>
          </div>
        ) : (
          <div className={`leading-relaxed ${isUser ? 'text-white' : 'text-gray-900'}`}>
            <ReactMarkdown
              components={{
                // Headings
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                
                // Paragraphs with proper spacing
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                
                // Lists
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                
                // Code
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                        isUser 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className={`p-3 rounded-lg text-xs font-mono overflow-x-auto mt-2 mb-2 ${
                      isUser 
                        ? 'bg-white/10 text-white' 
                        : 'bg-gray-100 text-gray-800 border'
                    }`}>
                      <code>{children}</code>
                    </pre>
                  );
                },
                
                // Emphasis
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                
                // Links
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`underline hover:no-underline ${
                      isUser ? 'text-white' : 'text-primary-600 hover:text-primary-700'
                    }`}
                  >
                    {children}
                  </a>
                ),
                
                // Blockquotes
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-4 pl-3 italic ${
                    isUser 
                      ? 'border-white/30 text-white/90' 
                      : 'border-gray-300 text-gray-700'
                  }`}>
                    {children}
                  </blockquote>
                ),
                
                // Tables
                table: ({ children }) => (
                  <div className="overflow-x-auto mt-2 mb-2">
                    <table className={`min-w-full text-xs border-collapse ${
                      isUser ? 'border-white/20' : 'border-gray-200'
                    }`}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className={`border px-2 py-1 text-left font-semibold ${
                    isUser 
                      ? 'border-white/20 bg-white/10' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className={`border px-2 py-1 ${
                    isUser ? 'border-white/20' : 'border-gray-200'
                  }`}>
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  disabled 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  onSend: () => void; 
  disabled: boolean;
}) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-xl">
      {/* Quick Actions */}
      <div className="mb-3">
        <div className="text-xs text-gray-700 dark:text-slate-300 mb-2 font-medium">Quick Actions:</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange('Suggest failure modes for this asset')}
            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full transition-all duration-200 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 shadow-sm hover:shadow"
          >
            <Sparkles className="w-3 h-3 inline mr-1.5 text-accent" />
            Suggest Modes
          </button>
          <button
            onClick={() => onChange('Explain risk assessment and RPN calculation')}
            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full transition-all duration-200 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 shadow-sm hover:shadow"
          >
            <AlertTriangle className="w-3 h-3 inline mr-1.5 text-accent" />
            Risk Help
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about FMEA, risk analysis, or reliability engineering..."
            className="w-full resize-none border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
            rows={2}
            disabled={disabled}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="flex-shrink-0 w-12 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-slate-400 mt-2 px-1">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}

function ChatWindow() {
  const { aiChatMinimized, aiChatPosition, setAiChatMinimized, setAiChatPosition } = useUI();
  const { currentProject } = useProject();
  const { token } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m NextGenMint AI, your reliability engineering assistant. I can help you with failure mode analysis, risk assessment, FMEA best practices, and reliability engineering topics. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            currentProject,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'AI request failed');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.data.message 
      }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error instanceof Error 
          ? `I apologize, but I'm having trouble with my AI services: ${error.message}`
          : 'I apologize, but I\'m having trouble connecting to my AI services right now. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = chatRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && chatRef.current) {
      // Convert to right/bottom positioning and ensure minimum spacing from edges
      const chatWidth = 420;
      const chatHeight = 500;
      const minMargin = 50; // Reasonable margin to prevent header cutoff
      
      const newX = Math.max(minMargin, Math.min(window.innerWidth - chatWidth - minMargin, e.clientX - dragOffset.x));
      const newY = Math.max(minMargin, Math.min(window.innerHeight - chatHeight - minMargin, e.clientY - dragOffset.y));
      
      // Convert to right/bottom positioning with safety margins
      const rightPosition = Math.max(10, window.innerWidth - newX - chatWidth);
      const bottomPosition = Math.max(10, window.innerHeight - newY - chatHeight);
      
      setAiChatPosition({ x: rightPosition, y: bottomPosition });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const toggleChat = () => {
    setAiChatMinimized(!aiChatMinimized);
  };

  return (
    <motion.div
      ref={chatRef}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 20 }}
      className="fixed z-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 backdrop-blur-sm overflow-hidden flex flex-col"
      data-tour="ai-assistant"
      style={{
        bottom: `${Math.max(10, aiChatPosition.y)}px`,
        right: `${Math.max(10, aiChatPosition.x)}px`,
        width: '420px',
        height: '500px',
        maxHeight: 'calc(100vh - 60px)',
        maxWidth: '90vw',
      }}
    >
      {/* Modern Chat Header */}
      <div
        className="flex items-center justify-between p-4 bg-accent text-white min-h-[64px] rounded-t-xl"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white truncate">NextGenMint AI</h3>
            <p className="text-primary-100 text-xs truncate">
              {currentProject ? `Helping with ${currentProject.name}` : 'Ready to help'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={toggleChat}
            className="p-2 hover:bg-red-500/20 bg-white/20 rounded-md transition-all duration-200 border border-white/30 hover:border-red-300"
            title="Close chat"
          >
            <X className="w-4 h-4 text-white drop-shadow-sm" />
          </button>
          <div
            className="p-2 cursor-move hover:bg-white/20 rounded-md transition-colors"
            onMouseDown={handleMouseDown}
            title="Drag to reposition chat"
          >
            <GripVertical className="w-4 h-4 text-white/90 drop-shadow-sm" />
          </div>
          <button
            onClick={toggleChat}
            className="p-2 hover:bg-white/30 bg-white/15 rounded-md transition-all duration-200 border border-white/20"
            title="Minimize chat"
          >
            <ChevronDown className="w-4 h-4 text-white drop-shadow-sm" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-800 min-h-0">
        <div className="space-y-1">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {isLoading && (
            <MessageBubble
              role="assistant"
              content=""
              isLoading={true}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isLoading}
      />
    </motion.div>
  );
}

export default function AIPanel() {
  const { aiChatMinimized, aiChatPosition, setAiChatMinimized } = useUI();
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const toggleChat = () => {
    setAiChatMinimized(!aiChatMinimized);
    if (!aiChatMinimized) {
      setHasNewMessage(false);
    }
  };

  // Minimized floating button
  if (aiChatMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed z-40"
        style={{
          bottom: `${aiChatPosition.y}px`,
          right: `${aiChatPosition.x}px`,
        }}
      >
        <button
          onClick={toggleChat}
          className="relative w-14 h-14 bg-accent hover:bg-accent text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center group backdrop-blur-sm"
          title="Open NextGenMint AI"
          data-tour="ai-assistant"
        >
          <Bot className="w-6 h-6" />
          
          {/* New message indicator */}
          {hasNewMessage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <div className="w-2 h-2 bg-white rounded-full" />
            </motion.div>
          )}
          
          {/* Hover tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl">
            NextGenMint AI
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-slate-700"></div>
          </div>
        </button>
      </motion.div>
    );
  }

  // Expanded chat window
  return <ChatWindow />;
}
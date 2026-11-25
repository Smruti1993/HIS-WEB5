/**
 * ChatWidget.tsx
 *
 * Floating ✨ AI Assistant chat widget for the MediCore HMS dashboard.
 * Features:
 *   - Gradient round button (blue to violet) with Sparkles icon, toggling to X.
 *   - Slide-in panel (380px x 520px) with auto-scroll.
 *   - Suggested prompts when the chat is empty.
 *   - Markdown table and list support.
 *   - In-memory conversation state only (no localStorage).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Trash2, Bot, ArrowDownCircle } from 'lucide-react';
import { useChatApi } from './useChatApi';
import { ChatMessage } from './ChatMessage';

const SUGGESTED_PROMPTS = [
  'Show allergies for patient',
  'Latest vitals of patient',
  'How many appointments today?',
  'List active doctors',
];

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages, confirmAction } = useChatApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-slate-800 hover:bg-slate-900 rotate-90'
              : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-blue-500/25 hover:shadow-indigo-500/40'
          }`}
          title={isOpen ? 'Close Assistant' : 'Open AI Assistant'}
          aria-label={isOpen ? 'Close Assistant' : 'Open AI Assistant'}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <Sparkles className="w-6 h-6 animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[390px] h-[540px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-7rem)] bg-slate-50 rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">MediCore Assistant</h3>
                <p className="text-[11px] text-blue-100/90 leading-tight">Hospital AI Knowledge Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">How can I assist you today?</h4>
                <p className="text-xs text-slate-500 max-w-[260px] mb-5">
                  Ask about patient records, vitals, allergies, doctor schedules, or hospital statistics.
                </p>

                {/* Suggested Prompts */}
                <div className="w-full space-y-1.5 text-left">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                    Suggested prompts
                  </span>
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 text-xs rounded-xl border border-slate-200/70 hover:border-blue-200 shadow-sm transition-all flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <Sparkles className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onConfirmAction={confirmAction}
                  />
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2.5 my-2 text-slate-500">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2 shadow-sm text-xs flex items-center gap-2 text-slate-600">
                      <span>Searching records...</span>
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-slate-200/80">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 border border-transparent transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask assistant or search data..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-all shrink-0 shadow-sm"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex justify-between items-center px-1 pt-1.5 text-[10px] text-slate-400">
              <span>Powered by Gemini • Free tier</span>
              <span>Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


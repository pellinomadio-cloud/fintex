import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, User, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your UXtrade AI Assistant. Ask me anything about how UXtrade works, trading bots, account verification tiers, deposits, or virtual cards! How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "How do Trading Bots work?",
    "How do I upgrade to Tier 2?",
    "What are the deposit methods?",
    "How can I get a virtual card?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10) // Send recent message history for context
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.text || "I apologize, but I could not process your request at this moment. Please try again."
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered a connection error. Please make sure the server is configured and try again. Note: credit/debit card support has been fully retired in favor of secure bank transfers and USDT deposits."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end" id="ux-ai-assistant-wrapper">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="w-[90vw] sm:w-[380px] h-[500px] bg-white dark:bg-[#0F1524] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col overflow-hidden mb-4"
            id="ux-ai-assistant-card"
          >
            {/* Header */}
            <div className="p-4 bg-brand-dark text-white flex items-center justify-between" id="ai-assistant-header">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                  <Bot className="w-5 h-5 text-sky-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-display font-black text-xs uppercase tracking-wider">UXtrade Support</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Online Assistant</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                id="ai-assistant-btn-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="ai-assistant-messages-list">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  id={`ai-msg-row-${index}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/45 text-brand-primary flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className="max-w-[78%]">
                    <div
                      className={`p-3 rounded-2xl text-[11.5px] leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-brand-medium text-white rounded-tr-none"
                          : "bg-slate-50 dark:bg-[#0C111D] text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-brand-medium text-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-2.5 justify-start" id="ai-assistant-thinking-indicator">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/45 text-brand-primary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[#0C111D] text-slate-400 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Assistant is drafting response...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions list (shown only when messages count is low or not loading) */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 pb-2 pt-1 border-t border-slate-50 dark:border-white/5" id="ai-assistant-suggestions">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Suggested Questions</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-[10px] px-2.5 py-1.5 bg-slate-50 dark:bg-[#0C111D] border border-slate-100 dark:border-white/5 rounded-xl hover:bg-brand-medium/5 hover:border-brand-primary/20 hover:text-brand-primary dark:text-slate-300 transition-all text-left cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#0B0F19] flex items-center gap-2"
              id="ai-assistant-input-form"
            >
              <input
                type="text"
                placeholder="Ask concerning UXtrade..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-white dark:bg-[#0C111D] border border-slate-150 dark:border-white/5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-brand-primary disabled:opacity-60"
                id="ai-assistant-msg-input"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-9 h-9 rounded-2xl bg-brand-dark hover:bg-brand-medium text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                id="ai-assistant-btn-send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-brand-dark hover:bg-brand-medium text-white rounded-full shadow-2xl border border-white/10 transition-all cursor-pointer scale-100 active:scale-95 group"
        id="ux-ai-assistant-toggle"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 group-hover:scale-105 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border border-brand-dark animate-pulse"></span>
        </div>
        <span className="text-xs font-black uppercase tracking-wider">Ask AI Assistant</span>
      </button>
    </div>
  );
};

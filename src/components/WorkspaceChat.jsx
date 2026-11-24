import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Zap,
  Mail,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import ActionCard from './ActionCard';
import { runAgentWorkflow } from '../services/aiAgent';
import { db, STORAGE_KEYS, getSetting } from '../services/localDb';
import { getAuthStatus, AUTH_STATUS } from '../services/googleAuth';

const QUICK_CHIPS = [
  "Summarize my unread emails today & list urgent tasks",
  "Draft polite replies for unanswered emails from the last 24h",
  "Find all invoices/receipts this month and summarize totals",
  "Clean up & archive promotional unread emails"
];

function extractConsoleUrl(text) {
  if (!text) return null;
  const match = text.match(/https:\/\/(?:console\.developers\.google\.com|console\.cloud\.google\.com)\/[^\s)>]+/i);
  return match ? match[0] : null;
}

// Ensure all sanitized links open safely in a new tab
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

function renderMarkdownHtml(text) {
  if (!text) return '';
  const rawHtml = marked.parse(text, {
    breaks: true,
    gfm: true
  });
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target', 'rel']
  });
}

function renderUserContent(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s<)]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-50 hover:text-white underline decoration-emerald-200/80 font-medium break-all inline-flex items-center gap-0.5"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0" />
        </a>
      );
    }
    return part;
  });
}

export default function WorkspaceChat({
  externalPrompt,
  onClearExternalPrompt,
  onOpenConnector,
  onOpenSettings,
  onRunningChange
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat history from IndexedDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await db.messages.orderBy('timestamp').toArray();
        if (stored.length > 0) {
          setMessages(stored);
        } else {
          // Welcome greeting
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Salam! Saya pembantu AI **malas** (OpenWork Lite) untuk mengurus emel Gmail anda secara 100% dari pelayar (browser) tanpa pelayan luar.\n\nPilih salah satu *Quick Workflow* di bawah atau tanya apa sahaja mengenai emel anda!`,
              actionCards: []
            }
          ]);
        }
      } catch (e) {
        console.warn('Error loading chat history:', e);
      }
    };
    loadHistory();
  }, []);

  // Sync running state to parent if needed
  useEffect(() => {
    if (onRunningChange) onRunningChange(isRunning);
  }, [isRunning, onRunningChange]);

  // Trigger from sidebar or mobile workflow preset
  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
      setTimeout(() => {
        handleSend(externalPrompt);
      }, 100);
    }
  }, [externalPrompt]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStep]);

  const handleSend = async (overridePrompt = null) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || isRunning) return;

    // Check prerequisites
    const authStatus = getAuthStatus();
    if (authStatus !== AUTH_STATUS.CONNECTED) {
      const warningMsg = {
        id: Date.now(),
        role: 'assistant',
        content: `⚠️ **Google Workspace belum disambungkan atau token telah tamat tempoh.**\n\nSila klik butang **Connect Google** di bahagian atas atau buka menu Sambungan untuk sambungkan akaun Gmail anda.`,
        actionCards: []
      };
      setMessages(prev => [...prev, warningMsg]);
      return;
    }

    const apiKey = getSetting(STORAGE_KEYS.AI_API_KEY, '');
    const provider = getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini');
    if (!apiKey) {
      const warningMsg = {
        id: Date.now(),
        role: 'assistant',
        content: `⚠️ **Kunci API ${provider.toUpperCase()} belum dimasukkan.**\n\nSila buka **Tetapan Kunci API & Model** di bahagian bawah untuk memasukkan Kunci API dan menarik senarai model yang sedia ada.`,
        actionCards: []
      };
      setMessages(prev => [...prev, warningMsg]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString()
    };

    // Store in DB & state
    setMessages(prev => [...prev, userMessage]);
    try {
      await db.messages.add(userMessage);
    } catch (e) {}

    setInput('');
    setIsRunning(true);
    setCurrentStep({ type: 'start', message: 'Memulakan AI Agent...' });

    try {
      // Build conversation context
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const result = await runAgentWorkflow({
        userPrompt: textToSend.trim(),
        history: chatHistory,
        onStepUpdate: (step) => {
          setCurrentStep(step);
        }
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.content,
        actionCards: result.actionCards || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      try {
        await db.messages.add(assistantMessage);
      } catch (e) {}

    } catch (err) {
      console.error('Workflow error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `❌ **Ralat Semasa Melaksanakan Tugasan:**\n\`${err.message}\`\n\nSila pastikan API Key (Gemini/OpenAI) dan sambungan Google Workspace anda sah.`,
        actionCards: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditDraft = (text) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-900/40 relative overflow-hidden">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 text-xs sm:text-sm shadow-md mt-0.5 ${
              msg.role === 'user'
                ? 'bg-slate-700 text-slate-200'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>

            {/* Bubble */}
            <div className={`min-w-0 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed overflow-hidden break-words ${
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-sm shadow-lg shadow-emerald-600/10'
                : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
            }`}>
              {/* Message text: plain + links for user, sanitized Markdown for assistant */}
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap break-words">
                  {renderUserContent(msg.content)}
                </div>
              ) : (
                <div
                  className="chat-markdown prose prose-invert prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(msg.content) }}
                />
              )}

              {/* Detected Gmail API Disabled Warning Card */}
              {(() => {
                const consoleUrl = extractConsoleUrl(msg.content);
                const isApiDisabledMsg =
                  msg.role === 'assistant' &&
                  (Boolean(consoleUrl) ||
                   msg.content.includes('Gmail API tidak didayakan') ||
                   msg.content.includes('Gmail API belum didayakan') ||
                   msg.content.includes('Gmail API has not been used'));

                if (!isApiDisabledMsg) return null;

                const targetUrl = consoleUrl || `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=1077153893867`;

                return (
                  <div className="mt-3.5 p-3.5 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Tindakan Diperlukan: Dayakan Gmail API</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-normal">
                      Akaun Google anda sudah berjaya bersambung, tetapi perkhidmatan <b>Gmail API</b> belum diaktifkan dalam projek Google Cloud ini.
                    </p>
                    <div className="pt-1">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition"
                      >
                        <span>Buka Google Cloud Console & Dayakan API</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      💡 Selepas klik <b>ENABLE</b> di Google Cloud Console, tunggu 1-2 minit dan anda boleh terus bertanya semula kepada AI di sini tanpa perlu log keluar.
                    </p>
                  </div>
                );
              })()}

              {/* Action Cards (Draft / Confirm Send) */}
              {msg.actionCards && msg.actionCards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.actionCards.map((card, idx) => (
                    <ActionCard key={idx} card={card} onEdit={handleEditDraft} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Real-time Agent Step Indicator */}
        {isRunning && currentStep && (
          <div className="flex items-center gap-2.5 mr-auto max-w-md p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 text-xs shadow-lg animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            <div className="flex-1 truncate font-mono">
              {currentStep.message || 'Processing...'}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Quick Chips Area */}
      <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md shrink-0">
        
        {/* Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Quick:
          </span>
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isRunning}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition shrink-0 whitespace-nowrap active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-800 focus-within:border-emerald-500/60 rounded-2xl p-1.5 sm:p-2 transition shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis arahan emel (cth: 'Ringkaskan emel unread harini')..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm p-1.5 outline-none resize-none max-h-32 min-h-[38px]"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isRunning}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-950 rounded-xl transition shadow-md shadow-emerald-500/20 shrink-0"
            title="Hantar Arahan"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 px-1">
          <span className="hidden sm:inline">Enter untuk hantar &bull; Shift + Enter untuk baris baru</span>
          <span className="sm:hidden">100% Client-Side Agent</span>
          <span className="hidden sm:inline">100% Client-Side Direct Execution</span>
        </div>

      </div>

    </div>
  );
}

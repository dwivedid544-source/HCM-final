import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Brain, User, Loader2,
  RotateCcw, ChevronRight, Zap, MessageSquare,
  Copy, Check, AlertCircle, ArrowUpRight, Calendar,
  ShieldCheck, WifiOff, CornerDownLeft, RefreshCw
} from 'lucide-react';
import { aiCopilotAPI } from '../../../utils/apiService';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { cn } from '../../../utils/cn';

// ── Role & Route-Aware Fallback Suggested Prompts ─────────────────
const getStaticRoleSuggestedPrompts = (role = 'EMPLOYEE', pathname = '') => {
  const normRole = (role || 'EMPLOYEE').toUpperCase();
  const path = (pathname || '').toLowerCase();

  // Route-specific prompts
  if (path.includes('/leaves') || path.includes('/leave')) {
    if (['MANAGER', 'ADMIN', 'HR', 'SUPERADMIN'].includes(normRole)) {
      return [
        'Who has pending leave requests in my team?',
        'What is my own leave balance?',
        'How many total leave requests are pending approval?',
        'Show standard leave policies and quotas'
      ];
    }
    return [
      'What is my leave balance?',
      'Show my pending leave requests',
      'How many annual leave days do I have remaining?',
      'How do I apply for casual or sick leave?'
    ];
  }

  if (path.includes('/payroll') || path.includes('/compensation')) {
    if (['ADMIN', 'SUPERADMIN', 'HR'].includes(normRole)) {
      return [
        'Summarize active payroll cycles and payout metrics',
        'Show pending increment requests',
        'How many employees are on custom salary structures?',
        'What is our total monthly payroll commitment?'
      ];
    }
    return [
      'Explain my latest payslip',
      'What deductions were applied to my salary?',
      'What is my monthly CTC and compensation?',
      'When is the next salary disbursement date?'
    ];
  }

  if (path.includes('/attendance')) {
    if (['MANAGER', 'ADMIN', 'HR', 'SUPERADMIN'].includes(normRole)) {
      return [
        'Summarize team attendance and clock-ins today',
        'Who was marked late today?',
        'How many employees are currently checked in?',
        'Show monthly shift schedule distribution'
      ];
    }
    return [
      'Show my recent attendance punch logs',
      'What are my shift hours this week?',
      'Am I marked late for any recent days?',
      'How do I request an attendance punch correction?'
    ];
  }

  if (path.includes('/candidates') || path.includes('/pipeline') || path.includes('/jobs')) {
    if (normRole === 'CANDIDATE') {
      return [
        'What is the status of my job applications?',
        'When is my next interview scheduled?',
        'Show available open job opportunities',
        'How can I improve my AI resume score?'
      ];
    }
    return [
      'Show recruitment pipeline and application count',
      'How many candidates are currently in screening?',
      'Which job openings are currently active?',
      'Upcoming interview schedules this week'
    ];
  }

  if (path.includes('/team')) {
    return [
      'Who is on my direct team?',
      'Who has pending leave requests in my team?',
      'Summarize team attendance today',
      'Show team performance goals and deliverables'
    ];
  }

  // Default role-specific prompts
  switch (normRole) {
    case 'SUPERADMIN':
      return [
        'Show platform organization metrics and tenant growth',
        'What is the current system health and status?',
        'How many active users are registered across all tenants?',
        'Summarize global subscription tiers and revenue'
      ];

    case 'ADMIN':
      return [
        'Summarize organization workforce metrics',
        'Show pending leave and reimbursement approvals',
        'What is our department and headcount distribution?',
        'Overview of active payroll cycles and policies'
      ];

    case 'HR':
      return [
        'Show recruitment pipeline summary',
        'What is our total organization headcount?',
        'Upcoming interview schedules this week',
        'Pending employee onboarding and clearance tasks'
      ];

    case 'MANAGER':
      return [
        'Team attendance summary today',
        'Who has pending leave requests in my team?',
        'Direct reports and team performance overview',
        'What is my own leave balance?'
      ];

    case 'CANDIDATE':
      return [
        'What is the status of my job applications?',
        'When is my next interview scheduled?',
        'Browse open job positions',
        'How to update my candidate profile details?'
      ];

    default: // EMPLOYEE
      return [
        'What is my leave balance?',
        'Explain my latest payslip',
        'Show my attendance punch logs this week',
        'What are my active performance goals?'
      ];
  }
};

// ── Inline Markdown Formatter ────────────────────────────────────
const parseInlineStyles = (text) => {
  if (typeof text !== 'string') return text;
  
  let parts = [text];

  const applyRegex = (regex, wrapperFn) => {
    let newParts = [];
    for (let part of parts) {
      if (typeof part !== 'string') {
        newParts.push(part);
        continue;
      }
      let match;
      let lastIdx = 0;
      while ((match = regex.exec(part)) !== null) {
        if (match.index > lastIdx) {
          newParts.push(part.substring(lastIdx, match.index));
        }
        newParts.push(wrapperFn(match[1]));
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < part.length) {
        newParts.push(part.substring(lastIdx));
      }
    }
    parts = newParts;
  };

  applyRegex(/\*\*(.*?)\*\*/g, (txt) => <strong key={txt} className="font-extrabold">{txt}</strong>);
  applyRegex(/\*(.*?)\*/g, (txt) => <em key={txt} className="italic">{txt}</em>);
  applyRegex(/`(.*?)`/g, (txt) => (
    <code key={txt} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/60">
      {txt}
    </code>
  ));

  return parts;
};

// ── Markdown Block Renderer (Headings, Lists, Tables) ────────────
const parseMarkdownContent = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let currentList = [];
  let isBulletList = false;
  let isNumList = false;
  let isTable = false;
  let tableHeader = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Markdown Headings
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={`h3-${i}`} className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-2.5 mb-1 text-left">
          <Sparkles size={12} className="text-indigo-500 shrink-0" />
          <span>{line.replace('### ', '')}</span>
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={`h2-${i}`} className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 mb-1 text-left">
          {line.replace('## ', '')}
        </h3>
      );
      continue;
    }

    // Markdown Table
    if (line.startsWith('|')) {
      isTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      if (line.includes('---') || line.includes('===') || cells.every(c => c === '')) {
        continue;
      }
      
      if (tableHeader.length === 0) {
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (isTable) {
      blocks.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-[11px] hcm-table text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/90 hcm-thead">
              <tr className="hcm-tr">
                {tableHeader.map((th, hIdx) => (
                  <th key={hIdx} className="px-3 py-2 font-bold text-slate-600 dark:text-slate-300">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-900">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5">{parseInlineStyles(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      isTable = false;
      tableHeader = [];
      tableRows = [];
    }

    // Lists
    const bulletMatch = line.match(/^[\-\*]\s+(.+)/);
    const numMatch = line.match(/^\d+\.\s+(.+)/);

    if (bulletMatch) {
      if (isNumList) {
        blocks.push(<ol key={`ol-${i}`} className="list-decimal pl-4 space-y-1 my-1.5 text-left text-xs">{currentList}</ol>);
        currentList = [];
        isNumList = false;
      }
      isBulletList = true;
      currentList.push(
        <li key={`li-${i}`} className="text-slate-700 dark:text-slate-200">
          {parseInlineStyles(bulletMatch[1])}
        </li>
      );
      continue;
    } else if (numMatch) {
      if (isBulletList) {
        blocks.push(<ul key={`ul-${i}`} className="list-disc pl-4 space-y-1 my-1.5 text-left text-xs">{currentList}</ul>);
        currentList = [];
        isBulletList = false;
      }
      isNumList = true;
      currentList.push(
        <li key={`li-${i}`} className="text-slate-700 dark:text-slate-200">
          {parseInlineStyles(numMatch[1])}
        </li>
      );
      continue;
    } else {
      if (isBulletList) {
        blocks.push(<ul key={`ul-${i}`} className="list-disc pl-4 space-y-1 my-1.5 text-left text-xs">{currentList}</ul>);
        currentList = [];
        isBulletList = false;
      }
      if (isNumList) {
        blocks.push(<ol key={`ol-${i}`} className="list-decimal pl-4 space-y-1 my-1.5 text-left text-xs">{currentList}</ol>);
        currentList = [];
        isNumList = false;
      }

      if (line.trim().length > 0) {
        blocks.push(
          <p key={`p-${i}`} className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 my-1 text-left">
            {parseInlineStyles(line)}
          </p>
        );
      }
    }
  }

  if (isBulletList && currentList.length > 0) {
    blocks.push(<ul key={`ul-end`} className="list-disc pl-4 space-y-1 my-1.5 text-left text-xs">{currentList}</ul>);
  }
  if (isNumList && currentList.length > 0) {
    blocks.push(<ol key={`ol-end`} className="list-decimal pl-4 space-y-1 my-1.5 text-left text-xs">{currentList}</ol>);
  }

  return blocks;
};

// ── Message Bubble Component ─────────────────────────────────────
const MessageBubble = ({ msg, onActionClick, onRetry }) => {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!msg.content) return;
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 group w-full`}
    >
      <div className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-0.5 ${
          isUser
            ? 'bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-primary-500/20'
            : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white shadow-indigo-500/20'
        }`}>
          {isUser ? <User size={13} /> : <Sparkles size={13} />}
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-xs text-left relative min-w-0 max-w-full break-words border ${
          isUser
            ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none'
            : msg.isError
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 rounded-tl-none'
            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
        }`}>
          {isUser ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium break-words text-white">{msg.content}</p>
          ) : (
            <div className="space-y-1.5 min-w-0 break-words">
              {parseMarkdownContent(msg.content)}

              {/* Action Link Chips */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                  {msg.actions.map((act, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onActionClick(act.route)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] transition-all border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <span>{act.label}</span>
                      <ArrowUpRight size={11} className="shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Error Retry Option */}
              {msg.isError && msg.retryText && (
                <div className="pt-2 mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Failed to process</span>
                  <button
                    type="button"
                    onClick={() => onRetry(msg.retryText)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Assistant Action Bar (Copy Button) */}
          {!isUser && !msg.isError && (
            <div className="flex justify-end pt-1 -mb-1">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy response"
                aria-label="Copy response"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span className="text-[9px] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp and Verification Meta */}
      <div className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium ${isUser ? 'pr-9' : 'pl-9'}`}>
        <span>{msg.timestamp}</span>
        {!isUser && !msg.isError && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck size={11} />
            Verified DB Context
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ── Typing Indicator ─────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-2.5 pl-2 py-1 text-left">
    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
      <Loader2 size={13} className="animate-spin" />
    </div>
    <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1.5">Consulting enterprise database...</span>
    </div>
  </div>
);

// ── Main Copilot Component ───────────────────────────────────────
const AICopilot = () => {
  const [isOpen, setIsOpen]                 = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages]             = useState([]);
  const [input, setInput]                   = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState(null);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const panelRef       = useRef(null);
  const location       = useLocation();
  const navigate       = useNavigate();
  const { user, effectiveRole } = useAuth();

  const userRole = (effectiveRole || user?.role || 'EMPLOYEE').toUpperCase();
  const userName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'User';

  // Format Panel & Page labels
  const contextDetails = useMemo(() => {
    const path = location.pathname || '/';
    const parts = path.split('/').filter(Boolean);
    const panel = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'General';
    const page = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ') || 'Dashboard';
    return { panel, page, fullLabel: `${panel} / ${page}` };
  }, [location.pathname]);

  // Initial Welcome Message Generator
  const createWelcomeMessage = useCallback(() => ({
    role: 'assistant',
    content: `Hello **${userName}**! I am your **HCM.ai Copilot** — your enterprise HR and operations assistant.\n\nEvery response is grounded in your verified account data and real-time database records.\n\nHow can I help you in **${contextDetails.fullLabel}** today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actions: []
  }), [userName, contextDetails.fullLabel]);

  // Initialize messages on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([createWelcomeMessage()]);
    }
  }, [createWelcomeMessage, messages.length]);

  // Load dynamic suggested questions on mount and path change
  useEffect(() => {
    let isMounted = true;
    const fallbackPrompts = getStaticRoleSuggestedPrompts(userRole, location.pathname);

    aiCopilotAPI.getSuggestions({ role: userRole, page: location.pathname })
      .then(res => {
        if (isMounted && res.data?.data?.suggestions && Array.isArray(res.data.data.suggestions)) {
          setDynamicSuggestions(res.data.data.suggestions);
        } else if (isMounted) {
          setDynamicSuggestions(fallbackPrompts);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDynamicSuggestions(fallbackPrompts);
        }
      });

    return () => { isMounted = false; };
  }, [userRole, location.pathname]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Click outside listener for desktop
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target)) {
        if (window.innerWidth >= 768) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { role: 'user', content: text, timestamp: nowStr };
    setMessages(prev => [...prev, userMessage]);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const response = await aiCopilotAPI.chat({
        message: text,
        conversationId,
        history,
        pageContext: location.pathname,
        context: {
          role: userRole,
          module: contextDetails.panel,
          page: location.pathname
        }
      });

      const resData = response.data?.data || response.data || {};
      const answer = resData.answer || resData.reply || 'I was unable to retrieve a response. Please try again.';
      const actions = resData.actions || [];
      const newConvId = resData.conversationId || conversationId;
      
      if (newConvId) {
        setConversationId(newConvId);
      }

      if (resData.suggestions && Array.isArray(resData.suggestions) && resData.suggestions.length > 0) {
        setDynamicSuggestions(resData.suggestions);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions,
          intent: resData.metadata?.intent || resData.intent
        }
      ]);
    } catch (err) {
      console.error('[Copilot Frontend Error]:', err);
      const errMsg = err?.response?.status === 401
        ? 'Your session expired. Please log in again.'
        : err?.response?.status === 403
        ? 'You are not authorized to perform this operation.'
        : 'Unable to process request. Please check your network connection and try again.';

      setError({ message: errMsg, lastAttempt: text });
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          retryText: text
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setConversationId(null);
    setMessages([createWelcomeMessage()]);
    setError(null);
    const fallbackPrompts = getStaticRoleSuggestedPrompts(userRole, location.pathname);
    setDynamicSuggestions(fallbackPrompts);
  };

  const handleActionNavigate = (route) => {
    if (route) {
      navigate(route);
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* ── Floating AI Trigger Button ──────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9990]">
            <motion.button
              type="button"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen(true)}
              title="Open HCM.ai Copilot"
              aria-label="Open HCM.ai Copilot"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-white/25 cursor-pointer relative group transition-all"
            >
              <span className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-pulse pointer-events-none" />
              <Brain size={24} className="group-hover:rotate-12 transition-transform duration-300" />
              
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Copilot Right Sliding Panel / Fullscreen Mobile Modal ─────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile & tablet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9990]"
            />

            {/* Right-Anchored Panel (Full on Mobile, 440px-480px on Desktop) */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 right-0 z-[9995] w-full sm:max-w-[440px] md:max-w-[460px] lg:max-w-[480px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 text-left"
            >
              {/* ── Fixed Header ───────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shrink-0 border-b border-indigo-800/40 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Sparkles className="text-white animate-pulse" size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white tracking-tight">HCM.ai Copilot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        isOnline ? "bg-emerald-400 shadow-sm animate-pulse" : "bg-rose-400"
                      )} />
                      <span className="text-[10px] font-bold text-indigo-100 tracking-wide">
                        {isOnline ? `Online · ${userRole} Engine` : 'Offline Mode'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Reset Conversation"
                    aria-label="Reset Conversation"
                    className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/15 transition-all focus:outline-none min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close Copilot"
                    aria-label="Close Copilot"
                    className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/15 transition-all focus:outline-none min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* ── Context Breadcrumb Bar ─────────────────────────────── */}
              <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap size={12} className="text-primary-500 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    Context: <span className="font-bold text-slate-800 dark:text-slate-200">{contextDetails.fullLabel}</span>
                  </span>
                </div>
                <Badge variant="primary" size="sm" className="shrink-0 font-extrabold">
                  {userRole}
                </Badge>
              </div>

              {/* ── Offline Warning Bar ────────────────────────────────── */}
              {!isOnline && (
                <div className="px-4 py-1.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs shrink-0">
                  <WifiOff size={13} className="shrink-0" />
                  <span className="font-semibold text-[11px]">You are offline. Responses will use local caching.</span>
                </div>
              )}

              {/* ── Scrollable Messages Area ───────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/60 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    msg={msg}
                    onActionClick={handleActionNavigate}
                    onRetry={handleSend}
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Dynamic Suggested Questions Section ────────────────── */}
              <AnimatePresence>
                {messages.length <= 2 && !isLoading && dynamicSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800/80 shrink-0"
                  >
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 text-left">
                      <MessageSquare size={11} className="text-primary-500" /> Suggested Questions
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {dynamicSuggestions.slice(0, 4).map((promptText, idx) => (
                        <motion.button
                          key={idx}
                          type="button"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleSend(promptText)}
                          className="group flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-white dark:bg-slate-900/90 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700/60 shadow-2xs transition-all text-left cursor-pointer active:scale-98"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Zap size={12} className="text-primary-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{promptText}</span>
                          </div>
                          <ChevronRight size={13} className="text-slate-400 group-hover:text-primary-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Error Banner ───────────────────────────────────────── */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 text-rose-700 dark:text-rose-300 text-xs shrink-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle size={14} className="shrink-0 text-rose-600" />
                      <span className="truncate text-[11px] font-medium">{error.message}</span>
                    </div>
                    {error.lastAttempt && (
                      <button
                        type="button"
                        onClick={() => handleSend(error.lastAttempt)}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 transition-colors cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Fixed Chat Input Composer ──────────────────────────── */}
              <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all p-1.5">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask HCM Copilot anything..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none px-2.5 py-1.5 max-h-32 min-h-[36px] font-medium leading-relaxed"
                    style={{ height: '36px' }}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    aria-label="Send message"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                  >
                    {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </motion.button>
                </div>
                <div className="flex justify-between items-center px-1 mt-2 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                  <span>
                    Press <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[8px] font-mono border border-slate-200/60 dark:border-slate-700/60">Enter</kbd> to send · <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[8px] font-mono border border-slate-200/60 dark:border-slate-700/60">Shift+Enter</kbd> line
                  </span>
                  <span>ESC to close</span>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICopilot;

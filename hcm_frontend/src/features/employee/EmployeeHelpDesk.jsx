import React, { useState, useRef, useEffect } from 'react';
import api, { getBackendURL, uploadAPI } from '../../utils/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LifeBuoy, Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, X, MessageSquare, 
  User, Paperclip, Send, ChevronRight, ShieldCheck, Monitor, CreditCard, Zap, Calendar, 
  MessageCircle, Hash, ArrowRight, Star, Trash, Sparkles, Copy, Check, RefreshCw, HelpCircle, FileText, Bot,
  Headphones, CheckCheck, Download, Building2, ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDateFormat } from '../../hooks/useDateFormat';
import { useEmployee } from '../../hooks/useEmployee';
import { StatCard, PrimaryButton, SecondaryButton, DangerButton, StatusBadge, DataTable, SearchBar, FilterDropdown, Modal, CardContainer } from '../../components/common';
import CenterModal from '../../shared/components/layout/CenterModal';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import { validateFile } from '../../utils/fileValidator';

// Simple Markdown Formatter Helper
const PolicyMarkdown = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        
        if (trimmed.startsWith('# ')) {
          return <h3 key={idx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">{trimmed.replace('# ', '')}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h4 key={idx} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pt-1">{trimmed.replace('## ', '')}</h4>;
        }
        if (trimmed.startsWith('### ')) {
          return <h5 key={idx} className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-0.5">{trimmed.replace('### ', '')}</h5>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-indigo-500 font-bold leading-tight">•</span>
              <span className="flex-1">{renderFormattedText(trimmed.substring(2))}</span>
            </div>
          );
        }
        return <p key={idx}>{renderFormattedText(trimmed)}</p>;
      })}
    </div>
  );
};

const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const EmployeeHelpDesk = () => {
  const { profile, tickets, createTicket, replyTicket, deleteTicketMessage, showToast, loading, error, refetchAll } = useEmployee();
  const { formatDate } = useDateFormat();
  const [activeTab, setActiveTab] = usePersistedTab('emp_helpdesk', 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [createAttachmentBase64, setCreateAttachmentBase64] = useState(null);
  const [createAttachmentName, setCreateAttachmentName] = useState('');
  const fileInputRef = useRef(null);
  const createFileInputRef = useRef(null);

  // New Support Ticket Form State & Handlers
  const defaultTicketForm = {
    subject: '',
    category: 'IT Support',
    priority: 'Low',
    description: '',
  };
  const [newTicketForm, setNewTicketForm] = useState(defaultTicketForm);

  const handleOpenNewTicketModal = () => {
    setNewTicketForm(defaultTicketForm);
    setCreateAttachmentBase64(null);
    setCreateAttachmentName('');
    if (createFileInputRef.current) createFileInputRef.current.value = '';
    setIsNewTicketModalOpen(true);
  };

  const handleCloseNewTicketModal = () => {
    if (!isSubmitting) {
      setIsNewTicketModalOpen(false);
    }
  };

  // ── AI Policy Assistant State ─────────────────────────────
  const [isPolicyDrawerOpen, setIsPolicyDrawerOpen] = useState(false);
  const [policyInput, setPolicyInput] = useState('');
  const [policyMessages, setPolicyMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hi! I'm your **HCM.ai Policy Assistant**. I can help you understand company policies, employee handbook rules, leave quotas, attendance rules, benefits, and more.\n\nWhat would you like to know today?",
      confidence: 1.0,
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const policyChatEndRef = useRef(null);
  const policyInputRef = useRef(null);

  const suggestedQuestions = [
    "What is the WFH policy?",
    "How many leaves can I take?",
    "What is the attendance policy?",
    "What is the notice period?",
    "What are the working hours?",
    "What is the overtime policy?",
    "How does medical insurance work?",
    "What is the maternity/paternity policy?"
  ];

  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets]);

  const ticketChatEndRef = useRef(null);

  useEffect(() => {
    if (selectedTicket) {
      const timer = setTimeout(() => {
        ticketChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedTicket, selectedTicket?.messages]);

  const checkIsMe = (sender) => {
    if (!sender) return false;
    if (typeof sender === 'string') {
      const s = sender.toLowerCase().trim();
      const myEmail = (profile?.email || '').toLowerCase().trim();
      const myName = (profile?.fullName || '').toLowerCase().trim();
      if (s === myEmail || s === myName || s === 'you' || s === 'employee') return true;
      if (['hr', 'admin', 'superadmin', 'support', 'support agent', 'manager'].includes(s)) return false;
      return Boolean((myEmail && s.includes(myEmail)) || (myName && s.includes(myName)));
    }
    if (typeof sender === 'object') {
      if (profile?.id && sender.id === profile.id) return true;
      if (profile?.userId && (sender.userId === profile.userId || sender.id === profile.userId)) return true;
      if (profile?.email && sender.email === profile.email) return true;
      if (sender.role === 'EMPLOYEE' && !sender.role?.includes('HR')) return true;
    }
    return false;
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleAttachmentClick = (url, name = 'attachment') => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scroll to bottom of AI chat
  useEffect(() => {
    if (isPolicyDrawerOpen) {
      policyChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => policyInputRef.current?.focus(), 150);
    }
  }, [policyMessages, isPolicyDrawerOpen, policyLoading]);

  // Handle ESC key for policy drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPolicyDrawerOpen) {
        setIsPolicyDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPolicyDrawerOpen]);

  const getSenderName = (sender) => {
    if (!sender) return 'Support Agent';
    if (typeof sender === 'string') return sender;
    if (typeof sender === 'object') {
      if (sender.name) return String(sender.name);
      if (sender.employeeProfile) {
        const p = sender.employeeProfile;
        const full = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        if (full) return full;
      }
      return String(sender.email || sender.role || 'Support Agent');
    }
    return String(sender);
  };

  const getMessageText = (msg) => {
    const raw = msg?.text || msg?.content || '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') return JSON.stringify(raw);
    return String(raw);
  };

  const getFriendlyStatus = (status) => {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'OPEN') return 'Open';
    if (s === 'IN_PROGRESS') return 'In Progress';
    if (s === 'RESOLVED') return 'Resolved';
    return status;
  };

  // Derive description and first attachment from the first message (DB schema stores description as first TicketMessage)
  const getTicketDescription = (ticket) => {
    if (!ticket) return '';
    const firstMsg = ticket.messages?.[0];
    return firstMsg?.text || firstMsg?.content || '';
  };

  const getTicketAttachment = (ticket) => {
    if (!ticket) return null;
    return ticket.messages?.[0]?.attachmentUrl || null;
  };

  // Messages to render in chat (skip index 0 — already shown as the description bubble)
  const getChatMessages = (ticket) => {
    if (!ticket?.messages?.length) return [];
    return ticket.messages.slice(1);
  };

  const activeCount = tickets.filter(t => {
    const s = (t.status || '').toUpperCase();
    return s === 'OPEN' || s === 'IN_PROGRESS';
  }).length;

  const stats = [
    { label: 'Active Support', value: activeCount, icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Average Resolution', value: '2.4h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Tickets', value: tickets.length, icon: Hash, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Satisfaction', value: '98%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || getFriendlyStatus(t.status) === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const subject = newTicketForm.subject?.trim();
    const description = newTicketForm.description?.trim();
    if (!subject || !description) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createTicket({
        subject,
        category: newTicketForm.category || 'IT Support',
        priority: newTicketForm.priority || 'Low',
        description,
        attachmentBase64: createAttachmentBase64,
      });
      showToast('Support ticket registered successfully!');
      setIsNewTicketModalOpen(false);
      setNewTicketForm(defaultTicketForm);
      setCreateAttachmentBase64(null);
      setCreateAttachmentName('');
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      refetchAll();
    } catch (err) {
      // error already toasted by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const v = validateFile(file, ['pdf','doc','docx','png','jpg','jpeg','gif','mp4','zip'], 10);
    if (!v.isValid) {
      showToast(v.message, 'error');
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      return;
    }
    setCreateAttachmentName(file.name);
    try {
      const res = await uploadAPI.uploadAuto(file, 'hcm/tickets');
      const cloudUrl = res.data?.data?.url;
      if (cloudUrl) {
        setCreateAttachmentBase64(cloudUrl);
        return;
      }
    } catch (uploadErr) {
      console.warn('Direct ticket attachment upload failed, using fallback:', uploadErr.message);
    }
    const reader = new FileReader();
    reader.onloadend = () => setCreateAttachmentBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const v = validateFile(file, ['pdf','doc','docx','png','jpg','jpeg','gif','mp4','zip'], 10);
    if (!v.isValid) {
      showToast(v.message, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setAttachmentName(file.name);
    try {
      const res = await uploadAPI.uploadAuto(file, 'hcm/tickets');
      const cloudUrl = res.data?.data?.url;
      if (cloudUrl) {
        setAttachmentBase64(cloudUrl);
        return;
      }
    } catch (uploadErr) {
      console.warn('Direct ticket attachment upload failed, using fallback:', uploadErr.message);
    }
    const reader = new FileReader();
    reader.onloadend = () => setAttachmentBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && !attachmentBase64) return;
    await replyTicket(selectedTicket.id, replyText, attachmentBase64);
    setReplyText('');
    setAttachmentBase64(null);
    setAttachmentName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Reply sent');
  };

  // ── AI Policy Assistant Handler ──────────────────────────
  const handleSendPolicyQuery = async (queryText) => {
    const textToSend = (queryText || policyInput).trim();
    if (!textToSend || policyLoading) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...policyMessages, userMsg];
    setPolicyMessages(newMessages);
    setPolicyInput('');
    setPolicyLoading(true);

    const history = newMessages
      .filter(m => m.id !== 'welcome-1')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await api.aiPolicyAssistant(textToSend, history, '/employee/help');
      
      if (res && res.data && res.data.success) {
        const payload = res.data.data;
        const aiMsg = {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: payload.answer || 'No policy answer retrieved.',
          confidence: payload.confidence || 0.88,
          sources: payload.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setPolicyMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(res?.data?.error?.message || 'Failed to query AI Policy Assistant.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'AI Policy Assistant unavailable';
      setPolicyMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: "I couldn't find a definitive answer to that in the current company policy documents. If you need further assistance, please consider raising a support ticket.",
          confidence: 0.25,
          sources: [],
          isError: true,
          failedQuery: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showToast(errorMsg, 'error');
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied answer to clipboard!');
  };

  const handleClearPolicyChat = () => {
    setPolicyMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: "Hi! I'm your **HCM.ai Policy Assistant**. I can help you understand company policies, employee handbook rules, leave quotas, attendance rules, benefits, and more.\n\nWhat would you like to know today?",
        confidence: 1.0,
        sources: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    showToast('Policy conversation reset');
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-0 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 text-left">
        <AlertCircle className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to Load Support Ecosystem</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button onClick={refetchAll} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  if (loading || !tickets) {
    return (
      <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto px-4 sm:px-0 text-left">
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-indigo-100 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading Support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in relative max-w-7xl mx-auto text-left">
      {/* Header Section */}
      <PageHeader
        title="Support Ecosystem"
        subtitle="Need assistance? Engage with our expert support team or IT specialist hubs"
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsPolicyDrawerOpen(true)}
            variant="ai"
            leftIcon={Sparkles}
          >
            AI Policy Assistant
          </Button>

          <Button
            onClick={handleOpenNewTicketModal}
            variant="primary"
            leftIcon={Plus}
          >
            Raise Ticket
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5 }}>
            <div className="flex items-center gap-4 text-left">
               <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                  <stat.icon size={26} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 font-bold leading-none mb-1.5">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight dark:text-white">{stat.value}</h3>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ticket Management */}
      <div className="space-y-8">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
               {['All', 'Open', 'In Progress', 'Resolved'].map((tab) => (
                  <button 
                     key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={cn("btn-secondary", "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap",
                       activeTab === tab ? "bg-slate-900 text-white shadow-xl shadow-slate-200 translate-y-[-2px]" : "bg-white text-slate-400 border border-slate-100 hover:border-primary-200"
                    )}
                  >
                     {tab}
                  </button>
               ))}
            </div>
            <div className="relative w-full lg:w-96">
               <Search className="absolute left-4 top-3 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search registry..." 
                 value={searchTerm}onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
         </div>

         <div className="card p-0 border-none bg-white shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left hcm-table">
                  <thead className="hcm-thead">
                     <tr className="bg-slate-50/50 hcm-tr">
                        <th className="px-8 py-5 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] hcm-th">Ticket Identity</th>
                        <th className="px-8 py-5 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] hcm-th">Category</th>
                        <th className="px-8 py-5 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] text-center hcm-th">Priority</th>
                        <th className="px-8 py-5 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] text-center hcm-th">Status</th>
                        <th className="px-8 py-5 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] text-right hcm-th">Activity</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredTickets.length > 0 ? filteredTickets.map((t) => (
                        <tr key={t.id}onClick={() => setSelectedTicket(t)}>
                           <td className="px-8 py-7 hcm-td">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                                    <Hash size={16}/>
                                    <span className="text-[10px] font-black leading-none mt-1">{t.id.split('-')[0]}</span>
                                 </div>
                                 <div className="min-w-0 max-w-sm">
                                    <p className="text-sm font-black text-slate-900 leading-none truncate italic tracking-tight">{t.subject}</p>
                                    <p className="text-[9px] font-black text-slate-400 font-bold mt-2">
                                       {formatDate(t.createdAt)}
                                    </p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-7 hcm-td">
                              <span className="text-[10px] font-black text-slate-500 font-bold px-3 py-1 bg-slate-50 rounded-lg">{t.category}</span>
                           </td>
                           <td className="px-8 py-7 text-center hcm-td">
                              <span className={cn(
                                 "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic",
                                 t.priority === 'High' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                 t.priority === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                 "bg-primary-50 text-primary-600 border-primary-100"
                              )}>
                                 {t.priority}
                              </span>
                           </td>
                           <td className="px-8 py-7 text-center hcm-td">
                              <span className={cn(
                                 "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                 getFriendlyStatus(t.status) === 'Resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 getFriendlyStatus(t.status) === 'In Progress' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                 "bg-slate-100 text-slate-500 border-slate-200"
                              )}>
                                 {getFriendlyStatus(t.status)}
                              </span>
                           </td>
                            <td className="px-8 py-7 text-right hcm-td">
                                <button
                                  className="btn-icon"
                                  aria-label="Open Ticket Discussion"
                                  onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                                >
                                  <MessageCircle size={18} />
                                </button>
                             </td>
                        </tr>
                     )) : (
                       <tr className="hcm-tr">
                         <td colSpan="5" className="py-20 hcm-td">
                            <EmptyState
                               icon={MessageSquare}
                               title="No support records found"
                            />
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* New Ticket Modal */}
      <CenterModal 
        isOpen={isNewTicketModalOpen} 
        onClose={handleCloseNewTicketModal} 
        title="Register Support Ticket"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="p-5 sm:p-7 pt-4 sm:pt-5 space-y-4 sm:space-y-5 text-left">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input 
              name="subject" 
              type="text" 
              required 
              value={newTicketForm.subject}
              onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g. Cannot access my email" 
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition" 
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Functional Category
              </label>
              <div className="relative">
                <select 
                  name="category" 
                  value={newTicketForm.category}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer transition"
                >
                  <option value="IT Support">IT Support</option>
                  <option value="Payroll Query">Payroll Query</option>
                  <option value="HR Policy">HR Policy</option>
                  <option value="Hardware Request">Hardware Request</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Priority Strategy
              </label>
              <div className="relative">
                <select 
                  name="priority" 
                  value={newTicketForm.priority}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer transition"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Attachment (Optional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Attachment (Optional)
            </label>
            <input 
              type="file" 
              ref={createFileInputRef} 
              onChange={handleCreateFileSelect} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.mp4,.zip"
            />
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => createFileInputRef.current?.click()}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between transition cursor-pointer"
              >
                <span className="truncate">{createAttachmentName || 'Choose file...'}</span>
                <Paperclip size={16} className="text-slate-400 shrink-0 ml-2" />
              </button>
              {createAttachmentName && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateAttachmentBase64(null);
                    setCreateAttachmentName('');
                    if (createFileInputRef.current) createFileInputRef.current.value = '';
                  }}
                  className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition shrink-0 cursor-pointer"
                  title="Remove attachment"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea 
              name="description" 
              rows={4} 
              required 
              value={newTicketForm.description}
              onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your issue in detail..." 
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition resize-none" 
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleCloseNewTicketModal}
              className="w-full sm:flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              variant="primary"
              leftIcon={Plus}
              className="w-full sm:flex-1 h-11 rounded-xl"
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </CenterModal>

      {/* WhatsApp / Messenger Style Ticket Chat Modal */}
      <CenterModal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        maxWidth="max-w-2xl"
        showClose={false}
      >
        {selectedTicket && (
          <div className="flex flex-col h-[75vh] max-h-[640px] text-left">
            {/* WhatsApp Messenger Header */}
            <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-indigo-400/20">
                    <Headphones size={20} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Online" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-[360px]">
                      {selectedTicket.subject}
                    </h3>
                    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0",
                      getFriendlyStatus(selectedTicket.status) === 'Resolved' 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    )}>
                      {getFriendlyStatus(selectedTicket.status)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                    HR & Support Desk • {selectedTicket.category || 'General'}
                  </p>
                </div>
              </div>

              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTicket(null)}
                title="Close chat"
                className="text-white hover:text-white/80 hover:bg-white/10 p-1 h-auto"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Chat Body - WhatsApp Style Bubble Scroll Area */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-100/80 dark:bg-slate-950/70 space-y-3">
              {/* Date Badge */}
              <div className="flex justify-center my-1">
                <span className="px-3 py-1 bg-white dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-full shadow-xs border border-slate-200/60 dark:border-slate-700/60">
                  {formatDate(selectedTicket.createdAt) || 'Today'}
                </span>
              </div>

              {/* Initial Message (Description) — taken from first TicketMessage since SupportTicket has no description field */}
              {getTicketDescription(selectedTicket) && (
                <div className="flex justify-end">
                  <div className="max-w-[82%] sm:max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm space-y-1.5 relative group">
                    <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap font-normal">
                      {getTicketDescription(selectedTicket)}
                    </p>
                    {getTicketAttachment(selectedTicket) && (
                      <div 
                        onClick={() => handleAttachmentClick(getTicketAttachment(selectedTicket), 'initial_attachment')}
                        className="flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer bg-black/15 hover:bg-black/25 text-white mt-1.5">
                        <Paperclip size={14}/>
                        <span className="truncate underline font-medium">View Attachment</span>
                        <Download size={13}/>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-indigo-200 mt-1">
                      <span>{formatMessageTime(selectedTicket.createdAt)}</span>
                      <CheckCheck size={14}/>
                    </div>
                  </div>
                </div>
              )}

              {/* Subsequent Messages (skip index 0 — already shown as the description bubble above) */}
              {getChatMessages(selectedTicket).map((msg, i) => {
                const isMe = checkIsMe(msg.sender);
                const senderLabel = isMe ? 'You' : getSenderName(msg.sender);
                const msgTime = formatMessageTime(msg.timestamp || msg.createdAt);
                const text = getMessageText(msg);

                return (
                  <div key={msg.id || i} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0 mb-0.5 ring-1 ring-indigo-200 dark:ring-indigo-800">
                        {senderLabel.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[82%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm space-y-1 relative group",
                      isMe 
                        ? "bg-indigo-600 text-white rounded-tr-xs" 
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs"
                    )}>
                      {!isMe && (
                        <p className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mb-1">
                          {senderLabel}
                        </p>
                      )}

                      <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap font-normal">
                        {text}
                      </p>

                      {msg.attachmentUrl && (
                        <div 
                          onClick={() => handleAttachmentClick(msg.attachmentUrl, `attachment_${i}`)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors mt-1.5",
                            isMe ? "bg-black/15 hover:bg-black/25 text-white" : "bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                          )}
                        >
                          <Paperclip size={14}/>
                          <span className="truncate underline font-medium">Attachment</span>
                          <Download size={13}/>
                        </div>
                      )}

                      <div className={cn(
                        "flex items-center justify-end gap-1 text-[10px] mt-1",
                        isMe ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                      )}>
                        <span>{msgTime}</span>
                        {isMe && <CheckCheck size={14}/>}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={ticketChatEndRef} />
            </div>

            {/* Fixed Chat Input Composer */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shrink-0">
              {/* Attachment Preview Chip */}
              {attachmentName && (
                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold">
                  <Paperclip size={13} />
                  <span className="max-w-[200px] truncate">{attachmentName}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-1 h-auto"
                    onClick={() => { setAttachmentName(''); setAttachmentBase64(null); }}>
                    <X size={13} />
                  </Button>
                </div>
              )}

              <form onSubmit={handleReply} className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <Button 
                  variant="ghost"
                  className="px-2"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </Button>

                <input
                  type="text"
                  value={replyText}onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(e);
                    }
                  }}
                  placeholder="Type a message... (Press Enter to send)"
                  className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />

                <Button 
                  type="submit"
                  variant="primary"
                  isDisabled={!replyText && !attachmentBase64}
                  className="px-4"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline ml-1">Send</span>
                </Button>
              </form>
            </div>
          </div>
        )}
      </CenterModal>

      {/* ── ✨ HCM.ai Policy Assistant Fixed Right-Side Panel ─────────────── */}
      <AnimatePresence>
        {isPolicyDrawerOpen && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            {/* Subtle Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPolicyDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Fixed Right Panel Overlay */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-10 w-full max-w-md sm:max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              {/* Panel Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-md border-b border-indigo-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-white">
                        HCM.ai Policy Assistant
                      </h3>
                      <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-300">Online</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-200/70 font-medium tracking-wide mt-0.5">
                      Enterprise Knowledge Base · Policy Specialist
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={handleClearPolicyChat} 
                    title="Reset Conversation"
                    className="text-indigo-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsPolicyDrawerOpen(false)}
                    title="Close Panel"
                    className="text-indigo-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Conversation Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/80 dark:bg-slate-950/60 scrollbar-thin">
                {policyMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col gap-1.5 max-w-[90%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    {/* Role & Timestamp Header */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 px-1">
                      {msg.role === 'user' ? (
                        <span>You • {msg.timestamp}</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                          <Bot size={13} />
                          <span>Policy Specialist</span>
                          <span className="text-[10px] text-slate-400 font-normal">• {msg.timestamp}</span>
                        </span>
                      )}
                    </div>

                    {/* Chat Bubble Card */}
                    <div className={cn(
                      "p-4 rounded-2xl shadow-xs text-xs sm:text-sm relative group border",
                      msg.role === 'user'
                        ? "bg-indigo-600 border-indigo-700 text-white rounded-tr-xs"
                        : "bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                    )}>
                      {msg.role === 'user' ? (
                        <p className="font-medium whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <PolicyMarkdown content={msg.content} />
                      )}

                      {/* Confidence Badge & Actions */}
                      {msg.role === 'assistant' && msg.id !== 'welcome-1' && (
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-medium">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border text-[9px]",
                            msg.confidence >= 0.8 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : msg.confidence >= 0.4
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                          )}>
                            {msg.confidence >= 0.8 ? "✓ Verified Company Policy" : msg.confidence >= 0.4 ? "Based on policy docs" : "General Guidance"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {msg.isError && msg.failedQuery && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 py-1 px-2 rounded-md text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                onClick={() => handleSendPolicyQuery(msg.failedQuery)}>
                                <RefreshCw size={10} />
                                <span>Retry</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 py-1 px-2 rounded-md text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              onClick={() => handleCopyMessage(msg.id, msg.content)}>
                              {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Source Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Citations & Documents</span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                <FileText size={11} className="text-indigo-500" />
                                <span>{src.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Animated Typing Indicator */}
                {policyLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 w-fit shadow-xs mr-auto"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Bot size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Searching company policies...</span>
                    <div className="flex items-center gap-1 ml-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </motion.div>
                )}

                {/* Suggested Questions Chips */}
                {policyMessages.length <= 2 && !policyLoading && (
                  <div className="pt-2 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Suggested Inquiries
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendPolicyQuery(q)}
                          className="text-left px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-150 shadow-xs cursor-pointer flex items-center gap-1.5 group"
                        >
                          <Sparkles size={12} className="text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={policyChatEndRef} />
              </div>

              {/* Sticky Input Area */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 shadow-lg">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendPolicyQuery();
                  }}
                  className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-xs"
                >
                  <textarea
                    ref={policyInputRef}
                    value={policyInput}
                    onChange={(e) => setPolicyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPolicyQuery();
                      }
                    }}
                    placeholder="Ask about company policies, leave rules, benefits..."
                    rows={2}
                    maxLength={1000}
                    className="flex-1 bg-transparent resize-none border-0 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 p-1.5 max-h-28"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={!policyInput.trim() || policyLoading}
                    className="shrink-0 rounded-xl p-2.5 h-10 w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    <Send size={15} />
                  </Button>
                </form>

                {/* Human Support Escalation Link */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                  <span>Still need human support?</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition cursor-pointer"
                    onClick={() => {
                      setIsPolicyDrawerOpen(false);
                      handleOpenNewTicketModal();
                    }}
                  >
                    <Plus size={13} />
                    <span>Raise Support Ticket</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeHelpDesk;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Send, 
  Paperclip, MessageSquare, 
  CheckCheck, ChevronLeft, SquarePen, X,
  Clock, AlertCircle, FileText, Download, User,
  Building2, CheckCircle2, RotateCcw, Loader2, Plus
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useAuth } from '../../hooks/useAuth';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import { getBackendURL, uploadAPI, hrAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';

const Messages = () => {
  const { tickets = [], createTicket, replyToTicket, closeTicket, employees = [], showToast, refetch } = useHR();
  const { user } = useAuth();

  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('All'); // 'All', 'OPEN', 'RESOLVED'
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [newThreadData, setNewThreadData] = useState({ 
    to: '', 
    subject: '', 
    category: 'General', 
    priority: 'Medium',
    message: '' 
  });
  
  const fileInputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Format time utility
  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMsgDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Map tickets to robust conversation objects
  const conversations = useMemo(() => {
    return (tickets || []).map(ticket => {
      const msgs = ticket.messages || [];
      const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      const empName = ticket.user?.employeeProfile?.fullName || ticket.user?.email?.split('@')[0] || 'Employee';
      const empAvatar = ticket.user?.employeeProfile?.avatarUrl || '';
      const deptName = ticket.user?.employeeProfile?.department?.name || ticket.user?.role || 'General';
      const status = (ticket.status || 'OPEN').toUpperCase();

      return {
        id: ticket.id,
        name: empName,
        department: deptName,
        role: ticket.user?.role || 'EMPLOYEE',
        subject: ticket.subject || 'Support Inquiry',
        category: ticket.category || 'General',
        priority: ticket.priority || 'Medium',
        lastMsg: lastMessage?.text || ticket.subject || 'No messages yet',
        lastMsgTime: lastMessage ? formatMsgTime(lastMessage.createdAt) : formatMsgTime(ticket.createdAt),
        lastMsgDate: lastMessage ? formatMsgDate(lastMessage.createdAt) : formatMsgDate(ticket.createdAt),
        updatedAt: ticket.updatedAt || ticket.createdAt,
        unread: 0,
        avatar: empAvatar,
        status: status,
        rawTicket: ticket
      };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [tickets]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(chat => {
      const matchesFilter = filterTab === 'All' ? true : chat.status === filterTab;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesFilter;

      const matchesSearch = 
        chat.name.toLowerCase().includes(query) ||
        chat.lastMsg.toLowerCase().includes(query) ||
        chat.subject.toLowerCase().includes(query) ||
        chat.category.toLowerCase().includes(query) ||
        chat.department.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [conversations, filterTab, searchQuery]);

  // Map message history per ticket
  const messagesMap = useMemo(() => {
    const map = {};
    (tickets || []).forEach(ticket => {
      map[ticket.id] = (ticket.messages || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        time: formatMsgTime(msg.createdAt),
        date: formatMsgDate(msg.createdAt),
        senderName: msg.sender?.employeeProfile?.fullName || msg.sender?.email?.split('@')[0] || 'User',
        senderAvatar: msg.sender?.employeeProfile?.avatarUrl || '',
        type: (msg.senderId === user?.id || msg.senderId === user?.userId) ? 'sent' : 'received',
        attachmentUrl: msg.attachmentUrl
      }));
    });
    return map;
  }, [tickets, user]);

  const currentChat = useMemo(() => {
    return conversations.find(c => c.id === selectedChat) || null;
  }, [conversations, selectedChat]);

  // Auto-scroll to bottom of active conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
    }
  }, [selectedChat, messagesMap[selectedChat]?.length]);

  // Handle message sending
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachment) || !selectedChat || isSending) return;

    setIsSending(true);
    let cloudAttachmentUrl = null;
    if (attachment) {
      try {
        const res = await uploadAPI.uploadAuto(attachment, 'hcm/chat');
        cloudAttachmentUrl = res.data?.data?.url;
      } catch (uploadErr) {
        console.warn('Chat upload failed, proceeding with fallback:', uploadErr.message);
      }
    }

    try {
      if (cloudAttachmentUrl) {
        await replyToTicket(selectedChat, { text: inputText, attachmentUrl: cloudAttachmentUrl });
      } else if (attachment) {
        const formData = new FormData();
        if (inputText.trim()) formData.append('text', inputText);
        formData.append('file', attachment);
        await replyToTicket(selectedChat, formData);
      } else {
        await replyToTicket(selectedChat, { text: inputText });
      }
      setInputText('');
      setAttachment(null);
      await refetch?.fetchTickets?.();
    } catch (err) {
      showToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const v = validateFile(file, ['pdf','png','jpg','jpeg','doc','docx','gif','mp4','zip'], 10);
      if (!v.isValid) { 
        showToast(v.message, 'error'); 
        return; 
      }
      setAttachment(file);
    }
  };

  const handleStartThread = async (e) => {
    e.preventDefault();
    if (!newThreadData.to || !newThreadData.subject.trim() || !newThreadData.message.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setIsCreatingThread(true);
    try {
      await createTicket(newThreadData);
      setIsNewThreadOpen(false);
      setNewThreadData({ to: '', subject: '', category: 'General', priority: 'Medium', message: '' });
      await refetch?.fetchTickets?.();
    } catch (err) {
      console.error('Failed to start thread:', err);
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!currentChat || isTogglingStatus) return;
    setIsTogglingStatus(true);
    try {
      const newStatus = currentChat.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
      await hrAPI.updateTicketStatus(currentChat.id, { status: newStatus });
      showToast(`Thread marked as ${newStatus === 'RESOLVED' ? 'Resolved' : 'Open'}`, 'success');
      await refetch?.fetchTickets?.();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      showToast('Failed to update status', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch?.fetchTickets?.();
      showToast('Messages updated with live database data', 'success');
    } catch (err) {
      showToast('Failed to refresh messages', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] min-h-[500px] animate-fade-in focus:outline-none w-full text-left">
      {/* ── Main Two-Panel Chat Container ── */}
      <div className="flex-1 flex overflow-hidden card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl min-h-0">
        
        {/* ── Left: Conversations Sidebar ── */}
        <div className={cn(
          "w-full md:w-[340px] lg:w-[380px] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 min-h-0", 
          selectedChat ? "hidden md:flex" : "flex"
        )}>
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">Messages</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Employee & support correspondence</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                title="Refresh messages"
              >
                <RotateCcw size={15} className={cn(isRefreshing && "animate-spin text-primary-600")} />
              </button>

              <button 
                type="button"
                onClick={() => setIsNewThreadOpen(true)} 
                className="h-9 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer shrink-0"
                title="Start New Thread"
              >
                <SquarePen size={15} />
                <span>New Thread</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-3.5 sm:p-4 pb-2 space-y-3 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-slate-100 h-10 text-xs sm:text-sm font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
              {['All', 'OPEN', 'RESOLVED'].map(tab => {
                const count = tab === 'All' 
                  ? conversations.length 
                  : conversations.filter(c => c.status === tab).length;
                const isSelected = filterTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer capitalize flex items-center justify-center gap-1.5 select-none",
                      isSelected 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <span>{tab === 'OPEN' ? 'Open' : tab === 'RESOLVED' ? 'Resolved' : 'All'}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                      isSelected 
                        ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400" 
                        : "bg-slate-200/60 dark:bg-slate-700 text-slate-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 min-h-0">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => {
                const isSelected = selectedChat === chat.id;

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setSelectedChat(chat.id)}
                    className={cn(
                      "w-full p-4 flex items-start gap-3 transition-all text-left relative group cursor-pointer border-l-4", 
                      isSelected 
                        ? "bg-primary-50/50 dark:bg-primary-950/30 border-primary-600" 
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    {/* Avatar with Status Dot */}
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar src={chat.avatar} alt={chat.name} />
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900", 
                        chat.status === 'OPEN' ? "bg-emerald-500" : "bg-slate-400"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">{chat.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 ml-2">{chat.lastMsgTime}</span>
                      </div>

                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mb-1">
                        {chat.subject}
                      </p>

                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mb-1.5 italic">
                        "{chat.lastMsg}"
                      </p>

                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
                          chat.status === 'OPEN' 
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                        )}>
                          {chat.status}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">
                          • {chat.department}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm flex flex-col items-center justify-center">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2 text-slate-400">
                  <MessageSquare size={28} />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? "No matching conversations" : "No conversation threads yet"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchQuery ? "Try searching another term" : "Click 'New Thread' to start messaging"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Active Chat Area ── */}
        <div className={cn(
          "flex-1 min-w-0 min-h-0 flex flex-col relative bg-white dark:bg-slate-900", 
          !selectedChat ? "hidden md:flex" : "flex"
        )}>
          {selectedChat && currentChat ? (
            <>
              {/* Active Chat Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Back button on mobile */}
                  <button 
                    type="button"
                    onClick={() => setSelectedChat(null)} 
                    aria-label="Go back to list" 
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar src={currentChat.avatar} alt={currentChat.name} />
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                      currentChat.status === 'OPEN' ? "bg-emerald-500" : "bg-slate-400"
                    )} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                        {currentChat.name}
                      </h3>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 border",
                        currentChat.status === 'OPEN' 
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                      )}>
                        {currentChat.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {currentChat.department} • Subject: <span className="font-bold text-slate-700 dark:text-slate-300">{currentChat.subject}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    className={cn(
                      "h-9 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer select-none",
                      currentChat.status === 'OPEN'
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        : "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    )}
                    title={currentChat.status === 'OPEN' ? "Mark as Resolved" : "Reopen Ticket"}
                  >
                    {isTogglingStatus ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : currentChat.status === 'OPEN' ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span className="hidden sm:inline">Resolve Thread</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw size={15} />
                        <span className="hidden sm:inline">Reopen Thread</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message Bubbles Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 min-h-0">
                {(messagesMap[selectedChat] || []).length > 0 ? (
                  (messagesMap[selectedChat] || []).map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]", 
                        msg.type === 'sent' ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "px-4.5 py-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm break-words whitespace-pre-wrap", 
                        msg.type === 'sent' 
                          ? "bg-primary-600 text-white rounded-tr-none" 
                          : "bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"
                      )}>
                        {msg.attachmentUrl && (
                          <a 
                            href={msg.attachmentUrl.startsWith('/') ? `${getBackendURL()}${msg.attachmentUrl}` : msg.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 p-2 mb-2 rounded-xl bg-black/10 dark:bg-white/10 hover:underline font-bold text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText size={16} />
                            <span>View Attachment</span>
                            <Download size={14} />
                          </a>
                        )}
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{msg.time}</span>
                        {msg.type === 'sent' && <CheckCheck size={12} className="text-primary-500" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary-600 shadow-sm mb-3 shrink-0">
                      <MessageSquare size={24} />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No messages in this thread yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Send a message below to start the conversation</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                {attachment && (
                  <div className="mb-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-primary-600" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{attachment.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAttachment(null)} 
                      aria-label="Remove attachment" 
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                  <button 
                    type="button" 
                    aria-label="Attach file" 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Attach File"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Press Enter to send)" 
                    className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl px-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 h-10 focus:outline-none transition-all"
                  />

                  <button 
                    type="submit" 
                    aria-label="Send message" 
                    disabled={(!inputText.trim() && !attachment) || isSending}
                    className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 shadow-sm shadow-primary-500/20"
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty Selection State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-12 bg-slate-50/40 dark:bg-slate-950/20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary-600 shadow-lg mb-4 sm:mb-6 shrink-0">
                <MessageSquare size={36} />
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Select a Conversation</h3>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium max-w-sm mb-6 leading-relaxed">
                Choose a thread from the left sidebar or start a new conversation with a team member.
              </p>

              <button 
                type="button"
                onClick={() => setIsNewThreadOpen(true)}
                className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer select-none"
              >
                <SquarePen size={17} />
                <span>Start a New Thread</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Start New Thread Modal ── */}
      <CenterModal 
        isOpen={isNewThreadOpen} 
        onClose={() => setIsNewThreadOpen(false)} 
        title="Start New Conversation Thread" 
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStartThread} className="p-6 sm:p-8 space-y-4 text-left bg-white dark:bg-slate-900">
          <div className="space-y-1.5 text-left">
            <label className="form-label text-xs font-bold block">
              Select Recipient <span className="text-rose-500">*</span>
            </label>
            <select 
              value={newThreadData.to} 
              onChange={e => setNewThreadData({...newThreadData, to: e.target.value})}
              className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
              required
            >
              <option value="" className="dark:bg-slate-900">-- Select Team Member --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.userId || emp.user?.id || emp.id} className="dark:bg-slate-900">
                  {emp.fullName || emp.name} {emp.department?.name ? `• ${emp.department.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1.5 text-left">
              <label className="form-label text-xs font-bold block">Category</label>
              <select 
                value={newThreadData.category} 
                onChange={e => setNewThreadData({...newThreadData, category: e.target.value})}
                className="input-field h-11 font-bold text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
              >
                <option value="General" className="dark:bg-slate-900">General</option>
                <option value="Payroll" className="dark:bg-slate-900">Payroll</option>
                <option value="Leave & Attendance" className="dark:bg-slate-900">Leave & Attendance</option>
                <option value="Policy & HR" className="dark:bg-slate-900">Policy & HR</option>
                <option value="Technical" className="dark:bg-slate-900">Technical</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="form-label text-xs font-bold block">Priority</label>
              <select 
                value={newThreadData.priority} 
                onChange={e => setNewThreadData({...newThreadData, priority: e.target.value})}
                className="input-field h-11 font-bold text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
              >
                <option value="Low" className="dark:bg-slate-900">Low</option>
                <option value="Medium" className="dark:bg-slate-900">Medium</option>
                <option value="High" className="dark:bg-slate-900">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="form-label text-xs font-bold block">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. September Salary Clarification"
              value={newThreadData.subject} 
              onChange={e => setNewThreadData({...newThreadData, subject: e.target.value})}
              className="input-field h-11 font-medium text-sm"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="form-label text-xs font-bold block">
              Initial Message <span className="text-rose-500">*</span>
            </label>
            <textarea 
              value={newThreadData.message}
              onChange={(e) => setNewThreadData({...newThreadData, message: e.target.value})}
              placeholder="Type your message to initiate the conversation thread..."
              className="input-field h-24 py-3 w-full resize-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium textarea-field"
              required
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
            <button 
              type="button" 
              onClick={() => setIsNewThreadOpen(false)}
              className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isCreatingThread}
              className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer flex-1 sm:flex-none disabled:opacity-50"
            >
              {isCreatingThread ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>Start Thread</span>
            </button>
          </div>
        </form>
      </CenterModal>
    </div>
  );
};

export default Messages;

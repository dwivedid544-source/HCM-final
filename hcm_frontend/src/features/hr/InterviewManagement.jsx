import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Plus, Search, Calendar, Clock, Video, User, 
  ChevronRight, CheckCircle2, X, RotateCcw, 
  CalendarDays, Trash2, ChevronLeft, Filter,
  AlertTriangle, Loader2, Phone, Link2, Edit3,
  Sparkles, Star, MessageSquare, ExternalLink,
  MapPin, Check, ListFilter, LayoutGrid, CheckCircle, Ban
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useDateFormat } from '../../hooks/useDateFormat';
import StatCard from '../../shared/components/ui/StatCard';
import DatePicker from '../../shared/components/common/DatePicker';
import PageHeader from '../../shared/components/ui/PageHeader';
import { usePersistedTab } from '../../hooks/usePersistedTab';

// ─── Helper: format time for display ───
const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '10:00 AM';
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const parts = timeStr.trim().split(':');
    const hour = parseInt(parts[0], 10);
    const minute = String(parts[1] || '00').slice(0, 2).padStart(2, '0');
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  }
  return timeStr;
};

// ─── Helper: convert to YYYY-MM-DD for comparisons ───
const toDateKey = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
    }
    const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch { return ''; }
};

const getInitials = (name) => {
  if (!name) return 'CA';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const InterviewManagement = () => {
  const { 
    interviews = [], 
    addInterview, 
    updateInterview, 
    deleteInterview, 
    submitFeedback,
    candidates = [], 
    employees = [], 
    showToast 
  } = useHR();

  const { formatDate } = useDateFormat();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [activeView, setActiveView] = usePersistedTab('hr_interviews_view', 'list', 'view');

  const [editingInterview, setEditingInterview] = useState(null);
  const [feedbackInterview, setFeedbackInterview] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roundFilter, setRoundFilter] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  const [formData, setFormData] = useState({
    candidate: '',
    candidateId: '',
    role: '',
    interviewer: '',
    interviewerId: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    round: 'Technical Round 1',
    link: '',
    type: 'Google Meet',
    status: 'Scheduled'
  });
  const [formErrors, setFormErrors] = useState({});

  const handleOpenCreate = useCallback((prefillCandidate = '', prefillDate = '') => {
    setEditingInterview(null);
    const matchedCandidate = candidates.find(c => c.name === prefillCandidate || c.id === prefillCandidate);
    const defaultCandidate = matchedCandidate || candidates[0];
    const defaultEmployee = employees[0];

    setFormData({
      candidate: defaultCandidate ? defaultCandidate.name : '',
      candidateId: defaultCandidate ? defaultCandidate.id : '',
      role: defaultCandidate ? defaultCandidate.role : '',
      interviewer: defaultEmployee ? (defaultEmployee.fullName || defaultEmployee.name) : 'HR Lead',
      interviewerId: defaultEmployee ? defaultEmployee.id : '',
      date: prefillDate || new Date().toISOString().split('T')[0],
      time: '10:00',
      round: 'Technical Round 1',
      link: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'Google Meet',
      status: 'Scheduled'
    });
    setFormErrors({});
    setIsModalOpen(true);
  }, [candidates, employees]);

  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenCreate(location.state.candidate || '');
      window.history.replaceState({}, document.title);
    }
  }, [location, handleOpenCreate]);

  // 100% Dynamic KPI Stats
  const todayKey = toDateKey(new Date());
  const stats = useMemo(() => {
    const todayCount = interviews.filter(i => toDateKey(i.rawDate || i.dateTime || i.date) === todayKey).length;
    const upcomingCount = interviews.filter(i => (i.status || '').toLowerCase() === 'scheduled').length;
    const completedCount = interviews.filter(i => (i.status || '').toLowerCase() === 'completed').length;
    const cancelledCount = interviews.filter(i => (i.status || '').toLowerCase() === 'cancelled').length;

    return [
      { 
        label: "Today's Interviews", 
        value: todayCount, 
        sub: todayCount > 0 ? `${todayCount} session${todayCount > 1 ? 's' : ''} scheduled today` : 'No sessions today',
        trendPct: todayCount > 0 ? `+${todayCount}` : '0',
        icon: Calendar, 
        bg: 'bg-blue-50 dark:bg-blue-950/30', 
        iconColor: 'text-blue-600 dark:text-blue-400',
        onClick: () => { setStatusFilter('All'); setRoundFilter('All'); }
      },
      { 
        label: 'Upcoming', 
        value: upcomingCount, 
        sub: upcomingCount > 0 ? `${upcomingCount} pending round${upcomingCount > 1 ? 's' : ''}` : '0 pending rounds',
        trendPct: upcomingCount > 0 ? `+${upcomingCount}` : '0',
        icon: Clock, 
        bg: 'bg-purple-50 dark:bg-purple-950/30', 
        iconColor: 'text-purple-600 dark:text-purple-400',
        onClick: () => { setStatusFilter('Scheduled'); setRoundFilter('All'); }
      },
      { 
        label: 'Completed', 
        value: completedCount, 
        sub: completedCount > 0 ? `${completedCount} conducted round${completedCount > 1 ? 's' : ''}` : '0 conducted rounds',
        trendPct: completedCount > 0 ? `+${completedCount}` : '0',
        icon: CheckCircle2, 
        bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        onClick: () => { setStatusFilter('Completed'); setRoundFilter('All'); }
      },
      { 
        label: 'Cancelled', 
        value: cancelledCount, 
        sub: cancelledCount > 0 ? `${cancelledCount} cancelled session${cancelledCount > 1 ? 's' : ''}` : '0 cancelled sessions',
        trendPct: cancelledCount > 0 ? `+${cancelledCount}` : '0',
        icon: RotateCcw, 
        bg: 'bg-rose-50 dark:bg-rose-950/30', 
        iconColor: 'text-rose-600 dark:text-rose-400',
        onClick: () => { setStatusFilter('Cancelled'); setRoundFilter('All'); }
      },
    ];
  }, [interviews, todayKey]);

  // Dynamic Rounds list for filter dropdown
  const availableRounds = useMemo(() => {
    const defaultRounds = ['HR Screening', 'Technical Round 1', 'Technical Round 2', 'System Design', 'Culture Fit', 'Offer Discussion'];
    const customRounds = interviews.map(i => i.round).filter(Boolean);
    return Array.from(new Set([...defaultRounds, ...customRounds]));
  }, [interviews]);

  // Dynamic Filtering
  const filteredInterviews = useMemo(() => {
    let result = [...interviews];
    if (statusFilter !== 'All') {
      result = result.filter(i => (i.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (roundFilter !== 'All') {
      result = result.filter(i => (i.round || '').toLowerCase() === roundFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        (i.candidate || '').toLowerCase().includes(q) ||
        (i.role || '').toLowerCase().includes(q) ||
        (i.interviewer || '').toLowerCase().includes(q) ||
        (i.round || '').toLowerCase().includes(q) ||
        (i.type || '').toLowerCase().includes(q) ||
        (i.date || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [interviews, statusFilter, roundFilter, searchQuery]);

  const handleOpenEdit = useCallback((interview) => {
    setEditingInterview(interview.id);
    const matchedCandidate = candidates.find(c => c.name === interview.candidate);
    const matchedEmp = employees.find(e => (e.fullName || e.name) === interview.interviewer || e.id === interview.interviewerId);

    setFormData({ 
      candidate: interview.candidate || '',
      candidateId: matchedCandidate ? matchedCandidate.id : (interview.applicationId || ''),
      role: interview.role || (matchedCandidate ? matchedCandidate.role : ''),
      interviewer: interview.interviewer || (matchedEmp ? (matchedEmp.fullName || matchedEmp.name) : ''),
      interviewerId: interview.interviewerId || (matchedEmp ? matchedEmp.id : ''),
      date: toDateKey(interview.rawDate || interview.date || interview.dateTime) || new Date().toISOString().split('T')[0],
      time: interview.time || '10:00',
      round: interview.round || 'Technical Round 1',
      link: interview.link || interview.meetingLink || '',
      type: interview.type || 'Google Meet',
      status: interview.status || 'Scheduled',
    });
    setFormErrors({});
    setIsModalOpen(true);
  }, [candidates, employees]);

  const handleGenerateMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rand = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const meetLink = `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
    setFormData(prev => ({ ...prev, link: meetLink }));
    showToast('Google Meet link generated', 'info');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.candidate.trim()) errors.candidate = 'Candidate is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.time) errors.time = 'Time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        candidate: formData.candidate.trim(),
        role: formData.role.trim() || 'Open Role',
        interviewer: formData.interviewer.trim() || 'HR Lead',
        interviewerId: formData.interviewerId || undefined,
        applicationId: formData.candidateId || undefined,
        meetingLink: formData.link || undefined,
        link: formData.link || undefined
      };
      if (editingInterview) {
        await updateInterview(editingInterview, payload);
      } else {
        await addInterview(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Schedule submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenFeedback = (interview) => {
    setFeedbackInterview(interview);
    setFeedbackRating(interview.rating || 5);
    setFeedbackNotes(interview.feedback || '');
    setIsFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackInterview) return;
    try {
      if (submitFeedback) {
        await submitFeedback(feedbackInterview.id, {
          rating: feedbackRating,
          feedback: feedbackNotes,
          status: 'Completed'
        });
      } else {
        await updateInterview(feedbackInterview.id, {
          rating: feedbackRating,
          feedback: feedbackNotes,
          status: 'Completed'
        });
      }
      showToast('Interview feedback & rating saved as Completed!', 'success');
      setIsFeedbackModalOpen(false);
      setFeedbackInterview(null);
    } catch (err) {
      showToast('Failed to save interview feedback', 'error');
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Scheduled' ? 'Completed' : currentStatus === 'Completed' ? 'Cancelled' : 'Scheduled';
    await updateInterview(id, { status: newStatus });
  };

  const handleDelete = async (id) => {
    await deleteInterview(id);
    setDeleteConfirm(null);
  };

  // Calendar Engine
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const interviewsByDate = useMemo(() => {
    const map = {};
    interviews.forEach(i => {
      const key = toDateKey(i.rawDate || i.dateTime || i.date);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(i);
      }
    });
    return map;
  }, [interviews]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateKey, interviews: interviewsByDate[dateKey] || [] });
    }
    return days;
  }, [calYear, calMonth, daysInMonth, firstDayOfWeek, interviewsByDate]);

  const selectedDayInterviews = useMemo(() => {
    if (!selectedCalDay) return [];
    const key = toDateKey(selectedCalDay);
    return interviewsByDate[key] || [];
  }, [selectedCalDay, interviewsByDate]);

  useEffect(() => {
    if (activeView === 'calendar' && !selectedCalDay) {
      setSelectedCalDay(todayKey);
    }
  }, [activeView, todayKey, selectedCalDay]);

  const statusTabs = [
    { key: 'All', label: 'All', count: interviews.length },
    { key: 'Scheduled', label: 'Scheduled', count: interviews.filter(i => (i.status || '').toLowerCase() === 'scheduled').length },
    { key: 'Completed', label: 'Completed', count: interviews.filter(i => (i.status || '').toLowerCase() === 'completed').length },
    { key: 'Cancelled', label: 'Cancelled', count: interviews.filter(i => (i.status || '').toLowerCase() === 'cancelled').length },
  ];

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'All' || roundFilter !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setRoundFilter('All');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* ── Header ── */}
      <PageHeader
        title="Interview Scheduling"
        description="Schedule, coordinate, and review candidate hiring rounds across teams"
        actions={
          <>
            {/* List / Calendar Segment Control */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <button 
                type="button"
                onClick={() => setActiveView('list')}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer flex items-center gap-1.5", 
                  activeView === 'list' 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <ListFilter size={14} />
                <span>List</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveView('calendar')}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer flex items-center gap-1.5", 
                  activeView === 'calendar' 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Calendar size={14} />
                <span>Calendar</span>
              </button>
            </div>

            {/* Standardized Primary Action Button */}
            <button 
              type="button"
              onClick={() => handleOpenCreate()}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Schedule Interview</span>
            </button>
          </>
        }
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            trendPct={stat.trendPct}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
            <input 
              type="text" 
              placeholder="Search by candidate, role, round, or interviewer..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative min-w-[140px] sm:min-w-[160px]">
              <select
                value={roundFilter}
                onChange={e => setRoundFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Rounds</option>
                {availableRounds.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={13} />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100 dark:border-slate-800">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none inline-flex items-center gap-1.5",
                statusFilter === tab.key 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs" 
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-extrabold",
                statusFilter === tab.key
                  ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                  : "bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content: List or Calendar View ── */}
      {activeView === 'list' ? (
        <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[320px]">
          {filteredInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <Calendar size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {hasActiveFilters ? 'No interviews match your search' : 'No interviews scheduled'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                {hasActiveFilters 
                  ? 'Try adjusting your search criteria or resetting filters to view all sessions.' 
                  : 'Start by scheduling candidate evaluation rounds and interview panels.'}
              </p>
              {hasActiveFilters ? (
                <button 
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer select-none"
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => handleOpenCreate()}
                  className="mt-4 h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Schedule First Interview</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="hcm-table w-full text-left min-w-[800px]">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th text-left">Candidate & Role</th>
                    <th className="hcm-th text-left">Interviewer</th>
                    <th className="hcm-th text-left">Date & Time</th>
                    <th className="hcm-th text-left">Interview Round</th>
                    <th className="hcm-th text-left">Status</th>
                    <th className="hcm-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInterviews.map((item) => (
                    <tr key={item.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Candidate & Role */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleOpenEdit(item)}>
                          {item.img && !item.img.includes('ui-avatars.com') ? (
                            <img
                              src={item.img}
                              alt={item.candidate}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {getInitials(item.candidate)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-primary-600 transition-colors truncate max-w-[200px]">
                              {item.candidate}
                            </p>
                            <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 mt-1 truncate max-w-[200px]">
                              {item.role || 'Candidate'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Interviewer */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <User size={13} />
                          </div>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[150px]">
                            {item.interviewer || 'HR Team'}
                          </span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="hcm-td">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{item.date ? (typeof item.date === 'string' && item.date.includes('-') ? formatDate(item.date) : item.date) : 'Scheduled'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <Clock size={12} />
                            <span>{formatDisplayTime(item.time)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Interview Round */}
                      <td className="hcm-td">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 whitespace-nowrap">
                            {item.type === 'Phone Call' ? <Phone size={12} className="text-slate-400" /> : <Video size={12} className="text-primary-500" />}
                            <span>{item.round || 'Technical Round 1'}</span>
                          </span>
                          {item.rating ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span>{item.rating}/5 Rated</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="hcm-td">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, item.status)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border inline-block whitespace-nowrap cursor-pointer hover:opacity-80 active:scale-95",
                            (item.status || '').toLowerCase() === 'scheduled'
                              ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40"
                              : (item.status || '').toLowerCase() === 'completed'
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
                              : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                          )}
                          title="Click to toggle status (Scheduled -> Completed -> Cancelled)"
                        >
                          {item.status || 'Scheduled'}
                        </button>
                      </td>

                      {/* Actions: Standardized HR Button System */}
                      <td className="hcm-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Join Video Button */}
                          {item.link ? (
                            <button
                              type="button"
                              onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
                              title="Join Video Meeting"
                              className="h-8 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all select-none cursor-pointer shrink-0"
                            >
                              <Video size={13} />
                              <span>Join</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Add Meeting Link"
                              className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-all select-none cursor-pointer shrink-0"
                            >
                              <Link2 size={12} />
                              <span>Link</span>
                            </button>
                          )}

                          {/* Complete / Score Feedback Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenFeedback(item)}
                            title="Evaluate / Mark Complete"
                            className={cn(
                              "h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-all active:scale-95 select-none cursor-pointer shrink-0 border",
                              item.status === 'Completed'
                                ? "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
                            )}
                          >
                            {item.status === 'Completed' ? <Star size={13} className="fill-amber-400 text-amber-400" /> : <CheckCircle2 size={13} />}
                            <span>{item.status === 'Completed' ? 'Feedback' : 'Complete'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Interview Round"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete / Cancel Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(item.id)}
                            title="Delete Interview Schedule"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── Calendar View ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          <div className="lg:col-span-8 card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer select-none"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))}
                  title="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer select-none"
                  onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))}
                  title="Next Month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {monthName}
              </h3>

              <button
                type="button"
                onClick={() => {
                  setCalendarDate(new Date());
                  setSelectedCalDay(todayKey);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Day Names Grid Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-center py-2.5 text-xs font-bold text-slate-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
              {calendarDays.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => cell && setSelectedCalDay(cell.dateKey)}
                  className={cn(
                    "min-h-[64px] sm:min-h-[85px] md:min-h-[95px] p-1.5 transition-all select-none",
                    cell ? "cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-950/20" : "bg-slate-50/40 dark:bg-slate-800/20",
                    cell?.dateKey === selectedCalDay && "bg-primary-50/80 dark:bg-primary-950/40 ring-1 ring-primary-500",
                    cell?.dateKey === todayKey && "bg-amber-50/40 dark:bg-amber-950/20"
                  )}
                >
                  {cell && (
                    <>
                      <div className={cn(
                        "text-xs font-bold mb-1 flex items-center justify-between",
                        cell.dateKey === todayKey ? "text-primary-600 dark:text-primary-400" : "text-slate-700 dark:text-slate-300"
                      )}>
                        <span>{cell.day}</span>
                        {cell.dateKey === todayKey && (
                          <span className="text-[8px] bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 px-1 py-0.2 rounded font-extrabold">Today</span>
                        )}
                      </div>

                      {/* Mobile indicator dots */}
                      {cell.interviews.length > 0 && (
                        <div className="sm:hidden flex items-center justify-center gap-1 mt-1">
                          {cell.interviews.slice(0, 3).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                          ))}
                          {cell.interviews.length > 3 && (
                            <span className="text-[8px] font-bold text-slate-400">+{cell.interviews.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Desktop interview chips */}
                      {cell.interviews.length > 0 && (
                        <div className="hidden sm:block space-y-1">
                          {cell.interviews.slice(0, 2).map((intv, i) => (
                            <div
                              key={i}
                              className={cn(
                                "text-[10px] font-semibold truncate px-1.5 py-0.5 rounded border",
                                intv.status === 'Completed'
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/40"
                                  : intv.status === 'Cancelled'
                                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/40"
                                  : "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-900/40"
                              )}
                            >
                              {intv.candidate || 'Candidate'}
                            </div>
                          ))}
                          {cell.interviews.length > 2 && (
                            <div className="text-[9px] text-slate-400 font-bold pl-1">
                              +{cell.interviews.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Side Panel */}
          <div className="lg:col-span-4 card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCalDay ? formatDate(selectedCalDay) : 'Select a Day'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDayInterviews.length} session{selectedDayInterviews.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreate('', selectedCalDay || '')}
                className="h-8 px-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs active:scale-95 transition-all select-none cursor-pointer"
              >
                <Plus size={13} />
                <span>Schedule</span>
              </button>
            </div>

            <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto">
              {selectedDayInterviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <CalendarDays size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No interviews on this date</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select another date or create a schedule.</p>
                  <button
                    type="button"
                    className="mt-3 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer inline-flex items-center gap-1 select-none"
                    onClick={() => handleOpenCreate('', selectedCalDay || '')}
                  >
                    <span>+ Schedule interview for this day</span>
                  </button>
                </div>
              ) : (
                selectedDayInterviews.map((intv) => (
                  <div
                    key={intv.id}
                    className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {intv.img && !intv.img.includes('ui-avatars.com') ? (
                          <img
                            src={intv.img}
                            alt={intv.candidate}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(intv.candidate)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{intv.candidate}</p>
                          <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 truncate">{intv.role || 'Candidate'}</p>
                        </div>
                      </div>

                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 border",
                        (intv.status || '').toLowerCase() === 'scheduled'
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40"
                          : (intv.status || '').toLowerCase() === 'completed'
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40"
                      )}>
                        {intv.status || 'Scheduled'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1">
                        <Clock size={12} />
                        {formatDisplayTime(intv.time)} • {intv.round}
                      </span>
                      <span className="truncate max-w-[120px]">
                        With: {intv.interviewer}
                      </span>
                    </div>

                    {/* Quick actions for calendar item */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                      {intv.link ? (
                        <button
                          type="button"
                          onClick={() => window.open(intv.link, '_blank', 'noopener,noreferrer')}
                          className="h-7 px-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs cursor-pointer select-none"
                        >
                          <Video size={12} />
                          <span>Join</span>
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleOpenFeedback(intv)}
                        className="h-7 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-semibold inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer select-none"
                      >
                        <CheckCircle2 size={12} />
                        <span>Complete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(intv)}
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-primary-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(intv.id)}
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule / Edit Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col text-left"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingInterview ? 'Edit Interview Round' : 'Schedule New Interview'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Candidate Selection */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                      Candidate <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.candidateId || formData.candidate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matchedCandidate = (candidates || []).find((c) => c.id === val || c.name === val);
                        setFormData(prev => ({
                          ...prev,
                          candidateId: matchedCandidate ? matchedCandidate.id : val,
                          candidate: matchedCandidate ? matchedCandidate.name : val,
                          role: matchedCandidate ? (matchedCandidate.role || prev.role) : prev.role
                        }));
                        setFormErrors(p => ({ ...p, candidate: '' }));
                      }}
                      className={cn(
                        "w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer",
                        formErrors.candidate && "ring-2 ring-rose-300 border-rose-300"
                      )}
                    >
                      <option value="">Select Candidate</option>
                      {(candidates || []).map((c) => (
                        <option key={c.id} value={c.id || c.name}>
                          {c.name} — {c.role || 'Candidate'} {c.email ? `(${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                    {formErrors.candidate && <p className="text-xs text-rose-500 ml-1">{formErrors.candidate}</p>}
                  </div>

                  {/* Applied Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Applied Role</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>

                  {/* Interviewer Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Interviewer</label>
                    <select
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      value={formData.interviewerId || formData.interviewer}
                      onChange={(e) => {
                        const emp = employees.find((ep) => ep.id === e.target.value || ep.name === e.target.value);
                        setFormData({
                          ...formData,
                          interviewerId: emp?.id || '',
                          interviewer: emp ? (emp.fullName || emp.name) : e.target.value
                        });
                      }}
                    >
                      <option value="">Select Interviewer</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName || emp.name} ({emp.department || 'Team'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <DatePicker
                      className="w-full h-10"
                      value={formData.date}
                      onChange={(val) => {
                        const nextDate = typeof val === 'string' ? val : val?.target?.value || '';
                        setFormData(prev => ({ ...prev, date: nextDate }));
                        setFormErrors(p => ({ ...p, date: '' }));
                      }}
                    />
                    {formErrors.date && <p className="text-xs text-rose-500 ml-1">{formErrors.date}</p>}
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                      Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => {
                        setFormData({ ...formData, time: e.target.value });
                        setFormErrors(p => ({ ...p, time: '' }));
                      }}
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    {formErrors.time && <p className="text-xs text-rose-500 ml-1">{formErrors.time}</p>}
                  </div>

                  {/* Interview Round */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Interview Round</label>
                    <select
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      value={formData.round}
                      onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                    >
                      <option value="HR Screening">HR Screening</option>
                      <option value="Technical Round 1">Technical Round 1</option>
                      <option value="Technical Round 2">Technical Round 2</option>
                      <option value="System Design">System Design</option>
                      <option value="Managerial Round">Managerial Round</option>
                      <option value="Culture Fit / Executive">Culture Fit / Executive</option>
                      <option value="Final Offer Discussion">Final Offer Discussion</option>
                    </select>
                  </div>

                  {/* Meeting Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Meeting Type / Mode</label>
                    <select
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Google Meet">Google Meet (Video)</option>
                      <option value="Zoom Meeting">Zoom Meeting</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="In-Person (Office)">In-Person (Office)</option>
                      <option value="Phone Call">Phone Call</option>
                    </select>
                  </div>

                  {/* Meeting Link */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5 flex items-center gap-1">
                        <Link2 size={13} />
                        <span>Video URL / Meeting Link</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateMeetLink}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer select-none"
                      >
                        + Generate Google Meet Link
                      </button>
                    </div>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://meet.google.com/xyz-abc-def"
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Modal Actions: Standardized HR Button System */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 disabled:opacity-50 select-none cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{editingInterview ? 'Update Schedule' : 'Confirm Schedule'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Feedback & Complete Modal ── */}
      <AnimatePresence>
        {isFeedbackModalOpen && feedbackInterview && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 text-left"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between pb-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Interview Evaluation & Rating</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {feedbackInterview.candidate} • {feedbackInterview.round}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Overall Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={cn(
                          "p-2 rounded-xl border transition-all cursor-pointer select-none",
                          feedbackRating >= star
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-500 shadow-xs"
                            : "bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-300"
                        )}
                      >
                        <Star size={20} className={cn(feedbackRating >= star && "fill-amber-400")} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">{feedbackRating} / 5 Stars</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Evaluation Notes & Recommendations</label>
                  <textarea
                    rows={4}
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Provide notes on candidate strengths, technical proficiency, problem-solving, and recommendation..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-y min-h-[100px]"
                  />
                </div>

                {/* Modal Buttons: Standardized HR Button System */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                    onClick={() => setIsFeedbackModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Save Feedback & Complete</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete / Cancel Confirmation Modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-left">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Scheduled Interview?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone. The scheduled round will be permanently removed from the system.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDeleteConfirm(null)} className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-rose-500/20 select-none cursor-pointer">
                  <Trash2 size={16} />
                  <span>Delete Schedule</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewManagement;

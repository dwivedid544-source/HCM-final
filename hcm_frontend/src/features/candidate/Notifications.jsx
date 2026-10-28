import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, Trash2, CheckCircle2, Briefcase, Calendar,
  AlertCircle, Zap, CheckCheck, ArrowRight, X, Filter,
  RefreshCw, Wifi, Clock, ExternalLink, ShieldCheck, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import PageHeader from '../../shared/components/ui/PageHeader';

// ─── Skeletons ────────────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const NotificationSkeleton = () => (
  <div className="card p-5 animate-pulse space-y-3">
    <div className="flex items-start gap-4">
      <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-4 w-40" />
          <SkeletonBox className="h-3 w-16" />
        </div>
        <SkeletonBox className="h-3.5 w-full" />
        <SkeletonBox className="h-3.5 w-3/4" />
        <div className="flex justify-between items-center pt-2">
          <SkeletonBox className="h-6 w-24 rounded-lg" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Category and Visual Configurations ───────────────────────────────────────
const TYPE_CONFIG = {
  offers: {
    icon: Zap,
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    label: 'Offers',
    targetRoute: '/candidate/offers'
  },
  interviews: {
    icon: Calendar,
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50',
    label: 'Interviews',
    targetRoute: '/candidate/interviews'
  },
  jobs: {
    icon: Briefcase,
    bg: 'bg-primary-50 dark:bg-primary-950/30',
    text: 'text-primary-600 dark:text-primary-400',
    dot: 'bg-primary-500',
    badge: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/30 dark:text-primary-400 dark:border-primary-900/50',
    label: 'Career',
    targetRoute: '/candidate/applications'
  },
  system: {
    icon: AlertCircle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
    label: 'System',
    targetRoute: '/candidate/dashboard'
  },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'jobs', label: 'Career' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'offers', label: 'Offers' },
  { id: 'system', label: 'System' },
];

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    showToast,
    refetch,
    isLoading,
    error
  } = useCandidate();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [selectedNote, setSelectedNote] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Trigger notifications fetch on mount
  useEffect(() => {
    if (refetch?.fetchNotifications) {
      refetch.fetchNotifications();
    }
  }, [refetch]);

  // Periodic lightweight polling every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      if (refetch?.fetchNotifications) {
        refetch.fetchNotifications();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Dynamic unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.isUnread).length;
  }, [notifications]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: notifications.length };
    TABS.slice(1).forEach(t => {
      counts[t.id] = notifications.filter(n => n.type === t.id).length;
    });
    return counts;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(note => {
      const matchesTab = activeTab === 'all' || note.type === activeTab;
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        note.title?.toLowerCase().includes(query) ||
        note.message?.toLowerCase().includes(query);
      const matchesUnread = !unreadOnly || note.isUnread;

      return matchesTab && matchesSearch && matchesUnread;
    });
  }, [notifications, activeTab, searchTerm, unreadOnly]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      if (refetch?.fetchNotifications) {
        await refetch.fetchNotifications();
      }
      showToast?.('Notifications refreshed', 'info');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
      showToast?.('All notifications marked as read', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setClearConfirmOpen(false);
      showToast?.('All notifications cleared', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSingle = async (id) => {
    try {
      await deleteNotification(id);
      setDeleteTargetId(null);
      if (selectedNote?.id === id) {
        setDetailsModalOpen(false);
        setSelectedNote(null);
      }
      showToast?.('Notification removed', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetails = (note) => {
    if (note.isUnread) {
      markAsRead(note.id);
    }
    setSelectedNote(note);
    setDetailsModalOpen(true);
  };

  const handleNavigateFromDetails = (note) => {
    setDetailsModalOpen(false);
    if (note.link && note.link.startsWith('/')) {
      navigate(note.link);
      return;
    }
    const target = TYPE_CONFIG[note.type]?.targetRoute || '/candidate/dashboard';
    navigate(target);
  };

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shadow-sm">
          <Wifi size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Notifications</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
        </div>
        <button className="btn-primary" onClick={handleRefresh}>
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left px-2 sm:px-0">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Notifications"
        description={
          <span className="flex items-center gap-2">
            <span>Inbox</span>
            <span>•</span>
            {unreadCount > 0 ? (
              <span className="text-primary-600 dark:text-primary-400 font-bold">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-slate-400">All caught up</span>
            )}
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-ghost btn-compact text-xs flex items-center gap-1.5 cursor-pointer"
              title="Refresh notifications"
            >
              <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className={cn(
                'btn-secondary btn-compact text-xs flex items-center gap-1.5 cursor-pointer',
                unreadCount === 0 && 'opacity-50 cursor-not-allowed'
              )}
              title="Mark all notifications as read"
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>

            <button
              type="button"
              onClick={() => setClearConfirmOpen(true)}
              disabled={notifications.length === 0}
              className={cn(
                'btn-secondary btn-compact text-xs text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 cursor-pointer',
                notifications.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
              title="Clear all notifications"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          </>
        }
      />

      {/* ── Filters & Search Row ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Category Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
          {TABS.map(tab => {
            const count = tabCounts[tab.id] || 0;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5',
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    active
                      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Unread toggle */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search notifications..."
              className="input-field pl-10 pr-8 h-10 bg-white dark:bg-slate-900 font-medium text-xs sm:text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              'px-3 py-2 text-xs font-bold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 h-10',
              unreadOnly
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            )}
            title="Toggle unread only"
          >
            <Filter size={13} />
            <span className="hidden sm:inline">Unread</span>
          </button>
        </div>
      </div>

      {/* ── Notification Cards List ─────────────────────────────────── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading && notifications.length === 0 ? (
            <div className="space-y-3">
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((note) => {
              const cfg = TYPE_CONFIG[note.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon;

              return (
                <motion.div
                  layout
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => handleOpenDetails(note)}
                  className={cn(
                    'card p-4 sm:p-5 transition-all duration-200 cursor-pointer group hover:shadow-md border flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4',
                    note.isUnread
                      ? 'border-primary-200 dark:border-primary-900/60 bg-white dark:bg-slate-900 shadow-soft border-l-4 border-l-primary-600'
                      : 'border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 opacity-80 hover:opacity-100'
                  )}
                >
                  {/* Category Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                    cfg.bg, cfg.text
                  )}>
                    <Icon size={18} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 w-full">
                    {/* Top row: Title, unread dot & timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {note.title}
                        </h3>
                        {note.isUnread && (
                          <span className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', cfg.dot)} />
                        )}
                      </div>

                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                        <Clock size={11} />
                        <span>{note.time}</span>
                      </span>
                    </div>

                    {/* Message content */}
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                      {note.message}
                    </p>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-50 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateFromDetails(note);
                          }}
                          className="btn-ghost btn-compact text-[11px] px-2 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 flex items-center gap-1"
                        >
                          <span>{note.action || 'View Details'}</span>
                          <ArrowRight size={12} />
                        </button>

                        {note.isUnread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(note.id);
                            }}
                            className="btn-ghost btn-compact text-[11px] px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                            title="Mark as read"
                          >
                            <Check size={12} />
                            <span>Read</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(note.id);
                          }}
                          className="btn-ghost btn-compact text-[11px] px-2 py-1 text-slate-400 hover:text-rose-600 flex items-center gap-1"
                          title="Delete notification"
                        >
                          <Trash2 size={12} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>

                      {/* Category Badge */}
                      <span className={cn(
                        'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                        cfg.badge
                      )}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            /* Empty State */
            <div className="card py-16 text-center space-y-4 flex flex-col items-center border border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm">
                <Bell size={26} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchTerm
                    ? 'No matching notifications'
                    : unreadOnly
                      ? 'No unread notifications'
                      : activeTab !== 'all'
                        ? `No ${TYPE_CONFIG[activeTab]?.label || activeTab} notifications`
                        : 'No notifications yet'}
                </p>

                <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchTerm
                    ? 'Try a different keyword or search query.'
                    : unreadOnly
                      ? 'You have reviewed all your pending updates.'
                      : 'You will receive updates here regarding your applications, interviews, and offers.'}
                </p>
              </div>

              {(searchTerm || activeTab !== 'all' || unreadOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveTab('all');
                    setUnreadOnly(false);
                  }}
                  className="btn-secondary btn-compact text-xs mx-auto"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Notification Details Modal ───────────────────────────────── */}
      <CenterModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Notification Details"
        maxWidth="max-w-lg"
      >
        {selectedNote && (() => {
          const cfg = TYPE_CONFIG[selectedNote.type] || TYPE_CONFIG.system;
          const Icon = cfg.icon;

          return (
            <div className="p-5 sm:p-7 space-y-5 text-left">
              {/* Header */}
              <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                  cfg.bg, cfg.text
                )}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', cfg.badge)}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> {selectedNote.time}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedNote.title}
                  </h3>
                </div>
              </div>

              {/* Message */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedNote.message}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteSingle(selectedNote.id)}
                  className="btn-secondary text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setDetailsModalOpen(false)}
                    className="btn-secondary text-xs flex-1 sm:flex-none"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateFromDetails(selectedNote)}
                    className="btn-primary text-xs flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                  >
                    <span>Go to {cfg.label}</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </CenterModal>

      {/* ── Clear All Confirmation Modal ─────────────────────────────── */}
      <CenterModal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
            <Trash2 size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clear All Notifications?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This will permanently delete all {notifications.length} notifications from your inbox. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setClearConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger flex-1 text-xs flex items-center justify-center gap-1.5"
              onClick={handleClearAll}
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </CenterModal>

      {/* ── Delete Single Confirmation Modal ──────────────────────────── */}
      <CenterModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Notification?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove this notification from your inbox?
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger flex-1 text-xs"
              onClick={() => deleteTargetId && handleDeleteSingle(deleteTargetId)}
            >
              Delete
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default Notifications;

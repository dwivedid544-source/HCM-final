import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Search, MessageSquare,
  Check, X, Info, FileText, DollarSign, Wallet, AlertCircle,
  RefreshCw, ExternalLink, ChevronDown, Receipt, User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import CenterModal from '../../shared/components/layout/CenterModal';
import { reimbursementAPI } from '../../utils/apiService';
import DatePicker from '../../shared/components/common/DatePicker';
import { useDateFormat } from '../../hooks/useDateFormat';
import toast from 'react-hot-toast';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import PageHeader from '../../shared/components/ui/PageHeader';

// ── Tab definitions ──────────────────────────────────────────
const TABS = [
  { key: 'Pending Approval', label: 'PENDING APPROVAL', apiKey: 'pending_approval' },
  { key: 'Pending Payment',  label: 'PENDING PAYMENT',  apiKey: 'pending_payment' },
  { key: 'Completed',        label: 'COMPLETED',         apiKey: 'completed' },
  { key: 'All',              label: 'ALL',               apiKey: 'all' },
];

// ── Status badge helper ───────────────────────────────────────
const StatusBadge = ({ claim }) => {
  const status = claim.overallStatus || 'Submitted';
  let colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40';
  if (status === 'Completed' || status === 'Approved') {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40';
  } else if (status.toLowerCase().includes('rejected')) {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40';
  }
  return (
    <span className={cn(
      'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block border whitespace-nowrap',
      colorClass
    )}>
      {status}
    </span>
  );
};

// ── Employee initials avatar ──────────────────────────────────
const InitialsAvatar = ({ name, src, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover border border-slate-200 dark:border-slate-700', sizeClass)} />;
  }
  return (
    <div className={cn(
      'rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center border border-indigo-100 dark:border-indigo-900 shrink-0',
      sizeClass
    )}>
      {initials}
    </div>
  );
};

// ── Skeleton row ──────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1,2,3,4,5].map(i => (
      <td key={i} className="px-6 py-5">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4 mb-1.5"/>
        <div className="h-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg w-1/2"/>
      </td>
    ))}
  </tr>
);

// ── Approval History Timeline ─────────────────────────────────
const ApprovalTimeline = ({ history }) => {
  if (!history || history.length === 0) return null;
  let parsed = [];
  if (typeof history === 'string') {
    try { parsed = JSON.parse(history); } catch { return null; }
  } else if (Array.isArray(history)) {
    parsed = history;
  }
  return (
    <div className="space-y-2.5">
      {parsed.map((entry, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{entry.action}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {entry.actor}
              {entry.date ? ` · ${new Date(entry.date).toLocaleDateString()}` : ''}
            </p>
            {entry.comment && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5">"{entry.comment}"</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const AdminReimbursements = () => {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDateFormat();

  // ── State ─────────────────────────────────────────────────
  const [claims, setClaims]           = useState([]);
  const [stats, setStats]             = useState({ pendingApprovals: 0, pendingPayment: 0, completed: 0, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = usePersistedTab('admin_reimbursements', 'Pending Approval');

  // Modals
  const [selectedClaim, setSelectedClaim]             = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen]   = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen]     = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen]     = useState(false);

  // Action state
  const [comment, setComment]               = useState('');
  const [reviewAction, setReviewAction]     = useState(null); // 'Approved' | 'Rejected'
  const [actionLoading, setActionLoading]   = useState(false);
  const [paymentData, setPaymentData]       = useState({
    paymentMethod: 'Bank Transfer',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // ── Fetch ─────────────────────────────────────────────────
  const fetchClaims = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError(null);
    try {
      // Always fetch ALL claims so stats are accurate; filtering is done client-side for tabs
      const res = await reimbursementAPI.getFinalApprovals();
      if (res.data?.success) {
        setClaims(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      } else {
        setFetchError('Failed to load reimbursement data from server.');
      }
    } catch (err) {
      console.error('Error fetching reimbursements:', err);
      setFetchError(err.response?.data?.error?.message || 'Failed to load reimbursements. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  // ── Computed stats from local data (also updated from server) ──
  const localStats = useMemo(() => ({
    pendingApprovals: claims.filter(c => c.finalApprovalStatus === 'Pending').length,
    pendingPayment:   claims.filter(c => c.finalApprovalStatus === 'Approved' && c.paymentStatus === 'Pending').length,
    completed:        claims.filter(c => c.paymentStatus === 'Processed' || c.finalApprovalStatus === 'Rejected').length,
    total:            claims.length,
  }), [claims]);

  const displayStats = {
    pendingApprovals: stats.total > 0 ? stats.pendingApprovals : localStats.pendingApprovals,
    pendingPayment:   stats.total > 0 ? stats.pendingPayment   : localStats.pendingPayment,
    completed:        stats.total > 0 ? stats.completed        : localStats.completed,
    total:            stats.total > 0 ? stats.total            : localStats.total,
  };

  // ── Filter ────────────────────────────────────────────────
  const filteredClaims = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    return claims.filter(c => {
      // Tab filter
      let matchesTab = false;
      if (activeTab === 'All') {
        matchesTab = true;
      } else if (activeTab === 'Pending Approval') {
        matchesTab = c.finalApprovalStatus === 'Pending';
      } else if (activeTab === 'Pending Payment') {
        matchesTab = c.finalApprovalStatus === 'Approved' && c.paymentStatus === 'Pending';
      } else if (activeTab === 'Completed') {
        matchesTab = c.paymentStatus === 'Processed' || c.finalApprovalStatus === 'Rejected';
      }

      // Search filter
      if (!term) return matchesTab;
      const matchesSearch =
        c.title?.toLowerCase().includes(term) ||
        c.employee?.fullName?.toLowerCase().includes(term) ||
        c.employee?.employeeId?.toLowerCase().includes(term) ||
        c.id?.toLowerCase().includes(term) ||
        c.employee?.department?.name?.toLowerCase().includes(term) ||
        c.provider?.toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });
  }, [claims, activeTab, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────
  const openReviewModal = (claim, action) => {
    setSelectedClaim(claim);
    setReviewAction(action);
    setComment('');
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (actionLoading) return;
    setIsReviewModalOpen(false);
    setSelectedClaim(null);
    setReviewAction(null);
    setComment('');
  };

  const handleReview = async () => {
    if (!selectedClaim || !reviewAction) return;
    setActionLoading(true);
    try {
      const res = await reimbursementAPI.reviewFinalApproval(selectedClaim.id, {
        status: reviewAction,
        comment: comment.trim() || undefined
      });
      if (res.data?.success) {
        toast.success(`Claim ${reviewAction.toLowerCase()} successfully`);
        closeReviewModal();
        fetchClaims(true);
      } else {
        toast.error(res.data?.error?.message || 'Failed to update claim');
      }
    } catch (err) {
      console.error('Review error:', err);
      toast.error(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const openPaymentModal = (claim) => {
    setSelectedClaim(claim);
    setPaymentData({
      paymentMethod: 'Bank Transfer',
      paymentReference: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    if (actionLoading) return;
    setIsPaymentModalOpen(false);
    setSelectedClaim(null);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedClaim) return;
    if (!paymentData.paymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await reimbursementAPI.processPayment(selectedClaim.id, paymentData);
      if (res.data?.success) {
        toast.success('Payment processed successfully');
        closePaymentModal();
        fetchClaims(true);
      } else {
        toast.error(res.data?.error?.message || 'Failed to process payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Stat cards config ────────────────────────────────────
  const statCards = [
    {
      label: 'Pending Approvals',
      value: displayStats.pendingApprovals,
      icon: Clock,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      label: 'Pending Payment',
      value: displayStats.pendingPayment,
      icon: Wallet,
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      label: 'Completed',
      value: displayStats.completed,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      label: 'Total Claims',
      value: displayStats.total,
      icon: FileText,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <PageHeader
        title="Final Reimbursements"
        description="Approve and process payments for employee reimbursement claims"
        actions={
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => fetchClaims(true)}
              disabled={loading}
              title="Refresh reimbursement claims"
              className="btn-secondary"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-primary-600" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── API Error Banner ────────────────────────────────── */}
      {fetchError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Error Loading Reimbursements</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button
            onClick={() => fetchClaims()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-4 sm:p-6 flex items-center gap-3 sm:gap-4 shadow-sm"
          >
            <div className={cn('w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0', card.iconBg, card.iconColor)}>
              <card.icon size={22} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                {card.label}
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                {loading ? (
                  <span className="inline-block w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                ) : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs & Search ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        {/* Tabs — horizontally scrollable on mobile */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-nowrap w-full sm:w-auto pb-1 sm:pb-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0',
                activeTab === tab.key
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search claims..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Claims Table ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {[1,2,3].map(i => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : filteredClaims.length === 0 ? (
          /* Empty state */
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
              <CheckCircle2 size={36} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {searchQuery
                ? `No claims match "${searchQuery}"`
                : activeTab === 'All'
                  ? 'No reimbursement claims found'
                  : `No ${activeTab.toLowerCase()} claims`}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              {searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'Claims submitted by employees will appear here.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  {['Employee', 'Details', 'Amount', 'Status', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-5 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]',
                        i === 3 && 'text-center',
                        i === 4 && 'text-right'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredClaims.map(claim => (
                  <tr
                    key={claim.id}
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Employee */}
                    <td className="px-5 sm:px-8 py-5">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar
                          name={claim.employee?.fullName}
                          src={claim.employee?.avatarUrl}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                            {claim.employee?.fullName || '—'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {claim.employee?.employeeId || '—'}
                          </p>
                          {claim.employee?.department?.name && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {claim.employee.department.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-5 sm:px-8 py-5 max-w-[180px]">
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100 italic truncate">
                        {claim.title || '—'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">
                        Submitted: {formatDate(claim.claimedAt) || '—'}
                      </p>
                      {claim.managerStatus && (
                        <p className={cn(
                          'text-[10px] font-bold mt-0.5',
                          claim.managerStatus === 'Approved' ? 'text-emerald-500' :
                          claim.managerStatus === 'Rejected' ? 'text-rose-500' :
                          'text-amber-500'
                        )}>
                          Mgr: {claim.managerStatus}
                        </p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-5 sm:px-8 py-5">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(claim.amount)}
                      </p>
                      {claim.paymentDate && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Paid: {formatDate(claim.paymentDate)}
                        </p>
                      )}
                      {claim.paymentMethod && (
                        <p className="text-[10px] text-slate-400">
                          {claim.paymentMethod}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 sm:px-8 py-5 text-center">
                      <StatusBadge claim={claim} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 sm:px-8 py-5">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => { setSelectedClaim(claim); setIsDetailModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Info size={15} />
                        </button>

                        {/* Approve / Reject — only when pending final approval */}
                        {claim.finalApprovalStatus === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReviewModal(claim, 'Rejected')}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Reject Claim"
                            >
                              <X size={15} strokeWidth={3} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openReviewModal(claim, 'Approved')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              <Check size={12} strokeWidth={3} />
                              Approve
                            </button>
                          </>
                        )}

                        {/* Process Payment — only when approved & payment still pending */}
                        {claim.finalApprovalStatus === 'Approved' && claim.paymentStatus === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(claim)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                          >
                            <DollarSign size={12} strokeWidth={3} />
                            Pay
                          </button>
                        )}

                        {/* Completed badge */}
                        {claim.paymentStatus === 'Processed' && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} />
                            Paid
                          </span>
                        )}

                        {/* Rejected badge */}
                        {claim.finalApprovalStatus === 'Rejected' && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-rose-500 dark:text-rose-400">
                            <XCircle size={12} />
                            Rejected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────
          REVIEW MODAL (Approve / Reject)
      ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isReviewModalOpen && selectedClaim && (
          <CenterModal
            isOpen
            onClose={closeReviewModal}
            title={reviewAction === 'Approved' ? '✓ Approve Claim' : '✕ Reject Claim'}
            maxWidth="max-w-lg"
          >
            <div className="p-6 sm:p-8 space-y-6">
              {/* Employee summary */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <InitialsAvatar name={selectedClaim.employee?.fullName} src={selectedClaim.employee?.avatarUrl} size="lg" />
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedClaim.employee?.fullName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedClaim.employee?.department?.name || 'Department'} · {selectedClaim.employee?.employeeId}
                  </p>
                </div>
              </div>

              {/* Claim details grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Claim Type</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white italic">{selectedClaim.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(selectedClaim.amount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description / Notes</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                    {selectedClaim.provider || 'No description provided.'}
                  </p>
                </div>
                {selectedClaim.managerStatus && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manager Status</p>
                    <p className={cn(
                      'text-xs font-bold',
                      selectedClaim.managerStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {selectedClaim.managerStatus}
                      {selectedClaim.managerComment && ` — "${selectedClaim.managerComment}"`}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDate(selectedClaim.claimedAt)}</p>
                </div>
                {selectedClaim.receiptUrl && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt</p>
                    <a
                      href={selectedClaim.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <ExternalLink size={12} /> View Receipt
                    </a>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <MessageSquare size={12} />
                  {reviewAction === 'Rejected' ? 'Rejection Reason' : 'Comment (Optional)'}
                  {reviewAction === 'Rejected' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={reviewAction === 'Rejected' ? 'Provide reason for rejection...' : 'Add any approval notes...'}
                  rows={3}
                  className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {reviewAction === 'Rejected' ? (
                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={actionLoading || !comment.trim()}
                    className="flex-[2] py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} strokeWidth={3} />}
                    {actionLoading ? 'Rejecting...' : 'Reject Claim'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={actionLoading}
                    className="flex-[2] py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                    {actionLoading ? 'Approving...' : 'Approve Claim'}
                  </button>
                )}
              </div>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────
          PROCESS PAYMENT MODAL
      ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedClaim && (
          <CenterModal
            isOpen
            onClose={closePaymentModal}
            title="Process Payment"
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleProcessPayment} className="p-6 sm:p-8 space-y-6">
              {/* Amount summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount to Pay</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(selectedClaim.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">{selectedClaim.title}</p>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-indigo-500 border border-slate-100 dark:border-slate-700">
                  <DollarSign size={22} strokeWidth={2.5} />
                </div>
              </div>

              {/* Employee info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <InitialsAvatar name={selectedClaim.employee?.fullName} src={selectedClaim.employee?.avatarUrl} />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{selectedClaim.employee?.fullName}</p>
                  <p className="text-[10px] text-slate-400">{selectedClaim.employee?.employeeId} · {selectedClaim.employee?.department?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={e => setPaymentData(p => ({ ...p, paymentMethod: e.target.value }))}
                    required
                    className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Payroll Addition">Payroll Addition</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <DatePicker
                    value={paymentData.paymentDate}
                    onChange={e => setPaymentData(p => ({ ...p, paymentDate: e.target.value }))}
                    required
                  />
                </div>

                {/* Reference Number */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentData.paymentReference}
                    onChange={e => setPaymentData(p => ({ ...p, paymentReference: e.target.value }))}
                    placeholder="e.g. TRN-12345678"
                    className="w-full p-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <MessageSquare size={11} />
                    Notes
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={e => setPaymentData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Add any payment notes..."
                    rows={2}
                    className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-[2] py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Receipt size={14} />}
                  {actionLoading ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </CenterModal>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────
          DETAIL VIEW MODAL
      ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDetailModalOpen && selectedClaim && (
          <CenterModal
            isOpen
            onClose={() => { setIsDetailModalOpen(false); setSelectedClaim(null); }}
            title="Claim Details"
            maxWidth="max-w-lg"
          >
            <div className="p-6 sm:p-8 space-y-5">
              {/* Employee header */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <InitialsAvatar name={selectedClaim.employee?.fullName} src={selectedClaim.employee?.avatarUrl} size="lg" />
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedClaim.employee?.fullName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedClaim.employee?.employeeId} · {selectedClaim.employee?.department?.name}
                  </p>
                  {selectedClaim.employee?.user?.email && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedClaim.employee.user.email}</p>
                  )}
                </div>
              </div>

              {/* Claim info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Claim Type', value: selectedClaim.title },
                  { label: 'Amount', value: formatCurrency(selectedClaim.amount) },
                  { label: 'Submitted', value: formatDate(selectedClaim.claimedAt) },
                  { label: 'Manager Status', value: selectedClaim.managerStatus },
                  { label: 'Final Status', value: selectedClaim.finalApprovalStatus },
                  { label: 'Payment Status', value: selectedClaim.paymentStatus },
                  ...(selectedClaim.paymentMethod ? [{ label: 'Payment Method', value: selectedClaim.paymentMethod }] : []),
                  ...(selectedClaim.paymentReference ? [{ label: 'Reference', value: selectedClaim.paymentReference }] : []),
                  ...(selectedClaim.paymentDate ? [{ label: 'Payment Date', value: formatDate(selectedClaim.paymentDate) }] : []),
                ].map(item => (
                  <div key={item.label} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.value || '—'}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selectedClaim.provider && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description / Notes</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedClaim.provider}</p>
                </div>
              )}

              {/* Final comment */}
              {selectedClaim.finalApprovalComment && (
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/30 text-xs">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Admin Comment</p>
                  <p className="text-slate-700 dark:text-slate-300 italic">"{selectedClaim.finalApprovalComment}"</p>
                </div>
              )}

              {/* Receipt link */}
              {selectedClaim.receiptUrl && (
                <a
                  href={selectedClaim.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <ExternalLink size={13} />
                  View Attached Receipt
                </a>
              )}

              {/* Approval Timeline */}
              {selectedClaim.approvalHistory && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Approval Timeline</p>
                  <ApprovalTimeline history={selectedClaim.approvalHistory} />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => { setIsDetailModalOpen(false); setSelectedClaim(null); }}
                  className="w-full py-2.5 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReimbursements;

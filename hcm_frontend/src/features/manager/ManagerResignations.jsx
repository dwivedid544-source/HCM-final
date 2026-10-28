import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  Search,
  Check,
  X,
  FileText,
  User,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  Loader2,
  Download
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';
import Avatar from '../../shared/components/ui/Avatar';
import EmptyState from '../../shared/components/ui/EmptyState';
import StatCard from '../../shared/components/ui/StatCard';
import CenterModal from '../../shared/components/layout/CenterModal';
import { useDateFormat } from '../../hooks/useDateFormat';

const ManagerResignations = () => {
  const { 
    resignations = [], 
    reviewResignation, 
    fetchResignations,
    showToast,
    loading 
  } = useManager();
  const { formatDate } = useDateFormat();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingItem, setReviewingItem] = useState(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Normalize status text
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_MANAGER_APPROVAL':
      case 'Pending':
        return { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40' };
      case 'PENDING_HR_APPROVAL':
        return { label: 'Pending HR Approval', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40' };
      case 'APPROVED':
      case 'Approved':
        return { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40' };
      case 'REJECTED_BY_MANAGER':
      case 'REJECTED':
      case 'Rejected':
        return { label: 'Rejected', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40' };
      default:
        return { label: status ? status.replace(/_/g, ' ') : 'Pending', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = resignations.length;
    const pending = resignations.filter(r => r.status === 'PENDING_MANAGER_APPROVAL' || r.status === 'Pending').length;
    const approved = resignations.filter(r => r.status === 'PENDING_HR_APPROVAL' || r.status === 'APPROVED' || r.status === 'Approved').length;
    const rejected = resignations.filter(r => r.status === 'REJECTED_BY_MANAGER' || r.status === 'REJECTED' || r.status === 'Rejected').length;

    return [
      { label: 'Pending Review', value: pending.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
      { label: 'Approved by Manager', value: approved.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
      { label: 'Rejected', value: rejected.toString(), icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
      { label: 'Total Offboarding', value: total.toString(), icon: UserX, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    ];
  }, [resignations]);

  // Filtering Logic
  const filteredResignations = useMemo(() => {
    return resignations.filter(r => {
      const empName = r.employee?.fullName || r.employeeName || '';
      const empId = r.employee?.employeeId || '';
      const reason = r.reason || '';

      const matchesTab = activeTab === 'All' ? true :
        activeTab === 'Pending' ? (r.status === 'PENDING_MANAGER_APPROVAL' || r.status === 'Pending') :
        activeTab === 'Approved' ? (r.status === 'PENDING_HR_APPROVAL' || r.status === 'APPROVED' || r.status === 'Approved') :
        (r.status === 'REJECTED_BY_MANAGER' || r.status === 'REJECTED' || r.status === 'Rejected');

      const matchesSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reason.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [resignations, activeTab, searchQuery]);

  const handleReviewSubmit = async (status) => {
    if (!reviewingItem) return;
    if (!comment.trim()) {
      setCommentError('Manager feedback notes are required to approve or reject this request.');
      showToast('Please provide manager feedback comments.', 'error');
      return;
    }
    setCommentError('');
    setActionLoading(true);
    try {
      if (reviewResignation) {
        await reviewResignation(reviewingItem.id, status, comment.trim());
      }
      setReviewingItem(null);
      setComment('');
      setCommentError('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    showToast('Exporting team resignations history...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Employee Name', 'Employee ID', 'Department', 'Submission Date', 'Proposed Last Working Day', 'Reason', 'Status', 'Manager Comment'];
        const rows = filteredResignations.map(r => [
          `"${(r.employee?.fullName || '').replace(/"/g, '""')}"`,
          `"${(r.employee?.employeeId || '').replace(/"/g, '""')}"`,
          `"${(r.employee?.department?.name || 'General').replace(/"/g, '""')}"`,
          r.submissionDate ? formatDate(r.submissionDate) : 'N/A',
          r.lastWorkingDay ? formatDate(r.lastWorkingDay) : 'N/A',
          `"${(r.reason || '').replace(/"/g, '""')}"`,
          r.status || 'Pending',
          `"${(r.managerComment || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'team_resignations_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Team resignations report exported successfully!', 'success');
      } catch (err) {
        showToast('Error exporting resignations', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
      {/* Header Section */}
      <PageHeader
        title="Team Resignations"
        subtitle="Review and manage resignation requests from your team"
      >
        <Button 
          variant="export" 
          size="sm" 
          leftIcon={Download} 
          isLoading={isExporting} 
          onClick={handleExport}
        >
          Export Report
        </Button>
      </PageHeader>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-left">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto shrink-0">
          {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap border cursor-pointer select-none",
                activeTab === tab 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs" 
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 text-slate-400">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by employee name, ID or reason..."
            className="input-field pl-10 h-11 w-full text-xs sm:text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Resignations List Container */}
      <div className="space-y-4">
        {filteredResignations.length > 0 ? (
          filteredResignations.map((req) => {
            const statusInfo = getStatusBadge(req.status);
            const empName = req.employee?.fullName || req.employeeName || 'Team Member';
            const empId = req.employee?.employeeId || 'STAFF';
            const deptName = req.employee?.department?.name || 'Department';
            const avatarUrl = req.employee?.avatarUrl || req.img || '';

            return (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 text-left space-y-5"
              >
                {/* Top Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <Avatar src={avatarUrl} alt={empName} size="lg" />
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                        {empName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        ID: {empId} • {deptName}
                      </p>
                    </div>
                  </div>

                  <span className={cn("px-3 py-1 rounded-lg text-xs font-extrabold inline-block border self-start sm:self-center shrink-0", statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Left Column: Dates */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Submission Date</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {req.submissionDate ? formatDate(req.submissionDate) : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Proposed Last Working Day (LWD)</span>
                      <p className="font-extrabold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary-500" />
                        {req.lastWorkingDay ? formatDate(req.lastWorkingDay) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Reason */}
                  <div className="md:col-span-2 space-y-1.5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                      <MessageSquare size={13} /> Employee Resignation Reason
                    </span>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      "{req.reason || 'No description provided.'}"
                    </div>
                  </div>
                </div>

                {/* Manager Comments & Decision Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {req.managerComment ? (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manager Review Comment</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 italic bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                        "{req.managerComment}"
                      </p>
                      {req.managerDecisionDate && (
                        <p className="text-[10px] text-slate-400 font-bold">
                          Reviewed on {formatDate(req.managerDecisionDate)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      No manager review notes recorded yet.
                    </div>
                  )}

                  {/* Review Action Triggers */}
                  {(req.canApprove || req.status === 'PENDING_MANAGER_APPROVAL' || req.status === 'Pending') && (
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setReviewingItem(req);
                          setComment(req.managerComment || '');
                        }}
                      >
                        Review Application
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="card p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <EmptyState
              icon={UserX}
              title="No resignation requests found"
              description="There are currently no team resignation applications matching your filter criteria."
            />
          </div>
        )}
      </div>

      {/* Review Modal */}
      <CenterModal
        isOpen={!!reviewingItem}
        onClose={() => !actionLoading && setReviewingItem(null)}
        title="Review Resignation Request"
      >
        {reviewingItem && (
          <div className="space-y-6 text-left p-1">
            {/* Employee Info Header */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar src={reviewingItem.employee?.avatarUrl || reviewingItem.img} alt={reviewingItem.employee?.fullName || 'Employee'} size="md" />
                <div>
                  <h4 className="font-extrabold text-sm text-white leading-tight">
                    {reviewingItem.employee?.fullName || reviewingItem.employeeName || 'Team Member'}
                  </h4>
                  <p className="text-xs text-primary-400 font-bold mt-0.5">
                    Proposed LWD: {reviewingItem.lastWorkingDay ? formatDate(reviewingItem.lastWorkingDay) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Resignation Reason</label>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 italic">
                "{reviewingItem.reason || 'No detailed reason provided.'}"
              </div>
            </div>

            {/* Feedback / Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Manager Feedback / Decision Notes <span className="text-rose-500">*</span></span>
                {commentError && (
                  <span className="text-[11px] font-extrabold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} /> Required
                  </span>
                )}
              </label>
              <textarea
                rows="3"
                placeholder="Provide rationale for approval/rejection or handoff details..."
                className={cn(
                  "input-field p-3 text-xs sm:text-sm font-medium w-full resize-none transition-all",
                  commentError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-400/20 bg-rose-50/20 dark:bg-rose-950/20" : ""
                )}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (commentError && e.target.value.trim()) setCommentError('');
                }}
              />
              {commentError && (
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mt-1">
                  <AlertCircle size={13} className="shrink-0" />
                  {commentError}
                </p>
              )}
            </div>

            {/* Decision Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                isDisabled={actionLoading}
                onClick={() => setReviewingItem(null)}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  isLoading={actionLoading}
                  leftIcon={X}
                  onClick={() => handleReviewSubmit('REJECTED_BY_MANAGER')}
                >
                  Reject
                </Button>

                <Button
                  type="button"
                  variant="success"
                  size="md"
                  isLoading={actionLoading}
                  leftIcon={Check}
                  onClick={() => handleReviewSubmit('PENDING_HR_APPROVAL')}
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
};

export default ManagerResignations;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserMinus, UserCheck, ShieldAlert, CheckCircle2, Clock,
  AlertTriangle, Search, Plus, X, Shield, RotateCcw, Trash2,
  Calendar, FileText, Check, Eye, ChevronRight, User,
  AlertCircle, Sparkles, Building2, HelpCircle, ArrowUpRight,
  ShieldCheck, CheckSquare, XCircle, Info
} from 'lucide-react';
import { useHR } from '../../context/HRContext';
import { cn } from '../../utils/cn';
import { useDateFormat } from '../../hooks/useDateFormat';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import StatCard from '../../shared/components/ui/StatCard';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import DatePicker from '../../shared/components/common/DatePicker';
import PageHeader from '../../shared/components/ui/PageHeader';

const getInitials = (name) => {
  if (!name) return 'EM';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const ExitClearanceCenter = () => {
  const {
    exits = [],
    employees = [],
    updateClearanceStatus,
    finalizeExit,
    initiateTermination,
    reviewResignationHr,
    confirmProbation,
    extendProbation,
    showToast,
    refetch
  } = useHR();

  const { formatDate } = useDateFormat();

  // Tab persistence
  const [activeSubTab, setActiveSubTab] = usePersistedTab('hr_lifecycle_tab', 'clearances');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminateData, setTerminateData] = useState({
    employeeId: '',
    exitType: 'TERMINATION',
    reason: '',
    lastWorkingDay: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
  });

  // Probation extension modal state
  const [extendingEmpId, setExtendingEmpId] = useState(null);
  const [extensionMonths, setExtensionMonths] = useState(3);

  // Detailed view & review modal states
  const [selectedExitForView, setSelectedExitForView] = useState(null);
  const [selectedResignationForReview, setSelectedResignationForReview] = useState(null);
  const [hrReviewComment, setHrReviewComment] = useState('');
  const [hrFinalLwd, setHrFinalLwd] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('APPROVED');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'danger',
    onConfirm: () => {}
  });

  // Filtered lists
  const filteredExits = useMemo(() => {
    return exits.filter(ex => {
      const q = searchTerm.toLowerCase().trim();
      const name = ex.employee?.fullName?.toLowerCase() || '';
      const empId = ex.employee?.employeeId?.toLowerCase() || '';
      const dept = ex.employee?.department?.name?.toLowerCase() || '';
      return !q || name.includes(q) || empId.includes(q) || dept.includes(q);
    });
  }, [exits, searchTerm]);

  const offboardingExits = useMemo(() => {
    return filteredExits.filter(ex =>
      !['PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'REJECTED_BY_MANAGER', 'REJECTED_BY_HR'].includes(ex.status)
    );
  }, [filteredExits]);

  const resignationsList = useMemo(() => {
    return filteredExits.filter(ex => ex.exitType === 'RESIGNATION');
  }, [filteredExits]);

  const probationEmployees = useMemo(() => {
    return employees
      .filter(emp => emp.probationStatus === 'UNDER_PROBATION' || emp.probationStatus === 'EXTENDED' || emp.lifecycleStatus === 'PROBATION')
      .filter(emp => {
        const q = searchTerm.toLowerCase().trim();
        const name = emp.fullName?.toLowerCase() || '';
        const empId = emp.employeeId?.toLowerCase() || '';
        const dept = emp.department?.name?.toLowerCase() || '';
        return !q || name.includes(q) || empId.includes(q) || dept.includes(q);
      });
  }, [employees, searchTerm]);

  // Dynamic KPI Stats
  const countActiveOffboarding = exits.filter(ex => ex.status !== 'COMPLETED' && ex.status !== 'EMPLOYEE_RELIEVED').length;
  const countPendingClearances = exits.filter(ex => (!ex.itClearance || !ex.financeClearance || !ex.hrClearance) && ex.status !== 'COMPLETED' && ex.status !== 'EMPLOYEE_RELIEVED').length;
  const countResignationsPending = exits.filter(ex => ex.exitType === 'RESIGNATION' && (ex.status === 'PENDING_HR_APPROVAL' || ex.status === 'PENDING_MANAGER_APPROVAL')).length;
  const countProbationReview = employees.filter(emp => emp.probationStatus === 'UNDER_PROBATION' || emp.probationStatus === 'EXTENDED' || emp.lifecycleStatus === 'PROBATION').length;

  const stats = [
    {
      label: 'Active Offboardings',
      value: countActiveOffboarding,
      icon: UserMinus,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      onClick: () => { setActiveSubTab('clearances'); setSearchTerm(''); },
      sub: `${countPendingClearances} pending clearances`
    },
    {
      label: 'Pending Clearances',
      value: countPendingClearances,
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      onClick: () => { setActiveSubTab('clearances'); setSearchTerm(''); },
      sub: 'IT, Finance & HR'
    },
    {
      label: 'Resignations Pending',
      value: countResignationsPending,
      icon: FileText,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      onClick: () => { setActiveSubTab('resignations'); setSearchTerm(''); },
      sub: 'Awaiting HR decision'
    },
    {
      label: 'Probation Review',
      value: countProbationReview,
      icon: UserCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      onClick: () => { setActiveSubTab('probation'); setSearchTerm(''); },
      sub: 'Evaluation due'
    },
  ];

  // Action Handlers
  const handleRefresh = async () => {
    showToast('Refreshing lifecycle records...', 'info');
    if (refetch?.fetchExits) await refetch.fetchExits();
    if (refetch?.fetchEmployees) await refetch.fetchEmployees();
    showToast('Lifecycle data refreshed', 'success');
  };

  const handleOpenResignationReview = (req) => {
    setSelectedResignationForReview(req);
    setHrReviewComment(req.hrComment || '');
    setHrFinalLwd(req.finalLastWorkingDay ? new Date(req.finalLastWorkingDay).toISOString().split('T')[0] : (req.lastWorkingDay ? new Date(req.lastWorkingDay).toISOString().split('T')[0] : ''));
    setOverrideStatus('APPROVED');
  };

  const handleReviewResignation = async (exitId, status) => {
    await reviewResignationHr(exitId, {
      status,
      hrComment: hrReviewComment,
      ...(hrFinalLwd ? { finalLastWorkingDay: hrFinalLwd } : {})
    });
    setSelectedResignationForReview(null);
    setHrReviewComment('');
    setHrFinalLwd('');
  };

  const handleOverrideResignation = async (exitId) => {
    await reviewResignationHr(exitId, {
      status: overrideStatus,
      hrComment: hrReviewComment || 'Overridden by HR Operations',
      ...(hrFinalLwd ? { finalLastWorkingDay: hrFinalLwd } : {})
    });
    setSelectedResignationForReview(null);
    setHrReviewComment('');
    setHrFinalLwd('');
  };

  const handleInitiateTermination = async (e) => {
    e.preventDefault();
    if (!terminateData.employeeId || !terminateData.lastWorkingDay) {
      showToast('Please select an employee and last working day', 'error');
      return;
    }
    const res = await initiateTermination(terminateData);
    if (res?.success) {
      setIsTerminateModalOpen(false);
      setTerminateData({
        employeeId: '',
        exitType: 'TERMINATION',
        reason: '',
        lastWorkingDay: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
      });
      if (refetch?.fetchExits) await refetch.fetchExits();
      if (refetch?.fetchEmployees) await refetch.fetchEmployees();
    }
  };

  const handleConfirmFinalize = (ex) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Finalize Employee Exit',
      message: `Are you sure you want to finalize the offboarding for ${ex.employee?.fullName || 'this employee'}? This will mark all clearances complete and deactivate the account.`,
      confirmText: 'Finalize & Deactivate',
      type: 'danger',
      onConfirm: async () => {
        await finalizeExit(ex.id);
        if (selectedExitForView?.id === ex.id) setSelectedExitForView(null);
      }
    });
  };

  const handleConfirmProbation = async (empId) => {
    await confirmProbation(empId);
  };

  const handleExtendProbation = async (e) => {
    e.preventDefault();
    await extendProbation(extendingEmpId, { months: extensionMonths });
    setExtendingEmpId(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Employee Lifecycle Management"
        description="Manage employee probation, clearance checkpoints, and offboarding lifecycles"
        actions={
          <>
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-secondary cursor-pointer"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Standardized Primary Initiate Offboarding Button */}
            <button
              type="button"
              onClick={() => setIsTerminateModalOpen(true)}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
            >
              <UserMinus size={16} />
              <span>Initiate Offboarding</span>
            </button>
          </>
        }
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          <button
            type="button"
            onClick={() => { setActiveSubTab('clearances'); setSearchTerm(''); }}
            className={cn(
              "pb-3.5 px-4 text-xs sm:text-sm font-extrabold transition-all relative border-b-2 inline-flex items-center gap-2 cursor-pointer select-none",
              activeSubTab === 'clearances'
                ? "text-primary-600 dark:text-primary-400 border-primary-600"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <span>Offboarding & Clearances</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
              activeSubTab === 'clearances'
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              {offboardingExits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('resignations'); setSearchTerm(''); }}
            className={cn(
              "pb-3.5 px-4 text-xs sm:text-sm font-extrabold transition-all relative border-b-2 inline-flex items-center gap-2 cursor-pointer select-none",
              activeSubTab === 'resignations'
                ? "text-primary-600 dark:text-primary-400 border-primary-600"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <span>Resignations</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
              activeSubTab === 'resignations'
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              {resignationsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('probation'); setSearchTerm(''); }}
            className={cn(
              "pb-3.5 px-4 text-xs sm:text-sm font-extrabold transition-all relative border-b-2 inline-flex items-center gap-2 cursor-pointer select-none",
              activeSubTab === 'probation'
                ? "text-primary-600 dark:text-primary-400 border-primary-600"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <span>Probation Review</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
              activeSubTab === 'probation'
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              {probationEmployees.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search by employee name, employee ID, or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer shrink-0"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: Offboarding & Clearances Content ── */}
      {activeSubTab === 'clearances' && (
        <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[340px]">
          {offboardingExits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <UserMinus size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'No offboarding records match your search' : 'No active offboarding lifecycles'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                {searchTerm ? 'Try adjusting your search criteria or resetting filters.' : 'All employees are active or all previous clearances have been finalized.'}
              </p>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={() => setIsTerminateModalOpen(true)}
                  className="mt-4 h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <UserMinus size={16} />
                  <span>Initiate First Offboarding</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="hcm-table w-full text-left min-w-[850px]">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th text-left">Employee</th>
                    <th className="hcm-th text-left">Exit Type</th>
                    <th className="hcm-th text-left">Last Working Day</th>
                    <th className="hcm-th text-center">IT Clearance</th>
                    <th className="hcm-th text-center">Finance</th>
                    <th className="hcm-th text-center">HR</th>
                    <th className="hcm-th text-left">Workflow Status</th>
                    <th className="hcm-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {offboardingExits.map((ex) => {
                    const allCleared = ex.itClearance && ex.financeClearance && ex.hrClearance;
                    return (
                      <tr key={ex.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Employee */}
                        <td className="hcm-td">
                          <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => setSelectedExitForView(ex)}
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {getInitials(ex.employee?.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-none truncate max-w-[180px]">
                                {ex.employee?.fullName || 'Unknown'}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">
                                {ex.employee?.employeeId || 'NO ID'} • {ex.employee?.department?.name || 'General'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Exit Type */}
                        <td className="hcm-td">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider",
                            ex.exitType === 'RESIGNATION'
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                          )}>
                            {ex.exitType || 'TERMINATION'}
                          </span>
                        </td>

                        {/* Last Working Day */}
                        <td className="hcm-td text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDate(ex.finalLastWorkingDay || ex.lastWorkingDay)}</span>
                          </div>
                        </td>

                        {/* IT Clearance Checkpoint */}
                        <td className="hcm-td text-center">
                          <button
                            type="button"
                            onClick={() => updateClearanceStatus(ex.id, { itClearance: !ex.itClearance })}
                            className={cn(
                              "h-7 px-2.5 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer select-none",
                              ex.itClearance
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                            )}
                            title="Toggle IT Clearance"
                          >
                            {ex.itClearance ? <Check size={12} className="text-emerald-600" /> : null}
                            <span>{ex.itClearance ? 'Cleared' : 'Mark Cleared'}</span>
                          </button>
                        </td>

                        {/* Finance Checkpoint */}
                        <td className="hcm-td text-center">
                          <button
                            type="button"
                            onClick={() => updateClearanceStatus(ex.id, { financeClearance: !ex.financeClearance })}
                            className={cn(
                              "h-7 px-2.5 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer select-none",
                              ex.financeClearance
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                            )}
                            title="Toggle Finance Clearance"
                          >
                            {ex.financeClearance ? <Check size={12} className="text-emerald-600" /> : null}
                            <span>{ex.financeClearance ? 'Cleared' : 'Mark Cleared'}</span>
                          </button>
                        </td>

                        {/* HR Checkpoint */}
                        <td className="hcm-td text-center">
                          <button
                            type="button"
                            onClick={() => updateClearanceStatus(ex.id, { hrClearance: !ex.hrClearance })}
                            className={cn(
                              "h-7 px-2.5 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer select-none",
                              ex.hrClearance
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                            )}
                            title="Toggle HR Clearance"
                          >
                            {ex.hrClearance ? <Check size={12} className="text-emerald-600" /> : null}
                            <span>{ex.hrClearance ? 'Cleared' : 'Mark Cleared'}</span>
                          </button>
                        </td>

                        {/* Workflow Status */}
                        <td className="hcm-td">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 whitespace-nowrap",
                            ex.status === 'COMPLETED' || ex.status === 'EMPLOYEE_RELIEVED'
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              : allCleared
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          )}>
                            {ex.status === 'COMPLETED' || ex.status === 'EMPLOYEE_RELIEVED'
                              ? 'Relieved'
                              : allCleared
                              ? 'Ready to Finalize'
                              : 'Pending Clearances'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="hcm-td text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedExitForView(ex)}
                              className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                              title="View Clearance Details"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">View</span>
                            </button>

                            {/* Finalize Exit Button */}
                            {ex.status !== 'COMPLETED' && ex.status !== 'EMPLOYEE_RELIEVED' ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmFinalize(ex)}
                                disabled={!allCleared}
                                className={cn(
                                  "h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0",
                                  allCleared
                                    ? "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                )}
                                title={allCleared ? "Finalize Exit & Deactivate Account" : "All clearances must be marked cleared first"}
                              >
                                <CheckSquare size={14} />
                                <span>Finalize</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 px-2">Finalized</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Resignations Content ── */}
      {activeSubTab === 'resignations' && (
        <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[340px]">
          {resignationsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <FileText size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'No resignations match your search' : 'No resignation requests recorded'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                {searchTerm ? 'Try adjusting your search criteria or resetting filters.' : 'When employees submit resignation via the portal, requests will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="hcm-table w-full text-left min-w-[850px]">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th text-left">Employee</th>
                    <th className="hcm-th text-left">Submitted Date</th>
                    <th className="hcm-th text-left">Proposed LWD</th>
                    <th className="hcm-th text-left">Reason</th>
                    <th className="hcm-th text-left">Workflow Status</th>
                    <th className="hcm-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {resignationsList.map((req) => (
                    <tr key={req.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee */}
                      <td className="hcm-td">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => handleOpenResignationReview(req)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {getInitials(req.employee?.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-none truncate max-w-[180px]">
                              {req.employee?.fullName || 'Unknown'}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">
                              {req.employee?.employeeId || 'NO ID'} • {req.employee?.department?.name || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="hcm-td text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formatDate(req.submissionDate || req.createdAt)}</span>
                        </div>
                      </td>

                      {/* Proposed LWD */}
                      <td className="hcm-td text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formatDate(req.finalLastWorkingDay || req.lastWorkingDay)}</span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="hcm-td text-xs text-slate-700 dark:text-slate-300">
                        <p className="truncate max-w-[180px]" title={req.reason || 'No reason specified'}>
                          {req.reason || 'Personal Reasons / Opportunity'}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="hcm-td">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 whitespace-nowrap",
                          req.status === 'PENDING_MANAGER_APPROVAL'
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : req.status === 'PENDING_HR_APPROVAL'
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : req.status === 'APPROVED' || req.status === 'CLEARANCE_IN_PROGRESS'
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : req.status.startsWith('REJECTED')
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Action Area with Standardized Buttons */}
                      <td className="hcm-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Standardized View Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResignationReview(req)}
                            className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                            title="View Resignation Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          {/* Standardized Approve Button */}
                          {req.status === 'PENDING_HR_APPROVAL' && (
                            <button
                              type="button"
                              onClick={() => handleReviewResignation(req.id, 'APPROVED')}
                              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                              title="Approve Resignation"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Standardized Reject Button */}
                          {req.status === 'PENDING_HR_APPROVAL' && (
                            <button
                              type="button"
                              onClick={() => handleReviewResignation(req.id, 'REJECTED_BY_HR')}
                              className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                              title="Reject Resignation"
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          )}

                          {/* Standardized Override Button */}
                          {req.status !== 'APPROVED' && req.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenResignationReview(req)}
                              className="h-8 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                              title="Override Decision / Modify LWD"
                            >
                              <ShieldAlert size={14} />
                              <span className="hidden sm:inline">Override</span>
                            </button>
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
      )}

      {/* ── TAB 3: Probation Review Content ── */}
      {activeSubTab === 'probation' && (
        <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[340px]">
          {probationEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <UserCheck size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {searchTerm ? 'No probation records match your search' : 'No employees currently under probation review'}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                All staff members have completed probation evaluations or are fully confirmed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="hcm-table w-full text-left min-w-[850px]">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th text-left">Employee</th>
                    <th className="hcm-th text-left">Probation Start</th>
                    <th className="hcm-th text-left">Probation End</th>
                    <th className="hcm-th text-left">Review Date</th>
                    <th className="hcm-th text-left">Status</th>
                    <th className="hcm-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {probationEmployees.map((emp) => (
                    <tr key={emp.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Employee */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {getInitials(emp.fullName || emp.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none truncate max-w-[180px]">
                              {emp.fullName || emp.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">
                              {emp.employeeId || 'NO ID'} • {emp.department?.name || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Probation Start */}
                      <td className="hcm-td text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        {emp.probationStart ? formatDate(emp.probationStart) : (emp.joiningDate ? formatDate(emp.joiningDate) : 'Recently')}
                      </td>

                      {/* Probation End */}
                      <td className="hcm-td text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        {emp.probationEnd ? formatDate(emp.probationEnd) : 'Standard 90 Days'}
                      </td>

                      {/* Review Date */}
                      <td className="hcm-td text-slate-600 dark:text-slate-400 font-semibold text-xs">
                        {emp.probationReviewDate ? formatDate(emp.probationReviewDate) : 'Upcoming'}
                      </td>

                      {/* Status */}
                      <td className="hcm-td">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1",
                          emp.probationStatus === 'EXTENDED'
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        )}>
                          {emp.probationStatus === 'EXTENDED' ? 'Extended' : 'Active Probation'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="hcm-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Standardized Extend Button */}
                          <button
                            type="button"
                            onClick={() => setExtendingEmpId(emp.id)}
                            className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Extend Probation Period"
                          >
                            <Clock size={13} />
                            <span>Extend</span>
                          </button>

                          {/* Standardized Confirm Button */}
                          <button
                            type="button"
                            onClick={() => handleConfirmProbation(emp.id)}
                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Confirm Employee Employment"
                          >
                            <UserCheck size={14} />
                            <span>Confirm</span>
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
      )}

      {/* ── Resignation Review / Details Modal ── */}
      <AnimatePresence>
        {selectedResignationForReview && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResignationForReview(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-primary-500/20">
                    {getInitials(selectedResignationForReview.employee?.fullName)}
                  </div>
                  <div className="min-w-0 text-left">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                      {selectedResignationForReview.employee?.fullName}
                    </h2>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 truncate">
                      {selectedResignationForReview.employee?.employeeId} • <span className="text-slate-500 dark:text-slate-400 font-medium">{selectedResignationForReview.employee?.department?.name || 'General'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedResignationForReview(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left">
                {/* Status Banner */}
                <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-primary-600" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Workflow Status:
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                    {selectedResignationForReview.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Request Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Date</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDate(selectedResignationForReview.submissionDate || selectedResignationForReview.createdAt)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposed Last Working Day</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDate(selectedResignationForReview.lastWorkingDay)}
                    </p>
                  </div>
                </div>

                {/* Resignation Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Resignation Statement / Reason
                  </label>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedResignationForReview.reason || 'Personal Reasons / Opportunity Exploration'}
                  </div>
                </div>

                {/* Manager Decision (if present) */}
                {selectedResignationForReview.managerComment && (
                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                    <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                      <User size={13} />
                      Manager Feedback ({selectedResignationForReview.managerDecisionDate ? formatDate(selectedResignationForReview.managerDecisionDate) : 'Recorded'}):
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">{selectedResignationForReview.managerComment}</p>
                  </div>
                )}

                {/* HR Final LWD Adjustment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Final Approved Last Working Day (LWD)
                  </label>
                  <DatePicker
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    value={hrFinalLwd}
                    onChange={val => setHrFinalLwd(typeof val === 'string' ? val : val?.target?.value || '')}
                  />
                </div>

                {/* HR Decision Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    HR Comments & Handover Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval conditions, notice period handover remarks, or rejection grounds..."
                    value={hrReviewComment}
                    onChange={e => setHrReviewComment(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {/* HR Override Selector (if overriding) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Override Workflow Status</p>
                      <p className="text-[11px] text-slate-400">Directly set final state regardless of approval step</p>
                    </div>
                    <select
                      value={overrideStatus}
                      onChange={e => setOverrideStatus(e.target.value)}
                      className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="APPROVED">Force Approve</option>
                      <option value="REJECTED_BY_HR">Force Reject</option>
                      <option value="PENDING_HR_APPROVAL">Move to HR Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedResignationForReview(null)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOverrideResignation(selectedResignationForReview.id)}
                    className="h-10 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ShieldAlert size={15} />
                    <span>Apply Override</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReviewResignation(selectedResignationForReview.id, 'REJECTED_BY_HR')}
                    className="h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <X size={15} />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReviewResignation(selectedResignationForReview.id, 'APPROVED')}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Check size={15} />
                    <span>Approve Resignation</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Offboarding Clearance Details Modal ── */}
      <AnimatePresence>
        {selectedExitForView && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExitForView(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-primary-500/20">
                    {getInitials(selectedExitForView.employee?.fullName)}
                  </div>
                  <div className="min-w-0 text-left">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                      {selectedExitForView.employee?.fullName}
                    </h2>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 truncate">
                      {selectedExitForView.employee?.employeeId} • <span className="text-slate-500 dark:text-slate-400 font-medium">{selectedExitForView.employee?.department?.name || 'General'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedExitForView(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exit Type</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {selectedExitForView.exitType || 'TERMINATION'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Working Day</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDate(selectedExitForView.finalLastWorkingDay || selectedExitForView.lastWorkingDay)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clearance Status</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {selectedExitForView.itClearance && selectedExitForView.financeClearance && selectedExitForView.hrClearance ? 'All Cleared' : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Clearance Checklist Interactive */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary-600" />
                    Clearance Department Checkpoints
                  </h3>

                  <div className="space-y-2.5">
                    {/* IT Clearance */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">IT & Equipment Return</p>
                        <p className="text-[11px] text-slate-400">Workstation laptop, corporate credentials revocation, access keys</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateClearanceStatus(selectedExitForView.id, { itClearance: !selectedExitForView.itClearance });
                          setSelectedExitForView(prev => ({ ...prev, itClearance: !prev.itClearance }));
                        }}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer",
                          selectedExitForView.itClearance
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {selectedExitForView.itClearance ? <Check size={14} /> : null}
                        <span>{selectedExitForView.itClearance ? 'Cleared' : 'Mark Cleared'}</span>
                      </button>
                    </div>

                    {/* Finance Clearance */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Finance & Accounts Settlement</p>
                        <p className="text-[11px] text-slate-400">Payroll finalization, reimbursement clearance, travel advance settlement</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateClearanceStatus(selectedExitForView.id, { financeClearance: !selectedExitForView.financeClearance });
                          setSelectedExitForView(prev => ({ ...prev, financeClearance: !prev.financeClearance }));
                        }}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer",
                          selectedExitForView.financeClearance
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {selectedExitForView.financeClearance ? <Check size={14} /> : null}
                        <span>{selectedExitForView.financeClearance ? 'Cleared' : 'Mark Cleared'}</span>
                      </button>
                    </div>

                    {/* HR Clearance */}
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">HR & Documentation Handover</p>
                        <p className="text-[11px] text-slate-400">Exit interview record, experience certificate, benefits termination</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateClearanceStatus(selectedExitForView.id, { hrClearance: !selectedExitForView.hrClearance });
                          setSelectedExitForView(prev => ({ ...prev, hrClearance: !prev.hrClearance }));
                        }}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer",
                          selectedExitForView.hrClearance
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {selectedExitForView.hrClearance ? <Check size={14} /> : null}
                        <span>{selectedExitForView.hrClearance ? 'Cleared' : 'Mark Cleared'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Termination Reason */}
                {selectedExitForView.reason && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Recorded Reason / Notes</p>
                    <p className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {selectedExitForView.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedExitForView(null)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>

                {selectedExitForView.status !== 'COMPLETED' && selectedExitForView.status !== 'EMPLOYEE_RELIEVED' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmFinalize(selectedExitForView)}
                    disabled={!(selectedExitForView.itClearance && selectedExitForView.financeClearance && selectedExitForView.hrClearance)}
                    className={cn(
                      "h-10 px-5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer",
                      selectedExitForView.itClearance && selectedExitForView.financeClearance && selectedExitForView.hrClearance
                        ? "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <CheckSquare size={16} />
                    <span>Finalize Offboarding</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Initiate Offboarding Modal ── */}
      <AnimatePresence>
        {isTerminateModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTerminateModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto"
            >
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Initiate Employee Offboarding
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Start clearance checkpoints and lifecycle exit for an employee
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleInitiateTermination} className="p-5 sm:p-6 space-y-4 text-left">
                {/* Employee Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={terminateData.employeeId}
                    onChange={e => setTerminateData({ ...terminateData, employeeId: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="">Choose employee...</option>
                    {employees
                      .filter(emp => !['TERMINATED', 'ON_NOTICE'].includes(emp.lifecycleStatus))
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName || emp.name} ({emp.employeeId || 'No ID'}) — {emp.department?.name || 'General'}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Exit Type
                    </label>
                    <select
                      value={terminateData.exitType}
                      onChange={e => setTerminateData({ ...terminateData, exitType: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="TERMINATION">Termination</option>
                      <option value="RESIGNATION">Resignation</option>
                      <option value="RETIREMENT">Retirement</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Last Working Day (LWD) <span className="text-rose-500">*</span>
                    </label>
                    <DatePicker
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={terminateData.lastWorkingDay}
                      onChange={val => setTerminateData({ ...terminateData, lastWorkingDay: typeof val === 'string' ? val : val?.target?.value || '' })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reason & Clearance Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details regarding the offboarding or termination..."
                    value={terminateData.reason}
                    onChange={e => setTerminateData({ ...terminateData, reason: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTerminateModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer"
                  >
                    <UserMinus size={16} />
                    <span>Initiate Offboarding</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Probation Extension Modal ── */}
      <AnimatePresence>
        {extendingEmpId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExtendingEmpId(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto"
            >
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Extend Probation Period
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select additional probation duration for this employee
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExtendingEmpId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleExtendProbation} className="p-5 sm:p-6 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Extension Duration <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={extensionMonths}
                    onChange={e => setExtensionMonths(parseInt(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="1">1 Month Extension</option>
                    <option value="2">2 Months Extension</option>
                    <option value="3">3 Months Extension (Standard)</option>
                    <option value="6">6 Months Extension</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExtendingEmpId(null)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer"
                  >
                    <Clock size={16} />
                    <span>Confirm Extension</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default ExitClearanceCenter;

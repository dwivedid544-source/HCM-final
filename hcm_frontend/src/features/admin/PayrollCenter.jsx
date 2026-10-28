import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Calendar, Users, DollarSign, Lock, Play, Table, AlertCircle,
  TrendingUp, Zap, Info, X, Check, Edit3, TrendingDown, Eye, Download,
  CheckCircle2, MoreVertical, Calculator, History, User, Loader2, FileText, Printer, Upload, RotateCcw
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { cn } from '../../utils/cn';
import TaxRulesModal from '../../features/admin/components/TaxRulesModal';
import PayrollBreakdownModal from '../../features/admin/components/PayrollBreakdownModal';
import { ProcessPayrollDrawer } from './components/ProcessPayrollDrawer';
import { downloadPayslipPDF, printPayslipIsolated } from '../../utils/printAndPdfUtils';
import PermissionGate from '../../shared/components/common/PermissionGate';
import { usePermissionContext } from '../../context/PermissionContext';
import { useCurrency } from '../../hooks/useCurrency';
import ImportModal from '../../shared/components/import/ImportModal';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';

// ============================================================
// Bounded Safe Avatar Component
// ============================================================
const SafeAvatar = ({ src, alt = '', name = '', size = 36, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const isValidUrl = useMemo(() => {
    if (!src || typeof src !== 'string') return false;
    const clean = src.trim();
    if (clean === '' || clean === 'null' || clean === 'undefined' || clean === '[object Object]') return false;
    return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image/');
  }, [src]);

  const initials = useMemo(() => {
    if (!name || typeof name !== 'string') return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <div 
      className={cn(
        "relative shrink-0 overflow-hidden select-none flex items-center justify-center rounded-xl bg-primary-600 text-white font-extrabold shadow-xs",
        className
      )}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        minWidth: `${size}px`, 
        maxWidth: `${size}px`, 
        minHeight: `${size}px`, 
        maxHeight: `${size}px` 
      }}
    >
      {isValidUrl && !hasError ? (
        <>
          <img 
            src={src} 
            alt={alt || name}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'cover',
              objectPosition: 'center',
              display: isLoaded ? 'block' : 'none'
            }}
          />
          {!isLoaded && (
            <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>
              {initials}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>
          {initials}
        </span>
      )}
    </div>
  );
};

// ============================================================
// Main Payroll Center Feature Component
// ============================================================
const PayrollCenter = () => {
  const { formatCurrency, getSymbol, getIcon, masterCurrency, convertAmount } = useCurrency();

  const {
    payrollList = [],
    users = [],
    runPayroll,
    showToast,
    updatePayrollDetails,
    appSettings,
    fetchPayroll,
    incrementRequests = [],
    approveIncrementRequest,
    rejectIncrementRequest
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('list');
  const [isRunningPayroll, setIsRunningPayroll] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const payslipPrintRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payingUserId, setPayingUserId] = useState(null);

  const { hasPermission, isSuperAdmin } = usePermissionContext();
  const canCreatePayroll = isSuperAdmin || hasPermission('payroll_center', 'create') || hasPermission('payroll_operations', 'create');
  const canApprovePayroll = isSuperAdmin || hasPermission('payroll_center', 'approve') || hasPermission('payroll_operations', 'approve');

  const currentYear = new Date().getFullYear();
  const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(allMonths[currentMonthIndex] || 'September');

  // Confirmation checks & processing state
  const [payrollChecks, setPayrollChecks] = useState([false, false, false, false]);
  const [isSimulatingPayroll, setIsSimulatingPayroll] = useState(false);

  const togglePayrollCheck = (idx) => {
    setPayrollChecks(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleExecutePayroll = async () => {
    setIsSimulatingPayroll(true);
    try {
      await runPayroll(selectedMonth);
      showToast(`Payroll for ${selectedMonth} ${currentYear} successfully executed!`, 'success');
      setIsRunningPayroll(false);
      await fetchPayroll(selectedMonth);
    } catch (err) {
      showToast('Failed to process payroll batch', 'error');
    } finally {
      setIsSimulatingPayroll(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    showToast('Refreshing payroll data...', 'info');
    await fetchPayroll(selectedMonth);
    showToast('Payroll data refreshed', 'success');
  }, [fetchPayroll, selectedMonth, showToast]);

  useEffect(() => {
    fetchPayroll(selectedMonth);
  }, [selectedMonth, fetchPayroll]);

  const downloadPayslip = (emp) => {
    try {
      const rec = {
        ...emp,
        month: emp.month || selectedMonth
      };
      downloadPayslipPDF(rec, {
        companyName: appSettings?.general?.companyName,
        currency: emp.currency || defaultCurrency
      });
      showToast(`Payslip downloaded for ${emp.name || emp.employeeName}`, 'success');
    } catch (err) {
      console.error('PDF download error:', err);
      setSelectedRecord({
        ...emp,
        month: emp.month || selectedMonth
      });
      setShowPayslipModal(true);
    }
  };

  const defaultCurrency = appSettings?.general?.defaultCurrency;

  // Combine active non-admin users with their payroll data
  const combinedPayroll = useMemo(() => {
    return users
      .filter(u => {
        const roleStr = (u.role || '').toLowerCase().replace(/\s/g, '');
        const isNotAdmin = roleStr !== 'admin' && roleStr !== 'superadmin';
        const isNotCandidate = roleStr !== 'candidate';
        const hasProfile = !!u.profileId;
        const isActive = !['suspended', 'inactive', 'terminated'].includes((u.status || '').toLowerCase());
        return isNotAdmin && isNotCandidate && hasProfile && (isActive || payrollList.some(p => p.userId === u.id || p.employeeId === u.profileId || p.employee?.userId === u.id));
      })
      .map(u => {
        const existing = payrollList.find(p => 
          (p.userId && (p.userId === u.id || p.userId === u.profileId)) || 
          (p.employeeId && (p.employeeId === u.profileId || p.employeeId === u.id)) ||
          (p.employee?.userId && p.employee.userId === u.id) ||
          (p.employee?.id && p.employee.id === u.profileId)
        );

        const netAmount = existing ? (existing.netSalary ?? existing.net ?? 0) : (u.monthlyCTC || u.baseSalary || 0);
        const isPaid = existing ? (existing.status === 'Paid' || existing.status === 'PAID' || existing.status === 'Processed') : false;
        const isDraft = existing ? (existing.status === 'Draft' || existing.status === 'Pending') : false;

        const paidAmount = isPaid ? netAmount : 0;
        const remainingDue = isPaid ? 0 : netAmount;

        if (existing) {
          return {
            ...existing,
            employeeProfileId: u.profileId,
            role: u.role || 'Employee',
            department: u.department || 'General',
            img: existing.img || u.avatarUrl || u.img || '',
            id: u.id,
            name: u.name || u.fullName,
            employeeId: u.empId || existing.employeeId,
            basic: existing.basic ?? u.baseSalary ?? 0,
            bonus: existing.bonus ?? 0,
            grossSalary: existing.grossSalary ?? (u.monthlyCTC || u.baseSalary || 0),
            deductions: existing.deductions ?? existing.totalDeductions ?? 0,
            net: netAmount,
            paidAmount: paidAmount,
            remainingDue: remainingDue,
            status: isPaid ? 'Processed' : (isDraft ? 'Draft' : 'Unprocessed'),
            paymentDate: existing.paymentDate || existing.updatedAt || existing.createdAt
          };
        }

        return {
          id: u.id,
          employeeProfileId: u.profileId,
          employeeId: u.empId || u.id,
          name: u.name || u.fullName,
          role: u.role || 'Employee',
          department: u.department || 'General',
          basic: u.baseSalary || 0,
          bonus: 0,
          deductions: 0,
          grossSalary: u.monthlyCTC || u.baseSalary || 0,
          net: netAmount,
          paidAmount: 0,
          remainingDue: netAmount,
          status: 'Unprocessed',
          img: u.avatarUrl || u.img || '',
          paymentDate: null
        };
      });
  }, [users, payrollList]);

  const totalEmployees = combinedPayroll.length;
  const processedEmployees = combinedPayroll.filter(p => p.status === 'Processed' || p.status === 'Paid');
  const pendingEmployees = combinedPayroll.filter(p => p.status !== 'Processed' && p.status !== 'Paid');
  
  const totalPayrollBudget = combinedPayroll.reduce((acc, p) => acc + convertAmount(p.net || 0, p.currency), 0);
  const totalPaidOut = processedEmployees.reduce((acc, p) => acc + convertAmount(p.paidAmount || p.net || 0, p.currency), 0);
  const totalRemainingDue = Math.max(0, totalPayrollBudget - totalPaidOut);

  const filteredPayroll = useMemo(() => {
    return combinedPayroll.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        String(p.employeeId || '').toLowerCase().includes(q) ||
        String(p.role || '').toLowerCase().includes(q) ||
        String(p.department || '').toLowerCase().includes(q);

      if (activeTab === 'list') return matchesSearch;
      if (activeTab === 'pending') return matchesSearch && (p.status !== 'Processed' && p.status !== 'Paid');
      if (activeTab === 'processed') return matchesSearch && (p.status === 'Processed' || p.status === 'Paid');
      return matchesSearch;
    });
  }, [combinedPayroll, searchTerm, activeTab]);

  const filteredIncrements = useMemo(() => {
    return (incrementRequests || []).filter(r => {
      const q = searchTerm.toLowerCase().trim();
      const name = r.employee?.fullName || '';
      const reason = r.reason || '';
      return !q || name.toLowerCase().includes(q) || reason.toLowerCase().includes(q);
    });
  }, [incrementRequests, searchTerm]);

  const stats = [
    {
      label: 'Payroll Month',
      value: selectedMonth,
      sub: totalRemainingDue === 0 ? 'Cycle Completed ✓' : 'Cycle Active',
      icon: Calendar,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      onClick: () => { setActiveTab('list'); setSearchTerm(''); }
    },
    {
      label: 'Total Budget',
      value: formatCurrency(totalPayrollBudget),
      sub: `${totalEmployees} Employees`,
      icon: DollarSign,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      onClick: () => { setActiveTab('list'); setSearchTerm(''); }
    },
    {
      label: 'Total Paid Out',
      value: formatCurrency(totalPaidOut),
      sub: `${processedEmployees.length} Settled`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      onClick: () => { setActiveTab('processed'); setSearchTerm(''); }
    },
    {
      label: 'Remaining Due',
      value: formatCurrency(totalRemainingDue),
      sub: totalRemainingDue === 0 ? 'Fully Settled ✓' : `${pendingEmployees.length} Pending`,
      icon: AlertCircle,
      iconColor: totalRemainingDue === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
      bg: totalRemainingDue === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30',
      onClick: () => { setActiveTab('pending'); setSearchTerm(''); }
    },
  ];

  const handlePayAllPending = async () => {
    if (pendingEmployees.length === 0) {
      showToast('No pending payroll records to process', 'info');
      return;
    }
    setIsRunningPayroll(true);
  };

  const handlePayIndividual = async (emp) => {
    setPayingUserId(emp.id);
    try {
      await updatePayrollDetails(emp.id, { status: 'Processed' }, selectedMonth);
      showToast(`Payment processed for ${emp.name}`, 'success');
      await fetchPayroll(selectedMonth);
    } catch (err) {
      showToast('Payment processing failed', 'error');
    } finally {
      setPayingUserId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 animate-fade-in relative focus:outline-none w-full text-left">
      {/* ── Page Header & Top Actions ── */}
      <PageHeader
        title="Payroll Center"
        description="Configure salary structures, manage payout cycles, and process employee compensation"
        actions={
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Month Selector Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-11 px-3 sm:px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer shadow-xs select-none"
            >
              {allMonths.map(m => (
                <option key={m} value={m}>{m} {currentYear}</option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {canCreatePayroll && (
              <>
                {/* Standardized Secondary Import Payslips Button */}
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
                >
                  <Upload size={16} />
                  <span>Import Payslips</span>
                </button>

                {/* Standardized Primary Run Payroll Button */}
                <button
                  type="button"
                  onClick={() => setIsRunningPayroll(true)}
                  className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
                >
                  <Play size={15} fill="currentColor" />
                  <span>Run Payroll</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* ── Summary KPI Cards ── */}
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

      {/* ── Tabs & Search Bar ── */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status & Subtabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'list', label: 'Employee List', count: totalEmployees, icon: Table },
              { id: 'pending', label: 'Pending Approvals', count: pendingEmployees.length, icon: AlertCircle },
              { id: 'processed', label: 'Payout History', count: processedEmployees.length, icon: History },
              { id: 'increments', label: 'Salary Increments', count: incrementRequests?.length || 0, icon: TrendingUp },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 select-none",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  <tab.icon size={15} />
                  <span>{tab.label}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1",
                    isActive
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Controls & Search Bar */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {activeTab === 'pending' && pendingEmployees.length > 0 && (
              <button
                type="button"
                onClick={handlePayAllPending}
                className="h-10 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Zap size={14} />
                <span>Pay All Pending ({pendingEmployees.length})</span>
              </button>
            )}

            <div className="relative flex-1 sm:w-72 sm:flex-initial min-w-0">
              <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee, ID, role..."
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
          </div>
        </div>

        {/* ── Main Payroll Table Card ── */}
        <div className="card p-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden min-h-[340px]">
          <div className="overflow-x-auto w-full">
            {activeTab === 'increments' ? (
              <table className="hcm-table w-full min-w-[960px] text-left">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th text-left">Employee</th>
                    <th className="hcm-th text-center">Current Monthly CTC</th>
                    <th className="hcm-th text-center">Requested Monthly CTC</th>
                    <th className="hcm-th text-center">Raise</th>
                    <th className="hcm-th text-left">Reason</th>
                    <th className="hcm-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredIncrements.length > 0 ? (
                    filteredIncrements.map((req) => {
                      const currentCtc = req.employee?.compensationProfile?.monthlyCTC || 0;
                      const requestedCtc = req.requestedSalary || 0;
                      const diff = requestedCtc - currentCtc;
                      const percent = currentCtc > 0 ? (diff / currentCtc) * 100 : 0;
                      return (
                        <tr key={req.id} className="hcm-tr hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="hcm-td">
                            <div className="flex items-center gap-3">
                              <SafeAvatar src={req.employee?.avatarUrl} name={req.employee?.fullName} size={36} />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs">{req.employee?.fullName || 'Employee'}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{req.employee?.employeeId || 'EMP'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hcm-td text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(currentCtc)}
                          </td>
                          <td className="hcm-td text-center text-xs font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(requestedCtc)}
                          </td>
                          <td className="hcm-td text-center whitespace-nowrap">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30">
                              +{percent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="hcm-td text-left max-w-xs">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate italic" title={req.reason}>
                              "{req.reason || 'No reason specified'}"
                            </p>
                          </td>
                          <td className="hcm-td text-right">
                            {req.status === 'ManagerApproved' || req.status === 'Pending' ? (
                              canApprovePayroll ? (
                                <div className="flex justify-end items-center gap-1.5">
                                  <button 
                                    type="button"
                                    onClick={() => approveIncrementRequest(req.id)}
                                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                    title="Approve & Implement"
                                  >
                                    <Check size={14} />
                                    <span>Approve</span>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => rejectIncrementRequest(req.id)}
                                    className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                    title="Reject"
                                  >
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-bold">Pending Approval</span>
                              )
                            ) : (
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border",
                                req.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-500 border-rose-200"
                              )}>
                                {req.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="hcm-tr">
                      <td colSpan="6" className="px-6 py-12 text-center text-xs text-slate-400 hcm-td">
                        No pending increment requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="hcm-table w-full min-w-[1080px] text-left">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th text-left">Employee</th>
                    <th className="hcm-th text-left">Role & Dept</th>
                    <th className="hcm-th text-center">Gross CTC</th>
                    <th className="hcm-th text-center">Net Payable</th>
                    <th className="hcm-th text-center">Paid Amount</th>
                    <th className="hcm-th text-center">Balance Due</th>
                    <th className="hcm-th text-center">Status</th>
                    <th className="hcm-th text-right px-6 min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredPayroll.length > 0 ? (
                    filteredPayroll.map((emp) => {
                      const isPaid = emp.status === 'Processed' || emp.status === 'Paid';
                      const isPaying = payingUserId === emp.id;

                      return (
                        <tr key={emp.id} className="hcm-tr hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Employee Info */}
                          <td className="hcm-td">
                            <div className="flex items-center gap-3">
                              <SafeAvatar src={emp.img || emp.avatarUrl} name={emp.name} size={36} />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[170px]">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employeeId || 'EMP'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role & Dept */}
                          <td className="hcm-td text-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{emp.role || 'Employee'}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
                              {emp.department || 'General'}
                            </span>
                          </td>

                          {/* Gross CTC */}
                          <td className="hcm-td text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(emp.grossSalary || (emp.basic + emp.bonus), emp.currency)}
                          </td>

                          {/* Net Payable */}
                          <td className="hcm-td text-center text-xs font-bold text-slate-900 dark:text-white">
                            {formatCurrency(emp.net, emp.currency)}
                          </td>

                          {/* Paid Amount */}
                          <td className="hcm-td text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            {formatCurrency(emp.paidAmount, emp.currency)}
                          </td>

                          {/* Balance Due */}
                          <td className="hcm-td text-center font-bold">
                            {isPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                                {formatCurrency(0, emp.currency)} (Settled)
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                                {formatCurrency(emp.remainingDue, emp.currency)}
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="hcm-td text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1",
                              isPaid ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                              emp.status === 'Draft' ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200" :
                              "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                            )}>
                              {isPaid ? <Check size={11} strokeWidth={3} /> : null}
                              <span>{isPaid ? 'Paid' : emp.status}</span>
                            </span>
                          </td>

                          {/* Action Column with Standardized Buttons */}
                          <td className="hcm-td text-right px-6 select-none">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                              {/* View Detailed Payslip Icon Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecord({
                                    ...emp,
                                    month: emp.month || selectedMonth
                                  });
                                  setShowPayslipModal(true);
                                }}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                                title="View Detailed Payslip"
                              >
                                <Eye size={16} />
                              </button>

                              {/* Calculation Breakdown Icon Button */}
                              <button
                                type="button"
                                onClick={() => setEmployeeToView(emp)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                                title="Calculation Breakdown"
                              >
                                <Calculator size={16} />
                              </button>

                              {/* Standardized Download Button */}
                              {isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => downloadPayslip(emp)}
                                  className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer select-none shrink-0"
                                  title="Download Payslip"
                                >
                                  <Download size={13} strokeWidth={2.5} />
                                  <span>Download</span>
                                </button>
                              ) : (
                                /* Standardized Pay Button */
                                <button
                                  type="button"
                                  disabled={isPaying}
                                  onClick={() => handlePayIndividual(emp)}
                                  className="h-8 px-3.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs shadow-primary-500/20 transition-all active:scale-95 cursor-pointer select-none shrink-0 disabled:opacity-50"
                                  title={`Pay ${emp.name} for ${selectedMonth}`}
                                >
                                  {isPaying ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Zap size={13} />
                                  )}
                                  <span>{isPaying ? 'Paying...' : 'Pay'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="hcm-tr">
                      <td colSpan="8" className="px-6 py-16 text-center text-slate-400 hcm-td">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <Table size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No payroll records found</p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                              No records match the current filters for {selectedMonth} {currentYear}.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Process Monthly Payroll Dynamic Drawer ── */}
      <AnimatePresence>
        {isRunningPayroll && (
          <ProcessPayrollDrawer
            isOpen={isRunningPayroll}
            onClose={() => setIsRunningPayroll(false)}
            initialMonth={selectedMonth}
            users={users}
            payrollList={payrollList}
            formatCurrency={formatCurrency}
            defaultCurrency={defaultCurrency}
            onSuccess={() => fetchPayroll(selectedMonth)}
          />
        )}
      </AnimatePresence>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        entity="payroll"
        onImportSuccess={() => fetchPayroll(selectedMonth)}
      />

      <TaxRulesModal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
      />

      <PayrollBreakdownModal
        isOpen={!!employeeToView}
        onClose={() => setEmployeeToView(null)}
        employee={employeeToView}
        selectedMonth={selectedMonth}
      />

      {/* ── Printable Payslip Modal ── */}
      <AnimatePresence>
        {showPayslipModal && selectedRecord && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto my-auto"
            >
              <button
                type="button"
                onClick={() => setShowPayslipModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Printable Area */}
              <div id="payslip-print-container" ref={payslipPrintRef} className="space-y-5">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{appSettings?.general?.companyName || 'GlobalTech Solutions'}</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Enterprise Employee Paystub</p>
                  </div>
                  <div className="text-right pr-8">
                    <span className="text-xs font-mono font-bold text-slate-400">PAYSLIP ID: {selectedRecord.id?.slice(0, 8).toUpperCase()}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Month: <strong>{selectedRecord.month}</strong></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Details</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.name || selectedRecord.employeeName}</p>
                    <p className="text-slate-400 font-mono mt-0.5">{selectedRecord.employeeId || selectedRecord.displayId}</p>
                    <p className="text-slate-500 mt-0.5">{selectedRecord.designation || selectedRecord.role || 'Employee'} • {selectedRecord.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance Summary</p>
                    <p className="text-slate-600 dark:text-slate-400">Working Days: <strong>{selectedRecord.totalWorkingDays ?? 0}</strong></p>
                    <p className="text-slate-600 dark:text-slate-400">Days Present: <strong>{selectedRecord.presentDays ?? selectedRecord.attendancePresent ?? 0}</strong></p>
                    <p className="text-slate-600 dark:text-slate-400">Paid Leaves: <strong>{selectedRecord.paidLeaveDays ?? 0}</strong></p>
                    <p className="text-slate-600 dark:text-slate-400">LOP Days: <strong>{selectedRecord.unpaidLeaveDays ?? selectedRecord.attendanceAbsent ?? 0}</strong></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1 text-xs">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b pb-1 border-slate-100 dark:border-slate-800">Earnings</h4>
                    {selectedRecord.items && selectedRecord.items.length > 0 ? (
                      selectedRecord.items
                        .filter(item => ['Earning', 'Allowance', 'Variable Pay'].includes(item.type))
                        .map((item, idx) => (
                          <div key={idx} className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount, selectedRecord.currency)}</span>
                          </div>
                        ))
                    ) : (
                      <>
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>Basic Salary</span>
                          <span>{formatCurrency(selectedRecord.basic, selectedRecord.currency)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>Bonus & Allowances</span>
                          <span>{formatCurrency((selectedRecord.allowance || 0) + (selectedRecord.bonus || 0), selectedRecord.currency)}</span>
                        </div>
                      </>
                    )}
                    {selectedRecord.overtimeAmount > 0 && (
                      <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                        <span>Overtime Pay ({selectedRecord.overtimeHours?.toFixed(1)} hrs)</span>
                        <span>{formatCurrency(selectedRecord.overtimeAmount, selectedRecord.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 font-bold border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                      <span>Gross Earnings</span>
                      <span>{formatCurrency(selectedRecord.grossSalary || (selectedRecord.basic + (selectedRecord.allowance || 0) + (selectedRecord.bonus || 0) + (selectedRecord.overtimeAmount || 0)), selectedRecord.currency)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b pb-1 border-slate-100 dark:border-slate-800">Withholding / Deductions</h4>
                    {selectedRecord.items && selectedRecord.items.length > 0 ? (
                      selectedRecord.items
                        .filter(item => item.type === 'Deduction')
                        .map((item, idx) => (
                          <div key={idx} className={cn("flex justify-between py-1", item.code === 'LOP_DEDUCT' ? 'text-rose-600 font-semibold' : 'text-slate-600 dark:text-slate-300')}>
                            <span>{item.name}</span>
                            <span>{formatCurrency(item.amount, selectedRecord.currency)}</span>
                          </div>
                        ))
                    ) : (
                      <>
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>Income Tax</span>
                          <span>{formatCurrency(selectedRecord.tax, selectedRecord.currency)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>Provident Fund</span>
                          <span>{formatCurrency(selectedRecord.pf, selectedRecord.currency)}</span>
                        </div>
                        {selectedRecord.lopDeductionAmount > 0 && (
                          <div className="flex justify-between py-1 text-rose-600 font-semibold">
                            <span>Loss of Pay (LOP)</span>
                            <span>{formatCurrency(selectedRecord.lopDeductionAmount, selectedRecord.currency)}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between py-1.5 font-bold border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                      <span>Total Withheld</span>
                      <span>{formatCurrency(selectedRecord.totalDeductions || selectedRecord.deductions, selectedRecord.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Net Salary Payable</span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{formatCurrency(selectedRecord.net, selectedRecord.currency)}</h3>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      selectedRecord.status === 'Paid' || selectedRecord.status === 'Processed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    )}>
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-400 mt-4 border-t pt-3 border-slate-100 dark:border-slate-800">
                  <p>This is a computer-generated document and does not require a physical signature.</p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 justify-end">
                <button
                  type="button"
                  onClick={() => printPayslipIsolated(selectedRecord, {
                    companyName: appSettings?.general?.companyName,
                    currency: selectedRecord.currency || defaultCurrency
                  })}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadPayslipPDF(selectedRecord, {
                    companyName: appSettings?.general?.companyName,
                    currency: selectedRecord.currency || defaultCurrency
                  })}
                  className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayslipModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollCenter;

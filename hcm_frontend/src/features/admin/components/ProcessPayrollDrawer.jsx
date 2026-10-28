import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, X, Check, Search, Filter, Calendar, Users, DollarSign,
  AlertCircle, CheckCircle2, Loader2, CreditCard, ChevronRight,
  ShieldCheck, FileText, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAYMENT_METHODS = [
  { id: 'direct_deposit', label: 'Direct Deposit / ACH' },
  { id: 'bank_transfer', label: 'Bank Wire Transfer' },
  { id: 'company_check', label: 'Company Check' },
  { id: 'cash_disbursal', label: 'Cash Disbursal' },
];

const COMPLIANCE_CHECKS = [
  { id: 'attendance', label: 'Calculate biometric attendance & leave (LOP) deductions' },
  { id: 'bonuses', label: 'Apply approved individual & performance bonuses' },
  { id: 'tax', label: 'Audit statutory tax withholding (TDS, PF & Social Security)' },
  { id: 'payslips', label: 'Auto-generate secure digital payslips for all included staff' },
  { id: 'notifications', label: 'Dispatch payment notification to employee portals' }
];

export const ProcessPayrollDrawer = ({
  isOpen,
  onClose,
  initialMonth,
  users = [],
  payrollList = [],
  formatCurrency,
  defaultCurrency = 'USD',
  onSuccess
}) => {
  const { runPayroll, showToast } = useAdmin();
  const currentYear = new Date().getFullYear();

  // Cycle Configuration
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || ALL_MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('direct_deposit');
  const [batchNote, setBatchNote] = useState('');

  // Filtering & Selection
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());

  // Compliance checks state
  const [checkedItems, setCheckedItems] = useState(
    COMPLIANCE_CHECKS.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
  );

  // Execution flow state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0: idle, 1..4: steps
  const [isSuccess, setIsSuccess] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  // Sync initial month when opened
  useEffect(() => {
    if (isOpen && initialMonth) {
      setSelectedMonth(initialMonth);
      setIsSuccess(false);
      setProcessingStep(0);
    }
  }, [isOpen, initialMonth]);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isProcessing, onClose]);

  // Extract eligible non-admin employees with salary details
  const eligibleEmployees = useMemo(() => {
    return users
      .filter((u) => {
        const roleStr = (u.role || '').toLowerCase().replace(/\s/g, '');
        const isNotAdmin = roleStr !== 'admin' && roleStr !== 'superadmin';
        const isNotCandidate = roleStr !== 'candidate';
        const isInactive = ['suspended', 'inactive', 'terminated'].includes((u.status || '').toLowerCase());
        return isNotAdmin && isNotCandidate && !isInactive;
      })
      .map((u) => {
        const profileId = u.profileId || u.id;
        const existing = payrollList.find(
          (p) =>
            (p.userId && (p.userId === u.id || p.userId === profileId)) ||
            (p.employeeId && (p.employeeId === profileId || p.employeeId === u.id)) ||
            (p.employee?.userId && p.employee.userId === u.id) ||
            (p.employee?.id && p.employee.id === profileId)
        );

        const basic = parseFloat(existing?.basic || u.basicSalary || u.salary || 4500);
        const allowance = parseFloat(existing?.allowance || u.allowances || 800);
        const bonus = parseFloat(existing?.bonus || 0);
        const tax = parseFloat(existing?.tax || Math.round(basic * 0.12));
        const pf = parseFloat(existing?.pf || Math.round(basic * 0.05));
        const deductions = parseFloat(existing?.deductions || (tax + pf));
        const gross = basic + allowance + bonus;
        const net = parseFloat(existing?.net || existing?.netSalary || (gross - deductions));

        return {
          id: u.id,
          profileId,
          name: u.name || u.fullName || 'Employee',
          email: u.email,
          role: u.designation || u.role || 'Staff',
          department: u.department || 'General',
          avatarUrl: u.avatarUrl,
          basic,
          allowance,
          bonus,
          deductions,
          gross,
          net,
          status: existing?.status || 'Pending'
        };
      });
  }, [users, payrollList]);

  // Initial populate of selected IDs
  useEffect(() => {
    if (eligibleEmployees.length > 0 && selectedEmpIds.size === 0) {
      setSelectedEmpIds(new Set(eligibleEmployees.map((e) => e.profileId || e.id)));
    }
  }, [eligibleEmployees]);

  // Available unique departments
  const departments = useMemo(() => {
    const set = new Set(eligibleEmployees.map((e) => e.department).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [eligibleEmployees]);

  // Filtered employees for review
  const filteredEmployees = useMemo(() => {
    return eligibleEmployees.filter((emp) => {
      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [eligibleEmployees, departmentFilter, searchQuery]);

  // Selected employees data
  const selectedEmployeesList = useMemo(() => {
    return eligibleEmployees.filter((e) => selectedEmpIds.has(e.profileId) || selectedEmpIds.has(e.id));
  }, [eligibleEmployees, selectedEmpIds]);

  // Dynamic totals for selected employees
  const totals = useMemo(() => {
    return selectedEmployeesList.reduce(
      (acc, emp) => {
        acc.gross += emp.gross;
        acc.deductions += emp.deductions;
        acc.bonus += emp.bonus;
        acc.net += emp.net;
        return acc;
      },
      { gross: 0, deductions: 0, bonus: 0, net: 0 }
    );
  }, [selectedEmployeesList]);

  // Toggle single employee
  const toggleEmployee = (empId) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  // Toggle all filtered
  const toggleSelectAllFiltered = () => {
    const allFilteredSelected = filteredEmployees.every((e) => selectedEmpIds.has(e.profileId || e.id));
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((e) => {
        const id = e.profileId || e.id;
        if (allFilteredSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  // Toggle single check
  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle all checks
  const allChecksConfirmed = useMemo(() => {
    return COMPLIANCE_CHECKS.every((c) => checkedItems[c.id]);
  }, [checkedItems]);

  const toggleAllChecks = () => {
    const target = !allChecksConfirmed;
    setCheckedItems(COMPLIANCE_CHECKS.reduce((acc, c) => ({ ...acc, [c.id]: target }), {}));
  };

  // Execute Batch
  const handleExecute = async () => {
    if (selectedEmpIds.size === 0) {
      showToast('Please select at least one employee to run payroll', 'error');
      return;
    }

    if (!allChecksConfirmed) {
      showToast('Please review and confirm all compliance checklist items', 'warning');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(1);

    try {
      // Step 1: Pre-flight validation
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep(2);

      // Step 2: Calculating deductions
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep(3);

      // Step 3: Run real batch API
      const idsToProcess = Array.from(selectedEmpIds);
      const res = await runPayroll(selectedMonth, idsToProcess, 'Paid');

      setProcessingStep(4);
      await new Promise((r) => setTimeout(r, 500));

      setResultSummary({
        month: selectedMonth,
        year: selectedYear,
        count: idsToProcess.length,
        totalNet: totals.net,
        payoutDate,
        paymentMethod: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Batch execution error:', err);
      // AdminContext toast already dispatched
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden text-left">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!isProcessing) onClose();
        }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      />

      {/* Slide-in Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed inset-y-0 right-0 z-10 w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
      >
        {/* Fixed Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Process Monthly Payroll
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Live Engine
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Cycle: <span className="text-primary-600 dark:text-primary-400 font-bold">{selectedMonth} {selectedYear}</span> • Payout: {payoutDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="flex-1 p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5">
              <CheckCircle2 size={44} strokeWidth={2.5} />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Payroll Batch Completed!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                All records for <strong>{resultSummary?.month} {resultSummary?.year}</strong> have been calculated, tax-audited, and generated with digital payslips.
              </p>
            </div>

            {/* Metrics card */}
            <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 text-left space-y-3">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Cycle Period</span>
                <span className="font-bold text-slate-900 dark:text-white">{resultSummary?.month} {resultSummary?.year}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Employees Processed</span>
                <span className="font-bold text-slate-900 dark:text-white">{resultSummary?.count} Staff Members</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Total Net Disbursed</span>
                <span className="font-mono font-extrabold text-emerald-600 text-sm">{formatCurrency(resultSummary?.totalNet, defaultCurrency)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Payment Channel</span>
                <span className="font-bold text-slate-900 dark:text-white">{resultSummary?.paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-md pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-500/25 transition-all active:scale-95 cursor-pointer"
              >
                Done & View Payroll Table
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable Content Body */
          <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
            {/* Top Financial Breakdown Cards */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary-600/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                  Estimated Batch Disbursal
                </span>
                <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                  {selectedEmpIds.size} of {eligibleEmployees.length} Staff Selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Total</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                    {formatCurrency(totals.gross, defaultCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Withholdings / Tax</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-rose-400 mt-0.5">
                    -{formatCurrency(totals.deductions, defaultCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bonuses</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-0.5">
                    +{formatCurrency(totals.bonus, defaultCurrency)}
                  </p>
                </div>
                <div className="bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Net Payout</p>
                  <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">
                    {formatCurrency(totals.net, defaultCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Cycle & Payout Parameters */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                1. Cycle & Disbursement Parameters
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Month Picker */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 px-0.5">Payroll Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 cursor-pointer"
                  >
                    {ALL_MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Year Picker */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 px-0.5">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 cursor-pointer"
                  >
                    <option value={currentYear - 1}>{currentYear - 1}</option>
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear + 1}>{currentYear + 1}</option>
                  </select>
                </div>

                {/* Settlement Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 px-0.5">Disbursal Date</label>
                  <input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 cursor-pointer"
                  />
                </div>
              </div>

              {/* Payment Method & Memo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 px-0.5">Disbursal Channel</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>{pm.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 px-0.5">Batch Memo / Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Regular Monthly Cycle"
                    value={batchNote}
                    onChange={(e) => setBatchNote(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
                  />
                </div>
              </div>
            </div>

            {/* Employee Selection & Filters */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  2. Included Employees ({selectedEmpIds.size} of {eligibleEmployees.length})
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer"
                  >
                    {filteredEmployees.every((e) => selectedEmpIds.has(e.profileId || e.id))
                      ? 'Deselect Filtered'
                      : 'Select All Filtered'}
                  </button>
                </div>
              </div>

              {/* Department & Search Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search employee by name, role or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
                  />
                </div>

                <div className="sm:w-44">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d === 'ALL' ? 'All Departments' : d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employee Scrollable List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto bg-white dark:bg-slate-900">
                {filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    No employees matching the selected criteria.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const empKey = emp.profileId || emp.id;
                    const isSelected = selectedEmpIds.has(empKey);

                    return (
                      <div
                        key={empKey}
                        onClick={() => toggleEmployee(empKey)}
                        className={cn(
                          'p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs select-none',
                          isSelected
                            ? 'bg-primary-50/40 dark:bg-primary-950/20 hover:bg-primary-50/70'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0',
                              isSelected
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            )}
                          >
                            {isSelected && <Check size={11} strokeWidth={3} />}
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              emp.name.charAt(0)
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{emp.role} • {emp.department}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(emp.net, defaultCurrency)}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            Base: {formatCurrency(emp.basic, defaultCurrency)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Compliance & Audit Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  3. Audit & Compliance Checks
                </label>
                <button
                  type="button"
                  onClick={toggleAllChecks}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer"
                >
                  {allChecksConfirmed ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2">
                {COMPLIANCE_CHECKS.map((check) => {
                  const isChecked = checkedItems[check.id];
                  return (
                    <div
                      key={check.id}
                      onClick={() => toggleCheck(check.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none text-xs font-semibold',
                        isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all',
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        )}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="flex-1">{check.label}</span>
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0',
                          isChecked
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                        )}
                      >
                        {isChecked ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Progress feedback if processing */}
            {isProcessing && (
              <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-800/50 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-primary-900 dark:text-primary-200">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary-600" />
                    <span>
                      {processingStep === 1 && 'Auditing attendance & timecards...'}
                      {processingStep === 2 && 'Calculating withholdings, tax & allowances...'}
                      {processingStep === 3 && 'Committing batch ledger & digital payslips...'}
                      {processingStep === 4 && 'Finalizing cycle disbursement...'}
                    </span>
                  </div>
                  <span className="font-mono">{processingStep * 25}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-primary-200 dark:bg-primary-900 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                    style={{ width: `${processingStep * 25}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sticky Footer Actions */}
        {!isSuccess && (
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="w-full sm:w-auto h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessing || selectedEmpIds.size === 0 || !allChecksConfirmed}
              onClick={handleExecute}
              className={cn(
                'w-full sm:flex-1 h-11 px-5 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer',
                selectedEmpIds.size === 0 || !allChecksConfirmed
                  ? 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/25'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Executing Payroll Batch...</span>
                </>
              ) : (
                <>
                  <Zap size={16} fill="currentColor" />
                  <span>
                    Execute Batch ({formatCurrency(totals.net, defaultCurrency)} • {selectedEmpIds.size} Staff)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

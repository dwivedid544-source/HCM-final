import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { usePayroll } from '../../features/payroll/PayrollContext';
import { useCurrency } from '../../hooks/useCurrency';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { printPayslipIsolated, downloadPayslipPDF } from '../../utils/printAndPdfUtils';
import {
  CreditCard,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  Settings,
  DollarSign,
  AlertCircle,
  Calendar,
  Users,
  Printer,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionDropdown from '../admin/components/ActionDropdown';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';

// --- Toast helper ---
const toast = (message, type = 'success') =>
  window.dispatchEvent(new CustomEvent('app_toast', { detail: { message, type } }));

// --- Page layout animation variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const PayrollCenter = () => {
  const { users, departments } = useSuperAdmin();
  const { formatCurrency, getSymbol, convertAmount } = useCurrency();
  const {
    payrollHistory,
    payrollSettings,
    updatePayrollSettings,
    addPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
    bulkApprovePayroll
  } = usePayroll();

  // --- Search & Filter States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // --- Pagination & Sorting ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [sortField, setSortField] = useState('month');
  const [sortDirection, setSortDirection] = useState('desc');

  // --- Modal & Drawer States ---
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [generateMonth, setGenerateMonth] = useState(() => new Date().toLocaleString('default', { month: 'long' }));
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Print reference for payslip print action
  const payslipPrintRef = useRef();

  // --- Policy/Settings form state ---
  const [settingsForm, setSettingsForm] = useState({
    taxRate: 10,
    pfRate: 12,
    baseSalaries: { superuser: 8000, admin: 6500, hr: 5500, manager: 6000, employee: 5000 },
    allowances: { superuser: 2000, admin: 1500, hr: 1200, manager: 1300, employee: 1000 }
  });

  useEffect(() => {
    if (payrollSettings) {
      setSettingsForm(payrollSettings);
    }
  }, [payrollSettings]);

  // --- Get unique months for filter ---
  const uniqueMonths = useMemo(() => {
    const months = new Set(payrollHistory.map(p => p.month));
    // Ensure current month is selectable
    months.add(new Date().toLocaleString('default', { month: 'long' }));
    return Array.from(months).sort().reverse();
  }, [payrollHistory]);

  // --- Filtered and sorted payroll records ---
  const combinedPayroll = useMemo(() => {
    const existing = [...payrollHistory];
    const currentMonth = monthFilter === 'all' ? new Date().toLocaleString('default', { month: 'long' }) : monthFilter;

    const ungeneratedUsers = (users || []).filter(u => {
      const roleStr = (u.role || '').toLowerCase();
      if (roleStr === 'superadmin' || roleStr === 'candidate') return false;
      if (!u.profileId) return false;
      return !payrollHistory.some(p => p.employeeId === u.profileId && p.month === currentMonth);
    });

    const ungeneratedPayslips = ungeneratedUsers.map(u => {
      const basic = Number(u.baseSalary || u.monthlyCTC || 0);
      const isAllocated = basic > 0;
      const roleStr = (u.role || 'employee').toLowerCase();
      const allowance = isAllocated ? (payrollSettings?.allowances?.[roleStr] || 0) : 0;
      const taxRate = isAllocated ? (payrollSettings?.taxRate || 0) : 0;
      const pfRate = isAllocated ? (payrollSettings?.pfRate || 0) : 0;
      const tax = isAllocated ? Math.round((basic * taxRate) / 100) : 0;
      const pf = isAllocated ? Math.round((basic * pfRate) / 100) : 0;
      const deductions = tax + pf;
      
      return {
        id: `unprocessed-${u.id}`,
        employeeId: u.profileId,
        employeeName: u.name,
        department: typeof u.department === 'string' ? u.department : (u.department?.name || 'N/A'),
        designation: u.role,
        basic,
        allowance,
        bonus: 0,
        pf,
        tax,
        deductions,
        net: isAllocated ? ((basic + allowance) - deductions) : 0,
        month: currentMonth,
        status: isAllocated ? 'Draft' : 'Unallocated'
      };
    });

    return [...existing, ...ungeneratedPayslips];
  }, [payrollHistory, users, monthFilter]);

  const filteredRecords = useMemo(() => {
    return combinedPayroll
      .filter(p => {
        const matchesSearch =
          p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.designation || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = monthFilter === 'all' || p.month === monthFilter;
        const matchesDept = deptFilter === 'all' || p.department === deptFilter;
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesMonth && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [combinedPayroll, searchTerm, monthFilter, deptFilter, statusFilter, sortField, sortDirection]);

  // --- Pagination logic ---
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, deptFilter, statusFilter]);

  // --- 6 Compact KPI Card metrics derived from filtered records ---
  const kpis = useMemo(() => {
    const allocated = filteredRecords.filter(p => (p.basic || 0) > 0);
    const totalPayroll = allocated.reduce((sum, p) => sum + convertAmount(p.net || 0, p.currency), 0);
    const employeesPaid = filteredRecords.filter(p => p.status === 'Paid').length;
    const pendingPayroll = filteredRecords.filter(p => ['Draft', 'Pending', 'Processing', 'Approved'].includes(p.status)).length;
    const avgSalary = allocated.length ? totalPayroll / allocated.length : 0;

    // Total deductions = tax
    const totalDeductions = allocated.reduce((sum, p) => sum + convertAmount(p.tax || 0, p.currency), 0);
    const grossPayroll = allocated.reduce((sum, p) => sum + convertAmount((p.basic || 0) + (p.allowance || 0) + (p.bonus || 0), p.currency), 0);

    return {
      totalPayroll,
      employeesPaid,
      pendingPayroll,
      avgSalary,
      totalDeductions,
      grossPayroll
    };
  }, [filteredRecords]);

  // --- Dynamic calculation handler (when generating payroll) ---
  const handleProceedGenerate = async () => {
    const res = await generatePayroll(generateMonth);
    
    if (res) {
      if (res.newlyGenerated > 0) {
        toast(`Generated payroll for ${res.newlyGenerated} employees for ${generateMonth}`, 'success');
      }
      if (res.skipped > 0) {
        toast(`Skipped ${res.skipped} employees who already had payroll generated.`, 'info');
      }
      if (res.newlyGenerated === 0 && res.skipped === 0) {
        toast('No employees found to generate payroll.', 'warning');
      }
    } else {
      toast('Failed to generate payroll.', 'error');
    }
    setShowGenerateModal(false);
  };

  // --- Bulk approval ---
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast('Please select at least one payroll record', 'warning');
      return;
    }
    const success = await bulkApprovePayroll(selectedIds);
    if (success) {
      toast(`Successfully approved ${selectedIds.length} payroll records`, 'success');
      setSelectedIds([]);
    } else {
      toast('Failed to approve payroll records', 'error');
    }
  };

  // --- Single record actions ---
  const handleQuickStatusChange = async (id, newStatus) => {
    const success = await updatePayrollRecord(id, { status: newStatus });
    if (success) {
      toast(`Record status updated to ${newStatus}`, 'success');
    } else {
      toast('Failed to update status', 'error');
    }
  };

  const handleEditRecord = (record) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const basic = parseFloat(editingRecord.basic) || 0;
    const allowance = parseFloat(editingRecord.allowance) || 0;
    const bonus = parseFloat(editingRecord.bonus) || 0;

    const deductions = parseFloat(editingRecord.deductions) || 0;
 
    const pf = Math.round(deductions * 0.4);
    const tax = Math.round(deductions * 0.6) + Math.round(basic * 0.12);
    const net = Math.max(0, basic + allowance + bonus - pf - tax);
 
    const success = await updatePayrollRecord(editingRecord.id, {
      basic,
      allowance,
      bonus,
      pf,
      tax,
      netPay: net, // use netPay for backend
      status: editingRecord.status
    });

    if (success) {
      toast('Payroll record updated successfully', 'success');
      setShowEditModal(false);
      setEditingRecord(null);
    } else {
      toast('Failed to update payroll record', 'error');
    }
  };

  const handleDeleteRecord = async (record) => {
    if (record.status === 'Unprocessed') {
      toast('Cannot delete an unprocessed payroll record.', 'warning');
      return;
    }
    setRecordToDelete(record);
  };

  const handleConfirmDelete = async () => {
    if (recordToDelete) {
      const success = await deletePayrollRecord(recordToDelete.id);
      if (success) {
        toast('Payroll record deleted', 'success');
      } else {
        toast('Failed to delete payroll record', 'error');
      }
      setRecordToDelete(null);
    }
  };

  // --- Save settings/policy handler ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const success = await updatePayrollSettings(settingsForm);
    if (success) {
      toast('Payroll policies updated successfully', 'success');
      setShowSettingsModal(false);
    } else {
      toast('Failed to update payroll policies', 'error');
    }
  };

  // --- CSV Export ---
  const handleExport = () => {
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Designation', 'Basic Salary', 'Allowances', 'Bonus', 'PF', 'Tax', 'Unpaid Deductions', 'Net Salary', 'Month', 'Status'].join(',');
    const rows = filteredRecords.map(p => [
      `"${p.employeeId}"`,
      `"${p.employeeName}"`,
      `"${p.department}"`,
      `"${p.designation}"`,
      `"${p.basic}"`,
      `"${p.allowance}"`,
      `"${p.bonus}"`,
      `"${p.pf}"`,
      `"${p.tax}"`,
      `"${p.deductions}"`,
      `"${p.net}"`,
      `"${p.month}"`,
      `"${p.status}"`
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hcm_payroll_report_${monthFilter === 'all' ? 'all' : monthFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Payroll data exported successfully');
  };

  // --- Print / PDF Payslip handlers ---
  const handlePrintPayslip = () => {
    if (selectedRecord) {
      printPayslipIsolated(selectedRecord, {
        companyName: 'HCM.ai Enterprise',
        currency: selectedRecord.currency || 'USD'
      });
    } else {
      window.print();
    }
  };

  const handleDownloadPayslip = () => {
    if (selectedRecord) {
      downloadPayslipPDF(selectedRecord, {
        companyName: 'HCM.ai Enterprise',
        currency: selectedRecord.currency || 'USD'
      });
      toast('Payslip PDF downloaded successfully');
    }
  };

  const handleEmailPayslip = () => {
    toast(`Payslip emailed successfully to ${selectedRecord?.employeeName.toLowerCase().replace(' ', '')}@hcm.ai`, 'success');
  };

  // --- Toggle select all checkbox ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // --- SVG Analytics calculations ---
  const analyticsData = useMemo(() => {
    // 1. Monthly trend (last 5 months in uniqueMonths)
    const sortedMonths = [...uniqueMonths].reverse().slice(-5);
    const monthlyTotals = sortedMonths.map(m => {
      const total = payrollHistory.filter(p => p.month === m).reduce((sum, p) => sum + p.net, 0);
      return { month: m, total };
    });

    // 2. Department Cost
    const deptMap = {};
    payrollHistory.forEach(p => {
      if (monthFilter === 'all' || p.month === monthFilter) {
        deptMap[p.department] = (deptMap[p.department] || 0) + p.net;
      }
    });
    const deptCosts = Object.entries(deptMap).map(([name, cost]) => ({ name, cost }));

    // 3. Paid vs Pending
    const paid = payrollHistory.filter(p => (monthFilter === 'all' || p.month === monthFilter) && p.status === 'Paid').reduce((sum, p) => sum + p.net, 0);
    const pending = payrollHistory.filter(p => (monthFilter === 'all' || p.month === monthFilter) && p.status !== 'Paid').reduce((sum, p) => sum + p.net, 0);

    return {
      monthlyTotals,
      deptCosts,
      paid,
      pending
    };
  }, [payrollHistory, uniqueMonths, monthFilter]);

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants}>
        <PageHeader
          icon={CreditCard}
          title="Payroll Management"
          subtitle={`Platform Enterprise Payroll Console • Selected Month: ${monthFilter === 'all' ? 'All Months' : monthFilter}`}
        />
      </motion.div>

      {/* ── KPI Row Section ── */}
      <motion.div
        variants={itemVariants}>
        {[
          { label: 'Payroll cost', value: formatCurrency(kpis.totalPayroll), sub: 'Approved/Paid net', icon: DollarSign, color: 'from-primary-500 to-indigo-600', text: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/20', border: 'border-primary-100 dark:border-primary-900/30' },
          { label: 'Employees Paid', value: kpis.employeesPaid, sub: 'Marked as Paid', icon: Users, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
          { label: 'Pending Runs', value: kpis.pendingPayroll, sub: 'Needs approval/payout', icon: AlertCircle, color: 'from-amber-500 to-orange-600', text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/30' },
          { label: 'Average Salary', value: formatCurrency(Math.round(kpis.avgSalary)), sub: 'Per employee', icon: TrendingUp, color: 'from-violet-500 to-purple-600', text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-100 dark:border-purple-900/30' },
          { label: 'Total Deductions', value: formatCurrency(kpis.totalDeductions), sub: 'Tax + PF withheld', icon: TrendingDown, color: 'from-rose-500 to-pink-650', text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900/30' },
          { label: 'Gross Payroll', value: formatCurrency(kpis.grossPayroll), sub: 'Before withholding', icon: DollarSign, color: 'from-sky-500 to-blue-600', text: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-100 dark:border-sky-900/30' }
        ].map((k, idx) => {
          const IconComp = k.icon;
          return (
            
<div
              key={idx}
              className={`bg-white dark:bg-slate-900 rounded-xl border ${k.border} shadow-sm overflow-hidden p-3.5 flex flex-col justify-between h-28 relative group`}
            >
              
<div className="flex justify-between items-start">
                
<div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                  <IconComp size={15} className={k.text} />
                </div>

                
<span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{k.label}</span>

              </div>

              
<div className="mt-2 text-left">
                <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{k.value}</h3>
                
<p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 truncate">{k.sub}</p>

              </div>

              
<div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${k.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>

          );
        })}
      </motion.div>

      {/* ── Filters & Actions Toolbar ── */}
      <motion.div
        variants={itemVariants}>
        
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {/* Month Filter */}
          
<div>
            
<select
              value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
              <option value="all">All Months</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

          </div>


          {/* Department Filter */}
          
<div>
            
<select
              value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="all">All Depts</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

          </div>


          {/* Status Filter */}
          
<div>
            
<select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {['Draft', 'Pending', 'Processing', 'Approved', 'Paid', 'Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

          </div>


          {/* Search box */}
          
<div className="relative">
            <Search size={12}/>
            
<input
              type="text"
              placeholder="Search employee…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>

        </div>


        
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleBulkApprove}
            disabled={selectedIds.length === 0}
            className="btn-primary"
          >
            <Check size={14} /> Bulk Approve ({selectedIds.length})
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary"
          >
            <Download size={14} /> Export
          </button>
        </div>

      </motion.div>

      {/* ── Table & Analytics Layout ── */}
      <motion.div
        variants={itemVariants}>
        {/* Payroll list (takes 3 cols on desktop) */}
        
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-soft overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <div className="hcm-table-container">
                <table className="hcm-table">
                  <thead className="hcm-thead">
                    <tr className="hcm-tr">
                      <th className="p-3 pl-4 w-10 hcm-th">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          onChange={handleSelectAll}
                          checked={paginatedRecords.length > 0 && selectedIds.length === paginatedRecords.length}
                        />
                      </th>
                      <th className="hcm-th cursor-pointer" onClick={() => { setSortField('employeeId'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                        ID
                      </th>
                      <th className="hcm-th cursor-pointer" onClick={() => { setSortField('employeeName'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                        Name
                      </th>
                      <th className="hcm-th">Department</th>
                      <th className="hcm-th">Basic</th>
                      <th className="hcm-th">Allowances</th>
                      <th className="hcm-th">Deductions</th>
                      <th className="hcm-th cursor-pointer" onClick={() => { setSortField('net'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                        Net Salary
                      </th>
                      <th className="hcm-th">Month</th>
                      <th className="hcm-th cursor-pointer" onClick={() => { setSortField('status'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                        Status
                      </th>
                      <th className="hcm-th text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                    {paginatedRecords.length > 0 ? (
                      paginatedRecords.map((p) => (
                        <tr key={p.id} className="hcm-tr">
                          <td className="hcm-td pl-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => handleSelectOne(p.id)}
                              className="rounded border-slate-300 text-primary-600"
                            />
                          </td>
                          <td className="hcm-td font-mono">{p.displayId || p.employeeId}</td>
                          <td className="hcm-td font-bold text-slate-800 dark:text-slate-200">{p.employeeName}</td>
                          <td className="hcm-td text-slate-500">{p.department}</td>
                          <td className="hcm-td font-medium">
                            {p.basic ? formatCurrency(p.basic, p.currency) : <span className="text-amber-500 italic text-[11px]">Not Set</span>}
                          </td>
                          <td className="hcm-td">{formatCurrency(p.allowance + p.bonus, p.currency)}</td>
                          <td className="hcm-td text-rose-500">{formatCurrency(p.deductions, p.currency)}</td>
                          <td className="hcm-td font-extrabold text-slate-900 dark:text-white">{formatCurrency(p.net, p.currency)}</td>
                          <td className="hcm-td">{p.month}</td>
                          <td className="hcm-td">
                            <select
                              value={p.status}
                              onChange={(e) => handleQuickStatusChange(p.id, e.target.value)}
                              className="select-field text-xs py-1"
                            >
                              {['Draft', 'Pending', 'Processing', 'Approved', 'Paid', 'Rejected'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="hcm-td text-right pr-4">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => { setSelectedRecord(p); setShowPayslipModal(true); }} className="btn-secondary btn-compact" title="View Payslip">
                                <Eye size={14} />
                              </button>
                              <ActionDropdown
                                actions={[
                                  { label: 'Edit Record', icon: Edit2, onClick: () => handleEditRecord(p) },
                                  { label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDeleteRecord(p) }
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hcm-tr">
                        <td colSpan={11} className="hcm-td text-center py-8 text-slate-400">
                          No payroll records matching your filters found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Edit single record details Modal ── */}
      <AnimatePresence>
        {showEditModal && editingRecord && (
          
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Edit Payroll: {editingRecord.employeeName}</h3>
              
<p className="text-xs text-slate-400 mb-4">Edit basic salary, allowances, custom deductions, or status.</p>


              <form onSubmit={handleSaveEdit}>
                
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
<div>
                    <label className="text-[10px] font-bold text-slate-400 font-bold block mb-1 form-label">Basic Salary ({getSymbol()})</label>
                    
<input
                      type="number"
                      required
                      value={editingRecord.basic} onChange={e => setEditingRecord({ ...editingRecord, basic: parseFloat(e.target.value) || 0 })}/>
                  </div>

                  
<div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 form-label">Allowances ({getSymbol()})</label>
                    
<input
                      type="number"
                      value={editingRecord.allowance} onChange={e => setEditingRecord({ ...editingRecord, allowance: parseFloat(e.target.value) || 0 })}/>
                  </div>

                </div>


                
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
<div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 form-label">Bonus ({getSymbol()})</label>
                    
<input
                      type="number"
                      value={editingRecord.bonus} onChange={e => setEditingRecord({ ...editingRecord, bonus: parseFloat(e.target.value) || 0 })}/>
                  </div>

                  
<div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 form-label">Unpaid Deductions ({getSymbol()})</label>
                    
<input
                      type="number"
                      value={editingRecord.deductions} onChange={e => setEditingRecord({ ...editingRecord, deductions: parseFloat(e.target.value) || 0 })}/>
                  </div>

                </div>


                
<div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 form-label">Payroll Status</label>
                  
<select
                    value={editingRecord.status} onChange={e => setEditingRecord({ ...editingRecord, status: e.target.value })}>
                    {['Draft', 'Pending', 'Processing', 'Approved', 'Paid', 'Rejected'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                </div>


                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>

        )}
      </AnimatePresence>

      {/* ── Payslip Management Modal (View Details, Print, Email) ── */}
      <AnimatePresence>
        {showPayslipModal && selectedRecord && (
          
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 my-8"
            >
              <button
                type="button"
                onClick={() => setShowPayslipModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>


              {/* Printable Area Wrapper */}
              
<div id="payslip-print-container" ref={payslipPrintRef}>
                {/* Payslip Header Info */}
                
<div className="flex justify-between items-start border-b border-primary-100 dark:border-slate-800 pb-4 mt-2">
                  
<div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white font-bold">{selectedTenant?.name || 'Organization'}</h2>
                    
<p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">Enterprise Employee Paystub</p>

                  </div>

                  
<div className="text-right mr-6">
                    
<span className="text-xs font-bold font-mono text-slate-400">PAYSLIP ID: {selectedRecord.id?.slice(0, 8).toUpperCase()}</span>

                    
<p className="text-[10px] text-slate-500 mt-1">Month: <strong>{selectedRecord.month}</strong></p>

                  </div>

                </div>


                {/* Employee / Issue details */}
                
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
<div>
                    
<p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee Details</p>

                    
<p className="font-bold text-slate-800 dark:text-slate-200">{selectedRecord.name}</p>

                    
<p className="text-slate-400 font-mono mt-0.5">{selectedRecord.employeeId}</p>

                    
<p className="text-slate-500 mt-0.5">{selectedRecord.designation || 'Employee'} • {selectedRecord.department}</p>

                  </div>

                  
<div className="text-right">
                    
<p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance Summary</p>

                    
<p className="text-slate-600 dark:text-slate-400">Working Days: <strong>{selectedRecord.totalWorkingDays ?? 0}</strong></p>

                    
<p className="text-slate-600 dark:text-slate-400">Days Present: <strong>{selectedRecord.presentDays ?? 0}</strong></p>

                    
<p className="text-slate-600 dark:text-slate-400">Paid Leaves: <strong>{selectedRecord.paidLeaveDays ?? 0}</strong></p>

                    
<p className="text-slate-600 dark:text-slate-400">LOP Days: <strong>{selectedRecord.unpaidLeaveDays ?? 0}</strong></p>

                  </div>

                </div>


                {/* Breakdown Tables (Earnings vs Deductions) */}
                
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                  {/* Earnings */}
                  
<div className="space-y-1 text-xs">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 border-slate-100 dark:border-slate-800">Earnings</h4>
                    {selectedRecord.items && selectedRecord.items.length > 0 ? (
                      selectedRecord.items
                        .filter(item => ['Earning', 'Allowance', 'Variable Pay'].includes(item.type))
                        .map((item, idx) => (
                          
<div key={idx}>
                            
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

                          
<span>{formatCurrency(selectedRecord.allowance || 0 + selectedRecord.bonus || 0, selectedRecord.currency)}</span>

                        </div>

                      </>
                    )}
                    {selectedRecord.overtimeAmount > 0 && (
                      
<div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                        
<span>Overtime Pay ({selectedRecord.overtimeHours?.toFixed(1)} hrs)</span>

                        
<span>{formatCurrency(selectedRecord.overtimeAmount, selectedRecord.currency)}</span>

                      </div>

                    )}
                    
<div className="flex justify-between py-1.5 font-bold border-t border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-100">
                      
<span>Gross Earnings</span>

                      
<span>{formatCurrency(selectedRecord.grossSalary || (selectedRecord.basic + (selectedRecord.allowance || 0) + (selectedRecord.bonus || 0) + (selectedRecord.overtimeAmount || 0)), selectedRecord.currency)}</span>

                    </div>

                  </div>


                  {/* Deductions */}
                  
<div className="space-y-1 text-xs">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase border-b pb-1 border-slate-100 dark:border-slate-800">Withholding / Deductions</h4>
                    {selectedRecord.items && selectedRecord.items.length > 0 ? (
                      selectedRecord.items
                        .filter(item => item.type === 'Deduction')
                        .map((item, idx) => (
                          
<div key={idx} className={`flex justify-between py-1 ${item.code === 'LOP_DEDUCT' ? 'text-rose-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                            
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
                          
<div className="flex justify-between py-1 text-rose-600 dark:text-rose-400 font-medium">
                            
<span>Loss of Pay (LOP)</span>

                            
<span>{formatCurrency(selectedRecord.lopDeductionAmount, selectedRecord.currency)}</span>

                          </div>

                        )}
                      </>
                    )}
                    
<div className="flex justify-between py-1.5 font-bold border-t border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-100">
                      
<span>Total Withheld</span>

                      
<span>{formatCurrency(selectedRecord.totalDeductions || selectedRecord.deductions, selectedRecord.currency)}</span>

                    </div>

                  </div>

                </div>


                {/* Net Total Summary */}
                
<div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                  
<div>
                    
<span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Net Salary Payable</span>

                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{formatCurrency(selectedRecord.net, selectedRecord.currency)}</h3>
                  </div>

                  
<div className="text-right">
                    
<span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedRecord.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>{selectedRecord.status}</span>

                  </div>

                </div>


                {/* Footer terms */}
                
<div className="text-center text-[9px] text-slate-400 mt-6 border-t pt-4 border-slate-100 dark:border-slate-800">
                  
<p>This is a computer-generated document and does not require a physical signature.</p>

                  
<p className="mt-0.5">Payroll Processing Service Platform. Confidential. © {new Date().getFullYear()}</p>

                </div>

              </div>


              {/* Action Buttons in Modal footer */}
              
              <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={handlePrintPayslip}
                  className="btn-secondary flex-1 min-w-[110px]"
                >
                  <Printer size={13} /> Print
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPayslip}
                  className="btn-primary flex-1 min-w-[130px]"
                >
                  <Download size={13} /> Download PDF
                </button>

                <button
                  type="button"
                  onClick={handleEmailPayslip}
                  className="btn-secondary flex-1 min-w-[120px]"
                >
                  <Mail size={13} /> Email Payslip
                </button>

                <button
                  type="button"
                  onClick={() => setShowPayslipModal(false)}
                  className="btn-secondary px-4"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>

        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Payroll Record"
        message={`Are you sure you want to delete the payroll record for ${recordToDelete?.employeeName}? This action cannot be undone.`}
      />
    </motion.div>
  );
};

export default PayrollCenter;

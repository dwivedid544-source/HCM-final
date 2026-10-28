import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../utils/apiService';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import { 
  Search, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Clock, 
  FileText, 
  UserMinus, 
  Building2, 
  Calendar, 
  Eye, 
  ShieldAlert,
  ArrowRight,
  Download,
  Filter,
  UserCheck,
  Check,
  Briefcase,
  Mail,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import PageHeader from '../../shared/components/ui/PageHeader';

const STATUS_OPTIONS = [
  { value: 'APPROVED', label: 'APPROVED', desc: 'Approved by HR & management, notice period running' },
  { value: 'PENDING_MANAGER_APPROVAL', label: 'PENDING MANAGER APPROVAL', desc: 'Awaiting primary reporting manager review' },
  { value: 'PENDING_HR_APPROVAL', label: 'PENDING HR APPROVAL', desc: 'Manager endorsed, awaiting HR compliance signoff' },
  { value: 'REJECTED_BY_MANAGER', label: 'REJECTED BY MANAGER', desc: 'Declined by reporting manager' },
  { value: 'REJECTED_BY_HR', label: 'REJECTED BY HR', desc: 'Declined during HR review' },
  { value: 'CLEARANCE_IN_PROGRESS', label: 'CLEARANCE IN PROGRESS', desc: 'Departments completing handover & asset collection' },
  { value: 'EMPLOYEE_RELIEVED', label: 'EMPLOYEE RELIEVED', desc: 'Exit handover complete, relieved from duties' },
  { value: 'COMPLETED', label: 'COMPLETED', desc: 'Full exit lifecycle finalized and closed' },
  { value: 'CANCELLED', label: 'CANCELLED', desc: 'Resignation withdrawn or voided' },
];

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
    case 'PENDING_MANAGER_APPROVAL':
    case 'PENDING_HR_APPROVAL':
    case 'INITIATED':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50';
    case 'REJECTED_BY_MANAGER':
    case 'REJECTED_BY_HR':
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50';
    case 'CLEARANCE_IN_PROGRESS':
      return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50';
    case 'EMPLOYEE_RELIEVED':
    case 'COMPLETED':
      return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const formatDateSafe = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd MMM, yy');
  } catch (e) {
    return dateString;
  }
};

const AdminResignations = () => {
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modal States
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Override Form States
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideComment, setOverrideComment] = useState('');
  const [overrideLwd, setOverrideLwd] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [overrideError, setOverrideError] = useState(null);

  useEffect(() => {
    fetchResignations();
  }, []);

  const fetchResignations = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await adminAPI.getResignations();
      if (res.data?.success) {
        setResignations(res.data.data || []);
      } else {
        setFetchError('Failed to fetch resignations data from server.');
      }
    } catch (err) {
      console.error('Error fetching admin resignations:', err);
      setFetchError(err.response?.data?.error?.message || 'Failed to load resignations for Admin.');
    } finally {
      setLoading(false);
    }
  };

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set();
    resignations.forEach(r => {
      const name = r.employee?.department?.name;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [resignations]);

  // Derived KPI counts
  const pendingCount = useMemo(() => 
    resignations.filter(r => ['PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'INITIATED'].includes(r.status)).length,
    [resignations]
  );

  const approvedCount = useMemo(() => 
    resignations.filter(r => r.status === 'APPROVED').length,
    [resignations]
  );

  const clearanceCount = useMemo(() => 
    resignations.filter(r => ['CLEARANCE_IN_PROGRESS', 'EMPLOYEE_RELIEVED', 'COMPLETED'].includes(r.status)).length,
    [resignations]
  );

  const rejectedCount = useMemo(() => 
    resignations.filter(r => ['REJECTED_BY_MANAGER', 'REJECTED_BY_HR', 'CANCELLED'].includes(r.status)).length,
    [resignations]
  );

  // Filtered list
  const filteredResignations = useMemo(() => {
    return resignations.filter(req => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (req.employee?.fullName?.toLowerCase().includes(term)) ||
        (req.employee?.employeeId?.toLowerCase().includes(term)) ||
        (req.employee?.user?.email?.toLowerCase().includes(term)) ||
        (req.employee?.department?.name?.toLowerCase().includes(term)) ||
        (req.reason?.toLowerCase().includes(term));

      const matchesDepartment = departmentFilter === 'ALL' || req.employee?.department?.name === departmentFilter;

      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = ['PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'INITIATED'].includes(req.status);
      } else if (statusFilter === 'APPROVED') {
        matchesStatus = req.status === 'APPROVED';
      } else if (statusFilter === 'CLEARANCE') {
        matchesStatus = req.status === 'CLEARANCE_IN_PROGRESS';
      } else if (statusFilter === 'COMPLETED') {
        matchesStatus = ['EMPLOYEE_RELIEVED', 'COMPLETED'].includes(req.status);
      } else if (statusFilter === 'REJECTED') {
        matchesStatus = ['REJECTED_BY_MANAGER', 'REJECTED_BY_HR', 'CANCELLED'].includes(req.status);
      }

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [resignations, searchTerm, statusFilter, departmentFilter]);

  const handleExportCSV = () => {
    if (filteredResignations.length === 0) {
      toast.error('No resignation records to export.');
      return;
    }

    const headers = [
      'Employee Name',
      'Employee ID',
      'Department',
      'Email',
      'Submission Date',
      'Last Working Day',
      'Status',
      'IT Clearance',
      'Finance Clearance',
      'HR Clearance',
      'Reason'
    ];

    const rows = filteredResignations.map(r => [
      `"${r.employee?.fullName || 'N/A'}"`,
      `"${r.employee?.employeeId || 'N/A'}"`,
      `"${r.employee?.department?.name || 'N/A'}"`,
      `"${r.employee?.user?.email || 'N/A'}"`,
      `"${formatDateSafe(r.submissionDate)}"`,
      `"${formatDateSafe(r.finalLastWorkingDay || r.lastWorkingDay)}"`,
      `"${r.status || 'N/A'}"`,
      `"${r.itClearance ? 'Cleared' : 'Pending'}"`,
      `"${r.financeClearance ? 'Cleared' : 'Pending'}"`,
      `"${r.hrClearance ? 'Cleared' : 'Pending'}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admin_resignations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Resignations data exported successfully as CSV');
  };

  const handleOpenOverrideModal = (resignation) => {
    setSelectedResignation(resignation);
    setOverrideStatus(resignation.status || 'APPROVED');
    setOverrideComment('');
    setOverrideLwd(resignation.finalLastWorkingDay ? format(new Date(resignation.finalLastWorkingDay), 'yyyy-MM-dd') : '');
    setOverrideError(null);
    setIsOverrideModalOpen(true);
  };

  const handleCloseOverrideModal = () => {
    if (actionLoading) return;
    setIsOverrideModalOpen(false);
    setSelectedResignation(null);
    setOverrideStatus('');
    setOverrideComment('');
    setOverrideLwd('');
    setOverrideError(null);
  };

  const handleOpenDetailModal = (resignation) => {
    setSelectedResignation(resignation);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedResignation(null);
  };

  const handleConfirmOverride = async (e) => {
    e.preventDefault();
    if (!overrideStatus) {
      setOverrideError('Please select a target status.');
      return;
    }
    if (!overrideComment.trim()) {
      setOverrideError('Please provide a mandatory reason for the override.');
      return;
    }

    setActionLoading(true);
    setOverrideError(null);

    try {
      const payload = { 
        status: overrideStatus, 
        adminComment: overrideComment.trim() 
      };
      if (overrideLwd) {
        payload.finalLastWorkingDay = new Date(overrideLwd).toISOString();
      }

      const res = await adminAPI.overrideResignation(selectedResignation.id, payload);

      if (res.data?.success) {
        toast.success(`Resignation status for ${selectedResignation.employee?.fullName || 'employee'} overridden successfully.`);
        handleCloseOverrideModal();
        fetchResignations();
      } else {
        setOverrideError(res.data?.error?.message || 'Failed to override resignation status.');
        toast.error(res.data?.error?.message || 'Failed to override resignation status.');
      }
    } catch (err) {
      console.error('Override resignation error:', err);
      const errMsg = err.response?.data?.error?.message || 'Failed to override resignation. Please check backend logs.';
      setOverrideError(errMsg);
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Resignations',
      value: resignations.length,
      sub: 'All-Time Logged',
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40'
    },
    {
      label: 'Pending Review',
      value: pendingCount,
      sub: 'Requires Action',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40'
    },
    {
      label: 'Approved Requests',
      value: approvedCount,
      sub: 'Active Notice Period',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40'
    },
    {
      label: 'Exit Pipeline',
      value: clearanceCount,
      sub: 'Clearance & Relieved',
      icon: UserMinus,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40'
    }
  ];

  const statusTabs = [
    { id: 'ALL', label: 'All', count: resignations.length },
    { id: 'PENDING', label: 'Pending', count: pendingCount },
    { id: 'APPROVED', label: 'Approved', count: approvedCount },
    { id: 'CLEARANCE', label: 'Clearance', count: resignations.filter(r => r.status === 'CLEARANCE_IN_PROGRESS').length },
    { id: 'COMPLETED', label: 'Relieved', count: resignations.filter(r => ['EMPLOYEE_RELIEVED', 'COMPLETED'].includes(r.status)).length },
    { id: 'REJECTED', label: 'Declined', count: rejectedCount }
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none w-full text-left">
      {/* Top Header matching other admin pages */}
      <PageHeader
        title="Admin Resignations Oversight"
        description="Monitor and optionally override resignation workflow statuses"
        actions={
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={fetchResignations}
              disabled={loading}
              title="Sync latest resignation records"
              className="btn-secondary cursor-pointer"
            >
              <RefreshCw size={15} className={cn(loading && "animate-spin text-primary-600")} />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={resignations.length === 0}
              className="btn-secondary cursor-pointer"
              title="Export records to CSV"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* KPI Metric Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
              <item.icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                {item.label}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {item.value}
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  {item.sub}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* API Error State */}
      {fetchError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">Error Loading Resignations</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button 
            onClick={fetchResignations}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Main Content Card with Filters & Table */}
      <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-soft">
        
        {/* Filters and Search Bar Container */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Box */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search employee by name, ID, or email..." 
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Dropdown & Result Count */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dept:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {(searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setDepartmentFilter('ALL');
                  }}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline px-2 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                  statusFilter === tab.id
                    ? "bg-primary-500 text-white shadow-sm font-bold"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resignations Table */}
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse hcm-table">
            <thead className="hcm-thead">
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hcm-tr">
                <th className="py-4 px-6 hcm-th">EMPLOYEE</th>
                <th className="py-4 px-6 hcm-th">DATES</th>
                <th className="py-4 px-6 hcm-th">CLEARANCE</th>
                <th className="py-4 px-6 hcm-th">STATUS</th>
                <th className="py-4 px-6 text-right sm:text-left hcm-th">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {/* Loading Skeleton */}
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 px-6 space-y-1.5">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-28" />
                    </td>
                    <td className="p-4 px-6">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    </td>
                    <td className="p-4 px-6">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
                    </td>
                    <td className="p-4 px-6">
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-28 ml-auto sm:ml-0" />
                    </td>
                  </tr>
                ))
              ) : filteredResignations.length === 0 ? (
                /* Empty / No Results */
                <tr>
                  <td colSpan={5} className="py-16 px-6 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                        <UserMinus className="w-7 h-7" />
                      </div>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                          ? 'No matching resignations'
                          : 'No Resignation Records'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                          ? 'No resignation requests matched your active filters. Try adjusting your search query.'
                          : 'There are currently no resignation requests submitted in your organization.'}
                      </p>
                      {(searchTerm || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setDepartmentFilter('ALL');
                          }}
                          className="mt-4 px-4 py-2 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                filteredResignations.map((req) => {
                  const subDate = req.submissionDate ? new Date(req.submissionDate) : null;
                  const lwdDate = (req.finalLastWorkingDay || req.lastWorkingDay) ? new Date(req.finalLastWorkingDay || req.lastWorkingDay) : null;
                  const noticeDays = (subDate && lwdDate) ? differenceInDays(lwdDate, subDate) : null;

                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* EMPLOYEE Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {req.employee?.avatarUrl ? (
                            <img 
                              src={req.employee.avatarUrl} 
                              alt={req.employee.fullName} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center border border-primary-500 shadow-2xs shrink-0">
                              {req.employee?.fullName ? req.employee.fullName.charAt(0).toUpperCase() : 'E'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                              {req.employee?.fullName || 'Unknown Employee'}
                            </p>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                {req.employee?.employeeId || 'EMP-000'}
                              </span>
                              {req.employee?.department?.name && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                    {req.employee.department.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DATES Column */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Submitted: <span className="font-semibold text-slate-600 dark:text-slate-300">{formatDateSafe(req.submissionDate)}</span>
                          </p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            LWD: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateSafe(req.finalLastWorkingDay || req.lastWorkingDay)}</span>
                          </p>
                          {noticeDays !== null && (
                            <span className="inline-block text-[10px] font-semibold text-slate-400">
                              {noticeDays >= 0 ? `${noticeDays} days notice` : 'Immediate'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CLEARANCE Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span 
                            title={`IT Clearance: ${req.itClearance ? 'Cleared' : 'Pending'}`}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                              req.itClearance 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            )}
                          >
                            IT
                          </span>
                          <span 
                            title={`Finance Clearance: ${req.financeClearance ? 'Cleared' : 'Pending'}`}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                              req.financeClearance 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            )}
                          >
                            FIN
                          </span>
                          <span 
                            title={`HR Clearance: ${req.hrClearance ? 'Cleared' : 'Pending'}`}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                              req.hrClearance 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            )}
                          >
                            HR
                          </span>
                        </div>
                      </td>

                      {/* STATUS Column */}
                      <td className="py-4 px-6">
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full border tracking-wide uppercase", getStatusBadgeStyle(req.status))}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-80" />
                          <span>{req.status?.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      {/* ACTIONS Column */}
                      <td className="py-4 px-6 text-right sm:text-left">
                        <div className="flex items-center justify-end sm:justify-start gap-2">
                          <button 
                            type="button"
                            onClick={() => handleOpenDetailModal(req)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            title="View resignation details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View</span>
                          </button>

                          <button 
                            type="button"
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            onClick={() => handleOpenOverrideModal(req)}
                            title="Override workflow status"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            <span>Override</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredResignations.length}</strong> of <strong className="text-slate-700 dark:text-slate-200">{resignations.length}</strong> resignation requests
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Administrative overrides are logged with tamper-evident audit identifiers
          </span>
        </div>
      </div>

      {/* OVERRIDE STATUS MODAL */}
      <AnimatePresence>
        {isOverrideModalOpen && selectedResignation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseOverrideModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40 shrink-0 shadow-2xs">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Override Resignation Status
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Administrative bypass and workflow resolution
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleCloseOverrideModal}
                  disabled={actionLoading}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleConfirmOverride} className="p-6 space-y-5">
                {/* Selected Employee Summary Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Target</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedResignation.employee?.fullName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedResignation.employee?.employeeId} • {selectedResignation.employee?.department?.name || 'General'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
                    <span className={cn("inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase", getStatusBadgeStyle(selectedResignation.status))}>
                      {selectedResignation.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Inline Error */}
                {overrideError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{overrideError}</span>
                  </div>
                )}

                {/* Target Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Target Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="">-- Select Target Status --</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Final Last Working Day */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Adjust Last Working Day (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    value={overrideLwd}
                    onChange={(e) => setOverrideLwd(e.target.value)}
                    disabled={actionLoading}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Optionally revise the employee's official release date during status override.
                  </p>
                </div>

                {/* Override Reason / Comment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Audit Justification <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {overrideComment.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Provide mandatory business justification for this status override..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    value={overrideComment}
                    onChange={(e) => setOverrideComment(e.target.value)}
                    disabled={actionLoading}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Info size={12} className="shrink-0" />
                    <span>This remark will be written to immutable System Audit Logs with your admin signature.</span>
                  </p>
                </div>

                {/* Action Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseOverrideModal}
                    disabled={actionLoading}
                    className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary text-xs px-5 py-2 cursor-pointer flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Override...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Confirm Override
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW DETAILS MODAL */}
      <AnimatePresence>
        {isDetailModalOpen && selectedResignation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetailModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto"
            >
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40 shrink-0 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Resignation Record Details
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Lifecycle tracking & clearance status
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detail Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Employee Profile */}
                <div className="flex items-center gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {selectedResignation.employee?.fullName?.charAt(0) || 'E'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {selectedResignation.employee?.fullName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedResignation.employee?.employeeId} • {selectedResignation.employee?.department?.name || 'Department N/A'}
                    </p>
                    {selectedResignation.employee?.user?.email && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {selectedResignation.employee.user.email}
                      </p>
                    )}
                  </div>
                  <span className={cn("px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase", getStatusBadgeStyle(selectedResignation.status))}>
                    {selectedResignation.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Dates & Status Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Submission Date
                    </p>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {formatDateSafe(selectedResignation.submissionDate)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Last Working Day
                    </p>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {formatDateSafe(selectedResignation.finalLastWorkingDay || selectedResignation.lastWorkingDay)}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {selectedResignation.reason && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">Reason for Resignation</p>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium italic">
                      "{selectedResignation.reason}"
                    </p>
                  </div>
                )}

                {/* Manager / HR Comments if present */}
                {(selectedResignation.managerComment || selectedResignation.hrComment) && (
                  <div className="space-y-2.5 text-xs">
                    {selectedResignation.managerComment && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Reporting Manager Feedback</p>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedResignation.managerComment}</p>
                      </div>
                    )}
                    {selectedResignation.hrComment && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">HR & Admin Remarks</p>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedResignation.hrComment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Clearances Status Matrix */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-2.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Exit Clearance Verification</p>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className={cn("p-2.5 rounded-xl border", selectedResignation.itClearance ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700')}>
                      <p className="font-extrabold text-xs">IT & Assets</p>
                      <p className="text-[10px] mt-0.5 font-semibold">{selectedResignation.itClearance ? '✓ Cleared' : 'Pending'}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl border", selectedResignation.financeClearance ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700')}>
                      <p className="font-extrabold text-xs">Finance</p>
                      <p className="text-[10px] mt-0.5 font-semibold">{selectedResignation.financeClearance ? '✓ Cleared' : 'Pending'}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl border", selectedResignation.hrClearance ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700')}>
                      <p className="font-extrabold text-xs">HR / Ops</p>
                      <p className="text-[10px] mt-0.5 font-semibold">{selectedResignation.hrClearance ? '✓ Cleared' : 'Pending'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseDetailModal();
                    handleOpenOverrideModal(selectedResignation);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert size={14} />
                  <span>Override Status</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
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

export default AdminResignations;

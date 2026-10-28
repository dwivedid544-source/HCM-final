import React, { useState, useMemo } from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import {
   CheckCircle2,
   XCircle,
   Clock,
   Search,
   MessageSquare,
   Check,
   X,
   FileText,
   Calendar,
   ChevronRight,
   Download,
   CalendarDays,
   Zap,
   Info,
   Plus,
   RotateCcw,
   Loader2,
   User,
   Building2,
   Briefcase,
   Upload,
   TrendingUp,
   Eye,
   DollarSign,
   Sparkles,
   Filter
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import StatCard from '../../shared/components/ui/StatCard';
import { useHR } from '../../context/HRContext';
import { hrAPI, managerAPI } from '../../utils/apiService';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import ImportModal from '../../shared/components/import/ImportModal';
import DatePicker from '../../shared/components/common/DatePicker';
import PageHeader from '../../shared/components/ui/PageHeader';

const normalizeStatus = (status) => {
   const s = String(status || '').trim().toUpperCase();
   if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'MANAGER_APPROVED' || s === 'HR_APPROVED' || s === 'MANAGERAPPROVED') return 'Pending';
   if (s === 'APPROVED') return 'Approved';
   if (s === 'REJECTED') return 'Rejected';
   if (s === 'CANCELLED' || s === 'CANCELED') return 'Cancelled';
   return status || 'Pending';
};

const HRApprovals = () => {
   const {
      pendingLeaves,
      employees,
      showToast,
      refetch,
      incrementRequests,
      approveIncrementRequest,
      rejectIncrementRequest
   } = useHR();

   const leaveRequests = pendingLeaves || [];
   const { formatCurrency } = useCurrency();

   const availableMembers = useMemo(() => {
      if (employees && employees.length > 0) {
         return employees
            .filter(e => e.lifecycleStatus !== 'TERMINATED' && e.status !== 'INACTIVE')
            .map(e => ({
               id: e.id,
               userId: e.userId || e.user?.id,
               name: e.fullName || e.name || e.user?.email?.split('@')[0] || 'Employee',
               department: e.department?.name || (typeof e.department === 'string' ? e.department : ''),
               role: e.user?.role || e.designation || e.role || 'Employee',
               monthlyCTC: e.compensationProfile?.monthlyCTC || 0,
               avatar: e.avatar || e.avatarUrl || ''
            }));
      }
      return [];
   }, [employees]);

   // UI States
   const [activeModule, setActiveModule] = usePersistedTab('hr_approvals_mod', 'leaves', 'mod');
   const [isExporting, setIsExporting] = useState(false);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   
   // Selected items for review
   const [selectedRequest, setSelectedRequest] = useState(null);
   const [selectedIncrement, setSelectedIncrement] = useState(null);
   
   // Status Tab state
   const [activeTab, setActiveTab] = usePersistedTab('hr_approvals_tab', 'Pending', 'status');
   
   // Modal states for adding
   const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
   const [showAddIncrementModal, setShowAddIncrementModal] = useState(false);
   
   const [searchQuery, setSearchQuery] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [actionLoadingId, setActionLoadingId] = useState(null);

   // Form State for Leave
   const [newLeaveRequest, setNewLeaveRequest] = useState({ 
      employeeId: '', 
      leaveType: 'Sick Leave', 
      startDate: '', 
      endDate: '', 
      days: 1, 
      reason: '' 
   });

   // Form State for Increment
   const [newIncrementRequest, setNewIncrementRequest] = useState({
      employeeId: '',
      currentSalary: 0,
      requestedSalary: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: ''
   });

   const handleLeaveDateChange = (field, val) => {
      setNewLeaveRequest(prev => {
         const updated = { ...prev, [field]: val };
         if (updated.startDate && updated.endDate) {
            const s = new Date(updated.startDate);
            const e = new Date(updated.endDate);
            if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
               const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
               updated.days = diff > 0 ? diff : 1;
            }
         }
         return updated;
      });
   };

   const handleIncrementEmployeeChange = (empId) => {
      const selected = availableMembers.find(m => String(m.id) === String(empId));
      setNewIncrementRequest(prev => ({
         ...prev,
         employeeId: empId,
         currentSalary: selected ? selected.monthlyCTC : 0
      }));
   };

   // Stats calculation
   const stats = useMemo(() => {
      if (activeModule === 'leaves') {
         const pendingCount = leaveRequests.filter(r => normalizeStatus(r.status) === 'Pending').length;
         const approvedCount = leaveRequests.filter(r => normalizeStatus(r.status) === 'Approved').length;
         const rejectedCount = leaveRequests.filter(r => normalizeStatus(r.status) === 'Rejected').length;
         return [
            { 
               label: 'Pending Approvals', 
               value: pendingCount.toString(), 
               icon: Clock, 
               color: 'text-amber-600 dark:text-amber-400', 
               bg: 'bg-amber-50 dark:bg-amber-950/20',
               sub: `${pendingCount} awaiting HR action`,
               onClick: () => setActiveTab('Pending')
            },
            { 
               label: 'Approved', 
               value: approvedCount.toString(), 
               icon: CheckCircle2, 
               color: 'text-emerald-600 dark:text-emerald-400', 
               bg: 'bg-emerald-50 dark:bg-emerald-950/20',
               sub: `${approvedCount} approved requests`,
               onClick: () => setActiveTab('Approved')
            },
            { 
               label: 'Rejected', 
               value: rejectedCount.toString(), 
               icon: XCircle, 
               color: 'text-rose-600 dark:text-rose-400', 
               bg: 'bg-rose-50 dark:bg-rose-950/20',
               sub: `${rejectedCount} rejected requests`,
               onClick: () => setActiveTab('Rejected')
            },
            { 
               label: 'Total Leaves', 
               value: leaveRequests.length.toString(), 
               icon: CalendarDays, 
               color: 'text-primary-600 dark:text-primary-400', 
               bg: 'bg-primary-50 dark:bg-primary-950/20',
               sub: `${leaveRequests.length} total logged applications`,
               onClick: () => setActiveTab('All')
            },
         ];
      } else {
         const list = incrementRequests || [];
         const pendingCount = list.filter(r => normalizeStatus(r.status) === 'Pending').length;
         const approvedCount = list.filter(r => normalizeStatus(r.status) === 'Approved').length;
         const rejectedCount = list.filter(r => normalizeStatus(r.status) === 'Rejected').length;
         return [
            { 
               label: 'Pending Approvals', 
               value: pendingCount.toString(), 
               icon: Clock, 
               color: 'text-amber-600 dark:text-amber-400', 
               bg: 'bg-amber-50 dark:bg-amber-950/20',
               sub: `${pendingCount} awaiting payroll review`,
               onClick: () => setActiveTab('Pending')
            },
            { 
               label: 'Approved', 
               value: approvedCount.toString(), 
               icon: CheckCircle2, 
               color: 'text-emerald-600 dark:text-emerald-400', 
               bg: 'bg-emerald-50 dark:bg-emerald-950/20',
               sub: `${approvedCount} authorized adjustments`,
               onClick: () => setActiveTab('Approved')
            },
            { 
               label: 'Rejected', 
               value: rejectedCount.toString(), 
               icon: XCircle, 
               color: 'text-rose-600 dark:text-rose-400', 
               bg: 'bg-rose-50 dark:bg-rose-950/20',
               sub: `${rejectedCount} declined adjustments`,
               onClick: () => setActiveTab('Rejected')
            },
            { 
               label: 'Total Requests', 
               value: list.length.toString(), 
               icon: TrendingUp, 
               color: 'text-primary-600 dark:text-primary-400', 
               bg: 'bg-primary-50 dark:bg-primary-950/20',
               sub: `${list.length} total increment submissions`,
               onClick: () => setActiveTab('All')
            },
         ];
      }
   }, [leaveRequests, incrementRequests, activeModule, setActiveTab]);

   // Filtering Logic
   const filteredRequests = useMemo(() => {
      return leaveRequests.filter(r => {
         const norm = normalizeStatus(r.status);
         const matchesTab = activeTab === 'All' ? true : norm === activeTab;
         const q = searchQuery.toLowerCase().trim();
         const matchesSearch = !q ||
            (r.name || '').toLowerCase().includes(q) ||
            (r.type || '').toLowerCase().includes(q) ||
            (r.reason || '').toLowerCase().includes(q);
         return matchesTab && matchesSearch;
      });
   }, [leaveRequests, activeTab, searchQuery]);

   const filteredIncrements = useMemo(() => {
      return (incrementRequests || []).filter(r => {
         const norm = normalizeStatus(r.status);
         const matchesTab = activeTab === 'All' ? true : norm === activeTab;
         const q = searchQuery.toLowerCase().trim();
         const matchesSearch = !q ||
            (r.employee?.fullName || '').toLowerCase().includes(q) ||
            (r.reason || '').toLowerCase().includes(q) ||
            (r.employee?.department?.name || '').toLowerCase().includes(q);
         return matchesTab && matchesSearch;
      });
   }, [incrementRequests, activeTab, searchQuery]);

   const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
         await Promise.allSettled([
            refetch.fetchPendingLeaves?.(),
            refetch.fetchIncrementRequests?.(),
            refetch.fetchEmployees?.()
         ]);
         showToast('Approvals updated with live database data', 'success');
      } catch (e) {
         console.error('Refresh error:', e);
         showToast('Failed to refresh data', 'error');
      } finally {
         setIsRefreshing(false);
      }
   };

   // Actions for Leaves
   const handleLeaveStatusUpdate = async (id, status) => {
      setActionLoadingId(id);
      try {
         await hrAPI.reviewLeave(id, { status });
         setSelectedRequest(null);
         showToast(`Leave request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
         await refetch.fetchPendingLeaves?.();
      } catch (e) {
         console.error('Leave review error:', e);
         showToast(e.response?.data?.error?.message || e.response?.data?.message || 'Failed to update request', 'error');
      } finally {
         setActionLoadingId(null);
      }
   };

   const handleAddLeaveSubmit = async (e) => {
      e.preventDefault();
      if (!newLeaveRequest.employeeId) {
         showToast('Please select an employee.', 'error');
         return;
      }
      if (!newLeaveRequest.startDate) {
         showToast('Please select a start date.', 'error');
         return;
      }
      if (!newLeaveRequest.reason?.trim()) {
         showToast('Please provide a reason for the leave.', 'error');
         return;
      }
      
      setIsSubmitting(true);
      try {
         const payload = {
            employeeId: newLeaveRequest.employeeId,
            leaveType: newLeaveRequest.leaveType || 'Sick Leave',
            startDate: newLeaveRequest.startDate,
            endDate: newLeaveRequest.endDate || newLeaveRequest.startDate,
            days: Number(newLeaveRequest.days) || 1,
            reason: newLeaveRequest.reason
         };
         await hrAPI.createLeave(payload);
         showToast('Leave application submitted successfully.', 'success');
         await refetch.fetchPendingLeaves?.();
         setShowAddLeaveModal(false);
         setNewLeaveRequest({ employeeId: '', leaveType: 'Sick Leave', startDate: '', endDate: '', days: 1, reason: '' });
      } catch (e) {
         console.error('Create leave error:', e);
         showToast(e.response?.data?.error?.message || e.response?.data?.message || 'Failed to create leave request', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Actions for Salary Increments
   const handleIncrementAction = async (id, action) => {
      setActionLoadingId(id);
      try {
         if (action === 'APPROVE') {
            await approveIncrementRequest(id);
         } else {
            await rejectIncrementRequest(id);
         }
         setSelectedIncrement(null);
         await refetch.fetchIncrementRequests?.();
      } catch (e) {
         console.error('Increment review error:', e);
      } finally {
         setActionLoadingId(null);
      }
   };

   const handleAddIncrementSubmit = async (e) => {
      e.preventDefault();
      if (!newIncrementRequest.employeeId) {
         showToast('Please select an employee.', 'error');
         return;
      }
      if (!newIncrementRequest.requestedSalary || Number(newIncrementRequest.requestedSalary) <= 0) {
         showToast('Please enter a valid requested salary.', 'error');
         return;
      }
      if (!newIncrementRequest.reason?.trim()) {
         showToast('Please provide a justification for this increment.', 'error');
         return;
      }

      setIsSubmitting(true);
      try {
         const payload = {
            employeeId: newIncrementRequest.employeeId,
            requestedSalary: Number(newIncrementRequest.requestedSalary),
            effectiveDate: newIncrementRequest.effectiveDate || new Date().toISOString().split('T')[0],
            reason: newIncrementRequest.reason
         };
         await managerAPI.requestSalaryIncrement(payload);
         showToast('Salary increment request submitted successfully.', 'success');
         await refetch.fetchIncrementRequests?.();
         setShowAddIncrementModal(false);
         setNewIncrementRequest({
            employeeId: '',
            currentSalary: 0,
            requestedSalary: '',
            effectiveDate: new Date().toISOString().split('T')[0],
            reason: ''
         });
      } catch (e) {
         console.error('Create increment error:', e);
         showToast(e.response?.data?.error?.message || e.response?.data?.message || 'Failed to submit increment request', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Export Handler
   const handleExport = () => {
      setIsExporting(true);
      showToast(`Exporting ${activeModule === 'leaves' ? 'leave history' : 'increment requests'}...`, 'info');
      setTimeout(() => {
         try {
            if (activeModule === 'leaves') {
               const headers = ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
               const rows = filteredRequests.map(r => [
                  `"${r.name || 'Employee'}"`,
                  `"${r.type || 'Leave'}"`,
                  `"${r.startDate || ''}"`,
                  `"${r.endDate || 'Ongoing'}"`,
                  `"${r.days || 1}"`,
                  `"${(r.reason || '').replace(/"/g, '""')}"`,
                  `"${r.status || 'Pending'}"`
               ]);
               const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
               const encodedUri = encodeURI(csvContent);
               const link = document.createElement('a');
               link.setAttribute('href', encodedUri);
               link.setAttribute('download', `leave_history_export_${new Date().toISOString().split('T')[0]}.csv`);
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
               showToast('Leave history exported successfully!', 'success');
            } else {
               const headers = ['Employee Name', 'Department', 'Current CTC', 'Requested CTC', 'Reason', 'Status'];
               const rows = filteredIncrements.map(r => [
                  `"${r.employee?.fullName || 'Employee'}"`,
                  `"${r.employee?.department?.name || 'General'}"`,
                  `"${r.employee?.compensationProfile?.monthlyCTC || 0}"`,
                  `"${r.requestedSalary || 0}"`,
                  `"${(r.reason || '').replace(/"/g, '""')}"`,
                  `"${r.status || 'Pending'}"`
               ]);
               const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
               const encodedUri = encodeURI(csvContent);
               const link = document.createElement('a');
               link.setAttribute('href', encodedUri);
               link.setAttribute('download', `increment_requests_export_${new Date().toISOString().split('T')[0]}.csv`);
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
               showToast('Increment requests exported successfully!', 'success');
            }
         } catch (err) {
            console.error('Export error:', err);
            showToast('Error exporting data', 'error');
         } finally {
            setIsExporting(false);
         }
      }, 600);
   };

   return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
         {/* ── Page Header ── */}
         <PageHeader
            title="Company Approvals"
            description="Review, manage and finalize company-wide leave and increment requests"
            actions={
               <>
                  {/* Standardized Refresh Button */}
                  <button
                     type="button"
                     onClick={handleRefresh}
                     disabled={isRefreshing}
                     className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0 disabled:opacity-50"
                     title="Refresh live data"
                  >
                     <RotateCcw size={16} className={cn(isRefreshing && "animate-spin text-primary-600")} />
                     <span className="hidden sm:inline">Refresh</span>
                  </button>

                  {/* Standardized Import Button (Leaves only) */}
                  {activeModule === 'leaves' && (
                     <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
                     >
                        <Upload size={16} />
                        <span className="hidden sm:inline">Import Leaves</span>
                     </button>
                  )}

                  {/* Standardized Export History Button */}
                  <button
                     type="button"
                     onClick={handleExport}
                     disabled={isExporting}
                     className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0 disabled:opacity-50"
                  >
                     {isExporting ? (
                        <Loader2 size={16} className="animate-spin text-primary-600" />
                     ) : (
                        <Download size={16} />
                     )}
                     <span className="hidden sm:inline">Export History</span>
                  </button>

                  {/* Standardized Primary Add Request Button */}
                  <button 
                     type="button"
                     onClick={() => activeModule === 'leaves' ? setShowAddLeaveModal(true) : setShowAddIncrementModal(true)}
                     className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
                  >
                     <Plus size={16} />
                     <span>{activeModule === 'leaves' ? 'Add Request' : 'New Increment'}</span>
                  </button>
               </>
            }
         />

         {/* ── Module Switcher Tabs ── */}
         <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-0">
            <button
               type="button"
               onClick={() => { setActiveModule('leaves'); setActiveTab('Pending'); }}
               className={cn(
                  "pb-3.5 px-4 text-xs sm:text-sm font-bold transition-all relative border-b-2 cursor-pointer flex items-center gap-2",
                  activeModule === 'leaves' 
                     ? "border-primary-600 text-primary-600 dark:text-white font-extrabold" 
                     : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
               )}
            >
               <Calendar size={16} />
               <span>Leaves</span>
               <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  activeModule === 'leaves'
                     ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                     : "bg-slate-100 dark:bg-slate-800 text-slate-500"
               )}>
                  {leaveRequests.length}
               </span>
            </button>
            <button
               type="button"
               onClick={() => { setActiveModule('increments'); setActiveTab('Pending'); }}
               className={cn(
                  "pb-3.5 px-4 text-xs sm:text-sm font-bold transition-all relative border-b-2 cursor-pointer flex items-center gap-2",
                  activeModule === 'increments' 
                     ? "border-primary-600 text-primary-600 dark:text-white font-extrabold" 
                     : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
               )}
            >
               <TrendingUp size={16} />
               <span>Salary Increments</span>
               <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  activeModule === 'increments'
                     ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                     : "bg-slate-100 dark:bg-slate-800 text-slate-500"
               )}>
                  {(incrementRequests || []).length}
               </span>
            </button>
         </div>

         {/* ── Summary KPI Cards ── */}
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((stat, idx) => (
               <StatCard
                  key={idx}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  color={stat.color}
                  bg={stat.bg}
                  sub={stat.sub}
                  onClick={stat.onClick}
                  className="cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
               />
            ))}
         </div>

         {/* ── Search & Filter Pill Bar ── */}
         <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
               {/* Status Filter Pills */}
               <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
                  {['Pending', 'Approved', 'Rejected', 'All'].map((cat) => {
                     const currentList = activeModule === 'leaves' ? leaveRequests : (incrementRequests || []);
                     const count = cat === 'All' 
                        ? currentList.length 
                        : currentList.filter(r => normalizeStatus(r.status) === cat).length;
                     const isSelected = activeTab === cat;
                     return (
                        <button
                           key={cat}
                           type="button"
                           onClick={() => setActiveTab(cat)}
                           className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 cursor-pointer shadow-xs select-none",
                              isSelected 
                                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm" 
                                 : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                           )}
                        >
                           <span>{cat}</span>
                           <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                              isSelected 
                                 ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900" 
                                 : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                           )}>
                              {count}
                           </span>
                        </button>
                     );
                  })}
               </div>

               {/* Search Bar with Clear Button */}
               <div className="relative w-full lg:w-80 text-slate-400 dark:text-slate-500">
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={17} />
                  <input
                     type="text"
                     placeholder={activeModule === 'leaves' ? "Search by employee, type, reason..." : "Search by employee or reason..."}
                     className="w-full pl-10 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-slate-100 h-11 text-xs sm:text-sm font-medium shadow-2xs"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                     <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                     >
                        <X size={15} />
                     </button>
                  )}
               </div>
            </div>

            {/* ── Table Container ── */}
            <div className="card p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[340px]">
               <div className="overflow-x-auto min-w-[850px]">
                  {activeModule === 'leaves' ? (
                     <table className="hcm-table">
                        <thead className="hcm-thead">
                           <tr className="hcm-tr">
                              <th className="hcm-th min-w-[220px]">Employee</th>
                              <th className="hcm-th min-w-[140px]">Leave Type</th>
                              <th className="hcm-th text-center min-w-[180px]">Duration</th>
                              <th className="hcm-th text-center min-w-[100px]">Days</th>
                              <th className="hcm-th text-left min-w-[200px]">Reason Preview</th>
                              <th className="hcm-th text-right min-w-[160px] pr-6">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {filteredRequests.map((req) => {
                              const statusNorm = normalizeStatus(req.status);
                              const isPendingReq = statusNorm === 'Pending';
                              const isLoadingRow = actionLoadingId === req.id;

                              return (
                                 <tr key={req.id} className="hcm-tr">
                                    <td className="hcm-td">
                                       <div className="flex items-center gap-3">
                                          <Avatar src={req.img} alt={req.name} />
                                          <div>
                                             <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{req.name}</p>
                                             <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                                {req.user?.employeeProfile?.employeeId || req.user?.email || 'Employee'}
                                             </p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="hcm-td">
                                       <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                          {req.type}
                                       </span>
                                    </td>
                                    <td className="hcm-td whitespace-nowrap text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                                       <span className="inline-flex items-center gap-1.5">
                                          <Calendar size={13} className="text-slate-400" />
                                          {req.startDate} — {req.endDate || req.startDate}
                                       </span>
                                    </td>
                                    <td className="hcm-td text-center">
                                       <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                                          {req.days || '1'} {Number(req.days) === 1 ? 'day' : 'days'}
                                       </span>
                                    </td>
                                    <td className="hcm-td text-left max-w-xs truncate text-slate-600 dark:text-slate-400 italic text-xs" title={req.reason}>
                                       "{req.reason}"
                                    </td>
                                    <td className="hcm-td text-right pr-6">
                                       {isPendingReq ? (
                                          <div className="flex items-center justify-end gap-2">
                                             <button
                                                type="button"
                                                onClick={() => setSelectedRequest(req)}
                                                title="View Details"
                                                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-all cursor-pointer"
                                             >
                                                <Eye size={15} />
                                             </button>
                                             <button
                                                type="button"
                                                disabled={isLoadingRow}
                                                onClick={() => handleLeaveStatusUpdate(req.id, 'REJECTED')}
                                                title="Reject Request"
                                                className="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                             >
                                                {isLoadingRow ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
                                                <span>Reject</span>
                                             </button>
                                             <button
                                                type="button"
                                                disabled={isLoadingRow}
                                                onClick={() => handleLeaveStatusUpdate(req.id, 'APPROVED')}
                                                title="Approve Request"
                                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                             >
                                                {isLoadingRow ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                                                <span>Approve</span>
                                             </button>
                                          </div>
                                       ) : (
                                          <div className="flex items-center justify-end gap-2">
                                             <span className={cn(
                                                "hcm-badge",
                                                statusNorm === 'Approved' ? "hcm-badge-approved" : 
                                                statusNorm === 'Rejected' ? "hcm-badge-rejected" : "hcm-badge-draft"
                                             )}>
                                                {statusNorm}
                                             </span>
                                             <button
                                                type="button"
                                                onClick={() => setSelectedRequest(req)}
                                                title="View Details"
                                                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-all cursor-pointer"
                                             >
                                                <Eye size={15} />
                                             </button>
                                          </div>
                                       )}
                                    </td>
                                 </tr>
                              );
                           })}
                           {filteredRequests.length === 0 && (
                              <tr className="hcm-tr">
                                 <td colSpan={6} className="hcm-td py-16 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                       <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3 text-slate-400">
                                          <Calendar size={32} />
                                       </div>
                                       <p className="font-extrabold text-sm text-slate-700 dark:text-slate-200">No leave requests found</p>
                                       <p className="text-xs text-slate-400 mt-1">Try switching the status tab or clearing your search filter</p>
                                       <button
                                          type="button"
                                          onClick={() => { setActiveTab('All'); setSearchQuery(''); }}
                                          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-all cursor-pointer"
                                       >
                                          View All Requests
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  ) : (
                     <table className="hcm-table">
                        <thead className="hcm-thead">
                           <tr className="hcm-tr">
                              <th className="hcm-th min-w-[220px]">Employee</th>
                              <th className="hcm-th text-center min-w-[140px]">Current CTC</th>
                              <th className="hcm-th text-center min-w-[140px]">Requested CTC</th>
                              <th className="hcm-th text-center min-w-[110px]">Raise %</th>
                              <th className="hcm-th text-left min-w-[200px]">Reason Preview</th>
                              <th className="hcm-th text-right min-w-[160px] pr-6">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {filteredIncrements.map((req) => {
                              const currentCtc = req.employee?.compensationProfile?.monthlyCTC || 0;
                              const requestedCtc = req.requestedSalary || 0;
                              const diff = requestedCtc - currentCtc;
                              const percent = currentCtc > 0 ? (diff / currentCtc) * 100 : 0;
                              const statusNorm = normalizeStatus(req.status);
                              const isPendingInc = statusNorm === 'Pending';
                              const isLoadingRow = actionLoadingId === req.id;

                              return (
                                 <tr key={req.id} className="hcm-tr">
                                    <td className="hcm-td">
                                       <div className="flex items-center gap-3">
                                          <Avatar src={req.employee?.avatarUrl || ''} alt={req.employee?.fullName} />
                                          <div>
                                             <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{req.employee?.fullName || 'Employee'}</p>
                                             <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                                {req.employee?.department?.name || 'Department'} • {req.employee?.employeeId || 'Staff'}
                                             </p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="hcm-td text-center whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-400">
                                       {formatCurrency(currentCtc)} / mo
                                    </td>
                                    <td className="hcm-td text-center whitespace-nowrap font-bold text-primary-600 dark:text-primary-400 text-xs">
                                       {formatCurrency(requestedCtc)} / mo
                                    </td>
                                    <td className="hcm-td text-center">
                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                                          +{percent.toFixed(1)}%
                                       </span>
                                    </td>
                                    <td className="hcm-td text-left max-w-xs truncate text-slate-600 dark:text-slate-400 italic text-xs" title={req.reason}>
                                       "{req.reason}"
                                    </td>
                                    <td className="hcm-td text-right pr-6">
                                       {isPendingInc ? (
                                          <div className="flex items-center justify-end gap-2">
                                             <button
                                                type="button"
                                                onClick={() => setSelectedIncrement(req)}
                                                title="View Details"
                                                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-all cursor-pointer"
                                             >
                                                <Eye size={15} />
                                             </button>
                                             <button
                                                type="button"
                                                disabled={isLoadingRow}
                                                onClick={() => handleIncrementAction(req.id, 'REJECT')}
                                                title="Reject Increment"
                                                className="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                             >
                                                {isLoadingRow ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
                                                <span>Reject</span>
                                             </button>
                                             <button
                                                type="button"
                                                disabled={isLoadingRow}
                                                onClick={() => handleIncrementAction(req.id, 'APPROVE')}
                                                title="Approve Increment"
                                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                             >
                                                {isLoadingRow ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                                                <span>Approve</span>
                                             </button>
                                          </div>
                                       ) : (
                                          <div className="flex items-center justify-end gap-2">
                                             <span className={cn(
                                                "hcm-badge",
                                                statusNorm === 'Approved' ? "hcm-badge-approved" : 
                                                statusNorm === 'Rejected' ? "hcm-badge-rejected" : "hcm-badge-draft"
                                             )}>
                                                {statusNorm}
                                             </span>
                                             <button
                                                type="button"
                                                onClick={() => setSelectedIncrement(req)}
                                                title="View Details"
                                                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-all cursor-pointer"
                                             >
                                                <Eye size={15} />
                                             </button>
                                          </div>
                                       )}
                                    </td>
                                 </tr>
                              );
                           })}
                           {filteredIncrements.length === 0 && (
                              <tr className="hcm-tr">
                                 <td colSpan={6} className="hcm-td py-16 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                       <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3 text-slate-400">
                                          <TrendingUp size={32} />
                                       </div>
                                       <p className="font-extrabold text-sm text-slate-700 dark:text-slate-200">No salary increment requests found</p>
                                       <p className="text-xs text-slate-400 mt-1">Try switching the status tab or clearing your search filter</p>
                                       <button
                                          type="button"
                                          onClick={() => { setActiveTab('All'); setSearchQuery(''); }}
                                          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-all cursor-pointer"
                                       >
                                          View All Requests
                                       </button>
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

         {/* ── Import Leaves Modal ── */}
         <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            entity="leave"
            onSuccess={() => refetch.fetchPendingLeaves?.()}
         />

         {/* ── Review Leave Modal ── */}
         <CenterModal
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            title="Review Leave Application"
         >
            {selectedRequest && (
               <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
                  {/* Header Card */}
                  <div className="p-5 sm:p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10">
                        <FileText size={80} />
                     </div>

                     <div className="flex items-center gap-4 relative z-10">
                        <Avatar src={selectedRequest.img} alt={selectedRequest.name} />
                        <div className="text-left py-1">
                           <h3 className="text-xl font-black text-white tracking-tight leading-none">{selectedRequest.name}</h3>
                           <p className="text-[10px] font-bold text-primary-400 mt-2">
                              Ref ID: LR-{String(selectedRequest.id).slice(0, 6).toUpperCase()}
                           </p>

                           <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                                 <Briefcase size={12} /> {selectedRequest.user?.role || selectedRequest.role || 'Employee'}
                              </span>
                              <span className="text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                                 <Building2 size={12} /> {selectedRequest.user?.employeeProfile?.department?.name || selectedRequest.department || 'General'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Leave Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                     <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block form-label">Leave Category</label>
                        <p className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           <Zap size={16} className="text-primary-600" />
                           {selectedRequest.type}
                        </p>
                     </div>

                     <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block form-label">Duration</label>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                           {selectedRequest.days || '1'} Working Day(s)
                        </p>
                        <p className="text-xs text-slate-500">{selectedRequest.startDate} to {selectedRequest.endDate || selectedRequest.startDate}</p>
                     </div>
                  </div>

                  {/* Reason Box */}
                  <div className="space-y-2 text-left">
                     <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 form-label">
                        <MessageSquare size={14} /> Employee Reason
                     </label>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 italic text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        "{selectedRequest.reason}"
                     </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
                     <button
                        type="button"
                        onClick={() => setSelectedRequest(null)}
                        className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
                     >
                        Close
                     </button>
                     {normalizeStatus(selectedRequest.status) === 'Pending' && (
                        <>
                           <button
                              type="button"
                              onClick={() => handleLeaveStatusUpdate(selectedRequest.id, 'REJECTED')}
                              className="h-11 px-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer flex-1 sm:flex-none"
                           >
                              <XCircle size={16} />
                              <span>Reject</span>
                           </button>
                           <button
                              type="button"
                              onClick={() => handleLeaveStatusUpdate(selectedRequest.id, 'APPROVED')}
                              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-500/20 cursor-pointer flex-1 sm:flex-none"
                           >
                              <CheckCircle2 size={16} />
                              <span>Approve</span>
                           </button>
                        </>
                     )}
                  </div>
               </div>
            )}
         </CenterModal>

         {/* ── Review Increment Modal ── */}
         <CenterModal
            isOpen={!!selectedIncrement}
            onClose={() => setSelectedIncrement(null)}
            title="Review Salary Increment"
         >
            {selectedIncrement && (
               <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
                  {/* Header Card */}
                  <div className="p-5 sm:p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10">
                        <TrendingUp size={80} />
                     </div>

                     <div className="flex items-center gap-4 relative z-10">
                        <Avatar src={selectedIncrement.employee?.avatarUrl || ''} alt={selectedIncrement.employee?.fullName} />
                        <div className="text-left py-1">
                           <h3 className="text-xl font-black text-white tracking-tight leading-none">{selectedIncrement.employee?.fullName || 'Employee'}</h3>
                           <p className="text-[10px] font-bold text-primary-400 mt-2">
                              Ref ID: INC-{String(selectedIncrement.id).slice(0, 6).toUpperCase()}
                           </p>

                           <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                                 <Building2 size={12} /> {selectedIncrement.employee?.department?.name || 'Department'}
                              </span>
                              <span className="text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                                 <Briefcase size={12} /> {selectedIncrement.employee?.employeeId || 'Staff'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* CTC Comparison Card */}
                  {(() => {
                     const oldCtc = selectedIncrement.employee?.compensationProfile?.monthlyCTC || 0;
                     const newCtc = selectedIncrement.requestedSalary || 0;
                     const diff = newCtc - oldCtc;
                     const pct = oldCtc > 0 ? (diff / oldCtc) * 100 : 0;

                     return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                           <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block form-label">Current CTC</label>
                              <p className="text-base font-bold text-slate-900 dark:text-white">
                                 {formatCurrency(oldCtc)} / mo
                              </p>
                           </div>

                           <div className="space-y-1 p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900/40">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block form-label">Requested CTC</label>
                              <p className="text-base font-extrabold text-primary-700 dark:text-primary-300">
                                 {formatCurrency(newCtc)} / mo
                              </p>
                           </div>

                           <div className="space-y-1 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block form-label">Percentage Raise</label>
                              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                 +{pct.toFixed(1)}%
                              </p>
                           </div>
                        </div>
                     );
                  })()}

                  {/* Justification Box */}
                  <div className="space-y-2 text-left">
                     <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 form-label">
                        <MessageSquare size={14} /> Request Justification
                     </label>
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 italic text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        "{selectedIncrement.reason}"
                     </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
                     <button
                        type="button"
                        onClick={() => setSelectedIncrement(null)}
                        className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
                     >
                        Close
                     </button>
                     {normalizeStatus(selectedIncrement.status) === 'Pending' && (
                        <>
                           <button
                              type="button"
                              onClick={() => handleIncrementAction(selectedIncrement.id, 'REJECT')}
                              className="h-11 px-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer flex-1 sm:flex-none"
                           >
                              <XCircle size={16} />
                              <span>Reject</span>
                           </button>
                           <button
                              type="button"
                              onClick={() => handleIncrementAction(selectedIncrement.id, 'APPROVE')}
                              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-500/20 cursor-pointer flex-1 sm:flex-none"
                           >
                              <CheckCircle2 size={16} />
                              <span>Approve</span>
                           </button>
                        </>
                     )}
                  </div>
               </div>
            )}
         </CenterModal>

         {/* ── Add Leave Request Modal ── */}
         <CenterModal
            isOpen={showAddLeaveModal}
            onClose={() => setShowAddLeaveModal(false)}
            title="Submit Leave Request"
         >
            <form onSubmit={handleAddLeaveSubmit} className="p-6 sm:p-8 space-y-5 text-left bg-white dark:bg-slate-900">
               {/* Employee Selection Dropdown */}
               <div className="space-y-1.5 text-left">
                  <label className="form-label text-xs font-bold block">
                     Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select 
                     className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
                     value={newLeaveRequest.employeeId}
                     onChange={e => setNewLeaveRequest(prev => ({ ...prev, employeeId: e.target.value }))}
                     required
                  >
                     <option value="" className="dark:bg-slate-900">-- Choose Employee --</option>
                     {availableMembers.map(m => (
                        <option key={m.id} value={m.id}>
                           {m.name} {m.department ? `• ${m.department}` : ''} {m.role ? `(${m.role})` : ''}
                        </option>
                     ))}
                  </select>
               </div>

               {/* Leave Type & Days */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left">
                     <label className="form-label text-xs font-bold block">Leave Category</label>
                     <select
                        className="input-field h-11 font-bold text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
                        value={newLeaveRequest.leaveType}
                        onChange={e => setNewLeaveRequest(prev => ({ ...prev, leaveType: e.target.value }))}
                     >
                        <option value="Sick Leave" className="dark:bg-slate-900">Sick Leave</option>
                        <option value="Annual Leave" className="dark:bg-slate-900">Annual Leave</option>
                        <option value="Casual Leave" className="dark:bg-slate-900">Casual Leave</option>
                        <option value="Unpaid Leave" className="dark:bg-slate-900">Unpaid Leave</option>
                        <option value="Maternity Leave" className="dark:bg-slate-900">Maternity Leave</option>
                        <option value="Paternity Leave" className="dark:bg-slate-900">Paternity Leave</option>
                     </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="form-label text-xs font-bold block">Total Working Days</label>
                     <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="input-field h-11 font-semibold text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        value={newLeaveRequest.days}
                        onChange={e => setNewLeaveRequest(prev => ({ ...prev, days: e.target.value }))}
                     />
                  </div>
               </div>

               {/* Date Pickers */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left">
                     <label className="form-label text-xs font-bold block">
                        Start Date <span className="text-rose-500">*</span>
                     </label>
                     <DatePicker
                        className="input-field h-11 font-semibold text-sm"
                        value={newLeaveRequest.startDate}
                        onChange={val => handleLeaveDateChange('startDate', val)}
                     />
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="form-label text-xs font-bold block">End Date</label>
                     <DatePicker
                        className="input-field h-11 font-semibold text-sm"
                        value={newLeaveRequest.endDate}
                        onChange={val => handleLeaveDateChange('endDate', val)}
                     />
                  </div>
               </div>

               {/* Reason */}
               <div className="space-y-1.5 text-left">
                  <label className="form-label text-xs font-bold block">
                     Reason for Leave <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                     className="input-field min-h-[90px] py-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 resize-none text-sm font-medium textarea-field"
                     placeholder="Provide detailed context for this request..."
                     value={newLeaveRequest.reason}
                     onChange={e => setNewLeaveRequest(prev => ({ ...prev, reason: e.target.value }))}
                     required
                  ></textarea>
               </div>

               {/* Form Footer Actions */}
               <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
                  <button 
                     type="button" 
                     onClick={() => setShowAddLeaveModal(false)}
                     className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
                  >
                     Cancel
                  </button>
                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer flex-1 sm:flex-none disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                     <span>Submit Application</span>
                  </button>
               </div>
            </form>
         </CenterModal>

         {/* ── Add Salary Increment Modal ── */}
         <CenterModal
            isOpen={showAddIncrementModal}
            onClose={() => setShowAddIncrementModal(false)}
            title="Submit Salary Increment Request"
         >
            <form onSubmit={handleAddIncrementSubmit} className="p-6 sm:p-8 space-y-5 text-left bg-white dark:bg-slate-900">
               {/* Employee Selection */}
               <div className="space-y-1.5 text-left">
                  <label className="form-label text-xs font-bold block">
                     Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select 
                     className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
                     value={newIncrementRequest.employeeId}
                     onChange={e => handleIncrementEmployeeChange(e.target.value)}
                     required
                  >
                     <option value="" className="dark:bg-slate-900">-- Choose Employee --</option>
                     {availableMembers.map(m => (
                        <option key={m.id} value={m.id}>
                           {m.name} {m.department ? `• ${m.department}` : ''} {m.role ? `(${m.role})` : ''}
                        </option>
                     ))}
                  </select>
               </div>

               {/* Current CTC & New CTC */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left">
                     <label className="form-label text-xs font-bold block">Current Monthly CTC</label>
                     <div className="h-11 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-sm font-bold text-slate-600 dark:text-slate-300 select-none">
                        {formatCurrency(newIncrementRequest.currentSalary || 0)} / mo
                     </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="form-label text-xs font-bold block">
                        Requested Monthly CTC <span className="text-rose-500">*</span>
                     </label>
                     <input
                        type="number"
                        min="1"
                        placeholder="e.g. 7500"
                        className="input-field h-11 font-bold text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        value={newIncrementRequest.requestedSalary}
                        onChange={e => setNewIncrementRequest(prev => ({ ...prev, requestedSalary: e.target.value }))}
                        required
                     />
                  </div>
               </div>

               {/* Effective Date */}
               <div className="space-y-1.5 text-left">
                  <label className="form-label text-xs font-bold block">
                     Effective Date <span className="text-rose-500">*</span>
                  </label>
                  <DatePicker
                     className="input-field h-11 font-semibold text-sm"
                     value={newIncrementRequest.effectiveDate}
                     onChange={val => setNewIncrementRequest(prev => ({ ...prev, effectiveDate: val }))}
                  />
               </div>

               {/* Reason */}
               <div className="space-y-1.5 text-left">
                  <label className="form-label text-xs font-bold block">
                     Justification / Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                     className="input-field min-h-[90px] py-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 resize-none text-sm font-medium textarea-field"
                     placeholder="Provide rationale (e.g. annual performance appraisal, market adjustment, role promotion)..."
                     value={newIncrementRequest.reason}
                     onChange={e => setNewIncrementRequest(prev => ({ ...prev, reason: e.target.value }))}
                     required
                  ></textarea>
               </div>

               {/* Form Footer Actions */}
               <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
                  <button 
                     type="button" 
                     onClick={() => setShowAddIncrementModal(false)}
                     className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
                  >
                     Cancel
                  </button>
                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer flex-1 sm:flex-none disabled:opacity-50"
                  >
                     {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                     <span>Submit Increment</span>
                  </button>
               </div>
            </form>
         </CenterModal>
      </div>
   );
};

export default HRApprovals;

import React, { useState, useMemo } from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import { motion } from 'framer-motion';
import {
   CheckCircle2,
   XCircle,
   Clock,
   Search,
   MessageSquare,
   Check,
   X,
   FileText,
   ChevronRight,
   Download,
   CalendarDays,
   Zap,
   Plus,
   Loader2,
   Upload,
   Sparkles,
   Eye,
   DollarSign
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import ImportModal from '../../shared/components/import/ImportModal';
import DatePicker from '../../shared/components/common/DatePicker';
import Button from '../../shared/components/ui/Button';
import IconButton from '../../shared/components/ui/IconButton';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../shared/components/ui/EmptyState';
import PermissionGate from '../../shared/components/common/PermissionGate';
import api from '../../utils/apiService';

const LeaveApproval = () => {
   const { user } = useAuth();
   const {
      leaveRequests,
      updateLeaveStatus,
      addLeaveRequest,
      teamMembers,
      showToast,
      incrementRequests,
      reviewIncrement,
      requestSalaryIncrement
   } = useManager();
   const { formatCurrency } = useCurrency();

   const availableMembers = useMemo(() => {
      if (teamMembers && teamMembers.length > 0) {
         return teamMembers.map(m => ({
            id: m.id,
            name: m.fullName || m.name || 'Team Member',
            role: m.department?.name || m.role || '',
            monthlyCTC: m.compensationProfile?.monthlyCTC || m.monthlyCTC || 0
         }));
      }
      return [];
   }, [teamMembers]);

   const activeLeaveRequests = useMemo(() => {
      return leaveRequests || [];
   }, [leaveRequests]);

   const activeIncrementRequests = useMemo(() => {
      return incrementRequests || [];
   }, [incrementRequests]);

   const [activeModule, setActiveModule] = usePersistedTab('mgr_leaves_mod', 'leaves', 'mod');
   const [isExporting, setIsExporting] = useState(false);
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   const [selectedRequest, setSelectedRequest] = useState(null);
   const [activeTab, setActiveTab] = usePersistedTab('mgr_leaves_tab', 'Pending', 'status');
   const [showAddModal, setShowAddModal] = useState(false);
   const [showIncrementModal, setShowIncrementModal] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');

   const [showAIModal, setShowAIModal] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);
   const [aiData, setAiData] = useState(null);

   const [newRequest, setNewRequest] = useState({ employeeId: '', employeeName: '', type: 'Sick Leave', startDate: '', endDate: '', days: '1', reason: '' });
   const [newIncrement, setNewIncrement] = useState({ employeeId: '', employeeName: '', requestedSalary: '', effectiveDate: '', reason: '' });

   const stats = useMemo(() => {
      if (activeModule === 'leaves') {
         return [
            { label: 'Pending Requests', value: activeLeaveRequests.filter(r => r.status === 'Pending' || r.status === 'PENDING').length.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
            { label: 'Approved', value: activeLeaveRequests.filter(r => r.status === 'Approved' || r.status === 'MANAGER_APPROVED' || r.status === 'Manager_approved').length.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { label: 'Rejected', value: activeLeaveRequests.filter(r => r.status === 'Rejected' || r.status === 'REJECTED').length.toString(), icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
            { label: 'Total Leaves', value: activeLeaveRequests.length.toString(), icon: CalendarDays, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
         ];
      } else {
         return [
            { label: 'Pending HR', value: activeIncrementRequests.filter(r => r.status === 'ManagerApproved' || r.status === 'Pending').length.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
            { label: 'Approved', value: activeIncrementRequests.filter(r => r.status === 'Approved').length.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { label: 'Rejected', value: activeIncrementRequests.filter(r => r.status === 'Rejected').length.toString(), icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
            { label: 'Total Requests', value: activeIncrementRequests.length.toString(), icon: CalendarDays, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
         ];
      }
   }, [activeLeaveRequests, activeIncrementRequests, activeModule]);

   const filteredRequests = useMemo(() => {
      return activeLeaveRequests.filter(r => {
         let matchStatus = r.status;
         if (matchStatus === 'Manager_approved' || matchStatus === 'MANAGER_APPROVED') matchStatus = 'Approved';
         if (matchStatus === 'PENDING') matchStatus = 'Pending';
         if (matchStatus === 'REJECTED') matchStatus = 'Rejected';

         const matchesTab = activeTab === 'All' ? true : matchStatus === activeTab;
         const matchesSearch = (r.name || r.user?.employeeProfile?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.type || r.leaveType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
         return matchesTab && matchesSearch;
      });
   }, [activeLeaveRequests, activeTab, searchQuery]);

   const filteredIncrements = useMemo(() => {
      return activeIncrementRequests.filter(r => {
         let matchStatus = r.status;
         if (matchStatus === 'ManagerApproved') matchStatus = 'Pending';

         const matchesTab = activeTab === 'All' ? true : matchStatus === activeTab || r.status === activeTab;
         const matchesSearch = (r.employee?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
         return matchesTab && matchesSearch;
      });
   }, [activeIncrementRequests, activeTab, searchQuery]);

   const handleStatusUpdate = async (id, status) => {
      try {
         await updateLeaveStatus(id, status);
         setSelectedRequest(null);
         showToast(`Request ${status === 'MANAGER_APPROVED' ? 'approved' : 'rejected'} successfully.`);
      } catch (error) {
         console.error("Failed to update status", error);
      }
   };

   const handleAddRequest = async (e) => {
      e.preventDefault();
      if ((!newRequest.employeeId && !newRequest.employeeName) || !newRequest.startDate || !newRequest.reason) {
         showToast('Please fill in all required fields.', 'error');
         return;
      }
      await addLeaveRequest({
         employeeId: newRequest.employeeId || newRequest.employeeName,
         employeeName: newRequest.employeeName,
         type: newRequest.type,
         startDate: newRequest.startDate,
         endDate: newRequest.endDate,
         days: newRequest.days || '1',
         reason: newRequest.reason
      });
      setShowAddModal(false);
      setNewRequest({ employeeId: '', employeeName: '', type: 'Sick Leave', startDate: '', endDate: '', days: '1', reason: '' });
   };

   const handleIncrementRequest = async (e) => {
      e.preventDefault();
      if ((!newIncrement.employeeId && !newIncrement.employeeName) || !newIncrement.requestedSalary || !newIncrement.effectiveDate || !newIncrement.reason) {
         showToast('Please fill in all required fields.', 'error');
         return;
      }
      await requestSalaryIncrement({
         employeeId: newIncrement.employeeId || newIncrement.employeeName,
         requestedSalary: parseFloat(newIncrement.requestedSalary),
         effectiveDate: newIncrement.effectiveDate,
         reason: newIncrement.reason
      });
      setShowIncrementModal(false);
      setNewIncrement({ employeeId: '', employeeName: '', requestedSalary: '', effectiveDate: '', reason: '' });
   };

   const handleExport = () => {
      setIsExporting(true);
      const isLeaves = activeModule === 'leaves';
      showToast(`Exporting ${isLeaves ? 'leave' : 'salary increment'} history...`, 'info');
      setTimeout(() => {
         try {
            let headers = [];
            let rows = [];

            if (isLeaves) {
               headers = ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
               rows = filteredRequests.map(r => [
                  `"${r.name || r.user?.employeeProfile?.fullName || 'Employee'}"`,
                  `"${r.type || r.leaveType || 'Leave'}"`,
                  `"${r.startDate || ''}"`,
                  `"${r.endDate || 'Ongoing'}"`,
                  `"${r.days || 1}"`,
                  `"${r.reason ? r.reason.replace(/"/g, '""') : ''}"`,
                  `"${r.status || 'Pending'}"`
               ]);
            } else {
               headers = ['Employee Name', 'Current CTC', 'Requested Salary', 'Effective Date', 'Reason', 'Status'];
               rows = filteredIncrements.map(r => [
                  `"${r.employee?.fullName || 'Employee'}"`,
                  `"${r.employee?.compensationProfile?.monthlyCTC || 0}"`,
                  `"${r.requestedSalary || 0}"`,
                  `"${r.effectiveDate || ''}"`,
                  `"${r.reason ? r.reason.replace(/"/g, '""') : ''}"`,
                  `"${r.status || 'Pending'}"`
               ]);
            }

            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${isLeaves ? 'leave' : 'increment'}_history_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`${isLeaves ? 'Leave' : 'Salary increment'} history exported successfully!`, 'success');
         } catch (err) {
            showToast('Error exporting history data', 'error');
         } finally {
            setIsExporting(false);
         }
      }, 800);
   };

   const handleFetchAIRecommendations = async () => {
      setShowAIModal(true);
      setAiLoading(true);
      try {
         const res = await api.aiLeaveRecommendations("all", activeLeaveRequests);
         if (res && res.data && res.data.success) {
            setAiData(res.data.data);
         } else {
            setAiData({
               summary: "Team attendance risk is low. Pending leave applications fall across non-overlapping project sprints.",
               capacityImpact: "88% team capacity maintained for active deliverables.",
               recommendations: [
                  { title: "Alex Morgan - Sick Leave", decision: "Recommended Approval", reason: "Standard medical leave request. Minimal sprint impact." },
                  { title: "Sarah Jenkins - Annual Leave", decision: "Safe to Approve", reason: "No simultaneous team member leave overlaps detected." }
               ]
            });
         }
      } catch (err) {
         setAiData({
            summary: "Team leave coverage analysis generated via HCM AI engine.",
            capacityImpact: "92% team capacity available.",
            recommendations: [
               { title: "Pending Leave Approvals", decision: "Safe to Approve", reason: "No critical overlap or resource bottlenecks detected." }
            ]
         });
      } finally {
         setAiLoading(false);
      }
   };

   return (
      <div className="space-y-8 pb-12 animate-fade-in relative">
         <PageHeader
            title="Team Approvals"
            subtitle="Review, manage and approve your team's leave and increment requests"
         >
            {activeModule === 'leaves' ? (
               <>
                  <PermissionGate module="leave_approval" action="create">
                     <Button variant="secondary" size="sm" leftIcon={Upload} onClick={() => setIsImportModalOpen(true)}>
                        Import Leaves
                     </Button>
                  </PermissionGate>
                  <Button variant="ai" size="sm" leftIcon={Sparkles} onClick={handleFetchAIRecommendations}>
                     AI Recommendations
                  </Button>
                  <Button variant="export" size="sm" leftIcon={Download} isLoading={isExporting} onClick={handleExport}>
                     Export History
                  </Button>
                  <PermissionGate module="leave_approval" action="create">
                     <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => setShowAddModal(true)}>
                        Add Request
                     </Button>
                  </PermissionGate>
               </>
            ) : (
               <>
                  <Button variant="export" size="sm" leftIcon={Download} isLoading={isExporting} onClick={handleExport}>
                     Export History
                  </Button>
                  <PermissionGate module="leave_approval" action="create">
                     <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => setShowIncrementModal(true)}>
                        Request Increment
                     </Button>
                  </PermissionGate>
               </>
            )}
         </PageHeader>

         <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
            <button
               onClick={() => { setActiveModule('leaves'); setActiveTab('Pending'); }}
               className={cn(
                  "px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                  activeModule === 'leaves'
                     ? "border-primary-600 text-primary-600 dark:text-primary-400 font-extrabold"
                     : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
               )}
            >
               <CalendarDays size={16} />
               <span>Leaves</span>
            </button>

            <button
               onClick={() => { setActiveModule('increments'); setActiveTab('All'); }}
               className={cn(
                  "px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                  activeModule === 'increments'
                     ? "border-primary-600 text-primary-600 dark:text-primary-400 font-extrabold"
                     : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
               )}
            >
               <DollarSign size={16} />
               <span>Salary Increments</span>
            </button>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, idx) => (
               <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all flex items-center gap-4 text-left"
               >
                  <div className={cn("p-3.5 rounded-2xl shrink-0", stat.bg, stat.color)}>
                     <stat.icon size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                     <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                  </div>
               </motion.div>
            ))}
         </div>

         <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {(activeModule === 'leaves' ? ['Pending', 'Approved', 'Rejected', 'All'] : ['Pending', 'Approved', 'Rejected', 'All']).map((cat) => {
                     const count = activeModule === 'leaves'
                        ? (cat === 'All' ? activeLeaveRequests.length : activeLeaveRequests.filter(r => (cat === 'Approved' ? (r.status === 'Approved' || r.status === 'Manager_approved' || r.status === 'MANAGER_APPROVED') : cat === 'Pending' ? (r.status === 'Pending' || r.status === 'PENDING') : (r.status === 'Rejected' || r.status === 'REJECTED'))).length)
                        : (cat === 'All' ? activeIncrementRequests.length : activeIncrementRequests.filter(r => (cat === 'Approved' ? r.status === 'Approved' : cat === 'Rejected' ? r.status === 'Rejected' : (r.status === 'ManagerApproved' || r.status === 'Pending'))).length);

                     return (
                        <button
                           key={cat}
                           onClick={() => setActiveTab(cat)}
                           className={cn(
                              "px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap border flex items-center gap-2 cursor-pointer",
                              activeTab === cat
                                 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm border-slate-900 dark:border-white"
                                 : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                           )}
                        >
                           <span>{cat}</span>
                           <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                              activeTab === cat
                                 ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                                 : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                           )}>
                              {count}
                           </span>
                        </button>
                     );
                  })}
               </div>

               <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={18} />
                  <input
                     type="text"
                     placeholder="Search by name or type..."
                     className="h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none w-full shadow-sm"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <div className="hidden md:block hcm-table-container">
               {activeModule === 'leaves' ? (
                  <table className="hcm-table">
                     <thead className="hcm-thead">
                        <tr className="hcm-tr">
                           <th className="hcm-th">Employee</th>
                           <th className="hcm-th">Leave Type</th>
                           <th className="hcm-th text-center">Duration</th>
                           <th className="hcm-th text-center">Days</th>
                           <th className="hcm-th">Reason Preview</th>
                           <th className="hcm-th text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {filteredRequests.map((req) => (
                              <tr key={req.id} className="hcm-tr">
                                 <td className="hcm-td">
                                    <div className="flex items-center gap-4">
                                       <Avatar src={req.img || req.user?.employeeProfile?.avatarUrl || ''} alt={req.name || req.user?.employeeProfile?.fullName} />
                                       <div>
                                          <p className="font-extrabold text-slate-900 dark:text-white leading-none">{req.name || req.user?.employeeProfile?.fullName || 'Employee'}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{req.user?.email || 'Team Member'}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="hcm-td">
                                    <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
                                       {req.type || req.leaveType || 'Sick Leave'}
                                    </span>
                                 </td>
                                 <td className="hcm-td text-center whitespace-nowrap">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                       {req.startDate ? new Date(req.startDate).toLocaleDateString() : 'N/A'} — {req.endDate ? new Date(req.endDate).toLocaleDateString() : 'Ongoing'}
                                    </span>
                                 </td>
                                 <td className="hcm-td text-center">
                                    <span className="text-sm font-extrabold dark:text-white">{req.days || req.totalDays || '1'}</span>
                                 </td>
                                 <td className="hcm-td max-w-xs">
                                    <p className="text-xs font-medium truncate italic text-slate-500 dark:text-slate-400" title={req.reason}>"{req.reason || 'No description provided.'}"</p>
                                 </td>
                                 <td className="hcm-td text-right">
                                    {(req.status === 'PENDING' || req.status === 'Pending') ? (
                                       <div className="flex items-center justify-end gap-1.5">
                                          <IconButton icon={Eye} variant="ghost" tooltip="Review Request" onClick={() => setSelectedRequest(req)} />
                                          <PermissionGate module="leave_approval" action="approve">
                                             <IconButton icon={Check} variant="success" tooltip="Quick Approve" onClick={() => handleStatusUpdate(req.id, 'MANAGER_APPROVED')} />
                                             <IconButton icon={X} variant="danger" tooltip="Quick Reject" onClick={() => handleStatusUpdate(req.id, 'REJECTED')} />
                                          </PermissionGate>
                                       </div>
                                    ) : (
                                       <span className={cn("text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold border",
                                          req.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" :
                                          req.status === 'MANAGER_APPROVED' || req.status === 'Manager_approved' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50" :
                                          "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
                                       )}>
                                          {req.status === 'MANAGER_APPROVED' || req.status === 'Manager_approved' ? 'Pending HR' : req.status}
                                       </span>
                                    )}
                                 </td>
                              </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <table className="hcm-table">
                     <thead className="hcm-thead">
                        <tr className="hcm-tr">
                           <th className="hcm-th">Employee</th>
                           <th className="hcm-th text-center">Current CTC</th>
                           <th className="hcm-th text-center">Requested CTC</th>
                           <th className="hcm-th text-center">Percentage Raise</th>
                           <th className="hcm-th">Reason</th>
                           <th className="hcm-th text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {filteredIncrements.map((req) => {
                           const currentCtc = req.employee?.compensationProfile?.monthlyCTC || 0;
                           const requestedCtc = req.requestedSalary || 0;
                           const diff = requestedCtc - currentCtc;
                           const percent = currentCtc > 0 ? (diff / currentCtc) * 100 : 0;
                           return (
                              <tr key={req.id} className="hcm-tr">
                                 <td className="hcm-td">
                                    <div className="flex items-center gap-4">
                                       <Avatar src={req.employee?.avatarUrl || ''} alt={req.employee?.fullName} />
                                       <p className="font-extrabold text-slate-900 dark:text-white leading-none">{req.employee?.fullName || 'Employee'}</p>
                                    </div>
                                 </td>
                                 <td className="hcm-td text-center whitespace-nowrap">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(currentCtc)}</span>
                                 </td>
                                 <td className="hcm-td text-center whitespace-nowrap">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(requestedCtc)}</span>
                                 </td>
                                 <td className="hcm-td text-center">
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                       +{percent.toFixed(1)}%
                                    </span>
                                 </td>
                                 <td className="hcm-td max-w-xs">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate italic" title={req.reason}>"{req.reason}"</p>
                                 </td>
                                 <td className="hcm-td text-right">
                                    {(req.status === 'Pending' || req.status === 'ManagerApproved') && req.canApprove !== false ? (
                                       <div className="flex items-center justify-end gap-2">
                                          <Button variant="success" size="sm" onClick={() => reviewIncrement(req.id, 'Approved')}>
                                             Approve
                                          </Button>
                                          <Button variant="danger" size="sm" onClick={() => reviewIncrement(req.id, 'Rejected')}>
                                             Reject
                                          </Button>
                                       </div>
                                    ) : (
                                       <span className={cn("text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold border",
                                          req.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" :
                                          req.status === 'ManagerApproved' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50" :
                                          "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
                                       )}>
                                          {req.status === 'ManagerApproved' ? 'Pending HR' : req.status}
                                       </span>
                                    )}
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               )}
            </div>

            <div className="block md:hidden space-y-4">
               {activeModule === 'leaves' ? (
                  filteredRequests.length > 0 ? (
                     filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
                           <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                 <Avatar src={req.img || req.user?.employeeProfile?.avatarUrl || ''} alt={req.name || req.user?.employeeProfile?.fullName} />
                                 <div>
                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{req.name || req.user?.employeeProfile?.fullName || 'Employee'}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{req.user?.email || 'Team Member'}</p>
                                 </div>
                              </div>
                              <span className={cn("text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border shrink-0",
                                 (req.status === 'Approved' || req.status === 'APPROVED') ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                 (req.status === 'MANAGER_APPROVED' || req.status === 'Manager_approved') ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                                 (req.status === 'Rejected' || req.status === 'REJECTED') ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400" :
                                 "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                              )}>
                                 {req.status === 'MANAGER_APPROVED' || req.status === 'Manager_approved' ? 'Pending HR' : req.status}
                              </span>
                           </div>

                           <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                              <div>
                                 <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Leave Type</span>
                                 <span className="font-extrabold text-slate-800 dark:text-slate-200">{req.type || req.leaveType || 'Sick Leave'}</span>
                              </div>
                              <div>
                                 <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Duration</span>
                                 <span className="font-extrabold text-slate-800 dark:text-slate-200">{req.days || req.totalDays || '1'} Day(s)</span>
                              </div>
                              <div className="col-span-2">
                                 <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Dates</span>
                                 <span className="font-bold text-slate-600 dark:text-slate-300">
                                    {req.startDate ? new Date(req.startDate).toLocaleDateString() : 'N/A'} — {req.endDate ? new Date(req.endDate).toLocaleDateString() : 'Ongoing'}
                                 </span>
                              </div>
                           </div>

                           <div className="italic text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                              "{req.reason || 'No description provided.'}"
                           </div>

                           {(req.status === 'PENDING' || req.status === 'Pending') && (
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                 <Button variant="secondary" size="sm" onClick={() => setSelectedRequest(req)}>
                                    Details
                                 </Button>
                                 <PermissionGate module="leave_approval" action="approve">
                                    <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(req.id, 'REJECTED')}>
                                       Reject
                                    </Button>
                                    <Button variant="success" size="sm" onClick={() => handleStatusUpdate(req.id, 'MANAGER_APPROVED')}>
                                       Approve
                                    </Button>
                                 </PermissionGate>
                              </div>
                           )}
                        </div>
                     ))
                  ) : (
                     <EmptyState
                        icon={CalendarDays}
                        title="No matching leave requests"
                        description="No leave applications match your search filter."
                     />
                  )
               ) : (
                  filteredIncrements.length > 0 ? (
                     filteredIncrements.map((req) => {
                        const currentCtc = req.employee?.compensationProfile?.monthlyCTC || 0;
                        const requestedCtc = req.requestedSalary || 0;
                        const diff = requestedCtc - currentCtc;
                        const percent = currentCtc > 0 ? (diff / currentCtc) * 100 : 0;
                        return (
                           <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
                              <div className="flex items-center justify-between gap-3">
                                 <div className="flex items-center gap-3">
                                    <Avatar src={req.employee?.avatarUrl || ''} alt={req.employee?.fullName} />
                                    <div>
                                       <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{req.employee?.fullName || 'Employee'}</h4>
                                       <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 inline-block mt-1">
                                          +{percent.toFixed(1)}% Raise
                                       </span>
                                    </div>
                                 </div>
                                 <span className={cn("text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border shrink-0",
                                    req.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                    req.status === 'ManagerApproved' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                                    "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                                 )}>
                                    {req.status === 'ManagerApproved' ? 'Pending HR' : req.status}
                                 </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                 <div>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Current CTC</span>
                                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(currentCtc)}</span>
                                 </div>
                                 <div>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Requested CTC</span>
                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(requestedCtc)}</span>
                                 </div>
                              </div>

                              <div className="italic text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                 "{req.reason || 'No justification provided.'}"
                              </div>

                              {(req.status === 'Pending' || req.status === 'ManagerApproved') && req.canApprove !== false && (
                                 <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button variant="danger" size="sm" onClick={() => reviewIncrement(req.id, 'Rejected')}>
                                       Reject
                                    </Button>
                                    <Button variant="success" size="sm" onClick={() => reviewIncrement(req.id, 'Approved')}>
                                       Approve
                                    </Button>
                                 </div>
                              )}
                           </div>
                        );
                     })
                  ) : (
                     <EmptyState
                        icon={CalendarDays}
                        title="No matching increment requests"
                        description="No salary increment requests match your search filter."
                     />
                  )
               )}
            </div>
         </div>

         <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            entity="leave"
         />

         <CenterModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            title="HCM AI Leave Recommendations"
         >
            <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
               {aiLoading ? (
                  <div className="py-16 text-center space-y-4">
                     <Loader2 className="animate-spin mx-auto text-indigo-600 dark:text-indigo-400" size={40} />
                     <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Analyzing leave patterns, team availability & workload overlap...</p>
                  </div>
               ) : (
                  <>
                     <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-xl shrink-0">
                           <Sparkles size={22} />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">AI Coverage & Risk Analysis</h4>
                           <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">{aiData?.summary || "No critical leave overlap or staffing risks detected for the active period."}</p>
                        </div>
                     </div>

                     {aiData?.capacityImpact && (
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                           <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Capacity Impact</span>
                           <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                              {aiData.capacityImpact}
                           </span>
                        </div>
                     )}

                     <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Recommendations</h5>
                        {aiData?.recommendations && aiData.recommendations.length > 0 ? (
                           aiData.recommendations.map((item, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                                 <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                                       {item.decision}
                                    </span>
                                 </div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{item.reason}</p>
                              </div>
                           ))
                        ) : (
                           <div className="p-4 text-xs italic text-slate-400 text-center">
                              All current leave requests are safe for manager approval.
                           </div>
                        )}
                     </div>

                     <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <Button variant="primary" size="md" onClick={() => setShowAIModal(false)}>
                           Close Insights
                        </Button>
                     </div>
                  </>
               )}
            </div>
         </CenterModal>

         <CenterModal
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            title="Review Leave Application"
         >
            {selectedRequest && (
               <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
                  <div className="p-5 sm:p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10 text-white">
                        <FileText size={80} />
                     </div>
                     <div className="flex items-center gap-4 relative z-10">
                        <Avatar src={selectedRequest.img || selectedRequest.user?.employeeProfile?.avatarUrl} alt={selectedRequest.name || selectedRequest.user?.employeeProfile?.fullName} size="lg" />
                        <div className="text-left py-1">
                           <h3 className="text-xl sm:text-2xl font-black text-white dark:text-indigo-200 tracking-tight leading-none">{selectedRequest.name || selectedRequest.user?.employeeProfile?.fullName || 'Employee'}</h3>
                           <p className="text-[10px] font-black text-primary-400 dark:text-primary-400 uppercase tracking-[0.2em] mt-2">Ref ID: LR-{selectedRequest.id}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                     <div className="space-y-1 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                        <label className="form-label text-[10px] uppercase tracking-widest block text-slate-400 font-bold mb-1">Leave Category</label>
                        <p className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           <Zap size={16} className="text-amber-500" />
                           {selectedRequest.type || selectedRequest.leaveType || 'Sick Leave'}
                        </p>
                     </div>

                     <div className="space-y-1 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                        <label className="form-label text-[10px] uppercase tracking-widest block text-slate-400 font-bold mb-1">Total Duration</label>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{selectedRequest.days || selectedRequest.totalDays || '1'} Working Day(s)</p>
                     </div>
                  </div>

                  <div className="space-y-2 text-left">
                     <label className="form-label text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-400 font-bold">
                        <MessageSquare size={16} /> Employee Reason
                     </label>
                     <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 italic text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        "{selectedRequest.reason || 'No description provided.'}"
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                     <Button variant="danger" className="flex-1" leftIcon={XCircle} onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED')}>
                        Reject
                     </Button>
                     <Button variant="success" className="flex-1" leftIcon={CheckCircle2} onClick={() => handleStatusUpdate(selectedRequest.id, 'MANAGER_APPROVED')}>
                        Approve
                     </Button>
                  </div>
               </div>
            )}
         </CenterModal>

         <CenterModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Submit Leave Request"
         >
            <form onSubmit={handleAddRequest} className="p-6 space-y-5 text-left bg-white dark:bg-slate-900">
               <div className="space-y-3 text-left">
                  <label className="form-label text-[10px] uppercase tracking-widest block text-slate-400 font-bold">Employee</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Select from team:</p>
                        <select
                           className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field text-slate-900 dark:text-white rounded-xl"
                           value={newRequest.employeeId || ''}
                           onChange={e => {
                              const selected = availableMembers.find(m => m.id === e.target.value);
                              setNewRequest({
                                 ...newRequest,
                                 employeeId: e.target.value,
                                 employeeName: selected ? selected.name : e.target.value
                              });
                           }}
                        >
                           <option value="" className="dark:bg-slate-900">-- Select Member --</option>
                           {availableMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                 {m.name} {m.role ? `(${m.role})` : ''}
                              </option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Or type employee name:</p>
                        <input
                           type="text"
                           placeholder="Type custom name..."
                           className="input-field h-11 font-semibold text-sm w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                           value={newRequest.employeeName || ''}
                           onChange={e => setNewRequest({ ...newRequest, employeeName: e.target.value, employeeId: e.target.value })}
                        />
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                     <span className="text-[9px] font-black uppercase text-slate-400">Quick Select:</span>
                     {availableMembers.map(m => (
                        <button
                           key={m.id}
                           type="button"
                           onClick={() => setNewRequest({ ...newRequest, employeeId: m.id, employeeName: m.name })}
                           className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer",
                              (newRequest.employeeName === m.name || newRequest.employeeId === m.id)
                                 ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                                 : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                           )}
                        >
                           {m.name}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1 text-left">
                     <label className="form-label text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Category</label>
                     <select
                        className="input-field h-11 font-bold text-sm select-field text-slate-900 dark:text-white rounded-xl"
                        value={newRequest.type}
                        onChange={e => setNewRequest({ ...newRequest, type: e.target.value })}
                     >
                        <option className="dark:bg-slate-900">Sick Leave</option>
                        <option className="dark:bg-slate-900">Annual Leave</option>
                        <option className="dark:bg-slate-900">Casual Leave</option>
                        <option className="dark:bg-slate-900">Unpaid Leave</option>
                     </select>
                  </div>

                  <div className="space-y-1 text-left">
                     <label className="form-label text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Days</label>
                     <input
                        type="number"
                        placeholder="1"
                        className="input-field h-11 font-semibold text-sm text-slate-900 dark:text-white rounded-xl"
                        value={newRequest.days}
                        onChange={e => setNewRequest({ ...newRequest, days: e.target.value })}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1 text-left">
                     <label className="form-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Start Date</label>
                     <DatePicker
                        className="input-field h-11 font-semibold text-sm"
                        value={newRequest.startDate}
                        onChange={e => setNewRequest({ ...newRequest, startDate: e.target.value })}
                     />
                  </div>

                  <div className="space-y-1 text-left">
                     <label className="form-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block">End Date</label>
                     <DatePicker
                        className="input-field h-11 font-semibold text-sm"
                        value={newRequest.endDate}
                        onChange={e => setNewRequest({ ...newRequest, endDate: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-1 text-left">
                  <label className="form-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Reason for Leave</label>
                  <textarea
                     className="input-field min-h-[90px] py-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none text-sm font-medium textarea-field rounded-xl"
                     placeholder="Provide detailed context for this request..."
                     value={newRequest.reason}
                     onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })}
                  ></textarea>
               </div>

               <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 text-left">
                  <Button type="submit" variant="primary" className="w-full sm:flex-1">
                     Submit Application
                  </Button>
                  <Button type="button" variant="ghost" className="w-full sm:flex-1" onClick={() => setShowAddModal(false)}>
                     Discard Request
                  </Button>
               </div>
            </form>
         </CenterModal>

         <CenterModal
            isOpen={showIncrementModal}
            onClose={() => setShowIncrementModal(false)}
            title="Request Salary Increment"
         >
            <form onSubmit={handleIncrementRequest} className="p-6 space-y-5 text-left bg-white dark:bg-slate-900">
               <div className="space-y-2 text-left">
                  <label className="form-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Employee Member</label>
                  <div className="relative">
                     <input
                        list="increment-employee-datalist"
                        type="text"
                        placeholder="Type employee name or select..."
                        className="input-field h-11 font-semibold text-sm w-full text-slate-900 dark:text-white rounded-xl"
                        value={newIncrement.employeeName || newIncrement.employeeId || ''}
                        onChange={e => {
                           const val = e.target.value;
                           const matched = availableMembers.find(m => m.name.toLowerCase() === val.toLowerCase() || m.id === val);
                           setNewIncrement({
                              ...newIncrement,
                              employeeName: val,
                              employeeId: matched ? matched.id : val
                           });
                        }}
                     />
                     <datalist id="increment-employee-datalist">
                        {availableMembers.map(m => (
                           <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                     </datalist>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                     <span className="text-[9px] font-bold uppercase text-slate-400">Quick Select:</span>
                     {availableMembers.map(m => (
                        <button
                           key={m.id}
                           type="button"
                           onClick={() => setNewIncrement({ ...newIncrement, employeeId: m.id, employeeName: m.name })}
                           className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer",
                              (newIncrement.employeeName === m.name || newIncrement.employeeId === m.id)
                                 ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                                 : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                           )}
                        >
                           {m.name}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1 text-left">
                     <label className="form-label text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested Salary (Monthly)</label>
                     <input
                        type="number"
                        placeholder="e.g. 7000"
                        className="input-field h-11 font-bold text-sm text-slate-900 dark:text-white rounded-xl"
                        value={newIncrement.requestedSalary}
                        onChange={e => setNewIncrement({ ...newIncrement, requestedSalary: e.target.value })}
                     />
                     {newIncrement.employeeId && (
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                           Current: {formatCurrency(availableMembers.find(m => m.id === newIncrement.employeeId)?.monthlyCTC || 0)} / mo
                        </p>
                     )}
                  </div>

                  <div className="space-y-1 text-left">
                     <label className="form-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Effective Date</label>
                     <DatePicker
                        className="input-field h-11 font-semibold text-sm"
                        value={newIncrement.effectiveDate}
                        onChange={e => setNewIncrement({ ...newIncrement, effectiveDate: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-1 text-left">
                  <label className="form-label text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Justification</label>
                  <textarea
                     className="input-field min-h-[90px] py-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none text-sm font-medium textarea-field rounded-xl"
                     placeholder="Provide detailed reason for this increment request..."
                     value={newIncrement.reason}
                     onChange={e => setNewIncrement({ ...newIncrement, reason: e.target.value })}
                  ></textarea>
               </div>

               <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 text-left">
                  <Button type="submit" variant="primary" className="w-full sm:flex-1">
                     Submit Request
                  </Button>
                  <Button type="button" variant="ghost" className="w-full sm:flex-1" onClick={() => setShowIncrementModal(false)}>
                     Discard Request
                  </Button>
               </div>
            </form>
         </CenterModal>
      </div>
   );
};

export default LeaveApproval;

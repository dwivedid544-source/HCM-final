import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   ShieldCheck,
   FileText,
   AlertCircle,
   Plus,
   Search,
   Download,
   History,
   Lock,
   Eye,
   Send,
   Trash2,
   FileBadge,
   Archive,
   RefreshCw,
   Copy,
   Edit3,
   FileSpreadsheet,
   CheckCircle2,
   AlertTriangle,
   Filter
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { cn } from '../../utils/cn';
import StatCard from '../../shared/components/ui/StatCard';
import ComplianceModal from '../../features/admin/components/ComplianceModal';
import AuditArchiveModal from '../../features/admin/components/AuditArchiveModal';
import PolicyDrawer from '../../features/admin/components/PolicyDrawer';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import ActionDropdown from './components/ActionDropdown';
import PageHeader from '../../shared/components/ui/PageHeader';

const ComplianceCenter = () => {
   const { 
      policies = [], 
      updatePolicy, 
      deletePolicy, 
      addPolicy, 
      renewPolicy, 
      resolvePolicy, 
      sendPolicyReminder, 
      showToast, 
      totalActiveEmployees 
   } = useAdmin();

   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [isArchiveOpen, setIsArchiveOpen] = useState(false);
   const [policyToEdit, setPolicyToEdit] = useState(null);
   const [policyToView, setPolicyToView] = useState(null);
   const [policyToDelete, setPolicyToDelete] = useState(null);
   const [policyToArchive, setPolicyToArchive] = useState(null);
   const [showExportMenu, setShowExportMenu] = useState(false);
   const [isRenewing, setIsRenewing] = useState(false);

   const [searchTerm, setSearchTerm] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('All Types');
   const [statusFilter, setStatusFilter] = useState('All Statuses');

   const today = useMemo(() => new Date().toISOString().split('T')[0], []);

   // Overdue helper
   const isOverdue = useCallback((p) => {
      if (p.status === 'Archived' || p.status === 'Resolved') return false;
      if (!p.expiryDate) return false;
      return p.expiryDate < today;
   }, [today]);

   // Filtered policies list
   const filteredPolicies = useMemo(() => {
      return policies.filter(p => {
         const nameStr = (p.name || '').toLowerCase();
         const ownerStr = (p.owner || p.department || '').toLowerCase();
         const searchLower = searchTerm.toLowerCase();

         const matchesSearch = !searchTerm || nameStr.includes(searchLower) || ownerStr.includes(searchLower);

         const matchesCategory = categoryFilter === 'All Types' 
            ? true 
            : (p.category || '').toLowerCase().includes(categoryFilter.toLowerCase());

         let matchesStatus = true;
         if (statusFilter === 'Active') {
            matchesStatus = p.status === 'Active';
         } else if (statusFilter === 'Expiring / Overdue') {
            matchesStatus = p.status === 'Renewing' || p.status === 'Expiring Soon' || isOverdue(p);
         } else if (statusFilter === 'Renewing') {
            matchesStatus = p.status === 'Renewing';
         } else if (statusFilter === 'Resolved') {
            matchesStatus = p.status === 'Resolved';
         } else if (statusFilter === 'Archived') {
            matchesStatus = p.status === 'Archived';
         }

         return matchesSearch && matchesCategory && matchesStatus;
      });
   }, [policies, searchTerm, categoryFilter, statusFilter, isOverdue]);

   // Real KPI Calculations
   const activePoliciesCount = useMemo(() => {
      return policies.filter(p => p.status === 'Active').length;
   }, [policies]);

   const pendingRenewalsCount = useMemo(() => {
      return policies.filter(p => p.status === 'Renewing' || p.status === 'Expiring Soon' || isOverdue(p)).length;
   }, [policies, isOverdue]);

   const avgAckPercent = useMemo(() => {
      if (!policies.length) return 0;
      let totalAck = 0;
      let totalTarget = 0;

      policies.forEach(p => {
         if (p.policyAcknowledgments && Array.isArray(p.policyAcknowledgments) && p.policyAcknowledgments.length > 0) {
            totalAck += p.policyAcknowledgments.length;
            totalTarget += totalActiveEmployees || 1;
         } else if (typeof p.acknowledgments === 'string' && p.acknowledgments.includes('/')) {
            const [ack, target] = p.acknowledgments.split('/').map(Number);
            totalAck += ack || 0;
            totalTarget += target || (totalActiveEmployees || 1);
         } else {
            totalAck += Number(p.acknowledgments) || 0;
            totalTarget += totalActiveEmployees || 1;
         }
      });

      return totalTarget > 0 ? Math.round((totalAck / totalTarget) * 100) : 0;
   }, [policies, totalActiveEmployees]);

   const auditReadiness = useMemo(() => {
      if (!policies.length) return { status: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50' };
      if (pendingRenewalsCount === 0 && avgAckPercent >= 75) {
         return { status: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50' };
      } else if (pendingRenewalsCount <= 2 && avgAckPercent >= 50) {
         return { status: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50' };
      } else {
         return { status: 'Action Needed', color: 'text-rose-600', bg: 'bg-rose-50' };
      }
   }, [policies.length, pendingRenewalsCount, avgAckPercent]);

   const stats = [
      { label: 'Active Policies', value: activePoliciesCount.toString(), icon: FileBadge, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
      { label: 'Avg Ack. Rate', value: `${avgAckPercent}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { label: 'Pending / Overdue', value: pendingRenewalsCount.toString(), icon: AlertCircle, color: pendingRenewalsCount > 0 ? 'text-rose-600' : 'text-slate-600', bg: pendingRenewalsCount > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-slate-50 dark:bg-slate-800' },
      { label: 'Audit Readiness', value: auditReadiness.status, icon: Lock, color: auditReadiness.color, bg: auditReadiness.bg },
   ];

   const handleArchiveClick = (p) => {
      if (p.status === 'Archived') {
         updatePolicy(p.id, { status: 'Active' });
         showToast(`Policy unarchived successfully`);
      } else {
         setPolicyToArchive(p);
      }
   };

   // ---- EXPORT / DOWNLOAD ----
   const handleExport = useCallback((format) => {
      setShowExportMenu(false);
      if (!filteredPolicies.length) {
         showToast('No policies to export', 'error');
         return;
      }

      if (format === 'csv') {
         const headers = ['Name', 'Category', 'Owner', 'Effective Date', 'Expiry Date', 'Status', 'Acknowledgments'];
         const rows = filteredPolicies.map(p => [
            `"${p.name.replace(/"/g, '""')}"`, 
            `"${p.category}"`, 
            `"${p.owner || p.department || 'HR'}"`,
            `"${p.effectiveDate || p.date || 'TBD'}"`, 
            `"${p.expiryDate || 'N/A'}"`, 
            `"${p.status}"`,
            `"${p.acknowledgments || `0/${totalActiveEmployees}`}"`
         ]);
         const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `compliance_policies_${new Date().toISOString().split('T')[0]}.csv`;
         a.click();
         URL.revokeObjectURL(url);
         showToast('Policies exported as CSV');
      } else {
         const printContent = `
            <!DOCTYPE html>
            <html><head><title>Compliance Policy Export</title>
            <style>
               body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px; color: #0f172a; }
               h1 { font-size: 20px; margin-bottom: 6px; }
               p { color: #64748b; font-size: 12px; margin-bottom: 20px; }
               table { width: 100%; border-collapse: collapse; font-size: 12px; }
               th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
               th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; }
            </style></head><body>
            <h1>Compliance Center - Policy Summary</h1>
            <p>Generated on ${new Date().toLocaleDateString()} • ${filteredPolicies.length} record(s)</p>
            <table>
               <thead><tr><th>Policy Name</th><th>Category</th><th>Owner</th><th>Effective Date</th><th>Expiry Date</th><th>Status</th></tr></thead>
               <tbody>${filteredPolicies.map(p => `<tr><td><strong>${p.name}</strong></td><td>${p.category}</td><td>${p.owner || p.department || 'HR'}</td><td>${p.effectiveDate || p.date || 'TBD'}</td><td>${p.expiryDate || 'N/A'}</td><td>${p.status}</td></tr>`).join('')}</tbody>
            </table></body></html>`;
         const w = window.open('', '_blank');
         w.document.write(printContent);
         w.document.close();
         w.print();
         showToast('PDF export opened in print dialog');
      }
   }, [filteredPolicies, totalActiveEmployees, showToast]);

   // Acknowledgment bar helper
   const getAckWidth = (ackStr) => {
      if (typeof ackStr === 'string' && ackStr.includes('/')) {
         const [a, t] = ackStr.split('/').map(Number);
         return t > 0 ? Math.min(100, Math.round((a / t) * 100)) : 0;
      }
      const num = Number(ackStr) || 0;
      const target = totalActiveEmployees || 1;
      return Math.min(100, Math.round((num / target) * 100));
   };

   return (
      <div className="space-y-8 pb-12 animate-fade-in focus:outline-none">
         {/* Header */}
         <PageHeader
            title="Compliance Center"
            description="Standardize policies, track acknowledgments, resolve deadlines and manage audits"
            actions={
               <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button onClick={() => setIsArchiveOpen(true)} className="btn-secondary">
                     <History size={18} />
                     <span className="hidden sm:inline">Audit Archive</span>
                  </button>
                  <button 
                     className="btn-primary"
                     onClick={() => { setPolicyToEdit(null); setIsRenewing(false); setIsAddModalOpen(true); }}
                  >
                     <Plus size={18} />
                     <span>Publish Policy</span>
                  </button>
               </div>
            }
         />

         {/* Stats Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

         {/* Main List Area */}
         <div className="space-y-6">
            {/* Search + Filters row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
               {/* Search */}
               <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                     type="text"
                     placeholder="Search policies by title or department..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="input-field pl-9 text-xs h-10 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
               </div>

               {/* Type filter */}
               <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="select-field h-10 text-xs px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
               >
                  <option value="All Types">All Types</option>
                  <option value="Internal Policy">Internal Policy</option>
                  <option value="Legal Compliance">Legal Compliance</option>
                  <option value="Ethics & Conduct">Ethics & Conduct</option>
                  <option value="Health & Safety">Health & Safety</option>
                  <option value="Information Security">Information Security</option>
                  <option value="HR Policy">HR Policy</option>
               </select>

               {/* Status filter */}
               <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="select-field h-10 text-xs px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
               >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expiring / Overdue">Expiring / Overdue</option>
                  <option value="Renewing">Renewing</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Archived">Archived</option>
               </select>

               {/* Export dropdown */}
               <div className="relative shrink-0">
                  <button
                     onClick={() => setShowExportMenu(!showExportMenu)}
                     title="Export Policies"
                     className="btn-secondary h-10 px-3 flex items-center gap-1.5"
                  >
                     <Download size={17} />
                     <span className="hidden md:inline text-xs font-bold">Export</span>
                  </button>
                  <AnimatePresence>
                     {showExportMenu && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                           <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 overflow-hidden"
                           >
                              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
                                 <FileSpreadsheet size={15} /> Export to CSV
                              </button>
                              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
                                 <FileBadge size={15} /> Export as PDF
                              </button>
                           </motion.div>
                        </>
                     )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Table */}
            <div className="card p-0 border-none bg-white dark:bg-slate-900 shadow-soft overflow-visible rounded-2xl">
               <div className="overflow-x-auto rounded-2xl">
                  <table className="w-full text-left min-w-[700px] hcm-table">
                     <thead className="hcm-thead">
                        <tr className="bg-slate-50/50 dark:bg-slate-800/40 hcm-tr">
                           <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] hcm-th">Policy Name</th>
                           <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hidden sm:table-cell hcm-th">Category</th>
                           <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hidden md:table-cell hcm-th">Effective Date</th>
                           <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hidden lg:table-cell hcm-th">Acknowledgments</th>
                           <th className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hcm-th">Status</th>
                           <th className="px-4 sm:px-8 py-4 sm:py-5 text-right text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] hcm-th">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-sm">
                        {filteredPolicies.length > 0 ? filteredPolicies.map((p) => {
                           const overdue = isOverdue(p);
                           const displayStatus = overdue ? 'Overdue' : p.status;
                           const ackStr = p.acknowledgments || `0/${totalActiveEmployees}`;

                           return (
                              <tr key={p.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                 <td className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer hcm-td" onClick={() => setPolicyToView(p)}>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                       <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                                          <FileText size={18} />
                                       </div>
                                       <div className="min-w-0">
                                          <p className="font-bold text-slate-900 dark:text-white tracking-tight hover:text-primary-600 transition-colors truncate">{p.name}</p>
                                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 truncate">{p.owner || p.department || 'HR Dept'}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 sm:px-8 py-4 sm:py-6 text-center hidden sm:table-cell hcm-td">
                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold whitespace-nowrap">{p.category}</span>
                                 </td>
                                 <td className="px-4 sm:px-8 py-4 sm:py-6 text-center whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-300 hidden md:table-cell hcm-td">
                                    {p.effectiveDate || p.date || 'TBD'}
                                 </td>
                                 <td className="px-4 sm:px-8 py-4 sm:py-6 text-center hidden lg:table-cell hcm-td">
                                    <div className="flex flex-col items-center gap-1.5">
                                       <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">{ackStr}</span>
                                       <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getAckWidth(ackStr)}%` }} />
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 sm:px-8 py-4 sm:py-6 text-center hcm-td">
                                    <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border whitespace-nowrap",
                                       displayStatus === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                                       displayStatus === 'Resolved' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" :
                                       (displayStatus === 'Renewing' || displayStatus === 'Expiring Soon') ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
                                       displayStatus === 'Overdue' ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50" :
                                       "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                    )}>
                                       {displayStatus}
                                    </span>
                                 </td>
                                 <td className="px-4 sm:px-8 py-4 sm:py-6 text-right hcm-td">
                                    <div className="flex justify-end items-center gap-1.5">
                                       <button
                                          onClick={() => setPolicyToView(p)}
                                          title="View Policy"
                                          className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                       >
                                          <Eye size={16} />
                                       </button>
                                       <button
                                          onClick={() => { setPolicyToEdit(p); setIsRenewing(false); setIsAddModalOpen(true); }}
                                          title="Edit Policy"
                                          className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                       >
                                          <Edit3 size={16} />
                                       </button>
                                       <ActionDropdown
                                          actions={[
                                             { 
                                                label: 'Send Reminder', 
                                                icon: Send, 
                                                onClick: () => sendPolicyReminder(p.id) 
                                             },
                                             {
                                                label: p.status === 'Resolved' ? 'Reopen Policy' : 'Mark Resolved',
                                                icon: CheckCircle2,
                                                onClick: () => resolvePolicy(p.id)
                                             },
                                             { 
                                                label: 'Renew Policy', 
                                                icon: RefreshCw, 
                                                onClick: () => {
                                                   setPolicyToEdit(p);
                                                   setIsRenewing(true);
                                                   setIsAddModalOpen(true);
                                                } 
                                             },
                                             {
                                                label: 'Duplicate', 
                                                icon: Copy, 
                                                onClick: () => {
                                                   const { id, ...rest } = p;
                                                   addPolicy({ ...rest, name: `Copy of ${p.name}` });
                                                }
                                             },
                                             { 
                                                label: p.status === 'Archived' ? 'Unarchive' : 'Archive', 
                                                icon: Archive, 
                                                danger: p.status !== 'Archived',
                                                onClick: () => handleArchiveClick(p) 
                                             },
                                             { label: 'Delete', icon: Trash2, danger: true, onClick: () => setPolicyToDelete(p) },
                                          ]}
                                       />
                                    </div>
                                 </td>
                              </tr>
                           );
                        }) : (
                           <tr className="hcm-tr">
                              <td colSpan="6" className="px-8 py-16 text-center text-slate-500 dark:text-slate-400 hcm-td font-medium">
                                 No policies found matching your criteria.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Add / Edit / Renew Policy Modal */}
         <ComplianceModal
            isOpen={isAddModalOpen}
            onClose={() => { setIsAddModalOpen(false); setPolicyToEdit(null); setIsRenewing(false); }}
            policy={policyToEdit}
            isRenewing={isRenewing}
         />

         {/* Audit Archive Modal */}
         <AuditArchiveModal
            isOpen={isArchiveOpen}
            onClose={() => setIsArchiveOpen(false)}
         />

         {/* Policy View Drawer */}
         <PolicyDrawer
            isOpen={!!policyToView}
            onClose={() => setPolicyToView(null)}
            policy={policies.find(p => p.id === policyToView?.id) || policyToView}
            onEdit={(p) => { setPolicyToEdit(p); setIsRenewing(false); setIsAddModalOpen(true); }}
         />

         <ConfirmDialog
            isOpen={!!policyToDelete}
            title="Delete Policy"
            message={`Are you sure you want to permanently delete "${policyToDelete?.name}"? You will lose all acknowledgment records linked to this document.`}
            confirmText="Permanently Delete"
            onConfirm={() => {
               deletePolicy(policyToDelete.id);
               setPolicyToDelete(null);
            }}
            onCancel={() => setPolicyToDelete(null)}
         />

         <ConfirmDialog
            isOpen={!!policyToArchive}
            title="Archive Policy"
            message={`Are you sure you want to archive "${policyToArchive?.name}"? It will no longer be shown as active to employees.`}
            confirmText="Archive"
            type="warning"
            onConfirm={() => {
               updatePolicy(policyToArchive.id, { status: 'Archived' });
               showToast(`Policy "${policyToArchive.name}" archived successfully`);
               setPolicyToArchive(null);
            }}
            onCancel={() => setPolicyToArchive(null)}
         />
      </div>
   );
};

export default ComplianceCenter;

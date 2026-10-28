import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Search, Download, Filter, AlertTriangle, ExternalLink, 
  Database, Clock, ChevronRight, ChevronLeft, Globe, Loader2, User, UserCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../context/AdminContext';
import ExportAuditModal from '../../features/admin/components/ExportAuditModal';
import AuditFilterModal from '../../features/admin/components/AuditFilterModal';
import AuditLogDrawer from '../../features/admin/components/AuditLogDrawer';
import ActionDropdown from './components/ActionDropdown';
import EmptyState from '../../shared/components/ui/EmptyState';
import { useDateFormat } from '../../hooks/useDateFormat';
import PageHeader from '../../shared/components/ui/PageHeader';

const AuditLogs = () => {
  const { systemLogs = [], fetchAuditLogs, auditPagination = {}, showToast } = useAdmin();
  const { formatDate } = useDateFormat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ severity: 'All', module: 'All', environment: 'All' });
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [logToView, setLogToView] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated audit logs from backend
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      await fetchAuditLogs({
        page: currentPage,
        limit: 15,
        search: debouncedSearch,
        level: filters.severity !== 'All' ? filters.severity : undefined,
        module: filters.module !== 'All' ? filters.module : undefined,
        environment: filters.environment !== 'All' ? filters.environment : undefined
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filters, fetchAuditLogs]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportRow = (log) => {
      const dataStr = JSON.stringify(log, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_log_${log.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Row exported successfully', 'success');
  };

   const handleFlagIncident = (log) => {
      setLogToView({
         ...log,
         incidentStatus: 'FLAGGED',
         level: log.level === 'Critical' ? 'Critical' : 'Security'
      });
      showToast(`Opened investigation form for event ${log.action || log.id}`, 'warning');
   };

   const handleUpdateLog = (updatedLog) => {
      setLogToView(updatedLog);
   };

  const totalPages = auditPagination.totalPages || 1;
  const totalLogs = auditPagination.total || 0;

  return (
    <div className="space-y-8 pb-12 animate-fade-in focus:outline-none">
      {/* Header */}
      <PageHeader
        title="System Audit Logs"
        description="Immutable record of all platform activities, administrative changes and security events"
        actions={
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={loadLogs}
              disabled={loading}
              title="Refresh Audit Logs"
              className="btn-secondary"
            >
              <History size={15} className={cn(loading && "animate-spin text-primary-600")} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="btn-secondary"
            >
              <Download size={15} />
              <span>Export Report</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         <div className="lg:col-span-12 space-y-6 h-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full">
                     <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        type="text"
                        placeholder="Search logs by action, details, IP or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                     />
                  </div>
                  <button onClick={() => setIsFilterOpen(true)} className={cn("p-2.5 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all h-10 w-10 flex items-center justify-center shadow-sm relative shrink-0", Object.values(filters).some(f => f !== 'All') ? "text-indigo-600 bg-indigo-50 border-indigo-200" : "text-slate-400 bg-slate-50 dark:bg-slate-800/30")}>
                     <Filter size={16} />
                     {Object.values(filters).some(f => f !== 'All') && <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full" />}
                  </button>
                </div>

               <div className="p-0 overflow-x-auto min-h-[450px]">
                  {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-400 h-[450px]">
                      <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
                      <p className="text-xs font-bold uppercase tracking-widest">Querying system audit log database...</p>
                    </div>
                  ) : systemLogs.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                        <History size={36} strokeWidth={1.5} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No Audit Logs Found</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">No administrative activities or audit events matched your search filter criteria.</p>
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    <table className="w-full text-left min-w-[900px]">
                      <thead>
                         <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-5 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">TIMESTAMP / LEVEL</th>
                            <th className="px-5 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">USER CONTEXT</th>
                            <th className="px-5 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center">MODULE</th>
                            <th className="px-5 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center">ACTION EVENT</th>
                            <th className="px-5 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center">ENVIRONMENT / IP</th>
                            <th className="px-5 sm:px-8 py-4 sm:py-5 text-right text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">ACTION</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {systemLogs.map((log) => {
                          const dateObj = new Date(log.createdAt);
                          const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          const timestamp = `${dateStr}, ${timeStr}`;
                          
                          const userEmail = log.user?.email || 'System';
                          const initial = userEmail[0].toUpperCase();

                          return (
                           <tr key={log.id} onClick={() => setLogToView(log)} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 cursor-pointer transition-colors group">
                              <td className="px-5 sm:px-8 py-5 align-top">
                                 <div className="flex flex-col gap-2">
                                    <span className={cn(
                                       "px-2.5 py-1 w-max rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                       log.level === 'Security' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/40" :
                                       log.level === 'Critical' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40" :
                                       log.level === 'Warning' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40" :
                                       "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60"
                                    )}>
                                       {log.level}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                       <Clock size={12} className="shrink-0" />
                                       <span className="text-[10px] font-bold">{timestamp}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-5 sm:px-8 py-5 align-top">
                                 <div className="flex items-center gap-3">
                                    {log.user?.employeeProfile?.avatarUrl ? (
                                      <img src={log.user.employeeProfile.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-[11px] font-black shrink-0 border border-slate-800 dark:border-slate-700">
                                         {initial}
                                      </div>
                                    )}
                                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                       {userEmail}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-5 sm:px-8 py-5 text-center align-top">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.module}</span>
                              </td>
                              <td className="px-5 sm:px-8 py-5 text-center align-top max-w-[200px]">
                                 <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{log.action}</p>
                                 {log.details && <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">{log.details}</p>}
                              </td>
                              <td className="px-5 sm:px-8 py-5 text-center align-top">
                                 <div className="flex justify-center items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <UserCircle size={14} className="text-slate-400" />
                                    <span>{log.ipAddress || '::1'}</span>
                                 </div>
                              </td>
                              <td className="px-5 sm:px-8 py-5 text-right align-top" onClick={(e) => e.stopPropagation()}>
                                 <div className="flex justify-end">
                                   <ActionDropdown 
                                      actions={[
                                         { label: 'View Details', icon: ExternalLink, onClick: () => setLogToView(log) },
                                         { label: 'Copy Log ID', icon: Database, onClick: () => navigator.clipboard.writeText(`LOG-${log.id}`) },
                                         { label: 'Export Row', icon: Download, onClick: () => handleExportRow(log) },
                                         { label: 'Flag Incident', icon: AlertTriangle, onClick: () => handleFlagIncident(log), className: "text-rose-600 hover:text-rose-700 hover:bg-rose-50" },
                                      ]}
                                   />
                                 </div>
                              </td>
                           </tr>
                          );
                        })}
                     </tbody>
                  </table>
                  )}
               </div>

               {/* Pagination Controls */}
               <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Showing page {currentPage} of {totalPages} ({totalLogs} total logs)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                       disabled={currentPage === 1 || loading}
                       className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-black px-2 text-slate-900 dark:text-slate-100">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                       disabled={currentPage >= totalPages || loading}
                       className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <ExportAuditModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <AuditLogDrawer 
        isOpen={!!logToView} 
        onClose={() => setLogToView(null)} 
        log={logToView} 
        onUpdateLog={handleUpdateLog}
      />
    </div>
  );
};

export default AuditLogs;

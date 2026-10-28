import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
   Users,
   UserCheck,
   Briefcase,
   DollarSign,
   AlertTriangle,
   Plus,
   Download,
   TrendingUp,
   BarChart3,
   Activity,
   Bell,
   ShieldCheck,
   Target,
   ArrowUpRight,
   Loader2,
   RefreshCw,
   Send,
   Layers,
   FileText,
   Calendar,
   CheckCircle2,
   Clock,
   AlertCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { usePermissionContext } from '../../context/PermissionContext';
import { useCurrency } from '../../hooks/useCurrency';
import PermissionGate from '../../shared/components/common/PermissionGate';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';
import { cn } from '../../utils/cn';
import UserModal from '../../features/admin/components/UserModal';
import { adminAPI } from '../../utils/apiService';
import OrgSetupWizard from './OrgSetupWizard';

const formatRelativeTime = (dateInput) => {
   if (!dateInput) return 'Just now';
   const date = new Date(dateInput);
   if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : 'Recently';

   const now = new Date();
   const diffMs = now - date;
   const diffSec = Math.floor(diffMs / 1000);
   const diffMin = Math.floor(diffSec / 60);
   const diffHours = Math.floor(diffMin / 60);
   const diffDays = Math.floor(diffHours / 24);

   if (diffSec < 60) return 'Just now';
   if (diffMin < 60) return `${diffMin}m ago`;
   if (diffHours < 24) return `${diffHours}h ago`;
   if (diffDays === 1) return 'Yesterday';
   if (diffDays < 7) return `${diffDays}d ago`;
   return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getUserName = (user) => {
   if (!user) return 'System';
   if (typeof user === 'string') return user;
   if (typeof user === 'object') {
      return user.employeeProfile?.fullName || user.name || user.email || 'System';
   }
   return String(user);
};

const AdminDashboard = () => {
   const { users, departments, roles, payrollList, runPayroll, systemLogs, addSystemLog, showToast, fetchUsers, fetchDepartments, fetchAuditLogs } = useAdmin();
   const { hasModuleAccess, hasPermission } = usePermissionContext();
   const { getSymbol, getIcon, formatCurrency } = useCurrency();
   const CurrencyIcon = getIcon();
   const navigate = useNavigate();

   const [isAddUserOpen, setIsAddUserOpen] = useState(false);
   const [inviteMode, setInviteMode] = useState(false);
   const [activeAction, setActiveAction] = useState(null);
   const [growthTimeframe, setGrowthTimeframe] = useState('6months'); // '6months' | '12months' | 'year2026'
   const [dashboardStats, setDashboardStats] = useState(null);
   const [orgData, setOrgData] = useState(null);
   const [isLoadingStats, setIsLoadingStats] = useState(true);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [fetchError, setFetchError] = useState(null);

   const loadDashboardData = useCallback(async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setIsLoadingStats(true);
      setFetchError(null);

      try {
         const promises = [
            adminAPI.getStats(),
            adminAPI.getOrganization().catch(() => ({ data: { success: true, data: null } }))
         ];

         // When manually triggered by user, also synchronize backing datasets in parallel
         if (isManual) {
            if (typeof fetchUsers === 'function') promises.push(fetchUsers().catch(() => {}));
            if (typeof fetchDepartments === 'function') promises.push(fetchDepartments().catch(() => {}));
            if (typeof fetchAuditLogs === 'function') promises.push(fetchAuditLogs().catch(() => {}));
         }

         const [statsRes, orgRes] = await Promise.all(promises);

         if (statsRes.data?.success && statsRes.data.data) {
            setDashboardStats(statsRes.data.data);
         } else if (statsRes.data) {
            setDashboardStats(statsRes.data);
         }

         if (orgRes.data?.success) {
            setOrgData(orgRes.data.data);
         }

         if (isManual) {
            showToast('Dashboard refreshed successfully', 'success');
         }
      } catch (err) {
         console.error('Failed to fetch dashboard stats:', err);
         setFetchError('Unable to load live dashboard statistics. Please check your connection.');
         showToast('Failed to load dashboard metrics from server', 'error');
      } finally {
         setIsLoadingStats(false);
         setIsRefreshing(false);
      }
   }, [fetchUsers, fetchDepartments, fetchAuditLogs, showToast]);

   useEffect(() => {
      loadDashboardData();
   }, [loadDashboardData]);

   // Compute Target Payroll dynamically with fallback to user list CTC
   const calculatedTargetPayroll = useMemo(() => {
      if (dashboardStats?.targetPayroll !== undefined && dashboardStats.targetPayroll !== null) {
         return Number(dashboardStats.targetPayroll);
      }
      if (Array.isArray(payrollList) && payrollList.length > 0) {
         const payrollSum = payrollList.reduce((sum, p) => sum + (Number(p.grossSalary || p.net || p.basic) || 0), 0);
         if (payrollSum > 0) return payrollSum;
      }
      return (users || []).reduce((sum, u) => {
         const isExcluded = (u.role || '').toLowerCase().includes('candidate') || u.status === 'Terminated' || u.status === 'Resigned';
         if (isExcluded) return sum;
         const amount = Number(u.monthlyCTC) || Number(u.baseSalary) || Number(u.salary) || 0;
         return sum + amount;
      }, 0);
   }, [dashboardStats, payrollList, users]);

   // Growth chart calculation based on server growthTrend or real user join dates
   const growthData = useMemo(() => {
      if (dashboardStats?.growthTrend?.[growthTimeframe] && Array.isArray(dashboardStats.growthTrend[growthTimeframe])) {
         return dashboardStats.growthTrend[growthTimeframe];
      }

      const now = new Date();
      const months = [];
      let numMonths = 6;
      let startYear = now.getFullYear();

      if (growthTimeframe === '12months') {
         numMonths = 12;
      } else if (growthTimeframe === 'year2026') {
         numMonths = 12;
         startYear = 2026;
      }

      for (let i = numMonths - 1; i >= 0; i--) {
         const d = growthTimeframe === 'year2026'
            ? new Date(2026, 11 - i, 1)
            : new Date(now.getFullYear(), now.getMonth() - i, 1);

         const label = d.toLocaleString('en-US', { month: 'short' });
         const year = d.getFullYear();
         const monthIndex = d.getMonth();
         const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59);

         // Active count at this point in time
         const count = (users || []).filter(u => {
            const isCandidate = (u.role || '').toLowerCase().includes('candidate');
            if (isCandidate) return false;
            const rawDate = u.joinDate || u.joiningDate || u.createdAt;
            if (!rawDate) return true;
            const jDate = new Date(rawDate);
            return !isNaN(jDate.getTime()) ? jDate <= endOfMonth : true;
         }).length;

         months.push({ label, year, count });
      }

      const maxCount = Math.max(...months.map(m => m.count), 1);
      return months.map(m => ({
         ...m,
         pct: Math.max(12, Math.round((m.count / maxCount) * 100))
      }));
   }, [dashboardStats, users, growthTimeframe]);

   // Derived live stats
   const nonCandidateUsers = useMemo(() => {
      return (users || []).filter(u => !(u.role || '').toLowerCase().includes('candidate'));
   }, [users]);

   const totalEmps = dashboardStats?.totalEmployees ?? nonCandidateUsers.length;
   const activeEmps = dashboardStats?.activeEmployees ?? nonCandidateUsers.filter(u => u.status === 'Active').length;
   const totalDepts = dashboardStats?.totalDepartments ?? departments.length;
   const customRolesCount = dashboardStats?.customRoles ?? roles.filter(r => r.isCustom).length;
   const complianceAlertsCount = dashboardStats?.complianceAlerts ?? 0;

   const stats = [
      { 
         label: 'Total Employees', 
         value: totalEmps, 
         icon: Users, 
         trend: `${activeEmps} active in company`, 
         color: 'text-indigo-600 dark:text-indigo-400', 
         bg: 'bg-indigo-50 dark:bg-indigo-950/30',
         onClick: () => navigate('/admin/users')
      },
      { 
         label: 'Active Users', 
         value: activeEmps, 
         icon: UserCheck, 
         trend: totalEmps > 0 ? `${Math.round((activeEmps / totalEmps) * 100)}% active rate` : '100% active rate', 
         color: 'text-emerald-600 dark:text-emerald-400', 
         bg: 'bg-emerald-50 dark:bg-emerald-950/30',
         onClick: () => navigate('/admin/users')
      },
      { 
         label: 'Departments', 
         value: totalDepts, 
         icon: Briefcase, 
         trend: `${totalDepts} operational unit${totalDepts === 1 ? '' : 's'}`, 
         color: 'text-primary-600 dark:text-primary-400', 
         bg: 'bg-primary-50 dark:bg-primary-950/30',
         onClick: () => navigate('/admin/departments')
      },
      { 
         label: 'Custom Roles', 
         value: customRolesCount, 
         icon: ShieldCheck, 
         trend: `${roles.length} total access roles`, 
         color: 'text-amber-600 dark:text-amber-400', 
         bg: 'bg-amber-50 dark:bg-amber-950/30',
         onClick: () => navigate('/admin/roles')
      },
      { 
         label: 'Target Payroll', 
         value: formatCurrency(calculatedTargetPayroll), 
         icon: CurrencyIcon, 
         trend: `${totalEmps} employee compensation`, 
         color: 'text-violet-600 dark:text-violet-400', 
         bg: 'bg-violet-50 dark:bg-violet-950/30',
         onClick: () => navigate('/admin/payroll')
      },
      { 
         label: 'Compliance Alerts', 
         value: complianceAlertsCount, 
         icon: AlertTriangle, 
         trend: complianceAlertsCount > 0 ? `${complianceAlertsCount} policy review${complianceAlertsCount === 1 ? '' : 's'} pending` : 'All policies compliant', 
         color: complianceAlertsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400', 
         bg: complianceAlertsCount > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
         onClick: () => navigate('/admin/compliance')
      },
   ];

   const downloadCsv = (filename, headers, rows) => {
      const csv = [headers, ...rows]
         .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
         .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
   };

   const handleExportAudit = async () => {
      let logSource = [];
      try {
         const res = await adminAPI.getAuditLogs({ limit: 100 });
         if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
            logSource = res.data.data;
         }
      } catch (err) {
         console.warn('Direct audit API fetch failed, falling back to cached logs:', err);
      }

      if (logSource.length === 0) {
         logSource = (systemLogs && systemLogs.length > 0)
            ? systemLogs
            : (dashboardStats?.recentActivities || []);
      }

      if (logSource.length === 0) {
         showToast('No audit logs available to export', 'error');
         return;
      }

      const rows = logSource.map(log => [
         log.time || log.createdAt || '',
         getUserName(log.user),
         typeof log.action === 'object' ? JSON.stringify(log.action) : (log.action || log.text || ''),
         log.module || '',
         log.level || 'Info',
         typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || log.ip || log.ipAddress || ''),
      ]);

      downloadCsv(
         `audit_export_${new Date().toISOString().split('T')[0]}.csv`,
         ['Timestamp', 'User', 'Action', 'Module', 'Level', 'Details'],
         rows
      );
      showToast(`Exported ${logSource.length} audit log${logSource.length === 1 ? '' : 's'} successfully`, 'success');
   };

   const handleRunPayroll = async () => {
      setActiveAction('payroll');
      try {
         if (runPayroll) {
            await runPayroll();
         }
         if (addSystemLog) {
            addSystemLog({
               user: 'Admin',
               action: 'Quick Action: Process Payroll Batch',
               module: 'Payroll',
               ip: 'Local',
               device: 'Admin Dashboard',
               level: 'Info',
            });
         }
         navigate('/admin/payroll');
      } catch (err) {
         console.error('Run payroll failed:', err);
         navigate('/admin/payroll');
      } finally {
         setActiveAction(null);
      }
   };

   const handleOpenAddUser = (isInvite = false) => {
      setInviteMode(isInvite);
      setIsAddUserOpen(true);
   };

   const quickActions = [
      hasModuleAccess('payroll') ? { id: 'payroll', label: 'Run Payroll', icon: CurrencyIcon, onClick: handleRunPayroll } : null,
      hasPermission('users', 'create') ? { id: 'add_user', label: 'Add User', icon: Plus, onClick: () => handleOpenAddUser(false) } : null,
      hasPermission('users', 'create') ? { id: 'invite', label: 'Send Invite', icon: Send, onClick: () => handleOpenAddUser(true) } : null,
      (hasModuleAccess('audit_logs') || hasModuleAccess('audit')) ? { id: 'audit', label: 'Export Audit', icon: ShieldCheck, onClick: handleExportAudit } : null,
      hasModuleAccess('compliance') ? { id: 'compliance', label: 'Compliance', icon: CheckCircle2, onClick: () => navigate('/admin/compliance') } : null,
      { id: 'org_setup', label: 'Org Setup', icon: Briefcase, onClick: () => navigate('/admin/org') }
   ].filter(Boolean);

   const orgScore = dashboardStats?.organizationScore !== undefined ? dashboardStats.organizationScore : 100;

   // Show wizard if this is the first login after provisioning
   if (orgData && !orgData.setupComplete) {
      return <OrgSetupWizard />;
   }

   return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in focus:outline-none min-w-0">
         {/* Top Header */}
         <PageHeader
            title="Admin Dashboard"
            description="Master control for organization, workforce and system performance"
            actions={
               <>
                  <button
                     type="button"
                     onClick={() => loadDashboardData(true)}
                     disabled={isRefreshing}
                     className="btn-secondary"
                     title="Refresh Dashboard Data"
                  >
                     <RefreshCw size={16} className={cn(isRefreshing && "animate-spin text-primary-600")} />
                     <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>

                  {(hasPermission('audit_logs', 'view') || hasPermission('audit', 'view')) && (
                     <button 
                        type="button"
                        onClick={handleExportAudit}
                        className="btn-secondary"
                        title="Export Audit CSV"
                     >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export</span>
                     </button>
                  )}

                  <PermissionGate module="users" action="create">
                     <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleOpenAddUser(false)}
                     >
                        <Plus size={16} />
                        <span>Add User</span>
                     </button>
                  </PermissionGate>
               </>
            }
         />

         {/* Error Banner with Retry */}
         {fetchError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-4 text-rose-800 dark:text-rose-200 text-sm">
               <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{fetchError}</span>
               </div>
               <button
                  type="button"
                  onClick={() => loadDashboardData(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shrink-0"
               >
                  Retry
               </button>
            </div>
         )}

         {/* KPI Summary Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            {stats.map((stat, idx) => (
               <StatCard
                  key={idx}
                  icon={stat.icon}
                  label={stat.label}
                  value={isLoadingStats ? '...' : stat.value}
                  sub={stat.trend}
                  color={stat.color}
                  bg={stat.bg}
                  onClick={stat.onClick}
                  isLoading={isLoadingStats}
               />
            ))}
         </div>

         {/* Main Dashboard Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
            {/* Left 8 Cols: Growth Chart & Dual Breakdown Cards */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0">
               {/* Employee Growth Trend Chart Card */}
               <div className="card flex flex-col min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
                     <div>
                        <h3 className="hcm-section-heading flex items-center gap-2">
                           <TrendingUp className="text-primary-600 dark:text-primary-400" size={22} />
                           Employee Growth Trend
                        </h3>
                        <p className="hcm-page-subtitle">Historical headcount analytics & joining trend</p>
                     </div>
                     <select 
                        value={growthTimeframe}
                        onChange={(e) => setGrowthTimeframe(e.target.value)}
                        className="select-sm w-full sm:w-auto"
                     >
                        <option value="6months">Last 6 Months</option>
                        <option value="12months">Last 12 Months</option>
                        <option value="year2026">Year 2026</option>
                     </select>
                  </div>

                  {isLoadingStats ? (
                     <div className="h-52 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                     </div>
                  ) : (
                     <div className="w-full overflow-x-auto pb-2">
                        <div className="min-w-[320px] h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 mb-2">
                           {growthData.map((m, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                                 {/* Tooltip */}
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20">
                                    {m.count} {m.count === 1 ? 'Employee' : 'Employees'} ({m.label} {m.year})
                                 </div>
                                 <div className="w-full relative flex items-end justify-center h-36">
                                    <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/80 rounded-2xl h-full relative overflow-hidden">
                                       <motion.div 
                                          className="w-full bg-gradient-to-t from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-400 rounded-2xl flex items-center justify-center absolute bottom-0 shadow-sm"
                                          initial={{ height: 0 }}
                                          animate={{ height: `${m.pct}%` }}
                                          transition={{ duration: 0.5, delay: i * 0.04 }}
                                       >
                                          <span className="text-[10px] font-extrabold text-white">{m.count}</span>
                                       </motion.div>
                                    </div>
                                 </div>
                                 <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-none truncate max-w-full">
                                    {m.label}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* Dual Cards: Attendance Summary & Recent Activities */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 min-w-0">
                  {/* Attendance Summary */}
                  <div 
                     className="card cursor-pointer group hover:border-slate-300 dark:hover:border-slate-700 transition-all min-w-0"
                     onClick={() => navigate('/admin/attendance')}
                     title="Click to view Attendance Center"
                  >
                     <div className="flex items-center justify-between mb-5">
                        <h3 className="hcm-section-heading flex items-center gap-2">
                           <Target className="text-emerald-500" size={20} />
                           Attendance Today
                        </h3>
                        <ArrowUpRight size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                     </div>

                     <div className="space-y-5">
                        {[
                           { 
                              label: 'Present Today', 
                              val: dashboardStats?.attendanceSummary?.present || '0%', 
                              count: dashboardStats?.attendanceSummary?.presentCount ?? 0,
                              color: 'bg-emerald-500 dark:bg-emerald-400' 
                           },
                           { 
                              label: 'Approved Leave', 
                              val: dashboardStats?.attendanceSummary?.onLeave || '0%', 
                              count: dashboardStats?.attendanceSummary?.onLeaveCount ?? 0,
                              color: 'bg-indigo-500 dark:bg-indigo-400' 
                           },
                           { 
                              label: 'Late / Absent', 
                              val: dashboardStats?.attendanceSummary?.lateAbsent || '0%', 
                              count: dashboardStats?.attendanceSummary?.lateAbsentCount ?? 0,
                              color: 'bg-rose-500 dark:bg-rose-400' 
                           },
                        ].map((item, i) => (
                           <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                                 <span>{item.label}</span>
                                 <span className="text-slate-900 dark:text-white font-bold">
                                    {item.val} ({item.count})
                                 </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <div 
                                    className={cn("h-full rounded-full transition-all duration-500", item.color)} 
                                    style={{ width: item.val }} 
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Recent Activities */}
                  <div className="card min-w-0 flex flex-col justify-between">
                     <div>
                        <div className="flex items-center justify-between mb-5">
                           <h3 className="hcm-section-heading flex items-center gap-2">
                              <Activity className="text-amber-500" size={20} />
                              Recent Activities
                           </h3>
                           <button 
                              type="button" 
                              onClick={() => navigate('/admin/audit')}
                              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                           >
                              View All
                           </button>
                        </div>

                        <div className="space-y-4">
                           {((dashboardStats?.recentActivities && dashboardStats.recentActivities.length > 0)
                              ? dashboardStats.recentActivities.slice(0, 4)
                              : (systemLogs || []).slice(0, 4).map(l => ({ 
                                 text: typeof l.action === 'string' ? l.action : (typeof l.details === 'string' ? l.details : (l.details?.message || 'Activity recorded')), 
                                 time: l.time || l.createdAt, 
                                 user: getUserName(l.user) 
                              }))
                           ).map((activity, i) => {
                              const activityUser = getUserName(activity.user);
                              const activityText = typeof (activity.text || activity.action) === 'object'
                                 ? (activity.text?.message || activity.action?.message || 'Activity recorded')
                                 : (activity.text || activity.action || 'Activity recorded');

                              return (
                                 <div key={i} className="flex items-start gap-3 text-left">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                       <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                          {activityText}
                                       </p>
                                       <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                          <span>{activityUser}</span>
                                          <span>•</span>
                                          <span>{formatRelativeTime(activity.time)}</span>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}

                           {(!dashboardStats?.recentActivities || dashboardStats.recentActivities.length === 0) && (!systemLogs || systemLogs.length === 0) && (
                              <p className="text-xs text-slate-400 font-medium py-6 text-center">
                                 No recent activities recorded yet
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right 4 Cols: Quick Actions & Organization Health Score */}
            <div className="lg:col-span-4 space-y-6 sm:space-y-8 min-w-0">
               {/* Quick Actions Panel */}
               <div className="card bg-slate-900 text-white border-none relative overflow-hidden group shadow-lg min-w-0">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                     <Bell size={100} />
                  </div>
                  <h3 className="text-xs font-bold text-primary-300 uppercase tracking-wider mb-5">Quick Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                     {quickActions.map((act) => (
                        <button
                           key={act.id}
                           type="button"
                           onClick={act.onClick}
                           disabled={activeAction === act.id}
                           className="p-3.5 sm:p-4 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] text-slate-300 hover:text-white cursor-pointer"
                        >
                           {activeAction === act.id ? (
                              <Loader2 size={22} className="animate-spin text-primary-400" />
                           ) : (
                              <act.icon size={22} className="text-primary-400 group-hover:text-white transition-colors" />
                           )}
                           <span className="text-[11px] font-bold text-center leading-tight">{act.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Dynamic Organization Health Score Card */}
               <div className="card min-w-0">
                  <h3 className="hcm-section-heading mb-6 flex items-center gap-2">
                     <BarChart3 className="text-primary-600 dark:text-primary-400" size={22} />
                     Organization Health Score
                  </h3>
                  
                  <div className="text-center py-4">
                     <div className="relative inline-flex mb-5">
                        <svg className="w-32 h-32 transform -rotate-90">
                           <circle 
                              cx="64" 
                              cy="64" 
                              r="56" 
                              className="stroke-slate-100 dark:stroke-slate-800 fill-none" 
                              strokeWidth="9" 
                           />
                           <motion.circle 
                              cx="64" 
                              cy="64" 
                              r="56" 
                              className={cn(
                                 "fill-none transition-colors",
                                 orgScore >= 80 ? "stroke-emerald-500" : orgScore >= 60 ? "stroke-primary-500" : "stroke-amber-500"
                              )}
                              strokeWidth="9" 
                              strokeDasharray={352}
                              strokeDashoffset={352 - (352 * (orgScore / 100))}
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: 352 }}
                              animate={{ strokeDashoffset: 352 - (352 * (orgScore / 100)) }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                              {isLoadingStats ? '...' : orgScore}
                           </span>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                              {orgScore >= 90 ? 'Excellent' : orgScore >= 75 ? 'Good' : orgScore >= 60 ? 'Fair' : 'Needs Attention'}
                           </span>
                        </div>
                     </div>
                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 leading-relaxed">
                        Calculated dynamically from policy compliance health, open support tickets, approved leaves, and payroll reconciliation.
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* Add/Invite User Modal */}
         <UserModal 
            isOpen={isAddUserOpen} 
            onClose={() => setIsAddUserOpen(false)} 
         />
      </div>
   );
};

export default AdminDashboard;

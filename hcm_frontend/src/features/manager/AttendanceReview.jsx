import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   CheckCircle2,
   Clock,
   MapPin,
   Monitor,
   Search,
   Download,
   Plus,
   ChevronRight,
   CalendarDays,
   Timer,
   Loader2,
   Upload,
   Sparkles,
   AlertCircle,
   RotateCcw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import PermissionGate from '../../shared/components/common/PermissionGate';
import ImportModal from '../../shared/components/import/ImportModal';
import DatePicker from '../../shared/components/common/DatePicker';
import StatCard from '../../shared/components/ui/StatCard';
import EmptyState from '../../shared/components/ui/EmptyState';
import PageHeader from '../../shared/components/ui/PageHeader';
import api from '../../utils/apiService';

const AttendanceReview = () => {
   const { attendance, leaveRequests = [], teamMembers, addAttendanceEntry, showToast } = useManager();

   // UI States
   const [selectedEntry, setSelectedEntry] = useState(null);
   const [showManualModal, setShowManualModal] = useState(false);
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   const [isExporting, setIsExporting] = useState(false);

   // AI Modal State
   const [showAIModal, setShowAIModal] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);
   const [aiData, setAiData] = useState(null);

   // Filter States
   const [searchQuery, setSearchQuery] = useState('');
   const [dateFilter, setDateFilter] = useState('');
   const [statusFilter, setStatusFilter] = useState('');

   // Form State
   const [newEntry, setNewEntry] = useState({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'Present', mode: 'Office' });

   // Stats calculation
   const stats = useMemo(() => {
      const todayLocal = new Date().toLocaleDateString('en-CA');
      const todayUTC = new Date().toISOString().split('T')[0];

      let activeSet = attendance;
      if (dateFilter) {
         activeSet = attendance.filter(r =>
            r.rawDate === dateFilter ||
            r.date === dateFilter ||
            (r.rawDate && r.rawDate.startsWith(dateFilter))
         );
      } else {
         const todayRecords = attendance.filter(r =>
            r.rawDate === todayLocal ||
            r.rawDate === todayUTC ||
            r.date === todayLocal ||
            r.date === todayUTC
         );
         if (todayRecords.length > 0) {
            activeSet = todayRecords;
         }
      }

      const present = activeSet.filter(r => r.status === 'Present').length;
      const late = activeSet.filter(r => (r.status || '').toLowerCase() === 'late').length;
      const leave = activeSet.filter(r => (r.status || '').toLowerCase().includes('leave')).length;

      const totalMins = activeSet.reduce((acc, r) => acc + (r.totalWorkedMin || 0), 0);
      const avgMins = activeSet.length ? Math.floor(totalMins / activeSet.length) : 0;
      const avgHoursStr = activeSet.length && avgMins > 0 ? `${Math.floor(avgMins / 60)}h ${avgMins % 60}m` : '0h 0m';

      return [
         { label: dateFilter ? 'Present' : 'Present Today', value: dateFilter ? `${present}` : `${present}/${teamMembers.length || activeSet.length || 0}`, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
         { label: 'Late Arrivals', value: late.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
         { label: 'On Leave', value: leave.toString(), icon: CalendarDays, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
         { label: 'Avg Hours', value: avgHoursStr, icon: Timer, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
      ];
   }, [attendance, teamMembers, dateFilter]);

   // Filtering Logic
   const filteredRecords = useMemo(() => {
      return attendance.filter(r => {
         const matchesSearch = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
         const matchesStatus = statusFilter ? r.status === statusFilter : true;
         const matchesDate = dateFilter ? (r.rawDate === dateFilter || r.date === dateFilter) : true;
         return matchesSearch && matchesStatus && matchesDate;
      });
   }, [attendance, searchQuery, statusFilter, dateFilter]);

   const resetFilters = () => {
      setSearchQuery('');
      setDateFilter('');
      setStatusFilter('');
   };

   const handleManualEntry = async (e) => {
      e.preventDefault();
      const emp = teamMembers.find(m => m.id === newEntry.employeeId);
      if ((!emp && !newEntry.employeeId) || !newEntry.date || !newEntry.checkIn) {
         showToast('Please select an employee and provide time details.', 'error');
         return;
      }
      await addAttendanceEntry(newEntry);
      setShowManualModal(false);
      setNewEntry({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'Present', mode: 'Office' });
   };

   const handleExport = () => {
      setIsExporting(true);
      showToast('Exporting attendance history...', 'info');
      setTimeout(() => {
         try {
            const headers = ['Employee Name', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Work Mode', 'Status'];
            const rows = filteredRecords.map(r => [
               `"${r.name || ''}"`,
               `"${r.date || ''}"`,
               `"${r.checkIn || ''}"`,
               `"${r.checkOut || '-'}"`,
               `"${r.hours || '8.5h'}"`,
               `"${r.mode || 'Office'}"`,
               `"${r.status || ''}"`
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Attendance history exported successfully!', 'success');
         } catch (err) {
            showToast('Error exporting attendance data', 'error');
         } finally {
            setIsExporting(false);
         }
      }, 800);
   };

   const getDynamicFallbackInsights = () => {
      const totalLogs = attendance.length || 1;
      const lateCount = attendance.filter(r => (r.status || '').toLowerCase() === 'late').length;
      const presentCount = attendance.filter(r => (r.status || '').toLowerCase() === 'present').length || Math.max(0, totalLogs - lateCount);
      const punctualityPct = Math.round((presentCount / totalLogs) * 100);

      const totalLeaves = leaveRequests.length;
      const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;
      const approvedLeaves = leaveRequests.filter(l => l.status === 'Approved').length;
      const capacityPct = Math.max(65, Math.min(100, Math.round(100 - (approvedLeaves * 4))));

      const burnoutRisk = (lateCount > 3 || pendingLeaves > 3) ? "Moderate" : lateCount > 5 ? "High" : "Low";

      return {
         attendanceSummary: `Team attendance is tracking at ${punctualityPct}% punctuality rate across ${totalLogs} logged record(s), with ${presentCount} present and ${lateCount} late arrival(s).`,
         leaveSummary: `Recorded ${totalLeaves} team leave request(s) (${approvedLeaves} approved, ${pendingLeaves} pending review). Operational workforce capacity remains stable.`,
         summary: `Overall team operations are stable with ${punctualityPct}% check-in timeliness and ${capacityPct}% capacity maintained.`,
         capacityImpact: `${capacityPct}% capacity maintained`,
         burnoutRisk: burnoutRisk,
         recommendations: [
            {
               title: "Punctuality & Shift Balancing",
               decision: lateCount > 2 ? "Schedule Review Needed" : "Optimal Alignment",
               reason: lateCount > 2 ? `${lateCount} late arrivals recorded. Consider offering a 15-minute flexible check-in window.` : "Check-in patterns show consistent team timeliness and schedule adherence."
            },
            {
               title: "Leave Approval & Coverage",
               decision: pendingLeaves > 0 ? "Action Required" : "Coverage Balanced",
               reason: pendingLeaves > 0 ? `${pendingLeaves} leave request(s) awaiting manager review. Timely processing ensures team coverage.` : "All current leave requests are cleared and team coverage is sufficient."
            }
         ]
      };
   };

   const handleFetchAIInsights = async () => {
      setShowAIModal(true);
      setAiLoading(true);
      try {
         const res = await api.aiAttendanceInsights();
         const payload = res?.data?.data || res?.data;
         if (payload && (payload.attendanceSummary || payload.leaveSummary || payload.summary || payload.recommendations)) {
            setAiData(payload);
            showToast('AI Attendance Insights generated!', 'success');
         } else {
            setAiData(getDynamicFallbackInsights());
         }
      } catch (e) {
         setAiData(getDynamicFallbackInsights());
      } finally {
         setAiLoading(false);
      }
   };

   return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative max-w-full overflow-hidden">
         {/* Header Section */}
         <PageHeader
            title="Attendance Review"
            description="Monitor team punctuality, working hours and overall presence"
            actions={
               <>
                  <PermissionGate module="attendance_review" action="view">
                     <button 
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="h-11 px-4 sm:px-5 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm text-xs sm:text-sm"
                     >
                        <Upload size={18} />
                        <span>Import Attendance</span>
                     </button>

                     <button 
                        type="button"
                        onClick={handleFetchAIInsights}
                        className="h-11 px-4 sm:px-5 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 text-xs sm:text-sm"
                     >
                        <Sparkles size={18} />
                        <span>Generate AI Insights</span>
                     </button>

                     <button 
                        type="button"
                        disabled={isExporting}
                        onClick={handleExport}
                        className="h-11 px-4 sm:px-5 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm text-xs sm:text-sm disabled:opacity-50"
                     >
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span>Export History</span>
                     </button>
                  </PermissionGate>

                  <PermissionGate module="attendance_review" action="create">
                     <button 
                        type="button"
                        onClick={() => setShowManualModal(true)}
                        className="btn-primary h-11 px-4 sm:px-5 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs sm:text-sm shadow-sm"
                     >
                        <Plus size={18} />
                        <span>Manual Entry</span>
                     </button>
                  </PermissionGate>
               </>
            }
         />

         {/* Stats Cards Section */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

         {/* Filter Bar */}
         <div className="card p-4 sm:p-6 border-none bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-left">
            <div className="relative flex-1 w-full text-slate-400">
               <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
               <input
                  type="text"
                  placeholder="Search by employee name..."
                  className="input-field pl-10 h-11 w-full text-xs sm:text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
               <DatePicker
                  className="input-field h-11 px-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 w-full sm:w-48"
                  value={dateFilter}
                  onChange={(val) => setDateFilter(typeof val === 'string' ? val : val?.target?.value || '')}
               />

               <select
                  className="select-field h-11 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[140px] w-full sm:w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
               >
                  <option value="">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Absent">Absent</option>
               </select>

               <button 
                  type="button"
                  onClick={resetFilters}
                  title="Reset Filters"
                  className="h-11 w-11 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
               >
                  <RotateCcw size={16} />
               </button>
            </div>
         </div>

         {/* Desktop / Tablet Attendance Table (Hidden on mobile) */}
         <div className="hidden md:block card p-0 border-none bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
            <div className="hcm-table-container">
               <table className="hcm-table w-full">
                  <thead className="hcm-thead">
                     <tr className="hcm-tr">
                        <th className="hcm-th text-left">Employee</th>
                        <th className="hcm-th text-center">In / Out</th>
                        <th className="hcm-th text-center">Total Hours</th>
                        <th className="hcm-th text-center">Work Mode</th>
                        <th className="hcm-th text-center">Status</th>
                        <th className="hcm-th text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                     {filteredRecords.map((user) => (
                        <tr key={user.id} className="hcm-tr hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                           <td className="hcm-td">
                              <div className="flex items-center gap-3.5">
                                 <Avatar src={user.img} alt={user.name} size="md" />
                                 <div className="min-w-0 text-left">
                                    <p className="font-extrabold text-slate-900 dark:text-white leading-tight truncate">{user.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{user.date}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="hcm-td text-center whitespace-nowrap">
                              <div className="flex flex-col gap-0.5 items-center">
                                 <span className="text-xs font-black text-slate-800 dark:text-slate-200">{user.checkIn} — {user.checkOut || '--:--'}</span>
                                 {user.status === 'Late' && (
                                    <span className="text-[9px] font-bold text-rose-500 tracking-wider flex items-center gap-1">
                                       <AlertCircle size={10} /> Late Arrival
                                    </span>
                                 )}
                              </div>
                           </td>
                           <td className="hcm-td text-center font-extrabold text-slate-800 dark:text-slate-200">
                              {user.hours || '0h 0m'}
                           </td>
                           <td className="hcm-td text-center">
                              <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                 {user.mode === 'Office' || !user.mode ? <MapPin size={14} /> : <Monitor size={14} />}
                                 <span>{user.mode || 'Office'}</span>
                              </div>
                           </td>
                           <td className="hcm-td text-center">
                              <span className={cn(
                                 "px-3 py-1 rounded-lg text-[10px] font-bold border inline-block",
                                 user.status === 'Present'
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30"
                                    : user.status === 'Late'
                                    ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30"
                                    : user.status === 'On Leave'
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30"
                                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30"
                              )}>
                                 {user.status}
                              </span>
                           </td>
                           <td className="hcm-td text-right">
                              <button
                                 type="button"
                                 onClick={() => setSelectedEntry(user)}
                                 className="h-9 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
                              >
                                 <span>Details</span>
                                 <ChevronRight size={14} />
                              </button>
                           </td>
                        </tr>
                     ))}
                     {filteredRecords.length === 0 && (
                        <tr>
                           <td colSpan="6" className="py-12">
                              <EmptyState
                                 icon={CalendarDays}
                                 title="No matching attendance records found"
                                 description="No employee attendance records match your search filter."
                              />
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Mobile Responsive Cards View (Shown only on mobile) */}
         <div className="block md:hidden space-y-4 text-left">
            {filteredRecords.length > 0 ? (
               filteredRecords.map(user => (
                  <div key={user.id} className="card p-4 space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs text-left">
                     <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                           <Avatar src={user.img} alt={user.name} size="md" />
                           <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate">{user.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.date}</p>
                           </div>
                        </div>
                        <span className={cn(
                           "px-2.5 py-0.5 rounded-lg text-[10px] font-bold border shrink-0",
                           user.status === 'Present' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400" :
                           user.status === 'Late' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400" :
                           "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
                        )}>
                           {user.status}
                        </span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                           <span className="text-[10px] font-bold text-slate-400 block uppercase">In / Out</span>
                           <p className="font-bold text-slate-800 dark:text-slate-200">{user.checkIn} — {user.checkOut || '--:--'}</p>
                        </div>
                        <div>
                           <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Hours & Mode</span>
                           <p className="font-bold text-slate-800 dark:text-slate-200">{user.hours || '0h 0m'} ({user.mode || 'Office'})</p>
                        </div>
                     </div>
                     <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                           type="button"
                           onClick={() => setSelectedEntry(user)}
                           className="h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                           <span>Details</span>
                           <ChevronRight size={14} />
                        </button>
                     </div>
                  </div>
               ))
            ) : (
               <div className="card p-8 text-center bg-white dark:bg-slate-900">
                  <EmptyState
                     icon={CalendarDays}
                     title="No matching attendance records found"
                     description="No employee attendance records match your search filter."
                  />
               </div>
            )}
         </div>

         {/* AI Recommendations Modal */}
         <CenterModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            title="HCM AI Attendance & Burnout Insights"
         >
            <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
               {aiLoading ? (
                  <div className="py-16 text-center space-y-4">
                     <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto" />
                     <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Analyzing team attendance patterns, overtime trends & burnout risks...</p>
                  </div>
               ) : (
                  <>
                     <div className="space-y-4">
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-4">
                           <div className="p-3 bg-indigo-600 text-white rounded-xl shrink-0">
                              <Sparkles size={22} />
                           </div>
                           <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">AI Attendance Summary</h4>
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">{aiData?.attendanceSummary || aiData?.summary || "Team attendance metrics are within optimal operational bounds."}</p>
                           </div>
                        </div>

                        <div className="p-5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/50 flex items-start gap-4">
                           <div className="p-3 bg-purple-600 text-white rounded-xl shrink-0">
                              <CalendarDays size={22} />
                           </div>
                           <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-200">AI Leave & Coverage Summary</h4>
                              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 leading-relaxed">{aiData?.leaveSummary || "Team leave requests and capacity coverage are properly balanced across schedules."}</p>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {aiData?.capacityImpact && (
                           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Capacity Impact</span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                 {aiData.capacityImpact}
                              </span>
                           </div>
                        )}

                        {aiData?.burnoutRisk && (
                           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Burnout Risk</span>
                              <span className={cn(
                                 "text-xs font-black px-3 py-1 rounded-lg border uppercase tracking-wider",
                                 aiData.burnoutRisk === "High" ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40" :
                                    aiData.burnoutRisk === "Moderate" ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40" :
                                       "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40"
                              )}>
                                 {aiData.burnoutRisk} Risk
                              </span>
                           </div>
                        )}
                     </div>

                     <div className="space-y-3">
                        <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Action Recommendations</h5>
                        {aiData?.recommendations && aiData.recommendations.length > 0 ? (
                           aiData.recommendations.map((item, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                 <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                                       {item.decision}
                                    </span>
                                 </div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">{item.reason}</p>
                              </div>
                           ))
                        ) : (
                           <div className="p-4 text-xs italic text-slate-400 text-center">
                              No urgent attendance risk factors identified.
                           </div>
                        )}
                     </div>

                     <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button 
                           type="button" 
                           onClick={() => setShowAIModal(false)}
                           className="btn-primary h-11 px-5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
                        >
                           Close Insights
                        </button>
                     </div>
                  </>
               )}
            </div>
         </CenterModal>

         {/* Entry Details Modal */}
         <CenterModal
            isOpen={!!selectedEntry}
            onClose={() => setSelectedEntry(null)}
            title="Attendance Record Details"
         >
            {selectedEntry && (
               <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                     <Avatar src={selectedEntry.img} alt={selectedEntry.name} size="lg"/>
                     <div className="text-left">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">{selectedEntry.name}</h2>
                        <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-2">{selectedEntry.date}</p>
                        
                        <div className="mt-3 flex items-center gap-3">
                           <span className={cn(
                              "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                              selectedEntry.status === 'Present' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                           )}>{selectedEntry.status}</span>
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mode: {selectedEntry.mode || 'Office'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                     <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hours</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">{selectedEntry.hours || '0h 0m'}</h4>
                     </div>
                  </div>

                  <section className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 text-left">Timeline Activity</h3>
                     <div className="space-y-5 relative ml-3 pl-8 border-l-2 border-slate-100 dark:border-slate-800 text-left">
                        {[
                           { time: selectedEntry.checkIn, label: 'Clocked In', icon: Clock, color: 'bg-emerald-500' },
                           { time: selectedEntry.checkOut || '--:--', label: 'Clocked Out', icon: Clock, color: 'bg-slate-900 dark:bg-slate-100' },
                        ].map((log, i) => (
                           <div key={i} className="relative">
                              <div className={cn("absolute -left-[45px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-white dark:text-slate-900", log.color)}>
                                 <log.icon size={12} />
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="text-left">
                                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">{log.time}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.label}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                     <button 
                        type="button" 
                        onClick={() => setSelectedEntry(null)}
                        className="btn-primary h-11 px-5 rounded-xl font-bold w-full text-xs sm:text-sm cursor-pointer shadow-sm"
                     >
                        Close View
                     </button>
                  </div>
               </div>
            )}
         </CenterModal>

         {/* Manual Entry Modal */}
         <CenterModal
            isOpen={showManualModal}
            onClose={() => setShowManualModal(false)}
            title="Add Manual Attendance Record"
         >
            <form onSubmit={handleManualEntry} className="space-y-4 text-left p-1">
               <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Select Employee</label>
                  <select
                     className="select-field h-11 w-full text-xs font-bold"
                     value={newEntry.employeeId}
                     onChange={e => setNewEntry({ ...newEntry, employeeId: e.target.value })}
                  >
                     <option value="">-- Select from team --</option>
                     {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name || m.fullName}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left">
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Date</label>
                     <DatePicker
                        className="input-field h-11 text-xs font-medium"
                        value={newEntry.date}
                        onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                     />
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Work Mode</label>
                     <select
                        className="select-field h-11 text-xs font-bold"
                        value={newEntry.mode}
                        onChange={e => setNewEntry({ ...newEntry, mode: e.target.value })}
                     >
                        <option value="Office">Office</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Client Visit">Client Visit</option>
                     </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Clock In Time</label>
                     <input
                        type="time"
                        required
                        className="input-field h-11 text-xs font-medium"
                        value={newEntry.checkIn}
                        onChange={e => setNewEntry({ ...newEntry, checkIn: e.target.value })}
                     />
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Clock Out Time</label>
                     <input
                        type="time"
                        className="input-field h-11 text-xs font-medium"
                        value={newEntry.checkOut}
                        onChange={e => setNewEntry({ ...newEntry, checkOut: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Attendance Status</label>
                  <div className="grid grid-cols-3 gap-3">
                     {['Present', 'Late', 'On Leave'].map(s => (
                        <button
                           key={s}
                           type="button"
                           onClick={() => setNewEntry({ ...newEntry, status: s })}
                           className={cn(
                              "h-10 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                              newEntry.status === s 
                                 ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm" 
                                 : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                           )}
                        >
                           {s}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="pt-4 flex items-center gap-3 text-left">
                  <button 
                     type="button" 
                     onClick={() => setShowManualModal(false)}
                     className="btn-secondary h-11 px-5 rounded-xl font-bold w-1/3 text-xs sm:text-sm cursor-pointer"
                  >
                     Dismiss
                  </button>

                  <button 
                     type="submit" 
                     className="btn-primary h-11 rounded-xl font-bold w-2/3 text-xs sm:text-sm cursor-pointer shadow-sm"
                  >
                     Record Entry
                  </button>
               </div>
            </form>
         </CenterModal>

         <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            entity="attendance"
         />
      </div>
   );
};

export default AttendanceReview;


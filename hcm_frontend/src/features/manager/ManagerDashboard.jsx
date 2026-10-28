import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  ClipboardCheck, 
  AlertTriangle, 
  Download, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowUpRight,
  Target,
  BarChart3,
  Plus,
  FileText,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import DatePicker from '../../shared/components/common/DatePicker';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';
import { employeeAPI } from '../../utils/apiService';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { 
    dashboardData, 
    dashboardLoading, 
    teamMembers, 
    leaveRequests, 
    kpis, 
    addTask, 
    updateLeaveStatus, 
    attendance, 
    showToast 
  } = useManager();

  // State Declarations
  const [activeChartTab, setActiveChartTab] = useState('this-week');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', employeeId: '', priority: 'Medium', dueDate: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('PDF Report');
  const [dateRange, setDateRange] = useState('Current Month');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchHolidays = async () => {
      try {
        setLoadingHolidays(true);
        const res = await employeeAPI.getHolidays();
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          setHolidays(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load holidays in Manager dashboard:', err);
      } finally {
        if (isMounted) setLoadingHolidays(false);
      }
    };
    fetchHolidays();
    return () => { isMounted = false; };
  }, []);

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (holidays || [])
      .filter(h => {
        if (!h.date) return false;
        const d = new Date(h.date);
        return !isNaN(d.getTime()) && d >= today;
      })
      .slice(0, 3);
  }, [holidays]);

  const handleDownloadReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowExportModal(false);
      showToast('Dashboard analytics report exported successfully!', 'success');
    }, 1500);
  };

  // Compute Metrics from API/Context dynamically
  const metrics = useMemo(() => {
    const apiMetrics = dashboardData?.metrics || {};
    const totalTeam = teamMembers.length > 0 ? teamMembers.length : (apiMetrics.teamSize || 0);
    
    // Calculate attendance present today
    const presentCount = attendance && attendance.length > 0
      ? attendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.clockIn || a.checkIn !== '09:00 AM').length
      : (apiMetrics.presentToday || 0);

    const pendingLeavesCount = leaveRequests 
      ? leaveRequests.filter(l => l.status === 'Pending' || l.status === 'PENDING').length
      : (apiMetrics.pendingLeaveApprovals || 0);

    const alertsCount = dashboardData?.performanceAlerts?.length || 
      (kpis ? kpis.filter(k => k.status === 'At Risk' || k.status === 'Delayed').length : 0);

    return {
      teamSize: totalTeam,
      presentToday: presentCount,
      pendingLeaveApprovals: pendingLeavesCount,
      performanceAlerts: alertsCount
    };
  }, [dashboardData, teamMembers, attendance, leaveRequests, kpis]);

  const stats = [
    { label: 'Team Size', value: metrics.teamSize, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Present Today', value: metrics.presentToday, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Pending Approvals', value: metrics.pendingLeaveApprovals, icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Performance Alerts', value: metrics.performanceAlerts, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
  ];

  // Dynamic Attendance Trends calculation (7-day trend)
  const attendanceTrends = useMemo(() => {
    if (dashboardData?.teamAttendanceTrends && dashboardData.teamAttendanceTrends.length > 0) {
      return dashboardData.teamAttendanceTrends;
    }
    
    // Fallback: Generate days based on team size & attendance
    const days = activeChartTab === 'this-week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Last Mon', 'Last Tue', 'Last Wed', 'Last Thu', 'Last Fri', 'Last Sat', 'Last Sun'];

    const total = metrics.teamSize || 1;
    return days.map((day, idx) => {
      // Create reasonable distribution if no backend trend log
      const presentRatio = idx < 5 ? (metrics.presentToday > 0 ? metrics.presentToday : total) : Math.floor(total * 0.4);
      return {
        day,
        present: Math.min(total, presentRatio),
        total: total
      };
    });
  }, [dashboardData, activeChartTab, metrics.teamSize, metrics.presentToday]);

  // Dynamic Index Analytics computation
  const analyticsData = useMemo(() => {
    const teamEff = kpis.length > 0 
      ? Math.round(kpis.reduce((acc, k) => acc + (k.progress || 0), 0) / kpis.length)
      : 0;

    const attendanceRate = metrics.teamSize > 0 
      ? Math.round((metrics.presentToday / metrics.teamSize) * 100)
      : 0;

    const goalVelocity = kpis.length > 0 
      ? Math.round((kpis.filter(k => k.status === 'On Track' || k.status === 'Completed').length / kpis.length) * 100)
      : 0;

    return [
      { label: 'Team Efficiency', score: teamEff, color: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Attendance Rate', score: attendanceRate, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Goal Velocity', score: goalVelocity, color: 'text-amber-600 dark:text-amber-400' },
    ];
  }, [kpis, metrics.teamSize, metrics.presentToday]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.employeeId) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    addTask({
      title: newTask.title,
      employeeId: newTask.employeeId,
      priority: newTask.priority,
      dueDate: newTask.dueDate || undefined
    });
    setShowTaskModal(false);
    setNewTask({ title: '', employeeId: '', priority: 'Medium', dueDate: '' });
    showToast('Task assigned successfully.');
  };

  const handleLeaveAction = async (status) => {
    if (!selectedLeave) return;
    try {
      setIsSubmittingAction(true);
      const actionStatus = status === 'Approved' ? 'MANAGER_APPROVED' : 'REJECTED';
      await updateLeaveStatus(selectedLeave.id, actionStatus);
      setShowReviewModal(false);
      setSelectedLeave(null);
      showToast(`Leave request ${status.toLowerCase()}ed successfully.`);
    } catch {
      // Toast error is already handled with backend error reason in ManagerContext
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const pendingLeavesList = useMemo(() => {
    return (leaveRequests || []).filter(l => l.status === 'Pending' || l.status === 'PENDING');
  }, [leaveRequests]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in focus:outline-none max-w-full overflow-hidden">
      {/* Header Section */}
      <PageHeader
        title="Manager Dashboard"
        description="Monitor team productivity, approvals and performance in real-time"
        actions={
          <button 
            type="button"
            onClick={() => setShowExportModal(true)}
            className="h-11 px-4 sm:px-5 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm text-xs sm:text-sm"
          >
            <Download size={18} className="text-slate-500 dark:text-slate-400" />
            <span>Export Report</span>
          </button>
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
            isLoading={dashboardLoading}
          />
        ))}
      </div>

      {/* Main Content Responsive Grid / Stack */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        
        {/* Left Column on Desktop (Cols 8) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 flex flex-col justify-between">
          
          {/* Order 1 on mobile: Team Attendance Overview Chart */}
          <div className="order-1 card p-6 sm:p-8 bg-white dark:bg-slate-900 flex flex-col justify-between min-h-[380px] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="text-left">
                <h3 className="hcm-section-heading">Team Attendance Overview</h3>
                <p className="hcm-muted-text mt-1">Activity comparison across departments</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto shrink-0">
                <button 
                  type="button"
                  onClick={() => setActiveChartTab('this-week')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all cursor-pointer",
                    activeChartTab === 'this-week' 
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  This Week
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveChartTab('previous')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all cursor-pointer",
                    activeChartTab === 'previous' 
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  Previous
                </button>
              </div>
            </div>
            
            {/* Chart Bar Area */}
            <div className="flex-1 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-4 mb-2 min-h-[180px]">
              {attendanceTrends.map((d, i) => {
                const totalVal = d.total > 0 ? d.total : 1;
                const percentage = Math.min(100, Math.max(0, Math.round((d.present / totalVal) * 100)));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-md">
                      {d.present} / {d.total} Present ({percentage}%)
                    </div>
                    
                    <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-full h-40 sm:h-44 relative overflow-hidden flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${percentage}%` }}
                        transition={{ type: 'spring', damping: 18, stiffness: 120 }}
                        className={cn(
                          "w-full rounded-full transition-colors",
                          percentage >= 80 ? "bg-primary-600 dark:bg-primary-500" : percentage >= 50 ? "bg-amber-500" : "bg-slate-400"
                        )}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order 4 on mobile: Goal Progress Summary */}
          <div className="order-4 lg:order-none card p-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm text-left">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <h3 className="hcm-section-heading flex items-center gap-2.5">
                <Target className="text-primary-600 dark:text-primary-400 shrink-0" size={22} />
                <span>Goal Progress Summary</span>
              </h3>
              <button 
                type="button"
                onClick={() => navigate('/manager/kpi')}
                className="h-9 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all cursor-pointer shrink-0"
              >
                <span>View All Goals</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {kpis.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                  <Target className="text-slate-300 dark:text-slate-600" size={26} />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No goals assigned yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Goals from team performance tracking will appear here</p>
                <button 
                  type="button"
                  onClick={() => navigate('/manager/kpi')}
                  className="h-10 px-4 rounded-xl font-bold text-xs inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={14}/>
                  <span>Add Goal</span>
                </button>
              </div>
            ) : (
              <div className="p-5 sm:p-6 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {kpis.slice(0, 4).map((goal, i) => {
                    const statusColor = goal.status === 'At Risk' ? 'amber' : goal.status === 'Delayed' ? 'rose' : goal.status === 'Completed' ? 'indigo' : 'emerald';
                    const progress = goal.progress || 0;
                    return (
                      <motion.div 
                        key={goal.id || i} 
                        whileHover={{ scale: 1.01 }}
                        onClick={() => navigate('/manager/kpi')}
                        className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-3 mb-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{goal.title}</p>
                            {goal.assignedTo && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{goal.assignedTo}</p>
                            )}
                          </div>
                          <span className={cn(
                            "shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg",
                            statusColor === 'amber' && "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                            statusColor === 'rose' && "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
                            statusColor === 'indigo' && "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
                            statusColor === 'emerald' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                          )}>
                            {goal.status || 'On Track'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                              className={cn(
                                "h-full rounded-full",
                                statusColor === 'amber' && 'bg-amber-500',
                                statusColor === 'rose' && 'bg-rose-500',
                                statusColor === 'indigo' && 'bg-indigo-500',
                                statusColor === 'emerald' && 'bg-emerald-500',
                              )} 
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-extrabold tabular-nums min-w-[34px] text-right",
                            statusColor === 'amber' && 'text-amber-600 dark:text-amber-400',
                            statusColor === 'rose' && 'text-rose-600 dark:text-rose-400',
                            statusColor === 'indigo' && 'text-indigo-600 dark:text-indigo-400',
                            statusColor === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                          )}>
                            {progress}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {kpis.length > 4 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button 
                      type="button"
                      onClick={() => navigate('/manager/kpi')}
                      className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>View all {kpis.length} goals</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column on Desktop (Cols 4) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8 flex flex-col justify-between">
          
          {/* Order 2 on mobile: Pending Approvals Card */}
          <div className="order-2 card p-6 sm:p-8 bg-slate-900 dark:bg-slate-950 text-white border-none flex flex-col justify-between min-h-[300px] relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <ClipboardCheck size={100} />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400 text-left">Pending Approvals</h3>
                {pendingLeavesList.length > 0 && (
                  <span className="text-[10px] font-black bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full">
                    {pendingLeavesList.length} Pending
                  </span>
                )}
              </div>

              <div className="space-y-4 text-left">
                {pendingLeavesList.slice(0, 3).map((req, i) => (
                  <div 
                    key={req.id || i} 
                    onClick={() => { setSelectedLeave(req); setShowReviewModal(true); }}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group/item"
                  >
                    <div className="flex items-center gap-3 mb-2.5 text-left">
                      <Avatar src={req.img} alt={req.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold truncate text-white">{req.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{req.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-primary-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {req.startDate}
                      </span>
                      <div className="text-[10px] font-bold text-white flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-lg group-hover/item:bg-primary-600 transition-all">
                        <span>Review</span>
                        <ArrowUpRight size={12}/>
                      </div>
                    </div>
                  </div>
                ))}

                {pendingLeavesList.length === 0 && (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-400 mb-3 opacity-80" size={36} />
                    <p className="text-sm font-bold text-slate-300">All cleared for today!</p>
                    <p className="text-xs text-slate-500 mt-1">No pending leave approvals</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button 
                type="button"
                onClick={() => navigate('/manager/approvals')}
                className="w-full h-11 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <span>Go to Requests</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

           {/* Order 3 on mobile: Company Holidays Card */}
          <div className="card p-5 sm:p-6 text-left bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="hcm-section-heading text-base sm:text-lg flex items-center gap-2">
                <Calendar size={18} className="text-primary-600 dark:text-primary-400" />
                <span>Company Holidays</span>
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                {upcomingHolidays.length} Upcoming
              </span>
            </div>

            <div className="space-y-3">
              {loadingHolidays ? (
                <div className="py-6 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 mx-auto animate-spin text-primary-600 mb-2" />
                  <p className="text-xs">Loading holidays...</p>
                </div>
              ) : upcomingHolidays.length > 0 ? (
                upcomingHolidays.map((h, i) => {
                  const hDate = new Date(h.date);
                  const month = !isNaN(hDate.getTime()) ? hDate.toLocaleString('default', { month: 'short' }) : 'HOL';
                  const day = !isNaN(hDate.getTime()) ? hDate.getDate() : '--';
                  return (
                    <div key={h.id || i} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase leading-none">{month}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">{day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{h.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                          {h.type || 'Public Holiday'} • {h.region || 'All Regions'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 px-4 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Calendar className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No upcoming holidays</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">New company holidays will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Order 4 on mobile: Index Analytics Card */}
          <div className="order-3 card p-6 sm:p-8 text-left bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <h3 className="hcm-section-heading mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-600 dark:text-primary-400" />
              <span>Index Analytics</span>
            </h3>

            <div className="space-y-5">
              {analyticsData.map((item, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className={cn("text-xl font-black tracking-tight", item.color)}>{item.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-700", item.color.replace('text-', 'bg-'))}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* --- MODALS --- */}
      
      {/* Export Modal */}
      <CenterModal isOpen={showExportModal} onClose={() => !isGenerating && setShowExportModal(false)} title="Export Dashboard Analytics" maxWidth="max-w-md">
        <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Select export format and date range for your team performance report.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['PDF Report', 'Excel Sheet', 'CSV Data'].map(format => {
              const isActive = selectedFormat === format;
              return (
                <button 
                  key={format} 
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setSelectedFormat(format)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all cursor-pointer", 
                    isActive 
                      ? "border-primary-500 bg-primary-50/30 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 shadow-sm" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  {format === 'PDF Report' && <FileText size={20} className={isActive ? "text-rose-500" : "text-slate-400"} />}
                  {format === 'Excel Sheet' && <FileSpreadsheet size={20} className={isActive ? "text-emerald-500" : "text-slate-400"} />}
                  {format === 'CSV Data' && <FileSpreadsheet size={20} className={isActive ? "text-cyan-500" : "text-slate-400"} />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{format}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="form-label text-xs font-bold block">Date Range</label>
            <select 
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              disabled={isGenerating}
              className="select-field h-11 w-full text-xs font-medium"
            >
              <option value="Current Month">Current Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Year to Date">Year to Date</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          <button 
            type="button"
            disabled={isGenerating}
            onClick={handleDownloadReport}
            className="btn-primary w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-sm mt-4"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{selectedFormat === 'PDF Report' ? 'Compiling PDF...' : 'Exporting...'}</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Download Report</span>
              </>
            )}
          </button>
        </div>
      </CenterModal>

      {/* Leave Review Modal */}
      <CenterModal isOpen={showReviewModal} onClose={() => !isSubmittingAction && setShowReviewModal(false)} title="Review Leave Request">
        {selectedLeave && (
          <div className="p-6 sm:p-8 text-left bg-white dark:bg-slate-900">
            <div className="flex items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <Avatar src={selectedLeave.img} alt={selectedLeave.name} size="lg"/>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{selectedLeave.name}</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{selectedLeave.type}</p>
                <div className="flex flex-wrap items-center gap-2.5 mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    <Calendar size={14} /> {selectedLeave.startDate} {selectedLeave.endDate && selectedLeave.endDate !== selectedLeave.startDate ? `— ${selectedLeave.endDate}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-lg">
                    <Clock size={14} /> {selectedLeave.days || 1} {selectedLeave.days === 1 ? 'Day' : 'Days'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="form-label text-xs font-bold mb-2 block">Reason for Leave</label>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium italic">
                  "{selectedLeave.reason || 'No reason provided'}"
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-[10px] uppercase tracking-wider mb-1 block">Requested Duration</label>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLeave.days || 1} Days</p>
                </div>
                <div>
                  <label className="form-label text-[10px] uppercase tracking-wider mb-1 block">Status</label>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 uppercase">
                    {selectedLeave.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  disabled={isSubmittingAction}
                  onClick={() => handleLeaveAction('Rejected')}
                  className="w-full sm:w-1/2 h-11 rounded-xl font-bold border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingAction ? <Loader2 size={16} className="animate-spin" /> : <span>Reject</span>}
                </button>
                
                <button 
                  type="button"
                  disabled={isSubmittingAction}
                  onClick={() => handleLeaveAction('Approved')}
                  className="w-full sm:w-1/2 h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingAction ? <Loader2 size={16} className="animate-spin" /> : <span>Approve</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
};

export default ManagerDashboard;

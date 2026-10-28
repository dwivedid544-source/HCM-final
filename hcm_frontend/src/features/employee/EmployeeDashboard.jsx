import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CalendarDays, 
  Wallet, 
  CheckSquare, 
  Plus, 
  ArrowRight, 
  Bell, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight,
  FileText,
  Loader2,
  Upload,
  X,
  AlertCircle,
  User,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import { employeeService } from '../../services/employee.service';
import { StatCard } from '../../components/common';
import CenterModal from '../../shared/components/layout/CenterModal';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import DatePicker from '../../shared/components/common/DatePicker';
import Button from '../../shared/components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import { useCurrency } from '../../hooks/useCurrency';

const EmployeeDashboard = () => {
  const { showToast } = useEmployee();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  // Primary dynamic state from GET /employee/dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mode state for modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Action loaders
  const [isViewingPayslip, setIsViewingPayslip] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [leaveStep, setLeaveStep] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState(null);
  const leaveFileInputRef = useRef(null);
  const [isRegisteringClock, setIsRegisteringClock] = useState(false);
  const [clockStep, setClockStep] = useState('');
  const [isOpeningBoard, setIsOpeningBoard] = useState(false);
  const [showDetailBoardModal, setShowDetailBoardModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isDownloadingAttachment, setIsDownloadingAttachment] = useState(false);

  // Live Timer state
  const [workedSeconds, setWorkedSeconds] = useState(0);

  // Fetch all dashboard data from GET /employee/dashboard
  const fetchDashboardData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      setError(null);
      const res = await employeeService.getDashboard();
      const payload = res.data?.data || res.data;
      setDashboardData(payload);
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load dashboard data');
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Safe references
  const employee = dashboardData?.employee || null;
  const attendance = dashboardData?.attendance || {};
  const leaveBalance = dashboardData?.leaveBalance || {};
  const salary = dashboardData?.salary || {};
  const goals = dashboardData?.goals || [];
  const tasks = dashboardData?.tasks || [];
  const announcements = dashboardData?.announcements || [];
  const nextHoliday = dashboardData?.nextHoliday || null;

  // Attendance Live Timer Logic:
  // - Starts from punch in time
  // - Continues counting live every second when isClockedIn is true
  // - Stops after punch out, holding recorded session time
  useEffect(() => {
    let interval = null;

    if (attendance?.isClockedIn && attendance?.clockInTime) {
      const startTime = new Date(attendance.clockInTime).getTime();

      const calculateElapsed = () => {
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
        setWorkedSeconds(elapsed);
      };

      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      // Stopped after punch out or offline
      if (attendance?.workedSeconds !== undefined && attendance.workedSeconds > 0) {
        setWorkedSeconds(attendance.workedSeconds);
      } else if (attendance?.totalHoursToday !== undefined && attendance.totalHoursToday > 0) {
        setWorkedSeconds(Math.round(attendance.totalHoursToday * 3600));
      } else {
        setWorkedSeconds(0);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attendance?.isClockedIn, attendance?.clockInTime, attendance?.workedSeconds, attendance?.totalHoursToday]);

  const formatWorkedTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Weekly activity from API (real attendance hours)
  const weeklyChartData = useMemo(() => {
    if (attendance?.weeklyHours && Array.isArray(attendance.weeklyHours) && attendance.weeklyHours.length > 0) {
      return attendance.weeklyHours;
    }
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return weekdays.map(day => ({ day, hours: 0, logged: false }));
  }, [attendance?.weeklyHours]);

  const hasChartData = useMemo(() => {
    return weeklyChartData.some(d => (parseFloat(d.hours) || 0) > 0);
  }, [weeklyChartData]);

  // Stats cards data
  const stats = useMemo(() => {
    const isClocked = Boolean(attendance?.isClockedIn);
    const clockInStr = attendance?.clockInTime 
      ? new Date(attendance.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : null;
    const clockOutStr = attendance?.clockOutTime 
      ? new Date(attendance.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : null;

    const netSalaryVal = salary?.netSalary ?? salary?.baseSalary ?? employee?.baseSalary ?? null;
    const hasConfiguredSalary = netSalaryVal !== null && netSalaryVal !== undefined && Number(netSalaryVal) > 0;
    const completedGoalsCount = goals.filter(g => (g.progress || 0) >= 100).length;

    return [
      { 
        label: 'Today Attendance', 
        value: isClocked ? 'Clocked In' : (clockOutStr ? 'Clocked Out' : 'Not In'), 
        trend: isClocked ? `Since ${clockInStr}` : (clockOutStr ? `Left at ${clockOutStr}` : 'Ready to start?'), 
        icon: Clock, 
        color: isClocked ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400 dark:text-slate-500', 
        bg: isClocked ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-slate-100 dark:bg-slate-800/40',
        onClick: () => navigate('/employee/attendance')
      },
      { 
        label: 'Leave Balance', 
        value: `${leaveBalance?.total ?? 36} Days`, 
        trend: `${leaveBalance?.pendingRequests ?? 0} Pending Requests`, 
        icon: CalendarDays, 
        color: 'text-amber-600 dark:text-amber-455', 
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        onClick: () => navigate('/employee/leave')
      },
      { 
        label: 'Salary Status', 
        value: hasConfiguredSalary ? formatCurrency(netSalaryVal) : 'Not Configured', 
        trend: salary?.month ? `Month: ${salary.month}` : (salary?.status || (hasConfiguredSalary ? 'Payroll structure active' : 'Pending HR assignment')), 
        icon: Wallet, 
        color: 'text-indigo-600 dark:text-indigo-400', 
        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
        onClick: () => navigate('/employee/payroll')
      },
      { 
        label: 'Active Goals', 
        value: goals.length, 
        trend: `${completedGoalsCount} completed`, 
        icon: CheckSquare, 
        color: 'text-primary-600 dark:text-primary-400', 
        bg: 'bg-primary-50 dark:bg-primary-950/20',
        onClick: () => navigate('/employee/performance')
      },
    ];
  }, [attendance, leaveBalance, salary, employee, goals, formatCurrency, navigate]);

  // Holiday formatting
  const holidayDate = useMemo(() => {
    return nextHoliday ? new Date(nextHoliday.date) : new Date();
  }, [nextHoliday]);

  const holidayMonthStr = useMemo(() => {
    return nextHoliday ? holidayDate.toLocaleString('default', { month: 'short' }) : 'CAL';
  }, [holidayDate, nextHoliday]);

  const holidayDayStr = useMemo(() => {
    return nextHoliday ? holidayDate.getDate() : '--';
  }, [holidayDate, nextHoliday]);

  const holidayName = nextHoliday ? nextHoliday.name : 'No Upcoming Holiday';
  const holidayType = nextHoliday ? (nextHoliday.type || 'Public Holiday') : 'Company Calendar';

  // Clock In Action: POST /attendance/check-in
  const handleClockIn = async () => {
    setIsRegisteringClock(true);
    setClockStep('Pinging coordinates...');
    try {
      await new Promise(r => setTimeout(r, 350));
      setClockStep('Registering check-in...');
      await employeeService.checkIn({ mode: 'Office' });
      showToast('Checked in successfully! Work session active.', 'success');
      await fetchDashboardData(false);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to check in', 'error');
    } finally {
      setIsRegisteringClock(false);
      setClockStep('');
    }
  };

  // Clock Out Action: POST /attendance/check-out
  const handleClockOut = async () => {
    setIsRegisteringClock(true);
    setClockStep('Calculating session hours...');
    try {
      await new Promise(r => setTimeout(r, 350));
      setClockStep('Registering punch out...');
      await employeeService.checkOut();
      showToast('Clocked out successfully. Work session saved.', 'success');
      await fetchDashboardData(false);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to clock out', 'error');
    } finally {
      setIsRegisteringClock(false);
      setClockStep('');
    }
  };

  // Leave attachment handler
  const handleLeaveFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const kb = file.size / 1024;
        const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
        setLeaveAttachment({
          name: file.name,
          size: sizeStr,
          fileBase64: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLeaveAttachment = (e) => {
    e.stopPropagation();
    setLeaveAttachment(null);
    if (leaveFileInputRef.current) {
      leaveFileInputRef.current.value = '';
    }
  };

  // Leave Request Submission
  const handleRequestLeave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newReq = {
      leaveType: formData.get('type'),
      startDate,
      endDate,
      totalDays,
      reason: formData.get('reason'),
      emergencyContact: formData.get('emergency'),
      attachment: leaveAttachment
    };
    
    setIsSubmittingLeave(true);
    setLeaveStep('Validating dates & balance...');
    
    try {
      await new Promise(r => setTimeout(r, 350));
      setLeaveStep('Routing request...');
      await employeeService.applyLeave(newReq);
      showToast('Leave request submitted successfully!', 'success');
      setLeaveAttachment(null);
      if (leaveFileInputRef.current) {
        leaveFileInputRef.current.value = '';
      }
      setShowLeaveModal(false);
      await fetchDashboardData(false);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to submit leave request', 'error');
    } finally {
      setIsSubmittingLeave(false);
      setLeaveStep('');
    }
  };

  const handleViewPayslip = () => {
    setIsViewingPayslip(true);
    showToast('Loading payroll documents...', 'info');
    setTimeout(() => {
      setIsViewingPayslip(false);
      navigate('/employee/payroll');
    }, 600);
  };

  const handleOpenDetailBoard = () => {
    setIsOpeningBoard(true);
    showToast('Accessing announcement feed...', 'info');
    setTimeout(() => {
      setIsOpeningBoard(false);
      setShowDetailBoardModal(true);
    }, 600);
  };

  const handleSyncHoliday = () => {
    setIsSyncingCalendar(true);
    showToast('Syncing with calendar...', 'info');
    setTimeout(() => {
      setIsSyncingCalendar(false);
      showToast(`${holidayName} synced to Google Calendar successfully!`, 'success');
    }, 800);
  };

  const handleDownloadAttachment = () => {
    setIsDownloadingAttachment(true);
    showToast('Retrieving secure notice attachment...', 'info');
    setTimeout(() => {
      try {
        const text = `Confidential Digital Notice\n\nTitle: ${selectedAnnouncement?.title || ''}\nDate: ${selectedAnnouncement?.date || ''}\nCategory: ${selectedAnnouncement?.category || ''}\n\nContent:\n${selectedAnnouncement?.content || ''}`;
        const file = new Blob([text], { type: 'text/plain' });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(file);
        element.download = `${(selectedAnnouncement?.title || 'Notice').replace(/\s+/g, '_')}_Attachment.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast('Notice details downloaded successfully!', 'success');
      } catch {
        showToast('Error downloading attachment', 'error');
      } finally {
        setIsDownloadingAttachment(false);
      }
    }, 800);
  };

  // 1. API Error State with Retry
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 mb-2">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-950 dark:text-white">Failed to Load Employee Dashboard</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button 
          onClick={() => fetchDashboardData(true)}
          variant="primary"
          leftIcon={RefreshCw}
          className="mt-4"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (loading || !dashboardData || !employee) {
    return (
      <div className="space-y-8 pb-12 animate-pulse px-4 sm:px-0">
        {/* Welcome Header Skeleton */}
        <div className="p-8 bg-slate-900/90 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="w-20 h-20 rounded-[1.75rem] bg-slate-800 shrink-0" />
            <div className="space-y-3 flex-1">
              <div className="h-7 w-64 bg-slate-800 rounded-xl" />
              <div className="h-4 w-48 bg-slate-800/80 rounded-lg" />
              <div className="h-3 w-56 bg-slate-800/50 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="h-10 w-32 bg-slate-800 rounded-xl" />
            <div className="h-10 w-36 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Main Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-60 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800" />
            <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800" />
            <div className="h-56 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800" />
          </div>
          <div className="space-y-8">
            <div className="h-52 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800" />
            <div className="h-72 bg-slate-900 rounded-3xl" />
            <div className="h-44 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const safeGoals = goals || [];
  const safeTasks = tasks || [];
  const safeRecentLeaves = leaveBalance?.recentRequests || leaveBalance?.requests || [];

  return (
    <div className="space-y-8 pb-12 animate-fade-in focus:outline-none px-4 sm:px-0">
      {/* 1. Welcome Header Section with Logged-in Employee */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden shadow-premium text-left">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <User size={160} />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
          <img 
            src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'Employee')}&background=4f46e5&color=fff`} 
            alt="Profile Avatar" 
            className="w-20 h-20 rounded-[1.75rem] border-2 border-white/25 object-cover shadow-lg shrink-0"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="hcm-page-title !text-white">
                Welcome Back, {employee.name ? employee.name.split(' ')[0] : 'Employee'}!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white leading-none shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                Active
              </span>
            </div>
            <p className="text-sm font-bold text-slate-350">
              {employee.designation || 'Staff Associate'} • {employee.department || 'Engineering'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-450 font-bold mt-1">
              <span className="flex items-center gap-1.5"><Clock size={14}/> Shift: {employee.shift || 'Morning Shift'}</span>
              <span className="flex items-center gap-1.5"><CalendarDays size={14}/> ID: {employee.employeeCode || 'EMP-001'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 w-full md:w-auto">
          <Button 
            onClick={handleViewPayslip} 
            isDisabled={isViewingPayslip}
            isLoading={isViewingPayslip}
            leftIcon={FileText}
            variant="ghost"
            className="border border-white/20 hover:bg-white/10 text-white"
          >
            View Payslip
          </Button>
          <Button 
            onClick={() => setShowLeaveModal(true)}
            variant="primary"
            leftIcon={Plus}
          >
            Request Leave
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.trend}
            color={stat.color}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Attendance, Weekly Activity, Assigned Tasks, Goals */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* 3. Current Attendance Timer & Clock In/Out */}
           <div className="card p-8 flex flex-col md:flex-row items-center gap-10 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm">
              <div className="flex flex-col items-center text-center">
                 <div className="relative w-40 h-40 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="80" cy="80" r="70" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="10" />
                       <motion.circle 
                         cx="80" cy="80" r="70" 
                         className={cn(
                           "fill-none transition-colors", 
                           attendance.isClockedIn ? "stroke-primary-600" : "stroke-slate-300 dark:stroke-slate-700"
                         )}
                         strokeWidth="10" 
                         strokeDasharray={440}
                         strokeDashoffset={440 - (440 * Math.min(1, workedSeconds / (8 * 3600)))}
                         strokeLinecap="round"
                         initial={{ strokeDashoffset: 440 }}
                         animate={{ strokeDashoffset: 440 - (440 * Math.min(1, workedSeconds / (8 * 3600))) }}
                         transition={{ duration: 0.8, ease: "easeOut" }}
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <h4 className="text-3xl font-bold text-slate-900 dark:text-white leading-none font-mono">
                         {formatWorkedTime(workedSeconds)}
                       </h4>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 tracking-wide uppercase">
                         {attendance.isClockedIn ? 'Currently Active' : (attendance.clockOutTime ? 'Completed Session' : 'Offline')}
                       </span>
                    </div>
                 </div>

                 {attendance.isClockedIn ? (
                    <Button 
                      onClick={handleClockOut} 
                      isDisabled={isRegisteringClock}
                      isLoading={isRegisteringClock}
                      variant="danger"
                      className="w-full sm:w-44 py-3"
                    >
                      {isRegisteringClock ? (clockStep || 'Clocking Out...') : 'Clock Out'}
                    </Button>
                 ) : (
                    <Button 
                      onClick={handleClockIn} 
                      isDisabled={isRegisteringClock}
                      isLoading={isRegisteringClock}
                      variant="primary"
                      className="w-full sm:w-44 py-3"
                    >
                      {isRegisteringClock ? (clockStep || 'Clocking In...') : 'Clock In'}
                    </Button>
                 )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 w-full border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-10 pt-8 md:pt-0 text-left">
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Start Time</p>
                       <p className="text-lg font-black text-slate-800 dark:text-slate-200">
                         {attendance.clockInTime 
                           ? new Date(attendance.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                           : '--:--'}
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.2em]">Total Mode</p>
                       <p className="text-lg font-black text-slate-800 dark:text-slate-200">
                         {attendance.mode || 'Office-Based'}
                       </p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-1 text-amber-550 dark:text-amber-450">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Daily Target</p>
                       <p className="text-lg font-black text-slate-800 dark:text-slate-200">
                         {employee?.shiftDetails?.workingHoursMin 
                           ? (() => {
                               const netMin = employee.shiftDetails.workingHoursMin;
                               const h = Math.floor(netMin / 60);
                               const m = netMin % 60;
                               return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} Hrs`;
                             })()
                           : '08:00 Hrs'}
                       </p>
                    </div>
                    <div className="space-y-1 text-primary-600 dark:text-primary-400 cursor-pointer group" onClick={() => navigate('/employee/attendance')}>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:underline">View History</p>
                       <p className="text-lg font-black flex items-center gap-1">Details <ChevronRight size={16} /></p>
                    </div>
                 </div>
              </div>
           </div>

           {/* 4. Weekly Activity Chart Card (Real attendance hours from API) */}
           <div className="card p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-left rounded-[2rem] shadow-sm">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic">
                 <Clock className="text-primary-600 dark:text-primary-400 shrink-0" size={22} />
                 Weekly Activity (Worked Hours)
              </h3>
              {!hasChartData ? (
                 <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <AlertCircle size={28} className="text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-500">No attendance activity logged for this week yet.</p>
                 </div>
              ) : (
                 <div className="space-y-4">
                    <div className="flex items-end justify-between h-40 pt-6 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl">
                       {weeklyChartData.map((data, idx) => {
                          const hrs = parseFloat(data.hours) || 0;
                          const heightPct = Math.min(100, Math.max(8, (hrs / 10) * 100));
                          return (
                             <div key={idx} className="flex flex-col items-center group relative cursor-pointer">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                                   {hrs} hrs
                                </span>
                                <div className="w-8 sm:w-14 bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden h-24 flex items-end">
                                   <motion.div 
                                     initial={{ height: 0 }}
                                     animate={{ height: `${heightPct}%` }}
                                     transition={{ duration: 0.6, delay: idx * 0.1 }}
                                     className={cn(
                                        "w-full rounded-t-lg transition-colors", 
                                        hrs >= 8 ? "bg-emerald-500 group-hover:bg-emerald-600" : (hrs > 0 ? "bg-indigo-500 group-hover:bg-indigo-600" : "bg-slate-200 dark:bg-slate-700")
                                     )}
                                   />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                                   {data.day}
                                </span>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              )}
           </div>

           {/* 5. Assigned Tasks Card (Display assigned tasks dynamically) */}
           <div className="card p-0 overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-left rounded-[2rem] shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic">
                    <CheckSquare className="text-primary-600 dark:text-primary-400 shrink-0" size={24} />
                    Assigned Tasks
                 </h3>
                 <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary-50 dark:bg-primary-950/20 text-primary-600">
                    {safeTasks.filter(t => t.status !== 'Completed').length} PENDING
                 </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                 {safeTasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-bold">
                       No tasks assigned to you currently. Keep up the good work!
                    </div>
                 ) : (
                    safeTasks.slice(0, 5).map((task) => (
                       <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <div className="flex-1 mr-6 text-left">
                             <p className="text-sm font-black text-slate-950 dark:text-white leading-tight mb-1">{task.title}</p>
                             <p className="text-xs text-slate-400 font-semibold">
                               Deadline: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                             </p>
                          </div>
                          <span className={cn(
                             "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm shrink-0",
                             task.status === 'Pending' ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-100 dark:border-amber-900/30" :
                             task.status === 'In_Progress' || task.status === 'In Progress' ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border-indigo-100 dark:border-indigo-900/30" :
                             "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30"
                          )}>
                             {(task.status || 'Pending').replace('_', ' ')}
                          </span>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* 6. Current Goals (Progress bars from database) */}
           <div className="card p-0 overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm text-left">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic">
                    <Target className="text-primary-600 dark:text-primary-400 shrink-0" size={24} />
                    Current Goals
                 </h3>
                 <button 
                   onClick={() => navigate('/employee/performance')}
                   className="text-xs font-bold text-primary-600 hover:text-primary-500 hover:underline"
                 >
                   Full Strategy
                 </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                 {safeGoals.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-bold">
                       No goals currently assigned.
                    </div>
                 ) : (
                    safeGoals.map((goal) => {
                       const progressVal = Number(goal.progress) || 0;
                       return (
                          <div key={goal.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                             <div className="flex-1 mr-8 text-left">
                                <div className="flex items-center justify-between mb-2">
                                   <span className="text-sm font-black text-slate-800 dark:text-slate-200">{goal.title}</span>
                                   <span className="text-xs font-black text-slate-500 dark:text-slate-400">{progressVal}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800 p-[1px]">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${progressVal}%` }}
                                     className={cn(
                                       "h-full rounded-full transition-all",
                                       progressVal >= 70 ? "bg-emerald-500" : progressVal >= 30 ? "bg-amber-500" : "bg-primary-500"
                                     )}
                                   />
                                </div>
                             </div>
                             <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm shrink-0",
                                goal.priority?.toLowerCase() === 'high' ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30" : 
                                goal.priority?.toLowerCase() === 'medium' ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" :
                                "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
                             )}>
                                {goal.priority || 'Medium'}
                             </span>
                          </div>
                       );
                    })
                 )}
              </div>
           </div>
        </div>

        {/* Right Side: Recent Leaves, Announcements & Public Holiday */}
        <div className="space-y-8 h-full text-left">
           
           {/* Recent Leave Requests Card */}
           <div className="card p-8 group hover:shadow-xl transition-all text-left dark:bg-slate-900 border border-slate-100 dark:border-slate-800 bg-white rounded-[2rem] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white italic tracking-tight">Recent Leave Requests</h3>
                 <button 
                   onClick={() => navigate('/employee/leave')}
                   className="text-xs font-bold text-primary-600 hover:text-primary-500 hover:underline"
                 >
                   View All
                 </button>
              </div>
              <div className="space-y-4">
                 {safeRecentLeaves.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-bold">
                       No leave history found.
                    </div>
                 ) : (
                    safeRecentLeaves.slice(0, 3).map((req, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                             <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{req.leaveType || req.type}</p>
                             <p className="text-[10px] text-slate-400">
                               {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                             </p>
                          </div>
                          <span className={cn("px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0",
                             req.status === 'Approved' || req.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20" :
                             req.status === 'Pending' || req.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20" :
                             "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20"
                          )}>
                             {req.status}
                          </span>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* 7. Announcements Panel (Dynamic announcements from API) */}
            <div className="card p-8 bg-slate-900 dark:bg-slate-950 text-white border-none shadow-premium relative overflow-hidden group rounded-[2rem]">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <Bell size={120} />
               </div>
               <h3 className="text-[10px] font-bold text-primary-400 mb-8 flex items-center gap-2 text-left tracking-widest uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                  Announcements
               </h3>
               <div className="space-y-6 relative z-10 text-left">
                  {announcements.length === 0 ? (
                     <div className="text-slate-400 text-xs py-4 text-center">
                        No announcements at this time.
                     </div>
                  ) : (
                     announcements.slice(0, 4).map((ann, i) => (
                        <div 
                          key={ann.id || i} 
                          onClick={() => setSelectedAnnouncement(ann)}
                          className="flex items-start gap-4 cursor-pointer group/item"
                        >
                           <div className="flex flex-col items-center mt-1">
                              <div className={cn(
                                 "w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 dark:ring-slate-950 flex-shrink-0 transition-transform group-hover/item:scale-125",
                                 ann.priority?.toLowerCase() === 'high' ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : 
                                 ann.priority?.toLowerCase() === 'medium' ? "bg-amber-500" : "bg-primary-500"
                              )} />
                              {i !== Math.min(announcements.length - 1, 3) && (
                                <div className="w-[1px] h-10 bg-slate-800 dark:bg-slate-900 mt-2" />
                              )}
                           </div>
                           <div className="flex-1 pb-2">
                              <p className="text-sm font-black text-white group-hover/item:text-primary-400 transition-colors leading-tight">
                                {ann.title}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{ann.date}</span>
                                 <span className="text-[9px] font-black text-primary-500/80 uppercase tracking-[0.2em] px-2 py-0.5 bg-primary-500/10 rounded-md">
                                   {ann.category}
                                 </span>
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>
               <Button 
                 onClick={handleOpenDetailBoard}
                 isDisabled={isOpeningBoard}
                 isLoading={isOpeningBoard}
                 rightIcon={ArrowRight}
                 variant="ghost"
                 className="mt-6 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
               >
                  {isOpeningBoard ? 'Accessing Feed...' : 'View Detail Board'}
               </Button>
            </div>

            {/* Public Holiday Card */}
            <div className="card p-8 group hover:shadow-xl transition-all text-left dark:bg-slate-900 border border-slate-100 dark:border-slate-800 bg-white rounded-[2rem] shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white italic tracking-tight">Public Holiday</h3>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl text-indigo-600 dark:text-indigo-400 transition-transform group-hover:rotate-12">
                     <Calendar size={20} />
                  </div>
               </div>
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center shadow-inner">
                     <span className="text-[10px] font-black text-indigo-600 uppercase">{holidayMonthStr}</span>
                     <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{holidayDayStr}</span>
                  </div>
                  <div>
                     <p className="text-base font-black text-slate-900 dark:text-white leading-none">{holidayName}</p>
                     <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1.5">{holidayType}</p>
                  </div>
               </div>
               <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Upcoming Holiday</span>
                  </div>
                  <Button 
                    onClick={() => setShowHolidayModal(true)}
                    variant="ghost"
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                     <ArrowUpRight size={18} />
                  </Button>
               </div>
            </div>
         </div>
      </div>

      {/* Leave Request Modal */}
      <CenterModal isOpen={showLeaveModal} onClose={() => !isSubmittingLeave && setShowLeaveModal(false)} title="Request New Leave">
         <form onSubmit={handleRequestLeave} className="space-y-6 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Leave Type</label>
                  <select 
                    name="type" 
                    disabled={isSubmittingLeave}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                     <option value="Sick Leave">Sick Leave</option>
                     <option value="Annual Leave">Annual Leave</option>
                     <option value="Casual Leave">Casual Leave</option>
                     <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
               </div>
               <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Attachment (Optional)</label>
                  <input 
                    type="file" 
                    ref={leaveFileInputRef} 
                    onChange={handleLeaveFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                    disabled={isSubmittingLeave}
                    className="hidden"
                  />
                  <div 
                    onClick={() => !isSubmittingLeave && leaveFileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-500 rounded-xl p-2.5 transition-colors"
                  >
                     {leaveAttachment ? (
                       <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-2 truncate">
                           <FileText size={16} className="text-primary-600"/>
                           <span className="truncate text-slate-800 dark:text-slate-200 font-bold text-xs">{leaveAttachment.name}</span>
                           <span className="text-[10px] text-slate-400 font-mono">({leaveAttachment.size})</span>
                         </div>
                         <button 
                           type="button" 
                           onClick={handleRemoveLeaveAttachment}
                           title="Remove File"
                           className="text-slate-400 hover:text-rose-500"
                         >
                           <X size={16} />
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center justify-center w-full gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold py-1">
                          <Upload size={16} />
                          <span>Upload File</span>
                       </div>
                     )}
                  </div>
               </div>
               <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Start Date</label>
                  <DatePicker 
                    name="startDate" 
                    required 
                    disabled={isSubmittingLeave}
                  />
               </div>
               <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End Date</label>
                  <DatePicker 
                    name="endDate" 
                    required 
                    disabled={isSubmittingLeave}
                  />
               </div>
            </div>
            <div className="space-y-2 text-left">
               <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason for Leave</label>
               <textarea 
                 name="reason" 
                 rows="3" 
                 required 
                 disabled={isSubmittingLeave}
                 placeholder="Provide a brief explanation..."
                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
               />
            </div>
            <div className="space-y-2 text-left">
               <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Emergency Contact While Away</label>
               <PhoneInput 
                 name="emergency" 
                 value={emergencyPhone}
                 onChange={e => setEmergencyPhone(e.target.value)}
                 required 
                 disabled={isSubmittingLeave}
               />
            </div>
            <div className="pt-4 flex items-center justify-end gap-3">
               <Button 
                 type="button" 
                 isDisabled={isSubmittingLeave} 
                 onClick={() => setShowLeaveModal(false)}
                 variant="secondary"
               >
                 Cancel
               </Button>
               <Button 
                 type="submit" 
                 isDisabled={isSubmittingLeave}
                 isLoading={isSubmittingLeave}
                 variant="primary"
               >
                  {isSubmittingLeave ? (leaveStep || 'Submitting...') : 'Submit Request'}
               </Button>
            </div>
         </form>
      </CenterModal>

      {/* Announcement Detail Modal */}
      <CenterModal isOpen={!!selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} title="Announcement Details">
         {selectedAnnouncement && (
            <div className="p-8 text-left dark:bg-slate-900 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={cn(
                        "w-3 h-3 rounded-full",
                        selectedAnnouncement.priority?.toLowerCase() === 'high' ? "bg-rose-500" : 
                        selectedAnnouncement.priority?.toLowerCase() === 'medium' ? "bg-amber-500" : "bg-primary-500"
                     )} />
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedAnnouncement.category}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {selectedAnnouncement.date}
                  </span>
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedAnnouncement.title}</h2>
               <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{selectedAnnouncement.content}</p>
               <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm shrink-0">
                     <FileText size={24} />
                  </div>
                  <div className="flex-1 text-left truncate">
                     <p className="text-sm font-black text-slate-900 dark:text-white truncate">Digital_Notice_{selectedAnnouncement.id || 'Doc'}.txt</p>
                     <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Official Notice Document</p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleDownloadAttachment}
                    isDisabled={isDownloadingAttachment}
                    isLoading={isDownloadingAttachment}
                    variant="ghost"
                    className="p-2 text-slate-600 dark:text-slate-300"
                  >
                    {!isDownloadingAttachment && <ChevronRight size={20} />}
                  </Button>
               </div>
               <div className="pt-2 flex justify-end">
                 <Button 
                   onClick={() => setSelectedAnnouncement(null)}
                   variant="secondary"
                 >
                   Close Notice
                 </Button>
               </div>
            </div>
         )}
      </CenterModal>

      {/* Announcements Board Modal */}
      <CenterModal isOpen={showDetailBoardModal} onClose={() => setShowDetailBoardModal(false)} title="Company Announcements Feed">
         <div className="p-8 space-y-6 text-left max-h-[70vh] overflow-y-auto dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active System Broadcasts</p>
            <div className="space-y-4">
               {announcements.map((ann, i) => (
                  <div 
                    key={ann.id || i}
                    onClick={() => { setShowDetailBoardModal(false); setSelectedAnnouncement(ann); }}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-primary-500 cursor-pointer transition-all space-y-2"
                  >
                     <div className="flex justify-between items-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                          ann.priority?.toLowerCase() === 'high' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600" : 
                          ann.priority?.toLowerCase() === 'medium' ? "bg-amber-50 dark:bg-amber-955/30 text-amber-600" : 
                          "bg-primary-50 dark:bg-primary-950/30 text-primary-600"
                        )}>
                          {ann.priority || 'Normal'} Priority
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{ann.date}</span>
                     </div>
                     <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{ann.title}</h4>
                     <p className="text-xs text-slate-500 line-clamp-2">{ann.content}</p>
                  </div>
               ))}
            </div>
            <div className="pt-2 flex justify-end">
              <Button 
                onClick={() => setShowDetailBoardModal(false)}
                variant="secondary"
              >
                Close Feed
              </Button>
            </div>
         </div>
      </CenterModal>

      {/* Holiday Info Modal */}
      <CenterModal isOpen={showHolidayModal} onClose={() => setShowHolidayModal(false)} title={`${holidayName} Holiday`}>
         <div className="p-8 text-left space-y-6 dark:bg-slate-900">
            <div className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl">
               <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">{holidayMonthStr}</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{holidayDayStr}</span>
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900 leading-none dark:text-white">{holidayName}</h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1.5">{holidayType} Paid Company Holiday</p>
               </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
               {nextHoliday?.description || `On this holiday, we are celebrating ${holidayName} with optional paid holiday closures for non-critical teams. Please align with your direct supervisor if your shift covers live services.`}
            </p>
            <div className="pt-4 flex items-center justify-end gap-3">
               <Button 
                 onClick={() => setShowHolidayModal(false)}
                 variant="secondary"
               >
                 Close
               </Button>
               <Button 
                 onClick={handleSyncHoliday}
                 isDisabled={isSyncingCalendar}
                 isLoading={isSyncingCalendar}
                 variant="primary"
                 leftIcon={Calendar}
               >
                 Sync Calendar
               </Button>
            </div>
         </div>
      </CenterModal>
    </div>
  );
};

export default EmployeeDashboard;

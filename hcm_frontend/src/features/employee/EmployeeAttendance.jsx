import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Coffee, 
  LogIn, 
  LogOut, 
  MapPin, 
  Monitor, 
  CalendarDays,
  Play,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Timer,
  Download,
  Loader2,
  Search,
  Zap,
  X,
  RotateCcw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import { StatCard } from '../../components/common';
import Button from '../../shared/components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../shared/components/ui/PageHeader';
import CenterModal from '../../shared/components/layout/CenterModal';
import { useDateFormat } from '../../hooks/useDateFormat';
import { employeeService } from '../../services/employee.service';

const EmployeeAttendance = () => {
  const { attendance, clockIn, clockOut, showToast, refetch, profile, holidays, leaves, loading, error, refetchAll } = useEmployee();
  const { formatDate } = useDateFormat();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [mode, setMode] = useState('Office');
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Live session state from backend
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Expanded Calendar Modal States
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 1. Fetch current live attendance from backend
  const fetchCurrentAttendance = useCallback(async () => {
    try {
      setIsLoadingSession(true);
      const res = await employeeService.getCurrentAttendance();
      const data = res.data?.data || res.data || {};
      setCurrentSession(data);
    } catch {
      // Handled silently
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // 2. Fetch attendance on mount and on filter changes
  useEffect(() => {
    fetchCurrentAttendance();
    const params = {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    };
    if (startDateFilter) params.startDate = startDateFilter;
    if (endDateFilter) params.endDate = endDateFilter;
    if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
    refetch.fetchAttendance(params);
  }, [currentDate, startDateFilter, endDateFilter, statusFilter, fetchCurrentAttendance]);

  // 3. Real-time active session timer derived strictly from backend timestamp
  useEffect(() => {
    let interval;
    const isClockedIn = currentSession?.isClockedIn !== undefined ? currentSession.isClockedIn : attendance.isClockedIn;
    const checkInTime = currentSession?.checkInTime || attendance.clockInTime;

    if (isClockedIn && checkInTime) {
      const calcTimer = () => {
        if (!isOnBreak) {
          const startTimeMs = new Date(checkInTime).getTime();
          const nowMs = Date.now();
          const elapsed = Math.max(0, Math.floor((nowMs - startTimeMs) / 1000));
          setWorkedSeconds(elapsed);
        }
      };
      calcTimer();
      interval = setInterval(calcTimer, 1000);
    } else {
      const initialSec = currentSession?.workingDuration !== undefined 
        ? currentSession.workingDuration 
        : (attendance.workingDuration || 0);
      setWorkedSeconds(initialSec);
      setIsOnBreak(false);
    }

    return () => clearInterval(interval);
  }, [currentSession?.isClockedIn, currentSession?.checkInTime, currentSession?.workingDuration, attendance.isClockedIn, attendance.clockInTime, attendance.workingDuration, isOnBreak]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  // Expanded Calendar Modal Month Navigation
  const handleCalendarPrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleCalendarNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Expanded Calendar Calculations (Present, Absent, Late, Leave)
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIdx = calendarMonth.getMonth();
  const calendarMonthName = calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(calendarYear, calendarMonthIdx, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonthIdx + 1, 0).getDate();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ isPadding: true, key: `pad-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(calendarYear, calendarMonthIdx, day);
    const dateStr = `${calendarYear}-${String(calendarMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = cellDate.getDay();
    let isWeekend = false;
    let weekendType = '';
    
    if (profile?.weekends) {
      const dayNamesMap = { 0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
      const wk = profile.weekends.find(w => {
        const wStr = String(w.dayOfWeek).toUpperCase();
        return wStr === dayNamesMap[dayOfWeek] || wStr === String(dayOfWeek);
      });
      if (wk) {
        isWeekend = true;
        weekendType = wk.type;
      }
    } else {
      isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      weekendType = 'FullDay';
    }

    const record = (attendance.history || []).find(h => {
      if (!h) return false;
      const hDate = new Date(h.rawDate || h.date);
      return hDate.getFullYear() === calendarYear &&
             hDate.getMonth() === calendarMonthIdx &&
             hDate.getDate() === day;
    });

    const isHoliday = holidays?.some(h => new Date(h.date).toDateString() === cellDate.toDateString());
    const isApprovedLeave = leaves?.requests?.some(l => {
      if (l.status !== 'Approved') return false;
      const s = new Date(l.rawStartDate || l.startDate);
      const e = new Date(l.rawEndDate || l.endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return cellDate >= s && cellDate <= e;
    });

    const isPast = cellDate < todayStart;

    let status = 'Not Logged';
    let bgClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-slate-800';
    let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

    if (record && record.status === 'Present') {
      status = 'Present';
      bgClass = 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40';
      badgeClass = 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
    } else if (record && record.status === 'Late') {
      status = 'Late';
      bgClass = 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40';
      badgeClass = 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
    } else if (isApprovedLeave || (record && ['Leave', 'Sick Leave', 'Annual Leave'].includes(record.status))) {
      status = 'Leave';
      bgClass = 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40';
      badgeClass = 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300';
    } else if (isHoliday) {
      status = 'Holiday';
      bgClass = 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40';
      badgeClass = 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300';
    } else if (isWeekend) {
      status = weekendType === 'HALF_DAY' ? 'Weekend (Half Day)' : 'Weekend';
      bgClass = 'bg-slate-100/50 dark:bg-slate-850/40 border-slate-200/50 dark:border-slate-800/50';
      badgeClass = 'bg-slate-200/60 dark:bg-slate-800 text-slate-500';
    } else if (record && record.status === 'Absent') {
      status = 'Absent';
      bgClass = 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40';
      badgeClass = 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300';
    } else if (isPast && !isWeekend && !isHoliday && !record && !isApprovedLeave) {
      status = 'Absent';
      bgClass = 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40';
      badgeClass = 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300';
    }

    calendarCells.push({
      isPadding: false,
      day,
      dateStr,
      dateObj: cellDate,
      record,
      status,
      isWeekend,
      bgClass,
      badgeClass,
      key: `day-${day}`
    });
  }

  const currentMonthYearStr = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // History Filtered records
  const filteredHistory = (attendance.history || []).filter(item => {
    if (!item) return false;
    const matchesSearch = !searchTerm || 
                          (item.status || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.mode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.date || '').toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesStatus = statusFilter === 'All' || !statusFilter || item.status === statusFilter;

    const itemDate = new Date(item.rawDate || item.date);
    itemDate.setHours(0, 0, 0, 0);

    let matchesDateRange = true;
    if (startDateFilter) {
      const sDate = new Date(startDateFilter);
      sDate.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && (itemDate >= sDate);
    }
    if (endDateFilter) {
      const eDate = new Date(endDateFilter);
      eDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && (itemDate <= eDate);
    }

    const matchesMonth = startDateFilter || endDateFilter ? true : (
      itemDate.getMonth() === currentDate.getMonth() && 
      itemDate.getFullYear() === currentDate.getFullYear()
    );
                         
    return matchesSearch && matchesStatus && matchesMonth && matchesDateRange;
  });

  // Calculate or derive Summary Stats
  const totalPresentDays = useMemo(() => {
    if (attendance.summary?.presentDays !== undefined && !searchTerm && !startDateFilter && !endDateFilter && statusFilter === 'All') {
      return attendance.summary.presentDays;
    }
    return filteredHistory.reduce((total, h) => {
      if (h.status === 'Present' || h.status === 'Late') {
        return total + (h.isHalfDay ? 0.5 : 1);
      }
      return total;
    }, 0);
  }, [attendance.summary, filteredHistory, searchTerm, startDateFilter, endDateFilter, statusFilter]);

  const lateIncidents = useMemo(() => {
    if (attendance.summary?.lateDays !== undefined && !searchTerm && !startDateFilter && !endDateFilter && statusFilter === 'All') {
      return attendance.summary.lateDays;
    }
    return filteredHistory.filter(h => h.status === 'Late').length;
  }, [attendance.summary, filteredHistory, searchTerm, startDateFilter, endDateFilter, statusFilter]);

  const totalHoursSum = useMemo(() => {
    if (attendance.summary?.totalWorkedHours !== undefined && !searchTerm && !startDateFilter && !endDateFilter && statusFilter === 'All') {
      return attendance.summary.totalWorkedHours.toFixed(1);
    }
    let sum = 0;
    filteredHistory.forEach(h => {
      const hrs = parseFloat(h.totalHours || 0);
      sum += hrs;
    });
    return sum.toFixed(1);
  }, [attendance.summary, filteredHistory, searchTerm, startDateFilter, endDateFilter, statusFilter]);

  const overtimeMarked = useMemo(() => {
    if (attendance.summary?.overtimeLogs !== undefined && !searchTerm && !startDateFilter && !endDateFilter && statusFilter === 'All') {
      return attendance.summary.overtimeLogs;
    }
    return filteredHistory.filter(h => parseFloat(h.overtimeMinutes || h.overtime || 0) > 0).length;
  }, [attendance.summary, filteredHistory, searchTerm, startDateFilter, endDateFilter, statusFilter]);

  const stats = [
    { label: 'Present Days', value: totalPresentDays, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Late Marking', value: lateIncidents, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Total Worked Hours', value: `${totalHoursSum} hrs`, icon: Timer, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Overtime Logs', value: `${overtimeMarked} Days`, icon: Zap, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
  ];

  const handleExport = () => {
    if (filteredHistory.length === 0) {
      showToast('No attendance records to export', 'error');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Date,Mode,Punch In,Punch Out,Status,Activity\n";
    filteredHistory.forEach(item => {
      csvContent += `"${item.date}","${item.mode}","${item.clockIn}","${item.clockOut}","${item.status}","${item.formattedTotalHours || item.totalHours || '-'}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${currentMonthYearStr.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance report exported successfully');
  };

  const handleClockIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await clockIn(mode);
      await fetchCurrentAttendance();
      await refetch.fetchAttendance();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to clock in', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await clockOut();
      await fetchCurrentAttendance();
      await refetch.fetchAttendance();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to clock out', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBreak = () => {
    const isClockedIn = currentSession?.isClockedIn !== undefined ? currentSession.isClockedIn : attendance.isClockedIn;
    if (!isClockedIn) {
      showToast('Start a work session first to take a break', 'error');
      return;
    }
    setIsOnBreak(!isOnBreak);
    showToast(isOnBreak ? 'Resuming work session' : 'Coffee break started');
  };

  const isSessionActive = currentSession?.isClockedIn !== undefined ? currentSession.isClockedIn : attendance.isClockedIn;
  const activeMode = currentSession?.mode || attendance.mode || mode;
  const shiftData = currentSession?.shift || profile?.shift;

  if (error) {
    return (
      <div className="px-4 sm:px-0 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <AlertCircle className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to Load Attendance Tracker</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button onClick={refetchAll} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="space-y-8 pb-12 animate-fade-in px-4 sm:px-0">
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-indigo-100 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading Attendance Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in relative px-4 sm:px-0 text-left">
      {/* Header Section */}
      <PageHeader 
        title="Time & Attendance"
        subtitle={`Real-time work session tracking and historical records (${localTimezone})`}
      >
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport} 
            isDisabled={isSubmitting}
            variant="secondary"
            leftIcon={Download}
          >
            Export
          </Button>
          {isSessionActive ? (
            <Button 
              onClick={handleClockOut} 
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              variant="danger"
              leftIcon={LogOut}
            >
              Clock Out
            </Button>
          ) : (
            <Button 
              onClick={handleClockIn} 
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              variant="primary"
              leftIcon={LogIn}
            >
              Clock In
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Stats Cards Section */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Live Controls & Summary */}
        <div className="lg:col-span-4 space-y-6">
           <div className="card p-8 bg-slate-900 dark:bg-slate-950 text-white border-none shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <Clock size={150} />
              </div>
              <p className="text-[10px] font-bold text-primary-400 mb-8">Active Work Session</p>
              
              <div className="text-center mb-10 py-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl relative z-10">
                 <h4 className={cn("text-5xl font-black tracking-tighter mb-3 tabular-nums transition-colors duration-300", isOnBreak ? "text-orange-400" : "text-white")}>{formatTime(workedSeconds)}</h4>
                 <p className="text-[10px] font-bold text-slate-400 font-bold">
                   {isSessionActive ? (isOnBreak ? 'On Coffee Break' : 'Timer Active') : 'Start Session to Track Time'}
                 </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                 <button 
                   onClick={toggleBreak} 
                   className={cn(
                     "flex flex-col items-center justify-center p-4 rounded-xl transition-all shadow-md group/btn",
                     isOnBreak 
                       ? "bg-amber-500 text-white shadow-amber-500/20" 
                       : "bg-white text-slate-900 hover:bg-slate-50"
                   )}
                 >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform", isOnBreak ? "bg-white/20 text-white" : "bg-orange-500/15 text-orange-500")}>
                       <Coffee size={24} />
                    </div>
                    <span className="text-[11px] font-bold leading-none">{isOnBreak ? "Resume" : "Coffee Break"}</span>
                 </button>

                 <div className="relative group/mode">
                    <button 
                      disabled={isSessionActive}
                      className="w-full flex flex-col items-center justify-center p-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all disabled:opacity-90"
                    >
                       <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1 group-hover/mode:rotate-12 transition-transform">
                          <Monitor size={24} />
                       </div>
                       <span className="text-[11px] font-bold leading-none">
                         {isSessionActive ? `${activeMode} (Active)` : `${mode} Mode`}
                       </span>
                    </button>
                    {!isSessionActive && (
                      <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 opacity-0 group-hover/mode:opacity-100 pointer-events-none group-hover/mode:pointer-events-auto transition-all p-1 transform translate-y-2 group-hover/mode:translate-y-0 z-20">
                         {['Office', 'Remote', 'Hybrid'].map(m => (
                            <button 
                              key={m} 
                              onClick={() => { setMode(m); showToast(`Work mode changed to ${m}`); }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              {m}
                            </button>
                         ))}
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Shift Information Card */}
           <div className="card">
              <h3 className="card-title mb-2 uppercase tracking-wide text-xs">
                {shiftData?.name || 'MORNING SHIFT'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-bold mb-6">
                {shiftData?.workingHoursMin ? `${Math.floor(shiftData.workingHoursMin / 60)}h ${shiftData.workingHoursMin % 60}m shift` : '8h 0m shift'} • {shiftData?.breakDurationMin || 60}m break • {shiftData?.graceInMin || 15}m grace
              </p>
              <div className="space-y-8 relative ml-4 pl-8 border-l-2 border-slate-100 dark:border-slate-800">
                 {(() => {
                   const startTime = shiftData?.startTime || '09:00';
                   const endTime = shiftData?.endTime || '18:00';
                   const breakDuration = shiftData?.breakDurationMin || 60;

                   const [startH, startM] = startTime.split(':').map(Number);
                   const [endH, endM] = endTime.split(':').map(Number);
                   const startTotalMin = startH * 60 + startM;
                   const endTotalMin = endH * 60 + endM;
                   const breakStartMin = Math.floor((startTotalMin + endTotalMin) / 2) - Math.floor(breakDuration / 2);
                   const breakH = Math.floor(breakStartMin / 60);
                   const breakM = breakStartMin % 60;

                   const fmt = (h, m) => {
                     const ampm = h >= 12 ? 'PM' : 'AM';
                     const h12 = h % 12 || 12;
                     return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                   };

                   const items = [
                     { time: fmt(startH, startM), label: 'Shift Start', icon: Play, color: 'bg-primary-600' },
                     { time: fmt(breakH, breakM), label: `Break (${breakDuration}m)`, icon: Coffee, color: 'bg-rose-500' },
                     { time: fmt(endH, endM), label: 'Shift End', icon: LogOut, color: 'bg-indigo-600' },
                   ];

                   return items.map((log, i) => (
                     <div key={i} className="relative flex items-center">
                        <div className={cn(
                          "absolute -left-[53px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-white",
                          log.color
                        )}>
                           <log.icon size={18} />
                        </div>
                        <div className="text-left">
                           <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{log.time}</p>
                           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 font-bold mt-1.5">{log.label}</p>
                        </div>
                     </div>
                   ));
                 })()}
              </div>
           </div>
        </div>

        {/* History Area */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Enhanced Card Header & Toolbar */}
           <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
              
              {/* Row 1: Header Title + Month Navigation & Calendar Expand */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs border border-indigo-100/50 dark:border-indigo-900/30 shrink-0">
                       <Clock size={22} />
                    </div>
                    <div>
                       <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Attendance History</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                             {filteredHistory.length} {filteredHistory.length === 1 ? 'log' : 'logs'}
                          </span>
                       </div>
                       <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                          {startDateFilter || endDateFilter 
                            ? `Custom range: ${startDateFilter || 'Earliest'} → ${endDateFilter || 'Latest'}`
                            : `Filtered records for ${currentMonthYearStr}`
                          }
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    {/* Month Navigator Stepper */}
                    <div className="inline-flex items-center bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                       <button 
                         onClick={handlePrevMonth}
                         title="Previous Month"
                         className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
                       >
                          <ChevronLeft size={16} />
                       </button>
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-3 min-w-[105px] text-center select-none">
                          {currentMonthYearStr}
                       </span>
                       <button 
                         onClick={handleNextMonth}
                         title="Next Month"
                         className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
                       >
                          <ChevronRight size={16} />
                       </button>
                    </div>

                    {/* Quick Expand Calendar Button */}
                    <Button 
                       onClick={() => setIsCalendarModalOpen(true)}
                       variant="secondary"
                       leftIcon={CalendarDays}
                    >
                       Calendar
                    </Button>
                 </div>
              </div>

              {/* Row 2: Search, Date Filter Range, Status Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 items-center">
                 
                 {/* Search Input */}
                 <div className="md:col-span-4 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
                    <input 
                      type="text" 
                      placeholder="Search status, mode..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    {searchTerm && (
                       <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                       >
                          <X size={13} />
                       </button>
                    )}
                 </div>

                 {/* Date Range Controls */}
                 <div className="md:col-span-5 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 px-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <Calendar size={14} className="text-slate-400 shrink-0"/>
                    <input 
                      type="date" 
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      title="From Date"
                      className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none w-full"
                    />
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1 shrink-0">to</span>
                    <input 
                      type="date" 
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      title="To Date"
                      className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none w-full"
                    />
                    {(startDateFilter || endDateFilter) && (
                       <button 
                          onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                          title="Reset Date Range"
                          className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline shrink-0"
                       >
                         Reset
                       </button>
                    )}
                 </div>

                 {/* Status Filter Dropdown */}
                 <div className="md:col-span-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                       <option value="All">All Statuses</option>
                       <option value="Present">Present Only</option>
                       <option value="Late">Late Incidents</option>
                       <option value="Leave">On Leave</option>
                       <option value="Absent">Absent</option>
                    </select>
                 </div>

              </div>

              {/* Active Filter Badges */}
              {(searchTerm || startDateFilter || endDateFilter || statusFilter !== 'All') && (
                 <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 dark:border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                       <span className="text-[11px] font-bold text-slate-400">Active Filters:</span>
                       {searchTerm && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                             Search: "{searchTerm}"
                             <button type="button" onClick={() => setSearchTerm('')} className="hover:opacity-75 cursor-pointer ml-0.5 inline-flex items-center"><X size={12} /></button>
                          </span>
                       )}
                       {(startDateFilter || endDateFilter) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                             {startDateFilter || 'Start'} → {endDateFilter || 'End'}
                             <button type="button" onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} className="hover:opacity-75 cursor-pointer ml-0.5 inline-flex items-center"><X size={12} /></button>
                          </span>
                       )}
                       {statusFilter !== 'All' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                             Status: {statusFilter}
                             <button type="button" onClick={() => setStatusFilter('All')} className="hover:opacity-75 cursor-pointer ml-0.5 inline-flex items-center"><X size={12} /></button>
                          </span>
                       )}
                    </div>
                    <button 
                       onClick={() => {
                         setSearchTerm('');
                         setStartDateFilter('');
                         setEndDateFilter('');
                         setStatusFilter('All');
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                       <RotateCcw size={12} />
                       <span>Clear All</span>
                    </button>
                 </div>
              )}
           </div>

           {/* Desktop View: Attendance Table (hidden on mobile screens) */}
           <div className="hidden md:block hcm-table-container">
              <table className="hcm-table">
                 <thead className="hcm-thead">
                    <tr className="hcm-tr">
                       <th className="hcm-th px-8">Date</th>
                       <th className="hcm-th px-8">Mode</th>
                       <th className="hcm-th px-8 text-center">Registry (In/Out)</th>
                       <th className="hcm-th px-8 text-center">Status</th>
                       <th className="hcm-th px-8 text-right">Activity</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredHistory.length > 0 ? filteredHistory.map((item, i) => (
                       <tr key={i}>
                          <td className="hcm-td px-8 py-6">
                             <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(item.date)}</p>
                             {item.lateMinutes > 0 && (
                                <span className="text-[9px] text-amber-500 font-bold block mt-1">
                                   Late: {item.lateMinutes} mins
                                </span>
                             )}
                             {item.earlyExitMinutes > 0 && (
                                <span className="text-[9px] text-rose-500 font-bold block mt-1">
                                   Early Exit: {item.earlyExitMinutes} mins
                                </span>
                             )}
                          </td>
                          <td className="hcm-td px-8 py-6">
                             <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500">
                                   {item.mode === 'Remote' ? <Monitor size={12} /> : <MapPin size={12} />}
                                </div>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 font-bold">{item.mode}</span>
                             </div>
                          </td>
                          <td className="hcm-td px-8 py-6 text-center">
                             <div className="flex items-center justify-center gap-5">
                                <div>
                                   <p className="text-[8px] font-black text-slate-300 dark:text-slate-500 font-bold mb-1.5">Punch In</p>
                                   <p className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">{item.clockIn}</p>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 dark:text-slate-600"/>
                                <div>
                                   <p className="text-[8px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-1.5">Punch Out</p>
                                   <p className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">{item.clockOut || '--:--'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="hcm-td px-8 py-6 text-center">
                             <span className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                item.status === 'Present' 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                                  : item.status === 'Late'
                                  ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                  : item.status === 'Absent'
                                  ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                             )}>
                                {item.status}
                             </span>
                          </td>
                          <td className="hcm-td px-8 py-6 text-right">
                             <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.formattedTotalHours || item.totalHours || '-'}</p>
                          </td>
                       </tr>
                    )) : (
                       <tr className="hcm-tr">
                           <td colSpan="5" className="px-8 py-10 hcm-td">
                              <EmptyState 
                                icon={Clock} 
                                title={`No records found for ${currentMonthYearStr}`}
                                description=""
                              />
                           </td>
                        </tr>
                    )}
                 </tbody>
              </table>
           </div>

           {/* Mobile View: Attendance Cards (visible only on mobile screens) */}
           <div className="block md:hidden space-y-4">
              {filteredHistory.length > 0 ? filteredHistory.map((item, i) => (
                 <div key={i} className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 text-left">
                    {/* Top Row: Date & Status Badge */}
                    <div className="flex items-center justify-between gap-3">
                       <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(item.date)}</p>
                          {item.lateMinutes > 0 && (
                             <span className="text-[10px] text-amber-500 font-bold block mt-0.5">
                                Late: {item.lateMinutes} mins
                             </span>
                          )}
                          {item.earlyExitMinutes > 0 && (
                             <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                                Early Exit: {item.earlyExitMinutes} mins
                             </span>
                          )}
                       </div>
                       <span className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                          item.status === 'Present' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                            : item.status === 'Late'
                            ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                            : item.status === 'Absent'
                            ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                            : "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                       )}>
                          {item.status}
                       </span>
                    </div>

                    {/* Middle Row: Mode & Activity */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                       <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500">
                             {item.mode === 'Remote' ? <Monitor size={13} /> : <MapPin size={13} />}
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.mode}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block">Activity</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.formattedTotalHours || item.totalHours || '-'}</span>
                       </div>
                    </div>

                    {/* Bottom Row: Punch In & Punch Out */}
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl flex items-center justify-around text-center">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Punch In</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{item.clockIn}</p>
                       </div>
                       <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Punch Out</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{item.clockOut || '--:--'}</p>
                       </div>
                    </div>
                 </div>
              )) : (
                 <div className="p-2 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                     <EmptyState 
                       icon={Clock} 
                       title={`No records found for ${currentMonthYearStr}`}
                       description=""
                     />
                  </div>
              )}
           </div>

           {/* Mobile Calendar Hint */}
           <div className="card p-10 bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-none shadow-premium flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute -left-10 -bottom-10 opacity-10 rotate-12 pointer-events-none">
                 <CalendarDays size={200} />
              </div>
              <div className="space-y-2 relative z-10 text-center md:text-left">
                 <h4 className="text-2xl font-black italic tracking-tight">Full Calendar Intelligence</h4>
                 <p className="text-primary-100/80 text-xs font-bold">Visual heatmaps and behavior tracking of your work cycle</p>
              </div>
              <Button 
                onClick={() => setIsCalendarModalOpen(true)}
                variant="secondary"
                leftIcon={CalendarDays}
                className="relative z-10"
              >
                 Expand Calendar
              </Button>
           </div>
        </div>
      </div>

      {/* Expanded Attendance Calendar Modal */}
      <CenterModal 
        isOpen={isCalendarModalOpen} 
        onClose={() => { setIsCalendarModalOpen(false); setSelectedDayDetail(null); }} 
        title={`Attendance Calendar — ${calendarMonthName}`}
        maxWidth="max-w-5xl"
      >
         <div className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 text-left">
            {/* Month Control & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={handleCalendarPrevMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"
                  >
                     <ChevronLeft size={20} />
                  </button>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-bold min-w-[150px] text-center">
                    {calendarMonthName}
                  </span>
                  <button 
                    onClick={handleCalendarNextMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-500 transition-colors"
                  >
                     <ChevronRight size={20} />
                  </button>
               </div>

               <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                     <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                     <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                     <span className="w-2 h-2 rounded-full bg-indigo-500" /> Leave
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                     <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                     <span className="w-2 h-2 rounded-full bg-slate-400" /> Weekend
                  </span>
               </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 dark:text-slate-500 font-bold py-2 border-b border-slate-100 dark:border-slate-800">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d}>{d}</div>
               ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
               {calendarCells.map((cell) => {
                  if (cell.isPadding) {
                     return <div key={cell.key}/>;
                  }

                  const isSelected = selectedDayDetail?.dateStr === cell.dateStr;

                  return (
                     <div 
                       key={cell.key}
                       onClick={() => setSelectedDayDetail(cell)}
                       className={cn(
                          "h-24 sm:h-28 p-2.5 sm:p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg relative overflow-hidden text-left",
                          cell.bgClass,
                          isSelected ? "ring-2 ring-primary-500 shadow-xl scale-[1.02]" : ""
                       )}
                     >
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{cell.day}</span>
                           <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", cell.badgeClass)}>
                              {cell.status}
                           </span>
                        </div>

                        {cell.record ? (
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                 {cell.record.clockIn} — {cell.record.clockOut}
                              </p>
                              <div className="flex items-center justify-between text-[9px] font-black text-slate-400">
                                 <span>{cell.record.mode}</span>
                                 <span className="text-primary-600 dark:text-primary-400">{cell.record.formattedTotalHours || cell.record.totalHours || '-'}</span>
                              </div>
                           </div>
                        ) : (
                           <p className="text-[10px] font-medium text-slate-400 italic">
                              {cell.isWeekend ? 'Rest Day' : cell.status === 'Absent' ? 'Absent' : 'No Entry'}
                           </p>
                        )}
                     </div>
                  );
               })}
            </div>

            {/* Selected Day Info Popup */}
            {selectedDayDetail && (
               <div className="p-5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div className="space-y-1">
                     <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Details for {selectedDayDetail.dateObj?.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </h4>
                     {selectedDayDetail.record ? (
                        <p className="text-xs text-slate-600 dark:text-slate-350 font-medium">
                           Punch In: <strong className="text-slate-900 dark:text-white">{selectedDayDetail.record.clockIn}</strong> • 
                           Punch Out: <strong className="text-slate-900 dark:text-white">{selectedDayDetail.record.clockOut}</strong> • 
                           Duration: <strong className="text-primary-600 dark:text-primary-400">{selectedDayDetail.record.formattedTotalHours || selectedDayDetail.record.totalHours || '-'}</strong> • 
                           Mode: <strong className="text-slate-900 dark:text-white">{selectedDayDetail.record.mode}</strong>
                        </p>
                     ) : (
                        <p className="text-xs text-slate-500 font-medium">
                           {selectedDayDetail.isWeekend 
                             ? 'Company Weekend Off' 
                             : selectedDayDetail.status === 'Absent' 
                             ? 'Employee marked Absent (no clock-in recorded on this scheduled working day).' 
                             : selectedDayDetail.status === 'Leave' 
                             ? 'Approved leave on this day.'
                             : 'No attendance punch record registered on this date.'}
                        </p>
                     )}
                  </div>
                  <Button 
                     onClick={() => setSelectedDayDetail(null)}
                     variant="secondary"
                  >
                     Close Details
                  </Button>
               </div>
            )}
         </div>
      </CenterModal>
    </div>
  );
};

export default EmployeeAttendance;

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
  Download,
  Settings,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Minus,
  Sun,
  Briefcase,
  AlertCircle,
  Upload,
  Plus,
  Building2,
  Search,
  X,
  RefreshCw,
  Edit3,
  Calendar,
  Filter,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { adminAPI } from '../../utils/apiService';
import ImportModal from '../../shared/components/import/ImportModal';
import { cn } from '../../utils/cn';
import PageHeader from '../../shared/components/ui/PageHeader';

// ============================================================
// Helpers & Toast Event
// ============================================================
const toast = (message, type = 'success') =>
  window.dispatchEvent(new CustomEvent('app_toast', { detail: { message, type } }));

const STATUS_CONFIG = {
  Present: {
    label: 'Present',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  Late: {
    label: 'Late',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500'
  },
  Leave: {
    label: 'On Leave',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500'
  },
  Absent: {
    label: 'Absent',
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Absent;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0", cfg.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      <span>{cfg.label}</span>
    </span>
  );
};

// ============================================================
// Bounded Safe Avatar Component
// ============================================================
const SafeAvatar = ({ src, alt = '', name = '', size = 36, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const isValidUrl = useMemo(() => {
    if (!src || typeof src !== 'string') return false;
    const clean = src.trim();
    if (clean === '' || clean === 'null' || clean === 'undefined' || clean === '[object Object]') return false;
    return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image/');
  }, [src]);

  const initials = useMemo(() => {
    if (!name || typeof name !== 'string') return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden select-none flex items-center justify-center rounded-full bg-slate-800 text-white font-extrabold shadow-xs",
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        maxWidth: `${size}px`,
        minHeight: `${size}px`,
        maxHeight: `${size}px`
      }}
    >
      {isValidUrl && !hasError ? (
        <>
          <img
            src={src}
            alt={alt || name}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: isLoaded ? 'block' : 'none'
            }}
          />
          {!isLoaded && (
            <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>
              {initials}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>
          {initials}
        </span>
      )}
    </div>
  );
};

// ============================================================
// Compact Summary Card
// ============================================================
const SummaryCard = ({ icon: Icon, label, value, pct, colorClass, borderClass, bgClass, sublabel }) => {
  const safePct = isNaN(pct) || pct === undefined ? 0 : Math.min(Math.max(0, pct), 100);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "relative bg-white dark:bg-slate-900 rounded-2xl border p-5 overflow-hidden shadow-xs hover:shadow-md transition-all text-left",
        borderClass
      )}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs", bgClass)}>
          <Icon size={20} className={colorClass.replace('from-', 'text-').split(' ')[0]} />
        </div>
        <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {safePct}%
        </span>
      </div>

      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        {sublabel && (
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {sublabel}
          </span>
        )}
      </div>

      <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${safePct}%` }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================
// Main AttendanceCenter Component
// ============================================================
const AttendanceCenter = () => {
  // Context resolution
  let adminUsers = [];
  let adminDepts = [];
  try {
    const aCtx = useAdmin();
    if (aCtx?.users) adminUsers = aCtx.users;
    if (aCtx?.departments) adminDepts = aCtx.departments;
  } catch (e) { }

  let saUsers = [];
  let saDepts = [];
  try {
    const sCtx = useSuperAdmin();
    if (sCtx?.users) saUsers = sCtx.users;
    if (sCtx?.departments) saDepts = sCtx.departments;
  } catch (e) { }

  const rawUsers = adminUsers.length ? adminUsers : saUsers;
  const departments = adminDepts.length ? adminDepts : saDepts;

  // Filter only active staff/employees
  const employees = useMemo(() => {
    return rawUsers.filter(u => {
      const role = (u.role || '').toLowerCase();
      return u.status === 'Active' && !role.includes('candidate');
    });
  }, [rawUsers]);

  // Selected Date state (defaults to today in YYYY-MM-DD local format)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Filter States
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'leaves'

  // Backend Data States
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [dbShifts, setDbShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  // ── Load Live Data from API ──────────────────────────────
  const loadData = useCallback(async (showToastNotice = false) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [attRes, leaveRes, shiftRes] = await Promise.all([
        adminAPI.getAllAttendance(),
        adminAPI.getAllLeaves(),
        adminAPI.getShifts()
      ]);

      if (attRes.data?.success) {
        setAttendanceLogs(attRes.data.data || []);
      } else if (Array.isArray(attRes.data)) {
        setAttendanceLogs(attRes.data);
      }

      if (leaveRes.data?.success) {
        setLeavesData(leaveRes.data.data || []);
      } else if (Array.isArray(leaveRes.data)) {
        setLeavesData(leaveRes.data);
      }

      if (Array.isArray(shiftRes?.data)) {
        setDbShifts(shiftRes.data);
      } else if (shiftRes?.data?.success) {
        setDbShifts(shiftRes.data.data || []);
      }

      if (showToastNotice) {
        toast('Attendance records refreshed successfully');
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      setApiError('Failed to connect to backend server. Please retry.');
      toast('Failed to load attendance data from server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSetToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const isToday = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return selectedDate === `${yyyy}-${mm}-${dd}`;
  }, [selectedDate]);

  // ── Construct Dynamic Daily Records for All Employees ──────────────────────
  const dailyAttendanceRecords = useMemo(() => {
    return employees.map((emp) => {
      // Find log for this employee on selected date
      const log = attendanceLogs.find(l => {
        const matchesUser = l.userId === emp.userId || l.userId === emp.id;
        if (!matchesUser) return false;
        const logDateStr = new Date(l.date).toISOString().split('T')[0];
        return logDateStr === selectedDate;
      });

      // Check if employee has approved leave on this date
      const hasLeave = leavesData.some(l => {
        const matchesUser = l.userId === emp.userId || l.userId === emp.id;
        if (!matchesUser || (l.status !== 'APPROVED' && l.status !== 'Approved')) return false;
        const start = new Date(l.startDate).toISOString().split('T')[0];
        const end = new Date(l.endDate).toISOString().split('T')[0];
        return selectedDate >= start && selectedDate <= end;
      });

      const empDept = emp.department || emp.employeeProfile?.department?.name || 'General';

      if (log) {
        const cIn = log.clockIn ? new Date(log.clockIn) : null;
        const cOut = log.clockOut ? new Date(log.clockOut) : null;
        const totalMin = log.totalWorkedMin || (cIn && cOut ? Math.max(0, Math.floor((cOut - cIn) / 60000)) : 0);
        const hoursText = totalMin > 0 ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` : (cIn ? 'In Progress' : '—');

        return {
          id: log.id,
          logId: log.id,
          userId: emp.id,
          name: emp.name || emp.fullName,
          employeeId: emp.employeeId || emp.empId || emp.employeeProfile?.employeeId || '—',
          email: emp.email,
          department: empDept,
          clockIn: cIn ? cIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          clockOut: cOut ? cOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          rawClockIn: log.clockIn,
          rawClockOut: log.clockOut,
          hours: hoursText,
          mode: log.mode || 'Office',
          status: log.status || 'Present',
          avatarUrl: emp.avatarUrl || emp.img || null,
          hasLog: true
        };
      }

      if (hasLeave) {
        return {
          id: `leave-${emp.id}`,
          logId: null,
          userId: emp.id,
          name: emp.name || emp.fullName,
          employeeId: emp.employeeId || emp.empId || emp.employeeProfile?.employeeId || '—',
          email: emp.email,
          department: empDept,
          clockIn: '—',
          clockOut: '—',
          rawClockIn: null,
          rawClockOut: null,
          hours: '—',
          mode: 'Leave',
          status: 'Leave',
          avatarUrl: emp.avatarUrl || emp.img || null,
          hasLog: false
        };
      }

      // No record & no leave → Absent
      return {
        id: `absent-${emp.id}`,
        logId: null,
        userId: emp.id,
        name: emp.name || emp.fullName,
        employeeId: emp.employeeId || emp.empId || emp.employeeProfile?.employeeId || '—',
        email: emp.email,
        department: empDept,
        clockIn: '—',
        clockOut: '—',
        rawClockIn: null,
        rawClockOut: null,
        hours: '—',
        mode: 'Office',
        status: 'Absent',
        avatarUrl: emp.avatarUrl || emp.img || null,
        hasLog: false
      };
    });
  }, [employees, attendanceLogs, leavesData, selectedDate]);

  // ── Summary Metrics for Selected Date (Safe against NaN / Div 0) ──────────
  const metrics = useMemo(() => {
    const totalStaff = employees.length;
    const divisor = totalStaff > 0 ? totalStaff : 1;

    const present = dailyAttendanceRecords.filter(r => r.status === 'Present').length;
    const late = dailyAttendanceRecords.filter(r => r.status === 'Late').length;
    const onLeave = dailyAttendanceRecords.filter(r => r.status === 'Leave').length;
    const absent = dailyAttendanceRecords.filter(r => r.status === 'Absent').length;

    return {
      total: totalStaff,
      present,
      late,
      onLeave,
      absent,
      presentPct: totalStaff > 0 ? Math.round(((present + late) / divisor) * 100) : 0,
      latePct: totalStaff > 0 ? Math.round((late / divisor) * 100) : 0,
      leavePct: totalStaff > 0 ? Math.round((onLeave / divisor) * 100) : 0,
      absentPct: totalStaff > 0 ? Math.round((absent / divisor) * 100) : 0,
    };
  }, [dailyAttendanceRecords, employees.length]);

  // ── Filtered Attendance Table ──────────────────────────────
  const filteredRecords = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return dailyAttendanceRecords.filter(r => {
      const matchesSearch = !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.employeeId && r.employeeId.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [dailyAttendanceRecords, tableSearch, statusFilter, deptFilter]);

  // ── Save Manual Record (Create or Edit) ──────────────────────────────
  const handleSaveAttendance = async (formData) => {
    try {
      if (formData.id && formData.hasLog) {
        await adminAPI.updateAttendance(formData.id, {
          status: formData.status,
          mode: formData.mode,
          clockIn: formData.clockIn,
          clockOut: formData.clockOut
        });
        toast('Attendance record updated successfully');
      } else {
        await adminAPI.addManualAttendance({
          userId: formData.userId,
          date: selectedDate,
          clockIn: formData.clockIn,
          clockOut: formData.clockOut,
          status: formData.status,
          mode: formData.mode
        });
        toast('Attendance record created successfully');
      }
      setShowAddModal(false);
      setEditingRecord(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.error?.message || 'Failed to save attendance record', 'error');
    }
  };

  // ── Leave Review Actions ──────────────────────────────
  const handleLeaveReview = async (id, action) => {
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const res = await adminAPI.reviewLeave(id, { status });
      if (res.data?.success) {
        toast(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        await loadData();
      }
    } catch (err) {
      toast('Failed to review leave request', 'error');
    }
  };

  // ── CSV Export ──────────────────────────────
  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast('No attendance records found to export', 'error');
      return;
    }

    const headers = ['Date', 'Employee Name', 'Employee ID', 'Department', 'Clock In', 'Clock Out', 'Hours', 'Mode', 'Status'];
    const rows = filteredRecords.map(r => [
      `"${selectedDate}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${r.employeeId || ''}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${r.clockIn || '—'}"`,
      `"${r.clockOut || '—'}"`,
      `"${r.hours || '—'}"`,
      `"${r.mode || 'Office'}"`,
      `"${r.status || 'Absent'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast('Attendance records exported to CSV successfully');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in focus:outline-none text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Attendance Center"
        description="Live attendance tracking, check-in logs, shifts, and leave approvals"
        actions={
          <>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isLoading}
              className="btn-secondary flex items-center gap-2 cursor-pointer"
              title="Refresh attendance records"
            >
              <RefreshCw size={15} className={cn(isLoading && "animate-spin text-primary-600")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="btn-secondary flex items-center gap-2 cursor-pointer"
              title="Import attendance logs"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2 cursor-pointer"
              title="Export CSV"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Log Time</span>
            </button>
          </>
        }
      />

      {/* ── Date Navigator Bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar size={15} className="text-primary-600 dark:text-primary-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Active Staff: <strong className="text-slate-800 dark:text-slate-200">{employees.length}</strong></span>
          <span>•</span>
          <span>Logged Records: <strong className="text-slate-800 dark:text-slate-200">{metrics.present + metrics.late}</strong></span>
        </div>
      </div>

      {/* ── 4-Card Summary Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={UserCheck}
          label="Present"
          value={metrics.present}
          pct={metrics.presentPct}
          sublabel={`/ ${metrics.total} staff`}
          colorClass="from-emerald-400 to-emerald-600"
          borderClass="border-emerald-100 dark:border-emerald-900/30"
          bgClass="bg-emerald-50 dark:bg-emerald-950/20"
        />
        <SummaryCard
          icon={Clock}
          label="Late Arrivals"
          value={metrics.late}
          pct={metrics.latePct}
          colorClass="from-amber-400 to-amber-600"
          borderClass="border-amber-100 dark:border-amber-900/30"
          bgClass="bg-amber-50 dark:bg-amber-950/20"
        />
        <SummaryCard
          icon={CalendarOff}
          label="On Leave"
          value={metrics.onLeave}
          pct={metrics.leavePct}
          colorClass="from-blue-400 to-blue-600"
          borderClass="border-blue-100 dark:border-blue-900/30"
          bgClass="bg-blue-50 dark:bg-blue-950/20"
        />
        <SummaryCard
          icon={UserX}
          label="Absent / Unmarked"
          value={metrics.absent}
          pct={metrics.absentPct}
          colorClass="from-rose-400 to-rose-600"
          borderClass="border-rose-100 dark:border-rose-900/30"
          bgClass="bg-rose-50 dark:bg-rose-950/20"
        />
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'records'
              ? "bg-primary-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Users size={15} />
          <span>Daily Logs ({filteredRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'leaves'
              ? "bg-primary-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <CalendarOff size={15} />
          <span>Leave Requests ({leavesData.length})</span>
        </button>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="btn-secondary btn-compact cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── TAB 1: Daily Records Table & Mobile Cards ── */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="Search by employee name, ID, department, or email..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="input-field pl-10 h-10 w-full text-xs"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field h-10 text-xs font-semibold py-0 pr-8 cursor-pointer w-full sm:w-40"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Leave">On Leave</option>
                <option value="Absent">Absent</option>
              </select>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="select-field h-10 text-xs font-semibold py-0 pr-8 cursor-pointer w-full sm:w-40"
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Table View (≥ md) */}
          <div className="hidden md:block card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left hcm-table min-w-[720px]">
                <thead className="hcm-thead">
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                      Department
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                      Clock In
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                      Clock Out
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                      Hours Worked
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                      Mode
                    </th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
                        <td className="px-6 py-4 hcm-td">
                          <div className="flex items-center gap-3">
                            <SafeAvatar src={r.avatarUrl} name={r.name} size={36} />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {r.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                                {r.employeeId !== '—' ? r.employeeId : r.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hcm-td">
                          {r.department}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300 hcm-td font-mono">
                          {r.clockIn}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300 hcm-td font-mono">
                          {r.clockOut}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-mono font-bold text-slate-600 dark:text-slate-400 hcm-td">
                          {r.hours}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hcm-td">
                          {r.mode}
                        </td>
                        <td className="px-6 py-4 text-center hcm-td">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-6 py-4 text-right hcm-td">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewRecord(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(r);
                                setShowAddModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit / Log Time"
                            >
                              <Edit3 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-8 py-16 text-center hcm-td">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <Users size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No attendance records found</p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                              Try selecting another date, or adjusting search and department filters
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (< md) */}
          <div className="block md:hidden space-y-4">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => (
                <div key={r.id} className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <SafeAvatar src={r.avatarUrl} name={r.name} size={36} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{r.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{r.employeeId !== '—' ? r.employeeId : r.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Clock In</span>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">{r.clockIn}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Clock Out</span>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">{r.clockOut}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Hours</span>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">{r.hours}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500">{r.department} &bull; {r.mode}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewRecord(r)}
                        className="btn-secondary btn-compact cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingRecord(r); setShowAddModal(true); }}
                        className="btn-secondary btn-compact cursor-pointer"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No attendance records found</p>
                <p className="text-[11px] text-slate-400 mt-1">Adjust filters or date selection</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Leave Requests Panel ── */}
      {activeTab === 'leaves' && (
        <div className="card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Organization Leave Requests ({leavesData.length})
            </h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left hcm-table min-w-[650px]">
              <thead className="hcm-thead">
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Employee</th>
                  <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Leave Type</th>
                  <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Period</th>
                  <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {leavesData.length > 0 ? (
                  leavesData.map((l) => {
                    const startStr = new Date(l.startDate).toLocaleDateString();
                    const endStr = new Date(l.endDate).toLocaleDateString();
                    const empName = l.user?.employeeProfile?.fullName || l.user?.name || 'Staff';

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs hcm-td">
                          {empName}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hcm-td">
                          {l.leaveType || 'General Leave'}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-medium text-slate-600 dark:text-slate-400 hcm-td">
                          {startStr} – {endStr}
                        </td>
                        <td className="px-6 py-4 text-center hcm-td">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border",
                            l.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              l.status === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-200" :
                                "bg-amber-50 text-amber-600 border-amber-200"
                          )}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right hcm-td">
                          {l.status === 'PENDING' ? (
                            <div className="flex justify-end items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleLeaveReview(l.id, 'approve')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLeaveReview(l.id, 'reject')}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold italic">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="hcm-tr">
                    <td colSpan="5" className="px-8 py-16 text-center text-xs text-slate-400 hcm-td">
                      No leave requests submitted
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddEditAttendanceModal
            key="add-edit"
            users={employees}
            initialData={editingRecord}
            defaultDate={selectedDate}
            onClose={() => {
              setShowAddModal(false);
              setEditingRecord(null);
            }}
            onSave={handleSaveAttendance}
          />
        )}

        {viewRecord && (
          <ViewAttendanceModal
            key="view"
            record={viewRecord}
            date={selectedDate}
            onClose={() => setViewRecord(null)}
          />
        )}
      </AnimatePresence>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="attendance"
        onImportSuccess={() => loadData(true)}
      />
    </div>
  );
};

// ─── Add/Edit Attendance Modal ───────────────────────────────────────────────
const AddEditAttendanceModal = ({ onClose, onSave, users, initialData, defaultDate }) => {
  const [form, setForm] = useState({
    id: initialData?.logId || null,
    hasLog: initialData?.hasLog || false,
    userId: initialData?.userId || '',
    date: defaultDate || new Date().toISOString().split('T')[0],
    clockIn: initialData?.clockIn && initialData.clockIn !== '—' ? initialData.clockIn : '09:00',
    clockOut: initialData?.clockOut && initialData.clockOut !== '—' ? initialData.clockOut : '18:00',
    status: initialData?.status && initialData.status !== 'Absent' ? initialData.status : 'Present',
    mode: initialData?.mode || 'Office'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId) {
      setError('Please select an employee');
      return;
    }
    setError('');
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto text-left">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto z-10 my-auto flex flex-col text-left"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {initialData?.hasLog ? 'Edit Attendance Log' : 'Log Time / Mark Attendance'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="form-label font-bold text-slate-600 dark:text-slate-300">Employee *</label>
            <select
              required
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="select-field w-full text-xs font-medium cursor-pointer"
              disabled={!!initialData}
            >
              <option value="">Select Employee</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.fullName} {u.employeeId ? `(${u.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label font-bold text-slate-600 dark:text-slate-300">Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field w-full text-xs cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label font-bold text-slate-600 dark:text-slate-300">Clock In</label>
              <input
                type="time"
                value={form.clockIn}
                onChange={(e) => setForm({ ...form, clockIn: e.target.value })}
                className="input-field w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="form-label font-bold text-slate-600 dark:text-slate-300">Clock Out</label>
              <input
                type="time"
                value={form.clockOut}
                onChange={(e) => setForm({ ...form, clockOut: e.target.value })}
                className="input-field w-full text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label font-bold text-slate-600 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select-field w-full text-xs font-medium cursor-pointer"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Leave">On Leave</option>
              </select>
            </div>
            <div>
              <label className="form-label font-bold text-slate-600 dark:text-slate-300">Mode</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="select-field w-full text-xs font-medium cursor-pointer"
              >
                <option value="Office">Office</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs px-5 py-2 cursor-pointer">
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── View Attendance Modal ───────────────────────────────────────────────────
const ViewAttendanceModal = ({ record, date, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto text-left">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto z-10 my-auto flex flex-col text-left"
      >
        <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 mb-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <SafeAvatar src={record.avatarUrl} name={record.name} size={44} />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{record.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {record.department} {record.employeeId ? `• ${record.employeeId}` : ''}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="font-bold text-slate-500">Date</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{date}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="font-bold text-slate-500">Status</span>
            <StatusBadge status={record.status} />
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="font-bold text-slate-500">Work Mode</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{record.mode}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="font-bold text-slate-500">Clock In</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{record.clockIn}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="font-bold text-slate-500">Clock Out</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{record.clockOut}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900/30">
            <span className="font-bold text-primary-700 dark:text-primary-300">Total Duration</span>
            <span className="font-black text-primary-700 dark:text-primary-300 font-mono">{record.hours}</span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary w-full text-xs py-2.5 cursor-pointer">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceCenter;

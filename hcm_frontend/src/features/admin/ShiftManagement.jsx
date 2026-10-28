import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Plus, Edit3, Trash2, Search, CheckCircle2, X,
  Layers, Users, ShieldCheck, Sun, Moon, Copy, Check, Sparkles, RefreshCw, UserPlus, UserMinus, AlertCircle, Loader2
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import ActionDropdown from './components/ActionDropdown';
import PageHeader from '../../shared/components/ui/PageHeader';
import { cn } from '../../utils/cn';

// ============================================================
// Safe Avatar Helper
// ============================================================
const SafeAvatar = ({ src, name = '', size = 32, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const initials = useMemo(() => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const isValidUrl = src && typeof src === 'string' && src.trim() !== '' && !['null', 'undefined', '[object Object]'].includes(src.trim());

  return (
    <div 
      className={cn(
        "relative shrink-0 overflow-hidden select-none flex items-center justify-center rounded-full bg-slate-800 text-white font-extrabold shadow-xs",
        className
      )}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
    >
      {isValidUrl && !hasError ? (
        <img 
          src={src} 
          alt={name}
          onError={() => setHasError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>{initials}</span>
      )}
    </div>
  );
};

// ============================================================
// Add / Edit Shift Modal
// ============================================================
const ShiftModal = ({ isOpen, onClose, shiftToEdit, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMin: 60,
    workingHoursMin: 480,
    graceInMin: 15,
    graceOutMin: 15,
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (shiftToEdit) {
      setFormData({
        name: shiftToEdit.name || '',
        startTime: shiftToEdit.startTime || '09:00',
        endTime: shiftToEdit.endTime || '18:00',
        breakDurationMin: shiftToEdit.breakDurationMin ?? 60,
        workingHoursMin: shiftToEdit.workingHoursMin ?? 480,
        graceInMin: shiftToEdit.graceInMin ?? 15,
        graceOutMin: shiftToEdit.graceOutMin ?? 15,
        isDefault: Boolean(shiftToEdit.isDefault)
      });
    } else {
      setFormData({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        breakDurationMin: 60,
        workingHoursMin: 480,
        graceInMin: 15,
        graceOutMin: 15,
        isDefault: false
      });
    }
    setErrors({});
  }, [shiftToEdit, isOpen]);

  // Live calculation of net work minutes based on start, end, and break
  const calculatedWorkMin = useMemo(() => {
    if (!formData.startTime || !formData.endTime) return formData.workingHoursMin || 480;
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Overnight shift
    
    const netMin = Math.max(0, totalMinutes - (parseInt(formData.breakDurationMin) || 0));
    return netMin;
  }, [formData.startTime, formData.endTime, formData.breakDurationMin, formData.workingHoursMin]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Shift name is required.';
    }
    if (!formData.startTime) {
      errs.startTime = 'Start time is required.';
    }
    if (!formData.endTime) {
      errs.endTime = 'End time is required.';
    }
    if (formData.breakDurationMin < 0) {
      errs.breakDurationMin = 'Break duration cannot be negative.';
    }
    if (formData.graceInMin < 0) {
      errs.graceInMin = 'Grace-in period cannot be negative.';
    }
    if (formData.graceOutMin < 0) {
      errs.graceOutMin = 'Grace-out period cannot be negative.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const payload = {
      ...formData,
      workingHoursMin: calculatedWorkMin
    };
    const success = await onSave(payload);
    setIsSubmitting(false);
    if (success !== false) {
      onClose();
    }
  };

  const hoursDisplay = (calculatedWorkMin / 60).toFixed(1).replace('.0', '');
  const isOvernight = (() => {
    if (!formData.startTime || !formData.endTime) return false;
    const [sH, sM] = formData.startTime.split(':').map(Number);
    const [eH, eM] = formData.endTime.split(':').map(Number);
    return (eH * 60 + eM) < (sH * 60 + sM);
  })();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/60 shadow-xs">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {shiftToEdit?.id ? 'Edit Shift Schedule' : (shiftToEdit ? 'Duplicate Shift Schedule' : 'Create New Shift')}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Set daily shift timings, break periods, and grace window
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                Shift Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Standard Day Shift, Night Shift, APAC Early"
                className={cn("input-field w-full", errors.name && "border-rose-500 focus:border-rose-500")}
              />
              {errors.name && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Start & End Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 form-label">
                  <Sun size={13}/>
                  <span>Start Time *</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 form-label">
                  <Moon size={13}/>
                  <span>End Time *</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>

            {isOvernight && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Moon size={16} className="shrink-0" />
                <span>Overnight Shift Detected (spans across midnight to next morning)</span>
              </div>
            )}

            {/* Break & Net Work Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Break Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="300"
                  value={formData.breakDurationMin}
                  onChange={(e) => setFormData({ ...formData, breakDurationMin: parseInt(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Net Working Hours
                </label>
                <div className="h-[42px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400 font-mono">
                    {hoursDisplay} hrs
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    ({calculatedWorkMin} mins)
                  </span>
                </div>
              </div>
            </div>

            {/* Grace Periods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Grace Check-In (Mins)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={formData.graceInMin}
                  onChange={(e) => setFormData({ ...formData, graceInMin: parseInt(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Grace Check-Out (Mins)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={formData.graceOutMin}
                  onChange={(e) => setFormData({ ...formData, graceOutMin: parseInt(e.target.value) || 0 })}
                  className="input-field w-full"
                />
              </div>
            </div>

            {/* Default Shift Checkbox */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 cursor-pointer select-none form-label">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="checkbox rounded"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Set as Default Organization Shift
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  New employees without an assigned shift will automatically inherit this schedule.
                </p>
              </div>
            </label>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================================
// Assign Employees Modal
// ============================================================
const AssignShiftModal = ({ isOpen, onClose, shift, users = [], onAssignChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState(new Set());

  useEffect(() => {
    if (shift && users) {
      const initialAssigned = new Set(
        users.filter(u => u.shiftId === shift.id || u.shift?.id === shift.id).map(u => u.id)
      );
      setAssignedUserIds(initialAssigned);
    }
  }, [shift, users, isOpen]);

  if (!isOpen || !shift) return null;

  const toggleUser = (userId) => {
    setAssignedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase().trim();
    return !q || 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.empId && u.empId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));
  });

  const handleSave = async () => {
    setIsSaving(true);
    await onAssignChange(shift.id, Array.from(assignedUserIds));
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/60 shadow-xs">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  Assign Workforce to {shift.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {assignedUserIds.size} employees currently assigned to this schedule
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee by name, ID, department..."
                className="input-field pl-9 h-10 text-xs w-full"
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const isAssigned = assignedUserIds.has(user.id);
                return (
                  <div 
                    key={user.id} 
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer select-none pt-3",
                      isAssigned ? "bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <SafeAvatar src={user.avatarUrl || user.img} name={user.name} size={36} />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{user.empId || 'EMP'} &bull; {user.department || 'General'}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      isAssigned ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    )}>
                      {isAssigned && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active employees found matching "{searchTerm}".
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary cursor-pointer">Cancel</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary cursor-pointer">
              {isSaving ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================================
// Single Shift Desktop Row
// ============================================================
const ShiftRow = ({ shift, onEdit, onDelete, onDuplicate, onSetDefault, onAssign }) => {
  const workHours = (shift.workingHoursMin / 60).toFixed(1).replace('.0', '');
  const employeeCount = shift._count?.employees || 0;

  return (
    <tr className="hcm-tr group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <td className="hcm-td">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40 shadow-xs">
            <Clock size={19} />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm truncate">
                {shift.name}
              </p>
              {shift.isDefault && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Default Shift
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {workHours}h Net Work &bull; {shift.breakDurationMin}m Break
            </p>
          </div>
        </div>
      </td>
      <td className="hcm-td text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-xs">{shift.startTime}</span>
          <span className="text-slate-400 text-[10px] font-bold">TO</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-xs">{shift.endTime}</span>
        </div>
      </td>
      <td className="hcm-td hidden md:table-cell text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
        <div>In: <strong className="text-slate-800 dark:text-slate-100 font-mono">{shift.graceInMin}m</strong></div>
        <div className="text-[11px] text-slate-400">Out: <strong className="font-mono">{shift.graceOutMin}m</strong></div>
      </td>
      <td className="hcm-td hidden lg:table-cell text-center">
        <button
          type="button"
          onClick={() => onAssign(shift)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Users size={12} />
          <span>{employeeCount} Members</span>
        </button>
      </td>
      <td className="hcm-td text-right">
        <ActionDropdown
          actions={[
            { label: 'Edit Shift', icon: Edit3, onClick: () => onEdit(shift) },
            { label: 'Assign Employees', icon: Users, onClick: () => onAssign(shift) },
            { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate(shift) },
            ...(!shift.isDefault ? [{ label: 'Set as Default', icon: ShieldCheck, onClick: () => onSetDefault(shift) }] : []),
            { label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete(shift) }
          ]}
        />
      </td>
    </tr>
  );
};

// ============================================================
// Main Shift Management Feature Component
// ============================================================
const ShiftManagement = () => {
  const { shifts = [], users = [], deleteShift, createShift, updateShift, fetchShifts, fetchUsers, updateUser, showToast, loading } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState(null);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [shiftToAssign, setShiftToAssign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (fetchShifts) fetchShifts();
    if (fetchUsers) fetchUsers();
  }, [fetchShifts, fetchUsers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchShifts) await fetchShifts();
    if (fetchUsers) await fetchUsers();
    setIsRefreshing(false);
  };

  const handleSaveShift = async (formData) => {
    if (shiftToEdit?.id) {
      return updateShift(shiftToEdit.id, formData);
    } else {
      return createShift(formData);
    }
  };

  const handleDuplicate = (shift) => {
    setShiftToEdit({
      name: `${shift.name} (Copy)`,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDurationMin: shift.breakDurationMin,
      workingHoursMin: shift.workingHoursMin,
      graceInMin: shift.graceInMin,
      graceOutMin: shift.graceOutMin,
      isDefault: false
    });
    setIsModalOpen(true);
  };

  const handleSetDefault = (shift) => {
    updateShift(shift.id, { isDefault: true });
  };

  const handleAssignChange = async (shiftId, targetUserIds) => {
    const targetSet = new Set(targetUserIds);
    try {
      for (const u of users) {
        const currentlyHasThisShift = u.shiftId === shiftId || u.shift?.id === shiftId;
        const shouldHaveThisShift = targetSet.has(u.id);

        if (shouldHaveThisShift && !currentlyHasThisShift) {
          await updateUser(u.id, { shiftId: shiftId });
        } else if (!shouldHaveThisShift && currentlyHasThisShift) {
          await updateUser(u.id, { shiftId: null });
        }
      }
      showToast('Shift assignments updated successfully');
      if (fetchShifts) await fetchShifts();
      if (fetchUsers) await fetchUsers();
    } catch (e) {
      console.error('Error updating shift assignments:', e);
      showToast('Failed to update shift assignments', 'error');
    }
  };

  const filteredShifts = useMemo(() => 
    shifts.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [shifts, searchTerm]
  );

  const defaultShift = shifts.find(s => s.isDefault);
  const totalEmployeesCovered = shifts.reduce((acc, s) => acc + (s._count?.employees || 0), 0);

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none text-left">
      {/* Header */}
      <PageHeader
        title="Shift Management"
        description="Configure enterprise work shifts, operational hours, break windows, and grace intervals"
        actions={
          <>
            <button 
              type="button"
              onClick={handleRefresh} 
              title="Refresh shifts" 
              className="btn-secondary cursor-pointer"
            >
              <RefreshCw size={16} className={cn((isRefreshing || loading) && "animate-spin text-primary-600")} />
            </button>
            <button 
              type="button"
              onClick={() => { setShiftToEdit(null); setIsModalOpen(true); }} 
              className="btn-primary cursor-pointer"
            >
              <Plus size={18} />
              <span>Create Shift</span>
            </button>
          </>
        }
      />

      {/* Desktop Table Container (≥ md) */}
      <div className="hidden md:block card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="hcm-table w-full text-left">
            <thead className="hcm-thead">
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Shift Details</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Timings</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hidden md:table-cell hcm-th">Grace Periods</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hidden lg:table-cell hcm-th">Workforce</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredShifts.length > 0 ? (
                filteredShifts.map(shift => (
                  <ShiftRow
                    key={shift.id}
                    shift={shift}
                    onEdit={(s) => { setShiftToEdit(s); setIsModalOpen(true); }}
                    onDelete={setShiftToDelete}
                    onDuplicate={handleDuplicate}
                    onSetDefault={handleSetDefault}
                    onAssign={setShiftToAssign}
                  />
                ))
              ) : (
                <tr className="hcm-tr">
                  <td colSpan={5} className="px-4 py-16 text-center hcm-td">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <Clock size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">No shifts found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Click "Add Shift" to configure a new operational schedule.</p>
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
        {filteredShifts.length > 0 ? (
          filteredShifts.map((shift) => {
            const workHours = (shift.workingHoursMin / 60).toFixed(1).replace('.0', '');
            const employeeCount = shift._count?.employees || 0;

            return (
              <div key={shift.id} className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40 shadow-xs">
                      <Clock size={19} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{shift.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{workHours}h Net Work &bull; {shift.breakDurationMin}m Break</p>
                    </div>
                  </div>
                  {shift.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                      Default
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Timings</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{shift.startTime} - {shift.endTime}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Grace Periods</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">In: {shift.graceInMin}m | Out: {shift.graceOutMin}m</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShiftToAssign(shift)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Users size={14} />
                    <span>{employeeCount} Members Assigned</span>
                  </button>
                  <ActionDropdown
                    actions={[
                      { label: 'Edit Shift', icon: Edit3, onClick: () => { setShiftToEdit(shift); setIsModalOpen(true); } },
                      { label: 'Assign Employees', icon: Users, onClick: () => setShiftToAssign(shift) },
                      { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(shift) },
                      ...(!shift.isDefault ? [{ label: 'Set as Default', icon: ShieldCheck, onClick: () => handleSetDefault(shift) }] : []),
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setShiftToDelete(shift) }
                    ]}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No shifts found</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ShiftModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setShiftToEdit(null); }}
          shiftToEdit={shiftToEdit}
          onSave={handleSaveShift}
        />
      )}

      {shiftToAssign && (
        <AssignShiftModal
          isOpen={!!shiftToAssign}
          onClose={() => setShiftToAssign(null)}
          shift={shiftToAssign}
          users={users}
          onAssignChange={handleAssignChange}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!shiftToDelete}
        onClose={() => setShiftToDelete(null)}
        onConfirm={() => {
          deleteShift(shiftToDelete.id);
          setShiftToDelete(null);
        }}
        title="Delete Shift Schedule"
        message={`Are you sure you want to delete "${shiftToDelete?.name}"? Assigned employees will be unassigned from this shift without losing their records.`}
        confirmText="Delete Shift"
        type="danger"
      />
    </div>
  );
};

export default ShiftManagement;

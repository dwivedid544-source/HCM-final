import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, X, Globe2, Zap, Sparkles, Building, MapPin,
  Clock, CheckCircle2, ChevronDown, Check, AlertCircle,
  FileText, ShieldCheck, Tag, Info, Layers
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import DatePicker from '../../../shared/components/common/DatePicker';
import { cn } from '../../../utils/cn';

// Predefined common international holidays for quick 1-click presets
const QUICK_PRESETS = [
  { name: "New Year's Day", type: 'Public', region: 'All Regions', defaultMonth: '01-01' },
  { name: 'Martin Luther King Jr. Day', type: 'Public', region: 'Global-US East', defaultMonth: '01-19' },
  { name: 'Good Friday', type: 'Public', region: 'All Regions', defaultMonth: '04-03' },
  { name: 'Memorial Day', type: 'Public', region: 'Global-US East', defaultMonth: '05-25' },
  { name: 'Independence Day', type: 'Public', region: 'Global-US East', defaultMonth: '07-04' },
  { name: 'Labor Day', type: 'Public', region: 'Global-US East', defaultMonth: '09-07' },
  { name: 'Diwali', type: 'Public', region: 'APAC-India', defaultMonth: '11-01' },
  { name: 'Thanksgiving Day', type: 'Public', region: 'Global-US East', defaultMonth: '11-26' },
  { name: 'Christmas Day', type: 'Public', region: 'All Regions', defaultMonth: '12-25' },
  { name: 'Company Founder Day', type: 'Company Holiday', region: 'All Regions' },
  { name: 'Eid al-Fitr', type: 'Public', region: 'APAC-India' },
  { name: 'Lunar New Year', type: 'Public', region: 'All Regions' }
];

const HOLIDAY_TYPES = [
  {
    id: 'Public',
    label: 'Public Holiday',
    desc: 'Statutory national or government holiday',
    color: 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
  },
  {
    id: 'Regional',
    label: 'Regional / State',
    desc: 'Applies to specific state, province or office',
    color: 'border-purple-200 dark:border-purple-800/80 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200'
  },
  {
    id: 'Company Holiday',
    label: 'Company Holiday',
    desc: 'Internal corporate pause or annual day',
    color: 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
  },
  {
    id: 'Optional',
    label: 'Optional / Floating',
    desc: 'Employee self-selected floating leave',
    color: 'border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
  }
];

const REGIONS = [
  'All Regions',
  'Global-US East',
  'Global-US West',
  'APAC-India',
  'Europe',
  'United Kingdom',
  'LATAM',
  'Custom'
];

const HolidayModal = ({ isOpen, onClose, holidayToEdit }) => {
  const { addHoliday, updateHoliday, calendars = [], showToast } = useAdmin();

  // Form states
  const [name, setName] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Public');
  const [region, setRegion] = useState('All Regions');
  const [customRegion, setCustomRegion] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state ONLY when modal is opened or when holidayToEdit ID changes
  useEffect(() => {
    if (!isOpen) return;

    if (holidayToEdit) {
      setName(holidayToEdit.name || '');
      setDate(holidayToEdit.date || '');
      setEndDate(holidayToEdit.endDate || '');
      setIsRange(Boolean(holidayToEdit.endDate && holidayToEdit.endDate !== holidayToEdit.date));
      setType(holidayToEdit.type || 'Public');
      const reg = holidayToEdit.region || 'All Regions';
      if (REGIONS.includes(reg)) {
        setRegion(reg);
        setCustomRegion('');
      } else {
        setRegion('Custom');
        setCustomRegion(reg);
      }
      setCalendarId(holidayToEdit.calendarId || '');
      setRepeat(Boolean(holidayToEdit.repeat));
      setIsPaid(holidayToEdit.isPaid !== false);
      setDescription(holidayToEdit.description || '');
    } else {
      // Default new holiday values
      setName('');
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setEndDate('');
      setIsRange(false);
      setType('Public');
      setRegion('All Regions');
      setCustomRegion('');
      setCalendarId(calendars?.[0]?.id || '');
      setRepeat(false);
      setIsPaid(true);
      setDescription('');
    }
  }, [isOpen, holidayToEdit?.id]);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isSubmitting, onClose]);

  // Calculate days count
  const durationDays = useMemo(() => {
    if (!date) return 1;
    if (!isRange || !endDate) return 1;
    const start = new Date(date);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1;
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [date, endDate, isRange]);

  // Calculate days until holiday
  const daysUntilHoliday = useMemo(() => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hDate = new Date(date);
    hDate.setHours(0, 0, 0, 0);
    return Math.ceil((hDate - today) / (1000 * 60 * 60 * 24));
  }, [date]);

  // Handle Preset selection
  const applyPreset = (preset) => {
    setName(preset.name);
    if (preset.type) setType(preset.type);
    if (preset.region) setRegion(preset.region);
    if (preset.defaultMonth) {
      const year = new Date().getFullYear();
      setDate(`${year}-${preset.defaultMonth}`);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a holiday name', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a valid execution date', 'error');
      return;
    }

    const effectiveRegion = region === 'Custom' ? (customRegion.trim() || 'Custom') : region;

    // Status based on date
    const hDate = new Date(date);
    const isPassed = hDate < new Date();
    const status = isPassed ? 'Passed' : 'Upcoming';

    const payload = {
      name: name.trim(),
      date,
      ...(isRange && endDate ? { endDate } : {}),
      type,
      region: effectiveRegion,
      repeat: Boolean(repeat),
      description: description.trim() || null,
      status,
      ...(calendarId ? { calendarId } : {})
    };

    setIsSubmitting(true);
    try {
      if (holidayToEdit) {
        await updateHoliday(holidayToEdit.id, payload);
      } else {
        await addHoliday(payload);
      }
      onClose();
    } catch (err) {
      console.error('Save holiday error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-left">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xl sm:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {holidayToEdit ? 'Edit Global Holiday' : 'Add Global Holiday'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                    Corporate Schedule
                  </span>
                </div>
                <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">
                  Schedule Workforce Pause & Exceptions
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 max-h-[calc(90vh-140px)]">
              {/* Quick Presets (Only when adding new) */}
              {!holidayToEdit && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-0.5">
                    <Sparkles size={12} className="text-primary-500" />
                    <span>Quick Suggestion Presets</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PRESETS.slice(0, 6).map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none',
                          name === preset.name
                            ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-950/50 dark:border-primary-800 dark:text-primary-300'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Holiday Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">
                  Holiday Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lunar New Year, Independence Day"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Date Mode Toggle & Execution Date */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Execution Date & Duration <span className="text-rose-500">*</span>
                  </label>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setIsRange(false)}
                      className={cn(
                        'px-2.5 py-0.5 rounded-md transition-all cursor-pointer',
                        !isRange
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      )}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRange(true);
                        if (!endDate && date) setEndDate(date);
                      }}
                      className={cn(
                        'px-2.5 py-0.5 rounded-md transition-all cursor-pointer',
                        isRange
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      )}
                    >
                      Multi-Day Range
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 px-0.5">
                      {isRange ? 'Start Date' : 'Holiday Date'}
                    </span>
                    <DatePicker
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    />
                  </div>

                  {isRange ? (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 px-0.5">End Date</span>
                      <DatePicker
                        required
                        value={endDate || date}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 px-0.5">Schedule Status</span>
                      <div className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Timeline:</span>
                        <span className={cn(
                          'font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider',
                          daysUntilHoliday !== null && daysUntilHoliday > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : daysUntilHoliday === 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {daysUntilHoliday === null ? 'Select Date' :
                            daysUntilHoliday === 0 ? 'Today!' :
                            daysUntilHoliday === 1 ? 'Tomorrow!' :
                            daysUntilHoliday > 0 ? `In ${daysUntilHoliday} days` : 'Past date'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {isRange && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-50/60 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 text-xs font-bold text-primary-700 dark:text-primary-300">
                    <Calendar size={14} />
                    <span>Duration: <strong>{durationDays} Consecutive Days Off</strong></span>
                  </div>
                )}
              </div>

              {/* Holiday Category / Type Cards */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">
                  Holiday Classification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HOLIDAY_TYPES.map((ht) => {
                    const isSelected = type === ht.id;
                    return (
                      <div
                        key={ht.id}
                        onClick={() => setType(ht.id)}
                        className={cn(
                          'p-3 rounded-2xl border transition-all cursor-pointer select-none text-left relative',
                          isSelected
                            ? cn(ht.color, 'shadow-xs ring-1 ring-primary-500/20')
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{ht.label}</span>
                          <div className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          )}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {ht.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Impacted Region & Applicable Work Calendar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Impacted Region */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">
                    Impacted Region
                  </label>
                  <div className="relative">
                    <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer appearance-none"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  </div>
                  {region === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom region or city..."
                      value={customRegion}
                      onChange={(e) => setCustomRegion(e.target.value)}
                      className="w-full h-10 px-3.5 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  )}
                </div>

                {/* Applicable Work Calendar */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">
                    Work Calendar Policy
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <select
                      value={calendarId}
                      onChange={(e) => setCalendarId(e.target.value)}
                      className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer appearance-none"
                    >
                      <option value="">All Corporate Calendars</option>
                      {calendars.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  </div>
                </div>
              </div>

              {/* Repeat Annually Card */}
              <div
                onClick={() => setRepeat(!repeat)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4',
                  repeat
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    repeat ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  )}>
                    <Zap size={18} fill={repeat ? 'currentColor' : 'none'} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Repeat Annually
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
                      Automatically re-create this holiday every year for future payroll & leave cycles.
                    </p>
                  </div>
                </div>

                {/* Animated Switch */}
                <div
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0',
                    repeat ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                  )}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-xs',
                      repeat ? 'ml-auto' : 'ml-0'
                    )}
                  />
                </div>
              </div>

              {/* Description / Policy Notes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">
                  Guidelines & Office Coverage Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. All corporate offices will be closed. On-call support engineers will follow holiday shift schedules."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                />
              </div>

              {/* Live Preview Card */}
              {name && (
                <div className="p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5 animate-fade-in">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-0.5">
                    Live Schedule Preview
                  </span>
                  <div className="flex items-center justify-between gap-3 text-xs bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        <Calendar size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{name}</p>
                        <p className="text-[10px] text-slate-400">{date} {isRange && endDate ? `→ ${endDate}` : ''} • {region === 'Custom' ? (customRegion || 'Custom') : region}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0',
                      HOLIDAY_TYPES.find((t) => t.id === type)?.badge || 'bg-slate-100 text-slate-700'
                    )}>
                      {type}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !date}
                className={cn(
                  'h-11 px-6 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 cursor-pointer',
                  !name.trim() || !date || isSubmitting
                    ? 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-primary-600 hover:bg-primary-700'
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Holiday...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{holidayToEdit ? 'Save Changes' : 'Add Global Holiday'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HolidayModal;

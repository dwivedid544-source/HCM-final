import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Plus, 
  Download, 
  Edit3, 
  Trash2, 
  CalendarDays, 
  Target, 
  MapPin,
  Globe2,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { cn } from '../../utils/cn';
import HolidayModal from './components/HolidayModal';
import ConfirmDialog from './components/ConfirmDialog';
import ActionDropdown from './components/ActionDropdown';
import WeekendRuleModal from './components/WeekendRuleModal';
import CalendarModal from './components/CalendarModal';
import AssignmentModal from './components/AssignmentModal';
import PermissionGate from '../../shared/components/common/PermissionGate';
import { usePermission } from '../../hooks/usePermission';
import { useDateFormat } from '../../hooks/useDateFormat';
import PageHeader from '../../shared/components/ui/PageHeader';

// Dynamically determine status based on today's real date
const getStatus = (dateStr) => {
  if (!dateStr) return 'Upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const holidayDate = new Date(dateStr);
  holidayDate.setHours(0, 0, 0, 0);
  return holidayDate >= today ? 'Upcoming' : 'Passed';
};

// Days until a future holiday
const daysUntil = (dateStr) => {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const holidayDate = new Date(dateStr);
  holidayDate.setHours(0, 0, 0, 0);
  return Math.ceil((holidayDate - today) / (1000 * 60 * 60 * 24));
};

// Clean Desktop Holiday Row with Zero Icon Overlapping
const HolidayRow = ({ hday, onEdit, onDelete, onDuplicate, showToast }) => {
  const { formatDate } = useDateFormat();
  const { check: hasPerm } = usePermission('holidays');
  const status = getStatus(hday.date);
  const isPassed = status === 'Passed';
  const days = !isPassed ? daysUntil(hday.date) : null;

  return (
    <tr className={cn(
      'group transition-colors hcm-tr',
      isPassed 
        ? 'hover:bg-slate-50/40 dark:hover:bg-slate-800/30 opacity-75' 
        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
    )}>
      <td className="px-6 py-4 hcm-td">
        <div className="flex items-center gap-3.5">
          <div className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ring-1',
            isPassed 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 ring-slate-200 dark:ring-slate-700' 
              : 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 ring-primary-200 dark:ring-primary-900/40'
          )}>
            <CalendarDays size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm truncate">{hday.name}</p>
              {!isPassed && days !== null && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md shrink-0",
                  days === 0 ? "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse" :
                  days === 1 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                  days <= 7 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                  "bg-slate-100 text-slate-500 border border-slate-200"
                )}>
                  {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow!' : `In ${days} days`}
                </span>
              )}
            </div>
            {hday.description && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">{hday.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-center whitespace-nowrap hcm-td">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          {formatDate(hday.date)}
        </span>
      </td>
      <td className="px-6 py-4 text-center whitespace-nowrap hcm-td">
        <span className={cn(
          "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border",
          hday.type === 'Public' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' :
          hday.type === 'Regional' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' :
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
        )}>
          {hday.type || 'Public'}
        </span>
      </td>
      <td className="px-6 py-4 text-center whitespace-nowrap hcm-td">
        <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
          <MapPin size={12}/>
          <span>{hday.region || 'Global'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-center whitespace-nowrap hcm-td">
        <span className={cn(
          'px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border inline-flex items-center gap-1.5',
          status === 'Upcoming'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status === 'Upcoming' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
          <span>{status}</span>
        </span>
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap hcm-td select-none">
        <ActionDropdown 
          actions={[
            hasPerm('edit') ? { label: 'Edit Details', icon: Edit3, onClick: () => onEdit(hday) } : null,
            hasPerm('create') ? { label: 'Duplicate Entry', icon: Globe2, onClick: () => onDuplicate(hday) } : null,
            hasPerm('delete') ? { label: 'Delete Holiday', icon: Trash2, danger: true, onClick: () => onDelete(hday) } : null,
          ].filter(Boolean)}
        />
      </td>
    </tr>
  );
};

const WEEKDAYS = [
  { id: 'MONDAY', label: 'Monday', short: 'Mon' },
  { id: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { id: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { id: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { id: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { id: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { id: 'SUNDAY', label: 'Sunday', short: 'Sun' },
];

const Holidays = () => {
  const { 
    holidays = [], 
    deleteHoliday, 
    addHoliday,
    showToast, 
    calendars = [], 
    deleteCalendar, 
    createCalendar, 
    updateCalendar, 
    assignCalendar, 
    removeAssignment, 
    users = [], 
    departments = [],
    fetchHolidays,
    fetchCalendars,
    loading
  } = useAdmin();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('hcm_tab_admin_holidays') || 'Holidays';
    } catch {
      return 'Holidays';
    }
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('hcm_tab_admin_holidays', tabId);
    } catch {}
  };

  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const { formatDate } = useDateFormat();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWeekendRuleModalOpen, setIsWeekendRuleModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [holidayToEdit, setHolidayToEdit] = useState(null);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [calendarToDelete, setCalendarToDelete] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [showPast, setShowPast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentYear = new Date().getFullYear();

  // Fetch holidays and calendars on component mount
  useEffect(() => {
    if (fetchHolidays) fetchHolidays();
    if (fetchCalendars) fetchCalendars();
  }, [fetchHolidays, fetchCalendars]);

  // Auto-select a default calendar if none is selected
  useEffect(() => {
    if (calendars && calendars.length > 0 && !selectedCalendarId) {
      const defaultCal = calendars.find(c => c.isDefaultCompanyCalendar) || calendars[0];
      if (defaultCal) setSelectedCalendarId(defaultCal.id);
    }
  }, [calendars, selectedCalendarId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fetchHolidays) await fetchHolidays();
      if (fetchCalendars) await fetchCalendars();
      showToast('Holiday & Calendar records refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dynamic Regions extracted from real database records
  const uniqueRegions = useMemo(() => {
    const regions = Array.isArray(holidays) ? holidays.map(h => h.region).filter(Boolean) : [];
    return ['All Regions', ...Array.from(new Set(regions))];
  }, [holidays]);

  // Apply search & region filters
  const filteredHolidays = useMemo(() => (Array.isArray(holidays) ? holidays : []).filter(h => {
    const matchesSearch =
      (h.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'All Regions' || (h.region || '').includes(regionFilter);
    return matchesSearch && matchesRegion;
  }), [holidays, searchTerm, regionFilter]);

  // Upcoming: nearest date first
  const upcomingHolidays = useMemo(() =>
    filteredHolidays
      .filter(h => getStatus(h.date) === 'Upcoming')
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [filteredHolidays]
  );

  // Past: most recent first
  const pastHolidays = useMemo(() =>
    filteredHolidays
      .filter(h => getStatus(h.date) === 'Passed')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredHolidays]
  );

  const currentCalendar = calendars.find(c => c.id === selectedCalendarId) || calendars[0];
  const activeWeekendRules = currentCalendar?.versions?.[0]?.weekends || [];
  const activeAssignments = currentCalendar?.assignments || [];

  const tabs = [
    { id: 'Holidays', label: 'Holidays', icon: CalendarDays, count: filteredHolidays.length },
    { id: 'Work Calendars', label: 'Work Calendars', icon: Calendar, count: calendars.length },
    { id: 'Weekend Rules', label: 'Weekend Rules', icon: Sliders, count: activeWeekendRules.length },
    { id: 'Assignments', label: 'Assignments', icon: Users, count: activeAssignments.length },
  ];

  const stats = [
    { label: 'Upcoming Holidays', value: upcomingHolidays.length, sub: 'Next 12 Months', icon: CalendarDays, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/40' },
    { label: `Total in ${currentYear}`, value: holidays.filter(h => new Date(h.date).getFullYear() === currentYear).length, sub: 'Active Calendar', icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Past This Year', value: pastHolidays.filter(h => new Date(h.date).getFullYear() === currentYear).length, sub: 'Completed Events', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Work Calendars', value: calendars.length, sub: 'Active Schedules', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  ];

  const handleDownload = () => {
    const csvRows = [
      ['Name', 'Date', 'Type', 'Region', 'Status'].join(','),
      ...filteredHolidays.map(h => [`"${h.name}"`, formatDate(h.date), h.type || 'Public', h.region || 'Global', getStatus(h.date)].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `holidays_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Holidays exported successfully as CSV');
  };

  const handleDuplicateHoliday = (hday) => {
    addHoliday({
      name: `${hday.name} (Copy)`,
      date: hday.date,
      type: hday.type || 'Public',
      region: hday.region || 'Global',
      description: hday.description || '',
      status: 'Upcoming'
    });
  };

  const handleToggleWeekday = (dayId) => {
    if (!currentCalendar) {
      showToast('Please select a calendar first.', 'error');
      return;
    }
    const existingRule = activeWeekendRules.find(w => w.dayOfWeek === dayId);
    let newWeekends = [];
    if (existingRule) {
      newWeekends = activeWeekendRules.filter(w => w.dayOfWeek !== dayId);
    } else {
      newWeekends = [...activeWeekendRules, { dayOfWeek: dayId, type: 'FULL_DAY' }];
    }
    updateCalendar(currentCalendar.id, { 
      weekends: newWeekends.map(w => ({ dayOfWeek: w.dayOfWeek, type: w.type || 'FULL_DAY' })) 
    });
  };

  const tableHead = (
    <thead className="hcm-thead">
      <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Holiday Name</th>
        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Date</th>
        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Type</th>
        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Region</th>
        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Status</th>
        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Action</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none w-full text-left">
      {/* Header */}
      <PageHeader
        title="Holiday & Calendar Management"
        description="Configure corporate holiday schedules, localized non-working days, and work calendar assignments"
        actions={
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              title="Sync latest holiday data"
              className="btn-secondary"
            >
              <RefreshCw size={15} className={cn((isRefreshing || loading) && "animate-spin text-primary-600")} />
              <span>Sync</span>
            </button>
            <PermissionGate module="holidays" action="create">
              <button
                type="button"
                className="btn-primary cursor-pointer"
                onClick={() => {
                  if (activeTab === 'Holidays') {
                    setHolidayToEdit(null);
                    setIsAddModalOpen(true);
                  } else if (activeTab === 'Work Calendars') {
                    setIsCalendarModalOpen(true);
                  } else if (activeTab === 'Weekend Rules') {
                    setIsWeekendRuleModalOpen(true);
                  } else if (activeTab === 'Assignments') {
                    setIsAssignmentModalOpen(true);
                  }
                }}>
                <Plus size={16} />
                <span>
                  {activeTab === 'Holidays' ? 'Add Holiday' : 
                   activeTab === 'Work Calendars' ? 'Add Calendar' : 
                   activeTab === 'Weekend Rules' ? 'Add Weekend Rule' : 
                   'Assign Calendar'}
                </span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
            <div className={cn("p-3.5 rounded-2xl shrink-0 shadow-xs", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Navigation Tabs & Filter Bar */}
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
          {/* Scrollable Single-Line Tab Pills */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap",
                    isActive
                      ? "bg-primary-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Specific Filter / Action Bar */}
          {activeTab === 'Holidays' && (
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full 2xl:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search holiday or region..."
                  className="input-field pl-9 h-10 text-xs w-full bg-white dark:bg-slate-900"
                />
                {searchTerm && (
                  <button 
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="select-field h-10 text-xs font-bold cursor-pointer"
              >
                {uniqueRegions.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDownload}
                title="Export CSV"
                className="btn-secondary h-10 w-10 p-0 flex items-center justify-center cursor-pointer shrink-0"
              >
                <Download size={15} />
              </button>
            </div>
          )}

          {(activeTab === 'Weekend Rules' || activeTab === 'Assignments') && (
            <div className="flex items-center gap-3 w-full 2xl:w-auto justify-between 2xl:justify-end">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Active Calendar:</span>
              <select
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="select-field h-10 text-xs font-bold cursor-pointer"
              >
                {calendars?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isDefaultCompanyCalendar ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Holidays List */}
        {activeTab === 'Holidays' && (
          <div className="space-y-4">
            {/* Desktop Table View (≥ md) */}
            <div className="hidden md:block card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
              {/* Past Holidays Section (Collapsible) */}
              {pastHolidays.length > 0 && (
                <div className="border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPast(p => !p)}
                    className="w-full px-6 py-3.5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                      <Clock size={15}/>
                      <span className="text-xs font-bold">
                        {showPast ? 'Hide' : 'View'} Past Holidays ({pastHolidays.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Completed holiday events</span>
                    </div>
                    <div className="p-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {showPast && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <table className="hcm-table w-full min-w-full text-left">
                          {tableHead}
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {pastHolidays.map(hday => (
                              <HolidayRow
                                key={hday.id}
                                hday={hday}
                                onEdit={(h) => { setHolidayToEdit(h); setIsAddModalOpen(true); }}
                                onDelete={setHolidayToDelete}
                                onDuplicate={handleDuplicateHoliday}
                                showToast={showToast}
                              />
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Upcoming Holidays Section */}
              <div className="overflow-x-auto">
                <table className="hcm-table w-full min-w-full text-left">
                  {tableHead}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {upcomingHolidays.length > 0 ? (
                      upcomingHolidays.map(hday => (
                        <HolidayRow
                          key={hday.id}
                          hday={hday}
                          onEdit={(h) => { setHolidayToEdit(h); setIsAddModalOpen(true); }}
                          onDelete={setHolidayToDelete}
                          onDuplicate={handleDuplicateHoliday}
                          showToast={showToast}
                        />
                      ))
                    ) : (
                      <tr className="hcm-tr">
                        <td colSpan="6" className="px-6 py-16 text-center text-slate-400 hcm-td">
                          <div className="max-w-sm mx-auto flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3">
                              <CalendarDays size={26} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No upcoming holidays</h3>
                            <p className="text-xs text-slate-400 mb-4">No future holidays found matching your current filter criteria.</p>
                            <button
                              type="button"
                              onClick={() => { setHolidayToEdit(null); setIsAddModalOpen(true); }}
                              className="btn-primary btn-compact cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Add New Holiday</span>
                            </button>
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
              {filteredHolidays.length > 0 ? (
                filteredHolidays.map(hday => {
                  const status = getStatus(hday.date);
                  const isPassed = status === 'Passed';
                  const days = !isPassed ? daysUntil(hday.date) : null;

                  return (
                    <div key={hday.id} className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ring-1',
                            isPassed 
                              ? 'bg-slate-100 text-slate-400 ring-slate-200' 
                              : 'bg-primary-50 text-primary-600 ring-primary-200'
                          )}>
                            <CalendarDays size={19} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{hday.name}</h4>
                            <p className="text-xs text-slate-400 font-mono">{formatDate(hday.date)}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border shrink-0",
                          hday.type === 'Public' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                        )}>
                          {hday.type || 'Public'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-500 font-medium">{hday.region || 'Global'}</span>
                        <ActionDropdown 
                          actions={[
                            { label: 'Edit Details', icon: Edit3, onClick: () => { setHolidayToEdit(hday); setIsAddModalOpen(true); } },
                            { label: 'Duplicate Entry', icon: Globe2, onClick: () => handleDuplicateHoliday(hday) },
                            { label: 'Delete Holiday', icon: Trash2, danger: true, onClick: () => setHolidayToDelete(hday) },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No holidays found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Work Calendars */}
        {activeTab === 'Work Calendars' && (
          <div className="space-y-4">
            <div className="card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
              <table className="hcm-table w-full text-left">
                <thead className="hcm-thead">
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Calendar Name</th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Timezone</th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Weekend Days</th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Assigned Entities</th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Status</th>
                    <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {calendars?.length > 0 ? calendars.map(cal => {
                    const weekendsCount = cal.versions?.[0]?.weekends?.length || 0;
                    const assignmentsCount = cal.assignments?.length || 0;
                    return (
                      <tr key={cal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
                        <td className="px-6 py-4 hcm-td">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shadow-xs border border-indigo-100 dark:border-indigo-800">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-slate-900 dark:text-white text-xs">{cal.name}</p>
                                {cal.isDefaultCompanyCalendar && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-primary-50 text-primary-700 border border-primary-200">
                                    Default
                                  </span>
                                )}
                              </div>
                              {cal.description && <p className="text-[11px] text-slate-400 truncate max-w-xs">{cal.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hcm-td text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {cal.timezone || 'UTC'}
                        </td>
                        <td className="px-6 py-4 hcm-td text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                          {weekendsCount} {weekendsCount === 1 ? 'Day' : 'Days'}
                        </td>
                        <td className="px-6 py-4 hcm-td text-center">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                            {assignmentsCount} Assigned
                          </span>
                        </td>
                        <td className="px-6 py-4 hcm-td text-center">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border",
                            cal.status === 'ACTIVE' 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {cal.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hcm-td text-right select-none">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCalendarId(cal.id);
                                setActiveTab('Weekend Rules');
                              }}
                              className="btn-secondary btn-compact cursor-pointer"
                            >
                              Configure Rules
                            </button>
                            {!cal.isDefaultCompanyCalendar && (
                              <button
                                type="button"
                                onClick={() => setCalendarToDelete(cal)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Delete Calendar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr className="hcm-tr">
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400 hcm-td">
                        No work calendars found. Click "Add Calendar" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Weekend Rules */}
        {activeTab === 'Weekend Rules' && (
          <div className="space-y-6">
            {currentCalendar ? (
              <div className="space-y-6">
                {/* 7-Day Interactive Week Visual Planner */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Weekly Non-Working Pattern</h3>
                      <p className="text-xs text-slate-500">Click any day to quickly toggle between regular working day and designated off-day</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWeekendRuleModalOpen(true)}
                      className="btn-primary btn-compact cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Custom Rule</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {WEEKDAYS.map(day => {
                      const activeRule = activeWeekendRules.find(w => w.dayOfWeek === day.id);
                      const isOff = !!activeRule;
                      return (
                        <motion.div
                          key={day.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleToggleWeekday(day.id)}
                          className={cn("p-4 rounded-2xl border-2 transition-all cursor-pointer select-none text-center flex flex-col items-center justify-between min-h-[120px]",
                            isOff 
                              ? "bg-rose-50/70 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 shadow-xs" 
                              : "bg-emerald-50/50 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200"
                          )}
                        >
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {day.short}
                          </span>
                          <div className="my-1">
                            <span className="text-sm font-extrabold block">{day.label}</span>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 inline-block",
                              isOff ? "bg-rose-200/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300" : "bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                            )}>
                              {isOff ? (activeRule.type === 'HALF_DAY' ? 'Half Day Off' : 'Full Day Off') : 'Working Day'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 mt-1">
                            {isOff ? 'Click to Work' : 'Click to Off'}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekend Rules Table */}
                <div className="card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configured Rules for {currentCalendar.name}</h4>
                    <span className="text-xs text-slate-400">{activeWeekendRules.length} rules active</span>
                  </div>
                  <table className="hcm-table w-full text-left">
                    <thead className="hcm-thead">
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Day of Week</th>
                        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Rule Type</th>
                        <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {activeWeekendRules.length > 0 ? activeWeekendRules.map(w => (
                        <tr key={w.id || w.dayOfWeek} className="hcm-tr">
                          <td className="px-6 py-4 hcm-td font-bold text-slate-900 dark:text-white">
                            {w.dayOfWeek}
                          </td>
                          <td className="px-6 py-4 hcm-td text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border",
                              w.type === 'HALF_DAY' 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {w.type || 'FULL_DAY'}
                            </span>
                          </td>
                          <td className="px-6 py-4 hcm-td text-right select-none">
                            <button
                              type="button"
                              onClick={() => {
                                const newWeekends = activeWeekendRules.filter(wx => (wx.id ? wx.id !== w.id : wx.dayOfWeek !== w.dayOfWeek));
                                updateCalendar(currentCalendar.id, { 
                                  weekends: newWeekends.map(wx => ({ dayOfWeek: wx.dayOfWeek, type: wx.type || 'FULL_DAY' })) 
                                });
                              }}
                              className="btn-secondary btn-compact text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              Remove Rule
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr className="hcm-tr">
                          <td colSpan="3" className="px-6 py-10 text-center text-slate-400 hcm-td">
                            No weekend off rules defined for this calendar. All 7 days are treated as working days.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 rounded-2xl text-sm font-semibold text-center border border-amber-200">
                Please select or create a work calendar above to manage weekend rules.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Calendar Assignments */}
        {activeTab === 'Assignments' && (
          <div className="space-y-4">
            {currentCalendar ? (
              <div className="card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
                <table className="hcm-table w-full text-left">
                  <thead className="hcm-thead">
                    <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Entity Type</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Assigned To</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Effective From</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {activeAssignments.length > 0 ? activeAssignments.map(a => {
                      let entityLabel = a.entityId;
                      let entityIcon = Users;
                      if (a.entityType === 'EMPLOYEE') {
                        const u = users?.find(user => user.id === a.entityId || user.profileId === a.entityId);
                        if (u) entityLabel = `${u.name} (${u.email || u.empId || 'Employee'})`;
                      } else if (a.entityType === 'DEPARTMENT') {
                        entityIcon = Building;
                        const d = departments?.find(dept => dept.id === a.entityId);
                        if (d) entityLabel = d.name;
                      }
                      const Icon = entityIcon;
                      return (
                        <tr key={a.id} className="hcm-tr">
                          <td className="px-6 py-4 hcm-td">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1.5",
                              a.entityType === 'EMPLOYEE' ? "bg-blue-50 text-blue-700 border-blue-200" :
                              a.entityType === 'DEPARTMENT' ? "bg-purple-50 text-purple-700 border-purple-200" :
                              "bg-indigo-50 text-indigo-700 border-indigo-200"
                            )}>
                              <Icon size={12} />
                              <span>{a.entityType}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 hcm-td font-bold text-slate-900 dark:text-white">
                            {entityLabel}
                          </td>
                          <td className="px-6 py-4 hcm-td text-center font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {formatDate(a.effectiveFrom || a.createdAt)}
                          </td>
                          <td className="px-6 py-4 hcm-td text-right select-none">
                            <button
                              type="button"
                              onClick={() => setAssignmentToDelete(a)}
                              className="btn-secondary btn-compact text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr className="hcm-tr">
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 hcm-td">
                          <div className="max-w-sm mx-auto flex flex-col items-center">
                            <Users size={28} className="mb-2 text-slate-300" />
                            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No specific assignments</p>
                            <p className="text-xs text-slate-400 mb-3">This calendar applies to the whole company by default unless overridden.</p>
                            <button
                              type="button"
                              onClick={() => setIsAssignmentModalOpen(true)}
                              className="btn-primary btn-compact cursor-pointer"
                            >
                              Assign Calendar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 rounded-2xl text-sm font-semibold text-center border border-amber-200">
                Please select a calendar from the dropdown above to view assignments.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <HolidayModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setHolidayToEdit(null); }}
        holidayToEdit={holidayToEdit}
      />

      <ConfirmDialog
        isOpen={!!holidayToDelete}
        onClose={() => setHolidayToDelete(null)}
        onConfirm={() => {
          deleteHoliday(holidayToDelete.id);
          setHolidayToDelete(null);
        }}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${holidayToDelete?.name}"? This holiday will be removed from employee schedules.`}
      />

      <ConfirmDialog
        isOpen={!!calendarToDelete}
        onClose={() => setCalendarToDelete(null)}
        onConfirm={() => {
          deleteCalendar(calendarToDelete.id);
          setCalendarToDelete(null);
        }}
        title="Delete Work Calendar"
        message={`Are you sure you want to delete calendar "${calendarToDelete?.name}"?`}
      />

      <ConfirmDialog
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={() => {
          removeAssignment(assignmentToDelete.id);
          setAssignmentToDelete(null);
        }}
        title="Remove Calendar Assignment"
        message="Are you sure you want to remove this calendar assignment?"
      />
      
      <WeekendRuleModal 
        isOpen={isWeekendRuleModalOpen}
        onClose={() => setIsWeekendRuleModalOpen(false)}
        selectedCalendarId={selectedCalendarId}
        setSelectedCalendarId={setSelectedCalendarId}
      />
      
      <CalendarModal 
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
      
      <AssignmentModal 
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        selectedCalendarId={selectedCalendarId}
      />
    </div>
  );
};

export default Holidays;

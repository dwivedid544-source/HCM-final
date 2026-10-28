import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  Monitor, 
  Clock, 
  Lock, 
  Save, 
  RotateCcw, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  AlertTriangle, 
  User, 
  Sliders, 
  Calendar, 
  Briefcase, 
  LogOut, 
  RefreshCw, 
  Info, 
  Loader2, 
  Check,
  CalendarCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const MENU_ITEMS = [
  { id: 'general', label: 'General', icon: Monitor, desc: 'Display name, language, timezone, date format' },
  { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Change password, 2FA, login security' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and push notification alerts' },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon, desc: 'Theme mode and display preferences' },
  { id: 'resignation', label: 'Resignation', icon: LogOut, desc: 'Exit request and status workflow' },
];

const WORKFLOW_STEPS = [
  { key: 'INITIATED', label: 'Submitted' },
  { key: 'PENDING_MANAGER_APPROVAL', label: 'Manager Review' },
  { key: 'PENDING_HR_APPROVAL', label: 'HR Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'CLEARANCE_IN_PROGRESS', label: 'Clearance' },
  { key: 'EMPLOYEE_RELIEVED', label: 'Relieved' },
];

const STEP_ORDER = ['INITIATED', 'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'APPROVED', 'CLEARANCE_IN_PROGRESS', 'EMPLOYEE_RELIEVED', 'COMPLETED'];

const calcNoticeDays = (submissionDate, lastWorkingDay) => {
  if (!submissionDate || !lastWorkingDay) return null;
  const diff = Math.ceil((new Date(lastWorkingDay) - new Date(submissionDate)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
};

const EmployeeSettings = () => {
  const { profile, showToast, service } = useEmployee();
  const [activeTab, setActiveTab] = usePersistedTab('emp_settings', 'general');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Settings form state
  const [settings, setSettings] = useState({
    general: {
      displayName: '',
      email: '',
      language: 'English (US)',
      timezone: 'UTC+00:00 (London)',
      dateFormat: 'DD/MM/YYYY',
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
    },
    notifications: {
      emailNotif: true,
      pushNotif: true,
      weeklySummary: true,
    },
    preferences: {
      theme: 'System Default',
      compactMode: false,
      autoRefresh: true,
    },
  });

  // Snapshot for Reset button
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  // Passwords state for security tab
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Resignation workflow state
  const [resignationActive, setResignationActive] = useState(null);
  const [resignationHistory, setResignationHistory] = useState([]);
  const [loadingResignation, setLoadingResignation] = useState(false);
  const [submittingResignation, setSubmittingResignation] = useState(false);
  const [showResignationForm, setShowResignationForm] = useState(false);
  const [resignationData, setResignationData] = useState({
    reason: '',
    lastWorkingDay: '',
  });

  // ── Fetch Settings (GET /employee/settings) ──────────────────
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await service.getSettings();
      const data = res.data?.data;

      // Local preferences from storage
      let localPrefs = {};
      try {
        const stored = localStorage.getItem('hcm_emp_local_prefs');
        if (stored) localPrefs = JSON.parse(stored);
      } catch (_) {}

      const loaded = {
        general: {
          displayName: data?.displayName || profile?.fullName || '',
          email: data?.email || profile?.user?.email || '',
          language: data?.language || 'English (US)',
          timezone: data?.timezone || 'UTC+00:00 (London)',
          dateFormat: data?.dateFormat || 'DD/MM/YYYY',
        },
        security: {
          twoFactor: localPrefs.twoFactor ?? false,
          loginAlerts: localPrefs.loginAlerts ?? true,
        },
        notifications: {
          emailNotif: data?.emailNotif ?? true,
          pushNotif: data?.pushNotif ?? true,
          weeklySummary: data?.weeklySummary ?? true,
        },
        preferences: {
          theme: localPrefs.theme || 'System Default',
          compactMode: localPrefs.compactMode ?? false,
          autoRefresh: localPrefs.autoRefresh ?? true,
        },
      };

      setSettings(loaded);
      setInitialSnapshot(loaded);
    } catch (err) {
      console.error('Failed to load settings:', err);
      const fallback = {
        general: {
          displayName: profile?.fullName || '',
          email: profile?.user?.email || '',
          language: profile?.language || 'English (US)',
          timezone: profile?.timezone || 'UTC+00:00 (London)',
          dateFormat: profile?.dateFormat || 'DD/MM/YYYY',
        },
        security: { twoFactor: false, loginAlerts: true },
        notifications: {
          emailNotif: profile?.emailNotif ?? true,
          pushNotif: profile?.pushNotif ?? true,
          weeklySummary: profile?.weeklySummary ?? true,
        },
        preferences: { theme: 'System Default', compactMode: false, autoRefresh: true },
      };
      setSettings(fallback);
      setInitialSnapshot(fallback);
    } finally {
      setLoading(false);
    }
  }, [service, profile]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Fetch Resignation (GET /employee/resignation) ─────────────
  const fetchResignation = useCallback(async () => {
    try {
      setLoadingResignation(true);
      const res = await service.getResignation();
      const data = res.data?.data;
      if (data && typeof data === 'object' && 'history' in data) {
        setResignationActive(data.active);
        setResignationHistory(data.history || []);
      } else if (data && data.id) {
        setResignationActive(data);
        setResignationHistory([data]);
      } else {
        setResignationActive(null);
        setResignationHistory([]);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching resignation:', err);
      }
    } finally {
      setLoadingResignation(false);
    }
  }, [service]);

  useEffect(() => {
    if (activeTab === 'resignation') {
      fetchResignation();
    }
  }, [activeTab, fetchResignation]);

  // ── Update Field Helper ────────────────────────────────────
  const updateSetting = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  // ── Save Settings (PUT /employee/settings) ──────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        displayName: settings.general.displayName,
        language: settings.general.language,
        timezone: settings.general.timezone,
        dateFormat: settings.general.dateFormat,
        emailNotif: settings.notifications.emailNotif,
        pushNotif: settings.notifications.pushNotif,
        weeklySummary: settings.notifications.weeklySummary,
      };

      const res = await service.updateSettings(payload);

      // Save local preferences to localStorage
      localStorage.setItem('hcm_emp_local_prefs', JSON.stringify({
        twoFactor: settings.security.twoFactor,
        loginAlerts: settings.security.loginAlerts,
        theme: settings.preferences.theme,
        compactMode: settings.preferences.compactMode,
        autoRefresh: settings.preferences.autoRefresh,
      }));

      setInitialSnapshot(JSON.parse(JSON.stringify(settings)));
      showToast(res.data?.message || 'Settings saved successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to save settings.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset Settings to Saved Snapshot ───────────────────────
  const handleReset = () => {
    if (initialSnapshot) {
      setResetting(true);
      setSettings(JSON.parse(JSON.stringify(initialSnapshot)));
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setResetting(false);
        showToast('Settings reverted to saved values.', 'info');
      }, 300);
    }
  };

  // ── Change Password (PUT /employee/password) ────────────────
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showToast('All password fields are required.', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await service.updatePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      showToast(res.data?.message || 'Password updated successfully!', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update password.';
      showToast(msg, 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ── Submit Resignation (POST /employee/resignation) ─────────
  const handleSubmitResignation = async (e) => {
    if (e) e.preventDefault();
    if (!resignationData.reason.trim() || !resignationData.lastWorkingDay) {
      showToast('Please provide both Proposed Last Working Day and Reason.', 'error');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(resignationData.lastWorkingDay) <= today) {
      showToast('Proposed last working day must be a future date.', 'error');
      return;
    }

    try {
      setSubmittingResignation(true);
      await service.submitResignation(resignationData);
      showToast('Resignation request submitted successfully.', 'success');
      setResignationData({ reason: '', lastWorkingDay: '' });
      setShowResignationForm(false);
      await fetchResignation();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit resignation.';
      showToast(msg, 'error');
    } finally {
      setSubmittingResignation(false);
    }
  };

  // ── Derived helpers ────────────────────────────────────────
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const isResignationRejected = resignationActive && (
    resignationActive.status === 'REJECTED_BY_MANAGER' ||
    resignationActive.status === 'REJECTED_BY_HR'
  );

  const activeNoticeDays = resignationActive
    ? calcNoticeDays(resignationActive.submissionDate, resignationActive.finalLastWorkingDay || resignationActive.lastWorkingDay)
    : null;

  const currentStepIndex = resignationActive ? STEP_ORDER.indexOf(resignationActive.status) : 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Account Settings"
        subtitle="Manage your profile information, credentials, notifications, and exit requests"
      >
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={resetting || saving || loading}
            leftIcon={RotateCcw}
            isLoading={resetting}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || resetting || loading}
            leftIcon={Save}
            isLoading={saving}
          >
            Save Changes
          </Button>
        </div>
      </PageHeader>

      {/* ── Main Layout: Sidebar Tabs + Content Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-3 shadow-soft space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 py-2">
              Categories
            </p>
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'w-full group px-4 py-3.5 rounded-xl transition-all text-left flex items-center justify-between',
                      isActive
                        ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-md shadow-slate-900/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive
                            ? 'text-primary-300 dark:text-white'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        )}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-bold tracking-tight block truncate">
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] block truncate',
                            isActive
                              ? 'text-slate-300 dark:text-primary-100'
                              : 'text-slate-400 dark:text-slate-500'
                          )}
                        >
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={15}
                      className={cn(
                        'shrink-0 transition-transform',
                        isActive ? 'opacity-100 translate-x-0.5' : 'opacity-0 group-hover:opacity-40'
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {/* ── 1. GENERAL TAB ──────────────────────────────────── */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="card p-6 sm:p-8 space-y-8"
              >
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Monitor size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">General Information</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Personalize your display identity, regional time, and date formatting
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={settings.general.displayName}
                        onChange={(e) => updateSetting('general', 'displayName', e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="input-field h-11 pl-10 font-semibold"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">This name appears across your profile, approvals, and logs.</p>
                  </div>

                  {/* Account Email (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={settings.general.email || profile?.user?.email || ''}
                      disabled
                      className="input-field h-11 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                    />
                    <p className="text-[11px] text-slate-400">Primary authentication email (managed by administrator).</p>
                  </div>

                  {/* Preferred Language */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Preferred Language
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                      className="input-field h-11 font-medium bg-white dark:bg-slate-900"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="Spanish (ES)">Spanish (ES)</option>
                      <option value="French (FR)">French (FR)</option>
                      <option value="German (DE)">German (DE)</option>
                      <option value="Hindi (IN)">Hindi (IN)</option>
                      <option value="Arabic (AR)">Arabic (AR)</option>
                      <option value="Japanese (JA)">Japanese (JA)</option>
                    </select>
                  </div>

                  {/* Local Timezone */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Local Timezone
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        className="input-field h-11 pl-10 font-medium bg-white dark:bg-slate-900"
                      >
                        <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                        <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                        <option value="UTC+00:00 (London)">UTC+00:00 (London / GMT)</option>
                        <option value="UTC+01:00 (Paris / Berlin)">UTC+01:00 (Paris / Berlin)</option>
                        <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                        <option value="UTC+08:00 (Singapore / Beijing)">UTC+08:00 (Singapore / Beijing)</option>
                        <option value="UTC+09:00 (Tokyo)">UTC+09:00 (Tokyo)</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Format */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Date Format
                    </label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                      className="input-field h-11 font-medium bg-white dark:bg-slate-900"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/08/2026)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 08/09/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-08)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    leftIcon={Save}
                    isLoading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── 2. SECURITY TAB ─────────────────────────────────── */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Change Password Card */}
                <div className="card p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Ensure your account stays secure by choosing a strong, unique password
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Current Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          value={passwords.current}
                          onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                          placeholder="Enter current password"
                          required
                          className="input-field h-11 pr-11 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* New Password */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? 'text' : 'password'}
                            value={passwords.new}
                            onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                            placeholder="Enter new password (min 6 chars)"
                            required
                            className="input-field h-11 pr-11 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Confirm New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={passwords.confirm}
                            onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                            placeholder="Re-enter new password"
                            required
                            className="input-field h-11 pr-11 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Info size={13} /> Minimum 6 characters with mixed characters recommended.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        isLoading={updatingPassword}
                        leftIcon={Lock}
                      >
                        Update Password
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Additional Security Toggles */}
                <div className="card p-6 sm:p-8 space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Additional Security Controls
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Two-Factor Auth */}
                    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Two-Factor Auth (2FA)</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Verification code on login</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSetting('security', 'twoFactor', !settings.security.twoFactor)}
                        className={cn(
                          'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center',
                          settings.security.twoFactor ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                            settings.security.twoFactor ? 'translate-x-6' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>

                    {/* Login Alerts */}
                    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Login Alerts</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Get notified on new devices</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSetting('security', 'loginAlerts', !settings.security.loginAlerts)}
                        className={cn(
                          'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center',
                          settings.security.loginAlerts ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                            settings.security.loginAlerts ? 'translate-x-6' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 3. NOTIFICATIONS TAB ────────────────────────────── */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="card p-6 sm:p-8 space-y-8"
              >
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Control which notifications and alerts you receive from the portal
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="max-w-xl">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Email Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive email alerts regarding leave requests, payslip availability, support tickets, and company announcements.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSetting('notifications', 'emailNotif', !settings.notifications.emailNotif)}
                      className={cn(
                        'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center shrink-0 ml-4',
                        settings.notifications.emailNotif ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                          settings.notifications.emailNotif ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="max-w-xl">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Push Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive instant in-app and browser notifications for clock-in reminders and priority task assignments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSetting('notifications', 'pushNotif', !settings.notifications.pushNotif)}
                      className={cn(
                        'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center shrink-0 ml-4',
                        settings.notifications.pushNotif ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                          settings.notifications.pushNotif ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Weekly Summary */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="max-w-xl">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Weekly Summary Digest</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive a weekly digest summarizing your attendance hours, leave balances, and team updates every Monday morning.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSetting('notifications', 'weeklySummary', !settings.notifications.weeklySummary)}
                      className={cn(
                        'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center shrink-0 ml-4',
                        settings.notifications.weeklySummary ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                          settings.notifications.weeklySummary ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    leftIcon={Save}
                    isLoading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── 4. PREFERENCES TAB ──────────────────────────────── */}
            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="card p-6 sm:p-8 space-y-8"
              >
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <Sliders size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interface Preferences</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure your appearance theme and UI presentation preferences
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Theme Mode */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Theme Mode
                    </label>
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                      className="input-field h-11 font-medium bg-white dark:bg-slate-900"
                    >
                      <option value="System Default">System Default</option>
                      <option value="Light Mode">Light Mode</option>
                      <option value="Dark Mode">Dark Mode</option>
                    </select>
                  </div>

                  {/* Compact Mode Toggle */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Compact Table Layout</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Denser padding across tables</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSetting('preferences', 'compactMode', !settings.preferences.compactMode)}
                      className={cn(
                        'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center',
                        settings.preferences.compactMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                          settings.preferences.compactMode ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Auto Refresh Toggle */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Auto Refresh Feeds</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time attendance & updates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSetting('preferences', 'autoRefresh', !settings.preferences.autoRefresh)}
                      className={cn(
                        'w-12 h-6 rounded-full p-1 transition-colors relative inline-flex items-center',
                        settings.preferences.autoRefresh ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                          settings.preferences.autoRefresh ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    leftIcon={Save}
                    isLoading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── 5. RESIGNATION TAB ──────────────────────────────── */}
            {activeTab === 'resignation' && (
              <motion.div
                key="resignation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Resignation Overview Card */}
                <div className="card p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
                        <LogOut size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resignation Workflow</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Formal offboarding submission and exit clearance tracker
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={fetchResignation}
                      disabled={loadingResignation}
                      leftIcon={RefreshCw}
                      isLoading={loadingResignation}
                    >
                      Refresh Status
                    </Button>
                  </div>

                  {loadingResignation ? (
                    <div className="py-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-3" />
                      <p className="text-xs font-bold text-slate-400">Loading resignation records...</p>
                    </div>
                  ) : resignationActive && !showResignationForm ? (
                    /* Active Resignation Details */
                    <div className="space-y-6">
                      {/* Status Banner */}
                      <div className={cn(
                        'p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                        isResignationRejected
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            isResignationRejected ? 'bg-rose-100 text-rose-600' : 'bg-primary-50 text-primary-600 dark:bg-primary-950/40'
                          )}>
                            <LogOut size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Request</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              Submitted {formatDate(resignationActive.submissionDate)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={resignationActive.status} />
                      </div>

                      {/* Workflow Stepper */}
                      {!isResignationRejected && (
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-x-auto">
                          <div className="flex items-center justify-between min-w-[500px] px-2">
                            {WORKFLOW_STEPS.map((step, idx) => {
                              const isCompleted = currentStepIndex > idx;
                              const isCurrent = currentStepIndex === idx;
                              return (
                                <React.Fragment key={step.key}>
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div
                                      className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                        isCompleted
                                          ? 'bg-emerald-500 text-white'
                                          : isCurrent
                                          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30 ring-4 ring-primary-100 dark:ring-primary-900/40'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                      )}
                                    >
                                      {isCompleted ? <Check size={14} /> : idx + 1}
                                    </div>
                                    <span className={cn(
                                      'text-[10px] font-bold whitespace-nowrap',
                                      isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
                                    )}>
                                      {step.label}
                                    </span>
                                  </div>
                                  {idx < WORKFLOW_STEPS.length - 1 && (
                                    <div className={cn(
                                      'flex-1 h-0.5 mx-2 mb-4',
                                      isCompleted ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'
                                    )} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Request Key Attributes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted Date</p>
                          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                            <CalendarCheck size={15} className="text-primary-500" />
                            {formatDate(resignationActive.submissionDate)}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proposed Last Day</p>
                          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                            <Calendar size={15} className="text-amber-500" />
                            {formatDate(resignationActive.lastWorkingDay)}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice Period</p>
                          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                            <Briefcase size={15} className="text-indigo-500" />
                            {activeNoticeDays !== null ? `${activeNoticeDays} days` : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Reason text */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason for Departure</p>
                        <p className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {resignationActive.reason || 'No reason provided.'}
                        </p>
                      </div>

                      {/* Manager Feedback */}
                      {resignationActive.managerComment && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <User size={12} /> Manager Feedback
                          </p>
                          <p className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                            {resignationActive.managerComment}
                          </p>
                        </div>
                      )}

                      {/* HR Feedback */}
                      {resignationActive.hrComment && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <ShieldCheck size={12} /> HR Notes
                          </p>
                          <p className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                            {resignationActive.hrComment}
                          </p>
                        </div>
                      )}

                      {/* Rejection Alert + Resubmit Button */}
                      {isResignationRejected && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                              Your previous resignation request was rejected. You can review the comments above and submit a new request if necessary.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowResignationForm(true)}
                            leftIcon={LogOut}
                          >
                            New Resignation
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : showResignationForm ? (
                    /* Resignation Submission Form */
                    <form onSubmit={handleSubmitResignation} className="space-y-6">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-300">
                          <p className="font-bold">Before submitting your resignation</p>
                          <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                            Submitting this form initiates your formal offboarding process. Your manager and HR department will be notified for review.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Proposed Last Working Day */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Proposed Last Working Day <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                              type="date"
                              value={resignationData.lastWorkingDay}
                              onChange={(e) => setResignationData(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                              min={minDate}
                              required
                              className="input-field h-11 pl-10 font-semibold"
                            />
                          </div>
                          {resignationData.lastWorkingDay && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Info size={12} /> Notice period will be {calcNoticeDays(new Date().toISOString(), resignationData.lastWorkingDay)} days.
                            </p>
                          )}
                        </div>

                        {/* Reason for Resignation */}
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Reason for Resignation <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={4}
                            value={resignationData.reason}
                            onChange={(e) => setResignationData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Please provide details regarding your departure..."
                            required
                            className="input-field p-3 font-normal leading-relaxed resize-none"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setShowResignationForm(false);
                            setResignationData({ reason: '', lastWorkingDay: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          type="submit"
                          isLoading={submittingResignation}
                          leftIcon={LogOut}
                        >
                          Submit Resignation
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* No Active Resignation Empty State */
                    <div className="py-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <EmptyState
                        icon={LogOut}
                        title="No Active Resignation"
                        message="You do not currently have an active resignation or exit clearance process."
                        action={{
                          label: "Submit Resignation",
                          onClick: () => setShowResignationForm(true),
                          icon: LogOut
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Resignation History Table */}
                {resignationHistory.length > 0 && (
                  <div className="card p-6 sm:p-8 space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Resignation History
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="pb-3 px-2">Submitted</th>
                            <th className="pb-3 px-2">Proposed Last Day</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {resignationHistory.map((item, i) => (
                            <tr key={item.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">
                                {formatDate(item.submissionDate || item.createdAt)}
                              </td>
                              <td className="py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">
                                {formatDate(item.finalLastWorkingDay || item.lastWorkingDay)}
                              </td>
                              <td className="py-3 px-2">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="py-3 px-2 text-slate-500 dark:text-slate-400 max-w-xs truncate text-xs">
                                {item.reason || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSettings;

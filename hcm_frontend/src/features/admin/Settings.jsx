import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  ShieldCheck, 
  Database, 
  Save, 
  RotateCcw, 
  ChevronRight, 
  ChevronDown,
  Clock, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../context/AdminContext';
import { useSettings } from '../../context/SettingsContext';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import { adminAPI, authAPI } from '../../utils/apiService';
import ConfirmDialog from './components/ConfirmDialog';
import BackupCenter from './BackupCenter';
import PageHeader from '../../shared/components/ui/PageHeader';

const COUNTRY_OPTIONS = [
  { code: '+1', name: 'United States', label: '🇺🇸 United States (+1)' },
  { code: '+44', name: 'United Kingdom', label: '🇬🇧 United Kingdom (+44)' },
  { code: '+91', name: 'India', label: '🇮🇳 India (+91)' },
  { code: '+49', name: 'Germany (Europe)', label: '🇪🇺 Germany (Europe) (+49)' },
  { code: '+971', name: 'United Arab Emirates', label: '🇦🇪 United Arab Emirates (+971)' },
  { code: '+61', name: 'Australia', label: '🇦🇺 Australia (+61)' },
  { code: '+65', name: 'Singapore', label: '🇸🇬 Singapore (+65)' },
  { code: '+81', name: 'Japan', label: '🇯🇵 Japan (+81)' },
  { code: '+33', name: 'France', label: '🇫🇷 France (+33)' },
  { code: '+1-CA', name: 'Canada', label: '🇨🇦 Canada (+1)' }
];

const TIMEZONE_OPTIONS = [
  'UTC-08:00 (Pacific Standard Time)',
  'UTC-07:00 (Mountain Standard Time)',
  'UTC-06:00 (Central Standard Time)',
  'UTC-05:00 (Eastern Standard Time)',
  'UTC+00:00 (London, GMT)',
  'UTC+01:00 (Central European Time)',
  'UTC+04:00 (Gulf Standard Time - Dubai)',
  'UTC+05:30 (India Standard Time)',
  'UTC+08:00 (Singapore / Hong Kong)',
  'UTC+09:00 (Japan Standard Time)',
  'UTC+10:00 (Australian Eastern Time)'
];

const DATE_FORMAT_OPTIONS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD'
];

const SESSION_TIMEOUT_OPTIONS = [
  { value: '1 Minute', label: '1 Minute (Demo / Test)' },
  { value: '5 Minutes', label: '5 Minutes' },
  { value: '15 Minutes', label: '15 Minutes (Default)' },
  { value: '30 Minutes', label: '30 Minutes' },
  { value: '1 Hour', label: '1 Hour' },
  { value: '2 Hours', label: '2 Hours' }
];

const Settings = () => {
  const { showToast } = useAdmin();
  const { updateSettings: updateGlobalContextSettings } = useSettings();
  const [activeTab, setActiveTab] = usePersistedTab('admin_settings', 'general');

  // Real Database Settings State
  const [settingsData, setSettingsData] = useState({
    countryCode: '+1',
    timezone: 'UTC-08:00 (Pacific Standard Time)',
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD ($) - US Dollar',
    masterCurrency: 'USD ($) - US Dollar',
    twoFactorEnabled: true,
    sessionTimeout: '15 Minutes'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Security: Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState(null);
  const [passSuccess, setPassSuccess] = useState(null);

  // Fetch real authenticated organization settings from DB
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getSettings();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const normalized = {
          countryCode: d.countryCode || '+1',
          timezone: d.timezone || 'UTC-08:00 (Pacific Standard Time)',
          dateFormat: d.dateFormat || 'DD/MM/YYYY',
          currency: d.currency || 'USD ($)',
          masterCurrency: d.masterCurrency || 'USD ($) - US Dollar',
          twoFactorEnabled: d.twoFactorEnabled !== false,
          sessionTimeout: d.sessionTimeout || '15 Minutes'
        };
        setSettingsData(normalized);

        // Sync with app-wide context and localStorage silently
        const stored = {
          defaultPhoneCountry: normalized.countryCode,
          defaultTimezone: normalized.timezone,
          dateFormat: normalized.dateFormat,
          defaultCurrency: normalized.currency,
          masterCurrency: normalized.masterCurrency
        };
        try {
          localStorage.setItem('hcm_settings', JSON.stringify(stored));
        } catch {
          // Ignore localStorage errors
        }
        if (updateGlobalContextSettings) {
          updateGlobalContextSettings(stored, false);
        }
      }
    } catch (err) {
      console.error('Failed to load system settings from backend:', err);
      showToast('Failed to load system settings from database.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, updateGlobalContextSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle setting updates in state
  const handleFieldChange = (field, value) => {
    setSettingsData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Persist settings changes to database
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        countryCode: settingsData.countryCode,
        timezone: settingsData.timezone,
        dateFormat: settingsData.dateFormat,
        twoFactorEnabled: settingsData.twoFactorEnabled,
        sessionTimeout: settingsData.sessionTimeout
      };

      const res = await adminAPI.updateSettings(payload);
      if (res.data?.success) {
        const updated = res.data.data;
        setSettingsData(prev => ({
          ...prev,
          ...updated
        }));

        // Propagate changes to SettingsContext & localStorage silently
        const stored = {
          defaultPhoneCountry: updated.countryCode,
          defaultTimezone: updated.timezone,
          dateFormat: updated.dateFormat,
          defaultCurrency: updated.currency,
          masterCurrency: updated.masterCurrency
        };
        try {
          localStorage.setItem('hcm_settings', JSON.stringify(stored));
        } catch {
          // Ignore localStorage errors
        }
        if (updateGlobalContextSettings) {
          updateGlobalContextSettings(stored, false);
        }

        showToast('System settings saved and persisted to database.', 'success');
      } else {
        throw new Error(res.data?.error?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Failed to save settings to backend:', err);
      showToast(err.response?.data?.error?.message || err.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset settings to legitimate defaults in DB
  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      const res = await adminAPI.resetSettings();
      if (res.data?.success) {
        const resetData = res.data.data;
        setSettingsData(prev => ({
          ...prev,
          ...resetData
        }));

        // Propagate reset to SettingsContext & localStorage silently
        const stored = {
          defaultPhoneCountry: resetData.countryCode,
          defaultTimezone: resetData.timezone,
          dateFormat: resetData.dateFormat,
          defaultCurrency: resetData.currency,
          masterCurrency: resetData.masterCurrency
        };
        try {
          localStorage.setItem('hcm_settings', JSON.stringify(stored));
        } catch {
          // Ignore localStorage errors
        }
        if (updateGlobalContextSettings) {
          updateGlobalContextSettings(stored, false);
        }

        setIsResetConfirmOpen(false);
        showToast('System settings restored to defaults.', 'success');
      } else {
        throw new Error(res.data?.error?.message || 'Failed to reset settings.');
      }
    } catch (err) {
      console.error('Failed to reset settings:', err);
      showToast(err.response?.data?.error?.message || err.message || 'Failed to reset settings.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Password Reset Handler
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!passwordForm.currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }
    if (!passwordForm.newPassword) {
      setPassError('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError('New password and confirmation do not match.');
      return;
    }

    setPassLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPassSuccess('Password updated successfully! You can now use your new password.');
      showToast('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update password. Please verify your current password.';
      setPassError(msg);
    } finally {
      setPassLoading(false);
    }
  };

  const menuItems = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'backup', label: 'Data Backup & Export', icon: Database },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in text-left">
      {/* Header matching visual screenshot */}
      <PageHeader
        title="System Settings"
        description="Global platform preferences, security protocols and organization branding"
        actions={
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={isLoading || isResetting || isSaving}
              className="btn-secondary"
              title="Restore default organizational settings"
              id="reset-settings-btn"
            >
              <RotateCcw size={15} className={cn(isResetting && "animate-spin text-amber-500")} />
              <span>{isResetting ? 'Resetting...' : 'Reset Defaults'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isSaving || isResetting}
              className="btn-primary"
              title="Save changes to database"
              id="save-settings-btn"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        }
      />

      {/* Main Container: Configuration Tabs (Left) + Content Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Navigation Tab List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-4 px-2">
              Configuration Tabs
            </span>
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full group p-3.5 sm:p-4 rounded-xl transition-all text-left flex items-center justify-between cursor-pointer select-none shrink-0 lg:shrink",
                      isActive
                        ? "bg-[#0f172a] text-white shadow-md"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                    )}
                    id={`settings-tab-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={cn(
                          "transition-colors",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        )}
                      />
                      <span className="text-sm font-bold tracking-tight">
                        {item.label}
                      </span>
                    </div>
                    {isActive && (
                      <ChevronRight size={16} className="text-slate-400 hidden sm:block" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right: Settings Content Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-12 shadow-xs flex flex-col items-center justify-center space-y-3">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-400">Loading settings from database...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Tab 1: General Preferences */}
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-7 sm:p-9 shadow-xs space-y-8"
                >
                  {/* Card Header matching screenshot */}
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                      <Monitor size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        General Preferences
                      </h3>
                    </div>
                  </div>

                  {/* 2x2 Form Grid matching screenshot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Country Code */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block form-label">
                        Country Code
                      </label>
                      <div className="relative">
                        <select
                          value={settingsData.countryCode}
                          onChange={(e) => handleFieldChange('countryCode', e.target.value)}
                          className="w-full px-4 py-3.5 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                          id="settings-country-code"
                        >
                          {COUNTRY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Primary Timezone */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block form-label">
                        Primary Timezone
                      </label>
                      <div className="relative">
                        <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={settingsData.timezone}
                          onChange={(e) => handleFieldChange('timezone', e.target.value)}
                          className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                          id="settings-timezone"
                        >
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block form-label">
                        DATE FORMAT
                      </label>
                      <div className="relative">
                        <select
                          value={settingsData.dateFormat}
                          onChange={(e) => handleFieldChange('dateFormat', e.target.value)}
                          className="w-full px-4 py-3.5 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                          id="settings-date-format"
                        >
                          {DATE_FORMAT_OPTIONS.map((fmt) => (
                            <option key={fmt} value={fmt}>
                              {fmt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Default Currency (Locked / Inherited from Master Ledger) */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block form-label">
                        DEFAULT CURRENCY
                      </label>
                      <div
                        className="w-full px-4 py-3.5 bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between select-none cursor-not-allowed"
                        id="settings-currency-display"
                      >
                        <span className="font-mono font-bold">
                          {settingsData.masterCurrency || 'USD ($) - US Dollar'}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <Lock size={13} />
                          <span>Inherited from Master Ledger</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Security & Authentication */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  {/* Change Password Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-7 sm:p-9 shadow-xs space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                        <Key size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                          Change Account Password
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Update your default provisioned password to a secure personal credential
                        </p>
                      </div>
                    </div>

                    {passError && (
                      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{passError}</span>
                      </div>
                    )}

                    {passSuccess && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>{passSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordReset} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider form-label">
                            Current Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                              placeholder="Current password"
                              className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                              {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider form-label">
                            New Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                              placeholder="Enter new password"
                              className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                              {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider form-label">
                            Confirm Password <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPass ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                              placeholder="Confirm new password"
                              className="w-full px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                              {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-slate-400">
                          Password must be at least 6 characters and match both entries.
                        </p>
                        <button
                          type="submit"
                          disabled={passLoading}
                          className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
                        >
                          {passLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                          <span>Update Password</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 2FA & Session Security */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Two-Factor Auth (2FA) */}
                    <div className="bg-[#0b1329] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-400">
                          <ShieldCheck size={18} />
                          <h4 className="text-xs font-black uppercase tracking-wider">Two-Factor Authentication</h4>
                        </div>
                        <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                          Enforce multi-factor verification protocols for all organization administrators.
                        </p>
                      </div>

                      <div
                        onClick={() => handleFieldChange('twoFactorEnabled', !settingsData.twoFactorEnabled)}
                        className={cn(
                          "w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors shrink-0",
                          settingsData.twoFactorEnabled ? "bg-emerald-500" : "bg-slate-700"
                        )}
                        id="toggle-2fa-btn"
                      >
                        <div
                          className={cn(
                            "w-4.5 h-4.5 bg-white rounded-full transition-transform shadow-xs",
                            settingsData.twoFactorEnabled ? "translate-x-5.5" : "translate-x-0"
                          )}
                        />
                      </div>
                    </div>

                    {/* Auto-Logout Timeout */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Session Protocol
                      </span>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Auto-Logout Timeout
                        </span>
                        <select
                          value={settingsData.sessionTimeout}
                          onChange={(e) => handleFieldChange('sessionTimeout', e.target.value)}
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          id="settings-session-timeout"
                        >
                          {SESSION_TIMEOUT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Data Backup & Export (Reusing Real Backup Center) */}
              {activeTab === 'backup' && (
                <motion.div
                  key="backup"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <BackupCenter />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset System Settings to Defaults?"
        message="This will restore your organization's timezone, date format, country code, and security preferences to default platform values. Any customized preferences will be overwritten."
        confirmText="Reset to Defaults"
        type="warning"
      />
    </div>
  );
};

export default Settings;

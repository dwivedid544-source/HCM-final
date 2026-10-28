import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Bell,
  Monitor,
  Clock,
  Globe,
  Lock,
  Save,
  RotateCcw,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Sliders,
  SlidersHorizontal,
  Key
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import { authAPI } from '../../utils/apiService';
import { usePersistedTab } from '../../hooks/usePersistedTab';

import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';

const DEFAULT_SETTINGS = {
  general: {
    fullName: '',
    email: '',
    timezone: 'UTC-05:00 (Scranton Efficiency Time)',
    language: 'English (US)',
    dateFormat: 'MM/DD/YYYY'
  },
  security: {
    twoFactor: true,
    loginAlerts: true
  },
  notifications: {
    emailAlerts: true,
    leaveAlerts: true,
    kpiAlerts: true,
    taskAlerts: true,
    browserNotif: false
  },
  preferences: {
    theme: 'System Default',
    tableRows: '10',
    autoRefresh: true,
    defaultPage: 'Dashboard'
  }
};

const ManagerSettings = () => {
  const { profile, updateProfile, showToast } = useManager();
  const [activeTab, setActiveTab] = usePersistedTab('mgr_settings', 'general');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync settings with DB profile and localStorage
  useEffect(() => {
    if (profile) {
      const storageKey = `manager_settings_${profile.id}`;
      let parsedPrefs = {};
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) parsedPrefs = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading stored settings:', e);
      }

      setSettings({
        general: {
          fullName: profile.fullName || '',
          email: profile.user?.email || '',
          timezone: profile.timezone || parsedPrefs.general?.timezone || DEFAULT_SETTINGS.general.timezone,
          language: profile.language || parsedPrefs.general?.language || DEFAULT_SETTINGS.general.language,
          dateFormat: profile.dateFormat || parsedPrefs.general?.dateFormat || DEFAULT_SETTINGS.general.dateFormat
        },
        security: {
          twoFactor: parsedPrefs.security?.twoFactor !== undefined ? parsedPrefs.security.twoFactor : DEFAULT_SETTINGS.security.twoFactor,
          loginAlerts: parsedPrefs.security?.loginAlerts !== undefined ? parsedPrefs.security.loginAlerts : DEFAULT_SETTINGS.security.loginAlerts
        },
        notifications: {
          emailAlerts: parsedPrefs.notifications?.emailAlerts !== undefined ? parsedPrefs.notifications.emailAlerts : DEFAULT_SETTINGS.notifications.emailAlerts,
          leaveAlerts: parsedPrefs.notifications?.leaveAlerts !== undefined ? parsedPrefs.notifications.leaveAlerts : DEFAULT_SETTINGS.notifications.leaveAlerts,
          kpiAlerts: parsedPrefs.notifications?.kpiAlerts !== undefined ? parsedPrefs.notifications.kpiAlerts : DEFAULT_SETTINGS.notifications.kpiAlerts,
          taskAlerts: parsedPrefs.notifications?.taskAlerts !== undefined ? parsedPrefs.notifications.taskAlerts : DEFAULT_SETTINGS.notifications.taskAlerts,
          browserNotif: parsedPrefs.notifications?.browserNotif !== undefined ? parsedPrefs.notifications.browserNotif : DEFAULT_SETTINGS.notifications.browserNotif
        },
        preferences: {
          theme: parsedPrefs.preferences?.theme || DEFAULT_SETTINGS.preferences.theme,
          tableRows: parsedPrefs.preferences?.tableRows || DEFAULT_SETTINGS.preferences.tableRows,
          autoRefresh: parsedPrefs.preferences?.autoRefresh !== undefined ? parsedPrefs.preferences.autoRefresh : DEFAULT_SETTINGS.preferences.autoRefresh,
          defaultPage: parsedPrefs.preferences?.defaultPage || DEFAULT_SETTINGS.preferences.defaultPage
        }
      });
    }
  }, [profile]);

  const updateSetting = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      if (!settings.general.fullName.trim()) {
        showToast('Full Name cannot be empty.', 'error');
        return;
      }

      // Save to database via API
      await updateProfile({
        fullName: settings.general.fullName.trim(),
        language: settings.general.language,
        timezone: settings.general.timezone,
        dateFormat: settings.general.dateFormat,
        emailNotif: settings.notifications.emailAlerts
      });

      // Save full settings tree to localStorage
      localStorage.setItem(`manager_settings_${profile.id}`, JSON.stringify(settings));
      showToast('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!profile) return;
    try {
      setResetting(true);
      localStorage.removeItem(`manager_settings_${profile.id}`);

      const resetObj = {
        ...DEFAULT_SETTINGS,
        general: {
          ...DEFAULT_SETTINGS.general,
          fullName: profile.fullName || '',
          email: profile.user?.email || ''
        }
      };

      setSettings(resetObj);

      await updateProfile({
        language: DEFAULT_SETTINGS.general.language,
        timezone: DEFAULT_SETTINGS.general.timezone,
        dateFormat: DEFAULT_SETTINGS.general.dateFormat,
        emailNotif: DEFAULT_SETTINGS.notifications.emailAlerts
      });

      showToast('Default settings restored successfully.', 'success');
    } catch (err) {
      console.error('Error resetting settings:', err);
      showToast('Failed to reset settings.', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showToast('All password fields are required.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setUpdatingPassword(true);
      await authAPI.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      showToast('Password updated successfully!', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error('Password update error:', err);
      const errMsg = err.response?.data?.error?.message || 'Failed to update password.';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const menuItems = [
    { id: 'general', label: 'General', icon: Monitor, desc: 'Language, timezone, date format' },
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Password, 2FA, login alerts' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and system alerts' },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon, desc: 'UI theme and table display' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Manager Settings"
        subtitle="Configure your region and platform preferences"
      >
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RotateCcw}
            isLoading={resetting}
            isDisabled={saving || resetting}
            onClick={handleReset}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Save}
            isLoading={saving}
            isDisabled={saving || resetting}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </PageHeader>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Mobile Tab Select (Visible on Mobile) */}
        <div className="block lg:hidden w-full">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Select Category
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Sidebar Navigation (Visible on Desktop) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-2">
              Settings Categories
            </p>
            <nav className="space-y-1.5 mt-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-left group',
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={cn(
                          isActive
                            ? 'text-primary-400 dark:text-primary-600'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        )}
                      />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={cn(
                        'transition-transform',
                        isActive ? 'opacity-100 translate-x-0.5' : 'opacity-0 group-hover:opacity-40'
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Settings Panel Area */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {/* GENERAL PREFERENCES TAB */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      General Preferences
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure your name, region, primary timezone and date display format
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Manager Identity Name
                    </label>
                    <input
                      type="text"
                      value={settings.general.fullName}
                      onChange={(e) => updateSetting('general', 'fullName', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      System Language
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="Spanish (ES)">Spanish (ES)</option>
                      <option value="French (FR)">French (FR)</option>
                      <option value="German (DE)">German (DE)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Primary Timezone
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                      <option value="UTC-05:00 (Scranton Efficiency Time)">UTC-05:00 (Eastern Time / Scranton)</option>
                      <option value="UTC+00:00 (London GMT)">UTC+00:00 (London GMT)</option>
                      <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date Display Format
                    </label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SECURITY & ACCESS TAB */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Security & Access Control
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Update your account password and security alert preferences
                    </p>
                  </div>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Change Password
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          placeholder="Enter your current password..."
                          className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          placeholder="At least 6 characters..."
                          className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder="Re-enter new password..."
                          className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      leftIcon={Key}
                      isLoading={updatingPassword}
                      isDisabled={updatingPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>

                {/* Security Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div
                    onClick={() => updateSetting('security', 'twoFactor', !settings.security.twoFactor)}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Enforce additional login verification</p>
                    </div>
                    <div
                      className={cn(
                        'w-10 h-5 rounded-full p-0.5 transition-colors shrink-0',
                        settings.security.twoFactor ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-xs',
                          settings.security.twoFactor ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => updateSetting('security', 'loginAlerts', !settings.security.loginAlerts)}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Unfamiliar Login Alerts</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Receive notifications for new device logins</p>
                    </div>
                    <div
                      className={cn(
                        'w-10 h-5 rounded-full p-0.5 transition-colors shrink-0',
                        settings.security.loginAlerts ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-xs',
                          settings.security.loginAlerts ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ALERTS & NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Alerts & Notifications
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure email, leave, task, and KPI alert delivery channels
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'emailAlerts', label: 'Email Digest Alerts', desc: 'Receive daily summary email reports' },
                    { id: 'leaveAlerts', label: 'Leave Request Alerts', desc: 'Notify on team leave submissions' },
                    { id: 'kpiAlerts', label: 'KPI Threshold Alerts', desc: 'Alert when team goals fall behind' },
                    { id: 'taskAlerts', label: 'Task Status Updates', desc: 'Notify when assigned tasks are completed' },
                    { id: 'browserNotif', label: 'Browser Push Notifications', desc: 'Show desktop notifications for real-time events' }
                  ].map((item) => {
                    const isChecked = !!settings.notifications[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => updateSetting('notifications', item.id, !isChecked)}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                        <div
                          className={cn(
                            'w-10 h-5 rounded-full p-0.5 transition-colors shrink-0',
                            isChecked ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 bg-white rounded-full transition-transform shadow-xs',
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <SettingsIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      User Interface Preferences
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure table pagination, theme display, and dashboard auto-refresh
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Default Table Pagination
                    </label>
                    <select
                      value={settings.preferences.tableRows}
                      onChange={(e) => updateSetting('preferences', 'tableRows', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="10">10 Rows per page</option>
                      <option value="25">25 Rows per page</option>
                      <option value="50">50 Rows per page</option>
                      <option value="100">100 Rows per page</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Landing Page Default
                    </label>
                    <select
                      value={settings.preferences.defaultPage}
                      onChange={(e) => updateSetting('preferences', 'defaultPage', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="Dashboard">Dashboard</option>
                      <option value="Team Members">Team Members</option>
                      <option value="Attendance Review">Attendance Review</option>
                      <option value="Tasks">Tasks</option>
                    </select>
                  </div>

                  <div
                    onClick={() => updateSetting('preferences', 'autoRefresh', !settings.preferences.autoRefresh)}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-all md:col-span-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Refresh Dashboards</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Automatically pull updated metrics periodically</p>
                    </div>
                    <div
                      className={cn(
                        'w-10 h-5 rounded-full p-0.5 transition-colors shrink-0',
                        settings.preferences.autoRefresh ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 bg-white rounded-full transition-transform shadow-xs',
                          settings.preferences.autoRefresh ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ManagerSettings;

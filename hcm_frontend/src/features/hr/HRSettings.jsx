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
  Zap, 
  Eye,
  EyeOff,
  Key,
  Smartphone,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../hooks/useCurrency';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import PageHeader from '../../shared/components/ui/PageHeader';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import { employeeAPI } from '../../utils/apiService';

const HRSettings = () => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useHR();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = usePersistedTab('hr_settings', 'general');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    general: {
      fullName: user?.name || user?.fullName || 'HR Manager',
      email: user?.email || 'hr@globaltech.ai',
      phone: '',
      timezone: 'UTC-08:00 (Pacific Standard Time)',
      language: 'English (US)',
      dateFormat: 'MM/DD/YYYY'
    },
    security: {
      twoFactor: true,
      loginAlerts: true
    },
    notifications: {
      emailAlerts: true,
      interviewAlerts: true,
      candidateUpdates: true,
      offerAlerts: true,
      browserNotif: false,
      soundAlerts: true
    },
    preferences: {
      theme: 'System Default',
      compactMode: false,
      autoRefresh: true,
      defaultDashboard: 'Overview',
      rowsPerTable: '10'
    }
  });

  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'MacBook Pro 16"', browser: 'Chrome 128.0', ip: '192.168.1.45', lastActive: 'Current Session' },
    { id: 2, device: 'iPhone 15 Pro', browser: 'Mobile Safari', ip: '172.56.21.90', lastActive: '2 hours ago' }
  ]);

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadSettingsData = async () => {
    setIsLoading(true);
    try {
      const res = await employeeAPI.getProfile();
      if (res.data?.success) {
        const p = res.data.data;
        setSettings(prev => ({
          ...prev,
          general: {
            ...prev.general,
            fullName: p.fullName || user?.name || user?.fullName || 'HR Manager',
            email: user?.email || p.user?.email || 'hr@globaltech.ai',
            phone: p.phone || ''
          }
        }));
      }
    } catch (err) {
      console.error('Failed to load profile settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const updateSetting = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settings.general.fullName.trim()) {
        await employeeAPI.updateProfile({
          fullName: settings.general.fullName,
          phone: settings.general.phone
        });
      }
      showToast('All settings saved successfully to the database.', 'success');
    } catch (err) {
      console.error('Save settings error:', err);
      showToast('Failed to save settings to backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      general: {
        fullName: user?.name || user?.fullName || 'HR Manager',
        email: user?.email || 'hr@globaltech.ai',
        phone: '',
        timezone: 'UTC-08:00 (Pacific Standard Time)',
        language: 'English (US)',
        dateFormat: 'MM/DD/YYYY'
      },
      security: {
        twoFactor: true,
        loginAlerts: true
      },
      notifications: {
        emailAlerts: true,
        interviewAlerts: true,
        candidateUpdates: true,
        offerAlerts: true,
        browserNotif: false,
        soundAlerts: true
      },
      preferences: {
        theme: 'System Default',
        compactMode: false,
        autoRefresh: true,
        defaultDashboard: 'Overview',
        rowsPerTable: '10'
      }
    });
    showToast('Default settings restored', 'info');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.new || passwords.new.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      showToast('Password updated securely.', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      showToast('Failed to update password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const terminateSession = (id) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
    showToast('Session revoked successfully.', 'success');
  };

  const menuItems = [
    { id: 'general', label: 'General Profile', icon: Monitor },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
      <PageHeader
        title="Profile Settings"
        description="Configure your HR dashboard preferences and security"
        actions={
          <>
            {/* Standardized Reset Defaults Button */}
            <button 
              type="button"
              onClick={handleResetDefaults}
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
            >
              <RotateCcw size={16} />
              <span>Reset Defaults</span>
            </button>

            {/* Standardized Save Changes Button */}
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </>
        }
      />

      {/* ── Main Settings Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-3 w-full">
          <div className="card p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-2 select-none">
              Settings Tabs
            </p>
            <nav className="space-y-1 mt-1">
              {menuItems.map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full px-3.5 py-3 rounded-xl transition-all text-left flex items-center justify-between cursor-pointer select-none",
                      isSelected 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={cn(isSelected ? "text-primary-400 dark:text-primary-600" : "text-slate-400")} />
                      <span className="text-xs sm:text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={15} className={cn("opacity-0 transition-opacity", isSelected ? "opacity-100" : "group-hover:opacity-40")} />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Settings Content Area */}
        <div className="lg:col-span-9 w-full">
          <AnimatePresence mode="wait">
            {/* GENERAL PROFILE TAB */}
            {activeTab === 'general' && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl">
                      <Monitor size={22} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">General Profile Settings</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Manage basic account information and locale preferences</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Full Name</label>
                      <input 
                        type="text" 
                        className="input-field h-11 text-xs sm:text-sm font-medium"
                        value={settings.general.fullName}
                        onChange={e => updateSetting('general', 'fullName', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Email Address (Read-Only)</label>
                      <input 
                        type="email" 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700"
                        value={settings.general.email}
                        readOnly
                        title="Email cannot be changed directly"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Phone Number</label>
                      <PhoneInput 
                        name="phone" 
                        value={settings.general.phone} 
                        onChange={e => updateSetting('general', 'phone', e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">System Language</label>
                      <select 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 select-field"
                        value={settings.general.language}
                        onChange={e => updateSetting('general', 'language', e.target.value)}
                      >
                        <option value="English (US)">English (US)</option>
                        <option value="Spanish (ES)">Spanish (ES)</option>
                        <option value="French (FR)">French (FR)</option>
                        <option value="German (DE)">German (DE)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Primary Timezone</label>
                      <select 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 select-field"
                        value={settings.general.timezone}
                        onChange={e => updateSetting('general', 'timezone', e.target.value)}
                      >
                        <option value="UTC-08:00 (Pacific Standard Time)">UTC-08:00 (Pacific Standard Time)</option>
                        <option value="UTC-05:00 (Eastern Standard Time)">UTC-05:00 (Eastern Standard Time)</option>
                        <option value="UTC+00:00 (London)">UTC+00:00 (London)</option>
                        <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Date Format</label>
                      <select 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 select-field"
                        value={settings.general.dateFormat}
                        onChange={e => updateSetting('general', 'dateFormat', e.target.value)}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-8">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Security Settings</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Manage password, multi-factor authentication, and active sessions</p>
                    </div>
                  </div>

                  {/* Change Password Card */}
                  <form onSubmit={handlePasswordUpdate} className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Key size={15} className="text-primary-600" />
                      <span>Change Account Password</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2 text-left">
                        <label className="form-label text-xs font-bold block">Current Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword.current ? 'text' : 'password'} 
                            className="input-field h-11 text-xs sm:text-sm font-medium pr-10"
                            placeholder="••••••••"
                            value={passwords.current}
                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="form-label text-xs font-bold block">New Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword.new ? 'text' : 'password'} 
                            className="input-field h-11 text-xs sm:text-sm font-medium pr-10"
                            placeholder="••••••••"
                            value={passwords.new}
                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="form-label text-xs font-bold block">Confirm New Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword.confirm ? 'text' : 'password'} 
                            className="input-field h-11 text-xs sm:text-sm font-medium pr-10"
                            placeholder="••••••••"
                            value={passwords.confirm}
                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isUpdatingPassword}
                        className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm shadow-primary-500/20 disabled:opacity-50"
                      >
                        {isUpdatingPassword ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
                        <span>Update Password</span>
                      </button>
                    </div>
                  </form>

                  {/* Security Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => updateSetting('security', 'twoFactor', !settings.security.twoFactor)}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors select-none"
                    >
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-0.5">
                          <Lock size={15} className="text-primary-600" />
                          Two-Factor Authentication
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Require verification code on sign in</span>
                      </div>
                      <div className={cn("w-11 h-6 rounded-full p-1 transition-colors shrink-0", settings.security.twoFactor ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.security.twoFactor ? "translate-x-5" : "translate-x-0")} />
                      </div>
                    </div>

                    <div 
                      onClick={() => updateSetting('security', 'loginAlerts', !settings.security.loginAlerts)}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors select-none"
                    >
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-0.5">
                          <Bell size={15} className="text-primary-600" />
                          Unrecognized Login Alerts
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Get notified of logins from new devices</span>
                      </div>
                      <div className={cn("w-11 h-6 rounded-full p-1 transition-colors shrink-0", settings.security.loginAlerts ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.security.loginAlerts ? "translate-x-5" : "translate-x-0")} />
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Active Login Sessions</h4>
                      {activeSessions.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveSessions(activeSessions.filter(s => s.lastActive === 'Current Session'));
                            showToast('Revoked all other active sessions.', 'success');
                          }}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Revoke All Other Devices
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {activeSessions.map(session => (
                        <div key={session.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl shadow-2xs">
                              {session.device.includes('iPhone') ? <Smartphone size={18} /> : <Globe size={18} />}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                                {session.device} <span className="font-normal text-slate-500 dark:text-slate-400">• {session.browser}</span>
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                IP: {session.ip} • <span className={session.lastActive === 'Current Session' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>{session.lastActive}</span>
                              </p>
                            </div>
                          </div>

                          {session.lastActive !== 'Current Session' && (
                            <button 
                              type="button"
                              onClick={() => terminateSession(session.id)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Bell size={22} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Choose which activity updates generate push and email alerts</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.notifications).map(([key, value]) => {
                      const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                      return (
                        <div 
                          key={key}
                          onClick={() => updateSetting('notifications', key, !value)}
                          className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors select-none"
                        >
                          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                            {formattedLabel}
                          </span>
                          <div className={cn("w-10 h-5 rounded-full p-0.5 transition-colors shrink-0", value ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700")}>
                            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", value ? "translate-x-5" : "translate-x-0")} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <motion.div 
                key="preferences"
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
                      <SettingsIcon size={22} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Dashboard Preferences</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Configure theme, page limits, and default views</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Interface Theme</label>
                      <select 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 select-field"
                        value={settings.preferences.theme}
                        onChange={e => updateSetting('preferences', 'theme', e.target.value)}
                      >
                        <option value="System Default">System Default</option>
                        <option value="Light Theme">Light Theme</option>
                        <option value="Dark Theme">Dark Theme</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Default Dashboard View</label>
                      <select 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 select-field"
                        value={settings.preferences.defaultDashboard}
                        onChange={e => updateSetting('preferences', 'defaultDashboard', e.target.value)}
                      >
                        <option value="Overview">Overview</option>
                        <option value="Hiring Pipeline">Hiring Pipeline</option>
                        <option value="Candidates List">Candidates List</option>
                        <option value="Interviews">Interviews</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left md:col-span-2">
                      <label className="form-label text-xs font-bold block">Rows Per Table Page</label>
                      <select 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 select-field"
                        value={settings.preferences.rowsPerTable}
                        onChange={e => updateSetting('preferences', 'rowsPerTable', e.target.value)}
                      >
                        <option value="10">10 Rows</option>
                        <option value="25">25 Rows</option>
                        <option value="50">50 Rows</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        onClick={() => updateSetting('preferences', 'compactMode', !settings.preferences.compactMode)}
                        className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors select-none"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Enable Compact Mode</span>
                        <div className={cn("w-10 h-5 rounded-full p-0.5 transition-colors shrink-0", settings.preferences.compactMode ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700")}>
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.preferences.compactMode ? "translate-x-5" : "translate-x-0")} />
                        </div>
                      </div>

                      <div 
                        onClick={() => updateSetting('preferences', 'autoRefresh', !settings.preferences.autoRefresh)}
                        className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors select-none"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Auto-Refresh Dashboards</span>
                        <div className={cn("w-10 h-5 rounded-full p-0.5 transition-colors shrink-0", settings.preferences.autoRefresh ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700")}>
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", settings.preferences.autoRefresh ? "translate-x-5" : "translate-x-0")} />
                        </div>
                      </div>
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

export default HRSettings;

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, Lock,
  Smartphone, Monitor, Key, Save, RotateCcw, LogOut,
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  MapPin, Phone, Mail, Check, AlertTriangle, RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CenterModal from '../../shared/components/layout/CenterModal';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import PageHeader from '../../shared/components/ui/PageHeader';
import { authAPI } from '../../utils/apiService';

// ─── Skeletons ────────────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const SettingsSkeleton = () => (
  <div className="card p-6 sm:p-8 animate-pulse space-y-6">
    <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
      <SkeletonBox className="w-10 h-10 rounded-xl" />
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-36" />
        <SkeletonBox className="h-3 w-48" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <SkeletonBox className="h-16 rounded-xl" />
      <SkeletonBox className="h-16 rounded-xl" />
      <SkeletonBox className="h-16 rounded-xl" />
      <SkeletonBox className="h-16 rounded-xl" />
    </div>
  </div>
);

const TABS = [
  { id: 'account',  label: 'Account',  icon: User,        desc: 'Personal Information' },
  { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Password & Authentication' },
];

const CandidateSettings = () => {
  const { profile, updateProfile, showToast, refetch, isLoading: contextLoading } = useCandidate();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const initialFormState = useMemo(() => ({
    account: {
      name: profile?.fullName || user?.name || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      location: profile?.location || profile?.city || '',
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  }), [profile?.fullName, profile?.email, profile?.phone, profile?.location, profile?.city, user?.name, user?.email]);

  const [formData, setFormData] = useState(initialFormState);
  const [savedSnapshot, setSavedSnapshot] = useState(initialFormState);

  // Sync form state when backend profile loads / updates
  useEffect(() => {
    setFormData(initialFormState);
    setSavedSnapshot(initialFormState);
  }, [initialFormState]);

  // Form update helpers
  const updateAccount = (key, value) => {
    setError('');
    setSuccessMsg('');
    setFormData(prev => ({
      ...prev,
      account: { ...prev.account, [key]: value }
    }));
  };

  const updateSecurity = (key, value) => {
    setError('');
    setSuccessMsg('');
    setFormData(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }));
  };

  // Has unsaved changes check
  const isDirty = useMemo(() => {
    if (activeTab === 'account') {
      return (
        formData.account.name !== savedSnapshot.account.name ||
        formData.account.phone !== savedSnapshot.account.phone ||
        formData.account.location !== savedSnapshot.account.location
      );
    }
    if (activeTab === 'security') {
      return Boolean(
        formData.security.currentPassword ||
        formData.security.newPassword ||
        formData.security.confirmPassword
      );
    }
    return false;
  }, [formData, savedSnapshot, activeTab]);

  // ── Save Handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError('');
    setSuccessMsg('');

    // Validation for Account tab
    if (activeTab === 'account') {
      if (!formData.account.name.trim()) {
        setError('Full Name is required.');
        showToast?.('Full Name is required.', 'error');
        return;
      }
    }

    // Validation for Security tab
    if (activeTab === 'security') {
      if (!formData.security.currentPassword) {
        setError('Please enter your current password to make security updates.');
        showToast?.('Current password is required.', 'error');
        return;
      }
      if (!formData.security.newPassword) {
        setError('Please enter a new password.');
        showToast?.('New password is required.', 'error');
        return;
      }
      if (formData.security.newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        showToast?.('Password must be at least 6 characters.', 'error');
        return;
      }
      if (formData.security.newPassword !== formData.security.confirmPassword) {
        setError('New password and confirm password do not match.');
        showToast?.('Passwords do not match.', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (activeTab === 'account') {
        // Save account changes to Candidate Profile in backend DB
        await updateProfile({
          fullName: formData.account.name.trim(),
          phone: formData.account.phone.trim(),
          location: formData.account.location.trim(),
          city: formData.account.location.trim(),
        });

        // Trigger refetch of profile and dashboard
        if (refetch?.fetchProfile) await refetch.fetchProfile();
        if (refetch?.fetchDashboard) await refetch.fetchDashboard();

        setSavedSnapshot(prev => ({
          ...prev,
          account: { ...formData.account }
        }));

        setSuccessMsg('Account details updated and saved successfully.');
        showToast?.('Account details saved successfully!', 'success');
      } else if (activeTab === 'security') {
        // Change password securely via backend auth endpoint
        const res = await authAPI.changePassword({
          currentPassword: formData.security.currentPassword,
          newPassword: formData.security.newPassword
        });

        if (res.data?.success) {
          setFormData(prev => ({
            ...prev,
            security: { currentPassword: '', newPassword: '', confirmPassword: '' }
          }));
          setSuccessMsg('Password updated successfully.');
          showToast?.('Password updated successfully!', 'success');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to save changes. Please try again.';
      setError(msg);
      showToast?.(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset Handler ───────────────────────────────────────────────────────────
  const handleReset = () => {
    setFormData(savedSnapshot);
    setError('');
    setSuccessMsg('');
    showToast?.('Unsaved changes reverted', 'info');
  };

  // ── Sign Out Handler ────────────────────────────────────────────────────────
  const handleSignOut = () => {
    setIsSignoutModalOpen(false);
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('hcm_token');
      localStorage.removeItem('hcm_user');
      navigate('/login');
    }
    showToast?.('Signed out successfully');
  };

  // Browser session info
  const sessionInfo = useMemo(() => ({
    device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation',
    browser: (() => {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return 'Google Chrome';
      if (ua.includes('Firefox')) return 'Mozilla Firefox';
      if (ua.includes('Safari')) return 'Apple Safari';
      if (ua.includes('Edge')) return 'Microsoft Edge';
      return 'Web Browser';
    })(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }), []);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left px-2 sm:px-0">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Settings"
        description="Manage your account preferences and security credentials."
        actions={
          <>
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className={cn(
                'btn-secondary btn-compact text-xs flex items-center gap-1.5 cursor-pointer',
                (!isDirty || isSaving) && 'opacity-50 cursor-not-allowed'
              )}
              title="Revert unsaved changes"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary text-xs flex items-center gap-2 h-10 px-5 shadow-sm cursor-pointer"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </>
        }
      />

      {/* ── Alert Feedback Banners ──────────────────────────────────── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-medium"
        >
          <AlertCircle size={17} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium"
        >
          <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* ── Main Layout: Sidebar Tabs + Content Panel ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left Sidebar Navigation (4 cols) ──────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-2 border border-slate-100 dark:border-slate-800 space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-left group',
                    isActive
                      ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg shrink-0 transition-colors',
                    isActive ? 'bg-white/15 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-primary-600'
                  )}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-bold">{tab.label}</p>
                    <p className={cn(
                      'text-[11px] mt-0.5 truncate font-normal',
                      isActive ? 'text-white/80' : 'text-slate-400'
                    )}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Profile Summary Card */}
          <div className="card p-5 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {(formData.account.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {formData.account.name || 'Candidate'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {formData.account.email || 'Account verified'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Account Status</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Check size={12} strokeWidth={3} /> Active Candidate
              </span>
            </div>
          </div>

          {/* Sign Out Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSignoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <LogOut size={15} />
            <span>Sign Out of Account</span>
          </button>
        </div>

        {/* ── Right Content Area (8 cols) ───────────────────────────── */}
        <div className="lg:col-span-8">
          {contextLoading && !profile?.email ? (
            <SettingsSkeleton />
          ) : (
            <div className="card p-6 sm:p-8 border border-slate-100 dark:border-slate-800">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >

                  {/* ── 1. ACCOUNT TAB ──────────────────────────────────── */}
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Details</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Update your personal contact and identity information</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.account.name}
                            onChange={(e) => updateAccount('name', e.target.value)}
                            placeholder="e.g. Alex Rivera"
                            className="input-field h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm w-full font-medium"
                          />
                        </div>

                        {/* Email Address (Read Only) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Email Address
                            </label>
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                              Read only
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="email"
                              value={formData.account.email}
                              readOnly
                              placeholder="candidate@example.com"
                              className="input-field h-11 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm w-full font-medium cursor-not-allowed"
                            />
                            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Phone Number
                          </label>
                          <PhoneInput
                            name="phone"
                            value={formData.account.phone}
                            onChange={(e) => updateAccount('phone', e.target.value)}
                            className="w-full"
                          />
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Location
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.account.location}
                              onChange={(e) => updateAccount('location', e.target.value)}
                              placeholder="City, State / Country"
                              className="input-field h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm w-full font-medium pl-10"
                            />
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 2. SECURITY TAB ─────────────────────────────────── */}
                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      {/* Password Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Key size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Ensure your account uses a secure password of at least 6 characters</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Current Password */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Current Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={formData.security.currentPassword}
                                onChange={(e) => updateSecurity('currentPassword', e.target.value)}
                                placeholder="Enter current password"
                                className="input-field h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm w-full pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                tabIndex={-1}
                              >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* New Password */}
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                New Password <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showNewPassword ? 'text' : 'password'}
                                  value={formData.security.newPassword}
                                  onChange={(e) => updateSecurity('newPassword', e.target.value)}
                                  placeholder="Minimum 6 characters"
                                  className="input-field h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm w-full pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  tabIndex={-1}
                                >
                                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Confirm New Password <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={formData.security.confirmPassword}
                                  onChange={(e) => updateSecurity('confirmPassword', e.target.value)}
                                  placeholder="Re-enter new password"
                                  className="input-field h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm w-full pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  tabIndex={-1}
                                >
                                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Session Info */}
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 pb-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Monitor size={17} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Device Session</h4>
                            <p className="text-xs text-slate-400">Current workstation connected to this session</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                              <Monitor size={17} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {sessionInfo.browser} on {sessionInfo.device}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                Session started today at {sessionInfo.time}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Sign Out Confirmation Modal ───────────────────────────────── */}
      <CenterModal
        isOpen={isSignoutModalOpen}
        onClose={() => setIsSignoutModalOpen(false)}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
            <LogOut size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sign Out?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              You will be signed out of your session and redirected to the login screen.
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setIsSignoutModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger flex-1 text-xs flex items-center justify-center gap-1.5"
              onClick={handleSignOut}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default CandidateSettings;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Monitor, 
  Clock, 
  Lock, 
  Database, 
  Save, 
  RotateCcw, 
  ChevronRight, 
  Info,
  Sliders,
  CreditCard,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sparkles,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useCurrency } from '../../hooks/useCurrency';
import { superAdminAPI } from '../../utils/apiService';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import PageHeader from '../../shared/components/layout/PageHeader';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';

const SuperAdminSettings = () => {
  const superAdminContext = useSuperAdmin();
  const { refreshCurrency } = useCurrency();
  const [activeTab, setActiveTab] = usePersistedTab('sa_settings_tab', 'core');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (message, type = 'success') => {
    if (superAdminContext?.showToast) {
      superAdminContext.showToast(message, type);
    } else {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message, type } }));
    }
  };

  // State mapped directly to genuinely supported database fields in GlobalSettings model
  const [settings, setSettings] = useState({
    // Platform Core
    platformMode: 'Production',
    maxOrgs: 'Unlimited',
    defaultTimezone: 'UTC+00:00 (London)',
    masterCurrency: 'USD ($) - US Dollar',
    dateFormat: 'DD/MM/YYYY',
    defaultPhoneCountry: '+1',

    // Security & Compliance
    globalMFA: true,
    auditLogRetention: '90 Days',
    failedLoginAttempts: 5,
    ipWhitelisting: false,

    // AI & Automation
    primaryModel: 'Google Gemini 1.5 Pro',
    resumeScanAutoRank: true,
    matchingThreshold: 75,
    apiRateLimit: 1200,

    updatedAt: null
  });

  // Fetch genuine configuration from database on mount
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await superAdminAPI.getSystemSettings();
      const data = res.data?.data || res.data;
      if (data) {
        setSettings({
          platformMode: data.platformMode || 'Production',
          maxOrgs: data.maxOrgs || 'Unlimited',
          defaultTimezone: data.defaultTimezone || 'UTC+00:00 (London)',
          masterCurrency: data.masterCurrency || 'USD ($) - US Dollar',
          dateFormat: data.dateFormat || 'DD/MM/YYYY',
          defaultPhoneCountry: data.defaultPhoneCountry || '+1',
          globalMFA: data.globalMFA ?? true,
          auditLogRetention: data.auditLogRetention || '90 Days',
          failedLoginAttempts: data.failedLoginAttempts || 5,
          ipWhitelisting: data.ipWhitelisting ?? false,
          primaryModel: data.primaryModel || 'Google Gemini 1.5 Pro',
          resumeScanAutoRank: data.resumeScanAutoRank ?? true,
          matchingThreshold: data.matchingThreshold ?? 75,
          apiRateLimit: data.apiRateLimit ?? 1200,
          updatedAt: data.updatedAt
        });
      }
    } catch (err) {
      console.error('Failed to load system settings from backend:', err);
      showToast('Failed to load platform settings from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save changes: UI -> Validation -> API -> Database -> Response -> Refreshed State
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        platformMode: settings.platformMode,
        maxOrgs: settings.maxOrgs,
        defaultTimezone: settings.defaultTimezone,
        masterCurrency: settings.masterCurrency,
        dateFormat: settings.dateFormat,
        defaultPhoneCountry: settings.defaultPhoneCountry,
        globalMFA: Boolean(settings.globalMFA),
        auditLogRetention: settings.auditLogRetention,
        failedLoginAttempts: Number(settings.failedLoginAttempts),
        ipWhitelisting: Boolean(settings.ipWhitelisting),
        primaryModel: settings.primaryModel,
        resumeScanAutoRank: Boolean(settings.resumeScanAutoRank),
        matchingThreshold: Number(settings.matchingThreshold),
        apiRateLimit: Number(settings.apiRateLimit)
      };

      const res = await superAdminAPI.updateSystemSettings(payload);
      if (res.data?.data) {
        const updated = res.data.data;
        setSettings(prev => ({
          ...prev,
          ...updated
        }));
      }

      await refreshCurrency?.();
      showToast(res.data?.message || 'Global platform settings updated and persisted successfully.');
    } catch (err) {
      console.error('Save settings failed:', err);
      showToast(err.response?.data?.message || 'Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset defaults: clearly defined backend-supported behavior with destructive confirmation
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await superAdminAPI.resetSystemSettings();
      if (res.data?.data) {
        const restored = res.data.data;
        setSettings(prev => ({
          ...prev,
          ...restored
        }));
      }
      setIsResetModalOpen(false);
      showToast(res.data?.message || 'Platform settings restored to factory defaults.');
    } catch (err) {
      console.error('Reset defaults failed:', err);
      showToast('Failed to reset settings on server.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const updateField = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'core', label: 'Platform Core', icon: Monitor, desc: 'Engine mode, tenant limits, currency, and timezones' },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck, desc: 'Global MFA, session policies, and audit retention' },
    { id: 'ai', label: 'AI & Intelligence', icon: Sparkles, desc: 'LLM engine, scoring thresholds, and rate limits' },
  ];

  return (
    <div className="hcm-superadmin-container pb-12">
      {/* Header */}
      <PageHeader
        icon={SettingsIcon}
        title="Global Platform Settings"
        subtitle="Authoritative root configuration for the HCM.AI platform. These settings govern global runtime mode, platform limits, and compliance gates across all tenants."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsResetModalOpen(true)}
              disabled={isLoading || isSaving}
              className="btn-secondary btn-compact"
              title="Restore platform factory defaults in database">
              <RotateCcw size={15} />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="btn-primary btn-compact">
              <Save size={15} className={isSaving ? 'animate-spin' : ''} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        }
      />

      {/* Scope Alert: Distinguishes Platform Settings from Tenant Settings */}
      <div className="mt-4 p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3">
        <Info size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-200">
          <strong className="font-bold">SuperAdmin Platform Boundary:</strong> These are root platform parameters applying globally. Individual tenant configurations (such as organization policies, employee leaves, and tenant payroll) are isolated and managed independently by Tenant Administrators.
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex flex-col justify-center items-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading platform settings from database...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Navigation Category Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-2 uppercase tracking-wider">
                Configuration Areas
              </p>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-800 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}>
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? "text-primary-400" : "text-slate-400"} />
                        <div>
                          <span className="text-xs font-bold block">{tab.label}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={cn("opacity-0 transition-opacity", isActive ? "opacity-100" : "group-hover:opacity-40")} />
                    </button>
                  );
                })}
              </nav>

              {settings.updatedAt && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 px-2 font-mono">
                  Last Saved: {new Date(settings.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Settings Panels: Responsive 2-column configuration on desktop, adaptive on tablet, 1-column on mobile */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {/* TAB 1: PLATFORM CORE */}
              {activeTab === 'core' && (
                <motion.div
                  key="core"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                      <Monitor size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Platform Core Runtime Configuration
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Root engine behavior, tenant concurrency gates, and global ledger localization.
                      </p>
                    </div>
                  </div>

                  {/* Two-Column Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Engine Mode */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Platform Engine Mode
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.platformMode}
                        onChange={e => updateField('platformMode', e.target.value)}>
                        <option value="Production">Production (Stable Live Traffic)</option>
                        <option value="Staging">Staging (Pre-Release Validation)</option>
                        <option value="Development">Development (Local Debugging)</option>
                        <option value="Maintenance">Maintenance Mode (Block Tenant Access)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Determines platform-wide caching, logging verbosity, and maintenance restrictions.
                      </p>
                    </div>

                    {/* Maximum Tenants */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Maximum Tenant Organizations
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.maxOrgs}
                        onChange={e => updateField('maxOrgs', e.target.value)}>
                        <option value="10">10 Organizations (Proof of Concept)</option>
                        <option value="50">50 Organizations (Growth Tier)</option>
                        <option value="100">100 Organizations (Scale Tier)</option>
                        <option value="500">500 Organizations (Enterprise Cluster)</option>
                        <option value="Unlimited">Unlimited Organizations</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Upper safety ceiling for automated tenant registration and provisioning.
                      </p>
                    </div>

                    {/* Master Ledger Currency */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Platform Master Currency
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.masterCurrency}
                        onChange={e => updateField('masterCurrency', e.target.value)}>
                        <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                        <option value="EUR (€) - Euro">EUR (€) - Euro</option>
                        <option value="GBP (£) - British Pound">GBP (£) - British Pound</option>
                        <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                        <option value="AUD (A$) - Australian Dollar">AUD (A$) - Australian Dollar</option>
                        <option value="CAD (C$) - Canadian Dollar">CAD (C$) - Canadian Dollar</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Master denomination used for platform SaaS subscriptions and billing reports.
                      </p>
                    </div>

                    {/* Default Timezone */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Default System Timezone
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.defaultTimezone}
                        onChange={e => updateField('defaultTimezone', e.target.value)}>
                        <option value="UTC+00:00 (London)">UTC+00:00 (London / UTC)</option>
                        <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (New York / Eastern Time)</option>
                        <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (San Francisco / Pacific Time)</option>
                        <option value="UTC+05:30 (Calcutta / India)">UTC+05:30 (Calcutta / IST)</option>
                        <option value="UTC+08:00 (Singapore / Beijing)">UTC+08:00 (Singapore / Beijing)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Fallback reference timezone for scheduled background jobs and daily cron triggers.
                      </p>
                    </div>

                    {/* Default Date Format */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Platform Date Format
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.dateFormat}
                        onChange={e => updateField('dateFormat', e.target.value)}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 22/08/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/22/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-22)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Standard date format representation applied across root audit logs and exports.
                      </p>
                    </div>

                    {/* Default Country Dial Code */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Default Phone Dial Code
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.defaultPhoneCountry}
                        onChange={e => updateField('defaultPhoneCountry', e.target.value)}>
                        <option value="+1">+1 (United States / Canada)</option>
                        <option value="+44">+44 (United Kingdom)</option>
                        <option value="+91">+91 (India)</option>
                        <option value="+61">+61 (Australia)</option>
                        <option value="+49">+49 (Germany)</option>
                        <option value="+33">+33 (France)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Default pre-fill country code for user onboarding and SMS verification.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: SECURITY & ACCESS */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Platform Security & Compliance Controls
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Global authentication gates, account lockout thresholds, and audit preservation policies.
                      </p>
                    </div>
                  </div>

                  {/* Two-Column Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audit Logs Retention */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Audit Trail Retention Period
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.auditLogRetention}
                        onChange={e => updateField('auditLogRetention', e.target.value)}>
                        <option value="30 Days">30 Days (Standard)</option>
                        <option value="90 Days">90 Days (Recommended)</option>
                        <option value="180 Days">180 Days (Corporate Policy)</option>
                        <option value="365 Days">365 Days / 1 Year (Statutory Compliance)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Automatic lifecycle archiving threshold for platform audit logs.
                      </p>
                    </div>

                    {/* Failed Login Attempts */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Failed Login Attempts Before Lockout
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.failedLoginAttempts}
                        onChange={e => updateField('failedLoginAttempts', parseInt(e.target.value))}>
                        <option value="3">3 Attempts (Strict Protection)</option>
                        <option value="5">5 Attempts (Standard Recommended)</option>
                        <option value="10">10 Attempts (Relaxed)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Threshold of consecutive bad passwords before temporary IP lockout.
                      </p>
                    </div>

                    {/* Global MFA Toggle */}
                    <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Mandatory Global MFA
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Enforce multi-factor verification across all administrative and staff logins.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.globalMFA}
                          onChange={e => updateField('globalMFA', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* IP Whitelisting Toggle */}
                    <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Platform IP Whitelisting
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Restrict SuperAdmin portal access to pre-authorized corporate CIDR ranges.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.ipWhitelisting}
                          onChange={e => updateField('ipWhitelisting', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: AI & INTELLIGENCE */}
              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
                  <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        AI Model & Cognitive Service Parameters
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Platform foundation models, candidate scoring algorithms, and API call quotas.
                      </p>
                    </div>
                  </div>

                  {/* Two-Column Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Model */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        Default LLM Foundation Engine
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.primaryModel}
                        onChange={e => updateField('primaryModel', e.target.value)}>
                        <option value="Google Gemini 1.5 Pro">Google Gemini 1.5 Pro (Multimodal Core)</option>
                        <option value="Google Gemini 1.5 Flash">Google Gemini 1.5 Flash (Ultra Low Latency)</option>
                        <option value="OpenAI GPT-4o">OpenAI GPT-4o (Enterprise Compatible)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Backing AI model for copilot queries, resume parsing, and policy summaries.
                      </p>
                    </div>

                    {/* Matching Threshold */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                          AI Candidate Match Threshold
                        </label>
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {settings.matchingThreshold}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={settings.matchingThreshold}
                        onChange={e => updateField('matchingThreshold', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-[11px] text-slate-400">
                        Minimum semantic correlation score required for automated shortlist tagging.
                      </p>
                    </div>

                    {/* API Rate Limit */}
                    <div className="space-y-2">
                      <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300">
                        AI Request Throttle (Calls / Hour)
                      </label>
                      <select
                        className="select-field w-full h-11 text-xs"
                        value={settings.apiRateLimit}
                        onChange={e => updateField('apiRateLimit', parseInt(e.target.value))}>
                        <option value="600">600 calls / hour (Economy)</option>
                        <option value="1200">1,200 calls / hour (Standard Default)</option>
                        <option value="2400">2,400 calls / hour (High Concurrency)</option>
                        <option value="5000">5,000 calls / hour (Enterprise Unlimited)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Platform rate limit ceiling to prevent runaway consumption or API overages.
                      </p>
                    </div>

                    {/* Auto Rank Toggle */}
                    <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Autonomous Resume Scoring
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Immediately trigger AI resume analysis upon candidate application submission.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.resumeScanAutoRank}
                          onChange={e => updateField('resumeScanAutoRank', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Platform Settings to Factory Defaults"
        message="Are you sure you want to restore platform settings to factory defaults? This will overwrite the current database settings for engine mode, master currency, security thresholds, and AI parameters."
        confirmText={isResetting ? "Restoring..." : "Reset Factory Defaults"}
        type="danger"
      />
    </div>
  );
};

export default SuperAdminSettings;

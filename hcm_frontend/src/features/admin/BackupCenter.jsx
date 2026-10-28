import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Cloud,
  Mail,
  HardDrive,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RotateCw,
  Trash2,
  AlertCircle,
  FileText,
  Building2,
  Users,
  CreditCard,
  Settings,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Loader2,
  Copy,
  Check,
  FolderArchive,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../context/AdminContext';
import { backupAPI, googleDriveAPI } from '../../utils/apiService';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import PageHeader from '../../shared/components/ui/PageHeader';

const BackupCenter = () => {
  const { showToast, orgData } = useAdmin();

  // State
  const [overview, setOverview] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [backupType, setBackupType] = useState('DATA_ONLY'); // 'DATA_ONLY' | 'DATA_AND_DOCUMENTS'
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeJob, setActiveJob] = useState(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [completedJobModal, setCompletedJobModal] = useState(null);
  const [emailModalJob, setEmailModalJob] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState(null);
  const [driveStatus, setDriveStatus] = useState({ isConnected: false, accountEmail: null });
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveUploadingJobId, setDriveUploadingJobId] = useState(null);
  const [downloadingJobId, setDownloadingJobId] = useState(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [overviewRes, modulesRes, historyRes, driveRes] = await Promise.all([
        backupAPI.getOverview(),
        backupAPI.getModules(),
        backupAPI.getBackups(),
        googleDriveAPI.getStatus().catch(() => ({ data: { data: { isConnected: false } } }))
      ]);

      setOverview(overviewRes.data?.data || null);
      const mods = modulesRes.data?.data || [];
      setModulesList(mods);
      setSelectedModules(mods.map(m => m.key));
      setHistory(historyRes.data?.data || []);
      setDriveStatus(driveRes.data?.data || { isConnected: false });
    } catch (err) {
      console.error('Failed to load backup center data:', err);
      showToast('Failed to load backup center data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check URL parameters for Google OAuth callback notification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_drive') === 'connected') {
      showToast('Google Drive connected successfully!', 'success');
      googleDriveAPI.getStatus().then(res => setDriveStatus(res.data?.data || { isConnected: true }));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error')) {
      showToast('Google Drive authorization failed.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast]);

  // Poll active backup job if running
  useEffect(() => {
    if (!activeJob || activeJob.status === 'COMPLETED' || activeJob.status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await backupAPI.getStatus(activeJob.id);
        const updated = res.data?.data;
        if (updated) {
          setActiveJob(updated);
          if (updated.status === 'COMPLETED') {
            clearInterval(interval);
            showToast('Organization backup completed successfully!', 'success');
            setCompletedJobModal(updated);
            // Refresh history and stats
            backupAPI.getBackups().then(r => setHistory(r.data?.data || []));
            backupAPI.getOverview().then(r => setOverview(r.data?.data || null));
          } else if (updated.status === 'FAILED') {
            clearInterval(interval);
            showToast(updated.errorMessage || 'Backup creation failed.', 'error');
          }
        }
      } catch (err) {
        console.error('Failed to poll backup job status:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeJob, showToast]);

  // Toggle Module Selection
  const handleToggleModule = (key) => {
    setSelectedModules(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllModules = () => {
    setSelectedModules(modulesList.map(m => m.key));
  };

  const handleDeselectAllModules = () => {
    setSelectedModules([]);
  };

  // Start Backup
  const handleStartBackup = async () => {
    if (selectedModules.length === 0) {
      showToast('Please select at least one module to backup.', 'warning');
      return;
    }

    try {
      setIsStartingJob(true);
      const res = await backupAPI.createBackup({
        type: backupType,
        modules: selectedModules
      });

      const newJob = res.data?.data;
      if (newJob) {
        setActiveJob(newJob);
        showToast('Backup process initiated.', 'info');
        setHistory(prev => [newJob, ...prev]);
      }
    } catch (err) {
      console.error('Failed to start backup:', err);
      showToast(err.response?.data?.error?.message || 'Failed to initiate backup.', 'error');
    } finally {
      setIsStartingJob(false);
    }
  };

  // Download Backup Archive
  const handleDownload = async (job) => {
    if (!job || job.status !== 'COMPLETED') return;
    setDownloadingJobId(job.id);
    try {
      showToast('Initiating secure archive download...', 'info');
      const token = localStorage.getItem('hcm_token');
      const downloadUrl = backupAPI.downloadBackupUrl(job.id);

      const response = await fetch(`${downloadUrl}?token=${encodeURIComponent(token || '')}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Backup file is no longer available on the server.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', job.fileName || `hcm_backup_${job.id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast('Backup ZIP archive downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(err.message || 'Failed to download backup archive.', 'error');
    } finally {
      setDownloadingJobId(null);
    }
  };

  // Open Email Modal
  const handleOpenEmailModal = (job) => {
    setEmailModalJob(job);
    setRecipientEmail('');
  };

  // Dispatch Email
  const handleSendEmail = async () => {
    if (!emailModalJob) return;
    try {
      setIsSendingEmail(true);
      await backupAPI.sendEmail(emailModalJob.id, { recipientEmail });
      showToast('Backup report dispatched to email successfully!', 'success');
      setEmailModalJob(null);
    } catch (err) {
      console.error('Email send error:', err);
      showToast(err.response?.data?.error?.message || 'Failed to send backup report email.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Save to Google Drive
  const handleSaveToGoogleDrive = async (job) => {
    if (!job || job.status !== 'COMPLETED') return;

    if (!driveStatus.isConnected) {
      showToast('Google Drive is not linked. Please connect your account first.', 'warning');
      try {
        const res = await googleDriveAPI.getConnectUrl();
        if (res.data?.data?.url) {
          window.location.href = res.data.data.url;
        }
      } catch (e) {
        showToast('Google Drive OAuth is not configured with client credentials.', 'warning');
      }
      return;
    }

    try {
      setIsUploadingToDrive(true);
      setDriveUploadingJobId(job.id);
      await backupAPI.saveToGoogleDrive(job.id);
      showToast('Backup saved to Google Drive (HCM Backups folder)!', 'success');
    } catch (err) {
      console.error('Google Drive upload error:', err);
      showToast(err.response?.data?.error?.message || 'Failed to save to Google Drive.', 'error');
    } finally {
      setIsUploadingToDrive(false);
      setDriveUploadingJobId(null);
    }
  };

  // Disconnect Google Drive
  const handleDisconnectDrive = async () => {
    try {
      await googleDriveAPI.disconnect();
      setDriveStatus({ isConnected: false, accountEmail: null });
      showToast('Google Drive disconnected.', 'info');
    } catch (err) {
      showToast('Failed to disconnect Google Drive.', 'error');
    }
  };

  // Connect Google Drive
  const handleConnectDrive = async () => {
    try {
      const res = await googleDriveAPI.getConnectUrl();
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch (e) {
      showToast('Google Drive OAuth requires client credentials configured in environment.', 'warning');
    }
  };

  // Delete Backup
  const handleDeleteBackup = async () => {
    if (!jobToDelete) return;
    try {
      setIsDeleting(true);
      await backupAPI.deleteBackup(jobToDelete.id);
      setHistory(prev => prev.filter(j => j.id !== jobToDelete.id));
      showToast('Backup archive deleted permanently.', 'success');
      setJobToDelete(null);
      // Refresh overview
      backupAPI.getOverview().then(r => setOverview(r.data?.data || null));
    } catch (err) {
      showToast('Failed to delete backup.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyChecksum = (checksum) => {
    if (!checksum) return;
    navigator.clipboard.writeText(checksum);
    setCopiedChecksum(checksum);
    setTimeout(() => setCopiedChecksum(null), 2000);
    showToast('SHA-256 Checksum copied to clipboard.', 'success');
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return { date: '—', time: '' };
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return { date: '—', time: '' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return {
      date: `${day}/${month}/${year},`,
      time: `${hours}:${minutes}:${seconds}`
    };
  };

  const formatDisplayDate = (dateInput) => {
    if (!dateInput) return 'Never';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Never';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-left">
      {/* Top Header */}
      <PageHeader
        title="Data Backup & Export Center"
        description="Generate complete, secure backup archives of your organization's records, users, and vault documents."
        actions={
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="btn-secondary"
              title="Refresh Backup Center"
              id="backup-refresh-btn"
            >
              <RotateCw size={15} className={cn(isLoading && "animate-spin text-primary-600")} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Organization Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <Building2 size={24} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Organization
            </span>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {overview?.organization || orgData?.name || 'Organization'}
            </h4>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              PLAN: {overview?.plan ? overview.plan.toUpperCase() : 'ENTERPRISE'}
            </span>
          </div>
        </div>

        {/* Last Backup Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Last Backup
            </span>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {overview?.lastBackupDate ? formatDisplayDate(overview.lastBackupDate) : 'Never'}
            </h4>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {overview?.lastBackupDate ? formatBytes(overview.lastBackupSize) : 'No backups yet'}
            </span>
          </div>
        </div>

        {/* Storage Used Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-100 dark:border-purple-900/50">
            <HardDrive size={24} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Storage Used
            </span>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {overview?.totalStorageUsedMB !== undefined ? `${overview.totalStorageUsedMB} MB` : '0.00 MB'}
            </h4>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              of {overview?.allocatedStorageMB || 5120} MB allowance
            </span>
          </div>
        </div>

        {/* Retention Policy Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100 dark:border-amber-900/50">
            <Clock size={24} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Retention Policy
            </span>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {overview?.retentionDays || 30} Days
            </h4>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Automatic Purge
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Create Backup Configurator + Google Drive Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left: Create Backup Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Create Organization Backup
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Configure parameters for tenant archive package
                  </p>
                </div>
              </div>

              {/* Select All / Clear */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={handleSelectAllModules}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  id="backup-select-all-btn"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllModules}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  id="backup-clear-btn"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Archive Package Type */}
            <div className="space-y-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block form-label">
                Archive Package Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setBackupType('DATA_ONLY')}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 select-none",
                    backupType === 'DATA_ONLY'
                      ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850"
                  )}
                  id="package-type-data-only"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                    backupType === 'DATA_ONLY' ? "bg-indigo-600 text-white" : "border-2 border-slate-300 dark:border-slate-600"
                  )}>
                    {backupType === 'DATA_ONLY' && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      Database & Records (JSON)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Complete tenant schema dumps, users, compensation, attendance, payroll and audit history.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setBackupType('DATA_AND_DOCUMENTS')}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 select-none",
                    backupType === 'DATA_AND_DOCUMENTS'
                      ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850"
                  )}
                  id="package-type-data-and-docs"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                    backupType === 'DATA_AND_DOCUMENTS' ? "bg-indigo-600 text-white" : "border-2 border-slate-300 dark:border-slate-600"
                  )}>
                    {backupType === 'DATA_AND_DOCUMENTS' && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        Data + Documents Archive
                      </h5>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Full
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Includes all database records plus tenant employee documents and compliance attachments.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modules Checkbox Grid */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block form-label">
                Select Modules to Include ({selectedModules.length}/{modulesList.length})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                {modulesList.map((m) => {
                  const isChecked = selectedModules.includes(m.key);
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleToggleModule(m.key)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none",
                        isChecked
                          ? "bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 opacity-60 hover:opacity-100"
                      )}
                      id={`module-${m.key}`}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        isChecked
                          ? "bg-indigo-600 text-white"
                          : "border-2 border-slate-300 dark:border-slate-600 bg-transparent"
                      )}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h6 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {m.label}
                        </h6>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Job Progress Display */}
            {activeJob && activeJob.status !== 'COMPLETED' && activeJob.status !== 'FAILED' && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                      {activeJob.progressStep || 'Processing Backup...'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {activeJob.progress}%
                  </span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-900/60 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeJob.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartBackup}
                disabled={isStartingJob || (activeJob && activeJob.status === 'PROCESSING') || selectedModules.length === 0}
                className={cn(
                  "btn-primary w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20",
                  (isStartingJob || (activeJob && activeJob.status === 'PROCESSING') || selectedModules.length === 0) && "opacity-50 cursor-not-allowed"
                )}
                id="generate-backup-btn"
              >
                {isStartingJob ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Initiating Job...</span>
                  </>
                ) : (
                  <>
                    <FolderArchive size={18} />
                    <span>Generate Complete Organization Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Google Drive & Delivery Options (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Google Drive Connection Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <Cloud size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Google Drive
                  </h4>
                  <p className="text-[11px] text-slate-400">Automated cloud backup sync</p>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                driveStatus.isConnected
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                {driveStatus.isConnected ? 'Connected' : 'Not Linked'}
              </span>
            </div>

            {driveStatus.isConnected ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Linked Account</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                    {driveStatus.accountEmail || 'Google Drive Connected'}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-mono mt-1">
                    Folder: HCM Backups/{overview?.organization || 'Organization'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectDrive}
                  className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  id="disconnect-google-drive-btn"
                >
                  <Trash2 size={13} />
                  <span>Disconnect Google Drive</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Link your corporate Google Workspace account using OAuth 2.0 to save backup archives directly to Google Drive.
                </p>
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  id="connect-google-drive-btn"
                >
                  <Cloud size={16} />
                  <span>Connect Google Drive</span>
                </button>
              </div>
            )}
          </div>

          {/* Security & Isolation Notice */}
          <div className="bg-[#0b1329] text-white rounded-2xl sm:rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <ShieldCheck size={18} />
              <h5 className="text-xs font-black uppercase tracking-wider">Tenant Security Assured</h5>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every archive generated strictly isolates your organization's records. User credentials and platform secrets are automatically filtered out.
            </p>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>ALGORITHM: SHA-256</span>
              <span className="flex items-center gap-1">
                <span>SECURE ZIP (SHA-256)</span>
                <Lock size={11} className="text-blue-400" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Backup History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/50">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Backup Archive History
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Historical records generated for this tenant
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Total Archives: {history.length}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FolderArchive size={28} />
            </div>
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Backups Generated Yet</h5>
            <p className="text-xs text-slate-400 max-w-sm">
              Use the form above to generate your organization's first complete data backup package.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hcm-table">
              <thead className="hcm-thead">
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 hcm-tr">
                  <th className="py-3 px-4 hcm-th">Archive Details</th>
                  <th className="py-3 px-4 hcm-th">Created Date</th>
                  <th className="py-3 px-4 hcm-th">Type</th>
                  <th className="py-3 px-4 hcm-th">Size</th>
                  <th className="py-3 px-4 hcm-th">Checksum (SHA-256)</th>
                  <th className="py-3 px-4 hcm-th">Status</th>
                  <th className="py-3 px-4 text-right hcm-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                {history.map((job) => {
                  const dateInfo = formatDate(job.createdAt);
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 hcm-td">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                            <FolderArchive size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs font-mono text-xs">
                              {job.fileName || 'Generating backup...'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              By {job.createdByUser?.employeeProfile?.fullName || job.createdByUser?.email?.split('@')[0] || 'Admin One'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium hcm-td">
                        <div className="text-xs font-mono">
                          <span>{dateInfo.date}</span>
                          <span className="block text-[11px] text-slate-400">{dateInfo.time}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hcm-td">
                        <span className={cn(
                          "text-[9px] font-black leading-tight px-2 py-1 rounded uppercase tracking-wider inline-flex flex-col items-center justify-center text-center",
                          job.type === 'DATA_AND_DOCUMENTS'
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          <span>{job.type === 'DATA_AND_DOCUMENTS' ? 'DATA +' : 'DATA'}</span>
                          <span>{job.type === 'DATA_AND_DOCUMENTS' ? 'DOCS' : 'ONLY'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 hcm-td">
                        {job.fileSize ? formatBytes(job.fileSize) : '—'}
                      </td>
                      <td className="py-3.5 px-4 hcm-td">
                        {job.checksum ? (
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                            <span>{job.checksum.substring(0, 16)}...</span>
                            <button
                              type="button"
                              onClick={() => copyChecksum(job.checksum)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Copy full SHA-256 hash"
                              id={`copy-checksum-${job.id}`}
                            >
                              {copiedChecksum === job.checksum ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 hcm-td">
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 uppercase tracking-wider",
                          job.status === 'COMPLETED' && "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
                          job.status === 'PROCESSING' && "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 animate-pulse",
                          job.status === 'QUEUED' && "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
                          job.status === 'FAILED' && "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
                        )}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right hcm-td">
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status === 'COMPLETED' && (
                            <>
                              <button
                                type="button"
                                disabled={downloadingJobId === job.id}
                                onClick={() => handleDownload(job)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                                title="Download ZIP Archive"
                                id={`download-backup-${job.id}`}
                              >
                                {downloadingJobId === job.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEmailModal(job)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                title="Send to Email"
                                id={`email-backup-${job.id}`}
                              >
                                <Mail size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveToGoogleDrive(job)}
                                disabled={isUploadingToDrive && driveUploadingJobId === job.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                                title="Save to Google Drive"
                                id={`gdrive-backup-${job.id}`}
                              >
                                {isUploadingToDrive && driveUploadingJobId === job.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Cloud size={15} />
                                )}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setJobToDelete(job)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete Backup Archive"
                            id={`delete-backup-${job.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {completedJobModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompletedJobModal(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    Backup Generated Successfully
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Your organization data package is verified and ready
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">File Name:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                    {completedJobModal.fileName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Archive Size:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatBytes(completedJobModal.fileSize)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">SHA-256 Checksum:</span>
                  <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">
                    {completedJobModal.checksum}
                  </span>
                </div>
              </div>

              {/* Delivery Action Options */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Choose Delivery Channel
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleDownload(completedJobModal);
                      setCompletedJobModal(null);
                    }}
                    className="btn-primary text-xs py-2.5 px-3 flex flex-col items-center justify-center gap-1.5"
                    id="modal-download-btn"
                  >
                    <Download size={16} />
                    <span>Download ZIP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const job = completedJobModal;
                      setCompletedJobModal(null);
                      handleOpenEmailModal(job);
                    }}
                    className="btn-secondary text-xs py-2.5 px-3 flex flex-col items-center justify-center gap-1.5"
                    id="modal-email-btn"
                  >
                    <Mail size={16} />
                    <span>Send via Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const job = completedJobModal;
                      setCompletedJobModal(null);
                      handleSaveToGoogleDrive(job);
                    }}
                    className="btn-secondary text-xs py-2.5 px-3 flex flex-col items-center justify-center gap-1.5"
                    id="modal-gdrive-btn"
                  >
                    <Cloud size={16} />
                    <span>Google Drive</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCompletedJobModal(null)}
                  className="btn-secondary text-xs"
                  id="modal-close-btn"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Dispatch Modal */}
      <AnimatePresence>
        {emailModalJob && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmailModalJob(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                  <Mail size={22} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Dispatch Backup via Email
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Send secure download report to recipient</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block form-label">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. admin@yourcompany.com"
                  className="input-field h-11 text-xs font-medium w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  id="email-dispatch-input"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Defaults to the authenticated admin email if left empty.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalJob(null)}
                  disabled={isSendingEmail}
                  className="btn-secondary text-xs"
                  id="email-dispatch-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="btn-primary text-xs flex items-center gap-1.5"
                  id="email-dispatch-send-btn"
                >
                  {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  <span>{isSendingEmail ? 'Sending...' : 'Send Backup Report'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!jobToDelete}
        title="Delete Backup Archive"
        message={`Are you sure you want to permanently delete backup archive "${jobToDelete?.fileName}"? This action cannot be undone.`}
        confirmText="Delete Archive"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteBackup}
        onClose={() => setJobToDelete(null)}
      />
    </div>
  );
};

export default BackupCenter;

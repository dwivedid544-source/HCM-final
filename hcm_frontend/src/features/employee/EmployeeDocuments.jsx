// ============================================================
// EmployeeDocuments.jsx — Records & Vault
// Fully dynamic: stats, categories, documents all API-driven
// ============================================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Download, CheckCircle2, AlertCircle, CloudUpload,
  Trash2, Copy, Check, RefreshCw, Eye, Sparkles, Loader2, X, ShieldCheck,
  Upload, FolderLock, FileType, Filter, ChevronDown, Folder, Brain,
  Image, FileSpreadsheet, FileArchive, FileBadge, Lock, ArrowDownToLine,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import CenterModal from '../../shared/components/layout/CenterModal';
import PermissionGate from '../../shared/components/common/PermissionGate';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { validateFile } from '../../utils/fileValidator';
import { employeeService } from '../../services/employee.service';
import { employeeAPI as api } from '../../utils/apiService';

// ─── Constants ────────────────────────────────────────────────
const DOCUMENT_EXTENSIONS = ['pdf','png','jpg','jpeg','webp','svg','txt','doc','docx','xls','xlsx','csv','ppt','pptx','zip'];
const AI_EXTENSIONS = ['pdf','png','jpg','jpeg','txt'];
const DOCUMENT_MAX_MB = 25;
const AI_MAX_MB = 10;

const STATIC_CATEGORIES = ['All','Identity Documents','Education','Employment','Certificates','Contracts','Tax Documents','Other'];

// ─── Helpers ──────────────────────────────────────────────────
const getErr = (err, fallback = 'Something went wrong.') =>
  err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback;

const getDocName = (d) => d?.name || d?.title || 'Untitled Document';
const getDocCat  = (d) => d?.category || 'Other';
const getDocUrl  = (d) => d?.url || d?.fileUrl || d?.fileURL || d?.secureUrl || d?.secure_url || '';

const fileSizeLabel = (file) => {
  if (!file) return '0 KB';
  const kb = file.size / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
};

const getFileExt = (name = '') => {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const FileIconComponent = ({ name = '', size = 24 }) => {
  const ext = getFileExt(name);
  if (['png','jpg','jpeg','webp','svg'].includes(ext)) return <Image size={size} />;
  if (['xls','xlsx','csv'].includes(ext)) return <FileSpreadsheet size={size} />;
  if (['zip','rar','7z'].includes(ext)) return <FileArchive size={size} />;
  if (ext === 'pdf') return <FileBadge size={size} />;
  return <FileText size={size} />;
};

const fileIconBg = (name = '') => {
  const ext = getFileExt(name);
  if (['png','jpg','jpeg','webp','svg'].includes(ext)) return 'bg-violet-500';
  if (['xls','xlsx','csv'].includes(ext)) return 'bg-emerald-600';
  if (['zip','rar','7z'].includes(ext)) return 'bg-amber-500';
  if (ext === 'pdf') return 'bg-rose-500';
  if (['doc','docx'].includes(ext)) return 'bg-blue-600';
  return 'bg-primary-600';
};

// ─── Status Badge ────────────────────────────────────────────
const VerifiedBadge = ({ verified }) => (
  <span className={cn(
    'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border',
    verified === false
      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/40'
      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40'
  )}>
    {verified === false ? 'Unverified' : 'Verified'}
  </span>
);

// ============================================================
// COMPONENT
// ============================================================

const EmployeeDocuments = () => {
  const { showToast } = useEmployee();

  // ── Data State ──────────────────────────────────────────────
  const [documents,   setDocuments]   = useState([]);
  const [dashboard,   setDashboard]   = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Vault UI State ──────────────────────────────────────────
  const [searchTerm,             setSearchTerm]             = useState('');
  const [debouncedSearch,        setDebouncedSearch]        = useState('');
  const [activeCategory,         setActiveCategory]         = useState('All');
  const [isCatDropdownOpen,      setIsCatDropdownOpen]      = useState(false);
  const [isUploadModalOpen,      setIsUploadModalOpen]      = useState(false);
  const [selectedFile,           setSelectedFile]           = useState(null);
  const [docName,                setDocName]                = useState('');
  const [docDescription,         setDocDescription]         = useState('');
  const [selectedCategory,       setSelectedCategory]       = useState('Contracts');
  const [docType,                setDocType]                = useState('');
  const [fileSize,               setFileSize]               = useState('0 KB');
  const [isUploading,            setIsUploading]            = useState(false);
  const [uploadProgress,         setUploadProgress]         = useState(0);
  const [isModalDragOver,        setIsModalDragOver]        = useState(false);
  const [deletingId,             setDeletingId]             = useState(null);
  const [documentToDelete,       setDocumentToDelete]       = useState(null);
  const [previewDoc,             setPreviewDoc]             = useState(null);

  // ── AI State ────────────────────────────────────────────────
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [dragActive,    setDragActive]    = useState(false);
  const [aiFile,        setAiFile]        = useState(null);
  const [aiResult,      setAiResult]      = useState(null);
  const [stage,         setStage]         = useState('idle');
  const [stageProgress, setStageProgress] = useState(0);
  const [aiError,       setAiError]       = useState(null);
  const [copied,        setCopied]        = useState(false);
  const [savingToVault, setSavingToVault] = useState(false);

  // ── Refs ────────────────────────────────────────────────────
  const fileInputRef     = useRef(null);
  const vaultFileInputRef = useRef(null);
  const catDropdownRef   = useRef(null);

  // ── Debounce search ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Close dropdown on outside click ─────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target))
        setIsCatDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch all data ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [docsRes, dashRes, catRes] = await Promise.all([
        employeeService.getDocuments(),
        employeeService.getDocumentsDashboard().catch(() => null),
        employeeService.getDocumentCategories().catch(() => null),
      ]);
      const docs = docsRes?.data?.data || docsRes?.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
      if (dashRes?.data?.data) setDashboard(dashRes.data.data);
      if (catRes?.data?.data) setCategories(catRes.data.data);
    } catch (err) {
      setError(getErr(err, 'Failed to load your vault documents.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Stats from dashboard API (or compute locally) ───────────
  const stats = useMemo(() => {
    const totalFiles       = dashboard?.totalFiles       ?? documents.length;
    const storageUsed      = dashboard?.storageUsed      ?? '0 MB';
    const verifiedDocuments = dashboard?.verifiedDocuments ?? documents.filter(d => d.verified !== false).length;
    const retrievalStatus  = dashboard?.retrievalStatus  ?? 'Ready';
    return [
      { label: 'Total Vault Files',    value: totalFiles,       icon: FileText,    color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
      { label: 'Cloud Space Used',     value: storageUsed,      icon: CloudUpload, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/30' },
      { label: 'Verified Vault Docs',  value: verifiedDocuments, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { label: 'Instant Retrieval',    value: retrievalStatus,  icon: Lock,        color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    ];
  }, [dashboard, documents]);

  // ── Category list (from API + counts from local docs) ───────
  const categoryList = useMemo(() => {
    const base = categories.length > 0
      ? [{ name: 'All', count: documents.length }, ...categories]
      : STATIC_CATEGORIES.map(name => ({
          name,
          count: name === 'All' ? documents.length
            : documents.filter(d => (d.category || 'Other').toLowerCase() === name.toLowerCase()).length
        }));
    // Always recompute 'All' count from live docs
    return base.map(c => c.name === 'All' ? { ...c, count: documents.length } : {
      ...c,
      count: documents.filter(d => (d.category || 'Other').toLowerCase() === c.name.toLowerCase()).length,
    });
  }, [categories, documents]);

  // ── Filtered documents ──────────────────────────────────────
  const filteredDocs = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    return documents.filter(doc => {
      const name    = getDocName(doc).toLowerCase();
      const cat     = getDocCat(doc).toLowerCase();
      const type    = (doc.type || '').toLowerCase();
      const date    = (doc.date || doc.createdAt || '').toLowerCase();
      const matchSearch = !s || name.includes(s) || cat.includes(s) || type.includes(s) || date.includes(s);
      const matchCat    = activeCategory === 'All' || cat === activeCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [documents, debouncedSearch, activeCategory]);

  // ── File Validation ─────────────────────────────────────────
  const validateVaultFile = (file) => {
    if (!file) return { isValid: false, message: 'Please select a file.' };
    const v = validateFile(file, DOCUMENT_EXTENSIONS, DOCUMENT_MAX_MB);
    if (!v.isValid) showToast(v.message, 'error');
    return v;
  };

  const validateAiFile = (file) => {
    if (!file) return { isValid: false, message: 'Please select a document.' };
    const v = validateFile(file, AI_EXTENSIONS, AI_MAX_MB);
    if (!v.isValid) showToast(v.message, 'error');
    return v;
  };

  // ── Select vault file ───────────────────────────────────────
  const selectVaultFile = (file) => {
    if (!validateVaultFile(file).isValid) return;
    setSelectedFile(file);
    setDocName(file.name);
    setFileSize(fileSizeLabel(file));
  };

  // ── Reset upload form ───────────────────────────────────────
  const resetVaultForm = () => {
    setSelectedFile(null);
    setDocName('');
    setDocDescription('');
    setDocType('');
    setFileSize('0 KB');
    setSelectedCategory('Contracts');
    setUploadProgress(0);
    if (vaultFileInputRef.current) vaultFileInputRef.current.value = '';
  };

  // ── Upload ──────────────────────────────────────────────────
  const handleUploadSubmit = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isUploading || !selectedFile) {
      if (!selectedFile) showToast('Please select a file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', docName.trim() || selectedFile.name);
    formData.append('category', selectedCategory || 'Other');
    formData.append('size', fileSize || fileSizeLabel(selectedFile));
    if (docDescription) formData.append('description', docDescription);
    if (docType) formData.append('type', docType);

    try {
      setIsUploading(true);
      setUploadProgress(20);
      const timer1 = setTimeout(() => setUploadProgress(55), 800);
      const timer2 = setTimeout(() => setUploadProgress(85), 1800);

      await employeeService.uploadDocument(formData);

      clearTimeout(timer1); clearTimeout(timer2);
      setUploadProgress(100);
      showToast('Document uploaded to vault successfully!', 'success');
      setIsUploadModalOpen(false);
      resetVaultForm();
      await fetchAll();
    } catch (err) {
      showToast(getErr(err, 'Upload failed. Please try again.'), 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const confirmDeleteDocument = async () => {
    const id = documentToDelete?.id;
    if (!id || deletingId) return;
    try {
      setDeletingId(id);
      await employeeService.deleteDocument(id);
      showToast('Document deleted from vault.', 'success');
      setDocumentToDelete(null);
      await fetchAll();
    } catch (err) {
      showToast(getErr(err, 'Delete failed.'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Download ─────────────────────────────────────────────────
  const handleDownloadDocument = (doc) => {
    const url = getDocUrl(doc);
    if (!url) { showToast('File URL not available.', 'error'); return; }
    const link = document.createElement('a');
    link.href  = url;
    link.download = getDocName(doc);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started.', 'success');
  };

  // ── View ─────────────────────────────────────────────────────
  const handleViewDocument = (doc) => {
    const url = getDocUrl(doc);
    if (!url) { showToast('Document URL not available.', 'error'); return; }
    setPreviewDoc({ ...doc, url });
  };

  // ── Vault Index ──────────────────────────────────────────────
  const handleDownloadIndex = () => {
    if (!documents.length) { showToast('No documents to export.', 'error'); return; }
    let content = 'HCM Secure Vault Index\n======================\n\n';
    documents.forEach(d => {
      content += `[${getDocCat(d)}] ${getDocName(d)} (${d?.size || 'N/A'}) - Created: ${d?.date || d?.createdAt || 'Recent'}\n`;
      content += `URL: ${getDocUrl(d) || 'Unavailable'}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `HCM_Vault_Index_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Vault manifest downloaded!');
  };

  // ── AI Analysis ──────────────────────────────────────────────
  const resetAiState = () => {
    setAiFile(null); setAiResult(null); setAiError(null);
    setStage('idle'); setStageProgress(0); setDragActive(false);
    setCopied(false); setSavingToVault(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectAiFile = (file) => {
    if (!validateAiFile(file).isValid) return;
    setAiFile(file); setAiResult(null); setAiError(null);
    setStage('selected'); setStageProgress(0);
  };

  const runAiAnalysis = async () => {
    if (!aiFile || ['uploading','ocr','analyzing'].includes(stage)) return;
    if (!validateAiFile(aiFile).isValid) return;

    setAiError(null); setAiResult(null);
    setStage('uploading'); setStageProgress(15);

    const formData = new FormData();
    formData.append('file', aiFile);

    const t1 = setTimeout(() => { setStage('ocr');      setStageProgress(45); }, 700);
    const t2 = setTimeout(() => { setStage('analyzing'); setStageProgress(75); }, 1800);

    try {
      const response = await api.aiDocumentAnalyze(formData);
      clearTimeout(t1); clearTimeout(t2);
      if (response?.data?.success) {
        setStage('success'); setStageProgress(100);
        setAiResult(response.data.data);
        showToast('Document analysis complete!');
      } else {
        throw new Error(response?.data?.error?.message || 'AI processing failed.');
      }
    } catch (err) {
      clearTimeout(t1); clearTimeout(t2);
      const msg = getErr(err, 'AI document analysis failed.');
      setStage('failure'); setStageProgress(0); setAiError(msg);
      showToast(msg, 'error');
    }
  };

  const handleSaveToVault = async () => {
    if (!aiFile || savingToVault) return;
    try {
      setSavingToVault(true);
      const formData = new FormData();
      formData.append('file', aiFile);
      formData.append('name', aiFile.name);
      const detectedType = aiResult?.document?.documentType;
      const allowedCats = STATIC_CATEGORIES.filter(c => c !== 'All');
      formData.append('category', allowedCats.includes(detectedType) ? detectedType : 'Other');
      formData.append('size', fileSizeLabel(aiFile));
      await employeeService.uploadDocument(formData);
      setIsAiModalOpen(false);
      resetAiState();
      await fetchAll();
      showToast('Document saved to vault!');
    } catch (err) {
      showToast(getErr(err, 'Failed to save to vault.'), 'error');
    } finally {
      setSavingToVault(false);
    }
  };

  const handleCopyResult = async () => {
    if (!aiResult) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(aiResult.extractedData || {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Extracted JSON copied!');
    } catch { showToast('Unable to copy.', 'error'); }
  };

  // ════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="space-y-8 pb-12 px-4 sm:px-0 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-9 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800" />)}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // ERROR
  // ════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="px-4 sm:px-0 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <AlertCircle className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to Load Vault Documents</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button onClick={fetchAll} variant="primary" leftIcon={RefreshCw}>
          Try Again
        </Button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8 pb-12 animate-fade-in px-4 sm:px-0 text-left">

      {/* ── HEADER ── */}
      <PageHeader
        title="Records & Vault"
        subtitle="Enterprise-grade secure storage for your career documents"
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={handleDownloadIndex}
            variant="secondary"
            leftIcon={Download}
          >
            Vault Index
          </Button>
          <Button
            onClick={() => { resetAiState(); setIsAiModalOpen(true); }}
            variant="ai"
            leftIcon={Sparkles}
          >
            AI Document Analyzer
          </Button>
          <Button
            onClick={() => { resetVaultForm(); setIsUploadModalOpen(true); }}
            variant="primary"
            leftIcon={CloudUpload}
          >
            Upload File
          </Button>
        </div>
      </PageHeader>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-2xl shrink-0', stat.bg, stat.color)}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none mb-1.5 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── FILTERS + SEARCH + DOCUMENTS ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          {/* Category Dropdown */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative" ref={catDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCatDropdownOpen(p => !p)}
                className={cn(
                  'h-11 px-4 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 shadow-sm',
                  isCatDropdownOpen
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                    : activeCategory !== 'All'
                      ? 'border-primary-300 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <Filter size={14} className={activeCategory !== 'All' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
                <span>{activeCategory === 'All' ? 'All Categories' : activeCategory}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-black',
                  activeCategory !== 'All'
                    ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}>
                  {categoryList.find(c => c.name === activeCategory)?.count ?? documents.length}
                </span>
                <ChevronDown size={13} className={cn('text-slate-400 transition-transform duration-200', isCatDropdownOpen && 'rotate-180 text-primary-600')} />
              </button>

              <AnimatePresence>
                {isCatDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-12 left-0 z-30 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl min-w-[200px] py-1.5 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      Filter by Category
                    </div>
                    {categoryList.map(cat => {
                      const isActive = activeCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => { setActiveCategory(cat.name); setIsCatDropdownOpen(false); }}
                          className={cn(
                            'w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group text-left mx-1 my-0.5',
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-black'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isActive && <Check size={13} />}
                            <span className={cn(!isActive && 'pl-5')}>{cat.name === 'All' ? 'All Documents' : cat.name}</span>
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-black',
                            isActive
                              ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          )}>{cat.count}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(activeCategory !== 'All' || searchTerm) && (
              <Button
                onClick={() => { setActiveCategory('All'); setSearchTerm(''); }}
                variant="ghost"
                leftIcon={X}
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by file name, category, type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 dark:focus:border-primary-700 transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── DOCUMENT GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDocs.length > 0 ? filteredDocs.map(doc => {
            const id       = doc.id;
            const name     = getDocName(doc);
            const category = getDocCat(doc);
            const url      = getDocUrl(doc);
            const isDeleting = deletingId === id;

            return (
              <motion.div
                layout
                key={id || name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800/50 transition-all overflow-hidden"
              >
                {/* Actions top-right */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={cn('w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform', fileIconBg(name))}>
                    <FileIconComponent name={name} size={22} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc)}
                      disabled={!url}
                      className="w-8 h-8 p-0"
                    >
                      <Eye size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={!url}
                      className="w-8 h-8 p-0"
                    >
                      <ArrowDownToLine size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocumentToDelete(doc)}
                      disabled={!id || isDeleting}
                      className="w-8 h-8 p-0 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </Button>
                  </div>
                </div>

                {/* Doc info */}
                <div className="text-left relative z-10">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-snug mb-1.5 truncate" title={name}>
                    {name}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    {category} {doc?.size ? `· ${doc.size}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <VerifiedBadge verified={doc?.verified} />
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic ml-auto">
                      Added: {doc?.date ? doc.date : (doc?.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Recent')}
                    </span>
                  </div>
                </div>

                {/* Background watermark icon */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                  <FileIconComponent name={name} size={110} />
                </div>
              </motion.div>
            );
          }) : documents.length > 0 ? (
            // Category/search filtered empty
            <div className="col-span-full py-16 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Folder size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No documents in "{activeCategory}"</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">You have {documents.length} document(s) in other categories.</p>
              <button onClick={() => { setActiveCategory('All'); setSearchTerm(''); }}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all">
                View All Documents ({documents.length})
              </button>
            </div>
          ) : (
            // Completely empty vault
            <div
              className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary-300 dark:hover:border-primary-800 transition-colors cursor-pointer"
              onDragOver={e => { e.preventDefault(); }}
              onDrop={async e => {
                e.preventDefault();
                const file = e.dataTransfer?.files?.[0];
                if (file) { selectVaultFile(file); setIsUploadModalOpen(true); }
              }}
              onClick={() => setIsUploadModalOpen(true)}
            >
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary-400">
                  <CloudUpload size={34} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">No documents found in vault</p>
                  <p className="text-xs text-slate-400 mt-1">Click here or drag and drop a document to upload</p>
                </div>
                <Button
                  onClick={e => { e.stopPropagation(); setIsUploadModalOpen(true); }}
                  variant="primary"
                  leftIcon={Plus}
                >
                  Upload Document
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          UPLOAD MODAL
      ════════════════════════════════════════════════════════ */}
      <CenterModal isOpen={isUploadModalOpen} onClose={() => { if (!isUploading) { setIsUploadModalOpen(false); resetVaultForm(); } }} title="Upload Vault Entry" maxWidth="max-w-xl">
        <div className="p-5 space-y-5 text-left">
          {/* Secure Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/30 p-4 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Secure Vault Storage</h4>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-100/80 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full">Max 25MB</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Tenant-isolated encrypted storage. PDF, DOCX, PNG, JPG, XLS, ZIP supported.</p>
            </div>
          </div>

          {/* Hidden input */}
          <input
            ref={vaultFileInputRef}
            type="file"
            className="hidden"
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.txt,.svg,.webp"
            onChange={e => { const f = e.target.files?.[0]; if (f) selectVaultFile(f); }}
          />

          {/* Dropzone or selected file card */}
          {!selectedFile ? (
            <div
              onClick={() => vaultFileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsModalDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); setIsModalDragOver(false); }}
              onDrop={e => {
                e.preventDefault(); setIsModalDragOver(false);
                const f = e.dataTransfer?.files?.[0]; if (f) selectVaultFile(f);
              }}
              className={cn(
                'group border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center text-center',
                isModalDragOver
                  ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-md'
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                <CloudUpload size={28} />
              </div>
              <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">Choose a file or drag &amp; drop</h5>
              <p className="text-xs text-slate-400 mb-3">PDF, DOCX, PNG, JPG, XLS or ZIP — max 25 MB</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Upload size={12} /> Browse Files
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-800 border-2 border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white shadow-md flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]" title={selectedFile.name}>{selectedFile.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full">{fileSize}</span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Ready to upload
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => vaultFileInputRef.current?.click()} disabled={isUploading}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-all">
                    <RefreshCw size={14} />
                  </button>
                  <button type="button" onClick={resetVaultForm} disabled={isUploading}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-500 text-slate-500 flex items-center justify-center transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              {isUploading && (
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">{uploadProgress}% — Encrypting &amp; uploading...</p>
                </div>
              )}
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Document Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Document Title</label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={docName} onChange={e => setDocName(e.target.value)}
                  disabled={isUploading} placeholder="e.g. Employment Agreement 2026"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Category *</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={isUploading}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition">
                {STATIC_CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Document Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Document Type</label>
              <input
                type="text" value={docType} onChange={e => setDocType(e.target.value)}
                disabled={isUploading} placeholder="e.g. Passport, Offer Letter..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Description</label>
              <input
                type="text" value={docDescription} onChange={e => setDocDescription(e.target.value)}
                disabled={isUploading} placeholder="Optional description..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => { setIsUploadModalOpen(false); resetVaultForm(); }} isDisabled={isUploading} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUploadSubmit} isDisabled={isUploading || !selectedFile} isLoading={isUploading} variant="primary" leftIcon={CloudUpload} className="flex-1">
              Upload to Vault
            </Button>
          </div>
        </div>
      </CenterModal>

      {/* ════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ════════════════════════════════════════════════════════ */}
      <CenterModal isOpen={Boolean(documentToDelete)} onClose={() => !deletingId && setDocumentToDelete(null)} title="Delete Vault Document" maxWidth="max-w-md">
        <div className="p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center mx-auto shadow-sm">
            <Trash2 size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Permanently Remove Document?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">This will be deleted from your secure vault and cannot be recovered.</p>
          </div>

          {documentToDelete && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-left flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-rose-500 shadow-sm flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{getDocName(documentToDelete)}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{getDocCat(documentToDelete)} · {documentToDelete?.size || 'Document'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={() => setDocumentToDelete(null)} isDisabled={Boolean(deletingId)} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmDeleteDocument} isDisabled={Boolean(deletingId)} isLoading={Boolean(deletingId)} variant="danger" leftIcon={Trash2} className="flex-1">
              Delete Permanently
            </Button>
          </div>
        </div>
      </CenterModal>

      {/* ════════════════════════════════════════════════════════
          DOCUMENT PREVIEW MODAL
      ════════════════════════════════════════════════════════ */}
      <CenterModal isOpen={Boolean(previewDoc)} onClose={() => setPreviewDoc(null)} title={previewDoc ? getDocName(previewDoc) : ''} maxWidth="max-w-3xl">
        {previewDoc && (
          <div className="p-4 space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{getDocCat(previewDoc)}</span>
              {previewDoc?.size && <span className="text-xs font-bold text-slate-400">· {previewDoc.size}</span>}
              <VerifiedBadge verified={previewDoc?.verified} />
              <span className="text-[10px] text-slate-300 dark:text-slate-600 ml-auto">
                {previewDoc?.date || (previewDoc?.createdAt ? new Date(previewDoc.createdAt).toLocaleDateString() : 'Recent')}
              </span>
            </div>

            {/* Preview */}
            {(() => {
              const url = previewDoc.url;
              const ext = getFileExt(getDocName(previewDoc));
              if (['jpg','jpeg','png','webp','svg'].includes(ext)) {
                return <img src={url} alt={getDocName(previewDoc)} className="max-h-[500px] mx-auto object-contain rounded-xl shadow-sm" />;
              }
              if (ext === 'pdf') {
                return <iframe src={url} title={getDocName(previewDoc)} className="w-full h-[500px] rounded-xl border-none" />;
              }
              return (
                <div className="py-16 text-center text-slate-400 space-y-4">
                  <FileText size={48} className="mx-auto text-slate-200 dark:text-slate-700" />
                  <p className="text-sm font-bold">Preview not available for this file type</p>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all">
                    <Eye size={14} /> Open File
                  </a>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={() => window.open(previewDoc.url, '_blank')} variant="secondary" leftIcon={Eye}>
                Open in New Tab
              </Button>
              <Button onClick={() => handleDownloadDocument(previewDoc)} variant="primary" leftIcon={Download}>
                Download
              </Button>
              <Button onClick={() => setPreviewDoc(null)} variant="secondary" leftIcon={X} className="ml-auto">
                Close
              </Button>
            </div>
          </div>
        )}
      </CenterModal>

      {/* ════════════════════════════════════════════════════════
          AI DOCUMENT ANALYZER MODAL
      ════════════════════════════════════════════════════════ */}
      <CenterModal isOpen={isAiModalOpen} onClose={() => { if (!['uploading','ocr','analyzing'].includes(stage)) { setIsAiModalOpen(false); resetAiState(); } }} title="✨ AI Document Analyzer" maxWidth="max-w-xl">
        <div className="p-5 space-y-5 text-left">
          {/* Stage Progress Bar */}
          {['uploading','ocr','analyzing'].includes(stage) && (
            <div className="space-y-2">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                  initial={{ width: '0%' }} animate={{ width: `${stageProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <p className="text-[11px] font-bold text-slate-500 text-center">
                {stage === 'uploading' ? '📤 Uploading document...' : stage === 'ocr' ? '🔍 Running OCR extraction...' : '🧠 AI analyzing content...'}
              </p>
            </div>
          )}

          {/* AI Drop Zone */}
          {stage === 'idle' || stage === 'selected' ? (
            <div
              onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); setDragActive(false); const f = e.dataTransfer?.files?.[0]; if (f) selectAiFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                dragActive
                  ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40'
                  : aiFile
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              )}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) selectAiFile(f); }} />
              {aiFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                    <FileText size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px]">{aiFile.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{fileSizeLabel(aiFile)} · Ready for analysis</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto">
                    <Brain size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">Drop document for AI analysis</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, TXT · Max 10MB</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Error State */}
          {stage === 'failure' && aiError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">Analysis Failed</h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{aiError}</p>
                </div>
              </div>
              <Button onClick={() => { setStage('selected'); setAiError(null); }} variant="danger" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {/* AI Result */}
          {stage === 'success' && aiResult && (
            <div className="space-y-3">
              {aiResult?.document && (
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2">Document Analysis</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {aiResult.document.documentType && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">Type</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{aiResult.document.documentType}</span>
                      </div>
                    )}
                    {aiResult.document.language && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">Language</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{aiResult.document.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {aiResult?.extractedData && Object.keys(aiResult.extractedData).length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Extracted Information</p>
                    <Button
                      onClick={handleCopyResult}
                      variant="ghost"
                      size="sm"
                      leftIcon={copied ? Check : Copy}
                    >
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </Button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {Object.entries(aiResult.extractedData).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold capitalize">{key.replace(/_/g,' ')}:</span>
                        <span className="font-black text-slate-800 dark:text-slate-200 max-w-[60%] truncate text-right">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiResult?.summary && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1.5">Summary</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{aiResult.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {stage === 'selected' && (
              <Button onClick={runAiAnalysis} variant="primary" leftIcon={Sparkles}>
                Analyze Document
              </Button>
            )}
            {stage === 'success' && aiFile && (
              <Button onClick={handleSaveToVault} isDisabled={savingToVault} isLoading={savingToVault} variant="primary" leftIcon={FolderLock}>
                Save to Vault
              </Button>
            )}
            {(stage === 'idle' || stage === 'failure' || stage === 'success') && (
              <Button onClick={() => { setIsAiModalOpen(false); resetAiState(); }} variant="secondary">
                Close
              </Button>
            )}
            {stage === 'selected' && (
              <Button onClick={resetAiState} variant="secondary">
                Clear
              </Button>
            )}
          </div>
        </div>
      </CenterModal>

    </div>
  );
};

// Inline Plus icon
const Plus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);



export default EmployeeDocuments;
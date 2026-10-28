import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShieldCheck, Sun, Wallet, Download, MessageSquare, Plus, Briefcase,
  CheckCircle2, FileText, LifeBuoy, Stethoscope, X, AlertCircle, Search,
  Landmark, GraduationCap, Laptop, Sparkles, Paperclip, Eye, Check, Loader2,
  ChevronDown, ChevronUp, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import { useDateFormat } from '../../hooks/useDateFormat';
import { useCurrency } from '../../hooks/useCurrency';
import CenterModal from '../../shared/components/layout/CenterModal';
import DatePicker from '../../shared/components/common/DatePicker';
import Button from '../../shared/components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../shared/components/ui/PageHeader';
import { uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import { employeeService } from '../../services/employee.service';
import API from '../../utils/apiService';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getCategoryTheme = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('health') || cat.includes('medical') || cat.includes('insurance') || cat.includes('dental'))
    return { icon: Stethoscope, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', bar: 'bg-rose-500' };
  if (cat.includes('retirement') || cat.includes('401') || cat.includes('finance') || cat.includes('pension'))
    return { icon: Landmark, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', bar: 'bg-emerald-500' };
  if (cat.includes('wellness') || cat.includes('fitness') || cat.includes('gym'))
    return { icon: Sparkles, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', bar: 'bg-amber-500' };
  if (cat.includes('allowance') || cat.includes('remote') || cat.includes('internet'))
    return { icon: Laptop, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', bar: 'bg-indigo-500' };
  if (cat.includes('education') || cat.includes('learning') || cat.includes('skill'))
    return { icon: GraduationCap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', bar: 'bg-purple-500' };
  return { icon: Heart, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/30', bar: 'bg-primary-500' };
};

const StatusBadge = ({ status = '' }) => {
  const s = status.toLowerCase();
  const isApproved = s.includes('approved') || s.includes('completed') || s.includes('settled');
  const isRejected = s.includes('rejected');
  const isPending  = !isApproved && !isRejected;
  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap',
      isApproved && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      isRejected && 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
      isPending  && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    )}>
      {status || 'Pending'}
    </span>
  );
};

// Hardcoded perks (design-defined, not from DB)
const CORPORATE_PERKS = [
  { label: 'Home Office Allowance', desc: 'Up to $500 setup subsidy',         icon: Laptop,        color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  { label: 'Gym & Wellbeing',       desc: 'Free ClassPass & Headspace',        icon: Heart,         color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
  { label: 'Learning Budget',       desc: 'Annual books & certifications',     icon: GraduationCap, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
  { label: 'Transit & Parking',     desc: 'Pre-tax commuter savings',          icon: Briefcase,     color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
];

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const EmployeeBenefits = () => {
  const { formatCurrency, getSymbol, getIcon } = useCurrency();
  const { formatDate } = useDateFormat();
  const { showToast, profile, createTicket } = useEmployee();
  const CurrencyIcon = getIcon();

  // ── Data State ──
  const [benefitsData, setBenefitsData]   = useState(null);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // ── UI State ──
  const [activeFilterTab, setActiveFilterTab]     = useState('All');
  const [claimSearch, setClaimSearch]             = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('All');
  const [isClaimModalOpen, setIsClaimModalOpen]   = useState(false);
  const fileInputRef                              = useRef(null);
  const [claimForm, setClaimForm]                 = useState({
    title: '',
    category: 'Medical Expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [claimFile, setClaimFile]                 = useState(null);
  const [claimAttachment, setClaimAttachment]     = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim]   = useState(false);
  const [enrollingPlanId, setEnrollingPlanId]       = useState(null);
  const [expandedClaimIdx, setExpandedClaimIdx]     = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl]   = useState(null);

  // ── Fetch ──
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bRes, rRes] = await Promise.all([
        employeeService.getBenefits(),
        employeeService.getReimbursements().catch(() => ({ data: { data: [] } })),
      ]);
      const bd = bRes?.data?.data || bRes?.data;
      setBenefitsData(bd);
      // Reimbursements endpoint returns claims array directly
      const rData = rRes?.data?.data || rRes?.data || [];
      setReimbursements(Array.isArray(rData) ? rData : (bd?.claims || []));
    } catch (err) {
      console.error('Benefits fetch error:', err);
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load benefits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ──
  const availablePlans = benefitsData?.availablePlans || [];
  const enrolledPlans  = benefitsData?.enrolledPlans  || [];
  const claims         = reimbursements.length ? reimbursements : (benefitsData?.claims || []);

  const activeBenefitsCount = enrolledPlans.length;
  const insurancePlan = enrolledPlans.find(ep => {
    const cat = (ep.benefitPlan?.category || '').toLowerCase();
    return cat.includes('health') || cat.includes('insurance') || cat.includes('medical');
  });
  const insurancePlanName = insurancePlan
    ? (insurancePlan.benefitPlan?.name?.length > 20
        ? insurancePlan.benefitPlan.name.slice(0, 20) + '...'
        : insurancePlan.benefitPlan?.name)
    : 'Not Enrolled';

  const approvedClaimsTotal = useMemo(() =>
    claims.filter(c => (c.overallStatus || c.status || '').toLowerCase().includes('approved') ||
                       (c.overallStatus || c.status || '').toLowerCase().includes('completed'))
          .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
  [claims]);

  const filteredPlans = useMemo(() => availablePlans.filter(plan => {
    const cat = (plan.category || '').toLowerCase();
    const isEnrolled = enrolledPlans.some(ep => ep.benefitPlanId === plan.id);
    if (activeFilterTab === 'Enrolled')    return isEnrolled;
    if (activeFilterTab === 'Health')      return cat.includes('health') || cat.includes('medical') || cat.includes('insurance');
    if (activeFilterTab === 'Retirement')  return cat.includes('retirement') || cat.includes('401') || cat.includes('finance');
    if (activeFilterTab === 'Wellness')    return cat.includes('wellness') || cat.includes('fitness') || cat.includes('allowance') || cat.includes('education');
    return true;
  }), [availablePlans, enrolledPlans, activeFilterTab]);

  const filteredClaims = useMemo(() => claims.filter(c => {
    const matchSearch = !claimSearch ||
      (c.title || '').toLowerCase().includes(claimSearch.toLowerCase()) ||
      (c.provider || '').toLowerCase().includes(claimSearch.toLowerCase());
    const s = (c.overallStatus || c.status || '').toLowerCase();
    const matchStatus =
      claimStatusFilter === 'All'      ? true :
      claimStatusFilter === 'Pending'  ? s.includes('pending') :
      claimStatusFilter === 'Approved' ? (s.includes('approved') || s.includes('completed')) :
      claimStatusFilter === 'Rejected' ? s.includes('rejected') : true;
    return matchSearch && matchStatus;
  }), [claims, claimSearch, claimStatusFilter]);

  // ── Handlers ──
  const handleEnrollToggle = async (planId, isEnrolled) => {
    try {
      setEnrollingPlanId(planId);
      if (isEnrolled) {
        await employeeService.unenrollBenefitById(planId);
        showToast('Unenrolled from benefit plan.', 'success');
      } else {
        await employeeService.enrollBenefitById(planId);
        showToast('Enrolled in benefit plan!', 'success');
      }
      await fetchAll();
    } catch (err) {
      showToast(err?.response?.data?.error?.message || 'Action failed.', 'error');
    } finally {
      setEnrollingPlanId(null);
    }
  };

  const handleOpenClaimModal = () => {
    setClaimForm({
      title: '',
      category: 'Medical Expense',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setClaimFile(null);
    setClaimAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsClaimModalOpen(true);
  };

  const handleCloseClaimModal = () => {
    if (isSubmittingClaim) return;
    setIsClaimModalOpen(false);
    setClaimFile(null);
    setClaimAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'], 10);
    if (!v.isValid) {
      showToast(v.message, 'error');
      e.target.value = '';
      return;
    }
    const kb = file.size / 1024;
    const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    setClaimFile(file);
    setClaimAttachment({
      name: file.name,
      size: sizeStr,
      file,
    });
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setClaimFile(null);
    setClaimAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimForm.title.trim()) {
      showToast('Please enter a claim title.', 'error');
      return;
    }
    const numAmount = parseFloat(claimForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid claim amount greater than 0.', 'error');
      return;
    }
    if (!claimForm.date) {
      showToast('Please select the expense date.', 'error');
      return;
    }
    if (!claimForm.description.trim()) {
      showToast('Please provide a description and purpose for the claim.', 'error');
      return;
    }

    setIsSubmittingClaim(true);

    let receiptUrl = null;
    let base64Fallback = null;

    if (claimFile) {
      setIsUploadingReceipt(true);
      try {
        const uploadRes = await uploadAPI.uploadDocument(claimFile, 'hcm/receipts');
        receiptUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      } catch (uploadErr) {
        console.warn('Cloud upload failed, using fallback base64 reader:', uploadErr.message);
      }

      if (!receiptUrl) {
        try {
          base64Fallback = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(claimFile);
          });
        } catch (readErr) {
          console.error('File read error:', readErr);
        }
      }
      setIsUploadingReceipt(false);
    }

    try {
      await employeeService.submitReimbursement({
        title: claimForm.title.trim(),
        category: claimForm.category,
        amount: numAmount,
        date: claimForm.date,
        description: claimForm.description.trim(),
        receiptUrl: receiptUrl || null,
        receiptBase64: base64Fallback || null,
        file: base64Fallback || null,
        receiptName: claimFile?.name || null,
        type: claimForm.title.trim(),
      });
      showToast('Expense claim submitted successfully!', 'success');
      handleCloseClaimModal();
      await fetchAll();
    } catch (err) {
      console.error('Submit claim error:', err);
      showToast(err?.response?.data?.error?.message || err?.response?.data?.message || err.message || 'Failed to submit claim.', 'error');
    } finally {
      setIsSubmittingClaim(false);
      setIsUploadingReceipt(false);
    }
  };

  const handleDownloadPolicy = (policyName) => {
    const text = `CORPORATE BENEFITS STATEMENT\n${policyName}\nBeneficiary: ${profile?.fullName || 'Employee'}\nDate: ${new Date().toLocaleDateString()}\nStatus: ACTIVE\n\nFor claims or disputes, contact HR.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${policyName.replace(/[^a-zA-Z0-9]/g,'_')}_Policy.txt`;
    a.click();
    showToast(`${policyName} policy downloaded!`, 'success');
  };

  const handleContactHR = () => createTicket({
    subject: 'Corporate Benefits Inquiry', category: 'Benefits', priority: 'Medium',
    message: 'Hello HR, I have an inquiry regarding my current benefit plans and reimbursement claims.'
  });

  const handleConnectAdvisor = () => createTicket({
    subject: 'Request: Personal Benefits & Wellness Advisor', category: 'Benefits', priority: 'High',
    message: 'I would like to schedule a private advisory consultation to review my healthcare and retirement options.'
  });

  // ─────────────────────────────────────────────
  // Error / Loading States
  // ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="px-4 sm:px-0 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <AlertCircle className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to Load Benefits</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button onClick={fetchAll} variant="primary" leftIcon={RefreshCw}>
          Try Again
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-12 px-4 sm:px-0 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-52 bg-slate-50 dark:bg-slate-800/50 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Stats Cards data
  // ─────────────────────────────────────────────
  const summaryCards = [
    { label: 'Active Enrolled Plans', value: activeBenefitsCount,                          icon: Heart,       iconBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
    { label: 'Health & Dental Plan',  value: insurancePlanName,                             icon: ShieldCheck, iconBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
    { label: 'Available Leave Balance', value: '—',                                        icon: Sun,         iconBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
    { label: 'Reimbursements Claimed', value: `${claims.length} (${formatCurrency(approvedClaimsTotal)})`, icon: Wallet, iconBg: 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in px-4 sm:px-0 text-left">

      {/* ── 1. Header ── */}
      <PageHeader 
        title="Benefits & Wellness"
        subtitle="Corporate insurance, retirement plans, wellness allowances, and reimbursement claims"
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleDownloadPolicy('Corporate_Benefits_Summary')}
            variant="secondary"
            leftIcon={Download}
          >
            Policy Summary
          </Button>
          <Button
            onClick={handleContactHR}
            variant="secondary"
            leftIcon={MessageSquare}
          >
            Contact HR
          </Button>
          <Button
            onClick={handleOpenClaimModal}
            variant="primary"
            leftIcon={Plus}
          >
            New Claim
          </Button>
        </div>
      </PageHeader>

      {/* ── 2. Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1 leading-tight">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Available Benefit Plans ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-primary-600 dark:text-primary-400" size={20} />
              <span>Available Corporate Benefit Plans</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Select and enroll in tailored health, retirement, and allowance programs</p>
          </div>
          {/* Filter tabs */}
          <div className="inline-flex items-center bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto max-w-full gap-0.5">
            {['All', 'Enrolled', 'Health', 'Retirement', 'Wellness'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilterTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  activeFilterTab === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {tab === 'All' ? 'All Plans' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <ShieldCheck size={32} className="mx-auto text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No matching benefit plans</p>
            <p className="text-xs text-slate-300 dark:text-slate-600">Select "All Plans" to view all packages.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlans.map((plan) => {
              const isEnrolled  = enrolledPlans.some(ep => ep.benefitPlanId === plan.id);
              const enrollment  = enrolledPlans.find(ep => ep.benefitPlanId === plan.id);
              const theme       = getCategoryTheme(plan.category);
              const CategoryIcon = theme.icon;
              const isProcessing = enrollingPlanId === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between group',
                    isEnrolled
                      ? 'bg-white dark:bg-slate-900 border-primary-300 dark:border-primary-800/60 ring-1 ring-primary-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  )}
                >
                  <div>
                    {/* Plan Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', theme.bg, theme.color)}>
                          <CategoryIcon size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{plan.name}</h3>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{plan.category || 'Benefit'}</span>
                        </div>
                      </div>
                      {isEnrolled ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1 shrink-0">
                          <Check size={10} /> Enrolled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">Available</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {plan.description || 'Enterprise benefit package provided by corporate sponsorship.'}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-[11px]">Provider:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{plan.provider || 'Company Provided'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-[11px]">Monthly Cost:</span>
                        <span className="font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(parseFloat(plan.contribution) || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-[11px]">Emp. Contribution:</span>
                        <span className="font-black text-primary-600 dark:text-primary-400 tabular-nums">
                          {parseFloat(plan.empContribution) > 0 ? formatCurrency(parseFloat(plan.empContribution)) : '$0 (100% Covered)'}
                        </span>
                      </div>
                      {isEnrolled && (
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-400 font-bold text-[11px]">Enrolled On:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {enrollment?.createdAt ? formatDate(enrollment.createdAt) : 'Active'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isEnrolled ? (
                      <>
                        <Button
                          onClick={() => handleDownloadPolicy(plan.name)}
                          variant="ghost"
                          leftIcon={FileText}
                        >
                          Statement
                        </Button>
                        <Button
                          onClick={() => handleEnrollToggle(plan.id, true)}
                          isDisabled={isProcessing}
                          isLoading={isProcessing}
                          variant="danger"
                          leftIcon={X}
                        >
                          Unenroll
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleEnrollToggle(plan.id, false)}
                        isDisabled={isProcessing}
                        isLoading={isProcessing}
                        variant="primary"
                        leftIcon={Plus}
                      >
                        Enroll in Plan
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Informational filler card */}
            {filteredPlans.length < 2 && (
              <div className="p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">More Corporate Perks</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Additional healthcare, 401(k) retirement matching, and learning allowances can be configured by your HR department.
                  </p>
                </div>
                <div className="pt-4">
                  <Button onClick={handleContactHR} variant="secondary" leftIcon={MessageSquare}>
                    Inquire with HR
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Corporate Perks + Advisor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Perks card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Corporate Perks &amp; Stipends</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Automated allowances and pre-tax employee benefits</p>
            </div>
            <Sparkles size={18} className="text-slate-300 dark:text-slate-600" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CORPORATE_PERKS.map((perk, i) => {
              const PerkIcon = perk.icon;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-xl shrink-0', perk.color)}>
                      <PerkIcon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{perk.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{perk.desc}</p>
                    </div>
                  </div>
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Advisor card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-primary-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <LifeBuoy size={160} />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white uppercase tracking-widest backdrop-blur-md mb-3 inline-block">
              Benefits Concierge
            </span>
            <h3 className="text-lg font-black leading-tight mb-2">Need personalized benefit advice?</h3>
            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
              Schedule a 1-on-1 confidential session with a certified corporate benefits and retirement advisor for customized guidance.
            </p>
          </div>
          <div className="pt-5">
            <Button
              onClick={handleConnectAdvisor}
              variant="outline"
              leftIcon={LifeBuoy}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              Connect with Advisor
            </Button>
          </div>
        </div>
      </div>

      {/* ── 5. Reimbursement Claims ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Reimbursement Claims</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                  {filteredClaims.length} records
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Track medical, equipment, and travel expense settlements</p>
            </div>
          </div>
          <Button
            onClick={handleOpenClaimModal}
            variant="primary"
            leftIcon={Plus}
          >
            Submit Claim
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search claims by title or description..."
              value={claimSearch}
              onChange={e => setClaimSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 dark:focus:border-primary-700 transition"
            />
            {claimSearch && (
              <button onClick={() => setClaimSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="sm:col-span-4">
            <select
              value={claimStatusFilter}
              onChange={e => setClaimStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Approval</option>
              <option value="Approved">Approved / Settled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Claims Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['CLAIM DETAILS', 'AMOUNT', 'STATUS', 'AUDIT TIMELINE'].map((col, i) => (
                  <th key={col} className={cn('px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/80 dark:bg-slate-800/30', i === 3 && 'text-right')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10">
                    <EmptyState 
                      icon={Wallet}
                      title="No reimbursement claims logged yet"
                      action={
                        <Button onClick={handleOpenClaimModal} variant="link" className="text-primary-600 p-0 h-auto" rightIcon={ArrowUpRight}>
                          Submit your first expense claim
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : filteredClaims.map((claim, idx) => {
                let history = [];
                try { history = claim.approvalHistory ? JSON.parse(claim.approvalHistory) : []; } catch {}
                const isApproved  = (claim.overallStatus || claim.status || '').toLowerCase().includes('approved') ||
                                    (claim.overallStatus || claim.status || '').toLowerCase().includes('completed');
                const isRejected  = (claim.overallStatus || claim.status || '').toLowerCase().includes('rejected');
                const isExpanded  = expandedClaimIdx === idx;
                const rawReceipt  = claim.receiptUrl || claim.provider?.match(/\[Receipt:\s*([^\]]+)\]/)?.[1];

                return (
                  <React.Fragment key={claim.id || idx}>
                    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-black text-slate-900 dark:text-white text-sm">{claim.title || '—'}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium flex-wrap text-slate-500">
                          <span>{claim.claimedAt ? formatDate(claim.claimedAt) : '—'}</span>
                          {claim.provider && <><span>•</span><span className="truncate max-w-[160px]">{claim.provider.replace(/\[Receipt:\s*[^\]]+\]/, '').trim()}</span></>}
                          {rawReceipt && (
                            <Button onClick={() => setReceiptPreviewUrl(rawReceipt)} variant="link" className="p-0 h-auto text-[11px]" leftIcon={Paperclip}>
                              Receipt
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-black text-sm text-slate-800 dark:text-white">
                        {formatCurrency(claim.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={claim.overallStatus || claim.status || 'Pending'} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          onClick={() => setExpandedClaimIdx(isExpanded ? null : idx)}
                          variant="secondary"
                          className="ml-auto text-[11px] py-1.5 px-3 h-auto"
                          rightIcon={isExpanded ? ChevronUp : ChevronDown}
                        >
                          Audit
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40">
                        <td colSpan={4} className="px-5 py-4">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2.5">Approval Progression Trail</p>
                          <div className="flex items-center gap-3 overflow-x-auto pb-1">
                            {history.length > 0 ? history.map((step, sIdx) => (
                              <div key={sIdx} className="flex flex-col min-w-[130px] p-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm">
                                <span className="text-[9px] text-slate-400 tracking-widest">{step.date ? formatDate(step.date) : 'Recent'}</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">{step.action || 'Submitted'}</span>
                                <span className="text-[10px] text-slate-500 truncate">by {step.actor || 'System'}</span>
                              </div>
                            )) : (
                              <p className="text-xs text-slate-400 italic">No historical actions logged yet.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Submit Claim Modal ── */}
      <CenterModal 
        isOpen={isClaimModalOpen} 
        onClose={handleCloseClaimModal} 
        title="Submit Expense Claim"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleClaimSubmit} className="p-5 sm:p-7 pt-4 sm:pt-5 space-y-4 sm:space-y-5 text-left">
          {/* Claim Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Claim Title <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              value={claimForm.title}
              onChange={e => setClaimForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Medical checkup, Home office desk..."
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select 
                  name="category" 
                  required 
                  value={claimForm.category}
                  onChange={e => setClaimForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition appearance-none cursor-pointer"
                >
                  <option value="Medical Expense">Medical / Dental</option>
                  <option value="Home Office Equipment">Home &amp; Internet</option>
                  <option value="Fitness Wellness">Fitness / Gym Subsidy</option>
                  <option value="Learning Certification">Learning Courses</option>
                  <option value="Travel Commute">Travel / Client Meals</option>
                  <option value="General Expense">Other Corporate Expense</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Amount ({getSymbol()}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                  {getSymbol()}
                </span>
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  required 
                  value={claimForm.amount}
                  onChange={e => setClaimForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00" 
                  className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expense Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <DatePicker 
                name="date" 
                value={claimForm.date} 
                onChange={e => {
                  const val = e?.target?.value !== undefined ? e.target.value : e;
                  setClaimForm(prev => ({ ...prev, date: val }));
                }}
                max={new Date().toISOString().split('T')[0]}
                required
                placeholder="dd/mm/yyyy"
                className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition"
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Receipt Upload
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="claim-receipt-upload"
                />
                {claimAttachment ? (
                  <div className="h-11 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[170px]" title={claimAttachment.name}>
                        {claimAttachment.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                        ({claimAttachment.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="claim-receipt-upload"
                    className="h-11 px-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary-400 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                      <Paperclip size={15} className="text-slate-400 group-hover:text-primary-500" />
                      <span className="truncate">Choose receipt (PDF, PNG, JPG)</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md border border-primary-200/60 dark:border-primary-800/40 shrink-0">
                      Browse
                    </span>
                  </label>
                )}
                {isUploadingReceipt && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={15} className="animate-spin text-primary-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description & Purpose */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Description &amp; Purpose <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={3}
              required
              value={claimForm.description}
              onChange={e => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide details for manager and finance review..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button 
              type="button" 
              onClick={handleCloseClaimModal} 
              variant="secondary" 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isDisabled={isSubmittingClaim || isUploadingReceipt} 
              isLoading={isSubmittingClaim || isUploadingReceipt} 
              variant="primary" 
              leftIcon={Plus} 
              className="flex-1"
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </CenterModal>

      {/* ── Receipt Preview Modal ── */}
      {receiptPreviewUrl && (
        <CenterModal isOpen={Boolean(receiptPreviewUrl)} onClose={() => setReceiptPreviewUrl(null)} title="Attached Receipt">
          <div className="p-4 space-y-4 text-center">
            {receiptPreviewUrl.endsWith('.pdf') ? (
              <iframe src={receiptPreviewUrl} title="Receipt" className="w-full h-[400px] border-none rounded-xl" />
            ) : (
              <img src={receiptPreviewUrl} alt="Receipt" className="max-h-[400px] mx-auto object-contain rounded-xl shadow-sm" />
            )}
            <div className="flex justify-end">
              <Button onClick={() => window.open(receiptPreviewUrl, '_blank')} variant="secondary" leftIcon={Eye}>
                Open in New Tab
              </Button>
            </div>
          </div>
        </CenterModal>
      )}

    </div>
  );
};

export default EmployeeBenefits;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, FileText, Calendar, Download, Loader2,
  AlertCircle, X, Printer, Brain, RefreshCw, ArrowDownToLine,
  TrendingUp, Banknote, BarChart2, Sparkles, Search, Filter,
  ChevronDown, ArrowUpRight, Target, Lightbulb, ShieldCheck,
  Star, Send, MessageSquare, Wallet, PiggyBank, Receipt,
  BadgePercent, Activity, ClipboardList, Clock, CheckCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCurrency } from '../../hooks/useCurrency';
import { useEmployee } from '../../hooks/useEmployee';
import { useAuth } from '../../hooks/useAuth';
import { employeeService } from '../../services/employee.service';
import CenterModal from '../../shared/components/layout/CenterModal';
import { employeeAPI } from '../../utils/apiService';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { downloadPayslipPDF, printPayslipIsolated } from '../../utils/printAndPdfUtils';

// ──────────────────────────────────────────
// Status Badge
// ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Paid:       'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    Processed:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    Draft:      'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
    Pending:    'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
    Cancelled:  'bg-rose-100   dark:bg-rose-900/30   text-rose-700   dark:text-rose-400',
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', map[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
      {status}
    </span>
  );
};

// ──────────────────────────────────────────
// Metric Card
// ──────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, iconBg, iconColor, accent, badge }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all group cursor-default">
    <div className="flex items-start justify-between">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <Icon size={20} className={iconColor} />
      </div>
      {badge && (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
          {badge}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">{sub}</p>}
    </div>
    <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={cn('h-1 rounded-full w-2/3 transition-all', accent)} />
    </div>
  </div>
);

// ──────────────────────────────────────────
// Salary Breakdown Visualizer
// ──────────────────────────────────────────
const SalaryBreakdown = ({ payslip, formatCurrency }) => {
  if (!payslip) return null;
  const gross = payslip.grossSalary || 0;
  const deductions = payslip.totalDeductions || 0;
  const net = payslip.netSalary || 0;
  if (gross === 0) return null;

  const earnings = payslip.items?.filter(i => ['Earning', 'Allowance', 'Variable Pay'].includes(i.type)) || [];
  const deductionItems = payslip.items?.filter(i => i.type === 'Deduction') || [];

  const baseItem = earnings.find(e => e.code === 'BASE' || e.name?.toLowerCase().includes('basic'));
  const base = baseItem?.amount || gross - (earnings.reduce((a, e) => a + (e.amount || 0), 0) - (baseItem?.amount || 0));
  const allowances = gross - (base || 0);

  const segments = [
    { label: 'Base Salary', amount: base || gross, pct: gross > 0 ? Math.round(((base || gross) / gross) * 100) : 100, color: 'bg-emerald-500' },
    { label: 'Allowances', amount: allowances > 0 ? allowances : 0, pct: gross > 0 ? Math.round((Math.max(0, allowances) / gross) * 100) : 0, color: 'bg-indigo-500' },
    { label: 'Deductions', amount: deductions, pct: gross > 0 ? Math.round((deductions / gross) * 100) : 0, color: 'bg-rose-500' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Salary Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">Based on latest payslip — {payslip.month}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Take-Home</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(net)}</p>
        </div>
      </div>

      {/* Multi-segment bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {segments.map((s, i) => s.pct > 0 && (
          <div key={i} className={cn('h-full rounded-full', s.color)} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct}%`} />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3">
        {segments.map((s, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', s.color)} />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{s.label}</span>
            </div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 pl-4">{formatCurrency(s.amount)}</p>
            <p className="text-[10px] text-slate-400 pl-4">{s.pct}%</p>
          </div>
        ))}
      </div>

      {/* Earnings & Deduction detail */}
      {(earnings.length > 0 || deductionItems.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {earnings.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Earnings</p>
              <div className="space-y-1">
                {earnings.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {deductionItems.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Deductions</p>
              <div className="space-y-1">
                {deductionItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    <span className="font-bold text-rose-500">−{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────
// Mobile Payslip Card
// ──────────────────────────────────────────
const PayslipCard = ({ p, idx, formatCurrency, isDownloading, onView, onDownload }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.04 }}
    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-black text-slate-900 dark:text-white">{p.month}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </p>
      </div>
      <StatusBadge status={p.status} />
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Gross</p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{formatCurrency(p.grossSalary)}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-rose-400 uppercase tracking-wider">Deductions</p>
        <p className="text-xs font-bold text-rose-500 mt-0.5">−{formatCurrency(p.totalDeductions)}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Net Pay</p>
        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(p.netSalary)}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
      <Button variant="secondary" size="sm" onClick={() => onView(p)} leftIcon={FileText} className="flex-1 text-[11px]">
        View Details
      </Button>
      <Button variant="primary" size="sm" onClick={() => onDownload(p)} isDisabled={isDownloading === p.id} isLoading={isDownloading === p.id} leftIcon={ArrowDownToLine} className="flex-1 text-[11px]">
        Download
      </Button>
    </div>
  </motion.div>
);

// ──────────────────────────────────────────
// AI Analysis Progress
// ──────────────────────────────────────────
const AnalysisPhase = ({ phase }) => {
  const phases = [
    { label: 'Scanning compensation profile and payslip records…', icon: Receipt },
    { label: 'Evaluating tax brackets, EPF, and statutory withholdings…', icon: ShieldCheck },
    { label: 'Generating tailored financial insights and recommendations…', icon: Lightbulb },
  ];
  return (
    <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-900 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-primary-600 border-r-primary-400 rounded-full animate-spin" />
        <div className="absolute inset-2 flex items-center justify-center">
          <Brain size={22} className="text-primary-600" />
        </div>
      </div>
      <div className="space-y-3 w-full max-w-xs">
        {phases.map((p, i) => {
          const Icon = p.icon;
          const done = i < phase;
          const active = i === phase;
          return (
            <div key={i} className={cn('flex items-center gap-3 text-left px-4 py-2.5 rounded-xl transition-all', active ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800' : done ? 'opacity-50' : 'opacity-30')}>
              {done ? <CheckCheck size={16} className="text-emerald-500 shrink-0" /> : <Icon size={16} className={active ? 'text-primary-500' : 'text-slate-400'} />}
              <p className={cn('text-xs font-bold leading-snug', active ? 'text-primary-700 dark:text-primary-300' : 'text-slate-500')}>{p.label}</p>
              {active && <Loader2 size={14} className="text-primary-500 animate-spin ml-auto shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────
const EmployeePayroll = () => {
  const [payrollData, setPayrollData]         = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isDownloading, setIsDownloading]     = useState(null);

  // Filter / search
  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // AI Insights
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsContent, setInsightsContent]     = useState(null);
  const [analysisPhase, setAnalysisPhase]         = useState(0);
  const [analyzing, setAnalyzing]                 = useState(false);
  const [aiError, setAiError]                     = useState(null);
  const [followUpQuery, setFollowUpQuery]         = useState('');
  const [followUpLoading, setFollowUpLoading]     = useState(false);
  const [followUpAnswer, setFollowUpAnswer]       = useState(null);
  const phaseTimerRef = useRef(null);

  // Increment Request
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [incrementForm, setIncrementForm] = useState({ requestedSalary: '', reason: '', effectiveDate: '' });
  const [incrementLoading, setIncrementLoading] = useState(false);

  const { formatCurrency } = useCurrency();
  const { showToast, profile } = useEmployee();
  const { user } = useAuth();

  const companyName = useMemo(() => {
    try {
      const cached = localStorage.getItem('hcm_org_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.companyName || parsed.name) return parsed.companyName || parsed.name;
      }
    } catch { void 0; }
    return user?.organization?.name || profile?.organization?.name || 'GlobalTech Solutions';
  }, [user, profile]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedPayslip(null);
    };
    if (selectedPayslip) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [selectedPayslip]);

  // ── Fetch ──
  const fetchData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);
      const res  = await employeeService.getPayroll();
      const data = res?.data?.data || res?.data;
      setPayrollData(data);
    } catch (err) {
      console.error('Payroll fetch error:', err);
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load payroll data.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Download Payslip PDF ──
  const handleDownload = async (payslip) => {
    if (isDownloading) return;
    setIsDownloading(payslip.id);
    const activeCompanyName = payslip.companyName || companyName;
    const activeCurrency = payslip.currency || currency || 'USD';
    try {
      const res = await employeeService.downloadPayslip(payslip.id);
      if (res?.data && res.data.size > 100) {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `Payslip_${(payslip.month || 'Period').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Payslip downloaded successfully!', 'success');
      } else {
        // Fallback to client-side PDF generation
        downloadPayslipPDF(payslip, { companyName: activeCompanyName, currency: activeCurrency });
        showToast('Payslip PDF generated and downloaded!', 'success');
      }
    } catch (err) {
      console.warn('Server download failed, using client-side generator:', err.message);
      try {
        downloadPayslipPDF(payslip, { companyName: activeCompanyName, currency: activeCurrency });
        showToast('Payslip PDF generated and downloaded!', 'success');
      } catch (fallbackErr) {
        console.error('All PDF generation failed:', fallbackErr);
        showToast('Failed to download payslip. Please try again.', 'error');
      }
    } finally {
      setIsDownloading(null);
    }
  };

  // ── AI Insights helpers ──
  const normalizeAI = (raw) => {
    if (!raw) return null;
    let d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (d?.data) d = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
    if (d?.reply?.trim?.().startsWith('{')) {
      try { const p = JSON.parse(d.reply); if (p.summary || p.insights) d = p; } catch (err) { void err; }
    }
    return d;
  };

  const startPhaseAnimation = () => {
    let phase = 0;
    setAnalysisPhase(0);
    phaseTimerRef.current = setInterval(() => {
      phase++;
      if (phase >= 3) {
        clearInterval(phaseTimerRef.current);
      } else {
        setAnalysisPhase(phase);
      }
    }, 2200);
  };

  const stopPhaseAnimation = () => {
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    setAnalysisPhase(3);
  };

  const handleAIInsights = async () => {
    setShowInsightsModal(true);
    setAnalyzing(true);
    setAiError(null);
    setInsightsContent(null);
    setFollowUpQuery('');
    setFollowUpAnswer(null);
    startPhaseAnimation();
    try {
      const res = await employeeAPI.aiPayrollInsights();
      stopPhaseAnimation();
      const normalized = normalizeAI(res?.data?.data || res?.data);
      setInsightsContent(normalized || { summary: 'AI analysis complete. No detailed breakdown available.' });
    } catch (err) {
      stopPhaseAnimation();
      setAiError(err?.response?.data?.error?.message || err.message || 'AI service unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => { if (phaseTimerRef.current) clearInterval(phaseTimerRef.current); };
  }, []);

  // Follow-up AI question
  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpQuery.trim()) return;
    setFollowUpLoading(true);
    setFollowUpAnswer(null);
    try {
      const res = await employeeAPI.aiPolicyAssistant(
        `Regarding my payroll: ${followUpQuery}`,
        [],
        '/employee/payroll'
      );
      const raw = res?.data?.data || res?.data;
      setFollowUpAnswer(typeof raw === 'string' ? raw : raw?.reply || raw?.answer || JSON.stringify(raw));
    } catch (err) {
      setFollowUpAnswer('Sorry, I could not process your question at this time. Please try again.');
    } finally {
      setFollowUpLoading(false);
    }
  };

  // ── Increment Request ──
  const handleIncrementSubmit = async (e) => {
    e.preventDefault();
    if (!incrementForm.requestedSalary || !incrementForm.reason || !incrementForm.effectiveDate) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setIncrementLoading(true);
    try {
      await employeeAPI.requestIncrement({
        requestedSalary: Number(incrementForm.requestedSalary),
        reason: incrementForm.reason,
        effectiveDate: incrementForm.effectiveDate,
      });
      showToast('Salary increment request submitted successfully!', 'success');
      setShowIncrementModal(false);
      setIncrementForm({ requestedSalary: '', reason: '', effectiveDate: '' });
    } catch (err) {
      showToast(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to submit increment request.', 'error');
    } finally {
      setIncrementLoading(false);
    }
  };

  // ── Derived data ──
  const { salaryStructure, monthlyCTC, annualCTC, payslips = [], currency } = payrollData || {};

  // YTD calculations
  const ytdStats = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const ytdPayslips = payslips.filter(p => ['Paid', 'Processed'].includes(p.status));
    return {
      ytdNet: ytdPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      ytdGross: ytdPayslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      ytdDeductions: ytdPayslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
      count: ytdPayslips.length,
    };
  }, [payslips]);

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter(p => {
      const matchSearch = !searchTerm || p.month?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payslips, searchTerm, statusFilter]);

  const latestPayslip = payslips[0] || null;

  const takeHomePct = latestPayslip && latestPayslip.grossSalary > 0
    ? Math.round((latestPayslip.netSalary / latestPayslip.grossSalary) * 100)
    : null;

  // ──────────────────────────────────────────
  // Error State
  // ──────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
          <AlertCircle className="text-rose-500 w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Payroll Data</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button onClick={() => fetchData()} variant="primary" leftIcon={RefreshCw}>Try Again</Button>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // Loading Skeleton
  // ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse px-4 sm:px-0">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-44 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl" />)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
          {[1,2,3].map(i => <div key={i} className="h-14 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const statusOptions = ['All', ...Array.from(new Set(payslips.map(p => p.status).filter(Boolean)))];

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12 animate-fade-in relative px-4 sm:px-0 text-left">

      {/* ── Header ── */}
      <PageHeader
        title="My Compensation & Payroll"
        subtitle="Your salary structure, payslips, and AI-powered compensation intelligence."
      >
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            onClick={() => setShowIncrementModal(true)}
            variant="secondary"
            leftIcon={TrendingUp}
            size="md"
          >
            <span className="hidden sm:inline">Request Increment</span>
            <span className="sm:hidden">Increment</span>
          </Button>
          <Button
            onClick={handleAIInsights}
            isDisabled={analyzing}
            variant="ai"
            leftIcon={Sparkles}
            size="md"
          >
            <span className="hidden sm:inline">AI Payroll Insights</span>
            <span className="sm:hidden">AI Insights</span>
          </Button>
        </div>
      </PageHeader>

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CheckCircle2}
          label="Salary Structure"
          value={salaryStructure || 'Not assigned'}
          sub={salaryStructure ? 'Active Compensation Plan' : 'Please contact HR to assign'}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accent="bg-emerald-500"
          badge={salaryStructure ? 'Active' : undefined}
        />
        <MetricCard
          icon={Banknote}
          label="Monthly CTC"
          value={monthlyCTC ? formatCurrency(monthlyCTC) : '—'}
          sub={takeHomePct ? `~${takeHomePct}% take-home efficiency` : 'Cost to Company per month'}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
          accent="bg-blue-500"
        />
        <MetricCard
          icon={Calendar}
          label="Annual CTC"
          value={annualCTC ? formatCurrency(annualCTC) : '—'}
          sub="Cost to Company per annum"
          iconBg="bg-violet-50 dark:bg-violet-950/40"
          iconColor="text-violet-600 dark:text-violet-400"
          accent="bg-violet-500"
        />
        <MetricCard
          icon={Wallet}
          label="YTD Net Paid"
          value={ytdStats.ytdNet ? formatCurrency(ytdStats.ytdNet) : '—'}
          sub={`${ytdStats.count} payslip${ytdStats.count !== 1 ? 's' : ''} processed this year`}
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
          accent="bg-amber-500"
          badge={ytdStats.count > 0 ? `${ytdStats.count} payouts` : undefined}
        />
      </div>

      {/* ── Salary Breakdown Visualizer ── */}
      {latestPayslip && latestPayslip.grossSalary > 0 && (
        <SalaryBreakdown payslip={latestPayslip} formatCurrency={formatCurrency} />
      )}

      {/* ── YTD Summary Banner ── */}
      {ytdStats.ytdGross > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-slate-400" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Year-to-Date Summary</p>
          </div>
          <div className="grid grid-cols-3 gap-4 divide-x divide-white/10">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross</p>
              <p className="text-lg font-black">{formatCurrency(ytdStats.ytdGross)}</p>
            </div>
            <div className="text-center pl-4">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Total Deducted</p>
              <p className="text-lg font-black text-rose-300">{formatCurrency(ytdStats.ytdDeductions)}</p>
            </div>
            <div className="text-center pl-4">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Total Net</p>
              <p className="text-lg font-black text-emerald-300">{formatCurrency(ytdStats.ytdNet)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Payslips Section ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Header + filters */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Payslips</h2>
              <p className="text-xs text-slate-400 mt-0.5">{payslips.length} payroll snapshot{payslips.length !== 1 ? 's' : ''} on record</p>
            </div>
          </div>

          {payslips.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by month…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              {/* Status filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {statusOptions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer',
                      statusFilter === s
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['MONTH', 'GROSS SALARY', 'DEDUCTIONS', 'NET PAY', 'DATE', 'STATUS', 'ACTION'].map((col, i) => (
                  <th
                    key={col}
                    className={cn(
                      'px-5 py-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest',
                      i === 6 ? 'text-right' : 'text-left'
                    )}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14">
                    <EmptyState
                      icon={FileText}
                      title={payslips.length === 0 ? 'No payslips found' : 'No results match your filters'}
                      message={payslips.length === 0 ? 'Payslips appear here after each payroll run.' : 'Try adjusting your search or filter.'}
                    />
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center shrink-0">
                          <Calendar size={14} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{p.month}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{formatCurrency(p.grossSalary)}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-rose-500 dark:text-rose-400 font-medium">−{formatCurrency(p.totalDeductions)}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.netSalary)}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-400">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedPayslip(p)} leftIcon={FileText} className="text-[11px]">
                          View
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleDownload(p)} isDisabled={isDownloading === p.id} isLoading={isDownloading === p.id} leftIcon={ArrowDownToLine} className="text-[11px]">
                          PDF
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {filteredPayslips.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={payslips.length === 0 ? 'No payslips found' : 'No results match your filters'}
              message={payslips.length === 0 ? 'Payslips appear here after each payroll run.' : 'Try adjusting your search or filter.'}
            />
          ) : (
            filteredPayslips.map((p, idx) => (
              <PayslipCard
                key={p.id}
                p={p}
                idx={idx}
                formatCurrency={formatCurrency}
                isDownloading={isDownloading}
                onView={setSelectedPayslip}
                onDownload={handleDownload}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Payslip Detail Modal ── */}
      <AnimatePresence>
        {selectedPayslip && (
          <div 
            onClick={() => setSelectedPayslip(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl p-5 sm:p-7 space-y-5 my-auto overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedPayslip.companyName || companyName}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">
                    Enterprise Employee Paystub
                  </p>
                </div>
                <div className="flex items-start gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-slate-400">
                      PAYSLIP: #{selectedPayslip.id?.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Month: <strong className="text-slate-700 dark:text-slate-300">{selectedPayslip.month}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPayslip(null)}
                    className="p-1.5 -mr-1 -mt-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Employee & Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employee Details</p>
                  <p className="font-black text-slate-800 dark:text-slate-100">{selectedPayslip.employeeName || profile?.name || '—'}</p>
                  <p className="text-slate-400 font-mono mt-0.5">{selectedPayslip.employeeCode || profile?.employeeId || ''}</p>
                  {(selectedPayslip.designation || profile?.designation) && (
                    <p className="text-slate-500 mt-0.5">{selectedPayslip.designation || profile?.designation}</p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Attendance Summary</p>
                  <p className="text-slate-600 dark:text-slate-400">Working Days: <strong className="text-slate-800 dark:text-slate-200">{selectedPayslip.totalWorkingDays ?? 0}</strong></p>
                  <p className="text-slate-600 dark:text-slate-400">Days Present: <strong className="text-slate-800 dark:text-slate-200">{selectedPayslip.presentDays ?? 0}</strong></p>
                  <p className="text-slate-600 dark:text-slate-400">Paid Leaves: <strong className="text-slate-800 dark:text-slate-200">{selectedPayslip.paidLeaveDays ?? 0}</strong></p>
                  <p className="text-slate-600 dark:text-slate-400">LOP Days: <strong className="text-slate-800 dark:text-slate-200">{selectedPayslip.unpaidLeaveDays ?? 0}</strong></p>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 text-xs">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">Earnings</h4>
                  {(selectedPayslip.items?.filter(i => ['Earning','Allowance','Variable Pay'].includes(i.type)) || []).length > 0
                    ? selectedPayslip.items.filter(i => ['Earning','Allowance','Variable Pay'].includes(i.type)).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>{item.name}</span>
                          <span className="font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    : (
                        <div className="py-1 text-slate-600 dark:text-slate-300 flex justify-between">
                          <span>Base Salary &amp; Allowances</span>
                          <span className="font-bold">{formatCurrency(selectedPayslip.grossSalary)}</span>
                        </div>
                      )
                  }
                  <div className="flex justify-between py-1.5 font-black border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                    <span>Gross Earnings</span>
                    <span>{formatCurrency(selectedPayslip.grossSalary)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">Deductions</h4>
                  {(selectedPayslip.items?.filter(i => i.type === 'Deduction') || []).length > 0
                    ? selectedPayslip.items.filter(i => i.type === 'Deduction').map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                          <span>{item.name}</span>
                          <span className="text-rose-500">−{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    : (
                        <div className="py-1 text-slate-600 dark:text-slate-300 flex justify-between">
                          <span>Taxes &amp; Statutory Deductions</span>
                          <span className="text-rose-500">−{formatCurrency(selectedPayslip.totalDeductions)}</span>
                        </div>
                      )
                  }
                  <div className="flex justify-between py-1.5 font-black border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                    <span>Total Withheld</span>
                    <span className="text-rose-500">−{formatCurrency(selectedPayslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Net Salary Payable</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{formatCurrency(selectedPayslip.netSalary)}</p>
                </div>
                <StatusBadge status={selectedPayslip.status} />
              </div>

              {/* Footer Note */}
              <p className="text-center text-[9px] text-slate-400 dark:text-slate-500">
                Computer-generated document — no physical signature required. {selectedPayslip.companyName || companyName} © {new Date().getFullYear()}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  onClick={() => printPayslipIsolated(selectedPayslip, { companyName: selectedPayslip.companyName || companyName, currency: selectedPayslip.currency || currency })}
                  leftIcon={Printer}
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleDownload(selectedPayslip)}
                  isDisabled={isDownloading === selectedPayslip.id}
                  isLoading={isDownloading === selectedPayslip.id}
                  leftIcon={Download}
                >
                  Download PDF
                </Button>
                <Button variant="secondary" onClick={() => setSelectedPayslip(null)} leftIcon={X}>Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Enhanced AI Insights Modal ── */}
      <CenterModal isOpen={showInsightsModal} onClose={() => setShowInsightsModal(false)} title="✨ AI Payroll Insights" maxWidth="max-w-2xl">
        <div className="px-5 sm:px-8 pb-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none">

          {/* Loading / Analyzing */}
          {analyzing && <AnalysisPhase phase={analysisPhase} />}

          {/* Error */}
          {!analyzing && aiError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">AI Service Unavailable</h4>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{aiError}</p>
                </div>
              </div>
              <Button variant="danger" onClick={handleAIInsights}>Retry Analysis</Button>
            </div>
          )}

          {/* Content */}
          {!analyzing && !aiError && insightsContent && (
            <div className="space-y-4">

              {/* Financial Health Score (if netPay available) */}
              {insightsContent.netPay != null && insightsContent.netPay > 0 && (
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-200">AI Net Pay Estimate</p>
                      <p className="text-3xl font-black mt-1">{formatCurrency(insightsContent.netPay)}</p>
                      <p className="text-xs text-primary-200 mt-1">Based on latest payroll analysis</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                        <Star size={22} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-primary-200 mt-1">AI Calc</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {insightsContent.summary && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} className="text-primary-500 shrink-0" />
                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Compensation Overview</p>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{insightsContent.summary}</p>
                </div>
              )}

              {/* Earnings Breakdown */}
              {insightsContent.earnings?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Banknote size={12} /> Earnings Breakdown
                  </p>
                  <div className="space-y-2">
                    {insightsContent.earnings.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-4 py-2.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions Breakdown */}
              {insightsContent.deductions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Receipt size={12} /> Deductions
                  </p>
                  <div className="space-y-2">
                    {insightsContent.deductions.map((item, i) => (
                      <div key={i} className="flex flex-col bg-rose-50 dark:bg-rose-950/20 rounded-lg px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">−{formatCurrency(item.amount)}</span>
                        </div>
                        {item.explanation && (
                          <p className="text-[10px] text-slate-400 mt-1">{item.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {insightsContent.insights?.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-indigo-500 shrink-0" />
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Key Insights</p>
                  </div>
                  <ul className="space-y-2">
                    {insightsContent.insights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {insightsContent.recommendations?.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={14} className="text-blue-500 shrink-0" />
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Recommendations</p>
                  </div>
                  <ul className="space-y-2">
                    {insightsContent.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCheck size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw reply fallback */}
              {insightsContent.reply && !insightsContent.summary && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3">AI Response</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">{insightsContent.reply}</p>
                </div>
              )}

              {/* Follow-up Q&A */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={14} className="text-slate-400 shrink-0" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ask About Your Pay</p>
                </div>
                <form onSubmit={handleFollowUp} className="flex gap-2">
                  <input
                    type="text"
                    value={followUpQuery}
                    onChange={e => setFollowUpQuery(e.target.value)}
                    placeholder="e.g. How can I reduce my tax deductions?"
                    className="flex-1 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                  <Button type="submit" variant="primary" size="sm" isDisabled={followUpLoading || !followUpQuery.trim()} isLoading={followUpLoading} leftIcon={Send}>
                    Ask
                  </Button>
                </form>
                {followUpAnswer && (
                  <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">AI Answer</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{followUpAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 px-5 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="primary" onClick={handleAIInsights} isDisabled={analyzing} isLoading={analyzing} leftIcon={Sparkles}>
            Refresh Analysis
          </Button>
          <Button variant="secondary" onClick={() => setShowInsightsModal(false)}>Close</Button>
        </div>
      </CenterModal>

      {/* ── Salary Increment Request Modal ── */}
      <AnimatePresence>
        {showIncrementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md p-6 my-auto"
            >
              <button
                type="button"
                onClick={() => setShowIncrementModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Request Salary Increment</h2>
                <p className="text-xs text-slate-400 mt-1">Submit your salary revision request to your manager for review.</p>
              </div>

              <form onSubmit={handleIncrementSubmit} className="space-y-4">
                {/* Current CTC (read-only) */}
                {monthlyCTC > 0 && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1">Current Monthly CTC</label>
                    <div className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center text-sm font-bold text-slate-500">
                      {formatCurrency(monthlyCTC)}
                    </div>
                  </div>
                )}

                {/* Requested Salary */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1">
                    Requested Monthly CTC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={incrementForm.requestedSalary}
                    onChange={e => setIncrementForm(f => ({ ...f, requestedSalary: e.target.value }))}
                    placeholder="e.g. 75000"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                  {/* Increment % badge */}
                  {monthlyCTC > 0 && incrementForm.requestedSalary > 0 && (
                    <p className={cn(
                      'text-xs font-bold mt-1.5 px-1',
                      Number(incrementForm.requestedSalary) > monthlyCTC ? 'text-emerald-600' : 'text-rose-500'
                    )}>
                      {Number(incrementForm.requestedSalary) > monthlyCTC
                        ? `+${Math.round(((Number(incrementForm.requestedSalary) - monthlyCTC) / monthlyCTC) * 100)}% increment`
                        : `${Math.round(((Number(incrementForm.requestedSalary) - monthlyCTC) / monthlyCTC) * 100)}% below current`
                      }
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1">
                    Justification / Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={incrementForm.reason}
                    onChange={e => setIncrementForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Describe your contribution, market comparison, or reason for the increment request…"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>

                {/* Effective Date */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 px-1">
                    Desired Effective Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={incrementForm.effectiveDate}
                    onChange={e => setIncrementForm(f => ({ ...f, effectiveDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="secondary" onClick={() => setShowIncrementModal(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" variant="primary" isLoading={incrementLoading} isDisabled={incrementLoading} leftIcon={Send} className="flex-1">Submit Request</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmployeePayroll;

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  X,
  ChevronRight,
  CheckCircle2,
  Download,
  FileText,
  Users,
  DollarSign,
  Clock,
  Gift,
  ShieldCheck,
  Activity,
  Zap,
  Layers,
  Check,
  Sparkles,
  Building2,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { adminAPI } from '../../../utils/apiService';
import { generateReportPDF } from '../../../utils/reportPdfGenerator';
import { cn } from '../../../utils/cn';

const STEPS = ['Select Datasets', 'Configure Parameters', 'Compile & Export'];

const MODULE_OPTIONS = [
  {
    id: 'Workforce Analytics',
    title: 'Workforce & Headcount Analytics',
    description: 'Active employees, job roles, departments, employment types, and account statuses',
    icon: Users,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/60'
  },
  {
    id: 'Financials',
    title: 'Financials & Payroll Distribution',
    description: 'Gross salary disbursements, tax deductions, net payout totals, and payment cycles',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60'
  },
  {
    id: 'Leave & Attendance',
    title: 'Leave, Shifts & Attendance',
    description: 'Configured working shifts, start/end timings, grace intervals, and corporate holidays',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/60'
  },
  {
    id: 'Benefits & Perks',
    title: 'Corporate Benefits & Coverage',
    description: 'Health insurance packages, wellness plans, eligibility tiers, and employer contributions',
    icon: Gift,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/60'
  },
  {
    id: 'Compliance',
    title: 'Compliance Policies & Signatures',
    description: 'Corporate policies, regulatory documents, and employee signed acknowledgment rates',
    icon: ShieldCheck,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/60'
  },
  {
    id: 'System Audit',
    title: 'Security & Audit Traces',
    description: 'Authentication events, administrative actions, client IP logs, and system triggers',
    icon: Activity,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/60'
  },
  {
    id: 'AI Insights',
    title: 'AI Center & Automation Metrics',
    description: 'AI intelligence modules, task execution counts, and autonomous workflow performance',
    icon: Zap,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800/60'
  }
];

const mapCategoryToModules = (cat) => {
  if (!cat || cat === 'custom') return ['Workforce Analytics', 'Financials'];
  const lower = cat.toLowerCase();
  if (lower.includes('workforce') || lower.includes('employee')) return ['Workforce Analytics'];
  if (lower.includes('financial') || lower.includes('payroll')) return ['Financials'];
  if (lower.includes('leave') || lower.includes('attendance') || lower.includes('shift')) return ['Leave & Attendance'];
  if (lower.includes('benefit') || lower.includes('health')) return ['Benefits & Perks'];
  if (lower.includes('compliance') || lower.includes('audit')) return ['Compliance', 'System Audit'];
  if (lower.includes('ai') || lower.includes('productivity')) return ['AI Insights'];
  if (lower.includes('hiring')) return ['Workforce Analytics'];
  return ['Workforce Analytics'];
};

const ReportBuilderWizard = ({ isOpen, onClose, initialCategory = null }) => {
  const adminContext = useAdmin();
  const {
    showToast,
    addCustomReport,
    users = [],
    departments = [],
    payrollList = [],
    benefits = [],
    shifts = [],
    holidays = [],
    policies = [],
    systemLogs = [],
    aiModules = []
  } = adminContext || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState([]);
  const [reportTitle, setReportTitle] = useState('');
  const [isTitleCustomized, setIsTitleCustomized] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [period, setPeriod] = useState('Current Active Cycle (All-Time)');
  const [visualFormat, setVisualFormat] = useState('Executive Summary & Visual Tables');
  const [status, setStatus] = useState('idle');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      const initialMods = mapCategoryToModules(initialCategory);
      setSelectedModules(initialMods);
      setIsTitleCustomized(false);
      setSelectedDept('All Departments');
      setPeriod('Current Active Cycle (All-Time)');
      setVisualFormat('Executive Summary & Visual Tables');
      setStatus('idle');
      setGeneratedReport(null);
      setDownloadingPdf(false);
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (!isTitleCustomized && isOpen) {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (initialCategory && initialCategory !== 'custom') {
        setReportTitle(`${initialCategory} Report - ${dateStr}`);
      } else if (selectedModules.length === 1) {
        setReportTitle(`${selectedModules[0]} Summary - ${dateStr}`);
      } else if (selectedModules.length > 1) {
        setReportTitle(`Multi-Department Enterprise Audit - ${dateStr}`);
      } else {
        setReportTitle(`Custom Executive Report - ${dateStr}`);
      }
    }
  }, [selectedModules, initialCategory, isTitleCustomized, isOpen]);

  const toggleModule = (id) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedModules.length === MODULE_OPTIONS.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(MODULE_OPTIONS.map(m => m.id));
    }
  };

  const handleCompile = async () => {
    if (selectedModules.length === 0) {
      showToast('Please select at least one dataset module.', 'error');
      return;
    }

    setStatus('generating');

    try {
      const estimatedSize = `${(1.2 + selectedModules.length * 0.4).toFixed(1)} MB`;
      const reportPayload = {
        title: reportTitle.trim() || 'Custom Enterprise Report',
        category: initialCategory && initialCategory !== 'custom' ? initialCategory : 'Custom Compiled',
        format: visualFormat,
        modules: selectedModules,
        department: selectedDept,
        period,
        size: estimatedSize,
        status: 'Generated',
        reportType: 'CUSTOM_COMPILED'
      };

      const savedReport = await addCustomReport(reportPayload);
      const finalReport = savedReport || {
        ...reportPayload,
        id: `RPT-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      setGeneratedReport(finalReport);
      setStatus('finished');
      showToast('Custom report compiled and saved to dashboard.');
    } catch (err) {
      console.error('Report compile error:', err);
      setStatus('idle');
      showToast('Error compiling report. Please try again.', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedReport) return;
    setDownloadingPdf(true);
    try {
      const modules = Array.isArray(generatedReport.modules) ? generatedReport.modules : selectedModules;
      const res = await adminAPI.getReportData(modules);
      const realData = res.data?.data || {};
      const filteredUsers = selectedDept === 'All Departments'
        ? (realData.users || users)
        : (realData.users || users).filter(u => u.department === selectedDept || u.employeeProfile?.department?.name === selectedDept);

      generateReportPDF(generatedReport, {
        users: filteredUsers,
        departments: realData.departments || departments,
        payrollList: realData.payrollSnapshots || realData.payslips || payrollList,
        benefits: realData.benefitPlans || benefits,
        shifts,
        holidays,
        policies: realData.policies || policies,
        systemLogs: realData.auditLogs || systemLogs,
        aiModules
      });
      showToast('Official PDF report downloaded successfully');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      try {
        generateReportPDF(generatedReport, {
          users,
          departments,
          payrollList,
          benefits,
          shifts,
          holidays,
          policies,
          systemLogs,
          aiModules
        });
        showToast('PDF report downloaded.');
      } catch (e) {
        showToast('Error downloading PDF report', 'error');
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={status !== 'generating' ? onClose : undefined}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  Custom Report Builder
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Compile cross-module intelligence datasets into customized reports
                </p>
              </div>
            </div>
            {status !== 'generating' && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                id="wizard-close-btn"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/60 shrink-0">
            {STEPS.map((step, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex-1 py-3 px-3 text-center border-b-2 font-bold text-xs uppercase tracking-wider transition-all',
                  currentStep === idx
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : currentStep > idx
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400'
                )}
              >
                <span className="font-mono">{idx + 1}.</span> {step}
              </div>
            ))}
          </div>

          {/* Wizard Content Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* STEP 1: Select Modules */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Select Intelligence Modules to Include
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Check each operational dataset you want aggregated into this report
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    id="wizard-select-all-btn"
                  >
                    {selectedModules.length === MODULE_OPTIONS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {MODULE_OPTIONS.map(mod => {
                    const isSelected = selectedModules.includes(mod.id);
                    const ModIcon = mod.icon;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={cn(
                          'p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 select-none',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-200 dark:hover:border-slate-700'
                        )}
                        id={`module-select-${mod.id.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5', mod.bg, mod.color)}>
                          <ModIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                            {mod.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-0.5 line-clamp-2">
                            {mod.description}
                          </p>
                        </div>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors mt-0.5',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-transparent'
                          )}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Parameters & Configuration */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                    Custom Report Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => {
                      setReportTitle(e.target.value);
                      setIsTitleCustomized(true);
                    }}
                    placeholder="e.g. Q3 Executive Workforce & Compensation Audit"
                    className="input-field h-11 w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                    id="wizard-title-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                      Department Filter
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="input-field h-11 w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                      id="wizard-dept-select"
                    >
                      <option value="All Departments">All Departments (Organization-wide)</option>
                      {departments.map((d, i) => (
                        <option key={i} value={d.name || d}>{d.name || d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                      Reporting Period
                    </label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="input-field h-11 w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                      id="wizard-period-select"
                    >
                      <option value="Current Active Cycle (All-Time)">Current Active Cycle (All-Time)</option>
                      <option value="Q3 2026 (Jul - Sep)">Q3 2026 (Jul - Sep)</option>
                      <option value="Q2 2026 (Apr - Jun)">Q2 2026 (Apr - Jun)</option>
                      <option value="Year-to-Date (YTD 2026)">Year-to-Date (YTD 2026)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                    Visual Presentation Format
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { title: 'Executive Summary & Visual Tables', desc: 'KPI scorecards with detailed structured data tables' },
                      { title: 'Detailed Tabular Dataset Breakdown', desc: 'Dense data rows optimized for record inspection' },
                      { title: 'Comprehensive Multi-Module Audit', desc: 'Full-spectrum deep analytics across all selected areas' },
                    ].map(fmt => (
                      <div
                        key={fmt.title}
                        onClick={() => setVisualFormat(fmt.title)}
                        className={cn(
                          'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between',
                          visualFormat === fmt.title
                            ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-200 dark:hover:border-slate-700'
                        )}
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {fmt.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {fmt.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Compile & Finish */}
            {currentStep === 2 && (
              <div className="py-4 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[280px]">
                {status === 'idle' && (
                  <div className="text-center max-w-md space-y-5 w-full">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-800/60 shadow-xs">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        Ready to Compile Report
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
                        Aggregation engine will compile <strong>{selectedModules.length} dataset modules</strong> for <strong>{selectedDept}</strong>.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 text-left space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Report Name:</span>
                        <span className="font-bold text-slate-800 dark:text-white truncate max-w-[240px]">{reportTitle}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Modules:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedModules.join(', ')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Format:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{visualFormat}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCompile}
                      className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                      id="wizard-compile-btn"
                    >
                      <Sparkles size={16} />
                      <span>Compile & Generate Report</span>
                    </button>
                  </div>
                )}

                {status === 'generating' && (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-14 h-14 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Aggregating Cross-Module Datasets...
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Computing real-time workforce, payroll, and compliance metrics
                      </p>
                    </div>
                  </div>
                )}

                {status === 'finished' && (
                  <div className="text-center space-y-5 max-w-md w-full">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-xs">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {generatedReport?.title || 'Report Compiled Successfully'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
                        Saved to your Organization Reports dashboard and ready for instant PDF export.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleDownloadPDF}
                        disabled={downloadingPdf}
                        className="btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-2 w-full sm:w-auto"
                        id="wizard-download-pdf-btn"
                      >
                        {downloadingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        <span>Download PDF</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="btn-secondary text-xs py-2.5 px-4 w-full sm:w-auto"
                        id="wizard-done-btn"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {status === 'idle' && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex justify-between shrink-0">
              <button
                type="button"
                onClick={() => currentStep > 0 ? setCurrentStep(p => p - 1) : onClose()}
                className="btn-secondary text-xs"
                id="wizard-prev-btn"
              >
                {currentStep > 0 ? 'Back' : 'Cancel'}
              </button>
              {currentStep < 2 && (
                <button
                  type="button"
                  onClick={() => selectedModules.length > 0 && setCurrentStep(p => p + 1)}
                  disabled={selectedModules.length === 0}
                  className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="wizard-next-btn"
                >
                  <span>Next Step</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportBuilderWizard;

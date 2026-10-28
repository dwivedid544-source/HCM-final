import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ShieldCheck,
  Download,
  Search,
  ArrowUpRight,
  Zap,
  Star,
  Target,
  Clock,
  Briefcase,
  FileText,
  Trash2,
  Eye,
  FileCheck,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../context/AdminContext';
import { adminAPI } from '../../utils/apiService';
import { generateReportPDF } from '../../utils/reportPdfGenerator';
import ReportSchedulerModal from './components/ReportSchedulerModal';
import ReportBuilderWizard from './components/ReportBuilderWizard';
import ReportPreviewModal from './components/ReportPreviewModal';
import PageHeader from '../../shared/components/ui/PageHeader';

// Static library categories — these represent available template suites, not DB records
const REPORT_CATEGORIES = [
  {
    title: 'Workforce Analytics',
    icon: Users,
    count: 12,
    color: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    gradient: 'from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900',
    borderColor: 'border-indigo-100 dark:border-indigo-900/40',
    exploreBg: 'group-hover:text-indigo-600'
  },
  {
    title: 'Financial Reports',
    icon: DollarSign,
    count: 8,
    color: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    gradient: 'from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900',
    borderColor: 'border-emerald-100 dark:border-emerald-900/40',
    exploreBg: 'group-hover:text-emerald-600'
  },
  {
    title: 'Hiring Performance',
    icon: Briefcase,
    count: 6,
    color: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    gradient: 'from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-900',
    borderColor: 'border-violet-100 dark:border-violet-900/40',
    exploreBg: 'group-hover:text-violet-600'
  },
  {
    title: 'Compliance Audits',
    icon: ShieldCheck,
    count: 4,
    color: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    gradient: 'from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900',
    borderColor: 'border-rose-100 dark:border-rose-900/40',
    exploreBg: 'group-hover:text-rose-600'
  },
  {
    title: 'Leave & Attendance',
    icon: Clock,
    count: 10,
    color: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    gradient: 'from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900',
    borderColor: 'border-amber-100 dark:border-amber-900/40',
    exploreBg: 'group-hover:text-amber-600'
  },
  {
    title: 'AI & Productivity',
    icon: Target,
    count: 5,
    color: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-950/60',
    gradient: 'from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900',
    borderColor: 'border-cyan-100 dark:border-cyan-900/40',
    exploreBg: 'group-hover:text-cyan-600'
  },
];

const AdminReports = () => {
  const adminContext = useAdmin();
  const {
    customReports = [],
    deleteCustomReport,
    fetchCustomReports,
    reportsLoading,
    showToast,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [builderCategory, setBuilderCategory] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

  // Fetch real org data for PDF generation
  const handleDownloadPDF = async (report) => {
    setPdfLoading(report.id);
    try {
      // Fetch real data from backend for this report's modules
      const modules = Array.isArray(report.modules) ? report.modules : [];
      const res = await adminAPI.getReportData(modules);
      const realData = res.data?.data || {};

      generateReportPDF(report, {
        users: realData.users || users,
        departments: realData.departments || departments,
        payrollList: realData.payrollSnapshots || realData.payslips || payrollList,
        benefits: realData.benefitPlans || benefits,
        shifts,
        holidays,
        policies: realData.policies || policies,
        systemLogs: realData.auditLogs || systemLogs,
        aiModules
      });
      showToast('PDF report downloaded successfully.');
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Fallback to context data
      try {
        generateReportPDF(report, { users, departments, payrollList, benefits, shifts, holidays, policies, systemLogs, aiModules });
        showToast('PDF report downloaded.');
      } catch (e) {
        showToast('Error generating PDF report', 'error');
      }
    } finally {
      setPdfLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteCustomReport(id);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = REPORT_CATEGORIES.filter(cat =>
    cat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ', '
      + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-10 pb-12 animate-fade-in focus:outline-none">

      {/* ── Header ── */}
      <PageHeader
        title="Organization Reports"
        description="Generate deep-dive analytics, export historical data and track multi-dept performance"
        actions={
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSchedulerOpen(true)}
              className="btn-secondary"
              id="scheduling-btn"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Scheduling</span>
            </button>
            <button
              onClick={() => setBuilderCategory('custom')}
              className="btn-primary"
              id="create-custom-report-btn"
            >
              <span>Create Custom Report</span>
            </button>
          </div>
        }
      />

      {/* ── Generated Custom Reports ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Generated Custom Reports
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              {customReports.length}
            </span>
          </div>
          {fetchCustomReports && (
            <button
              onClick={fetchCustomReports}
              disabled={reportsLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh reports"
              id="refresh-reports-btn"
            >
              <RefreshCw size={15} className={reportsLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Loading state */}
        {reportsLoading && customReports.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Loader2 className="mx-auto text-indigo-400 mb-3 animate-spin" size={32} />
            <p className="text-sm font-bold text-slate-500">Loading reports...</p>
          </div>
        )}

        {/* Error state */}
        {fetchError && !reportsLoading && (
          <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-rose-500 shrink-0" size={20} />
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{fetchError}</p>
            <button onClick={fetchCustomReports} className="ml-auto text-xs font-bold text-rose-600 hover:underline">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!reportsLoading && customReports.length === 0 && !fetchError && (
          <div className="p-10 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <FileText className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={40} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No custom reports compiled yet</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
              Click <strong>Create Custom Report</strong> to compile tailored multi-module intelligence reports
            </p>
          </div>
        )}

        {/* Reports grid */}
        {customReports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {customReports.map((report) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                      <FileText size={22} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                        {report.status || 'Generated'}
                      </span>
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={deletingId === report.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Report"
                        id={`delete-report-${report.id}`}
                      >
                        {deletingId === report.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4
                    className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1"
                    title={report.title}
                  >
                    {report.title}
                  </h4>

                  {/* Meta: date & size */}
                  <p className="text-xs text-slate-400 font-medium mb-4">
                    {formatDate(report.createdAt)}
                    {report.size ? ` • ${report.size}` : ''}
                  </p>

                  {/* Module tags */}
                  {Array.isArray(report.modules) && report.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {report.modules.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                      {report.format || 'Full Analytics'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setPreviewReport(report)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        title="View Report Details"
                        id={`view-report-${report.id}`}
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(report)}
                        disabled={pdfLoading === report.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        title="Download PDF"
                        id={`download-report-${report.id}`}
                      >
                        {pdfLoading === report.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Download size={13} />
                        }
                        Download PDF
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Library Categories ── */}
      <div className="space-y-6">
        {/* Section header with search */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Library Categories
          </h3>
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-300 dark:text-slate-600 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
              id="library-search"
            />
          </div>
        </div>

        {/* Category cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setBuilderCategory(cat.title)}
              className={cn(
                'group relative bg-gradient-to-br border cursor-pointer rounded-3xl p-7 hover:shadow-lg transition-all duration-200',
                cat.gradient,
                cat.borderColor
              )}
              id={`category-${cat.title.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
            >
              {/* Top row: icon + template count */}
              <div className="flex items-start justify-between mb-8">
                <div className={cn('p-4 rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3', cat.iconBg, cat.color)}>
                  <cat.icon size={26} />
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {cat.count} Templates
                </span>
              </div>

              {/* Title */}
              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                {cat.title}
              </h4>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 leading-relaxed mb-8">
                Comprehensive datasets and visualizations for organization-wide oversight.
              </p>

              {/* Footer */}
              <div className="pt-5 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between">
                <span className={cn('text-[11px] font-extrabold tracking-wide transition-colors', cat.color, 'opacity-80 group-hover:opacity-100')}>
                  Explore Suite
                </span>
                <div className={cn(
                  'w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 transition-all',
                  'group-hover:border-current group-hover:scale-110',
                  cat.color
                )}>
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCategories.length === 0 && searchTerm && (
          <div className="py-10 text-center text-slate-400">
            <p className="text-sm font-semibold">No categories match "<span className="text-slate-600 dark:text-slate-300">{searchTerm}</span>"</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ReportSchedulerModal isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
      <ReportBuilderWizard
        isOpen={!!builderCategory}
        onClose={() => setBuilderCategory(null)}
        initialCategory={builderCategory !== 'custom' ? builderCategory : null}
      />
      <ReportPreviewModal
        isOpen={!!previewReport}
        onClose={() => setPreviewReport(null)}
        report={previewReport}
      />
    </div>
  );
};

export default AdminReports;

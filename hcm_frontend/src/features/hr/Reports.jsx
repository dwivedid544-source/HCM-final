import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Download, Filter, ArrowUpRight, 
  ArrowDownRight, FileText, Target, 
  ChevronRight, Clock, PieChart, X, User,
  Building2, Users, CheckCircle2, AlertCircle, BarChart3,
  RotateCcw, Loader2, Sparkles, DollarSign, Calendar
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useCurrency } from '../../hooks/useCurrency';
import StatCard from '../../shared/components/ui/StatCard';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import PageHeader from '../../shared/components/ui/PageHeader';

const Reports = () => {
  const { formatCurrency } = useCurrency();
  const { reports, fetchReports, showToast, employees } = useHR();
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceView, setPerformanceView] = useState('weekly'); // 'daily' | 'weekly'

  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [dept, setDept] = useState('');
  const [recruiter, setRecruiter] = useState('');

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchReports({ dateRange, department: dept, recruiter });
      showToast('Reports refreshed with live database metrics', 'success');
    } catch (err) {
      console.error('Failed to refresh reports:', err);
      showToast('Failed to refresh reports', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Process raw top KPI stats
  const stats = useMemo(() => {
    const raw = reports?.stats || [
      { label: 'Avg Time to Hire', value: '0 Days', trend: '0 days', isPositive: true },
      { label: 'Application Rate', value: '0%', trend: '0 apps', isPositive: true },
      { label: 'Cost Per Hire', value: '$0', trend: '$0.00', isPositive: true },
      { label: 'Recruiter Score', value: '0.0', trend: '0 reviews', isPositive: true },
    ];

    return raw.map((stat, idx) => {
      let displayValue = stat.value;
      if (stat.label === 'Cost Per Hire') {
        const valMatch = String(stat.value).match(/[\d,.]+/);
        if (valMatch) {
          const valNum = parseFloat(valMatch[0].replace(/,/g, ''));
          displayValue = formatCurrency(valNum);
        }
      }

      const configs = [
        { 
          icon: Clock, 
          color: 'text-indigo-600 dark:text-indigo-400', 
          bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          sub: 'Average hiring turnaround'
        },
        { 
          icon: TrendingUp, 
          color: 'text-emerald-600 dark:text-emerald-400', 
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          sub: 'Application-to-job ratio'
        },
        { 
          icon: DollarSign, 
          color: 'text-amber-600 dark:text-amber-400', 
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          sub: 'Estimated cost per hire'
        },
        { 
          icon: Target, 
          color: 'text-primary-600 dark:text-primary-400', 
          bg: 'bg-primary-50 dark:bg-primary-950/30',
          sub: 'Rated interview score (out of 5.0)'
        },
      ];

      const config = configs[idx] || configs[0];

      return {
        label: stat.label,
        value: displayValue,
        trend: stat.trend,
        isPositive: stat.isPositive,
        ...config
      };
    });
  }, [reports, formatCurrency]);

  const chartData = useMemo(() => {
    return performanceView === 'daily' 
      ? (reports?.dailyPerformance || [])
      : (reports?.weeklyPerformance || []);
  }, [performanceView, reports]);

  const totalChartApps = useMemo(() => {
    return chartData.reduce((acc, d) => acc + (d.apps || 0), 0);
  }, [chartData]);

  const maxApps = useMemo(() => {
    return Math.max(...chartData.map(d => d.apps || 0), 1);
  }, [chartData]);

  const scale = 180 / maxApps;

  const sources = useMemo(() => {
    return reports?.sources || [
      { label: 'LinkedIn', value: 0, count: 0, color: 'bg-blue-500' },
      { label: 'Direct Referrals', value: 0, count: 0, color: 'bg-emerald-500' },
      { label: 'Indeed', value: 0, count: 0, color: 'bg-indigo-500' },
      { label: 'Company Portal', value: 0, count: 0, color: 'bg-amber-500' },
    ];
  }, [reports]);

  const recruiterEfficiency = useMemo(() => {
    return reports?.recruiterEfficiency || [];
  }, [reports]);

  // Dynamic filter lists from backend or context
  const availableDepts = reports?.filterOptions?.departments?.length > 0 
    ? reports.filterOptions.departments 
    : ['Engineering', 'Sales', 'Product', 'Marketing', 'Human Resources', 'Finance'];

  const availableRecruiters = reports?.filterOptions?.recruiters?.length > 0
    ? reports.filterOptions.recruiters
    : (employees || []).map(e => e.fullName || e.name || 'Recruiter');

  const topSource = useMemo(() => {
    const activeSources = sources.filter(s => s.value > 0);
    return activeSources.length > 0 
      ? [...activeSources].sort((a, b) => b.value - a.value)[0] 
      : null;
  }, [sources]);

  const applyFilters = (e) => {
    e.preventDefault();
    fetchReports({ dateRange, department: dept, recruiter });
    setIsFilterModalOpen(false);
    showToast('Advanced filters applied', 'success');
  };

  const handleResetFilters = () => {
    setDateRange('Last 30 Days');
    setDept('');
    setRecruiter('');
    fetchReports({});
    setIsFilterModalOpen(false);
    showToast('Filters reset to default', 'info');
  };

  const downloadFullReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== HCM HR ANALYTICS & RECRUITMENT REPORT ===\n\n";
    
    csvContent += "TOP METRICS\n";
    stats.forEach(s => {
      csvContent += `"${s.label}","${s.value}","${s.trend}"\n`;
    });
    csvContent += "\n";

    csvContent += "CANDIDATE SOURCES\n";
    sources.forEach(src => {
      csvContent += `"${src.label}","${src.value}%","${src.count || 0} Candidates"\n`;
    });
    csvContent += "\n";

    csvContent += "RECRUITER EFFICIENCY\n";
    csvContent += "Recruiter Name,Open Roles,Total Apps,Interviews,Avg Days-to-Offer,Performance Score\n";
    recruiterEfficiency.forEach(r => {
      csvContent += `"${r.name}","${r.roles}","${r.apps}","${r.interviews}","${r.tto} Days","${r.score}%"\n`;
    });
    csvContent += "\n";

    if (reports?.lifecycleMetrics) {
      csvContent += "EMPLOYEE LIFECYCLE METRICS\n";
      csvContent += `Offer Acceptance Rate,${reports.lifecycleMetrics.offerAcceptanceRate}%\n`;
      csvContent += `Candidate Conversion,${reports.lifecycleMetrics.candidateConversion}%\n`;
      csvContent += `Attrition Rate,${reports.lifecycleMetrics.attritionRate}%\n`;
      csvContent += `Average Onboarding Time,${reports.lifecycleMetrics.avgOnboardingTime} Days\n`;
      csvContent += `Average Probation Time,${reports.lifecycleMetrics.avgProbationTime} Days\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hr_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Complete analytics report downloaded as CSV', 'success');
  };

  const exportRecruiterEfficiencyCSV = () => {
    const headers = ['Recruiter Name', 'Open Roles', 'Total Apps', 'Interviews', 'Avg Turnaround (Days)', 'Performance Score'];
    const rows = recruiterEfficiency.map(r => [
      `"${r.name}"`,
      `"${r.roles}"`,
      `"${r.apps}"`,
      `"${r.interviews}"`,
      `"${r.tto}"`,
      `"${r.score}%"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `recruiter_efficiency_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Recruiter efficiency report exported', 'success');
  };

  const hasActiveFilters = dept !== '' || recruiter !== '' || dateRange !== 'Last 30 Days';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Reports & Analytics"
        description="Deep dive into hiring performance, recruiter efficiency, and company metrics"
        actions={
          <>
            {/* Standardized Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0 disabled:opacity-50"
              title="Refresh analytics data"
            >
              <RotateCcw size={16} className={cn(isRefreshing && "animate-spin text-primary-600")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Standardized Advanced Filters Button */}
            <button 
              type="button"
              onClick={() => setIsFilterModalOpen(true)} 
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
            >
              <Filter size={16} />
              <span>Advanced Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary-600" />
              )}
            </button>

            {/* Standardized Download Report Button */}
            <button 
              type="button"
              onClick={downloadFullReport}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
            >
              <Download size={16} />
              <span>Download Report</span>
            </button>
          </>
        }
      />

      {/* ── Top Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            color={stat.color}
            bg={stat.bg}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* ── Charts Row (Application Performance & Sources) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Application Performance Bar Chart */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Application Performance</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Activity comparison over {dateRange}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Applications</span>
                </div>

                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setPerformanceView('daily')} 
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
                      performanceView === 'daily' 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Daily
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPerformanceView('weekly')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
                      performanceView === 'weekly' 
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold" 
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    Weekly
                  </button>
                </div>
              </div>
            </div>

            {/* Bars Area */}
            <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 min-h-[200px] pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              {chartData.map((d, i) => {
                const barHeight = d.apps > 0 ? Math.max(d.apps * scale, 12) : 4;
                const isZero = (d.apps || 0) === 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full relative flex items-end justify-center cursor-pointer h-full pb-1">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: `${barHeight}px` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                          "w-full max-w-[36px] rounded-t-md transition-all",
                          isZero 
                            ? "bg-slate-200 dark:bg-slate-800" 
                            : "bg-primary-600 hover:bg-primary-700 shadow-xs"
                        )}
                      >
                        {d.hires > 0 && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: `${Math.max(d.hires * scale, 6)}px` }}
                            className="w-full bg-emerald-500 rounded-t-md"
                          />
                        )}
                      </motion.div>

                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-lg">
                        {d.apps || 0} Apps {d.hires > 0 ? `• ${d.hires} Hired` : ''}
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[50px]">
                      {d.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {totalChartApps === 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-400">No applications recorded in this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Sources & Insight Banner */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <PieChart size={18} className="text-primary-600" />
                <span>Candidate Sources</span>
              </h3>
              
              <div className="space-y-4">
                {sources.map((src, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {src.label}
                      </span>
                      <span className="text-slate-900 dark:text-white font-extrabold">
                        {src.value}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${src.value}%` }} 
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn("h-full rounded-full transition-opacity", src.color || 'bg-primary-600')} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Insight Box */}
            <div className="mt-6 p-4 sm:p-5 bg-slate-900 dark:bg-slate-950 rounded-xl text-white relative overflow-hidden border border-slate-800 shadow-md">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <TrendingUp size={60} />
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary-400 mb-1">Recruitment Insight</h4>
              <p className="text-xs font-medium leading-relaxed mb-3 text-slate-200">
                {topSource && topSource.value > 0 
                  ? `${topSource.label} currently drives ${topSource.value}% of inbound applicant interest.`
                  : 'Direct applicant channels & referrals generate higher retention than traditional job boards.'}
              </p>

              <button 
                type="button"
                onClick={() => setIsInsightModalOpen(true)}
                className="text-xs font-bold text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Explore Analysis</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recruiter Efficiency Report Table ── */}
      <div className="card p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Recruiter Efficiency Report</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Performance, workload, and interview turnaround velocity</p>
          </div>

          <button 
            type="button"
            onClick={exportRecruiterEfficiencyCSV}
            className="h-9 px-3 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Export CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto min-w-[750px]">
          <table className="hcm-table">
            <thead className="hcm-thead">
              <tr className="hcm-tr">
                <th className="hcm-th min-w-[200px]">Recruiter Name</th>
                <th className="hcm-th text-center min-w-[110px]">Open Roles</th>
                <th className="hcm-th text-center min-w-[110px]">Total Apps</th>
                <th className="hcm-th text-center min-w-[110px]">Interviews</th>
                <th className="hcm-th text-center min-w-[130px]">Avg Turnaround</th>
                <th className="hcm-th text-right min-w-[150px] pr-6">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recruiterEfficiency.map((r, i) => (
                <tr key={i} className="hcm-tr">
                  <td className="hcm-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-extrabold text-xs">
                        {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{r.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Recruitment Specialist</p>
                      </div>
                    </div>
                  </td>
                  <td className="hcm-td text-center font-semibold text-slate-700 dark:text-slate-300">
                    {r.roles}
                  </td>
                  <td className="hcm-td text-center font-semibold text-slate-700 dark:text-slate-300">
                    {r.apps}
                  </td>
                  <td className="hcm-td text-center font-semibold text-slate-700 dark:text-slate-300">
                    {r.interviews}
                  </td>
                  <td className="hcm-td text-center whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                    {r.tto > 0 ? `${r.tto} Days` : '—'}
                  </td>
                  <td className="hcm-td text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn(
                        "text-xs font-black",
                        r.score >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
                        r.score >= 50 ? "text-primary-600 dark:text-primary-400" : 
                        r.score > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                      )}>
                        {r.score > 0 ? `${r.score}%` : '0%'}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            r.score >= 80 ? "bg-emerald-500" : 
                            r.score >= 50 ? "bg-primary-500" : 
                            r.score > 0 ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                          )}
                          style={{ width: `${Math.max(r.score, 0)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {recruiterEfficiency.length === 0 && (
                <tr className="hcm-tr">
                  <td colSpan="6" className="hcm-td py-12 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No recruiter evaluation records found</p>
                    <p className="text-xs text-slate-400 mt-1">Schedule and conduct interviews to populate efficiency statistics</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Employee Lifecycle Dashboard Section ── */}
      {reports?.lifecycleMetrics && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">Employee Lifecycle Metrics</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">End-to-end recruitment conversion, retention, and departmental growth</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversion Metrics */}
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Conversion Rates</h3>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Offer Acceptance Rate</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{reports.lifecycleMetrics.offerAcceptanceRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${reports.lifecycleMetrics.offerAcceptanceRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Candidate Conversion</span>
                    <span className="text-primary-600 dark:text-primary-400 font-extrabold">{reports.lifecycleMetrics.candidateConversion}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 transition-all rounded-full" style={{ width: `${reports.lifecycleMetrics.candidateConversion}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Attrition Rate</span>
                    <span className="text-rose-600 dark:text-rose-400 font-extrabold">{reports.lifecycleMetrics.attritionRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 transition-all rounded-full" style={{ width: `${Math.min(100, reports.lifecycleMetrics.attritionRate * 5)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Average Timelines */}
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Average Timelines</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Onboarding</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {reports.lifecycleMetrics.avgOnboardingTime > 0 ? `${reports.lifecycleMetrics.avgOnboardingTime} Days` : '0 Days'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Average duration</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Probation</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {reports.lifecycleMetrics.avgProbationTime > 0 ? `${reports.lifecycleMetrics.avgProbationTime} Days` : '0 Days'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Evaluation period</p>
                </div>
              </div>
            </div>

            {/* Primary Exit Reasons */}
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Primary Exit Reasons</h3>
              <div className="space-y-2.5">
                {reports.lifecycleMetrics.exitReasons && reports.lifecycleMetrics.exitReasons.length > 0 ? (
                  reports.lifecycleMetrics.exitReasons.map((reason, idx) => {
                    const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-indigo-500'];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", colors[idx % colors.length])} />
                          <span className="truncate max-w-[140px]">{reason.reason}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{reason.count} cases</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center gap-1 text-slate-400">
                    <CheckCircle2 size={22} className="text-emerald-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Zero active exit notices</span>
                    <span className="text-[10px] text-slate-400">No employee departures recorded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Departmental Growth & Recruitment Funnel Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Departmental Growth</h3>
              <div className="space-y-3">
                {reports.lifecycleMetrics.departmentHiring && reports.lifecycleMetrics.departmentHiring.length > 0 ? (
                  reports.lifecycleMetrics.departmentHiring.map((deptItem, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{deptItem.department}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{deptItem.hires} members</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(5, (deptItem.hires / 10) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No department headcount records available</p>
                )}
              </div>
            </div>

            <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recruitment Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                {Object.entries(reports.lifecycleMetrics.funnel || {}).map(([stage, count], idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1 truncate">{stage}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Advanced Filters Modal ── */}
      <CenterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Advanced Analytics Filters"
      >
        <form onSubmit={applyFilters} className="p-6 sm:p-8 space-y-5 text-left bg-white dark:bg-slate-900">
          <div className="space-y-1.5 text-left">
            <label className="form-label text-xs font-bold block">Date Range</label>
            <select
              className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="Last 7 Days" className="dark:bg-slate-900">Last 7 Days</option>
              <option value="Last 30 Days" className="dark:bg-slate-900">Last 30 Days</option>
              <option value="This Quarter" className="dark:bg-slate-900">This Quarter</option>
              <option value="This Year" className="dark:bg-slate-900">This Year</option>
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="form-label text-xs font-bold block">Department</label>
            <select
              className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option value="" className="dark:bg-slate-900">All Departments</option>
              {availableDepts.map((d, i) => (
                <option key={i} value={d} className="dark:bg-slate-900">{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="form-label text-xs font-bold block">Recruiter / Interviewer</label>
            <select
              className="input-field h-11 font-bold text-sm w-full cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-field"
              value={recruiter}
              onChange={(e) => setRecruiter(e.target.value)}
            >
              <option value="" className="dark:bg-slate-900">All Recruiters</option>
              {availableRecruiters.map((r, i) => (
                <option key={i} value={r} className="dark:bg-slate-900">{r}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
              onClick={handleResetFilters}
            >
              Reset All
            </button>
            <button
              type="button"
              className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer flex-1 sm:flex-none"
              onClick={() => setIsFilterModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer flex-1 sm:flex-none"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </CenterModal>

      {/* ── Insight Details Modal ── */}
      <CenterModal
        isOpen={isInsightModalOpen}
        onClose={() => setIsInsightModalOpen(false)}
        title="Talent Acquisition Insight & Strategy"
      >
        <div className="p-6 sm:p-8 space-y-5 text-left bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300">
            <TrendingUp size={24} className="shrink-0" />
            <div>
              <p className="text-xs font-extrabold">Channel Velocity Optimization</p>
              <p className="text-[11px] leading-relaxed mt-0.5">
                Direct referrals and company portal applicants convert 2.4x faster from interview stage to offer acceptance.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-slate-600 dark:text-slate-300 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Strategic Recommendations</h4>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
              <li>Optimize job posts on top-performing recruitment channels to decrease overall time-to-hire.</li>
              <li>Incentivize team-wide candidate referrals with streamlined referral tracking.</li>
              <li>Monitor recruiter interview turnaround times to prevent top candidate drop-offs.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              type="button"
              onClick={() => setIsInsightModalOpen(false)}
              className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-bold inline-flex items-center justify-center transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default Reports;

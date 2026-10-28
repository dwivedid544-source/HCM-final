import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  BadgeCheck, 
  Plus, 
  Download, 
  Search, 
  ExternalLink,
  Video,
  Sparkles,
  Filter,
  BarChart3,
  ChevronRight,
  UserPlus,
  Send,
  CalendarCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';
import { employeeAPI } from '../../utils/apiService';

const HRDashboard = () => {
  const { 
    jobs = [], 
    candidates = [], 
    interviews = [], 
    employees = [], 
    loading: contextLoading = false,
    refetch, 
    showToast 
  } = useHR();
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchHolidays = async () => {
      try {
        setLoadingHolidays(true);
        const res = await employeeAPI.getHolidays();
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          setHolidays(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load holidays in HR dashboard:', err);
      } finally {
        if (isMounted) setLoadingHolidays(false);
      }
    };
    fetchHolidays();
    return () => { isMounted = false; };
  }, []);

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (holidays || [])
      .filter(h => {
        if (!h.date) return false;
        const d = new Date(h.date);
        return !isNaN(d.getTime()) && d >= today;
      })
      .slice(0, 3);
  }, [holidays]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setFetchError(null);
    try {
      if (refetch) {
        await refetch();
      }
      showToast('Dashboard data refreshed successfully', 'success');
    } catch (err) {
      console.error('Failed to reload dashboard data:', err);
      setFetchError(err?.response?.data?.message || err?.message || 'Failed to refresh data from server.');
      showToast('Failed to refresh dashboard data', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExportReport = () => {
    setIsExporting(true);
    showToast('Compiling recruitment metrics...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Candidate Name', 'Email', 'Applied Role', 'Current Stage', 'AI Match Score', 'Date Applied'];
        const rows = candidates.map(c => [
          `"${(c.name || 'Candidate').replace(/"/g, '""')}"`,
          `"${(c.email || 'N/A').replace(/"/g, '""')}"`,
          `"${(c.role || 'N/A').replace(/"/g, '""')}"`,
          `"${(c.stage || 'Applied').replace(/"/g, '""')}"`,
          `"${c.match !== null && c.match !== undefined ? c.match + '%' : 'N/A'}"`,
          `"${(c.appliedDate || c.date || 'N/A').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `recruitment_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('HR Recruitment Report exported successfully!', 'success');
      } catch (err) {
        console.error('Export error:', err);
        showToast('Error exporting HR report', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  // 100% Dynamic Metrics Calculations
  const openJobsCount = useMemo(() => {
    return jobs.filter(j => j.status === 'Published' || j.status === 'PUBLISHED' || j.isActive === true).length;
  }, [jobs]);
  
  const newApplicantsCount = useMemo(() => {
    return candidates.filter(c => {
      const appliedDate = c.appliedDate || c.date || c.submittedAt;
      if (!appliedDate) return false;
      const parsed = new Date(appliedDate).getTime();
      return !isNaN(parsed) && parsed > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length;
  }, [candidates]);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const todayInterviewsList = useMemo(() => {
    return interviews.filter(i => {
      const itemDate = i.rawDate || (i.dateTime ? i.dateTime.split('T')[0] : (typeof i.date === 'string' && i.date.length >= 10 ? i.date.slice(0, 10) : ''));
      return itemDate === todayStr;
    });
  }, [interviews, todayStr]);
  
  const todayInterviewsCount = todayInterviewsList.length;

  const hiresThisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const employeeHires = employees.filter(e => {
      const dateVal = e.joiningDate || e.createdAt;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const candidateHires = candidates.filter(c => {
      if ((c.stage || '').toLowerCase() !== 'hired') return false;
      const dateVal = c.submittedAt || c.appliedDate || c.date;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return Math.max(employeeHires, candidateHires);
  }, [employees, candidates]);

  const stats = useMemo(() => [
    { 
      label: 'Open Jobs', 
      value: openJobsCount, 
      trend: openJobsCount > 0 ? `${openJobsCount} Active Published` : 'No active openings', 
      trendPct: openJobsCount > 0 ? `+${openJobsCount}` : '0', 
      icon: Briefcase, 
      color: 'blue', 
      bg: 'bg-blue-50 dark:bg-blue-950/30', 
      iconColor: 'text-blue-600 dark:text-blue-400', 
      trendColor: 'text-blue-500 dark:text-blue-400',
      onClick: () => navigate('/hr/jobs')
    },
    { 
      label: 'New Applicants', 
      value: candidates.length, 
      trend: newApplicantsCount > 0 ? `+${newApplicantsCount} this week` : candidates.length > 0 ? `${candidates.length} total candidates` : 'No applicants yet', 
      trendPct: newApplicantsCount > 0 ? `+${newApplicantsCount}` : '0', 
      icon: Users, 
      color: 'purple', 
      bg: 'bg-purple-50 dark:bg-purple-950/30', 
      iconColor: 'text-purple-600 dark:text-purple-400', 
      trendColor: 'text-purple-500 dark:text-purple-400',
      onClick: () => navigate('/hr/candidates')
    },
    { 
      label: 'Interviews Today', 
      value: todayInterviewsCount, 
      trend: todayInterviewsCount > 0 ? `${todayInterviewsCount} scheduled today` : 'None scheduled today', 
      trendPct: todayInterviewsCount > 0 ? `${todayInterviewsCount}` : '0', 
      icon: CalendarCheck, 
      color: 'green', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
      iconColor: 'text-emerald-600 dark:text-emerald-400', 
      trendColor: 'text-emerald-500 dark:text-emerald-400',
      onClick: () => navigate('/hr/interviews')
    },
    { 
      label: 'Hires This Month', 
      value: hiresThisMonthCount, 
      trend: hiresThisMonthCount > 0 ? `+${hiresThisMonthCount} new team members` : '0 new hires this month', 
      trendPct: hiresThisMonthCount > 0 ? `+${hiresThisMonthCount}` : '0', 
      icon: BadgeCheck, 
      color: 'orange', 
      bg: 'bg-orange-50 dark:bg-orange-950/30', 
      iconColor: 'text-orange-600 dark:text-orange-400', 
      trendColor: 'text-orange-500 dark:text-orange-400',
      onClick: () => navigate('/hr/onboarding')
    },
  ], [openJobsCount, candidates.length, newApplicantsCount, todayInterviewsCount, hiresThisMonthCount, navigate]);

  const funnelSteps = useMemo(() => [
    { label: 'Applied', count: candidates.filter(c => (c.stage || '').toLowerCase() === 'applied').length, route: '/hr/candidates' },
    { label: 'Screening', count: candidates.filter(c => (c.stage || '').toLowerCase() === 'screening').length, route: '/hr/pipeline' },
    { label: 'Shortlisted', count: candidates.filter(c => (c.stage || '').toLowerCase() === 'shortlisted').length, route: '/hr/pipeline' },
    { label: 'Interview', count: candidates.filter(c => (c.stage || '').toLowerCase().includes('interview')).length, route: '/hr/interviews' },
    { label: 'Offer', count: candidates.filter(c => (c.stage || '').toLowerCase().includes('offer')).length, route: '/hr/offers' },
    { label: 'Hired', count: candidates.filter(c => (c.stage || '').toLowerCase() === 'hired').length, route: '/hr/onboarding' },
  ], [candidates]);

  const recentApplicants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return candidates
      .filter(c => {
        if (!q) return true;
        return (c.name || '').toLowerCase().includes(q) || 
               (c.role || '').toLowerCase().includes(q) || 
               (c.email || '').toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map(c => {
        const rawName = c.name || 'Candidate';
        const parts = rawName.split(' ').filter(Boolean);
        const initials = parts.length > 1 
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : rawName.slice(0, 2).toUpperCase();
        return {
          ...c,
          exp: c.exp || c.experience || 'Not specified',
          initials,
          img: c.avatar || c.avatarUrl || ''
        };
      });
  }, [candidates, searchTerm]);

  const todaysInterviews = useMemo(() => {
    return todayInterviewsList
      .slice(0, 3)
      .map(i => {
        const name = i.candidate || i.candidateName || 'Candidate';
        const parts = name.split(' ').filter(Boolean);
        const initials = parts.length > 1 
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();
        return {
          ...i,
          name,
          initials,
          img: i.img || i.avatar || ''
        };
      });
  }, [todayInterviewsList]);

  // Dynamic satisfaction & time to hire metrics
  const ratedInterviews = useMemo(() => {
    return interviews.filter(i => i.rating !== null && i.rating !== undefined && !isNaN(Number(i.rating)));
  }, [interviews]);

  const avgRating = useMemo(() => {
    return ratedInterviews.length > 0 
      ? ratedInterviews.reduce((sum, i) => sum + Number(i.rating), 0) / ratedInterviews.length 
      : 0;
  }, [ratedInterviews]);

  const candidateExperiencePct = avgRating > 0 ? Math.min(100, Math.round((avgRating / 5) * 100)) : 0;

  const hiredCandidates = useMemo(() => {
    return candidates.filter(c => (c.stage || '').toLowerCase() === 'hired' && (c.appliedDate || c.date || c.submittedAt));
  }, [candidates]);

  const avgTimeToHire = useMemo(() => {
    if (hiredCandidates.length === 0) return 0;

    const totalDays = hiredCandidates.reduce((sum, c) => {
      const applyDateVal = c.submittedAt || c.appliedDate || c.date;
      const applyTime = new Date(applyDateVal).getTime();
      if (isNaN(applyTime)) return sum + 14;

      // Match employee by email or name to obtain true hire/joining timestamp
      const matchedEmp = employees.find(e => 
        (c.email && e.email && c.email.toLowerCase() === e.email.toLowerCase()) ||
        (c.name && e.fullName && c.name.toLowerCase() === e.fullName.toLowerCase())
      );

      const hireDateVal = matchedEmp?.joiningDate || matchedEmp?.createdAt || c.updatedAt;
      if (hireDateVal) {
        const hireTime = new Date(hireDateVal).getTime();
        if (!isNaN(hireTime) && hireTime >= applyTime) {
          const diffDays = Math.round((hireTime - applyTime) / (1000 * 60 * 60 * 24));
          return sum + Math.max(1, diffDays);
        }
      }

      return sum + 14;
    }, 0);

    return Math.max(1, Math.round(totalDays / hiredCandidates.length));
  }, [hiredCandidates, employees]);

  // Render Error State if API fails
  if (fetchError) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in text-left">
        <div className="card p-8 sm:p-12 text-center rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Dashboard Data</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{fetchError}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* Header Section */}
      <PageHeader
        title="HR Dashboard"
        description="Monitor recruitment pipeline, candidate activity, and talent operations"
        actions={
          <>
            <button 
              type="button"
              onClick={handleExportReport} 
              disabled={isExporting}
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin text-slate-500" /> : <Download size={16} className="text-slate-500" />}
              <span>Export Report</span>
            </button>
            <button 
              type="button"
              onClick={() => navigate('/hr/jobs', { state: { openCreate: true } })}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
            >
               <Plus size={16} />
               <span>Create Job Post</span>
            </button>
          </>
        }
      />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.trend}
            trendPct={stat.trendPct}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Left Column (Span 8): Hiring Pipeline & Recent Applicants */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6 min-w-0">
           
           {/* Hiring Pipeline Funnel */}
           <div className="card p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                 <h3 className="hcm-section-heading flex items-center gap-2 text-base sm:text-lg">
                    <Filter className="text-primary-600 dark:text-primary-400" size={18} />
                    <span>Hiring Pipeline</span>
                 </h3>
                  <button 
                     type="button"
                     onClick={() => navigate('/hr/pipeline')}
                     className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 cursor-pointer transition-colors select-none"
                  >
                     <span>Full Funnel</span>
                     <ChevronRight size={14} />
                  </button>
               </div>
               
               <div className="overflow-x-auto pb-1 scrollbar-hide">
                  <div className="flex items-center min-w-max gap-2 lg:gap-3 px-0.5">
                     {funnelSteps.map((step, i) => (
                        <React.Fragment key={i}>
                           <div 
                             onClick={() => navigate(step.route)}
                             className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:border-primary-200 dark:hover:border-primary-800 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group flex-1 min-w-[95px] sm:min-w-[105px] text-center select-none active:scale-98"
                           >
                              <p className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 uppercase mb-1 transition-colors">{step.label}</p>
                              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{step.count}</h4>
                           </div>
                          {i < funnelSteps.length - 1 && (
                             <div className="text-slate-300 dark:text-slate-700 shrink-0 select-none">
                                <ChevronRight size={16} />
                             </div>
                          )}
                       </React.Fragment>
                    ))}
                 </div>
              </div>
           </div>

           {/* Recent Applicants Table */}
           <div className="card p-0 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 gap-3">
                 <div>
                   <h3 className="hcm-section-heading text-base sm:text-lg">Recent Applicants</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Candidates who recently applied across all openings</p>
                 </div>
                 <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" size={15} />
                    <input 
                      type="text" 
                      placeholder="Search applicants..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="hcm-table min-w-[580px]">
                    <thead className="hcm-thead">
                       <tr className="hcm-tr">
                          <th className="hcm-th text-left">Candidate</th>
                          <th className="hcm-th text-left">Applied Role</th>
                          <th className="hcm-th text-center">AI Match</th>
                          <th className="hcm-th text-left">Status</th>
                          <th className="hcm-th text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentApplicants.length > 0 ? (
                           recentApplicants.map((app, i) => (
                            <tr 
                               key={app.id || i}
                               onClick={() => navigate('/hr/candidates', { state: { search: app.name } })}
                               className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                               <td className="hcm-td">
                                  <div className="flex items-center gap-3">
                                     {app.img && !app.img.includes('ui-avatars.com') ? (
                                       <img src={app.img} alt={app.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                                     ) : (
                                       <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                         {app.initials || 'CA'}
                                       </div>
                                     )}
                                     <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{app.name}</p>
                                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">{app.exp}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="hcm-td">
                                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{app.role}</p>
                               </td>
                               <td className="hcm-td">
                                  <div className="flex flex-col items-center gap-1">
                                     <div className="flex items-center justify-center min-w-[44px] px-2 py-0.5 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30">
                                       {app.match !== null && app.match !== undefined ? `${app.match}%` : '0%'}
                                     </div>
                                     <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                          className={cn(
                                            "h-full rounded-full transition-all", 
                                            (app.match || 0) >= 80 ? "bg-emerald-500" : 
                                            (app.match || 0) >= 50 ? "bg-indigo-500" : "bg-slate-400"
                                          )} 
                                          style={{ width: `${Math.max(4, app.match || 0)}%` }} 
                                        />
                                     </div>
                                  </div>
                               </td>
                               <td className="hcm-td">
                                  <span className={cn(
                                     "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block whitespace-nowrap",
                                     app.stage === 'Interview' || app.stage === 'INTERVIEWING' ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40" :
                                     app.stage === 'Shortlisted' || app.stage === 'SHORTLISTED' ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40" :
                                     app.stage === 'Screening' || app.stage === 'SCREENING' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40" : 
                                     app.stage === 'Offer' || app.stage === 'OFFERED' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40" :
                                     app.stage === 'Hired' || app.stage === 'HIRED' ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/40" :
                                     app.stage === 'Rejected' || app.stage === 'REJECTED' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40" :
                                     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                  )}>
                                     {app.stage || 'Applied'}
                                  </span>
                               </td>
                               <td className="hcm-td text-right" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                      type="button"
                                      onClick={() => navigate('/hr/candidates', { state: { search: app.name } })}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none inline-flex items-center justify-center"
                                      title="View Candidate Profile"
                                  >
                                     <ExternalLink size={16} />
                                  </button>
                                </td>
                            </tr>
                           ))
                        ) : (
                           <tr className="hcm-tr">
                              <td colSpan="5" className="py-10 sm:py-12 text-center text-slate-400 dark:text-slate-500 hcm-td">
                                 <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                 <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No candidate applications found.</p>
                                 <p className="text-[11px] text-slate-400 mt-1">Applications submitted to your published jobs will appear here in real time.</p>
                               </td>
                           </tr>
                        )}
                    </tbody>
                 </table>
              </div>
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
                 <button 
                    type="button"
                    onClick={() => navigate('/hr/candidates')}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer inline-flex items-center gap-1 transition-colors select-none"
                 >
                   <span>View All Candidates</span>
                   <ChevronRight size={14} />
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column (Span 4): Quick Actions, Today's Interviews & Weekly Highlights */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6 min-w-0">
           
           {/* Quick Actions Panel */}
           <div className="card p-5 sm:p-6 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <Sparkles size={100} />
              </div>
              <h3 className="text-xs font-bold text-primary-300 dark:text-primary-400 mb-4 uppercase tracking-wider select-none">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                 <button 
                   type="button"
                   onClick={() => navigate('/hr/jobs', { state: { openCreate: true } })} 
                   className="h-11 px-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm border border-primary-500/30 select-none cursor-pointer overflow-hidden truncate"
                 >
                    <Plus size={16} className="shrink-0" />
                    <span className="truncate">Create Job</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => navigate('/hr/candidates', { state: { openCreate: true } })} 
                   className="h-11 px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700/60 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 select-none cursor-pointer overflow-hidden truncate"
                 >
                    <UserPlus size={16} className="shrink-0 text-slate-300" />
                    <span className="truncate">Add Candidate</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => navigate('/hr/interviews', { state: { openCreate: true } })} 
                   className="h-11 px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700/60 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 select-none cursor-pointer overflow-hidden truncate"
                 >
                    <Calendar size={16} className="shrink-0 text-slate-300" />
                    <span className="truncate">Schedule Interview</span>
                 </button>
                 <button 
                   type="button"
                   onClick={() => navigate('/hr/offers', { state: { openCreate: true } })} 
                   className="h-11 px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700/60 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 select-none cursor-pointer overflow-hidden truncate"
                 >
                    <Send size={16} className="shrink-0 text-slate-300" />
                    <span className="truncate">Send Offer</span>
                 </button>
              </div>
           </div>

           {/* Today's Interviews */}
           <div className="card p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="hcm-section-heading text-base sm:text-lg">Today's Interviews</h3>
                 <div className="flex items-center gap-1.5">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                 </div>
              </div>
              
              <div className="space-y-3.5">
                 {todaysInterviews.length > 0 ? (
                    todaysInterviews.map((int, i) => (
                       <div key={int.id || i} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-3 mb-2.5">
                             {int.img && !int.img.includes('ui-avatars.com') ? (
                               <img src={int.img} alt={int.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                             ) : (
                               <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                 {int.initials || 'CA'}
                               </div>
                             )}
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{int.name}</p>
                                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">{int.role}</p>
                             </div>
                             <div className="text-right shrink-0">
                                <p className="text-xs font-extrabold text-primary-600 dark:text-primary-400">{int.time || 'Scheduled'}</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{int.round || 'Round 1'}</p>
                             </div>
                          </div>
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex flex-col">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Interviewer</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{int.interviewer || 'HR Team'}</p>
                             </div>
                             <button 
                                type="button"
                                onClick={() => { 
                                  const link = int.meetingLink || int.link || 'https://meet.google.com';
                                  window.open(link, '_blank', 'noopener,noreferrer'); 
                                }}
                                className="h-8 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all select-none cursor-pointer shrink-0"
                                title="Join Video Meeting"
                             >
                                <Video size={13} className="shrink-0" />
                                <span>Join</span>
                             </button>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-7 px-4 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                       <Calendar className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                       <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No interviews scheduled today</p>
                       <p className="text-[11px] text-slate-400 mt-1">Upcoming interviews will appear here automatically</p>
                    </div>
                 )}
              </div>
              
              <div className="pt-3 text-left">
                 <button 
                   type="button"
                   onClick={() => navigate('/hr/interviews')}
                   className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors inline-flex items-center gap-1 select-none"
                 >
                   <span>View Full Interview Schedule</span>
                   <ChevronRight size={14} />
                 </button>
              </div>
           </div>

           {/* Upcoming Company Holidays */}
           <div className="card p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="hcm-section-heading text-base sm:text-lg flex items-center gap-2">
                    <Calendar size={18} className="text-primary-600 dark:text-primary-400" />
                    <span>Company Holidays</span>
                 </h3>
                 <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    {upcomingHolidays.length} Upcoming
                 </span>
              </div>
              
              <div className="space-y-3">
                 {loadingHolidays ? (
                    <div className="py-6 text-center text-slate-400">
                       <Loader2 className="w-5 h-5 mx-auto animate-spin text-primary-600 mb-2" />
                       <p className="text-xs">Loading holidays...</p>
                    </div>
                 ) : upcomingHolidays.length > 0 ? (
                    upcomingHolidays.map((h, i) => {
                       const hDate = new Date(h.date);
                       const month = !isNaN(hDate.getTime()) ? hDate.toLocaleString('default', { month: 'short' }) : 'HOL';
                       const day = !isNaN(hDate.getTime()) ? hDate.getDate() : '--';
                       return (
                          <div key={h.id || i} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5">
                             <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase leading-none">{month}</span>
                                <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">{day}</span>
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{h.name}</p>
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                   {h.type || 'Public Holiday'} • {h.region || 'All Regions'}
                                </p>
                             </div>
                          </div>
                       );
                    })
                 ) : (
                    <div className="text-center py-6 px-4 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                       <Calendar className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                       <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No upcoming holidays</p>
                       <p className="text-[11px] text-slate-400 mt-0.5">New company holidays will appear here</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Analytics Preview Card (Weekly Highlights) */}
           <div className="card p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="hcm-section-heading text-base sm:text-lg">Weekly Highlights</h3>
                 <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    <BarChart3 size={16} />
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Candidate Satisfaction</p>
                       <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                         {candidateExperiencePct > 0 ? `${candidateExperiencePct}%` : 'No data yet'}
                       </p>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${candidateExperiencePct}%` }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Average Time to Hire</p>
                       <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                         {avgTimeToHire > 0 ? `${avgTimeToHire} Days` : 'No hires yet'}
                       </p>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (avgTimeToHire / 30) * 100)}%` }} />
                    </div>
                 </div>
              </div>
              
              <div 
                 onClick={() => navigate('/hr/reports')}
                 className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer group select-none"
              >
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                   METRICS REFRESHED DYNAMICALLY
                 </p>
                 <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

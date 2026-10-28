import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, RotateCcw, ChevronRight, X, Calendar, Briefcase,
  MessageSquare, CheckCircle2, Clock, AlertCircle, FileText, TrendingUp, Trash2,
  ExternalLink, ChevronDown, Download, ArrowRight, ShieldAlert, Zap, Building2,
  Award, Sparkles, MapPin, DollarSign, Check, Wifi, RefreshCw, Loader2, Inbox
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useCandidate } from '../../context/CandidateContext';
import { useDateFormat } from '../../hooks/useDateFormat';
import CenterModal from '../../shared/components/layout/CenterModal';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';

// ---------------------------------------------------------------------------
// Skeleton Primitives
// ---------------------------------------------------------------------------
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const TableRowSkeleton = () => (
  <tr className="border-b border-slate-100 dark:border-slate-800/50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3.5">
        <SkeletonBox className="w-11 h-11 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <SkeletonBox className="h-4 w-36" />
          <SkeletonBox className="h-3 w-24" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-3 w-20 mx-auto" /></td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-6 w-24 mx-auto rounded-lg" /></td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-4 w-32 mx-auto" /></td>
    <td className="px-6 py-4 text-right"><SkeletonBox className="h-7 w-7 ml-auto rounded-lg" /></td>
  </tr>
);

const MyApplications = () => {
  const {
    applications = [],
    withdrawApplication,
    showToast,
    refetch,
    offers = [],
    respondToOffer,
    isLoading,
    error
  } = useCandidate();
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [isRespondingOffer, setIsRespondingOffer] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Trigger backend applications & offers refresh on component mount
  useEffect(() => {
    if (refetch?.fetchApplications) refetch.fetchApplications();
    if (refetch?.fetchOffers) refetch.fetchOffers();
  }, [refetch]);

  // Dynamic status count calculations
  const totalCount = applications.length;
  const activeCount = useMemo(() => {
    return applications.filter(a => a.status !== 'Rejected' && a.status !== 'Withdrawn').length;
  }, [applications]);

  const underReviewCount = useMemo(() => {
    return applications.filter(a => a.status === 'Applied' || a.status === 'Under Review').length;
  }, [applications]);

  const shortlistedOrInterviewCount = useMemo(() => {
    return applications.filter(a => ['Shortlisted', 'Interview'].includes(a.status)).length;
  }, [applications]);

  const advancementRate = useMemo(() => {
    if (totalCount === 0) return '0%';
    const advanced = applications.filter(a => ['Shortlisted', 'Interview', 'Offer', 'Offer Received', 'Offer Accepted'].includes(a.status)).length;
    return `${Math.round((advanced / totalCount) * 100)}%`;
  }, [applications, totalCount]);

  const stats = [
    {
      label: 'Active Applications',
      value: totalCount,
      sub: `${activeCount} active submissions`,
      icon: Briefcase,
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Under Review',
      value: underReviewCount,
      sub: underReviewCount > 0 ? 'Screening by talent team' : 'No pending reviews',
      icon: Clock,
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Interviews & Shortlists',
      value: shortlistedOrInterviewCount,
      sub: shortlistedOrInterviewCount > 0 ? 'Advancing in pipeline' : 'Awaiting interview invites',
      icon: Calendar,
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Advancement Rate',
      value: advancementRate,
      sub: 'Pipeline progression rate',
      icon: TrendingUp,
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
  ];

  // Dynamic list of unique available statuses for filtering
  const availableStatuses = useMemo(() => {
    const set = new Set(applications.map(a => a.status).filter(Boolean));
    return Array.from(set);
  }, [applications]);

  // Filter applications by search and status
  const filteredApplications = useMemo(() => {
    return applications.filter(a => {
      const role = a.role || '';
      const company = a.company || '';
      const id = a.id || '';
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch = !query ||
        role.toLowerCase().includes(query) ||
        company.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const handleWithdraw = async () => {
    if (!selectedApp) return;
    try {
      setIsWithdrawing(true);
      await withdrawApplication(selectedApp.id);
      setIsWithdrawConfirmOpen(false);
      setSelectedApp(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleOfferResponse = async (offerId, decision) => {
    try {
      setIsRespondingOffer(true);
      await respondToOffer(offerId, decision);
      if (refetch?.fetchApplications) await refetch.fetchApplications();
      if (refetch?.fetchOffers) await refetch.fetchOffers();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRespondingOffer(false);
    }
  };

  const handleDownloadSummary = (app) => {
    if (!app) return;
    try {
      const timelineText = Array.isArray(app.timeline) && app.timeline.length > 0
        ? app.timeline.map((step) => `  - ${step.status} (Recorded: ${step.date})`).join('\n')
        : '  - Applied (Recorded: ' + (app.date || 'N/A') + ')';

      const feedbackText = app.feedback
        ? app.feedback
        : 'Application is undergoing active review by the recruitment committee. No formal feedback notes published yet.';

      const content = `==================================================
OFFICIAL CANDIDATE APPLICATION SUMMARY
==================================================
Application Reference: ${app.id || 'N/A'}
Position Applied:      ${app.role || 'N/A'}
Organization:          ${app.company || 'N/A'}
Date of Submission:    ${app.date || 'N/A'}
Current Status:        ${app.status || 'N/A'}

--------------------------------------------------
APPLICATION PROCESS TIMELINE:
${timelineText}

--------------------------------------------------
RECRUITER FEEDBACK & COMMITTEE NOTES:
${feedbackText}

==================================================
Generated on: ${formatDate(new Date())}
Candidate Portal: HCM.ai Enterprise Talent System
==================================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Application_${(app.company || 'Org').replace(/\s+/g, '_')}_${(app.role || 'Role').replace(/\s+/g, '_')}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Application summary downloaded successfully!', 'success');
    } catch (error) {
      console.error('Failed to generate summary download:', error);
      showToast('Failed to download application summary.', 'error');
    }
  };

  const statusMap = {
    'Applied': { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-350', border: 'border-slate-200 dark:border-slate-700/60' },
    'Under Review': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50' },
    'Shortlisted': { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50' },
    'Interview': { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50' },
    'Offer': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' },
    'Offer Received': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' },
    'Offer Accepted': { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/60' },
    'Rejected': { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50' },
    'Withdrawn': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
  };

  const getNextStepInfo = (status) => {
    switch (status) {
      case 'Offer':
      case 'Offer Received':
        return { text: 'Review Job Offer Terms', highlight: true, color: 'text-emerald-600' };
      case 'Offer Accepted':
        return { text: 'Onboarding Initialized', highlight: true, color: 'text-teal-600' };
      case 'Interview':
        return { text: 'Scheduled Interview Session', highlight: true, color: 'text-purple-600' };
      case 'Shortlisted':
        return { text: 'Awaiting Interview Schedule', highlight: false, color: 'text-blue-600' };
      case 'Under Review':
        return { text: 'Screening in Progress', highlight: false, color: 'text-amber-600' };
      case 'Rejected':
        return { text: 'Candidacy Archived', highlight: false, color: 'text-rose-500' };
      case 'Withdrawn':
        return { text: 'Application Withdrawn', highlight: false, color: 'text-slate-400' };
      case 'Applied':
      default:
        return { text: 'Profile in Talent Queue', highlight: false, color: 'text-slate-500' };
    }
  };

  const handleRetry = () => {
    if (refetch?.fetchApplications) refetch.fetchApplications();
    if (refetch?.fetchOffers) refetch.fetchOffers();
    if (refetch?.fetchProfile) refetch.fetchProfile();
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-8 pb-12 max-w-7xl mx-auto text-left px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-36 rounded-full" />
            <SkeletonBox className="h-9 w-56" />
            <SkeletonBox className="h-4 w-96" />
          </div>
          <SkeletonBox className="h-11 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {[1, 2, 3, 4].map(i => <StatCard key={i} isLoading />)}
        </div>
        <div className="hcm-table-container">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <SkeletonBox className="h-5 w-44" />
          </div>
          <table className="hcm-table">
            <tbody>
              {[1, 2, 3, 4].map(i => <TableRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------
  if (error && applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shadow-sm">
          <Wifi size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Applications</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
        </div>
        <button className="btn-primary" onClick={handleRetry}>
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left px-2 sm:px-0">
      {/* Header Section */}
      <PageHeader
        title="My Applications"
        description="Track your recruitment pipeline, interview progress, and job offer statuses."
        actions={
          <button
            type="button"
            onClick={() => navigate('/candidate/jobs')}
            className="btn-primary w-full sm:w-auto cursor-pointer"
          >
            <Search size={16} />
            <span>Browse Open Positions</span>
          </button>
        }
      />

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            bg={stat.bg}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 sm:p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search by role title, company name, or reference ID..."
            className="input-field pl-10 pr-4 h-11 bg-slate-50 dark:bg-slate-950 font-semibold text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <select
              className="select-field h-11 pr-10 appearance-none cursor-pointer w-full font-semibold text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status: All ({applications.length})</option>
              {availableStatuses.map(st => (
                <option key={st} value={st}>
                  {st} ({applications.filter(a => a.status === st).length})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
          {(searchTerm || statusFilter) && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
              title="Reset Filters"
              className="btn-secondary h-11 px-4 gap-2 cursor-pointer shrink-0"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Zero Total Applications State */}
      {applications.length === 0 ? (
        <div className="py-20 text-center card border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-1">
            <Inbox size={26} />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Active Applications Yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            You have not submitted any job applications yet. Discover open positions and submit your first candidacy to begin tracking your recruitment journey.
          </p>
          <button
            type="button"
            onClick={() => navigate('/candidate/jobs')}
            className="btn-primary mt-2 cursor-pointer"
          >
            <Search size={14} />
            <span>Browse Open Positions</span>
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        /* Filter Yielded 0 Matches State */
        <div className="py-16 text-center card border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-1">
            <Search size={22} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Matching Applications</h4>
          <p className="text-xs text-slate-400 max-w-sm">Try adjusting your keyword search or clearing the status filter.</p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
            className="btn-secondary btn-compact mt-3 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< lg) */}
          <div className="lg:hidden space-y-4">
            {filteredApplications.map((app) => {
              const nextStep = getNextStepInfo(app.status);
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="card p-5 space-y-4 border border-slate-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {app.companyLogo ? (
                        <img
                          src={app.companyLogo}
                          alt={app.company}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                          {app.company ? app.company.charAt(0).toUpperCase() : 'J'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate group-hover:text-primary-600 transition-colors">
                          {app.role}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                          <Building2 size={12} className="shrink-0" />
                          <span className="truncate">{app.company}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost btn-icon btn-compact shrink-0"
                      onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted On</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{app.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
                      <div className="mt-0.5">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap inline-block",
                          statusMap[app.status]?.bg || 'bg-slate-50 dark:bg-slate-800',
                          statusMap[app.status]?.text || 'text-slate-600 dark:text-slate-400',
                          statusMap[app.status]?.border || 'border-slate-200 dark:border-slate-800'
                        )}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Step</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold">
                        <Zap size={13} className={nextStep.color} />
                        <span className={nextStep.highlight ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}>
                          {nextStep.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (>= lg) */}
          <div className="hidden lg:block hcm-table-container bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
            <table className="hcm-table">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th">Role &amp; Organization</th>
                  <th className="hcm-th text-center">Applied Date</th>
                  <th className="hcm-th text-center">Status</th>
                  <th className="hcm-th text-center">Pipeline Stage</th>
                  <th className="hcm-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredApplications.map((app) => {
                  const nextStep = getNextStepInfo(app.status);
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hcm-tr cursor-pointer group"
                    >
                      <td className="hcm-td px-6 py-4">
                        <div className="flex items-center gap-4">
                          {app.companyLogo ? (
                            <img
                              src={app.companyLogo}
                              alt={app.company}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                              {app.company ? app.company.charAt(0).toUpperCase() : 'J'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                              {app.role}
                            </p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <Building2 size={12} className="shrink-0" />
                              <span>{app.company}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hcm-td px-6 py-4 text-center">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">{app.date}</p>
                      </td>
                      <td className="hcm-td px-6 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border whitespace-nowrap",
                          statusMap[app.status]?.bg || 'bg-slate-50 dark:bg-slate-800',
                          statusMap[app.status]?.text || 'text-slate-600 dark:text-slate-400',
                          statusMap[app.status]?.border || 'border-slate-200 dark:border-slate-800'
                        )}>
                          {app.status}
                        </span>
                      </td>
                      <td className="hcm-td px-6 py-4 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <Zap size={13} className={nextStep.color} />
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {nextStep.text}
                          </p>
                        </div>
                      </td>
                      <td className="hcm-td-action px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                          title="View Application Details"
                          className="btn-ghost btn-icon btn-compact cursor-pointer"
                        >
                          <ExternalLink size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Application Details Modal */}
      <CenterModal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        maxWidth="max-w-3xl"
      >
        {selectedApp && (() => {
          const appOffer = offers.find(o => o.applicationId === selectedApp.id || o.application?.id === selectedApp.id);
          const isOfferActive = appOffer && (appOffer.status === 'Sent' || appOffer.status === 'PENDING');
          const canWithdraw = selectedApp.status !== 'Rejected' && selectedApp.status !== 'Offer Accepted' && selectedApp.status !== 'Withdrawn';

          return (
            <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
              {/* Header Hero */}
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  {selectedApp.companyLogo ? (
                    <img
                      src={selectedApp.companyLogo}
                      alt={selectedApp.company}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                      {selectedApp.company ? selectedApp.company.charAt(0).toUpperCase() : 'J'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">{selectedApp.role}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                        <Building2 size={13} />
                        {selectedApp.company}
                      </span>
                      <span className="opacity-40">•</span>
                      <span>Ref: {selectedApp.id ? selectedApp.id.slice(0, 12) + '...' : 'N/A'}</span>
                      <span className="opacity-40">•</span>
                      <span>Submitted: {selectedApp.date}</span>
                    </p>
                  </div>
                </div>

                <span className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border shrink-0",
                  statusMap[selectedApp.status]?.bg || 'bg-slate-50 dark:bg-slate-800',
                  statusMap[selectedApp.status]?.text || 'text-slate-600 dark:text-slate-400',
                  statusMap[selectedApp.status]?.border || 'border-slate-200 dark:border-slate-800'
                )}>
                  {selectedApp.status}
                </span>
              </div>

              {/* Offer Received Alert (If applicable) */}
              {appOffer && (
                <div className={cn(
                  "p-5 rounded-2xl border space-y-3",
                  isOfferActive ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60" :
                    appOffer.status === 'Accepted' ? "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60" :
                      "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="text-emerald-600 dark:text-emerald-400" size={18} />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isOfferActive ? 'Formal Job Offer Extended!' : `Offer Decision: ${appOffer.status}`}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {appOffer.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Annual Package</p>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{appOffer.salary || appOffer.salaryRange || 'Competitive'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Target Start Date</p>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{appOffer.joiningDate || appOffer.startDate || 'Immediate'}</p>
                    </div>
                  </div>

                  {isOfferActive && (
                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleOfferResponse(appOffer.id, 'Declined')}
                        disabled={isRespondingOffer}
                        className="btn-secondary btn-compact flex-1 cursor-pointer"
                      >
                        Decline Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfferResponse(appOffer.id, 'Accepted')}
                        disabled={isRespondingOffer}
                        className="btn-primary btn-compact flex-1 cursor-pointer"
                      >
                        {isRespondingOffer ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                        <span>Accept Offer</span>
                      </button>
                    </div>
                  )}

                  {appOffer.status === 'Accepted' && (
                    <p className="text-xs text-teal-700 dark:text-teal-300 font-medium pt-1">
                      ✓ Offer accepted! HR has initiated your onboarding documentation and pre-employment workflows.
                    </p>
                  )}
                </div>
              )}

              {/* Dynamic Timeline Progression */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recruitment Pipeline Timeline
                </h3>
                <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                  {(() => {
                    const recordedSteps = Array.isArray(selectedApp.timeline) && selectedApp.timeline.length > 0
                      ? selectedApp.timeline
                      : [{ status: 'Applied', date: selectedApp.date }];

                    return recordedSteps.map((step, idx) => {
                      const isLast = idx === recordedSteps.length - 1;
                      return (
                        <div key={idx} className="relative">
                          <div className={cn(
                            "absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 transition-all",
                            isLast ? "bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-950" : "bg-slate-300 dark:bg-slate-700"
                          )} />
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{step.status}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Recorded: {step.date}</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Recruiter Feedback Note */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <MessageSquare size={14} className="text-primary-600 dark:text-primary-400" />
                  <span>Recruiter Notes &amp; Feedback</span>
                </div>
                {selectedApp.feedback ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    "{selectedApp.feedback}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your application is undergoing standard processing. Official screening feedback will be updated here as the evaluation advances.
                  </p>
                )}
              </div>

              {/* Modal Action Controls */}
              {canWithdraw && (
                <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawConfirmOpen(true)}
                    className="btn-secondary text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Withdraw Application</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </CenterModal>

      {/* Withdrawal Confirmation Dialog */}
      <CenterModal
        isOpen={isWithdrawConfirmOpen}
        onClose={() => setIsWithdrawConfirmOpen(false)}
        title="Confirm Withdrawal"
        maxWidth="max-w-md"
      >
        <div className="p-6 text-center space-y-6 bg-white dark:bg-slate-900">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto text-rose-600 border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Withdraw This Application?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This action will permanently withdraw your candidacy for the <span className="font-bold text-slate-900 dark:text-white">{selectedApp?.role}</span> position at <span className="font-bold text-slate-900 dark:text-white">{selectedApp?.company}</span>.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsWithdrawConfirmOpen(false)}
              className="btn-secondary flex-1 cursor-pointer"
              disabled={isWithdrawing}
            >
              Keep Application
            </button>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="btn-danger flex-1 cursor-pointer"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Withdrawing...</span>
                </>
              ) : (
                <span>Withdraw Application</span>
              )}
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default MyApplications;

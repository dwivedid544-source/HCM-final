import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Calendar, Award, UserCircle, Search, ExternalLink,
  ChevronRight, Clock, Video, FileText, Info, ArrowRight,
  Building2, Sparkles, Check, RefreshCw, Wifi, Compass,
  MapPin
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import { useNavigate } from 'react-router-dom';
import CenterModal from '../../shared/components/layout/CenterModal';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';

const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const TableRowSkeleton = () => (
  <tr className="border-b border-slate-100 dark:border-slate-800/50">
    <td className="px-6 py-4"><div className="flex items-center gap-3"><SkeletonBox className="w-10 h-10 rounded-xl shrink-0" /><div className="space-y-1.5"><SkeletonBox className="h-3 w-32" /><SkeletonBox className="h-2.5 w-20" /></div></div></td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-3 w-20 mx-auto" /></td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-5 w-20 mx-auto rounded-full" /></td>
    <td className="px-6 py-4 text-right"><SkeletonBox className="h-5 w-5 ml-auto rounded" /></td>
  </tr>
);

const CardSkeleton = () => (
  <div className="card p-5 sm:p-6 space-y-4">
    <div className="flex items-center justify-between"><SkeletonBox className="h-5 w-40" /><SkeletonBox className="h-8 w-20 rounded-xl" /></div>
    <SkeletonBox className="h-2 w-full rounded-full" />
    {[1, 2, 3].map(i => <div key={i} className="flex justify-between items-center"><SkeletonBox className="h-3 w-36" /><SkeletonBox className="h-5 w-12 rounded-full" /></div>)}
  </div>
);

const getStatusBadge = (status) => {
  const base = 'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border';
  if (status === 'Shortlisted') return cn(base, 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900');
  if (status === 'Interview') return cn(base, 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900');
  if (status === 'Offer' || status === 'Offer Accepted') return cn(base, 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900');
  if (status === 'Under Review') return cn(base, 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900');
  if (status === 'Rejected') return cn(base, 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900');
  return cn(base, 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700');
};

const CandidateDashboard = () => {
  const {
    profile = {}, applications = [], interviews = [], offers = [],
    jobs = { allJobs: [] }, showToast, refetch,
    dashboardStats, isLoading, error
  } = useCandidate();

  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState(null);
  const [requestedUpdates, setRequestedUpdates] = useState({});

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return (interviews || [])
      .filter(iv => iv.status === 'Scheduled' && new Date(iv.rawDateTime) >= now)
      .sort((a, b) => new Date(a.rawDateTime) - new Date(b.rawDateTime));
  }, [interviews]);

  const activeApplications = useMemo(() => applications.filter(a => a.status !== 'Rejected'), [applications]);
  const pendingOffers = useMemo(() => (offers || []).filter(o => o.status === 'Sent' || o.status === 'PENDING'), [offers]);

  const profileChecklist = useMemo(() => {
    const p = profile;
    const hasSkills = Boolean(p.skills && (Array.isArray(p.skills) ? p.skills.length > 0 : p.skills.trim().length > 0));
    return [
      { id: 'contact', label: 'Contact Phone Number', isDone: Boolean(p.phone?.trim()), path: '/candidate/settings' },
      { id: 'resume', label: 'Resume / CV Document', isDone: Boolean(p.resumeUrl?.trim()), path: '/candidate/settings' },
      { id: 'skills', label: 'Technical & Core Skills', isDone: hasSkills, path: '/candidate/settings' },
      { id: 'location', label: 'Target Location & City', isDone: Boolean(p.location?.trim()), path: '/candidate/settings' },
      { id: 'bio', label: 'Professional Biography', isDone: Boolean(p.bio?.trim()), path: '/candidate/settings' },
      { id: 'portfolio', label: 'LinkedIn or Portfolio URL', isDone: Boolean(p.portfolio?.trim() || p.linkedin?.trim()), path: '/candidate/settings' },
    ];
  }, [profile]);

  const completedCount = useMemo(() => profileChecklist.filter(i => i.isDone).length, [profileChecklist]);
  const completionPercentage = useMemo(() => Math.round((completedCount / profileChecklist.length) * 100), [completedCount, profileChecklist.length]);

  const sv = {
    applications: dashboardStats ? dashboardStats.applicationCount : applications.length,
    interviews: dashboardStats ? dashboardStats.upcomingInterviewCount : upcomingInterviews.length,
    offers: dashboardStats ? dashboardStats.offerCount : (offers || []).length,
    completion: dashboardStats ? dashboardStats.profileCompletion : completionPercentage,
    completedSections: dashboardStats ? dashboardStats.completedSections : completedCount,
    totalSections: dashboardStats ? dashboardStats.totalSections : profileChecklist.length,
  };

  const appliedJobIds = useMemo(() => new Set(applications.map(a => a.jobId)), [applications]);
  const recommendedJobs = useMemo(() => (jobs?.allJobs || []).filter(j => !appliedJobIds.has(j.id)).slice(0, 3), [jobs?.allJobs, appliedJobIds]);

  const candidateDisplayName = profile.fullName || profile.email?.split('@')[0] || 'Candidate';

  const handleJoinMeeting = (link) => {
    if (!link) { showToast('Meeting link not yet assigned by recruiter.', 'info'); return; }
    showToast('Connecting to meeting session...', 'info');
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleRequestUpdate = (appId) => {
    setRequestedUpdates(prev => ({ ...prev, [appId]: true }));
    showToast('Status inquiry dispatched to the talent acquisition team.', 'success');
  };

  const handleRetry = () => {
    if (refetch?.fetchProfile) refetch.fetchProfile();
    if (refetch?.fetchApplications) refetch.fetchApplications();
    if (refetch?.fetchJobs) refetch.fetchJobs();
    if (refetch?.fetchOffers) refetch.fetchOffers();
    if (refetch?.fetchDashboard) refetch.fetchDashboard();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2"><SkeletonBox className="h-4 w-36 rounded-full" /><SkeletonBox className="h-9 w-56" /><SkeletonBox className="h-4 w-80" /></div>
          <SkeletonBox className="h-11 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => <StatCard key={i} isLoading />)}
        </div>
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <div className="hcm-table-container">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800"><SkeletonBox className="h-5 w-44" /></div>
              <table className="hcm-table"><tbody>{[1, 2, 3].map(i => <TableRowSkeleton key={i} />)}</tbody></table>
            </div>
            <CardSkeleton />
          </div>
          <div className="lg:col-span-4 space-y-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center">
          <Wifi size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Dashboard</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
        </div>
        <button className="btn-primary" onClick={handleRetry}><RefreshCw size={16} /><span>Try Again</span></button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto text-left">

      {/* Header */}
      <PageHeader
        title="Candidate Dashboard"
        subtitle={`Welcome back, ${candidateDisplayName}! Here is your real-time recruitment overview.`}
        actions={
          <Button
            variant="primary"
            leftIcon={Search}
            onClick={() => navigate('/candidate/jobs')}
            className="w-full sm:w-auto"
          >
            Browse Open Positions
          </Button>
        }
      />

      {/* Offer Banner */}
      {pendingOffers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Award size={22} /></div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-widest inline-block mb-1">Formal Job Offer</span>
              <h3 className="text-sm font-bold">You have {pendingOffers.length} pending offer{pendingOffers.length > 1 ? 's' : ''} awaiting your response!</h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">Role: <span className="font-semibold text-white">{pendingOffers[0]?.application?.jobPost?.title || 'Open Position'}</span></p>
            </div>
          </div>
          <button className="btn-secondary shrink-0 w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => navigate('/candidate/offers')}>
            <span>Review Offer</span><ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={Briefcase} label="Applied Positions" value={sv.applications}
          sub={activeApplications.length > 0 ? `${activeApplications.length} active / in review` : 'No active applications'}
          bg="bg-blue-50 dark:bg-blue-950/20" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard icon={Calendar} label="Interviews Scheduled" value={sv.interviews}
          sub={upcomingInterviews.length > 0 ? `Next: ${upcomingInterviews[0].date}` : 'No upcoming sessions'}
          bg="bg-purple-50 dark:bg-purple-950/20" iconColor="text-purple-600 dark:text-purple-400" />
        <StatCard icon={Award} label="Formal Job Offers" value={sv.offers}
          sub={pendingOffers.length > 0 ? `${pendingOffers.length} pending your review` : 'All offers up to date'}
          bg="bg-emerald-50 dark:bg-emerald-950/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={UserCircle} label="Profile Readiness" value={`${sv.completion}%`}
          sub={sv.completion === 100 ? 'All key credentials provided' : `${sv.completedSections} of ${sv.totalSections} details filled`}
          bg="bg-orange-50 dark:bg-orange-950/20" iconColor="text-orange-600 dark:text-orange-400"
          progress={sv.completedSections} total={sv.totalSections} />
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8">

        {/* Left — 8 cols */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">

          {/* Recent Applications */}
          <div className="hcm-table-container">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Briefcase className="text-primary-600 dark:text-primary-400 shrink-0" size={18} />
                Recent Applications
              </h3>
              {applications.length > 0 && (
                <button className="btn-ghost btn-compact shrink-0" onClick={() => navigate('/candidate/applications')}>
                  <span>View All ({applications.length})</span><ChevronRight size={14} />
                </button>
              )}
            </div>

            {applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="hcm-table">
                  <thead className="hcm-thead">
                    <tr>
                      <th className="hcm-th">Position &amp; Company</th>
                      <th className="hcm-th text-center">Applied On</th>
                      <th className="hcm-th text-center">Status</th>
                      <th className="hcm-th text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hcm-tr cursor-pointer" onClick={() => setSelectedApp(app)}>
                        <td className="hcm-td">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {app.company ? app.company[0].toUpperCase() : 'J'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug truncate">{app.role}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                                <Building2 size={11} className="shrink-0" />{app.company}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hcm-td text-center"><span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{app.date}</span></td>
                        <td className="hcm-td text-center"><span className={getStatusBadge(app.status)}>{app.status}</span></td>
                        <td className="hcm-td-action">
                          <button className="btn-ghost btn-icon btn-compact" onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }} title="View Details">
                            <ExternalLink size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 px-6 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <Briefcase size={26} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">No Applications Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">Browse active vacancies and submit your first application.</p>
                </div>
                <button className="btn-primary mt-1" onClick={() => navigate('/candidate/jobs')}>
                  <Search size={14} /><span>Discover Open Roles</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Positions */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="text-primary-600 dark:text-primary-400 shrink-0" size={18} />
                  Active Positions You Can Apply To
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recommended roles currently accepting applications</p>
              </div>
              <button className="btn-ghost btn-compact shrink-0" onClick={() => navigate('/candidate/jobs')}>
                <span>Browse All</span><ChevronRight size={14} />
              </button>
            </div>

            {recommendedJobs.length > 0 ? (
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recommendedJobs.map((job) => (
                    <div key={job.id} className="flex flex-col justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-primary-200 dark:hover:border-primary-900 transition-colors group">
                      <div>
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider block mb-1">{job.department || 'General'}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{job.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
                          <Building2 size={11} className="shrink-0" /><span className="truncate">{job.company}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={9} />{job.location || 'Remote'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">{job.salary || 'Competitive'}</span>
                        </div>
                      </div>
                      <button className="btn-secondary btn-compact w-full mt-4" onClick={() => navigate(`/candidate/jobs?jobId=${job.id}`)}>
                        <span>View &amp; Apply</span><ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">You've applied to all recommended positions, or no new openings are currently posted.</p>
                <button className="btn-secondary btn-compact mt-4" onClick={() => navigate('/candidate/jobs')}><Search size={13} /><span>Browse All Jobs</span></button>
              </div>
            )}
          </div>
        </div>

        {/* Right — 4 cols */}
        <div className="lg:col-span-4 space-y-6">

          {/* Upcoming Interviews */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-primary-600 dark:text-primary-400 shrink-0" />
                Upcoming Interviews
              </h3>
              {upcomingInterviews.length > 0 && (
                <button className="btn-ghost btn-compact" onClick={() => navigate('/candidate/interviews')}>View All</button>
              )}
            </div>
            <div className="p-5 space-y-4">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.slice(0, 2).map((iv) => (
                  <div key={iv.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 block truncate">{iv.date}{iv.time ? ` @ ${iv.time}` : ''}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug truncate">{iv.role}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate"><Building2 size={11} className="shrink-0" />{iv.company}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 shrink-0">{iv.round || 'Round 1'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400"><Video size={11} className="shrink-0" /><span>{iv.type || 'Video Call'}</span></div>
                    <button className="btn-secondary btn-compact w-full" onClick={() => handleJoinMeeting(iv.link)}><Video size={13} /><span>Join Meeting</span></button>
                  </div>
                ))
              ) : (
                <div className="py-8 flex flex-col items-center text-center gap-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Clock size={26} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Active Sessions</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[180px]">Interviews scheduled with hiring managers will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Readiness */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Readiness</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sv.completedSections} of {sv.totalSections} sections complete</p>
              </div>
              <span className="text-base font-black text-primary-600 dark:text-primary-400 shrink-0">{sv.completion}%</span>
            </div>
            <div className="px-5 pt-4">
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${sv.completion}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full rounded-full bg-primary-500 dark:bg-primary-400" />
              </div>
            </div>
            <div className="p-5 space-y-1">
              {profileChecklist.map((item) => (
                <button key={item.id} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left" onClick={() => navigate(item.path)}>
                  <span className={cn('text-sm font-medium truncate', item.isDone ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500')}>{item.label}</span>
                  {item.isDone ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"><Check size={11} /></span>
                  ) : (
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 shrink-0 whitespace-nowrap">+ Add</span>
                  )}
                </button>
              ))}
            </div>
            {sv.completion < 100 && (
              <div className="px-5 pb-5">
                <button className="btn-secondary w-full" onClick={() => navigate('/candidate/settings')}><span>Complete Profile</span><ChevronRight size={14} /></button>
              </div>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Navigation</h3>
            </div>
            <div className="p-3 space-y-1">
              {[
                { label: 'AI Resume Optimization', icon: FileText, path: '/candidate/resume' },
                { label: 'Manage Profile & Documents', icon: UserCircle, path: '/candidate/settings' },
                { label: 'Review All Offers', icon: Award, path: '/candidate/offers' },
                { label: 'My Applications', icon: Briefcase, path: '/candidate/applications' },
              ].map((action, idx) => (
                <button key={idx} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group" onClick={() => navigate(action.path)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                      <action.icon size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Application Detail Modal */}
      <CenterModal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details">
        {selectedApp && (
          <div className="p-6 sm:p-8 space-y-6 text-left">
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                  {selectedApp.company ? selectedApp.company[0].toUpperCase() : 'J'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{selectedApp.role}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={12} />{selectedApp.company} · Submitted {selectedApp.date}</p>
                </div>
              </div>
              <span className={cn(getStatusBadge(selectedApp.status), 'shrink-0')}>{selectedApp.status}</span>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Recruitment Timeline</h4>
              <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                {(selectedApp.timeline || []).map((step, i) => (
                  <div key={i} className="relative">
                    <div className={cn('absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900', i === selectedApp.timeline.length - 1 ? 'bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-950' : 'bg-slate-300 dark:bg-slate-700')} />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{step.status}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Recorded: {step.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedApp.feedback ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400 text-xs font-bold"><Info size={13} /><span>Recruiter Feedback</span></div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">"{selectedApp.feedback}"</p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Application is processing. You will receive updates here as the recruitment team progresses.</p>
              </div>
            )}

            <div className="flex gap-3 pt-1 flex-wrap sm:flex-nowrap">
              <button className="btn-secondary flex-1" onClick={() => setSelectedApp(null)}>Close</button>
              {selectedApp.status !== 'Rejected' && (
                <button className={cn('btn-primary flex-1', requestedUpdates[selectedApp.id] && 'opacity-60 pointer-events-none')} disabled={requestedUpdates[selectedApp.id]} onClick={() => handleRequestUpdate(selectedApp.id)}>
                  {requestedUpdates[selectedApp.id] ? 'Inquiry Sent ✓' : 'Inquire on Status'}
                </button>
              )}
            </div>
          </div>
        )}
      </CenterModal>

    </div>
  );
};

export default CandidateDashboard;

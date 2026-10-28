import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, MapPin, Video, User, Clock,
  CheckCircle2, AlertCircle, CalendarDays,
  X, Zap, ShieldCheck, VideoOff, Play, Check,
  Laptop, BookOpen, RefreshCw, AlertTriangle, XCircle, Info
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';
import { candidateAPI } from '../../utils/apiService';

// ─── Skeletons ────────────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const RowSkeleton = () => (
  <tr className="border-b border-slate-100 dark:border-slate-800/50">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-1.5"><SkeletonBox className="h-3 w-32" /><SkeletonBox className="h-2.5 w-20" /></div>
      </div>
    </td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-3 w-24 mx-auto" /></td>
    <td className="px-6 py-4 text-center"><SkeletonBox className="h-6 w-20 mx-auto rounded-lg" /></td>
    <td className="px-6 py-4 text-right"><SkeletonBox className="h-6 w-16 ml-auto rounded-lg" /></td>
  </tr>
);

// ─── Status badge styles ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  Scheduled: 'bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-900',
  Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
  Cancelled: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900',
};

const getStatusStyle = (s) => STATUS_STYLES[s] || 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';

// ─── Default checklist ────────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  { id: 'camera_mic',       tip: 'Check camera and microphone settings', done: false },
  { id: 'research_company', tip: 'Research company and interviewers',     done: false },
  { id: 'prepare_questions', tip: 'Prepare questions for the team',       done: false },
  { id: 'review_resume',    tip: 'Review your resume and portfolio',      done: false },
];

// ─── Prep guide builder ───────────────────────────────────────────────────────
function buildPrepGuide(interview) {
  const txt = `${interview.round || ''} ${interview.role || ''}`;
  const isTech   = /technical|engineer|developer|code|software|data/i.test(txt);
  const isDesign = /design|ui|ux|figma|product/i.test(txt);
  if (isTech) return {
    role: interview.role, company: interview.company, round: interview.round,
    focusArea: 'Data structures, algorithm complexity, software design principles, and problem-solving velocity.',
    steps: [
      `Review core algorithms and system design patterns for ${interview.role || 'engineering'}.`,
      'Prepare a 5-minute walkthrough of your most complex system build.',
      'Brush up on relevant language-specific syntax and standard libraries.',
      'Review STAR behavioral scenarios focusing on code ownership.',
    ],
  };
  if (isDesign) return {
    role: interview.role, company: interview.company, round: interview.round,
    focusArea: 'UX research principles, layout rules, and responsive design systems.',
    steps: [
      'Revise Figma layout rules and responsive grid implementations.',
      'Prepare your portfolio for screen-sharing walkthroughs.',
      'Brush up on fundamental CSS/accessibility concepts.',
      'Identify past conflict resolution stories using design or product metrics.',
    ],
  };
  return {
    role: interview.role, company: interview.company, round: interview.round,
    focusArea: 'Behavioral questions, leadership principles, and cross-team communication.',
    steps: [
      'Prepare a detailed explanation of your strategic decisions.',
      'Formulate questions regarding team scale and technical roadmap.',
      'Review target market and competitive landscapes.',
      'Use the STAR method for all behavioral answers.',
    ],
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
const InterviewSchedule = () => {
  const { interviews: ctxInterviews, applications, profile, showToast } = useCandidate();

  const [view, setView] = useState('list');
  const [checklist,        setChecklist]        = useState(DEFAULT_CHECKLIST);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [actionLoading,    setActionLoading]    = useState(false);

  // Modals
  const [detailModal,     setDetailModal]     = useState({ open: false, interview: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, interview: null });
  const [cancelModal,     setCancelModal]     = useState({ open: false, interview: null });
  const [prepModal,       setPrepModal]       = useState({ open: false, guide: null });

  // Form state
  const [rescheduleForm, setRescheduleForm] = useState({ proposedDate: '', proposedTime: '', reason: '' });
  const [cancelReason,   setCancelReason]   = useState('');

  // ── Load checklist from backend ───────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setChecklistLoading(true);
        const res = await candidateAPI.getChecklist();
        if (mounted && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setChecklist(res.data.data);
        }
      } catch { /* fallback to defaults */ }
      finally { if (mounted) setChecklistLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Toggle + persist checklist ────────────────────────────────────────────
  const toggleChecklist = useCallback(async (id) => {
    const updated = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    try { await candidateAPI.updateChecklist(updated); }
    catch { /* silent */ }
  }, [checklist]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const scheduledCount = useMemo(() => ctxInterviews.filter(i => i.status === 'Scheduled').length, [ctxInterviews]);
  const completedCount = useMemo(() => ctxInterviews.filter(i => i.status === 'Completed').length,  [ctxInterviews]);

  const avgWaitTime = useMemo(() => {
    const parseSafeDate = (d) => {
      if (!d) return null;
      const direct = new Date(d);
      if (!isNaN(direct.getTime())) return direct;
      if (typeof d === 'string') {
        const parts = d.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (parts) {
          return new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
        }
      }
      return null;
    };

    let total = 0, n = 0;
    ctxInterviews.forEach(iv => {
      const app = applications?.find(a => a.id === iv.appId || a.id === iv.applicationId);
      const appDateVal = parseSafeDate(app?.submittedAt || app?.rawDate || app?.date || app?.createdAt);
      const ivDateVal = parseSafeDate(iv?.rawDateTime || iv?.dateTime || iv?.date);
      if (appDateVal && ivDateVal) {
        const diff = Math.max(0, Math.floor((ivDateVal - appDateVal) / 86400000));
        total += diff;
        n++;
      }
    });
    return n > 0 ? `${Math.round(total / n)}d` : (scheduledCount > 0 ? '3d' : '—');
  }, [ctxInterviews, applications, scheduledCount]);

  const prepScore    = useMemo(() => {
    const done = checklist.filter(c => c.done).length;
    return `${Math.round((done / checklist.length) * 100)}%`;
  }, [checklist]);

  const nextInterview = useMemo(() =>
    ctxInterviews
      .filter(i => i.status === 'Scheduled')
      .sort((a, b) => new Date(a.rawDateTime || a.date) - new Date(b.rawDateTime || b.date))[0] || null,
  [ctxInterviews]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleJoin = (link) => {
    if (!link) { showToast('No meeting link available for this interview.', 'error'); return; }
    showToast('Joining interview session...', 'success');
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const submitReschedule = async () => {
    if (!rescheduleForm.reason.trim()) { showToast('Please provide a reason for rescheduling.', 'error'); return; }
    try {
      setActionLoading(true);
      const res = await candidateAPI.rescheduleInterview(rescheduleModal.interview.id, rescheduleForm);
      if (res.data?.success) {
        showToast('Reschedule request sent. The recruitment team has been notified.', 'success');
        setRescheduleModal({ open: false, interview: null });
        setDetailModal({ open: false, interview: null });
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to submit request.', 'error');
    } finally { setActionLoading(false); }
  };

  const submitCancel = async () => {
    try {
      setActionLoading(true);
      const res = await candidateAPI.cancelInterview(cancelModal.interview.id, { reason: cancelReason });
      if (res.data?.success) {
        showToast('Interview cancelled successfully.', 'success');
        setCancelModal({ open: false, interview: null });
        setDetailModal({ open: false, interview: null });
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to cancel interview.', 'error');
    } finally { setActionLoading(false); }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left px-2 sm:px-0">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Interview Schedule"
        description="Track and prepare for your upcoming interviews."
        actions={
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setView('list')}
              className={cn('px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer',
                view === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
            >List</button>
            <button
              onClick={() => setView('grid')}
              className={cn('px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer',
                view === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
            >Grid</button>
          </div>
        }
      />

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={CalendarIcon}  label="Scheduled"     value={scheduledCount}
          bg="bg-primary-50 dark:bg-primary-950/20"  iconColor="text-primary-600 dark:text-primary-400" />
        <StatCard icon={CheckCircle2}  label="Completed"     value={completedCount}
          bg="bg-emerald-50 dark:bg-emerald-950/20"  iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={Clock}         label="Avg Wait Time"  value={avgWaitTime}
          bg="bg-amber-50 dark:bg-amber-950/20"      iconColor="text-amber-600 dark:text-amber-400" />
        <StatCard icon={Zap}           label="Preparation"   value={prepScore}
          bg="bg-purple-50 dark:bg-purple-950/20"    iconColor="text-purple-600 dark:text-purple-400"
          progress={checklist.filter(c => c.done).length} total={checklist.length} />
      </div>

      {/* ── Main 12-col grid: 8 main + 4 sidebar ───────────────────── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8">

        {/* ── Main Content — 8 cols ─────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Next Interview Banner */}
          {nextInterview && (
            <div className="card p-5 sm:p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center font-bold text-2xl shrink-0 border border-white/10">
                  {(nextInterview.company || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary-200 bg-white/10 px-2 py-0.5 rounded-md">{nextInterview.round}</span>
                  </div>
                  <h3 className="text-lg font-bold truncate">{nextInterview.role}</h3>
                  <p className="text-primary-200 text-sm font-medium truncate">{nextInterview.company}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="text-xs font-bold text-primary-100">{nextInterview.date} · {nextInterview.time}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailModal({ open: true, interview: nextInterview })}
                      className="btn-ghost text-white/80 border-white/20 hover:bg-white/10 text-xs px-3 py-1.5"
                    ><Info size={13} /> Details</button>
                    {nextInterview.link && (
                      <button
                        onClick={() => handleJoin(nextInterview.link)}
                        className="bg-white text-primary-700 hover:bg-white/90 font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                      ><Play size={13} fill="currentColor" /> Join</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interview List / Grid */}
          {ctxInterviews.length === 0 ? (
            <div className="card p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                <CalendarDays className="text-slate-300 dark:text-slate-600" size={28} />
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">No interviews yet</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Once recruiters schedule interviews for your applications, they'll appear here.
                </p>
              </div>
            </div>
          ) : view === 'list' ? (
            /* List view */
            <div className="hcm-table-container">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <CalendarIcon className="text-primary-600 dark:text-primary-400 shrink-0" size={18} />
                  All Interviews
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ctxInterviews.length} record{ctxInterviews.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="hcm-table w-full text-left">
                  <thead className="hcm-thead">
                    <tr className="hcm-tr">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hcm-th">Job / Company</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center hcm-th">Date / Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center hcm-th">Round</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right hcm-th">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ctxInterviews.map((item) => (
                      <motion.tr
                        key={item.id}
                        onClick={() => setDetailModal({ open: true, interview: item })}
                        className="hcm-tr cursor-pointer group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <td className="px-6 py-4 hcm-td">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:shadow-md shrink-0 transition-shadow">
                              {(item.company || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.role}</p>
                              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate">{item.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center hcm-td whitespace-nowrap">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.date}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                        </td>
                        <td className="px-6 py-4 text-center hcm-td">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            {item.type?.toLowerCase().includes('video') ? <Video size={12} /> : <MapPin size={12} />}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.round}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right hcm-td">
                          <span className={cn('px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border', getStatusStyle(item.status))}>
                            {item.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid view */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {ctxInterviews.map(item => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -3 }}
                  onClick={() => setDetailModal({ open: true, interview: item })}
                  className="card p-5 cursor-pointer group hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {(item.company || '?')[0].toUpperCase()}
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border', getStatusStyle(item.status))}>
                      {item.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{item.role}</p>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 mb-3 truncate">{item.company}</p>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{item.round}</div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <CalendarDays size={12} /> {item.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Clock size={12} /> {item.time}
                    </span>
                  </div>
                  {item.status === 'Scheduled' && item.link && (
                    <button
                      onClick={e => { e.stopPropagation(); handleJoin(item.link); }}
                      className="btn-primary w-full mt-3 text-xs py-2 flex items-center justify-center gap-1.5"
                    ><Play size={12} fill="currentColor" /> Join Interview</button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar — 4 cols ──────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">

          {/* No Upcoming Card / Next Interview mini-card */}
          {!nextInterview ? (
            <div className="card p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto">
                <CalendarDays className="text-slate-300 dark:text-slate-600" size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Upcoming Interviews</p>
                <p className="text-xs text-slate-400 mt-1">Keep applying to schedule your next interview.</p>
              </div>
            </div>
          ) : (
            <div className="card p-5 sm:p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon size={14} className="text-primary-500" /> Next Interview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{nextInterview.role}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={13} className="shrink-0" />
                  <span>{nextInterview.date} · {nextInterview.time}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User size={13} className="shrink-0" />
                  <span className="truncate">{nextInterview.interviewer || 'HR Team'}</span>
                </div>
                {nextInterview.type && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Video size={13} className="shrink-0" />
                    <span>{nextInterview.type}</span>
                  </div>
                )}
              </div>
              {nextInterview.link && (
                <button
                  onClick={() => handleJoin(nextInterview.link)}
                  className="btn-primary w-full text-xs flex items-center justify-center gap-1.5"
                ><Play size={13} fill="currentColor" /> Join Interview</button>
              )}
            </div>
          )}

          {/* Preparation Checklist */}
          <div className="card p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Preparation Checklist
            </h3>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400">{prepScore}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: prepScore }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              {checklistLoading
                ? [1, 2, 3, 4].map(i => <SkeletonBox key={i} className="h-5 w-full rounded" />)
                : checklist.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className="w-full flex items-start gap-3 group text-left hover:opacity-80 transition-opacity"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5',
                      item.done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-200 dark:border-slate-700 group-hover:border-primary-400'
                    )}>
                      {item.done && <Check size={11} strokeWidth={3.5} />}
                    </div>
                    <span className={cn(
                      'text-xs font-semibold leading-relaxed',
                      item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'
                    )}>{item.tip}</span>
                  </button>
                ))
              }
            </div>

            <button
              onClick={() => {
                if (nextInterview) setPrepModal({ open: true, guide: buildPrepGuide(nextInterview) });
                else showToast('No active interview for a prep guide.', 'error');
              }}
              className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
            ><BookOpen size={13} /> Open Prep Guide</button>
          </div>

          {/* Quick tip card */}
          <div className="card p-5 sm:p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={13} className="text-amber-500" /> Interview Tip
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Research the company's recent news and focus on how your experience aligns with their current goals. Tailor each answer to their specific context.
            </p>
          </div>
        </div>
      </div>

      {/* ── Prep Guide Modal ─────────────────────────────────────────── */}
      <CenterModal isOpen={prepModal.open} onClose={() => setPrepModal({ open: false, guide: null })} title="Interview Prep Guide" maxWidth="max-w-2xl">
        {prepModal.guide && (
          <div className="p-6 space-y-6 text-left">
            <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
              <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-primary-100 dark:border-primary-900">Prep Module</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-3 mb-1">{prepModal.guide.round}</h2>
              <p className="text-sm text-slate-500">{prepModal.guide.role} at {prepModal.guide.company}</p>
            </div>
            <div className="space-y-5">
              <section className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Laptop size={13} /> Focus Objectives</h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {prepModal.guide.focusArea}
                </p>
              </section>
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={13} /> Action Checklist</h4>
                {prepModal.guide.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </section>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button className="btn-primary" onClick={() => setPrepModal({ open: false, guide: null })}>I'm Prepared</button>
            </div>
          </div>
        )}
      </CenterModal>

      {/* ── Interview Detail Modal ───────────────────────────────────── */}
      <CenterModal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, interview: null })} title="Interview Details">
        {detailModal.interview && (() => {
          const iv = detailModal.interview;
          return (
            <div className="p-5 sm:p-6 space-y-6 text-left">
              {/* Header */}
              <div className="flex items-start gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shrink-0">
                  {(iv.company || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{iv.role}</h2>
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate">{iv.company}</p>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 uppercase">{iv.round} Interview</span>
                    <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border', getStatusStyle(iv.status))}>{iv.status}</span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Left */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Schedule</h4>
                    {[['Date', iv.date], ['Time', `${iv.time} ${iv.timezone || ''}`], ['Mode', iv.type || 'Video Call']].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-medium">{k}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Avatar src={iv.interviewerImg || ''} alt={iv.interviewer} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{iv.interviewer || 'Hiring Lead'}</p>
                      <p className="text-[10px] font-bold text-primary-600 mt-0.5 uppercase">{iv.interviewerRole || 'Recruiting Panel'}</p>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="space-y-4">
                  {iv.link && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                      <h4 className="text-[10px] font-bold text-emerald-600 mb-2 flex items-center gap-1.5"><Video size={12} /> Meeting Link</h4>
                      <a href={iv.link} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 break-all underline hover:no-underline line-clamp-2">
                        {iv.link}
                      </a>
                    </div>
                  )}
                  {iv.status === 'Completed' && iv.feedback && !iv.feedback.startsWith('[') && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1.5"><Info size={12} /> Feedback</h4>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{iv.feedback}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setDetailModal({ open: false, interview: null }); setPrepModal({ open: true, guide: buildPrepGuide(iv) }); }}
                    className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
                  ><BookOpen size={13} /> Prep Guide</button>
                </div>
              </div>

              {/* Actions */}
              {iv.status === 'Scheduled' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button className="btn-secondary flex-1 text-xs flex items-center justify-center gap-2"
                    onClick={() => { setRescheduleForm({ proposedDate: '', proposedTime: '', reason: '' }); setRescheduleModal({ open: true, interview: iv }); }}>
                    <VideoOff size={14} /> Reschedule
                  </button>
                  <button className="btn-secondary flex-1 text-xs flex items-center justify-center gap-2 text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => { setCancelReason(''); setCancelModal({ open: true, interview: iv }); }}>
                    <XCircle size={14} /> Cancel
                  </button>
                  {iv.link && (
                    <button className="btn-primary flex-1 text-xs flex items-center justify-center gap-2"
                      onClick={() => handleJoin(iv.link)}>
                      <Play size={14} fill="currentColor" /> Join Interview
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </CenterModal>

      {/* ── Reschedule Modal ─────────────────────────────────────────── */}
      <CenterModal isOpen={rescheduleModal.open} onClose={() => !actionLoading && setRescheduleModal({ open: false, interview: null })} title="Request Reschedule" maxWidth="max-w-md">
        <div className="p-5 sm:p-6 space-y-5 text-left">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Your request will be sent to <span className="font-bold">{rescheduleModal.interview?.company}</span>'s recruiting team.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Proposed Date (optional)</label>
              <input type="date" value={rescheduleForm.proposedDate}
                onChange={e => setRescheduleForm(f => ({ ...f, proposedDate: e.target.value }))}
                className="hcm-input w-full" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Proposed Time (optional)</label>
              <input type="time" value={rescheduleForm.proposedTime}
                onChange={e => setRescheduleForm(f => ({ ...f, proposedTime: e.target.value }))}
                className="hcm-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Reason <span className="text-rose-500">*</span></label>
              <textarea value={rescheduleForm.reason}
                onChange={e => setRescheduleForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Briefly explain why you need to reschedule..."
                rows={3} className="hcm-input w-full resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setRescheduleModal({ open: false, interview: null })} disabled={actionLoading}>Cancel</button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={submitReschedule} disabled={actionLoading}>
              {actionLoading ? <><RefreshCw size={13} className="animate-spin" /> Sending...</> : 'Send Request'}
            </button>
          </div>
        </div>
      </CenterModal>

      {/* ── Cancel Modal ─────────────────────────────────────────────── */}
      <CenterModal isOpen={cancelModal.open} onClose={() => !actionLoading && setCancelModal({ open: false, interview: null })} title="Cancel Interview" maxWidth="max-w-sm">
        <div className="p-5 sm:p-6 space-y-5 text-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mx-auto text-rose-500 border border-rose-100 dark:border-rose-900/30">
            <AlertCircle size={30} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Cancellation</h3>
            <p className="text-sm text-slate-500 mt-1.5">
              This will cancel your interview at <span className="font-bold text-slate-700 dark:text-slate-200">{cancelModal.interview?.company}</span>.
            </p>
          </div>
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Reason (optional)</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Let them know why you're cancelling..." rows={2} className="hcm-input w-full resize-none" />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setCancelModal({ open: false, interview: null })} disabled={actionLoading}>Keep Interview</button>
            <button className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700 border-rose-600 flex items-center justify-center gap-2" onClick={submitCancel} disabled={actionLoading}>
              {actionLoading ? <><RefreshCw size={13} className="animate-spin" /> Cancelling...</> : <><XCircle size={13} /> Cancel</>}
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default InterviewSchedule;

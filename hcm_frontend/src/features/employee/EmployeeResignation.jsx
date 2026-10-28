import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Calendar, CheckCircle2, Clock, XCircle, AlertCircle,
  FileText, ChevronRight, MessageSquare, User, Shield, RefreshCw,
  CalendarCheck, Briefcase, AlertTriangle, Info
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return '—'; }
};

const calcNoticeDays = (submissionDate, lastWorkingDay) => {
  if (!submissionDate || !lastWorkingDay) return null;
  const diff = Math.ceil((new Date(lastWorkingDay) - new Date(submissionDate)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const STATUS_CONFIG = {
  INITIATED:                  { label: 'Initiated',              color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-100', icon: Clock },
  PENDING_MANAGER_APPROVAL:   { label: 'Pending Manager Review', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100', icon: Clock },
  PENDING_HR_APPROVAL:        { label: 'Pending HR Review',      color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-100',  icon: Clock },
  APPROVED:                   { label: 'Approved',               color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
  CLEARANCE_IN_PROGRESS:      { label: 'Clearance In Progress',  color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-100', icon: Shield },
  EMPLOYEE_RELIEVED:          { label: 'Relieved',               color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
  COMPLETED:                  { label: 'Completed',              color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
  REJECTED_BY_MANAGER:        { label: 'Rejected by Manager',    color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-100',   icon: XCircle },
  REJECTED_BY_HR:             { label: 'Rejected by HR',         color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-100',   icon: XCircle },
  CANCELLED:                  { label: 'Cancelled',              color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-100', icon: XCircle },
};

const StatusBadge = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] || { label: status?.replace(/_/g, ' ') || 'Unknown', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: Info };
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-lg border',
      cfg.bg, cfg.color, cfg.border,
      size === 'sm' ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'
    )}>
      <Icon size={size === 'sm' ? 11 : 13} />
      {cfg.label}
    </span>
  );
};

// Workflow steps for the stepper
const WORKFLOW_STEPS = [
  { key: 'INITIATED',                 label: 'Submitted' },
  { key: 'PENDING_MANAGER_APPROVAL',  label: 'Manager Review' },
  { key: 'PENDING_HR_APPROVAL',       label: 'HR Review' },
  { key: 'APPROVED',                  label: 'Approved' },
  { key: 'CLEARANCE_IN_PROGRESS',     label: 'Clearance' },
  { key: 'EMPLOYEE_RELIEVED',         label: 'Relieved' },
];

const STEP_ORDER = ['INITIATED', 'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'APPROVED', 'CLEARANCE_IN_PROGRESS', 'EMPLOYEE_RELIEVED', 'COMPLETED'];

const getStepIndex = (status) => {
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
};

const WorkflowStepper = ({ status }) => {
  const currentIdx = getStepIndex(status);
  const isRejected = status?.includes('REJECTED');

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max mx-auto px-2">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = !isRejected && currentIdx > i;
          const active = !isRejected && currentIdx === i;
          const rejected = isRejected && i === 1; // mark manager step as rejected
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 font-black text-xs transition-all',
                  done ? 'bg-emerald-500 border-emerald-500 text-white' :
                  active ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' :
                  rejected ? 'bg-rose-500 border-rose-500 text-white' :
                  'bg-white border-slate-200 text-slate-400'
                )}>
                  {done ? <CheckCircle2 size={16} /> : rejected ? <XCircle size={16} /> : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] font-bold text-center whitespace-nowrap',
                  done || active ? 'text-slate-700' : 'text-slate-400'
                )}>
                  {step.label}
                </span>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mb-5 min-w-[2rem]',
                  done ? 'bg-emerald-400' : 'bg-slate-200'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────
const EmployeeResignation = () => {
  const { showToast, service } = useEmployee();
  const [active, setActive] = useState(null);     // active resignation
  const [history, setHistory] = useState([]);      // all history
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ reason: '', lastWorkingDay: '' });

  // ── Fetch ────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await service.getResignation();
      const data = res.data?.data;
      // Support both old (single object) and new (active + history) API shape
      if (data && typeof data === 'object' && 'history' in data) {
        setActive(data.active);
        setHistory(data.history || []);
      } else if (data && data.id) {
        // Old API: single record
        setActive(data);
        setHistory([data]);
      } else {
        setActive(null);
        setHistory([]);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showToast('Failed to load resignation details.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [service, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim() || !formData.lastWorkingDay) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(formData.lastWorkingDay) <= today) {
      showToast('Last working day must be in the future.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await service.submitResignation(formData);
      showToast('Resignation submitted successfully.');
      setShowForm(false);
      setFormData({ reason: '', lastWorkingDay: '' });
      await fetchData(true);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Failed to submit resignation.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isRejected = active && (active.status === 'REJECTED_BY_MANAGER' || active.status === 'REJECTED_BY_HR');
  const noticeDays = active ? calcNoticeDays(active.submissionDate, active.finalLastWorkingDay || active.lastWorkingDay) : null;

  // ── Determine today min date for LWD ───────────────────
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  if (loading) {
    return (
      <div className="space-y-6 pb-12 text-left">
        <div className="text-center py-20">
          <div className="w-14 h-14 border-4 border-t-primary-600 border-primary-100 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading resignation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">

      {/* ── Header ─────────────────────────────────────── */}
      <PageHeader
        title="Resignation"
        subtitle="Manage your resignation request and track its status"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchData(true)}
            isDisabled={refreshing}
            isLoading={refreshing}
            leftIcon={RefreshCw}
          >
            Refresh
          </Button>
          {/* Allow new submission only if no active or last was rejected */}
          {(!active || isRejected) && !showForm && (
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              leftIcon={LogOut}
            >
              Submit Resignation
            </Button>
          )}
        </div>
      </PageHeader>

      {/* ── Active Resignation Card ──────────────────────── */}
      <AnimatePresence mode="popLayout">
        {active && !showForm && (
          <motion.div
            key="active-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card border border-slate-100 overflow-hidden"
          >
            {/* Status Header */}
            <div className={cn(
              'px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3',
              isRejected ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  isRejected ? 'bg-rose-100 text-rose-600' : 'bg-primary-50 text-primary-600'
                )}>
                  <LogOut size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Resignation</p>
                  <p className="text-sm font-bold text-slate-900">Submitted {fmtDate(active.submissionDate)}</p>
                </div>
              </div>
              <StatusBadge status={active.status} />
            </div>

            {/* Workflow Stepper */}
            {!isRejected && (
              <div className="px-6 py-5 border-b border-slate-100">
                <WorkflowStepper status={active.status} />
              </div>
            )}

            {/* Details Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted On</p>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CalendarCheck size={15} className="text-primary-500 shrink-0" />
                  {fmtDate(active.submissionDate)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposed Last Day</p>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Calendar size={15} className="text-amber-500 shrink-0" />
                  {fmtDate(active.lastWorkingDay)}
                </div>
              </div>

              {noticeDays !== null && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice Period</p>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Briefcase size={15} className="text-indigo-500 shrink-0" />
                    {noticeDays} {noticeDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
              )}

              {active.finalLastWorkingDay && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Last Day</p>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 size={15} className="shrink-0" />
                    {fmtDate(active.finalLastWorkingDay)}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Resignation</p>
                <p className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 leading-relaxed">
                  {active.reason || 'No reason provided.'}
                </p>
              </div>

              {active.managerComment && (
                <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={11} /> Manager's Feedback
                  </p>
                  <p className={cn(
                    'p-4 rounded-xl border text-sm leading-relaxed',
                    isRejected ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'
                  )}>
                    {active.managerComment}
                  </p>
                </div>
              )}

              {active.hrComment && (
                <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield size={11} /> HR's Comments
                  </p>
                  <p className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 leading-relaxed">
                    {active.hrComment}
                  </p>
                </div>
              )}
            </div>

            {/* Rejected CTA */}
            {isRejected && (
              <div className="px-6 pb-6">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-700 font-medium">
                      Your resignation request was rejected. You may submit a new request after addressing the feedback.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowForm(true)}
                    leftIcon={LogOut}
                  >
                    New Request
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── No Active Resignation ───────────────────────── */}
        {!active && !showForm && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card py-16"
          >
            <EmptyState
              icon={LogOut}
              title="No Active Resignation"
              description="You haven't submitted a resignation request yet."
              action={
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                  leftIcon={LogOut}
                >
                  Submit Resignation
                </Button>
              }
            />
          </motion.div>
        )}

        {/* ── Submit Form ─────────────────────────────────── */}
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card border border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <LogOut size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Request</p>
                  <h3 className="text-base font-bold text-slate-900">Submit Resignation</h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowForm(false); setFormData({ reason: '', lastWorkingDay: '' }); }}
                className="p-1 h-auto text-slate-400 hover:text-slate-600"
              >
                <XCircle size={18} />
              </Button>
            </div>

            {/* Warning */}
            <div className="px-6 pt-5">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Before you proceed</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Submitting a resignation will start a formal exit workflow. Your manager and HR will review your request. Ensure you've discussed this with your team.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Last Working Day */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest form-label">
                  Proposed Last Working Day <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="date"
                    name="lastWorkingDay"
                    value={formData.lastWorkingDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastWorkingDay: e.target.value }))}
                    min={minDate}
                    required
                    className="input-field h-12 pl-10 bg-slate-50 border-transparent font-semibold"
                  />
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Info size={11} /> Notice period will be calculated from your submission date to this date.
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest form-label">
                  Reason for Resignation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please state your reason for resigning..."
                  rows={5}
                  required
                  className="input-field p-4 bg-slate-50 border-transparent font-medium resize-none textarea-field"
                />
                <p className="text-xs text-slate-400 text-right">{formData.reason.length} characters</p>
              </div>

              {/* Notice Period Preview */}
              {formData.lastWorkingDay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3"
                >
                  <Briefcase size={16} className="text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-indigo-700">Estimated Notice Period</p>
                    <p className="text-sm font-black text-indigo-900">
                      {calcNoticeDays(new Date().toISOString(), formData.lastWorkingDay)} days
                      <span className="text-xs font-semibold text-indigo-600 ml-2">
                        (Until {fmtDate(formData.lastWorkingDay)})
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="secondary"
                  onClick={() => { setShowForm(false); setFormData({ reason: '', lastWorkingDay: '' }); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isDisabled={submitting}
                  isLoading={submitting}
                  leftIcon={LogOut}
                >
                  Submit Resignation
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History Section ─────────────────────────────── */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Resignation History
          </h2>

          <div className="card border border-slate-100 divide-y divide-slate-100">
            {history.map((r, i) => (
              <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-black shrink-0">
                    {history.length - i}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Submitted {fmtDate(r.submissionDate)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Last Day: {fmtDate(r.finalLastWorkingDay || r.lastWorkingDay)}
                      {r.reason && <span className="ml-3 text-slate-400">— {r.reason.slice(0, 50)}{r.reason.length > 50 ? '…' : ''}</span>}
                    </p>
                  </div>
                </div>
                <StatusBadge status={r.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeResignation;

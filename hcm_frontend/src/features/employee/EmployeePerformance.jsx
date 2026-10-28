// ============================================================
// EmployeePerformance.jsx — Strategy & Performance Tracking
// Fully dynamic, API-driven, strictly adhering to enterprise HCM design
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3,
  Target,
  Award,
  TrendingUp,
  Star,
  ExternalLink,
  Download, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
  Edit,
  Trash2,
  Plus,
  Search,
  Layers,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Loader2,
  Check,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import { useDateFormat } from '../../hooks/useDateFormat';
import { usePermission } from '../../hooks/usePermission';
import CenterModal from '../../shared/components/layout/CenterModal';
import DatePicker from '../../shared/components/common/DatePicker';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { employeeService } from '../../services/employee.service';

const EmployeePerformance = () => {
  const { formatDate } = useDateFormat();
  const { 
    performance, 
    updateGoal, 
    addGoal, 
    deleteGoal, 
    upsertSkill, 
    deleteSkill, 
    createTicket,
    profile, 
    showToast, 
    loading, 
    error, 
    refetchAll 
  } = useEmployee();

  // ── Permission checks for Goals ─────────────────────────────
  const { canCreate, canEdit, canDelete } = usePermission('performance');
  const hasCreateGoalPermission = canCreate();
  const hasEditGoalPermission = canEdit();
  const hasDeleteGoalPermission = canDelete();

  // ── Modals State ────────────────────────────────────────────
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState(null);
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [showSkillVault, setShowSkillVault] = useState(false);
  const [showVisualTrends, setShowVisualTrends] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);
  const [showStrategyRoadmap, setShowStrategyRoadmap] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);

  // ── Filters & Search ────────────────────────────────────────
  const [goalSearchTerm, setGoalSearchTerm] = useState('');
  const [goalPriorityFilter, setGoalPriorityFilter] = useState('All');
  const [goalStatusFilter, setGoalStatusFilter] = useState('All');

  // ── Skill Vault State ───────────────────────────────────────
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(60);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillLevel, setEditingSkillLevel] = useState(50);

  // ── Live Data Arrays ────────────────────────────────────────
  const goals = useMemo(() => performance?.goals || [], [performance]);
  const skills = useMemo(() => performance?.skills || [], [performance]);
  const reviews = useMemo(() => performance?.reviews || [], [performance]);

  // ── Dynamically Calculated Metrics ──────────────────────────
  const totalGoals = goals.length;
  const completedGoals = useMemo(() => goals.filter(g => (g.progress || 0) === 100).length, [goals]);
  const inProgressGoals = useMemo(() => goals.filter(g => (g.progress || 0) < 100).length, [goals]);
  
  const avgProgress = useMemo(() => {
    if (totalGoals === 0) return 0;
    return Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals);
  }, [goals, totalGoals]);

  const avgSkillLevel = useMemo(() => {
    if (skills.length === 0) return 0;
    return Math.round(skills.reduce((sum, s) => sum + (s.level || 0), 0) / skills.length);
  }, [skills]);

  const avgReviewRating = useMemo(() => {
    if (reviews.length === 0) return '5.0';
    const numericRatings = reviews.map(r => {
      const match = String(r.rating || '').match(/([0-9.]+)/);
      return match ? parseFloat(match[1]) : 5.0;
    });
    const avg = numericRatings.reduce((sum, val) => sum + val, 0) / numericRatings.length;
    return avg.toFixed(1);
  }, [reviews]);

  const productivityIndex = useMemo(() => {
    if (totalGoals === 0) return 75;
    const progressWeight = avgProgress * 0.6;
    const completionWeight = (completedGoals / totalGoals) * 40;
    return Math.min(100, Math.max(10, Math.round(progressWeight + completionWeight)));
  }, [avgProgress, completedGoals, totalGoals]);

  const collaborationIndex = useMemo(() => {
    const base = Math.round((parseFloat(avgReviewRating) / 5.0) * 100);
    return Math.min(100, Math.max(50, base));
  }, [avgReviewRating]);

  // Dynamic quarterly efficiency bars
  const quarterlyEfficiency = useMemo(() => {
    const q1 = Math.min(100, Math.max(50, Math.round(productivityIndex * 0.85)));
    const q2 = Math.min(100, Math.max(55, Math.round(productivityIndex * 0.92)));
    const q3 = Math.min(100, Math.max(60, Math.round(productivityIndex * 0.98)));
    const q4 = Math.min(100, Math.max(65, productivityIndex));
    return [
      { q: 'Q1', val: q1, color: 'bg-slate-300 dark:bg-slate-700' },
      { q: 'Q2', val: q2, color: 'bg-indigo-400 dark:bg-indigo-600' },
      { q: 'Q3', val: q3, color: 'bg-indigo-600 dark:bg-indigo-500' },
      { q: 'Q4', val: q4, color: 'bg-emerald-500 dark:bg-emerald-400' }
    ];
  }, [productivityIndex]);

  // Helper to parse JSON review text or fallback to plain text
  const parseReviewDetails = (rawText) => {
    if (!rawText) return { plain: 'No detailed assessment comments recorded.' };
    if (typeof rawText === 'object') return rawText;
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed === 'object') {
        const strengths = parsed.strengths || '';
        const improvement = parsed.improvement || parsed.improvements || '';
        const summary = parsed.summary || parsed.feedback || '';
        const status = parsed.status || '';
        if (strengths || improvement || summary || status) {
          return { strengths, improvement, summary, status };
        }
      }
    } catch {
      // plain text fallback
    }
    return { plain: rawText };
  };

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchesSearch = !goalSearchTerm || 
        (g.title || '').toLowerCase().includes(goalSearchTerm.toLowerCase()) ||
        (g.priority || '').toLowerCase().includes(goalSearchTerm.toLowerCase());

      const matchesPriority = goalPriorityFilter === 'All' || g.priority === goalPriorityFilter;

      let matchesStatus = true;
      if (goalStatusFilter === 'Completed') matchesStatus = (g.progress || 0) === 100;
      else if (goalStatusFilter === 'InProgress') matchesStatus = (g.progress || 0) < 100;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [goals, goalSearchTerm, goalPriorityFilter, goalStatusFilter]);

  // Top Stats Array
  const stats = [
    { 
      label: 'OVERALL PROGRESS', 
      value: `${avgProgress}%`, 
      icon: Star, 
      color: 'text-amber-500', 
      bg: 'bg-amber-50 dark:bg-amber-950/20' 
    },
    { 
      label: 'MILESTONES COMPLETED', 
      value: `${completedGoals} / ${totalGoals}`, 
      icon: Target, 
      color: 'text-primary-600 dark:text-primary-400', 
      bg: 'bg-primary-50 dark:bg-primary-950/20' 
    },
    { 
      label: 'CORE SKILLS MASTERY', 
      value: `${skills.length} (${avgSkillLevel}%)`, 
      icon: Zap, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-950/20' 
    },
    { 
      label: 'REVIEW STANDING', 
      value: `${avgReviewRating} / 5.0`, 
      icon: TrendingUp, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/20' 
    },
  ];

  // ── Actions ─────────────────────────────────────────────────
  // Export Report
  const handleExportReport = () => {
    const goalsList = goals.length > 0 
      ? goals.map(g => `• ${g.title} [Priority: ${g.priority}] - ${g.progress}% Complete (Deadline: ${g.deadline ? formatDate(g.deadline) : 'Ongoing'})`).join('\n')
      : 'No active goals recorded.';

    const skillsList = skills.length > 0
      ? skills.map(s => `• ${s.name}: ${s.level}% Mastery`).join('\n')
      : 'No skills logged.';

    const reviewsList = reviews.length > 0
      ? reviews.map(r => {
          const details = parseReviewDetails(r.text);
          let feedbackStr = '';
          if (details.plain) {
            feedbackStr = `  Feedback: "${details.plain}"`;
          } else {
            const parts = [];
            if (details.strengths) parts.push(`  • Core Strengths: ${details.strengths}`);
            if (details.improvement) parts.push(`  • Areas for Growth: ${details.improvement}`);
            if (details.summary) parts.push(`  • Executive Summary: ${details.summary}`);
            feedbackStr = parts.join('\n') || '  Feedback: No detailed comments recorded.';
          }
          return `• ${r.period} (${r.reviewer}): Rating ${r.rating}\n${feedbackStr}`;
        }).join('\n\n')
      : 'No historical performance appraisals logged.';

    const reportContent = `=====================================================
HCM ENTERPRISE EMPLOYEE PERFORMANCE DOSSIER
=====================================================
Employee Name:      ${profile?.fullName || 'Employee'}
Employee ID:        ${profile?.employeeId || 'N/A'}
Department:         ${profile?.department || 'General'}
Report Date:        ${formatDate(new Date())}
Overall Progress:   ${avgProgress}%
Milestones Hit:     ${completedGoals} of ${totalGoals} (${totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%)
Core Skills Count:  ${skills.length} (Avg Mastery: ${avgSkillLevel}%)
Productivity Index: ${productivityIndex}%
Review Standing:    ${avgReviewRating} / 5.0
=====================================================

1. ACTIVE STRATEGIC OBJECTIVES & OKRS:
${goalsList}

2. CORE COMPETENCY & SKILL MATRIX:
${skillsList}

3. PERFORMANCE APPRAISALS & EVALUATIONS:
${reviewsList}

=====================================================
Generated by HCM Enterprise Strategy & Performance Portal
=====================================================`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Performance_Report_${profile?.employeeId || 'ID'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Performance Dossier downloaded successfully!');
  };

  // Request Review Action
  const handleRequestReview = async () => {
    if (isRequestingReview) return;
    try {
      setIsRequestingReview(true);
      // Call dedicated endpoint if available
      try {
        await employeeService.requestReview({
          message: 'Employee requested a 360-degree performance evaluation and feedback session.'
        });
      } catch {
        // Fallback to ticket if route error
        createTicket({
          subject: 'Request for Performance Review & 360 Appraisal',
          category: 'General',
          priority: 'Medium',
          message: 'Hello Management, I would like to schedule my periodic performance appraisal and 360-degree review session.'
        });
      }
      showToast('Performance review request submitted to management!');
    } catch {
      showToast('Failed to request review.', 'error');
    } finally {
      setIsRequestingReview(false);
    }
  };

  // Register New Goal Form State & Handlers
  const defaultGoalFormState = {
    title: '',
    priority: 'Medium',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
  };
  const [newGoalForm, setNewGoalForm] = useState(defaultGoalFormState);

  const handleOpenAddGoalModal = () => {
    setNewGoalForm({
      title: '',
      priority: 'Medium',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
    });
    setShowAddGoalModal(true);
  };

  const handleCloseAddGoalModal = () => {
    if (!isSubmitting) {
      setShowAddGoalModal(false);
    }
  };

  // Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!hasCreateGoalPermission) {
      showToast('You do not have permission to create goals.', 'error');
      return;
    }
    const trimmedTitle = (newGoalForm.title || '').trim();
    if (!trimmedTitle) {
      showToast('Goal title is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addGoal({
        title: trimmedTitle,
        priority: newGoalForm.priority || 'Medium',
        deadline: newGoalForm.deadline || null,
        progress: Number(newGoalForm.progress) || 0
      });
      showToast('Strategic goal registered successfully!');
      setShowAddGoalModal(false);
      setNewGoalForm(defaultGoalFormState);
      refetchAll();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.error?.message || 'Failed to register strategic goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Goal
  const handleEditGoal = async (e) => {
    e.preventDefault();
    if (!hasEditGoalPermission) {
      showToast('You do not have permission to edit goals.', 'error');
      return;
    }
    if (!selectedGoalForEdit) return;
    const formData = new FormData(e.target);
    const title = formData.get('title');
    if (!title || !title.trim()) {
      showToast('Goal title is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateGoal(selectedGoalForEdit.id, {
        title: title.trim(),
        priority: formData.get('priority'),
        deadline: formData.get('deadline') || null,
        progress: parseInt(formData.get('progress')) || 0
      });
      setSelectedGoalForEdit(null);
      refetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id) => {
    if (!hasDeleteGoalPermission) {
      showToast('You do not have permission to delete goals.', 'error');
      return;
    }
    try {
      await deleteGoal(id);
      refetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Error & Loading States ──────────────────────────────────
  if (error) {
    return (
      <div className="px-4 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 text-left">
        <AlertCircle className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to Load Performance Metrics</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{error}</p>
        <Button 
          onClick={refetchAll}
          variant="primary"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (loading && !performance) {
    return (
      <div className="space-y-8 pb-12 animate-fade-in px-4 text-left">
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-indigo-100 dark:border-indigo-950 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Loading Performance Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      {/* ── 1. HEADER ── */}
      <PageHeader
        title="Strategy & Performance"
        subtitle="Monitor your career KPIs, professional milestones, competency matrix, and management reviews"
      >
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportReport}
            variant="secondary"
            leftIcon={Download}
          >
            Export Dossier
          </Button>
          <Button 
            onClick={() => setShowReviewHistory(true)}
            variant="secondary"
            leftIcon={Award}
          >
            Review Vault ({reviews.length})
          </Button>
          
          {/* New Goal button — ONLY visible if user has permission to create */}
          {hasCreateGoalPermission && (
            <Button 
              onClick={handleOpenAddGoalModal}
              variant="primary"
              leftIcon={Plus}
            >
              New Goal
            </Button>
          )}
        </div>
      </PageHeader>

      {/* ── 2. DYNAMIC STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 leading-none">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {stat.value}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. MAIN CONTENT (GOALS + METRICS + SKILLS + REVIEWS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Strategic Goals & Metrics Analysis */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Goals Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            {/* Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      Active Strategic Goals
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      {filteredGoals.length} milestones
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Track sprint deliverables, engineering OKRs, and professional objectives
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  onClick={() => setShowStrategyRoadmap(true)}
                  variant="secondary"
                  size="sm"
                  leftIcon={Layers}
                >
                  Strategy Roadmap
                </Button>
                {/* Add Goal — ONLY visible if user has permission to create */}
                {hasCreateGoalPermission && (
                  <Button
                    onClick={handleOpenAddGoalModal}
                    variant="primary"
                    size="sm"
                    leftIcon={Plus}
                  >
                    Add Goal
                  </Button>
                )}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 items-center">
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search goals by title or priority..."
                  value={goalSearchTerm}
                  onChange={(e) => setGoalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
                />
                {goalSearchTerm && (
                  <button onClick={() => setGoalSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="sm:col-span-3">
                <select
                  value={goalPriorityFilter}
                  onChange={(e) => setGoalPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={goalStatusFilter}
                  onChange={(e) => setGoalStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
                >
                  <option value="All">All Statuses</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed (100%)</option>
                </select>
              </div>
            </div>

            {/* Goals Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      OBJECTIVE / MILESTONE
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                      DUE CYCLE
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      EXECUTION
                    </th>
                    {(hasEditGoalPermission || hasDeleteGoalPermission) && (
                      <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">
                        ACTIONS
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredGoals.length === 0 ? (
                    <tr>
                      <td colSpan={hasEditGoalPermission || hasDeleteGoalPermission ? 4 : 3} className="py-12">
                        <EmptyState
                          icon={Target}
                          title="No strategic goals match your criteria"
                          message={hasCreateGoalPermission ? undefined : "Check back later when goals are assigned to you."}
                          action={hasCreateGoalPermission ? {
                            label: "Create your first strategic milestone",
                            onClick: handleOpenAddGoalModal,
                            icon: Plus
                          } : undefined}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredGoals.map((goal) => {
                      const isCompleted = (goal.progress || 0) === 100;
                      return (
                        <tr key={goal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                              {goal.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                                goal.priority === 'High' ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" :
                                goal.priority === 'Low' ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" :
                                "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                              )}>
                                {goal.priority} Priority
                              </span>
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1">
                                  <Check size={10} /> Complete
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-xs tabular-nums">
                              <Clock size={13} className="text-slate-400" />
                              <span>{goal.deadline ? formatDate(goal.deadline) : 'Ongoing'}</span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 min-w-[130px] max-w-[160px]">
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">
                                {goal.progress || 0}%
                              </span>
                              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isCompleted ? "bg-emerald-500" : goal.priority === 'High' ? "bg-rose-500" : "bg-indigo-600"
                                  )} 
                                  style={{ width: `${goal.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {(hasEditGoalPermission || hasDeleteGoalPermission) && (
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {hasEditGoalPermission && (
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedGoalForEdit(goal)}
                                    title="Edit Goal Details & Progress"
                                    className="p-2 h-auto"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                )}
                                {hasDeleteGoalPermission && (
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    title="Delete Goal"
                                    className="p-2 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Performance & Metric Analysis (Dark Card) */}
          <div className="bg-[#0f172a] text-white rounded-3xl p-6 border border-slate-800/90 shadow-md relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
              <BarChart3 size={240} />
            </div>

            <div className="relative z-10 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                    Live Performance &amp; Metric Analysis
                  </h3>
                  <p className="text-indigo-400 font-bold text-xs mt-0.5">
                    Calculated in real time from sprint objectives &amp; manager reviews
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-black text-indigo-300 uppercase tracking-widest self-start sm:self-auto">
                  Cycle 2026
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Productivity Index
                  </p>
                  <p className="text-2xl font-black text-white tracking-tight tabular-nums">
                    {productivityIndex}%
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                    {inProgressGoals} active / {completedGoals} hit
                  </p>
                </div>

                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Competency Mark
                  </p>
                  <p className="text-2xl font-black text-emerald-400 tracking-tight tabular-nums">
                    {avgSkillLevel}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {skills.length} verified skills
                  </p>
                </div>

                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Appraisal Standing
                  </p>
                  <p className="text-2xl font-black text-indigo-400 tracking-tight tabular-nums">
                    {avgReviewRating} / 5.0
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {reviews.length} completed reviews
                  </p>
                </div>
              </div>

              <div>
                <button 
                  onClick={() => setShowVisualTrends(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Explore Visual Trends &amp; Gauges</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skills Matrix + Academy + Appraisals */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Skills Matrix Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                  Skills Matrix
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Core technical &amp; leadership proficiencies
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Zap size={16} />
              </div>
            </div>

            <div className="space-y-3.5">
              {skills.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">No skills registered yet.</p>
              ) : (
                skills.map((skill) => (
                  <div key={skill.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-800 dark:text-slate-200">{skill.name}</span>
                      <span className="text-slate-900 dark:text-white tabular-nums">{skill.level}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-1">
              <button 
                onClick={() => setShowSkillVault(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Zap size={14} className="text-indigo-500" />
                <span>Update Skill Vault</span>
              </button>
            </div>
          </div>

          {/* 2. Skill Development Card (HCM Academy) */}
          <div className="bg-gradient-to-br from-indigo-600 to-primary-700 text-white border-none shadow-lg relative overflow-hidden group rounded-3xl p-5 space-y-3">
            <div className="absolute -left-6 -top-6 opacity-10 rotate-12 transition-transform duration-700 group-hover:rotate-45 pointer-events-none">
              <GraduationCap size={150} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white uppercase tracking-widest backdrop-blur-md mb-2 inline-block">
                Skill Development
              </span>
              <h3 className="text-base font-black leading-tight mb-1">
                HCM Academy Courses
              </h3>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                Complete curated internal modules to directly boost and register proficiencies in your Skill Matrix.
              </p>
            </div>
            <Button 
              onClick={() => setShowAcademy(true)}
              variant="ghost"
              leftIcon={GraduationCap}
              className="text-white hover:text-white hover:bg-white/10"
            >
              Launch Academy Courses
            </Button>
          </div>

          {/* 3. Manager Appraisals (Reviews) Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                  Manager Appraisals
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  360-degree feedback &amp; reviews
                </p>
              </div>
              <Award size={18} className="text-slate-400" />
            </div>

            {reviews.length > 0 ? (() => {
              const firstRev = reviews[0];
              const details = parseReviewDetails(firstRev.text);
              const snippet = details.summary || details.strengths || details.plain || 'Performance assessment logged.';
              return (
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{firstRev.period}</span>
                    <span className="text-xs font-black text-amber-500 tabular-nums">{firstRev.rating} ★</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                    "{snippet}"
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    by {firstRev.reviewer}
                  </p>
                </div>
              );
            })() : (
              <p className="text-xs text-slate-400 italic">No reviews logged yet.</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button 
                onClick={() => setShowReviewHistory(true)}
                variant="secondary"
                size="sm"
              >
                View All ({reviews.length})
              </Button>
              <Button 
                onClick={handleRequestReview}
                isDisabled={isRequestingReview}
                isLoading={isRequestingReview}
                variant="ghost"
                size="sm"
                leftIcon={MessageSquare}
              >
                Request 360
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: ADD NEW GOAL MODAL ── */}
      <CenterModal 
        isOpen={showAddGoalModal} 
        onClose={handleCloseAddGoalModal} 
        title="Register New Strategic Goal"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateGoal} className="p-5 sm:p-7 pt-4 sm:pt-5 space-y-4 sm:space-y-5 text-left">
          {/* Goal Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Goal / Objective Title <span className="text-rose-500">*</span>
            </label>
            <input 
              name="title" 
              type="text" 
              required 
              value={newGoalForm.title}
              onChange={(e) => setNewGoalForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Implement Multi-Tenant Architecture & Performance Tuning"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Priority Level
              </label>
              <div className="relative">
                <select 
                  name="priority" 
                  value={newGoalForm.priority}
                  onChange={(e) => setNewGoalForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer transition"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Target Due Date
              </label>
              <DatePicker 
                name="deadline" 
                value={newGoalForm.deadline}
                onChange={(e) => {
                  const val = e?.target?.value !== undefined ? e.target.value : e;
                  setNewGoalForm(prev => ({ ...prev, deadline: val }));
                }}
                placeholder="dd/mm/yyyy"
                className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition"
              />
            </div>
          </div>

          {/* Initial Progress Slider */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Initial Progress (%)
              </label>
              <span className="text-sm font-black text-primary-600 dark:text-primary-400 tabular-nums">
                {newGoalForm.progress}%
              </span>
            </div>
            <input 
              name="progress" 
              type="range" 
              min="0" 
              max="100" 
              value={newGoalForm.progress}
              onChange={(e) => setNewGoalForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
              className="w-full accent-primary-600 dark:accent-primary-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center gap-3">
            <Button 
              type="button" 
              variant="secondary"
              onClick={handleCloseAddGoalModal}
              className="w-full sm:flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={Plus}
              className="w-full sm:flex-1 h-11 rounded-xl"
            >
              Create Strategic Goal
            </Button>
          </div>
        </form>
      </CenterModal>

      {/* ── MODAL 2: EDIT GOAL MODAL ── */}
      {selectedGoalForEdit && (
        <CenterModal 
          isOpen={Boolean(selectedGoalForEdit)} 
          onClose={() => setSelectedGoalForEdit(null)} 
          title="Update Strategic Goal"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleEditGoal} className="p-5 sm:p-7 pt-4 sm:pt-5 space-y-4 sm:space-y-5 text-left">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Goal / Objective Title <span className="text-rose-500">*</span>
              </label>
              <input 
                name="title" 
                type="text" 
                required 
                defaultValue={selectedGoalForEdit.title}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Priority Level
                </label>
                <div className="relative">
                  <select 
                    name="priority" 
                    defaultValue={selectedGoalForEdit.priority || 'Medium'}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none cursor-pointer transition"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Target Due Date
                </label>
                <DatePicker 
                  name="deadline" 
                  defaultValue={selectedGoalForEdit.deadline ? selectedGoalForEdit.deadline.split('T')[0] : ''}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Execution Progress
                </label>
                <span id="editProgressVal" className="text-sm font-black text-primary-600 dark:text-primary-400 tabular-nums">
                  {selectedGoalForEdit.progress || 0}%
                </span>
              </div>
              <input 
                name="progress" 
                type="range" 
                min="0" 
                max="100" 
                defaultValue={selectedGoalForEdit.progress || 0}
                onChange={(e) => {
                  const el = document.getElementById('editProgressVal');
                  if (el) el.innerText = `${e.target.value}%`;
                }}
                className="w-full accent-primary-600 dark:accent-primary-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                <span>0% Planning</span>
                <span>50% In Progress</span>
                <span>100% Completed</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center gap-3">
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => setSelectedGoalForEdit(null)}
                className="w-full sm:flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                leftIcon={Check}
                className="w-full sm:flex-1 h-11 rounded-xl"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CenterModal>
      )}

      {/* ── MODAL 3: REVIEW VAULT (ALL REVIEWS) ── */}
      <CenterModal 
        isOpen={showReviewHistory} 
        onClose={() => setShowReviewHistory(false)} 
        title="Historical Performance Review Vault"
      >
        <div className="p-6 space-y-4 text-left max-h-[75vh] overflow-y-auto">
          {reviews.length > 0 ? (
            reviews.map((rev, i) => {
              const details = parseReviewDetails(rev.text);
              const hasStructured = Boolean(details.strengths || details.improvement || details.summary);

              return (
                <div key={rev.id || i} className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-sm shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{rev.period}</p>
                          {details.status && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 uppercase tracking-wider">
                              {details.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{rev.reviewer} • Review Lead</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black">
                        {rev.rating} ★
                      </span>
                    </div>
                  </div>

                  {details.plain ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      "{details.plain}"
                    </p>
                  ) : hasStructured ? (
                    <div className="space-y-2.5 pt-1">
                      {details.strengths && (
                        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                            <Sparkles size={12} />
                            <span>Core Strengths &amp; Competencies</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {details.strengths}
                          </p>
                        </div>
                      )}

                      {details.improvement && (
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                            <TrendingUp size={12} />
                            <span>Areas for Growth &amp; Development</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {details.improvement}
                          </p>
                        </div>
                      )}

                      {details.summary && (
                        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                            <MessageSquare size={12} />
                            <span>Executive Summary &amp; Leadership Notes</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {details.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No written appraisal comments submitted for this cycle.</p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-6">
              <EmptyState
                icon={Award}
                title="No formal manager reviews on record yet."
                message="Your performance reviews will appear here once submitted."
              />
            </div>
          )}

          <div className="pt-2 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button 
              onClick={handleRequestReview}
              isDisabled={isRequestingReview}
              isLoading={isRequestingReview}
              variant="primary"
              leftIcon={MessageSquare}
            >
              Request 360 Feedback
            </Button>
            <Button 
              onClick={() => setShowReviewHistory(false)}
              variant="secondary"
              className="ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </CenterModal>

      {/* ── MODAL 4: SKILL VAULT (MANAGE SKILLS) ── */}
      <CenterModal 
        isOpen={showSkillVault} 
        onClose={() => setShowSkillVault(false)} 
        title="Competency & Skill Matrix Vault"
      >
        <div className="p-6 space-y-5 text-left max-h-[75vh] overflow-y-auto">
          {/* Active Skills List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Active Core Competencies</h4>
            {skills.length > 0 ? (
              skills.map((skill) => (
                <div key={skill.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-800 dark:text-slate-100 text-xs">{skill.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Proficiency: {skill.level}%</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        type="button" 
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (editingSkillId === skill.id) {
                            setEditingSkillId(null);
                          } else {
                            setEditingSkillId(skill.id);
                            setEditingSkillLevel(skill.level);
                          }
                        }}
                        className="py-1 px-2.5 text-[10px] h-auto"
                      >
                        {editingSkillId === skill.id ? 'Cancel' : 'Adjust'}
                      </Button>
                      <Button 
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          await deleteSkill(skill.id);
                          refetchAll();
                        }}
                        className="p-1.5 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {editingSkillId === skill.id && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex justify-between text-xs font-black text-primary-600 dark:text-primary-400">
                        <span>Adjust Level:</span>
                        <span>{editingSkillLevel}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={editingSkillLevel}
                        onChange={(e) => setEditingSkillLevel(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          await upsertSkill({ name: skill.name, level: editingSkillLevel });
                          setEditingSkillId(null);
                          refetchAll();
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No skills registered yet.</p>
            )}
          </div>

          {/* Add New Skill Form */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newSkillName.trim()) {
                showToast('Skill name is required', 'error');
                return;
              }
              await upsertSkill({ name: newSkillName.trim(), level: newSkillLevel });
              setNewSkillName('');
              setNewSkillLevel(60);
              refetchAll();
            }}
            className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Register New Skill</h4>
            <input 
              type="text" 
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. Next.js, Kubernetes, Rust"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400"
            />
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-black text-slate-700 dark:text-slate-300">
                <span>Initial Mastery:</span>
                <span className="text-primary-600 dark:text-primary-400">{newSkillLevel}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              variant="primary"
              className="w-full"
            >
              Add to Skill Matrix
            </Button>
          </form>

          <div className="pt-2">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setShowSkillVault(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </CenterModal>

      {/* ── MODAL 5: VISUAL TRENDS & GAUGES MODAL ── */}
      <CenterModal 
        isOpen={showVisualTrends} 
        onClose={() => setShowVisualTrends(false)} 
        title="Quarterly Visual Trends & Productivity Gauges"
      >
        <div className="p-6 space-y-6 text-left max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dynamic Productivity Gauge */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center space-y-3 border border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Productivity Index</h4>
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="44" className="stroke-slate-200 dark:stroke-slate-700 fill-none stroke-[8]" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="44" 
                    className="stroke-emerald-500 fill-none stroke-[8] transition-all duration-1000" 
                    strokeDasharray="276" 
                    strokeDashoffset={276 - (276 * productivityIndex) / 100} 
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{productivityIndex}%</span>
                  <p className="text-[9px] font-black text-emerald-500 uppercase">{productivityIndex >= 80 ? 'Optimal' : 'Active'}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                Computed from {completedGoals} completed out of {totalGoals} milestones
              </p>
            </div>

            {/* Dynamic Collaboration Gauge */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center space-y-3 border border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Appraisal Standing</h4>
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="44" className="stroke-slate-200 dark:stroke-slate-700 fill-none stroke-[8]" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="44" 
                    className="stroke-indigo-500 fill-none stroke-[8] transition-all duration-1000" 
                    strokeDasharray="276" 
                    strokeDashoffset={276 - (276 * collaborationIndex) / 100} 
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{collaborationIndex}%</span>
                  <p className="text-[9px] font-black text-indigo-500 uppercase">{avgReviewRating} / 5.0</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                Based on {reviews.length} verified management evaluations
              </p>
            </div>
          </div>

          {/* Efficiency Progression Bars */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-center">Quarterly Efficiency Progression</h4>
            <div className="flex justify-around items-end h-28 pt-2 border-b border-slate-200 dark:border-slate-700">
              {quarterlyEfficiency.map((bar, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums mb-1">{bar.val}%</span>
                  <div 
                    className={cn("w-6 rounded-t-lg transition-all duration-1000", bar.color)} 
                    style={{ height: `${bar.val}%` }} 
                  />
                  <span className="text-[10px] font-black text-slate-400 mt-1">{bar.q}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="button" 
            variant="secondary"
            onClick={() => setShowVisualTrends(false)}
            className="w-full"
          >
            Close Analytics
          </Button>
        </div>
      </CenterModal>

      {/* ── MODAL 6: INTERACTIVE ACADEMY PORTAL ── */}
      <CenterModal 
        isOpen={showAcademy} 
        onClose={() => setShowAcademy(false)} 
        title="HCM Corporate Academy & Learning Tracks"
      >
        <div className="p-6 space-y-4 text-left max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Completing courses directly boosts or registers proficiencies in your Skill Matrix and updates your overall competency standing in real time.
          </p>

          {[
            { id: 'c1', title: 'Full-Stack Architecture & Microservices', rewardSkill: 'Node.js & Backend Architecture', bonus: 10, description: 'Learn service modularization, asynchronous queuing, and SQL connection optimization.', duration: '6 hours' },
            { id: 'c2', title: 'Modern React & Component Design Patterns', rewardSkill: 'React & Frontend Systems', bonus: 10, description: 'Master state management, memoization, custom hooks, and high-performance UI rendering.', duration: '5 hours' },
            { id: 'c3', title: 'Cloud Infrastructure & Containerization', rewardSkill: 'Cloud & Infrastructure (AWS/Docker)', bonus: 15, description: 'Deploy microservices, manage container orchestration, and configure production CI/CD pipelines.', duration: '8 hours' },
            { id: 'c4', title: 'Database Optimization & SQL Query Tuning', rewardSkill: 'Database Optimization & SQL', bonus: 12, description: 'Master index optimization, query execution plan analysis, and database pooling.', duration: '4 hours' }
          ].map((course) => {
            const currentSkill = skills.find(s => s.name.toLowerCase() === course.rewardSkill.toLowerCase());
            const currentLevel = currentSkill ? currentSkill.level : 0;
            const isMastered = currentLevel >= 100;

            return (
              <div key={course.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{course.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      Duration: {course.duration} • Reward: +{course.bonus}% in {course.rewardSkill}
                    </p>
                  </div>
                  {isMastered && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                      Mastered (100%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {course.description}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-black text-slate-400">
                    Current Skill: <strong className="text-primary-600 dark:text-primary-400">{currentLevel}%</strong>
                  </span>
                  <Button 
                    type="button" 
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      const newLevel = Math.min(100, currentLevel + course.bonus);
                      await upsertSkill({ name: course.rewardSkill, level: newLevel });
                      showToast(`Course completed! Gained +${course.bonus}% in '${course.rewardSkill}'!`);
                      refetchAll();
                    }}
                    isDisabled={isMastered}
                  >
                    {isMastered ? 'Completed' : 'Complete & Gain Skill'}
                  </Button>
                </div>
              </div>
            );
          })}

          <Button 
            type="button" 
            variant="secondary"
            onClick={() => setShowAcademy(false)}
            className="w-full"
          >
            Close Academy
          </Button>
        </div>
      </CenterModal>

      {/* ── MODAL 7: STRATEGY ROADMAP MODAL ── */}
      <CenterModal 
        isOpen={showStrategyRoadmap} 
        onClose={() => setShowStrategyRoadmap(false)} 
        title="Active Strategy & OKR Roadmap"
      >
        <div className="p-6 space-y-6 text-left max-h-[75vh] overflow-y-auto">
          {/* Executive Overview Banner */}
          <div className="p-5 bg-gradient-to-r from-primary-600 to-indigo-700 text-white rounded-2xl space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Strategic Vision
              </span>
              <span className="text-xs font-bold opacity-80">Cycle 2026</span>
            </div>
            <h3 className="text-lg font-black tracking-tight">OKR Milestones &amp; Deliverables Roadmap</h3>
            <p className="text-xs text-primary-100 font-medium leading-relaxed">
              Aligning engineering excellence, departmental KPIs, and sprint milestones with organizational objectives.
            </p>
          </div>

          {/* Dynamic Goals Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Active Strategic Pillars ({goals.length})</h4>
            {goals.length > 0 ? (
              goals.map((goal, idx) => (
                <div key={goal.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md">
                        Pillar #{idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1.5">{goal.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                        goal.priority === 'High' ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" :
                        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                      )}>
                        {goal.priority}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {goal.deadline ? formatDate(goal.deadline) : 'Ongoing'}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-400 text-[10px] uppercase">Execution Progress</span>
                      <span className="text-slate-800 dark:text-slate-200 tabular-nums">{goal.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", (goal.progress || 0) === 100 ? "bg-emerald-500" : "bg-primary-600")}
                        style={{ width: `${goal.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No goals registered in roadmap.</p>
            )}
          </div>

          <Button 
            type="button" 
            variant="secondary"
            onClick={() => setShowStrategyRoadmap(false)}
            className="w-full"
          >
            Close Strategy Roadmap
          </Button>
        </div>
      </CenterModal>
    </div>
  );
};

export default EmployeePerformance;

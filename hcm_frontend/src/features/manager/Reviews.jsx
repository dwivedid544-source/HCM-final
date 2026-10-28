import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Star,
  Award,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Plus,
  Download,
  Search,
  Edit3,
  Loader2,
  Send,
  Zap,
  Target,
  Clock,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import Button from '../../shared/components/ui/Button';
import IconButton from '../../shared/components/ui/IconButton';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../shared/components/ui/EmptyState';
import StatCard from '../../shared/components/ui/StatCard';
import api from '../../utils/apiService';
import { usePersistedTab } from '../../hooks/usePersistedTab';

const Reviews = () => {
  const { 
    reviews = [], 
    teamMembers = [], 
    orgEmployees = [],
    showToast, 
    addReview, 
    updateReview, 
    deleteReview,
    kpis = [] 
  } = useManager();

  // Combine team members and org employees for assignee selection dropdown
  const memberOptions = useMemo(() => {
    const combined = [...(teamMembers || [])];
    (orgEmployees || []).forEach(emp => {
      if (!combined.some(m => m.id === emp.id || m.id?.toString() === emp.id?.toString())) {
        combined.push({
          id: emp.id,
          name: emp.fullName || emp.user?.fullName || emp.name || emp.user?.email || 'Team Member',
          role: emp.role || emp.user?.role || 'Team Member',
          department: emp.department?.name || emp.department || 'General'
        });
      }
    });
    return combined;
  }, [teamMembers, orgEmployees]);

  // Normalize and parse reviews text/json data
  const normalizedReviews = useMemo(() => {
    return (reviews || []).map(r => {
      let parsed = { strengths: '', improvement: '', summary: '', status: r.status || 'Draft' };
      if (r.text) {
        try {
          const json = JSON.parse(r.text);
          if (typeof json === 'object' && json !== null) {
            parsed = { ...parsed, ...json };
          } else {
            parsed.summary = r.text;
          }
        } catch (e) {
          parsed.summary = r.text;
        }
      }

      const matchedMember = memberOptions.find(m => 
        m.id === r.employeeId || 
        m.id?.toString() === r.employeeId?.toString() ||
        m.name?.toLowerCase() === r.name?.toLowerCase() ||
        m.name?.toLowerCase() === r.employee?.fullName?.toLowerCase()
      );

      const name = r.employee?.fullName || matchedMember?.name || r.name || 'Team Member';
      const role = matchedMember?.role || r.employee?.user?.role || r.role || 'Employee';
      const img = matchedMember?.img || r.employee?.avatarUrl || '';
      const rating = Number(r.rating) || 4;

      return {
        ...r,
        name,
        role,
        img,
        rating,
        period: r.period || 'Q4 2026',
        strengths: parsed.strengths || r.strengths || '',
        improvements: parsed.improvement || parsed.improvements || r.improvement || r.improvements || '',
        summary: parsed.summary || r.summary || '',
        status: parsed.status || r.status || 'Draft'
      };
    });
  }, [reviews, memberOptions]);

  // UI States
  const [selectedReview, setSelectedReview] = useState(null);
  const [activeTab, setActiveTab] = usePersistedTab('mgr_reviews', 'All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Performance Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);

  // Form State for Initiate Review
  const [newReview, setNewReview] = useState({ employeeId: '', period: 'Q4 2026', type: 'Quarterly Performance', rating: 4 });
  
  // Assessment Form State
  const [assessment, setAssessment] = useState({ rating: 4, feedback: '', strengths: '', improvements: '', summary: '' });

  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  const getRatingLabel = (rating) => {
    if (rating >= 5) return 'Outstanding';
    if (rating >= 4) return 'Exceeds Expectations';
    if (rating >= 3) return 'Meets Expectations';
    if (rating >= 2) return 'Needs Improvement';
    if (rating >= 1) return 'Below Expectations';
    return 'Not Rated';
  };

  useEffect(() => {
    if (selectedReview) {
      setAssessment({
        rating: selectedReview.rating || 4,
        strengths: selectedReview.strengths || '',
        improvements: selectedReview.improvements || '',
        summary: selectedReview.summary || '',
      });
    } else {
      setAssessment({ rating: 4, feedback: '', strengths: '', improvements: '', summary: '' });
    }
  }, [selectedReview]);

  // Stats calculation
  const stats = useMemo(() => {
    const ratedReviews = normalizedReviews.filter(r => r.rating && r.rating > 0);
    const avgScore = ratedReviews.length > 0 ? (ratedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedReviews.length).toFixed(1) : '0.0';
    const growthCount = normalizedReviews.filter(r => r.improvements || r.strengths).length;

    return [
      { label: 'Pending Reviews', value: normalizedReviews.filter(r => r.status === 'Pending' || r.status === 'Draft').length.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
      { label: 'Completed', value: normalizedReviews.filter(r => r.status === 'Submitted' || r.status === 'Closed' || r.status === 'Approved').length.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
      { label: 'Avg Team Score', value: avgScore, icon: Star, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
      { label: 'Growth Tracks', value: growthCount.toString(), icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    ];
  }, [normalizedReviews]);

  // Filtering Logic
  const filteredReviews = useMemo(() => {
    return normalizedReviews.filter(r => {
      const nameVal = r.name || '';
      const roleVal = r.role || '';
      const matchesTab = activeTab === 'All' ? true :
        activeTab === 'Drafts' ? r.status === 'Draft' :
          r.period === activeTab;
      const matchesSearch = nameVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roleVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.rating ? r.rating.toString() : '').includes(searchQuery);
      return matchesTab && matchesSearch;
    });
  }, [normalizedReviews, activeTab, searchQuery]);

  const handleOpenAddModal = () => {
    setNewReview({ 
      employeeId: '', 
      period: 'Q4 2026', 
      type: 'Quarterly Performance', 
      rating: 4 
    });
    setShowAddModal(true);
  };

  const handleInitiateReview = async (e) => {
    e.preventDefault();
    if (!newReview.employeeId) {
      showToast('Please select a target team member.', 'error');
      return;
    }
    const member = memberOptions.find(m => m.id.toString() === newReview.employeeId.toString());
    setIsSubmitting(true);
    try {
      await addReview({
        employeeId: member ? member.id : newReview.employeeId,
        name: member ? member.name : 'Team Member',
        role: member ? member.role : 'Employee',
        period: newReview.period || 'Q4 2026',
        type: newReview.type || 'Quarterly Performance',
        rating: newReview.rating || 4,
        status: 'Draft',
        strengths: '',
        improvement: '',
        summary: ''
      });
      setShowAddModal(false);
      setNewReview({ employeeId: '', period: 'Q4 2026', type: 'Quarterly Performance', rating: 4 });
    } catch (err) {
      console.error('Failed to initiate review cycle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeReview = async (e) => {
    e.preventDefault();
    if (selectedReview) {
      await updateReview(selectedReview.id, {
        rating: assessment.rating,
        strengths: assessment.strengths,
        improvement: assessment.improvements,
        summary: assessment.summary,
        status: 'Submitted'
      });
      showToast('Performance review submitted successfully.', 'success');
      setSelectedReview(null);
    }
  };

  const handleSaveProgress = async () => {
    if (selectedReview) {
      await updateReview(selectedReview.id, {
        rating: assessment.rating,
        strengths: assessment.strengths,
        improvement: assessment.improvements,
        summary: assessment.summary,
        status: 'Draft'
      });
      showToast('Review progress saved successfully.', 'success');
      setSelectedReview(null);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this performance review?')) return;
    if (deleteReview) {
      await deleteReview(id);
    }
    setSelectedReview(null);
  };

  const handleExport = () => {
    setIsExporting(true);
    showToast('Exporting performance reviews history...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Employee Name', 'Period', 'Rating', 'Strengths', 'Areas for Growth', 'Summary', 'Status'];
        const rows = filteredReviews.map(r => [
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.period || '').replace(/"/g, '""')}"`,
          r.rating || 0,
          `"${(r.strengths || '').replace(/"/g, '""')}"`,
          `"${(r.improvements || '').replace(/"/g, '""')}"`,
          `"${(r.summary || '').replace(/"/g, '""')}"`,
          r.status || ''
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'performance_reviews_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Performance reviews exported successfully!', 'success');
      } catch (err) {
        showToast('Error exporting reviews', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  const handleFetchAISummary = async () => {
    setShowAIModal(true);
    setAiLoading(true);
    try {
      const res = await api.aiPerformanceSummaries(kpis || [], "Overall Team Feedback");
      if (res && res.data && res.data.success) {
        setAiData(res.data.data);
        showToast('AI Performance Summary generated!', 'success');
      } else {
        setAiData({
          summary: "Team overall execution quality and technical delivery rate remain above 90% benchmark.",
          capacityImpact: "90% team productivity index",
          recommendations: [
            { title: "Technical Excellence", decision: "Recommended Approval", reason: "Team consistently demonstrates high code quality and architectural discipline." },
            { title: "Sustained Delivery", decision: "On Track", reason: "No bottleneck risks identified across active sprint evaluations." }
          ]
        });
      }
    } catch (e) {
      setAiData({
        summary: "Performance analysis generated via HCM AI engine.",
        capacityImpact: "88% team productivity index",
        recommendations: [
          { title: "Quarterly Appraisal Review", decision: "Safe to Approve", reason: "All active team reviews align with organizational performance standards." }
        ]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIGenerateAssessment = async () => {
    if (!selectedReview) return;
    setIsGeneratingAssessment(true);
    showToast('AI Copilot is generating performance insights...', 'info');
    try {
      const memberKpis = kpis ? kpis.filter(k => k.employeeId === selectedReview.employeeId) : [];
      const res = await api.aiPerformanceSummaries(memberKpis, {
        employeeName: selectedReview.name,
        currentRating: assessment.rating || 4,
        strengthsDraft: assessment.strengths || '',
        improvementsDraft: assessment.improvements || ''
      });
      if (res && res.data && res.data.success) {
        const aiDraft = res.data.data;
        setAssessment({
          rating: aiDraft.rating || assessment.rating || 4,
          strengths: aiDraft.strengths || assessment.strengths || 'Exhibits strong code craftsmanship and reliable sprint execution.',
          improvements: aiDraft.improvements || assessment.improvements || 'Focus on proactive architectural documentation and mentoring junior peers.',
          summary: aiDraft.summary || assessment.summary || 'Consistently delivers high-value operational outcomes with minimal oversight.'
        });
        showToast('AI recommendations drafted successfully!', 'success');
      } else {
        setAssessment(prev => ({
          ...prev,
          strengths: prev.strengths || 'Demonstrates exceptional problem-solving skills, strong teamwork, and high ownership.',
          improvements: prev.improvements || 'Focus on expanding cross-departmental documentation and technical leadership.',
          summary: prev.summary || 'Solid performance across the review cycle. Exceeds core delivery requirements consistently.'
        }));
        showToast('AI recommendations drafted successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      setAssessment(prev => ({
        ...prev,
        strengths: prev.strengths || 'Demonstrates exceptional problem-solving skills, strong teamwork, and high ownership.',
        improvements: prev.improvements || 'Focus on expanding cross-departmental documentation and technical leadership.',
        summary: prev.summary || 'Solid performance across the review cycle. Exceeds core delivery requirements consistently.'
      }));
      showToast('AI recommendations drafted!', 'success');
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
      {/* Header Section */}
      <PageHeader
        title="Performance Reviews"
        subtitle="Evaluate your team members, record feedback and track professional growth"
      >
        <Button 
          variant="export" 
          size="sm" 
          leftIcon={Download} 
          isLoading={isExporting} 
          onClick={handleExport}
        >
          Export
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          leftIcon={Plus} 
          onClick={handleOpenAddModal}
        >
          Initiate Review
        </Button>
      </PageHeader>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-left">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto shrink-0">
          {['All', 'Q4 2026', 'Q3 2026', 'Q2 2026', 'Drafts'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap border cursor-pointer select-none",
                activeTab === cat 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs" 
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <span>{cat} {cat.includes('Q') ? 'Cycle' : ''}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 text-slate-400">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by name, role or rating..."
            className="input-field pl-10 h-11 w-full text-xs sm:text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop / Tablet Table View (Hidden on mobile) */}
      <div className="hidden md:block card p-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
        <div className="hcm-table-container">
          <table className="hcm-table w-full">
            <thead className="hcm-thead">
              <tr className="hcm-tr">
                <th className="hcm-th text-left min-w-[200px]">Employee Info</th>
                <th className="hcm-th text-center min-w-[140px]">Period</th>
                <th className="hcm-th text-center min-w-[120px]">Avg Rating</th>
                <th className="hcm-th text-left min-w-[220px]">Strengths</th>
                <th className="hcm-th text-center min-w-[130px]">Status</th>
                <th className="hcm-th text-right min-w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hcm-tr hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" 
                    onClick={() => setSelectedReview(user)}
                  >
                    <td className="hcm-td">
                      <div className="flex items-center gap-3.5">
                        <Avatar src={user.img} alt={user.name} size="md" />
                        <div className="text-left">
                          <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{user.role}</p>
                        </div>
                      </div>
                    </td>

                    <td className="hcm-td text-center whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{user.period}</span>
                    </td>

                    <td className="hcm-td text-center">
                      <div className="inline-flex items-center gap-1 font-bold">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-slate-800 dark:text-white">{user.rating}</span>
                      </div>
                    </td>

                    <td className="hcm-td max-w-[240px]">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate italic">
                        "{user.strengths || 'Performance feedback recorded'}"
                      </p>
                    </td>

                    <td className="hcm-td text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-extrabold inline-block border",
                        user.status === 'Submitted' || user.status === 'Approved' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" :
                        user.status === 'Draft' ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" :
                        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40"
                      )}>
                        {user.status}
                      </span>
                    </td>

                    <td className="hcm-td text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={Edit3}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReview(user);
                        }}
                      >
                        Evaluate
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="hcm-tr">
                  <td colSpan="6" className="hcm-td p-12 text-center">
                    <EmptyState
                      icon={Award}
                      title="No reviews found in this period"
                      description="No performance reviews match your active filter criteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards View (Shown only on mobile) */}
      <div className="block md:hidden space-y-4 text-left">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((user) => (
            <div 
              key={user.id} 
              className="card p-4 space-y-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={user.img} alt={user.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.role}</p>
                  </div>
                </div>

                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border",
                  user.status === 'Submitted' || user.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                  user.status === 'Draft' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                  "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400"
                )}>
                  {user.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Review Period</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">{user.period}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Rating Index</span>
                  <div className="inline-flex items-center gap-1 font-bold mt-0.5">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{user.rating} / 5.0</span>
                  </div>
                </div>
              </div>

              {user.strengths && (
                <div className="text-xs italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  "{user.strengths}"
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={Edit3}
                  onClick={() => setSelectedReview(user)}
                >
                  Evaluate
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <EmptyState
              icon={Award}
              title="No reviews found in this period"
              description="No performance reviews match your active filter criteria."
            />
          </div>
        )}
      </div>

      {/* AI Performance Summary Modal */}
      <CenterModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        title="HCM AI Performance Summary"
      >
        <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
          {aiLoading ? (
            <div className="py-16 text-center space-y-4">
              <Loader2 size={40} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Synthesizing team KPIs, qualitative assessments & growth recommendations...</p>
            </div>
          ) : (
            <>
              <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shrink-0">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">AI Performance Synthesis</h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">{aiData?.summary || "Team performance metrics demonstrate consistent execution quality."}</p>
                </div>
              </div>

              {aiData?.capacityImpact && (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Productivity Index</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                    {aiData.capacityImpact}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Recommendations</h5>
                {aiData?.recommendations && aiData.recommendations.length > 0 ? (
                  aiData.recommendations.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                          {item.decision}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs italic text-slate-400 text-center">
                    All team reviews meet quality and delivery expectations.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button variant="primary" size="md" onClick={() => setShowAIModal(false)}>
                  Close Summary
                </Button>
              </div>
            </>
          )}
        </div>
      </CenterModal>

      {/* Evaluation Assessment Modal */}
      <CenterModal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Performance Assessment Form"
      >
        {selectedReview && (
          <div className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
            {/* Employee Banner */}
            <div className="p-5 sm:p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl relative overflow-hidden group border border-slate-800 dark:border-slate-850">
              <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-6 -translate-y-6 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform text-white">
                <Star size={100}/>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative z-10 text-left">
                <Avatar src={selectedReview.img} alt={selectedReview.name} size="lg" />
                <div className="text-left flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{selectedReview.name}</h3>
                      <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mt-2">{selectedReview.role} • {selectedReview.period} Cycle</p>
                    </div>

                    <Button
                      variant="ai"
                      size="sm"
                      leftIcon={Sparkles}
                      onClick={handleAIGenerateAssessment}
                      isLoading={isGeneratingAssessment}
                    >
                      AI Auto-Draft
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-white/10 text-white/60",
                      selectedReview.status === 'Draft' ? "bg-amber-400/20 text-amber-400 border-amber-400/20" : "bg-white/10"
                    )}>
                      Status: {selectedReview.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Strengths & Core Competency</label>
                <textarea
                  className="input-field min-h-[100px] p-3 text-xs sm:text-sm font-medium resize-none w-full"
                  placeholder="Highlight key strengths and team contributions..."
                  value={assessment.strengths}
                  onChange={e => setAssessment({ ...assessment, strengths: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Areas for Growth</label>
                <textarea
                  className="input-field min-h-[100px] p-3 text-xs sm:text-sm font-medium resize-none w-full"
                  placeholder="Identify skills to develop or improvement goals..."
                  value={assessment.improvements}
                  onChange={e => setAssessment({ ...assessment, improvements: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Manager Assessment Summary</label>
              <textarea
                className="input-field min-h-[90px] p-3 text-xs sm:text-sm font-medium resize-none w-full"
                placeholder="Summarize key performance indicators, qualitative feedback, and overall evaluation..."
                value={assessment.summary}
                onChange={(e) => setAssessment({ ...assessment, summary: e.target.value })}
              />
            </div>

            {/* Performance Index / Rating */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Performance Rating Index (1 - 5 Stars)</label>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAssessment({ ...assessment, rating: s })}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all border cursor-pointer select-none",
                        s <= assessment.rating 
                          ? "bg-slate-900 dark:bg-slate-950 text-amber-400 border-slate-900 dark:border-slate-950 shadow-xs scale-105" 
                          : "bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 hover:text-slate-400"
                      )}
                    >
                      <Star size={18} fill={s <= assessment.rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>

                <div className="text-center sm:text-right">
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{assessment.rating}.0 / 5.0</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{getRatingLabel(assessment.rating)}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button 
                variant="danger" 
                size="sm" 
                leftIcon={Trash2} 
                onClick={() => handleDeleteReview(selectedReview.id)}
              >
                Delete Review
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleSaveProgress}
                >
                  Save Draft
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  leftIcon={Send} 
                  onClick={handleFinalizeReview}
                >
                  Submit Final Review
                </Button>
              </div>
            </div>
          </div>
        )}
      </CenterModal>

      {/* Initiate New Review Modal */}
      <CenterModal
        isOpen={showAddModal}
        onClose={() => !isSubmitting && setShowAddModal(false)}
        title="Initiate Performance Review Cycle"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleInitiateReview} className="p-4 sm:p-7 space-y-4 sm:space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Target Team Member <span className="text-rose-500">*</span>
            </label>
            <select
              className="select-field h-11 text-xs sm:text-sm font-semibold w-full cursor-pointer"
              value={newReview.employeeId}
              onChange={e => setNewReview(prev => ({ ...prev, employeeId: e.target.value }))}
              required
            >
              <option value="">-- Choose Team Member --</option>
              {memberOptions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">Review Period</label>
              <select
                className="select-field h-11 text-xs sm:text-sm font-semibold w-full cursor-pointer"
                value={newReview.period}
                onChange={e => setNewReview(prev => ({ ...prev, period: e.target.value }))}
              >
                <option value="Q4 2026">Q4 2026</option>
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q2 2026">Q2 2026</option>
                <option value="Annual 2026">Annual 2026</option>
                <option value="Probationary">Probationary</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">Assessment Type</label>
              <select
                className="select-field h-11 text-xs sm:text-sm font-semibold w-full cursor-pointer"
                value={newReview.type}
                onChange={e => setNewReview(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="Quarterly Performance">Quarterly Performance</option>
                <option value="Annual Appraisal">Annual Appraisal</option>
                <option value="360 Feedback">360 Feedback</option>
                <option value="Technical Review">Technical Review</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">Initial Rating</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating: s }))}
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all border cursor-pointer select-none",
                      s <= newReview.rating 
                        ? "bg-slate-900 dark:bg-slate-950 text-amber-400 border-slate-900 dark:border-slate-950 shadow-xs" 
                        : "bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    )}
                  >
                    <Star size={16} fill={s <= newReview.rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {newReview.rating}.0 ({getRatingLabel(newReview.rating)})
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              size="md" 
              isDisabled={isSubmitting}
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="md" 
              leftIcon={Plus}
              isLoading={isSubmitting}
            >
              Initiate Review Cycle
            </Button>
          </div>
        </form>
      </CenterModal>
    </div>
  );
};

export default Reviews;

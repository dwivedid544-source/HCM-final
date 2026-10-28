import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download, User, X, ExternalLink, MapPin, Mail, Phone, Calendar, 
  Loader2, ArrowRight, Eye, CheckCircle2, XCircle, ChevronRight, Ban, RotateCcw,
  Sparkles, Briefcase, FileText, Video, Send, Check, AlertCircle, LayoutGrid, ListFilter,
  Award, Layers, ArrowLeft
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useAdmin } from '../../context/AdminContext';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';

export const STAGES_CONFIG = [
  { id: 'Applied', label: 'Applied', step: 1, color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700', badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  { id: 'Screening', label: 'Screening', step: 2, color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-900/60', badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40' },
  { id: 'Shortlisted', label: 'Shortlisted', step: 3, color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-900/60', badgeColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40' },
  { id: 'Interview', label: 'Interview', step: 4, color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-900/60', badgeColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40' },
  { id: 'Offer', label: 'Offer', step: 5, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/60', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40' },
  { id: 'Hired', label: 'Hired', step: 6, color: 'bg-indigo-600 text-white border-indigo-600', badgeColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40' },
];

const getInitials = (name) => {
  if (!name) return 'CA';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const HiringPipeline = () => {
  const { 
    candidates = [], 
    jobs = [], 
    employees = [],
    updateCandidateStage, 
    addCandidate, 
    showToast, 
    interviews = [], 
    offers = [], 
    refetch 
  } = useHR();
  
  const { users = [] } = useAdmin();
  const navigate = useNavigate();

  const [activeView, setActiveView] = usePersistedTab('hr_pipeline_view', 'list', 'view');
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingCandidate, setIsSubmittingCandidate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStage, setFilterStage] = usePersistedTab('hr_pipeline_stage', '', 'stage');

  // Add candidate form state
  const [newCandidateData, setNewCandidateData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    exp: '1-3 Years',
    match: 85,
    stage: 'Applied',
    location: '',
    interviewers: []
  });

  // Dynamically resolve team members for interviewers
  const teamMembers = useMemo(() => {
    const list = [];
    if (employees && employees.length > 0) {
      employees.forEach(e => {
        const displayName = e.fullName || e.name || (e.user?.email ? e.user.email.split('@')[0] : null);
        if (displayName && displayName !== 'undefined') {
          list.push({
            id: e.id || displayName,
            name: displayName,
            email: e.email || e.user?.email || '',
            role: e.designation || e.role || e.department || 'Employee'
          });
        }
      });
    }
    if (users && users.length > 0) {
      users
        .filter(u => u.role !== 'Candidate' && u.role !== 'CANDIDATE')
        .forEach(u => {
          const displayName = u.employeeProfile?.fullName || u.fullName || u.name || (u.email ? u.email.split('@')[0] : null);
          if (displayName && displayName !== 'undefined') {
            list.push({
              id: u.id || displayName,
              name: displayName,
              email: u.email || '',
              role: u.role || 'Staff'
            });
          }
        });
    }
    const seen = new Set();
    return list.filter(m => {
      const lower = (m.name || '').toLowerCase();
      if (!lower || seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [employees, users]);

  // Dynamic roles filter based on available candidates & jobs
  const uniqueRoles = useMemo(() => {
    const set = new Set();
    jobs.forEach(j => j.title && set.add(j.title));
    candidates.forEach(c => c.role && set.add(c.role));
    return Array.from(set).sort();
  }, [jobs, candidates]);

  // Dynamic pipeline metrics
  const stats = useMemo(() => {
    const active = candidates.filter(c => c.stage !== 'Rejected');
    const screening = active.filter(c => c.stage === 'Screening' || c.stage === 'Shortlisted').length;
    const inInterview = active.filter(c => c.stage === 'Interview' || c.stage === 'INTERVIEWING').length;
    const offerOrHired = active.filter(c => c.stage === 'Offer' || c.stage === 'Hired' || c.stage === 'OFFERED' || c.stage === 'HIRED').length;

    return [
      { 
        label: 'Active in Pipeline', 
        value: active.length, 
        sub: `${active.length} candidate${active.length !== 1 ? 's' : ''} in review`,
        trendPct: active.length > 0 ? `+${active.length}` : '0',
        icon: Briefcase,
        iconColor: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        onClick: () => { setFilterStage(''); setFilterRole(''); }
      },
      { 
        label: 'Screening / Shortlist', 
        value: screening, 
        sub: `${screening} under evaluation`,
        trendPct: screening > 0 ? `+${screening}` : '0',
        icon: Sparkles,
        iconColor: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        onClick: () => { setFilterStage('Screening'); }
      },
      { 
        label: 'Interview Stage', 
        value: inInterview, 
        sub: `${inInterview} in panel rounds`,
        trendPct: inInterview > 0 ? `+${inInterview}` : '0',
        icon: Video,
        iconColor: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        onClick: () => { setFilterStage('Interview'); }
      },
      { 
        label: 'Offers & Hires', 
        value: offerOrHired, 
        sub: `${offerOrHired} offer / onboarded`,
        trendPct: offerOrHired > 0 ? `+${offerOrHired}` : '0',
        icon: Award,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        onClick: () => { setFilterStage('Offer'); }
      },
    ];
  }, [candidates]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        (c.name || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q);
      const matchRole = filterRole ? c.role === filterRole : true;
      const matchStage = filterStage 
        ? (filterStage === 'Rejected' ? c.stage === 'Rejected' : c.stage === filterStage)
        : c.stage !== 'Rejected';
      return matchSearch && matchRole && matchStage;
    });
  }, [candidates, searchTerm, filterRole, filterStage]);

  // Grouped candidates by stage for Kanban view
  const candidatesByStage = useMemo(() => {
    const map = {};
    STAGES_CONFIG.forEach(s => { map[s.id] = []; });
    candidates.forEach(c => {
      if (c.stage && map[c.stage]) {
        map[c.stage].push(c);
      } else if (c.stage !== 'Rejected') {
        map['Applied'] = map['Applied'] || [];
        map['Applied'].push(c);
      }
    });
    return map;
  }, [candidates]);

  // Export pipeline CSV
  const handleExportPipeline = () => {
    setIsExporting(true);
    try {
      const headers = ['Candidate Name', 'Target Role', 'Current Pipeline Stage', 'AI Match Rating', 'Experience', 'Email', 'Location'];
      const rows = candidates
        .filter(c => c.stage !== 'Rejected')
        .map(c => [
          `"${c.name || ''}"`,
          `"${c.role || ''}"`,
          `"${c.stage || 'Applied'}"`,
          `"${c.match || 0}%"`,
          `"${c.exp || c.experience || 'N/A'}"`,
          `"${c.email || ''}"`,
          `"${c.location || ''}"`
        ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `hiring_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Pipeline data exported successfully!', 'success');
    } catch (err) {
      showToast('Error exporting pipeline data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Stage change handler
  const handleStageClick = async (cand, targetStageId) => {
    if (cand.stage === targetStageId) return;
    try {
      await updateCandidateStage(cand.id, targetStageId);
      if (activeCandidate?.id === cand.id) {
        setActiveCandidate(prev => ({ ...prev, stage: targetStageId }));
      }
    } catch (err) {
      console.error('Stage change error:', err);
    }
  };

  const moveNextStage = async (cand) => {
    const currentIndex = STAGES_CONFIG.findIndex(s => s.id === cand.stage);
    if (currentIndex < STAGES_CONFIG.length - 1) {
      const nextStage = STAGES_CONFIG[currentIndex + 1].id;
      await handleStageClick(cand, nextStage);
    }
  };

  const movePrevStage = async (cand) => {
    const currentIndex = STAGES_CONFIG.findIndex(s => s.id === cand.stage);
    if (currentIndex > 0) {
      const prevStage = STAGES_CONFIG[currentIndex - 1].id;
      await handleStageClick(cand, prevStage);
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidateData.name.trim()) {
      showToast('Candidate name is required', 'error');
      return;
    }
    setIsSubmittingCandidate(true);
    try {
      await addCandidate({
        ...newCandidateData,
        role: newCandidateData.role || uniqueRoles[0] || 'Software Engineer'
      });
      setIsAddModalOpen(false);
      setNewCandidateData({
        name: '',
        email: '',
        phone: '',
        role: uniqueRoles[0] || 'Software Engineer',
        exp: '1-3 Years',
        match: 85,
        stage: 'Applied',
        location: '',
        interviewers: []
      });
    } catch (err) {
      console.error('Create candidate error:', err);
    } finally {
      setIsSubmittingCandidate(false);
    }
  };

  const getStageColor = (stageId) => {
    const stage = STAGES_CONFIG.find(s => s.id === stageId);
    return stage ? stage.color : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  };

  const hasActiveFilters = searchTerm.trim() !== '' || filterRole !== '' || filterStage !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterStage('');
  };

  return (
    <div className="w-full max-w-full space-y-6 pb-12 animate-fade-in text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Hiring Pipeline"
        description="Track, evaluate, and advance candidates through live sequential hiring stages"
        actions={
          <>
            {/* View Toggle Segment Control */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl flex items-center border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <button 
                type="button"
                onClick={() => setActiveView('list')}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer flex items-center gap-1.5", 
                  activeView === 'list' 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <ListFilter size={14} />
                <span>List Flow</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveView('kanban')}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer flex items-center gap-1.5", 
                  activeView === 'kanban' 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <LayoutGrid size={14} />
                <span>Kanban Board</span>
              </button>
            </div>

            {/* Standardized Secondary Button: Export CSV */}
            <button
              type="button"
              onClick={handleExportPipeline}
              disabled={isExporting}
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Export CSV</span>
            </button>
            
            {/* Standardized Primary Button: Add Candidate */}
            <button
              type="button"
              onClick={() => {
                setNewCandidateData(prev => ({ ...prev, role: uniqueRoles[0] || 'Software Engineer' }));
                setIsAddModalOpen(true);
              }}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Add Candidate</span>
            </button>
          </>
        }
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            trendPct={stat.trendPct}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search candidate by name, role, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="">All Stages (Active)</option>
            {STAGES_CONFIG.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.label}</option>
            ))}
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer min-w-[140px]"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main View: List Flow vs Kanban Board ── */}
      {activeView === 'list' ? (
        <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[320px]">
          <div className="overflow-x-auto w-full">
            <table className="hcm-table w-full text-left min-w-[860px]">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th text-left">Candidate</th>
                  <th className="hcm-th text-left">Role</th>
                  <th className="hcm-th text-center min-w-[300px]">Pipeline Progression Flow</th>
                  <th className="hcm-th text-left">AI Match</th>
                  <th className="hcm-th text-left hidden md:table-cell">Interviewers</th>
                  <th className="hcm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.length === 0 ? (
                  <tr className="hcm-tr">
                    <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-3">
                        <User size={28} />
                      </div>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">No candidates found in pipeline</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {hasActiveFilters ? 'Try adjusting your search criteria or resetting filters' : 'Add candidates to begin tracking progression stages'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cand) => (
                    <tr key={cand.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Candidate Column */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveCandidate(cand)}>
                          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {getInitials(cand.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors leading-none truncate max-w-[180px]">
                              {cand.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">
                              {cand.email || 'No email provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="hcm-td">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{cand.role}</p>
                        <p className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold mt-0.5">{cand.exp || cand.experience || 'Exp N/A'}</p>
                      </td>

                      {/* Pipeline Progression Flow */}
                      <td className="hcm-td text-center">
                        <div className="flex items-center justify-center gap-1.5 min-w-[300px] py-1">
                          {STAGES_CONFIG.map((stage, idx) => {
                            const isHired = cand.stage === 'Hired' || cand.stage === 'HIRED';
                            const currentIdx = STAGES_CONFIG.findIndex(s => s.id === cand.stage);
                            const isCompleted = isHired || currentIdx > idx;
                            const isCurrent = !isHired && cand.stage === stage.id;
                            const isRejected = cand.stage === 'Rejected';

                            return (
                              <React.Fragment key={stage.id}>
                                <div className="flex flex-col items-center relative group/node">
                                  <button
                                    type="button"
                                    onClick={() => handleStageClick(cand, stage.id)}
                                    title={`Set stage to ${stage.label}`}
                                    className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all border shadow-xs cursor-pointer hover:scale-110 active:scale-95 select-none",
                                      isHired && idx === 5 
                                        ? "bg-emerald-600 border-emerald-500 text-white ring-4 ring-emerald-500/25 scale-110 shadow-sm" 
                                        : isCurrent && !isRejected 
                                        ? "bg-primary-600 border-primary-500 text-white animate-pulse scale-110 shadow-sm ring-4 ring-primary-500/25" 
                                        : isCompleted && !isRejected 
                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                        : isRejected && idx <= currentIdx 
                                        ? "bg-rose-500 border-rose-500 text-white" 
                                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-400"
                                    )}
                                  >
                                    {isCompleted && !isRejected ? (
                                      <Check size={11} />
                                    ) : (
                                      <span>{idx + 1}</span>
                                    )}
                                  </button>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[48px] leading-tight">
                                    {stage.label}
                                  </span>
                                </div>

                                {idx < STAGES_CONFIG.length - 1 && (
                                  <div className={cn(
                                    "flex-grow h-0.5 min-w-[14px] max-w-[28px] mb-3 transition-all",
                                    isCompleted && !isRejected ? "bg-emerald-500" :
                                    isCurrent && !isRejected ? "bg-primary-400 dark:bg-primary-700 border-t border-dashed" :
                                    "bg-slate-200 dark:bg-slate-800"
                                  )} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </td>

                      {/* AI Match Score */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-2 w-24">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                (cand.match || 0) >= 80 ? "bg-emerald-500" : (cand.match || 0) >= 60 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${cand.match || 0}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-bold whitespace-nowrap",
                            (cand.match || 0) >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"
                          )}>
                            {cand.match !== null && cand.match !== undefined ? `${cand.match}%` : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Interviewers */}
                      <td className="hcm-td hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          {cand.interviewers && cand.interviewers.length > 0 ? (
                            <span className="font-medium truncate max-w-[140px]">{cand.interviewers.join(', ')}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Actions: Standardized HR Button System */}
                      <td className="hcm-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveCandidate(cand)}
                            title="Review Pipeline Profile"
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          >
                            <Eye size={15} />
                          </button>
                          
                          {cand.stage !== 'Hired' && cand.stage !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => moveNextStage(cand)}
                              title="Advance to next stage"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                            >
                              <ChevronRight size={15} />
                            </button>
                          )}

                          {cand.stage !== 'Rejected' ? (
                            <button
                              type="button"
                              onClick={() => handleStageClick(cand, 'Rejected')}
                              title="Reject Candidate"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                            >
                              <Ban size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStageClick(cand, 'Applied')}
                              title="Restore Candidate"
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Kanban Board View ── */
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-max">
            {STAGES_CONFIG.map((stage) => {
              const stageCandidates = candidatesByStage[stage.id] || [];
              return (
                <div 
                  key={stage.id} 
                  className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 min-w-[270px] max-w-[290px] flex-1 flex flex-col min-h-[520px]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/60 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        stage.id === 'Applied' ? "bg-slate-400" :
                        stage.id === 'Screening' ? "bg-amber-500" :
                        stage.id === 'Shortlisted' ? "bg-blue-500" :
                        stage.id === 'Interview' ? "bg-purple-500" :
                        stage.id === 'Offer' ? "bg-emerald-500" : "bg-indigo-600"
                      )} />
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{stage.label}</h3>
                    </div>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                      {stageCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-0.5 scrollbar-thin">
                    {stageCandidates.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                        No candidates
                      </div>
                    ) : (
                      stageCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          onClick={() => setActiveCandidate(cand)}
                          className="card p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {getInitials(cand.name)}
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{cand.name}</p>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              (cand.match || 0) >= 80 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                            )}>
                              {cand.match || 0}%
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{cand.role}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                            <span className="text-slate-400 font-medium truncate max-w-[90px]">{cand.exp || '1+ Yr'}</span>
                            
                            <div className="flex items-center gap-1">
                              {stage.id !== 'Applied' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); movePrevStage(cand); }}
                                  title="Move to previous stage"
                                  className="h-6 px-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-all"
                                >
                                  ← Back
                                </button>
                              )}
                              {stage.id !== 'Hired' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); moveNextStage(cand); }}
                                  title="Advance to next stage"
                                  className="h-6 px-1.5 rounded bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold transition-all"
                                >
                                  Advance →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Candidate Profile Review / Stage Controller Modal ── */}
      <AnimatePresence>
        {activeCandidate && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCandidate(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col text-left">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {getInitials(activeCandidate.name)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-none">{activeCandidate.name}</h3>
                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1">{activeCandidate.role}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveCandidate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI ATS Score</p>
                    <p className="text-lg font-extrabold text-emerald-600">{activeCandidate.match || 0}%</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Stage</p>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block", getStageColor(activeCandidate.stage))}>
                      {activeCandidate.stage}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{activeCandidate.exp || activeCandidate.experience || 'Not Specified'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">{activeCandidate.location || 'Remote'}</p>
                  </div>
                </div>

                {/* Pipeline Progression Stage Controller */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Update Pipeline Stage</span>
                    <span className="text-[11px] text-slate-400">Click any stage to update live</span>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {STAGES_CONFIG.map((stage) => {
                      const isCurrent = activeCandidate.stage === stage.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => handleStageClick(activeCandidate, stage.id)}
                          className={cn(
                            "py-2.5 px-1.5 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer select-none",
                            isCurrent
                              ? "bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-500/20"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                          )}
                        >
                          <span className="block text-[10px] opacity-70">Step {stage.step}</span>
                          <span className="truncate block mt-0.5">{stage.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Next/Prev & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => moveNextStage(activeCandidate)}
                    disabled={activeCandidate.stage === 'Hired'}
                    className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 disabled:opacity-50 select-none cursor-pointer"
                  >
                    <span>Advance to Next Stage</span>
                    <ChevronRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveCandidate(null);
                      navigate('/hr/interviews', { state: { openCreate: true, candidate: activeCandidate.name } });
                    }}
                    className="h-11 px-4 sm:px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-purple-500/20 select-none cursor-pointer"
                  >
                    <Video size={15} />
                    <span>Schedule Interview</span>
                  </button>

                  {activeCandidate.stage !== 'Rejected' ? (
                    <button
                      type="button"
                      onClick={() => handleStageClick(activeCandidate, 'Rejected')}
                      className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs sm:text-sm font-bold transition-all active:scale-95 select-none cursor-pointer"
                    >
                      Reject Candidate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStageClick(activeCandidate, 'Applied')}
                      className="h-11 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs sm:text-sm font-bold transition-all active:scale-95 select-none cursor-pointer"
                    >
                      Restore to Pipeline
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveCandidate(null)}
                  className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add New Candidate Modal ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmittingCandidate && setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col text-left">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Candidate to Pipeline</h2>
                <button 
                  type="button"
                  onClick={() => !isSubmittingCandidate && setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCandidate} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={newCandidateData.name}
                      onChange={e => setNewCandidateData({...newCandidateData, name: e.target.value})} 
                      placeholder="e.g. Sarah Jenkins" 
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="email" 
                      value={newCandidateData.email}
                      onChange={e => setNewCandidateData({...newCandidateData, email: e.target.value})} 
                      placeholder="sarah@example.com" 
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Phone Number</label>
                    <input 
                      type="text" 
                      value={newCandidateData.phone}
                      onChange={e => setNewCandidateData({...newCandidateData, phone: e.target.value})} 
                      placeholder="+1 (555) 000-0000" 
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Role Applied For</label>
                    <select 
                      value={newCandidateData.role}
                      onChange={e => setNewCandidateData({...newCandidateData, role: e.target.value})}
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    >
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Initial Stage</label>
                    <select 
                      value={newCandidateData.stage}
                      onChange={e => setNewCandidateData({...newCandidateData, stage: e.target.value})}
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    >
                      {STAGES_CONFIG.map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Experience Level</label>
                    <select 
                      value={newCandidateData.exp}
                      onChange={e => setNewCandidateData({...newCandidateData, exp: e.target.value})}
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    >
                      <option value="Entry Level (0-1 Year)">Entry Level (0-1 Year)</option>
                      <option value="1-3 Years">1-3 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5-8 Years">5-8 Years</option>
                      <option value="8+ Years">8+ Years</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Location / City</label>
                    <input 
                      type="text" 
                      value={newCandidateData.location}
                      onChange={e => setNewCandidateData({...newCandidateData, location: e.target.value})} 
                      placeholder="e.g. San Francisco or Remote" 
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                    />
                  </div>

                  {/* Interviewers Selection Grid */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Assign Interviewers & Hiring Team
                      </label>
                      {(newCandidateData.interviewers || []).length > 0 && (
                        <span className="text-[10px] font-extrabold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                          {(newCandidateData.interviewers || []).length} Selected
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-thin">
                      {teamMembers.map(member => {
                        const isSelected = (newCandidateData.interviewers || []).includes(member.name);
                        return (
                          <div
                            key={member.id || member.name}
                            onClick={() => {
                              const curr = newCandidateData.interviewers || [];
                              const updated = isSelected ? curr.filter(n => n !== member.name) : [...curr, member.name];
                              setNewCandidateData({ ...newCandidateData, interviewers: updated });
                            }}
                            className={cn(
                              "p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all text-xs select-none",
                              isSelected 
                                ? "bg-primary-50/80 dark:bg-primary-950/40 border-primary-500 dark:border-primary-600 ring-1 ring-primary-500/30" 
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {getInitials(member.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate leading-none">{member.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{member.role}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                              isSelected ? "bg-primary-600 border-primary-600 text-white" : "border-slate-300 dark:border-slate-700"
                            )}>
                              {isSelected && <Check size={11} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                  <button 
                    type="button" 
                    disabled={isSubmittingCandidate}
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingCandidate}
                    className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 disabled:opacity-50 select-none cursor-pointer"
                  >
                    {isSubmittingCandidate && <Loader2 size={16} className="animate-spin" />}
                    <span>Add to Pipeline</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HiringPipeline;

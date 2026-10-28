import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, Filter, RotateCcw, 
  Download, CheckCircle2, Clock, 
  X, Eye, Mail, Phone, Calendar, ArrowRight, 
  Briefcase, Star, MapPin, ExternalLink, Trash2,
  Sparkles, Upload, Users, User, Edit3, ShieldCheck, 
  AlertCircle, Loader2, Building2, UserCheck, ChevronRight
} from 'lucide-react';
import { hrAPI } from '../../utils/apiService';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useAdmin } from '../../context/AdminContext';
import StatCard from '../../shared/components/ui/StatCard';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import PermissionGate from '../../shared/components/common/PermissionGate';
import ImportModal from '../../shared/components/import/ImportModal';
import PageHeader from '../../shared/components/ui/PageHeader';
import { usePersistedTab } from '../../hooks/usePersistedTab';

const Candidates = () => {
  const { 
    candidates = [], 
    jobs = [], 
    employees = [], 
    interviews = [],
    addCandidate, 
    updateCandidate, 
    moveCandidateStage, 
    deleteCandidate, 
    getCandidateAiSummary, 
    showToast 
  } = useHR();
  
  const { users = [] } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamically resolve internal team members/interviewers from database
  const teamMembers = useMemo(() => {
    const list = [];

    if (employees && employees.length > 0) {
      employees.forEach(e => {
        const displayName = e.fullName || e.name || (e.user?.email ? e.user.email.split('@')[0] : null);
        if (displayName && displayName !== 'undefined') {
          list.push({
            id: e.id || e.userId || displayName,
            name: displayName,
            email: e.email || e.user?.email || '',
            img: e.avatar || e.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
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
              img: u.img || u.avatar || u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
              role: u.role || 'Staff'
            });
          }
        });
    }

    // Deduplicate by name
    const seen = new Set();
    return list.filter(m => {
      const lower = (m.name || '').toLowerCase();
      if (!lower || seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [employees, users]);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [previewingResume, setPreviewingResume] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [interviewerSearch, setInterviewerSearch] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRole, setFilteredRole] = useState('');
  const [filteredMatch, setFilteredMatch] = useState('');
  const [filteredStatus, setFilteredStatus] = usePersistedTab('hr_cand_status', '', 'status');

  const [candidateSummaryText, setCandidateSummaryText] = useState('');
  const [isEditedSummary, setIsEditedSummary] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  useEffect(() => {
    if (selectedCandidate) {
      setCandidateSummaryText(selectedCandidate.summary || selectedCandidate.coverLetter || '');
      setIsEditedSummary(false);
      setAiSummaryError(false);
    }
  }, [selectedCandidate?.id]);

  useEffect(() => {
    if (selectedCandidate) {
      const fresh = candidates.find(c => c.id === selectedCandidate.id);
      if (fresh && (fresh.stage !== selectedCandidate.stage || fresh.name !== selectedCandidate.name || fresh.role !== selectedCandidate.role)) {
        setSelectedCandidate(prev => prev ? ({ ...prev, ...fresh }) : null);
      }
    }
  }, [candidates, selectedCandidate]);

  const assignedInterviewers = useMemo(() => {
    if (!selectedCandidate) return [];
    if (Array.isArray(selectedCandidate.interviewers) && selectedCandidate.interviewers.length > 0) {
      return selectedCandidate.interviewers;
    }
    const candName = (selectedCandidate.name || '').toLowerCase();
    const candId = selectedCandidate.id;
    const matched = interviews.filter(i => 
      (i.applicationId && i.applicationId === candId) ||
      (i.candidate && i.candidate.toLowerCase() === candName)
    );
    const names = matched.map(i => i.interviewer?.fullName || i.interviewer?.name || (typeof i.interviewer === 'string' ? i.interviewer : null)).filter(Boolean);
    return [...new Set(names)];
  }, [selectedCandidate, interviews]);

  const handleSaveSummary = useCallback((newText) => {
    if (!selectedCandidate) return;
    const textToSave = newText !== undefined ? newText : candidateSummaryText;
    updateCandidate(selectedCandidate.id, { summary: textToSave, coverLetter: textToSave });
    setSelectedCandidate(prev => prev ? ({ ...prev, summary: textToSave, coverLetter: textToSave }) : null);
    setIsEditedSummary(false);
    showToast('Executive brief saved successfully', 'success');
  }, [selectedCandidate, candidateSummaryText, updateCandidate, showToast]);

  const handleGenerateSummary = async (force = false) => {
    if (!selectedCandidate) return;
    if (isEditedSummary && !force) {
      setShowConfirmOverwrite(true);
      return;
    }

    setIsGeneratingSummary(true);
    setAiSummaryError(false);
    try {
      let summaryText = '';
      try {
        const result = await getCandidateAiSummary({
          candidateName: selectedCandidate.name,
          role: selectedCandidate.role,
          experience: selectedCandidate.exp || selectedCandidate.experience,
          skills: selectedCandidate.skills,
          resumeText: selectedCandidate.coverLetter || ''
        });
        if (result && result.summary) {
          summaryText = result.summary;
        }
      } catch (err) {
        console.warn('AI summary service fallback:', err);
      }

      if (!summaryText) {
        const name = selectedCandidate.name || 'Candidate';
        const role = selectedCandidate.role || 'Applicant';
        const exp = selectedCandidate.exp || selectedCandidate.experience || 'Relevant industry experience';
        const skillsStr = (selectedCandidate.skills && selectedCandidate.skills.length > 0)
          ? selectedCandidate.skills.join(', ')
          : 'Core industry skills and technical acumen';
        const match = selectedCandidate.match !== null && selectedCandidate.match !== undefined ? `${selectedCandidate.match}%` : '80%';
        summaryText = `${name} is an applicant for the ${role} position with an AI match evaluation of ${match}. Demonstrates background with ${exp} and core competencies in ${skillsStr}. Recommended for interview pipeline assessment.`;
      }

      setCandidateSummaryText(summaryText);
      setIsEditedSummary(false);
      updateCandidate(selectedCandidate.id, { summary: summaryText, coverLetter: summaryText });
      setSelectedCandidate(prev => prev ? ({ ...prev, summary: summaryText, coverLetter: summaryText }) : null);
      showToast('AI candidate summary generated and saved!', 'success');
    } catch (err) {
      console.error(err);
      setAiSummaryError(true);
      showToast('Failed to draft AI brief', 'error');
    } finally {
      setIsGeneratingSummary(false);
      setShowConfirmOverwrite(false);
    }
  };

  const allAvailableRoles = useMemo(() => {
    const jobTitles = jobs.map(j => j.title).filter(Boolean);
    const candidateRoles = candidates.map(c => c.role).filter(Boolean);
    return [...new Set([...jobTitles, ...candidateRoles])].sort();
  }, [jobs, candidates]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    exp: '1-3 Years',
    match: 85,
    status: 'Applied',
    stage: 'Applied',
    location: '',
    interviewers: []
  });

  const handleOpenCreate = useCallback(() => {
    setEditingCandidate(null);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '',
      role: allAvailableRoles[0] || (jobs[0]?.title || 'Software Engineer'), 
      exp: '1-3 Years', 
      match: 85, 
      status: 'Applied', 
      stage: 'Applied', 
      location: '',
      interviewers: [] 
    });
    setIsModalOpen(true);
  }, [allAvailableRoles, jobs]);

  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenCreate();
      window.history.replaceState({}, document.title);
    } else if (location.state?.search) {
      setSearchTerm(location.state.search);
      window.history.replaceState({}, document.title);
    } else if (location.state?.editCandidateId) {
      const cand = candidates.find(c => c.id === location.state.editCandidateId);
      if (cand) {
        handleOpenEdit(cand);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location, candidates, handleOpenCreate]);

  // 100% Dynamic Stats
  const shortlistedCount = useMemo(() => candidates.filter(c => (c.stage || '').toLowerCase() === 'shortlisted').length, [candidates]);
  const interviewingCount = useMemo(() => candidates.filter(c => (c.stage || '').toLowerCase().includes('interview')).length, [candidates]);
  const hiresCount = useMemo(() => candidates.filter(c => (c.stage || '').toLowerCase() === 'hired').length, [candidates]);

  const stats = useMemo(() => [
    { 
      label: 'Total Candidates', 
      value: candidates.length, 
      sub: candidates.length > 0 ? `${candidates.length} active applicants` : 'No candidates yet',
      trendPct: candidates.length > 0 ? `+${candidates.length}` : '0',
      icon: Users, 
      bg: 'bg-blue-50 dark:bg-blue-950/30', 
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => setFilteredStatus('')
    },
    { 
      label: 'Shortlisted', 
      value: shortlistedCount, 
      sub: shortlistedCount > 0 ? `${shortlistedCount} qualified matches` : '0 shortlisted',
      trendPct: shortlistedCount > 0 ? `+${shortlistedCount}` : '0',
      icon: CheckCircle2, 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => setFilteredStatus('Shortlisted')
    },
    { 
      label: 'Interviewing', 
      value: interviewingCount, 
      sub: interviewingCount > 0 ? `${interviewingCount} in active rounds` : '0 interviewing',
      trendPct: interviewingCount > 0 ? `+${interviewingCount}` : '0',
      icon: Clock, 
      bg: 'bg-purple-50 dark:bg-purple-950/30', 
      iconColor: 'text-purple-600 dark:text-purple-400',
      onClick: () => setFilteredStatus('Interview')
    },
    { 
      label: 'Hires', 
      value: hiresCount, 
      sub: hiresCount > 0 ? `${hiresCount} joined team` : '0 hires',
      trendPct: hiresCount > 0 ? `+${hiresCount}` : '0',
      icon: Briefcase, 
      bg: 'bg-teal-50 dark:bg-teal-950/30', 
      iconColor: 'text-teal-600 dark:text-teal-400',
      onClick: () => setFilteredStatus('Hired')
    },
  ], [candidates.length, shortlistedCount, interviewingCount, hiresCount, setFilteredStatus]);

  const getStatusStyle = (stage) => {
    const s = (stage || '').toLowerCase();
    switch (s) {
      case 'shortlisted': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40';
      case 'interview': 
      case 'interviewing': return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40';
      case 'screening': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40';
      case 'offer': 
      case 'offered': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40';
      case 'hired': return 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/40';
      case 'rejected': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CA';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        (c.name || '').toLowerCase().includes(q) || 
        (c.email || '').toLowerCase().includes(q) || 
        (c.role || '').toLowerCase().includes(q) ||
        (c.skills && Array.isArray(c.skills) && c.skills.some(s => s.toLowerCase().includes(q)));
      
      const matchRole = !filteredRole || c.role === filteredRole;

      let matchAI = true;
      if (filteredMatch === '90') matchAI = (c.match || 0) >= 90;
      if (filteredMatch === '75') matchAI = (c.match || 0) >= 75 && (c.match || 0) < 90;
      if (filteredMatch === 'under75') matchAI = (c.match || 0) < 75;
      
      const matchStatus = !filteredStatus || (c.stage || '').toLowerCase() === filteredStatus.toLowerCase();

      return matchSearch && matchRole && matchAI && matchStatus;
    });
  }, [candidates, searchTerm, filteredRole, filteredMatch, filteredStatus]);

  const handleOpenEdit = (cand) => {
    setEditingCandidate(cand.id);
    setFormData({ 
      name: cand.name || '',
      email: cand.email || '',
      phone: cand.phone || '',
      role: cand.role || '',
      exp: cand.exp || cand.experience || '1-3 Years',
      match: cand.match !== null && cand.match !== undefined ? cand.match : 80,
      stage: cand.stage || 'Applied',
      status: cand.status || cand.stage || 'Applied',
      location: cand.location || '',
      interviewers: cand.interviewers || []
    });
    setIsModalOpen(true);
    setSelectedCandidate(null);
  };

  const handleExportCandidates = () => {
    setIsExporting(true);
    showToast('Compiling candidates database...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Name', 'Email', 'Role Applied', 'Experience', 'AI Match', 'Stage', 'Phone', 'Location'];
        const rows = candidates.map(c => [
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.role || '').replace(/"/g, '""')}"`,
          `"${(c.exp || c.experience || '').replace(/"/g, '""')}"`,
          `"${c.match !== null && c.match !== undefined ? c.match + '%' : 'N/A'}"`,
          `"${(c.stage || 'Applied').replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          `"${(c.location || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Candidates exported successfully!', 'success');
      } catch (err) {
        showToast('Error exporting candidates', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      return showToast("Name and Email are required", "error");
    }
    
    setIsSubmitting(true);
    const processedData = {
      ...formData,
      status: formData.stage,
      img: formData.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
    };

    try {
      if (editingCandidate) {
        await updateCandidate(editingCandidate, processedData);
      } else {
        await addCandidate(processedData);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageChange = async (id, newStage) => {
    if (!id || !newStage) return;
    setIsUpdatingStage(true);
    try {
      setSelectedCandidate(prev => prev ? ({ ...prev, stage: newStage, status: newStage }) : null);
      await moveCandidateStage(id, newStage);
    } catch (err) {
      console.error('Failed to update stage:', err);
      showToast('Failed to update pipeline stage', 'error');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* Header Section */}
      <PageHeader
        title="Candidates"
        description="Review applicants, score talent, and guide candidates through the hiring pipeline"
        actions={
          <>
            <PermissionGate module="candidates" action="create">
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(true)} 
                className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
              >
                <Upload size={16} className="text-slate-500" />
                <span>Import</span>
              </button>
            </PermissionGate>
            <PermissionGate module="candidates" action="view">
              <button 
                type="button"
                onClick={handleExportCandidates}
                disabled={isExporting}
                className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin text-slate-500" /> : <Download size={16} className="text-slate-500" />}
                <span>Bulk Export</span>
              </button>
            </PermissionGate>
            <PermissionGate module="candidates" action="create">
              <button 
                type="button"
                onClick={handleOpenCreate}
                className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
              >
                 <Plus size={16} />
                 <span>Add Candidate</span>
              </button>
            </PermissionGate>
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
            sub={stat.sub}
            trendPct={stat.trendPct}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
          <input 
            type="text" 
            placeholder="Search by candidate name, email, role, or skills..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select 
            value={filteredRole} 
            onChange={e => setFilteredRole(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            {allAvailableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select 
            value={filteredMatch} 
            onChange={e => setFilteredMatch(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="">All AI Match Ranges</option>
            <option value="90">90% + High Match</option>
            <option value="75">75% - 89% Qualified</option>
            <option value="under75">&lt; 75% Review Needed</option>
          </select>

          <select 
            value={filteredStatus} 
            onChange={e => setFilteredStatus(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="">All Stages</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>

          {(searchTerm || filteredRole || filteredMatch || filteredStatus) && (
            <button 
              type="button"
              onClick={() => { setSearchTerm(''); setFilteredRole(''); setFilteredMatch(''); setFilteredStatus(''); }}
              className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-bold select-none"
              title="Reset Filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[300px]">
        {filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
            <Users size={40} className="text-slate-300 dark:text-slate-600 mb-2"/>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No candidates found</h3>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Try adjusting your filters or add a new candidate applicant.</p>
            <button 
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer select-none"
            >
              <Plus size={14} />
              <span>Add Candidate</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="hcm-table w-full text-left min-w-[760px]">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th text-left">Candidate Info</th>
                  <th className="hcm-th text-left">Role Applied</th>
                  <th className="hcm-th text-center">AI Match</th>
                  <th className="hcm-th text-left">Stage</th>
                  <th className="hcm-th text-left">Resume</th>
                  <th className="hcm-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
                    <td 
                      className="hcm-td cursor-pointer" 
                      onClick={async () => {
                        setSelectedCandidate(cand);
                        try { await hrAPI.trackCandidateProfile(cand.id, { action: 'view' }); } catch(e) {}
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {cand.img && !cand.img.includes('ui-avatars.com') ? (
                          <img 
                            src={cand.img} 
                            alt={cand.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {getInitials(cand.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none hover:text-primary-600 transition-colors truncate max-w-[180px]">{cand.name}</p>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">{cand.email}</p>
                        </div>
                      </div>
                    </td>

                    <td 
                      className="hcm-td cursor-pointer" 
                      onClick={async () => {
                        setSelectedCandidate(cand);
                        try { await hrAPI.trackCandidateProfile(cand.id, { action: 'view' }); } catch(e) {}
                      }}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{cand.role || 'General'}</p>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{cand.exp || cand.experience || 'Entry'} Exp</p>
                      </div>
                    </td>

                    <td className="hcm-td text-center">
                      {cand.isInvalidResume ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40">
                            Invalid Resume
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                           <span className={cn("text-xs font-bold", 
                             (cand.match || 0) >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
                             (cand.match || 0) >= 50 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                           )}>
                             {cand.match !== null && cand.match !== undefined ? `${cand.match}%` : 'Pending'}
                           </span>
                           <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all", 
                                  (cand.match || 0) >= 80 ? "bg-emerald-500" : 
                                  (cand.match || 0) >= 50 ? "bg-indigo-500" : "bg-slate-400"
                                )} 
                                style={{ width: `${Math.max(4, cand.match || 0)}%` }} 
                              />
                           </div>
                        </div>
                      )}
                    </td>

                    <td className="hcm-td">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block whitespace-nowrap", getStatusStyle(cand.stage))}>
                        {cand.stage || 'Applied'}
                      </span>
                    </td>

                    <td className="hcm-td">
                      <button 
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setPreviewingResume(cand);
                          try { await hrAPI.trackCandidateProfile(cand.id, { action: 'download' }); } catch(err) {}
                        }}
                        className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer"
                        title="Preview Resume"
                      >
                         <FileText size={13} className="text-slate-500" />
                         <span>Resume</span>
                      </button>
                    </td>

                    <td className="hcm-td text-right">
                      <div className="flex justify-end items-center gap-1">
                        <button 
                          type="button"
                          onClick={async () => {
                            setSelectedCandidate(cand);
                            try { await hrAPI.trackCandidateProfile(cand.id, { action: 'view' }); } catch(err) {}
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                          title="View Candidate Details"
                        >
                          <Eye size={16} />
                        </button>

                        <PermissionGate module="interviews" action="create">
                          <button 
                            type="button"
                            onClick={() => navigate('/hr/interviews', { state: { openCreate: true, candidate: cand.name } })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer select-none"
                            title="Schedule Interview"
                          >
                            <Calendar size={16} />
                          </button>
                        </PermissionGate>
                        <PermissionGate module="candidates" action="delete">
                          <button 
                            type="button"
                            onClick={() => setCandidateToDelete(cand)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer select-none"
                            title="Delete Candidate"
                          >
                            <Trash2 size={16} />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Details Drawer */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedCandidate(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10"
            >
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                     {selectedCandidate.img && !selectedCandidate.img.includes('ui-avatars.com') ? (
                       <img 
                         src={selectedCandidate.img} 
                         alt={selectedCandidate.name}
                         className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                       />
                     ) : (
                       <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                         {getInitials(selectedCandidate.name)}
                       </div>
                     )}
                     <div className="min-w-0">
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">{selectedCandidate.name}</h2>
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate">{selectedCandidate.role}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleOpenEdit(selectedCandidate)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                        title="Edit Candidate"
                      >
                         <Edit3 size={18} />
                      </button>

                      <button 
                        type="button"
                        onClick={() => setSelectedCandidate(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                        title="Close"
                      >
                        <X size={20} />
                      </button>
                  </div>
               </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 bg-white dark:bg-slate-900">
                  {/* Grid Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">AI Match Score</p>
                        <p className={cn("text-xl font-extrabold", (selectedCandidate.match || 0) >= 80 ? "text-emerald-600" : "text-primary-600")}>
                          {selectedCandidate.match !== null && selectedCandidate.match !== undefined ? `${selectedCandidate.match}%` : '0%'}
                        </p>
                     </div>

                     <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Current Stage</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block mt-0.5", getStatusStyle(selectedCandidate.stage))}>
                          {selectedCandidate.stage || 'Applied'}
                        </span>
                     </div>

                     <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Experience</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{selectedCandidate.exp || selectedCandidate.experience || 'Not Specified'}</p>
                     </div>

                     <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Location</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{selectedCandidate.location || 'Not Specified'}</p>
                     </div>
                  </div>

                  {/* Stage Quick Switcher */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Advance Pipeline Stage
                      </label>
                      {isUpdatingStage && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Updating...</span>
                        </span>
                      )}
                    </div>
                    <select 
                      value={selectedCandidate.stage || 'Applied'} 
                      disabled={isUpdatingStage}
                      onChange={(e) => handleStageChange(selectedCandidate.id, e.target.value)}
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Assigned Interviewers */}
                  <div className="space-y-2.5">
                     <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned Interviewers</h3>
                     <div className="flex flex-wrap gap-2">
                        {assignedInterviewers.length > 0 ? (
                           assignedInterviewers.map((name, idx) => (
                              <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <UserCheck size={14} className="text-primary-600 dark:text-primary-400" />
                                <span>{name}</span>
                              </div>
                           ))
                        ) : (
                           <span className="text-xs text-slate-400 dark:text-slate-500 italic">No interviewers assigned yet</span>
                        )}
                     </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2.5">
                     <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Details</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-0">
                           <Mail size={15} className="text-slate-400 shrink-0" />
                           {selectedCandidate.email ? (
                             <a href={`mailto:${selectedCandidate.email}`} className="font-medium truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                               {selectedCandidate.email}
                             </a>
                           ) : (
                             <span className="font-medium text-slate-400 truncate">Not Provided</span>
                           )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-0">
                           <Phone size={15} className="text-slate-400 shrink-0" />
                           {selectedCandidate.phone ? (
                             <a href={`tel:${selectedCandidate.phone}`} className="font-medium truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                               {selectedCandidate.phone}
                             </a>
                           ) : (
                             <span className="font-medium text-slate-400 truncate">Not Provided</span>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* AI Summary Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Executive Brief</h3>
                      <div className="flex items-center gap-2">
                        {isEditedSummary && (
                          <button
                            type="button"
                            onClick={() => handleSaveSummary()}
                            className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                            title="Save summary edits"
                          >
                            <CheckCircle2 size={13} />
                            <span>Save</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleGenerateSummary(false)}
                          disabled={isGeneratingSummary}
                          className="h-8 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer select-none disabled:opacity-60"
                        >
                          {isGeneratingSummary ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13}/>}
                          <span>Draft Brief with AI</span>
                        </button>
                      </div>
                    </div>

                    <textarea 
                      value={candidateSummaryText} 
                      onChange={(e) => {
                        setCandidateSummaryText(e.target.value);
                        setIsEditedSummary(true);
                      }} 
                      onBlur={() => {
                        if (isEditedSummary) {
                          handleSaveSummary();
                        }
                      }}
                      rows={5} 
                      placeholder="AI executive summary of candidate qualifications and resume profile..."
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed resize-y min-h-[110px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setPreviewingResume(selectedCandidate)}
                    className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 select-none cursor-pointer flex-1 sm:flex-none"
                  >
                    <FileText size={15} />
                    <span>View Resume</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      const candidateName = selectedCandidate.name;
                      setSelectedCandidate(null);
                      navigate('/hr/interviews', { state: { openCreate: true, candidate: candidateName } });
                    }}
                    className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md shadow-primary-500/20 transition-all active:scale-95 select-none cursor-pointer flex-1 sm:flex-none"
                  >
                    <Calendar size={15} />
                    <span>Schedule Interview</span>
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resume Preview Modal */}
      <AnimatePresence>
        {previewingResume && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setPreviewingResume(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-primary-600"/>
                  <span>Resume Preview — {previewingResume.name}</span>
                </h3>
                <div className="flex items-center gap-2">
                  {previewingResume.resumeUrl && (
                    <a 
                      href={previewingResume.resumeUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      download
                      className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}
                  <button 
                    type="button"
                    onClick={() => setPreviewingResume(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-y-auto p-4 flex justify-center min-h-[50vh]">
                {previewingResume.resumeUrl ? (
                  <iframe 
                    src={previewingResume.resumeUrl} 
                    title="Resume" 
                    className="w-full h-full min-h-[450px] border-0 rounded-xl bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                    <FileText size={48} className="text-slate-300 dark:text-slate-600 mb-2"/>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Resume Document Attached</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">{previewingResume.name} applied with online profile information.</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setPreviewingResume(null)}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Candidate Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={() => !isSubmitting && setIsModalOpen(false)} 
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 15 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 15 }}
               className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10"
             >
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                   <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                     {editingCandidate ? 'Edit Candidate Profile' : 'Add New Candidate'}
                   </h2>
                   <button 
                     type="button"
                     onClick={() => !isSubmitting && setIsModalOpen(false)}
                     className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                   >
                     <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
                  <div className="p-6 space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                             Full Name <span className="text-rose-500">*</span>
                           </label>
                           <input 
                             required 
                             type="text" 
                             value={formData.name} 
                             onChange={e => setFormData({...formData, name: e.target.value})} 
                             placeholder="e.g. John Doe" 
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
                             value={formData.email} 
                             onChange={e => setFormData({...formData, email: e.target.value})} 
                             placeholder="john@example.com" 
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Phone Number</label>
                           <input 
                             type="text" 
                             value={formData.phone} 
                             onChange={e => setFormData({...formData, phone: e.target.value})} 
                             placeholder="e.g. +1 (555) 000-0000" 
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Role Applied For</label>
                           <select 
                             value={formData.role} 
                             onChange={e => setFormData({...formData, role: e.target.value})}
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                           >
                             {allAvailableRoles.map(role => (
                               <option key={role} value={role}>{role}</option>
                             ))}
                             {allAvailableRoles.length === 0 && (
                               <option value="Software Engineer">Software Engineer</option>
                             )}
                           </select>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Experience Level</label>
                           <select
                             value={formData.exp} 
                             onChange={e => setFormData({...formData, exp: e.target.value})}
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                           >
                             <option value="Entry Level (0-1 Year)">Entry Level (0-1 Year)</option>
                             <option value="1-3 Years">1-3 Years</option>
                             <option value="3-5 Years">3-5 Years</option>
                             <option value="5-8 Years">5-8 Years</option>
                             <option value="8+ Years">8+ Years</option>
                             <option value="Fresher">Fresher / Intern</option>
                           </select>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">AI Match Score (%)</label>
                           <input 
                             type="number" 
                             min="0" 
                             max="100" 
                             value={formData.match} 
                             onChange={e => setFormData({...formData, match: parseInt(e.target.value, 10) || 0})}
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Pipeline Stage</label>
                           <select 
                             value={formData.stage} 
                             onChange={e => setFormData({...formData, stage: e.target.value})}
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                           >
                              <option value="Applied">Applied</option>
                              <option value="Screening">Screening</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interview">Interview</option>
                              <option value="Offer">Offer</option>
                              <option value="Hired">Hired</option>
                              <option value="Rejected">Rejected</option>
                           </select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                           <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Location / City</label>
                           <input 
                             type="text" 
                             value={formData.location} 
                             onChange={e => setFormData({...formData, location: e.target.value})} 
                             placeholder="e.g. San Francisco, USA or Remote" 
                             className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                           />
                        </div>

                        <div className="space-y-2.5 md:col-span-2">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                               <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                                 Assign Interviewers & Hiring Team
                                </label>
                                {(formData.interviewers || []).length > 0 && (
                                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 rounded-full border border-primary-200 dark:border-primary-900/60">
                                    {(formData.interviewers || []).length} Selected
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs">
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({ ...formData, interviewers: teamMembers.map(m => m.name) })}
                                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold cursor-pointer"
                                >
                                  Select All
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({ ...formData, interviewers: [] })}
                                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-semibold cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                           </div>

                           {/* Inline Quick Search */}
                           <div className="relative">
                             <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                             <input 
                               type="text" 
                               placeholder="Filter team by name or department..." 
                               value={interviewerSearch} 
                               onChange={e => setInterviewerSearch(e.target.value)}
                               className="w-full h-9 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                             />
                           </div>

                           {/* Interactive Identity Cards Grid */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-1 scrollbar-thin">
                             {teamMembers
                               .filter(m => {
                                 const q = interviewerSearch.toLowerCase().trim();
                                 return !q || m.name.toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q);
                               })
                               .map(member => {
                                 const isSelected = (formData.interviewers || []).includes(member.name);
                                 return (
                                   <div
                                     key={member.id || member.name}
                                     onClick={() => {
                                       const current = formData.interviewers || [];
                                       const updated = isSelected 
                                         ? current.filter(n => n !== member.name)
                                         : [...current, member.name];
                                       setFormData({ ...formData, interviewers: updated });
                                     }}
                                     className={cn("p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                                       isSelected 
                                         ? "bg-primary-50/80 dark:bg-primary-950/40 border-primary-500 dark:border-primary-600 shadow-sm ring-1 ring-primary-500/30" 
                                         : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                                     )}
                                   >
                                     <div className="flex items-center gap-2.5 min-w-0">
                                       <img 
                                         src={member.img} 
                                         alt={member.name}
                                         className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                       />
                                       <div className="min-w-0">
                                         <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                                           {member.name}
                                         </p>
                                         <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                                           {member.role}
                                         </span>
                                       </div>
                                     </div>

                                     <div className={cn(
                                       "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                                       isSelected 
                                         ? "bg-primary-600 border-primary-600 text-white shadow-sm" 
                                         : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                     )}>
                                       {isSelected && <CheckCircle2 size={13}/>}
                                     </div>
                                   </div>
                                 );
                               })}

                             {teamMembers.length === 0 && (
                               <div className="col-span-2 text-center py-6 text-slate-400 dark:text-slate-500">
                                 <Users size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                                 <p className="text-xs font-medium">No company team members found</p>
                               </div>
                             )}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3 shrink-0">
                     <button 
                       type="button" 
                       disabled={isSubmitting}
                       onClick={() => setIsModalOpen(false)}
                       className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 disabled:opacity-50 select-none cursor-pointer"
                     >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        <span>{editingCandidate ? 'Save Changes' : 'Add Candidate'}</span>
                     </button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="candidates"
      />

      <ConfirmDialog
        isOpen={!!candidateToDelete}
        onClose={() => setCandidateToDelete(null)}
        onConfirm={() => {
          deleteCandidate(candidateToDelete.id);
          setCandidateToDelete(null);
        }}
        title="Delete Candidate Application"
        message={`Are you sure you want to permanently remove ${candidateToDelete?.name}'s application?`}
      />

      <ConfirmDialog
        isOpen={showConfirmOverwrite}
        onClose={() => setShowConfirmOverwrite(false)}
        onConfirm={() => handleGenerateSummary(true)}
        title="Overwrite Manually Edited Summary?"
        message="Generating a new AI executive brief will replace your existing edits. Do you wish to proceed?"
      />
    </div>
  );
};

export default Candidates;

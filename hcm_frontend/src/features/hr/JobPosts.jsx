import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download, RotateCcw,
  Users, Briefcase, MapPin, DollarSign,
  CheckCircle2, AlertCircle, X, FileText,
  Edit2, Archive, Trash2,
  Sparkles, Loader2, GraduationCap, Upload, Building2,
  ChevronRight
} from 'lucide-react';
import { adminAPI } from '../../utils/apiService';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useDateFormat } from '../../hooks/useDateFormat';
import StatCard from '../../shared/components/ui/StatCard';
import PermissionGate from '../../shared/components/common/PermissionGate';
import ImportModal from '../../shared/components/import/ImportModal';
import PageHeader from '../../shared/components/ui/PageHeader';

const JobPosts = () => {
  const { getSymbol } = useCurrency();
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();
  const location = useLocation();

  const { jobs = [], addJob, updateJob, deleteJob, showToast, fetchJobs } = useHR();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDept, setFilteredDept] = useState('');
  const [filteredStatus, setFilteredStatus] = useState('');
  const [filteredType, setFilteredType] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [realDepartments, setRealDepartments] = useState([]);

  // Fetch live organization departments
  useEffect(() => {
    let isMounted = true;
    const loadDepts = async () => {
      try {
        const res = await adminAPI.getDepartments();
        if (res.data?.data && Array.isArray(res.data.data)) {
          const names = res.data.data.map(d => d.name).filter(Boolean);
          if (isMounted && names.length > 0) {
            setRealDepartments([...new Set(names)].sort());
          }
        }
      } catch (err) {
        // Fallback gracefully to existing job departments
      }
    };
    loadDepts();
    return () => { isMounted = false; };
  }, []);

  const availableDepartments = useMemo(() => {
    const fromJobs = jobs.map(j => j.department).filter(Boolean);
    const combined = [...new Set([...realDepartments, ...fromJobs])];
    return combined.length > 0 ? combined.sort() : ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Human Resources'];
  }, [realDepartments, jobs]);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    openings: 1,
    salary: '',
    type: 'Full Time',
    description: '',
    status: 'Published',
    requirements: '',
    location: '',
    experience: ''
  });

  const handleOpenCreate = useCallback(() => {
    setEditingJob(null);
    setFormData({ 
      title: '', 
      department: availableDepartments[0] || 'Engineering', 
      openings: 1, 
      salary: '', 
      type: 'Full Time', 
      description: '', 
      status: 'Published', 
      requirements: '', 
      location: '', 
      experience: '' 
    });
    setIsModalOpen(true);
  }, [availableDepartments]);

  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenCreate();
    }
  }, [location, handleOpenCreate]);

  const handleExportJobs = () => {
    setIsExporting(true);
    showToast('Preparing job listings export...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Job Title', 'Department', 'Job Type', 'Location', 'Experience', 'Salary Range', 'Openings', 'Status', 'Applicants', 'Date Posted'];
        const rows = jobs.map(j => [
          `"${(j.title || '').replace(/"/g, '""')}"`,
          `"${(j.department || '').replace(/"/g, '""')}"`,
          `"${(j.type || j.jobType || '').replace(/"/g, '""')}"`,
          `"${(j.location || '').replace(/"/g, '""')}"`,
          `"${(j.experience || '').replace(/"/g, '""')}"`,
          `"${(j.salary || j.salaryRange || 'N/A').replace(/"/g, '""')}"`,
          `"${j.openings || 1}"`,
          `"${(j.status || 'Published').replace(/"/g, '""')}"`,
          `"${j.applied || 0}"`,
          `"${(j.date || (j.createdAt ? formatDate(j.createdAt) : '')).replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `job_listings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Job posts exported successfully!', 'success');
      } catch (err) {
        showToast('Error exporting job posts', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  // Dynamic statistics
  const publishedCount = useMemo(() => {
    return jobs.filter(j => j.status === 'Published' || j.status === 'PUBLISHED' || j.isActive === true).length;
  }, [jobs]);

  const draftCount = useMemo(() => {
    return jobs.filter(j => j.status === 'Draft' || j.status === 'DRAFT').length;
  }, [jobs]);

  const closedCount = useMemo(() => {
    return jobs.filter(j => j.status === 'Closed' || j.status === 'CLOSED' || (!j.isActive && j.status !== 'Draft' && j.status !== 'DRAFT')).length;
  }, [jobs]);

  const stats = useMemo(() => [
    { 
      label: 'Total Jobs', 
      value: jobs.length, 
      sub: jobs.length > 0 ? `${jobs.length} total positions` : 'No job posts',
      trendPct: jobs.length > 0 ? `+${jobs.length}` : '0',
      icon: Briefcase, 
      bg: 'bg-blue-50 dark:bg-blue-950/30', 
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => setFilteredStatus('')
    },
    { 
      label: 'Published', 
      value: publishedCount, 
      sub: publishedCount > 0 ? `${publishedCount} active hiring` : 'No published openings',
      trendPct: publishedCount > 0 ? `+${publishedCount}` : '0',
      icon: CheckCircle2, 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => setFilteredStatus('Published')
    },
    { 
      label: 'Drafts', 
      value: draftCount, 
      sub: draftCount > 0 ? `${draftCount} in preparation` : '0 draft openings',
      trendPct: draftCount > 0 ? `${draftCount}` : '0',
      icon: FileText, 
      bg: 'bg-amber-50 dark:bg-amber-950/30', 
      iconColor: 'text-amber-600 dark:text-amber-400',
      onClick: () => setFilteredStatus('Draft')
    },
    { 
      label: 'Closed', 
      value: closedCount, 
      sub: closedCount > 0 ? `${closedCount} archived positions` : '0 closed openings',
      trendPct: closedCount > 0 ? `${closedCount}` : '0',
      icon: Archive, 
      bg: 'bg-slate-100 dark:bg-slate-800/40', 
      iconColor: 'text-slate-600 dark:text-slate-400',
      onClick: () => setFilteredStatus('Closed')
    },
  ], [jobs.length, publishedCount, draftCount, closedCount]);

  const getStatusBadge = (status, isActive) => {
    const norm = (status || (isActive ? 'Published' : 'Closed')).toLowerCase();
    if (norm === 'published' || norm === 'active') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 inline-block whitespace-nowrap">
          Published
        </span>
      );
    }
    if (norm === 'draft') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 inline-block whitespace-nowrap">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block whitespace-nowrap">
        Closed
      </span>
    );
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job.id);
    setFormData({
      title: job.title || '',
      department: job.department || (availableDepartments[0] || 'Engineering'),
      openings: job.openings || 1,
      salary: job.salary || job.salaryRange || '',
      type: job.type || job.jobType || 'Full Time',
      description: job.description || '',
      status: job.status || (job.isActive ? 'Published' : 'Closed'),
      requirements: job.requirements || '',
      location: job.location || '',
      experience: job.experience || ''
    });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = (job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!jobToDelete) return;
    try {
      await deleteJob(jobToDelete.id);
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (err) {
      showToast('Failed to delete job post', 'error');
    }
  };

  const handleAIGenerateDescription = () => {
    if (!formData.title.trim()) {
      showToast("Please enter a Job Title first", "error");
      return;
    }
    setIsGeneratingAI(true);
    showToast("AI Copilot is drafting a custom description...", "info");

    setTimeout(() => {
      const title = formData.title.trim();
      const dept = formData.department || 'General';
      const exp = formData.experience || 'Relevant background';
      const type = formData.type || 'Full Time';
      const skills = formData.requirements ? `with emphasis on ${formData.requirements}` : '';

      const draft = `Role Overview:
We are actively seeking a talented ${title} to join our ${dept} team on a ${type} basis. In this role, you will collaborate across multidisciplinary groups to deliver high-impact results, solve complex challenges, and contribute to our strategic roadmap ${skills}.

Key Responsibilities:
• Lead and execute key initiatives aligned with the ${dept} department goals.
• Collaborate closely with cross-functional stakeholders and leadership.
• Design, implement, and optimize workflows for maximum scalability and output.
• Champion industry best practices, quality standards, and continuous improvements.

Requirements & Qualifications:
• Demonstrated background in a similar capacity (${exp}).
• Strong problem-solving, analytical, and interpersonal communication skills.
• Proficiency in relevant modern frameworks, workflows, and industry standards.
• Ability to thrive in a fast-paced, collaborative team environment.`;

      setFormData(prev => ({ ...prev, description: draft }));
      setIsGeneratingAI(false);
      showToast("Job description generated successfully!", "success");
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return showToast("Job Title is required", "error");
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      salaryRange: formData.salary,
      jobType: formData.type,
      openings: parseInt(formData.openings, 10) || 1
    };

    try {
      if (editingJob) {
        await updateJob(editingJob, payload);
      } else {
        await addJob(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        (j.title || '').toLowerCase().includes(query) ||
        (j.department || '').toLowerCase().includes(query) ||
        (j.location || '').toLowerCase().includes(query) ||
        (j.requirements || '').toLowerCase().includes(query);
      
      const matchDept = !filteredDept || j.department === filteredDept;
      const matchStatus = !filteredStatus || (j.status || (j.isActive ? 'Published' : 'Closed')) === filteredStatus;
      const matchType = !filteredType || (j.type === filteredType || j.jobType === filteredType);

      return matchSearch && matchDept && matchStatus && matchType;
    });
  }, [jobs, searchTerm, filteredDept, filteredStatus, filteredType]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* Header Section */}
      <PageHeader
        title="Job Posts"
        description="Create, manage, and publish hiring opportunities across your organization"
        actions={
          <>
            <PermissionGate module="job_posts" action="manage">
              <button
                type="button"
                onClick={handleExportJobs}
                disabled={isExporting}
                className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin text-slate-500" /> : <Download size={16} className="text-slate-500" />}
                <span>Export Jobs</span>
              </button>
            </PermissionGate>
            <PermissionGate module="job_posts" action="create">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
              >
                <Upload size={16} className="text-slate-500" />
                <span>Import Jobs</span>
              </button>
              <button 
                type="button"
                onClick={handleOpenCreate}
                className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Create New Job</span>
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
            placeholder="Search by job title, department, skills, or location..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select 
            value={filteredDept}
            onChange={e => setFilteredDept(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select 
            value={filteredType}
            onChange={e => setFilteredType(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Full Time">Full Time</option>
            <option value="Remote">Remote</option>
            <option value="Contract">Contract</option>
            <option value="Part Time">Part Time</option>
            <option value="Internship">Internship</option>
          </select>

          <select 
            value={filteredStatus}
            onChange={e => setFilteredStatus(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>

          {(searchTerm || filteredDept || filteredStatus || filteredType) && (
            <button 
              type="button"
              onClick={() => { setSearchTerm(''); setFilteredDept(''); setFilteredStatus(''); setFilteredType(''); }}
              className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-bold select-none"
              title="Reset Filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[300px]">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
            <Briefcase size={40} className="text-slate-300 dark:text-slate-600 mb-2"/>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No job posts match your criteria</h3>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Try adjusting your filters or create a new job opening.</p>
            <button 
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer select-none"
            >
              <Plus size={14} />
              <span>Create New Job</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="hcm-table w-full text-left min-w-[720px]">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th text-left">Job Title & Date</th>
                  <th className="hcm-th text-left">Department</th>
                  <th className="hcm-th text-left">Type / Openings</th>
                  <th className="hcm-th text-left">Salary Range</th>
                  <th className="hcm-th text-left">Status</th>
                  <th className="hcm-th text-center">Applicants</th>
                  <th className="hcm-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
                    <td className="hcm-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-extrabold text-xs shrink-0 shadow-xs">
                          {(job.title || 'J')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{job.title}</p>
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            Posted {job.date || (job.createdAt ? formatDate(job.createdAt) : 'Recently')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hcm-td">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                        <Building2 size={13} className="text-slate-400 shrink-0"/>
                        <span>{job.department || 'General'}</span>
                      </span>
                    </td>
                    <td className="hcm-td">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{job.type || job.jobType || 'Full Time'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[160px]">
                          {job.openings || 1} {job.openings === 1 ? 'position' : 'positions'} {job.location ? `• ${job.location}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="hcm-td">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {job.salary || job.salaryRange || 'Competitive'}
                      </span>
                    </td>
                    <td className="hcm-td">
                      {getStatusBadge(job.status, job.isActive)}
                    </td>
                    <td className="hcm-td text-center">
                      <button
                        type="button"
                        onClick={() => navigate('/hr/candidates', { state: { search: job.title } })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors cursor-pointer select-none"
                        title="View Candidates for this role"
                      >
                        <Users size={13}/>
                        <span>{job.applied || 0}</span>
                      </button>
                    </td>
                    <td className="hcm-td text-right">
                      <div className="flex justify-end items-center gap-1">
                        <PermissionGate module="job_posts" action="edit">
                          <button 
                            type="button"
                            onClick={() => updateJob(job.id, { 
                              status: job.status === 'Published' ? 'Closed' : 'Published',
                              isActive: job.status !== 'Published'
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer select-none"
                            title={job.status === 'Published' ? 'Archive / Close Job' : 'Publish Job'}
                          >
                            <Archive size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                            title="Edit Job Post"
                          >
                            <Edit2 size={16} />
                          </button>
                        </PermissionGate>
                        <PermissionGate module="job_posts" action="delete">
                          <button 
                            type="button"
                            onClick={() => handleConfirmDelete(job)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer select-none"
                            title="Delete Job Post"
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

      {/* Create / Edit Job Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {editingJob ? 'Edit Job Opening' : 'Create New Job Opening'}
                </h2>
                <button 
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                        Job Title <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })} 
                        placeholder="e.g. Senior Full Stack Engineer" 
                        className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Department</label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      >
                        {availableDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Salary Range</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          value={formData.salary}
                          onChange={e => setFormData({ ...formData, salary: e.target.value })} 
                          placeholder={`e.g. ${getSymbol()}80,000 - ${getSymbol()}120,000`}
                          className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Job Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Remote">Remote</option>
                        <option value="Contract">Contract</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. New York, USA or Remote"
                          className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Experience Level</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                        <select
                          value={formData.experience}
                          onChange={e => setFormData({ ...formData, experience: e.target.value })}
                          className="w-full h-10 pl-9 pr-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                        >
                          <option value="">Any Experience</option>
                          <option value="Entry Level (0-1 Year)">Entry Level (0-1 Year)</option>
                          <option value="1-3 Years">1-3 Years</option>
                          <option value="3-5 Years">3-5 Years</option>
                          <option value="5-8 Years">5-8 Years</option>
                          <option value="8+ Years">8+ Years</option>
                          <option value="Intern">Intern / Fresher</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Openings</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={formData.openings}
                        onChange={e => setFormData({ ...formData, openings: e.target.value })}
                        className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Required Skills</label>
                    <textarea 
                      value={formData.requirements} 
                      onChange={e => setFormData({ ...formData, requirements: e.target.value })} 
                      rows={2}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[70px] resize-y"
                      placeholder="e.g. React, Node.js, TypeScript, SQL (comma-separated)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Job Description</label>
                      <button
                        type="button"
                        onClick={handleAIGenerateDescription}
                        disabled={isGeneratingAI}
                        className="h-8 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                      >
                        {isGeneratingAI ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13}/>}
                        <span>Draft with AI</span>
                      </button>
                    </div>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      rows={6}
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all min-h-[140px] resize-y"
                      placeholder="Enter detailed job overview, responsibilities, and qualifications..."
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3 shrink-0">
                  <button 
                    type="button" 
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 disabled:opacity-50 select-none cursor-pointer"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{editingJob ? 'Save Changes' : 'Publish Job'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && jobToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Job Post</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">"{jobToDelete.title}"</strong>?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsDeleteModalOpen(false); setJobToDelete(null); }}
                  className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={executeDelete}
                  className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-rose-500/20 select-none cursor-pointer"
                >
                  Delete Job
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entity="jobs"
        onImportSuccess={() => fetchJobs && fetchJobs()}
      />
    </div>
  );
};

export default JobPosts;

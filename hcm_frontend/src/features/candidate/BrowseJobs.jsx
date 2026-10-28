import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Briefcase, DollarSign, Clock, Filter, RotateCcw, Bookmark,
  ChevronRight, X, Users, GraduationCap, Calendar, Layers, ArrowRight, CheckCircle2,
  BookmarkCheck, Info, Send, FileText, Globe, Zap, ChevronDown, Loader2,
  Building2, Sparkles, ShieldCheck, Mail, ArrowUpRight, Wifi, RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import { useCurrency } from '../../hooks/useCurrency';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import PageHeader from '../../shared/components/ui/PageHeader';

// ---------------------------------------------------------------------------
// Skeleton Loaders
// ---------------------------------------------------------------------------
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const JobCardSkeleton = () => (
  <div className="card p-5 sm:p-6 flex flex-col justify-between space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex gap-3.5 items-start flex-1">
        <SkeletonBox className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-4 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBox className="w-8 h-8 rounded-xl shrink-0" />
    </div>
    <div className="flex flex-wrap gap-2">
      <SkeletonBox className="h-6 w-20 rounded-lg" />
      <SkeletonBox className="h-6 w-24 rounded-lg" />
      <SkeletonBox className="h-6 w-16 rounded-lg" />
    </div>
    <div className="space-y-2">
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-4/5" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
      <SkeletonBox className="h-8 w-24 rounded-lg" />
      <SkeletonBox className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const BrowseJobs = () => {
  const { formatCurrency, getSymbol, getIcon } = useCurrency();
  const {
    jobs = { savedIndices: [], allJobs: [] },
    saveJob,
    applyForJob,
    showToast,
    profile = {},
    applications = [],
    isLoading,
    error,
    refetch
  } = useCandidate();

  const savedIndices = useMemo(() => jobs?.savedIndices || [], [jobs?.savedIndices]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applicationPhone, setApplicationPhone] = useState(profile?.phone || '');

  // Keep phone updated when profile loads
  useEffect(() => {
    if (profile?.phone && !applicationPhone) {
      setApplicationPhone(profile.phone);
    }
  }, [profile?.phone]);

  // Set of applied job IDs
  const appliedJobIds = useMemo(() => {
    return new Set((applications || []).map(a => a.jobId));
  }, [applications]);

  // Resume selection state
  const fileInputRef = useRef(null);
  const [resumeOptions, setResumeOptions] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [prevResume, setPrevResume] = useState('');

  useEffect(() => {
    if (profile && profile.resumeUrl) {
      const fileName = profile.resumeUrl.split('/').pop() || 'My Profile Resume.pdf';
      setResumeOptions([fileName]);
      setSelectedResume(fileName);
      setPrevResume(fileName);
    } else {
      setResumeOptions([]);
      setSelectedResume('');
      setPrevResume('');
    }
  }, [profile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name;
      if (!resumeOptions.includes(fileName)) {
        setResumeOptions(prev => [...prev, fileName]);
      }
      setSelectedResume(fileName);
      setPrevResume(fileName);
      showToast(`Selected file: ${fileName}`, 'success');
    } else {
      setSelectedResume(prevResume);
    }
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    location: '',
    type: '',
    workModel: ''
  });

  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cameFromDetails, setCameFromDetails] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deep linking: Open modal automatically if ?jobId=... is in URL
  useEffect(() => {
    const jobIdFromUrl = searchParams.get('jobId');
    if (jobIdFromUrl && jobs?.allJobs?.length > 0) {
      const target = jobs.allJobs.find(j => j.id === jobIdFromUrl);
      if (target) {
        setSelectedJob(target);
      }
    }
  }, [searchParams, jobs?.allJobs]);

  // Dynamic filter option lists extracted from real active jobs
  const availableDepartments = useMemo(() => {
    const set = new Set();
    (jobs.allJobs || []).forEach(j => {
      if (j.department && j.department.trim()) {
        set.add(j.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [jobs.allJobs]);

  const availableLocations = useMemo(() => {
    const set = new Set();
    (jobs.allJobs || []).forEach(j => {
      if (j.location && j.location.trim()) {
        set.add(j.location.trim());
      }
    });
    return Array.from(set).sort();
  }, [jobs.allJobs]);

  const availableTypes = useMemo(() => {
    const set = new Set();
    (jobs.allJobs || []).forEach(j => {
      if (j.type && j.type.trim()) {
        set.add(j.type.trim());
      }
    });
    return Array.from(set).sort();
  }, [jobs.allJobs]);

  const handleApplyClick = (job, fromDetails) => {
    if (appliedJobIds.has(job.id)) {
      showToast('You have already applied for this role. Tracking your application...', 'info');
      navigate('/candidate/applications');
      return;
    }
    setSelectedJob(job);
    setIsApplyModalOpen(true);
    setCameFromDetails(fromDetails);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ department: '', location: '', type: '', workModel: '' });
    setShowSavedOnly(false);
  };

  const filteredJobs = useMemo(() => {
    if (!jobs || !jobs.allJobs) return [];
    return jobs.allJobs.filter(job => {
      if (showSavedOnly && !savedIndices.includes(job.id)) return false;
      const title = job.title || '';
      const company = job.company || '';
      const location = job.location || '';
      const type = job.type || '';
      const dept = job.department || '';
      const desc = job.desc || '';
      const reqs = Array.isArray(job.requirements) ? job.requirements.join(' ') : (job.requirements || '');

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        title.toLowerCase().includes(query) ||
        company.toLowerCase().includes(query) ||
        dept.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        reqs.toLowerCase().includes(query);

      const matchesDept = !filters.department || dept.toLowerCase() === filters.department.toLowerCase();
      const matchesLocation = !filters.location || location.toLowerCase().includes(filters.location.toLowerCase());
      const matchesType = !filters.type || type.toLowerCase() === filters.type.toLowerCase();

      return matchesSearch && matchesDept && matchesLocation && matchesType;
    }).sort((a, b) => {
      if (sortBy === 'Salary (High)') {
        const salA = a.salary || '';
        const salB = b.salary || '';
        return (parseInt(salB.replace(/\D/g, '')) || 0) - (parseInt(salA.replace(/\D/g, '')) || 0);
      }
      if (sortBy === 'Oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'Newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0; // Default Relevance / Natural order
    });
  }, [jobs.allJobs, searchTerm, filters, sortBy, showSavedOnly, savedIndices]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedJob) return;

    const formData = new FormData(e.target);
    const file = fileInputRef.current?.files[0];

    if (!file && !selectedResume) {
      showToast('Please select or upload a resume.', 'error');
      return;
    }

    setIsSubmitting(true);

    const readFileAsBase64 = (f) => new Promise((resolve) => {
      if (!f) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(f);
    });

    try {
      const base64Data = file ? await readFileAsBase64(file) : null;
      const res = await applyForJob(selectedJob.id, {
        fullName: formData.get('fullName') || profile?.fullName || '',
        email: formData.get('email') || profile?.email || '',
        phone: applicationPhone || formData.get('phone') || profile?.phone || '',
        location: formData.get('location') || profile?.location || '',
        linkedin: formData.get('linkedin') || profile?.linkedin || '',
        portfolio: formData.get('portfolio') || profile?.portfolio || '',
        skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : (profile?.skills || ''),
        expectedSalary: formData.get('expectedSalary') || '',
        availability: formData.get('availability') || 'Immediate',
        coverLetter: formData.get('coverLetter') || '',
        resumeUrl: file ? file.name : (selectedResume || profile?.resumeUrl || 'resume.pdf'),
        resumeBase64: base64Data
      });

      if (res?.success) {
        setIsApplyModalOpen(false);
        setSelectedJob(null);
        if (refetch?.fetchApplications) refetch.fetchApplications();
        if (refetch?.fetchDashboard) refetch.fetchDashboard();
      }
    } catch (err) {
      console.error('Job application submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (refetch?.fetchJobs) refetch.fetchJobs();
    if (refetch?.fetchProfile) refetch.fetchProfile();
    if (refetch?.fetchApplications) refetch.fetchApplications();
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------
  if (isLoading && (!jobs.allJobs || jobs.allJobs.length === 0)) {
    return (
      <div className="space-y-8 pb-12 max-w-7xl mx-auto text-left px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-36 rounded-full" />
            <SkeletonBox className="h-9 w-64" />
            <SkeletonBox className="h-4 w-96" />
          </div>
          <SkeletonBox className="h-11 w-48 rounded-xl" />
        </div>
        <div className="card p-6 space-y-6">
          <div className="flex justify-between items-center">
            <SkeletonBox className="h-6 w-48" />
            <SkeletonBox className="h-9 w-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonBox className="h-12 w-full rounded-xl" />
            <SkeletonBox className="h-12 w-full rounded-xl" />
            <SkeletonBox className="h-12 w-full rounded-xl" />
            <SkeletonBox className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------
  if (error && (!jobs.allJobs || jobs.allJobs.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shadow-sm">
          <Wifi size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Jobs</h3>
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
        title="Browse Jobs"
        description="Discover and apply to dynamic career openings across top organizations"
        actions={
          <button
            type="button"
            onClick={() => navigate('/candidate/applications')}
            className="btn-primary w-full sm:w-auto"
          >
            <Clock size={18} />
            <span>My Applications ({applications.length})</span>
          </button>
        }
      />

      {/* Job Search & Dynamic Filters Card */}
      <div className="card p-4 sm:p-6 md:p-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Find Your Ideal Role</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Filter by title, department, location, or work model</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={cn(
                "btn-secondary text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 shadow-sm cursor-pointer",
                showSavedOnly
                  ? "bg-primary-50 border-primary-300 text-primary-600 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-400"
                  : "hover:border-primary-400 hover:text-primary-600"
              )}
            >
              <Bookmark size={14} className={cn(showSavedOnly && "fill-primary-600 text-primary-600 dark:fill-primary-400 dark:text-primary-400")} />
              <span>{showSavedOnly ? `Saved (${savedIndices.length})` : "Show Saved"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-ghost btn-compact cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Search by title, skill, or keyword..."
              className="input-field pl-11 pr-4 h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              className="input-field pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-sm appearance-none cursor-pointer w-full select-field"
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            >
              <option value="">All Departments</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              className="input-field pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-sm appearance-none cursor-pointer w-full select-field"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            >
              <option value="">All Locations</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
          <div className="relative">
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <select
              className="input-field pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-sm appearance-none cursor-pointer w-full select-field"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Job Types</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing: <span className="text-slate-900 dark:text-white font-bold">{filteredJobs.length} Positions Available</span>
            </span>
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sort by:</span>
              <div className="relative flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-primary-600 dark:text-primary-400 pr-6 py-1 cursor-pointer focus:outline-none"
                >
                  <option value="Newest" className="dark:bg-slate-900">Newest First</option>
                  <option value="Oldest" className="dark:bg-slate-900">Oldest First</option>
                  <option value="Salary (High)" className="dark:bg-slate-900">Highest Salary</option>
                  <option value="Relevance" className="dark:bg-slate-900">Relevance</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-primary-600 dark:text-primary-400 pointer-events-none" size={13} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Job Sync Active</span>
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        <AnimatePresence>
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const isApplied = appliedJobIds.has(job.id);
              const isSaved = savedIndices.includes(job.id);

              return (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -4 }}
                  className="card p-5 sm:p-6 flex flex-col justify-between hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/60 transition-all group relative border border-slate-100 dark:border-slate-800"
                >
                  {/* Content Container */}
                  <div className="flex-1 flex flex-col">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="flex gap-3.5 items-start min-w-0 flex-1">
                        {job.companyLogo ? (
                          <img
                            src={job.companyLogo}
                            alt={job.company}
                            className="w-12 h-12 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition-transform">
                            {job.company ? job.company[0].toUpperCase() : 'H'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                              <Building2 size={12} className="shrink-0" />
                              <span className="truncate">{job.company}</span>
                            </p>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0" />
                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 shrink-0">{job.posted}</p>
                          </div>
                        </div>
                      </div>

                      {/* Save / Bookmark Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveJob(job.id);
                          showToast(isSaved ? 'Position removed from saved' : 'Position saved to your radar', 'info');
                        }}
                        className={cn(
                          "p-2 rounded-xl transition-all shadow-sm active:scale-90 border shrink-0 cursor-pointer",
                          isSaved
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        )}
                        title={isSaved ? "Saved" : "Save Job"}
                      >
                        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>

                    {/* Tags Section */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                      {job.location && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-bold">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.salary && (
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold">
                          <DollarSign size={12} className="shrink-0" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      {job.type && (
                        <div className="flex items-center gap-1 text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 px-2.5 py-1 rounded-lg border border-primary-100 dark:border-primary-900/40 text-xs font-bold">
                          <Clock size={12} className="shrink-0" />
                          <span>{job.type}</span>
                        </div>
                      )}
                      {job.department && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-bold">
                          <Users size={12} className="shrink-0 text-slate-400" />
                          <span>{job.department}</span>
                        </div>
                      )}
                      {job.experience && (
                        <div className="flex items-center gap-1 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/40 text-xs font-bold">
                          <GraduationCap size={12} className="shrink-0" />
                          <span>{job.experience}</span>
                        </div>
                      )}
                    </div>

                    {/* Clean Description */}
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-5 leading-relaxed line-clamp-3">
                      {job.desc || 'Exciting opportunity to join our organization and contribute to impactful projects.'}
                    </p>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="btn-secondary btn-compact cursor-pointer flex-1 justify-center"
                    >
                      <span>View Details</span>
                    </button>
                    {isApplied ? (
                      <button
                        type="button"
                        onClick={() => navigate('/candidate/applications')}
                        className="btn-compact flex items-center justify-center gap-1.5 px-3 rounded-lg font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex-1 cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
                        <span>Applied</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyClick(job, false)}
                        className="btn-primary btn-compact cursor-pointer flex-1 justify-center"
                      >
                        <span>Apply Now</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center card border-dashed border-2 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-600">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
                <Search size={26} />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">No Matching Positions Found</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
                Try resetting or broadening your search filters to discover more opportunities.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-secondary btn-compact mt-4 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic & Comprehensive Job Details Modal */}
      <CenterModal
        isOpen={!!selectedJob && !isApplyModalOpen}
        onClose={() => {
          setSelectedJob(null);
          // Clear query param if present
          if (searchParams.get('jobId')) {
            searchParams.delete('jobId');
            setSearchParams(searchParams);
          }
        }}
        title=""
        maxWidth="max-w-4xl"
      >
        {selectedJob && (() => {
          const isApplied = appliedJobIds.has(selectedJob.id);
          const isSaved = savedIndices.includes(selectedJob.id);
          const hiringManager = selectedJob.hiringManager || {
            name: `${selectedJob.company || 'Talent Acquisition'} Team`,
            role: 'Recruitment & People Operations',
            email: 'careers@hcm.ai',
            avatar: selectedJob.companyLogo || ''
          };

          return (
            <div className="text-left bg-white dark:bg-slate-900">
              {/* Modal Hero Header */}
              <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 sm:gap-5">
                    {selectedJob.companyLogo ? (
                      <img
                        src={selectedJob.companyLogo}
                        alt={selectedJob.company}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0">
                        {selectedJob.company ? selectedJob.company[0].toUpperCase() : 'H'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Actively Hiring
                        </span>
                        {selectedJob.openings && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {selectedJob.openings} {selectedJob.openings > 1 ? 'Openings' : 'Opening'}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {selectedJob.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                          <Building2 size={15} />
                          {selectedJob.company}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Posted {selectedJob.posted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Quick Actions */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        saveJob(selectedJob.id);
                        showToast(isSaved ? 'Removed from saved jobs' : 'Saved to your radar', 'info');
                      }}
                      className={cn(
                        "btn-secondary text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer",
                        isSaved
                          ? "bg-primary-50 border-primary-300 text-primary-600 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-400"
                          : "hover:border-primary-400"
                      )}
                      title={isSaved ? "Saved" : "Save Job"}
                    >
                      {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      <span className="sm:hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    {isApplied ? (
                      <button
                        type="button"
                        onClick={() => navigate('/candidate/applications')}
                        className="btn-secondary text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 size={16} />
                        <span>Applied (View Status)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyClick(selectedJob, true)}
                        className="btn-primary text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <span>Apply for this Role</span>
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Work Location</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary-500 shrink-0" />
                      <span className="truncate">{selectedJob.location || 'Remote'}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Compensation</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <DollarSign size={14} className="shrink-0" />
                      <span className="truncate">{selectedJob.salary || 'Competitive'}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Employment Type</p>
                    <p className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                      <Clock size={14} className="shrink-0" />
                      <span className="truncate">{selectedJob.type || 'Full-time'}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Department</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Users size={14} className="text-indigo-500 shrink-0" />
                      <span className="truncate">{selectedJob.department || 'General'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body: 2-Column Responsive Layout */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Job Description & Qualifications (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Job Description */}
                  <section className="space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <Briefcase size={18} className="text-primary-600 dark:text-primary-400" />
                      About The Role
                    </h3>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedJob.desc || 'No specific description provided for this opening. Please contact the hiring team for further details.'}
                      </p>
                    </div>
                  </section>

                  {/* Requirements & Qualifications */}
                  <section className="space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <CheckCircle2 size={18} className="text-primary-600 dark:text-primary-400" />
                      Key Requirements & Criteria
                    </h3>
                    {selectedJob.requirements && selectedJob.requirements.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedJob.requirements.map((req, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3"
                          >
                            <div className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-250 leading-relaxed">
                              {req}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <p className="font-semibold mb-2">Standard candidate prerequisites for {selectedJob.title}:</p>
                        <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <li>Proven foundational experience relevant to the {selectedJob.department || 'specified'} domain.</li>
                          <li>Strong communication, analytical reasoning, and collaboration skills.</li>
                          <li>Ability to execute workflows independently and deliver high-impact results.</li>
                        </ul>
                      </div>
                    )}
                  </section>

                  {/* Benefits & Perks */}
                  <section className="space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <Zap size={18} className="text-primary-600 dark:text-primary-400" />
                      What We Offer & Benefits
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedJob.benefits && selectedJob.benefits.length > 0 ? selectedJob.benefits : [
                        'Comprehensive Medical & Health Coverage',
                        'Flexible Work Arrangements & Paid Time Off',
                        'Annual Learning & Professional Growth Stipend',
                        'Competitive Compensation & Performance Rewards'
                      ]).map((benefit, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Dynamic Action Card & Hiring Team (4 cols) */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Action Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-primary-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400">
                      <Sparkles size={14} />
                      <span>Ready to Take the Next Step?</span>
                    </div>

                    {isApplied ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-2">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Application Submitted
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Your profile is in the candidate queue. Track progress directly in your portal.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/candidate/applications')}
                          className="btn-secondary btn-compact w-full text-xs font-bold cursor-pointer"
                        >
                          View My Applications
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          Apply with your candidate profile in 1 click or submit a custom resume tailored for this role.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleApplyClick(selectedJob, true)}
                          className="btn-primary w-full text-xs font-bold cursor-pointer justify-center"
                        >
                          <span>Apply for this Role</span>
                          <ArrowRight size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Dynamic Hiring Team Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Hiring Team & Contact
                    </p>
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        src={hiringManager.avatar}
                        alt={hiringManager.name}
                        size="md"
                        fallback={hiringManager.name ? hiringManager.name[0] : 'H'}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {hiringManager.name}
                        </p>
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate">
                          {hiringManager.role}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="flex items-center gap-1.5 font-medium truncate">
                        <Mail size={13} className="shrink-0" />
                        <span className="truncate">{hiringManager.email || 'careers@hcm.ai'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applications are screened on a rolling basis by the talent team.
                      </p>
                    </div>
                  </div>

                  {/* Quick Overview Summary */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Role Snapshot
                    </p>
                    <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-slate-500">Organization</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] text-right">{selectedJob.company}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-slate-500">Department</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedJob.department || 'General'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-slate-500">Work Model</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedJob.location || 'Remote'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
                      <span className="text-slate-500">Job Type</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedJob.type || 'Full-time'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Openings</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedJob.openings || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </CenterModal>

      {/* Application Submission Modal */}
      <CenterModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          if (!cameFromDetails) setSelectedJob(null);
        }}
        title="Submit Application"
        maxWidth="max-w-2xl"
      >
        {selectedJob && (
          <form onSubmit={handleApplySubmit} className="space-y-6 text-left p-6 sm:p-8">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />

            {/* Target Job Header Card */}
            <div className="flex items-center gap-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white">
              {selectedJob.companyLogo ? (
                <img
                  src={selectedJob.companyLogo}
                  alt={selectedJob.company}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {selectedJob.company ? selectedJob.company[0].toUpperCase() : 'H'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-0.5">Applying For Position</p>
                <p className="text-base sm:text-lg font-bold leading-tight truncate">{selectedJob.title}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">{selectedJob.company} • {selectedJob.location || 'Remote'}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Candidate Contact Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="form-label px-1">Full Name</label>
                  <input
                    name="fullName"
                    type="text"
                    defaultValue={profile?.fullName || ''}
                    placeholder="e.g. Alex Rivera"
                    className="input-field h-11 font-semibold text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label px-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={profile?.email || ''}
                    placeholder="e.g. candidate@hcm.ai"
                    className="input-field h-11 font-semibold text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label px-1">Phone Number</label>
                  <PhoneInput
                    name="phone"
                    value={applicationPhone}
                    onChange={e => setApplicationPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label px-1">Location</label>
                  <input
                    name="location"
                    type="text"
                    defaultValue={profile?.location || ''}
                    placeholder="e.g. New York, NY"
                    className="input-field h-11 font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="form-label px-1">LinkedIn Profile</label>
                  <input
                    name="linkedin"
                    type="url"
                    defaultValue={profile?.linkedin || ''}
                    placeholder="https://linkedin.com/in/..."
                    className="input-field h-11 font-semibold text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Application Specifics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="form-label px-1">Resume Document</label>
                <div className="relative">
                  <select
                    value={selectedResume}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'upload_new') {
                        setPrevResume(selectedResume);
                        fileInputRef.current?.click();
                      } else {
                        setSelectedResume(val);
                        setPrevResume(val);
                      }
                    }}
                    className="input-field h-11 pr-10 font-semibold text-sm appearance-none cursor-pointer w-full select-field"
                  >
                    <option value="" disabled className="dark:bg-slate-900">Select a resume...</option>
                    {resumeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="upload_new" className="dark:bg-slate-900 font-bold text-primary-600">+ Upload New Resume...</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="form-label px-1">Availability</label>
                <div className="relative">
                  <select
                    name="availability"
                    className="input-field h-11 pr-10 font-semibold text-sm appearance-none cursor-pointer w-full select-field"
                  >
                    <option className="dark:bg-slate-900">Immediate</option>
                    <option className="dark:bg-slate-900">2 Weeks Notice</option>
                    <option className="dark:bg-slate-900">4 Weeks Notice</option>
                    <option className="dark:bg-slate-900">Negotiable</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="form-label px-1">Expected Salary (Annual)</label>
                <input
                  name="expectedSalary"
                  type="text"
                  defaultValue={profile?.expectedSalary || ''}
                  placeholder={`e.g. ${getSymbol()}120,000`}
                  className="input-field h-11 font-semibold text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="form-label px-1">Portfolio or GitHub URL</label>
                <input
                  name="portfolio"
                  type="url"
                  defaultValue={profile?.portfolio || ''}
                  placeholder="https://github.com/..."
                  className="input-field h-11 font-semibold text-sm"
                />
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-1.5 pt-2">
              <label className="form-label px-1">Cover Letter / Note to Hiring Team</label>
              <textarea
                name="coverLetter"
                rows="4"
                required
                className="input-field py-3 font-semibold text-sm resize-none h-auto textarea-field"
                placeholder="Share your background, key strengths, and why you are excited about this position..."
              ></textarea>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={isSubmitting}
                className="btn-secondary flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Transmitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Candidacy</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </CenterModal>
    </div>
  );
};

export default BrowseJobs;

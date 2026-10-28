import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Cpu, Target, CheckCircle2,
  AlertCircle, Zap, ShieldCheck, Download, Microscope,
  RotateCcw, Code, Layout, TrendingUp, Search, UploadCloud,
  FileCheck, Clock, Trash2, ArrowRight, ExternalLink, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import { candidateAPI, uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import CenterModal from '../../shared/components/layout/CenterModal';
import PageHeader from '../../shared/components/ui/PageHeader';

const AIResumeScore = () => {
  const navigate = useNavigate();
  const { resume, profile, applications, showToast } = useCandidate();

  // View state: 'input' | 'analyzing' | 'results'
  const [viewState, setViewState] = useState('input');

  // Resume Source Selection: 'builder' | 'uploaded'
  const [resumeSource, setResumeSource] = useState('builder');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Analysis Target Selection: 'jd' | 'profile'
  const [activeTab, setActiveTab] = useState('jd');
  const [jobDescription, setJobDescription] = useState('');

  // Industry Profiles from Backend
  const [industryProfiles, setIndustryProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Analysis Loading Phases
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [analysisError, setAnalysisError] = useState(null);

  // Scan History
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const hasUploadedResume = !!profile?.resumeUrl;
  const uploadedResumeName = profile?.resumeUrl ? profile.resumeUrl.split('/').pop() : '';

  const analysisSteps = [
    resumeSource === 'uploaded' ? "Parsing uploaded resume document..." : "Extracting dynamic Resume Builder profile data...",
    "Extracting technical proficiencies & core competencies...",
    "Analyzing target job requirements & benchmark criteria...",
    "Computing keyword density, experience match & ATS readiness...",
    "Synthesizing actionable gap recommendations..."
  ];

  // Fetch Industry Profiles from Backend
  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoadingProfiles(true);
      try {
        const res = await candidateAPI.getIndustryProfiles();
        if (res.data?.success && Array.isArray(res.data.data)) {
          setIndustryProfiles(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedProfileId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch industry profiles:', err);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, []);

  // Fetch Analysis History from Backend
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await candidateAPI.getResumeScoreHistory();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch resume score history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Selected Profile Details
  const currentSelectedProfile = useMemo(() => {
    return industryProfiles.find(p => p.id === selectedProfileId) || industryProfiles[0] || null;
  }, [industryProfiles, selectedProfileId]);

  // Handle Local File Upload for Uploaded Resume Source
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, ['pdf', 'doc', 'docx', 'txt'], 5);
    if (!validation.isValid) {
      showToast(validation.message, 'error');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileBase64(reader.result);
      showToast(`Selected ${file.name} for evaluation`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Start Real Analysis
  const handleStartAnalysis = async () => {
    setAnalysisError(null);

    // 1. Validation
    if (resumeSource === 'uploaded' && !hasUploadedResume && !uploadedFileBase64) {
      showToast('Please upload a resume file or switch to Resume Builder Data.', 'error');
      return;
    }

    if (activeTab === 'jd') {
      if (!jobDescription || jobDescription.trim().length < 25) {
        showToast('Please paste a substantive Job Description (minimum 25 characters).', 'error');
        return;
      }
    } else {
      if (!selectedProfileId && industryProfiles.length === 0) {
        showToast('No industry profile selected. Please select a profile benchmark.', 'error');
        return;
      }
    }

    // 2. Start Animation UI
    setViewState('analyzing');
    setAnalysisPhase(0);

    const phaseInterval = setInterval(() => {
      setAnalysisPhase(prev => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const payload = {
        resumeSource,
        targetType: activeTab,
        jobDescription: activeTab === 'jd' ? jobDescription : undefined,
        selectedProfileId: activeTab === 'profile' ? selectedProfileId : undefined,
        resumeBase64: uploadedFileBase64 || undefined,
        customResumeData: resumeSource === 'builder' ? resume : undefined
      };

      const res = await candidateAPI.analyzeResumeScore(payload);

      clearInterval(phaseInterval);

      if (res.data?.success && res.data.data) {
        setAnalysisResults(res.data.data);
        if (Array.isArray(res.data.data.history)) {
          setHistory(res.data.data.history);
        }
        setViewState('results');
        showToast('Resume ATS analysis completed!', 'success');
      } else {
        throw new Error(res.data?.error?.message || 'Failed to complete analysis');
      }
    } catch (err) {
      clearInterval(phaseInterval);
      console.error('Analysis failed:', err);
      const errMsg = err.response?.data?.error?.message || err.message || 'Analysis failed. Please try again.';
      setAnalysisError(errMsg);
      showToast(errMsg, 'error');
      setViewState('input');
    }
  };

  // Handle Score Gauge Animation on Results View
  useEffect(() => {
    if (viewState === 'results' && analysisResults) {
      let current = 0;
      const targetScore = analysisResults.score || 0;
      const interval = setInterval(() => {
        if (current >= targetScore) {
          setAnimatedScore(targetScore);
          clearInterval(interval);
        } else {
          current += 1;
          setAnimatedScore(current);
        }
      }, 15);
      return () => clearInterval(interval);
    }
  }, [viewState, analysisResults]);

  // Clear History
  const handleClearHistory = async () => {
    try {
      await candidateAPI.clearResumeScoreHistory();
      setHistory([]);
      showToast('Analysis history cleared successfully');
    } catch (err) {
      showToast('Failed to clear history', 'error');
    }
  };

  // Load Past Scan from History
  const handleLoadPastScan = (item) => {
    setAnalysisResults(item);
    setViewState('results');
    setIsHistoryModalOpen(false);
    showToast(`Loaded analysis report from ${new Date(item.timestamp).toLocaleDateString()}`);
  };

  // Print/Save Report
  const handlePrintReport = () => {
    window.print();
  };

  // --- RENDER: INPUT VIEW ---
  const renderInput = () => (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left">
      {/* Header Banner */}
      <PageHeader
        title="AI Resume Score"
        description="Compare your Resume Builder profile against a job description or industry standard to reveal matching competencies and critical gaps."
        actions={
          history.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="btn-secondary btn-compact text-xs font-semibold flex items-center gap-1.5"
            >
              <Clock size={14} />
              <span>Past Scans ({history.length})</span>
            </button>
          ) : null
        }
      />

      {analysisError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="card p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-soft space-y-8">
        {/* Section 1: Resume Source */}
        <div className="space-y-3">
          <label className="form-label uppercase text-xs tracking-wider text-slate-400 font-bold">
            Resume Source
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setResumeSource('builder')}
              className={cn(
                "p-5 rounded-xl border text-left transition-all flex flex-col justify-center gap-1",
                resumeSource === 'builder'
                  ? "bg-slate-900 dark:bg-primary-600 text-white border-transparent shadow-md"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              )}
            >
              <span className="font-bold text-xs uppercase tracking-wider">Resume Builder Data</span>
              <span className="text-[11px] opacity-80 font-medium">
                Uses your live profile ({resume?.skills?.length || 0} skills, {resume?.experience?.length || 0} roles)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResumeSource('uploaded')}
              className={cn(
                "p-5 rounded-xl border text-left transition-all flex flex-col justify-center gap-1",
                resumeSource === 'uploaded'
                  ? "bg-slate-900 dark:bg-primary-600 text-white border-transparent shadow-md"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              )}
            >
              <span className="font-bold text-xs uppercase tracking-wider">Uploaded Profile Resume</span>
              <span className="text-[11px] opacity-80 font-medium truncate max-w-full">
                {uploadedFile ? uploadedFile.name : hasUploadedResume ? uploadedResumeName : 'Upload or replace file'}
              </span>
            </button>
          </div>

          {/* Upload Dropzone if Uploaded Resume is selected */}
          {resumeSource === 'uploaded' && (
            <div className="mt-3 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 text-left">
                <FileCheck size={28} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {uploadedFile ? uploadedFile.name : hasUploadedResume ? uploadedResumeName : 'No resume file selected'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports PDF, DOCX, or TXT format (max 5MB)
                  </p>
                </div>
              </div>
              <label className="btn-secondary btn-compact cursor-pointer shrink-0">
                <UploadCloud size={14} />
                <span>{hasUploadedResume || uploadedFile ? 'Replace Document' : 'Upload File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}
        </div>

        {/* Section 2: Analysis Target Tabs */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="form-label uppercase text-xs tracking-wider text-slate-400 font-bold">
            Analysis Target
          </label>
          <div className="grid grid-cols-2 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => setActiveTab('jd')}
              className={cn(
                "py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'jd'
                  ? "bg-white dark:bg-slate-900 text-primary-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <FileText size={16} />
              <span>Job Description</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                "py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'profile'
                  ? "bg-white dark:bg-slate-900 text-primary-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <Target size={16} />
              <span>Industry Profile</span>
            </button>
          </div>

          {/* Tab 1: Job Description Input */}
          {activeTab === 'jd' && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="form-label text-xs mb-0">Paste Job Description</label>
                {applications?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const app = applications[0];
                      const desc = app.jobPost?.description || `${app.jobPost?.title}\nRequirements: ${(app.jobPost?.requirements || []).join(', ')}`;
                      if (desc) {
                        setJobDescription(desc);
                        showToast(`Pasted job description from ${app.jobPost?.title || 'recent application'}`, 'info');
                      }
                    }}
                    className="btn-ghost btn-compact text-[11px] text-primary-600"
                  >
                    <span>Use Recent Applied Job</span>
                  </button>
                )}
              </div>
              <textarea
                rows={9}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. Our AI will extract the key requirements, tech stack, and experience qualifications to evaluate your resume against..."
                className="textarea-field font-medium text-xs sm:text-sm leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                Minimum 25 characters required. Provide details on responsibilities and skills for maximum accuracy.
              </p>
            </div>
          )}

          {/* Tab 2: Industry Profile Benchmark */}
          {activeTab === 'profile' && (
            <div className="space-y-4 pt-2 animate-fade-in">
              <label className="form-label text-xs mb-0">Select Target Industry Standard Profile</label>
              {isLoadingProfiles ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Loading industry benchmarks...</span>
                </div>
              ) : (
                <>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="select-field"
                  >
                    {industryProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.experienceYears}) • {p.category}
                      </option>
                    ))}
                  </select>

                  {currentSelectedProfile && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Benchmark Expectations
                        </span>
                        <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/60 text-primary-600 font-bold">
                          {currentSelectedProfile.experienceYears}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {currentSelectedProfile.description}
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Key Competencies Tested:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentSelectedProfile.expectedSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleStartAnalysis}
            className="btn-primary w-full h-12 text-sm font-bold uppercase tracking-wider"
          >
            <Search size={18} />
            <span>Analyze Resume Score</span>
          </button>
        </div>
      </div>
    </div>
  );

  // --- RENDER: ANALYZING VIEW ---
  const renderAnalyzing = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-fade-in max-w-md mx-auto text-center">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-3xl animate-pulse" />
        <div className="absolute inset-0 border-t-4 border-primary-600 rounded-3xl animate-spin" />
        <div className="text-primary-600">
          <Cpu size={44} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
          {analysisSteps[analysisPhase]}
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          Step {analysisPhase + 1} of {analysisSteps.length} • Running deep ATS evaluation
        </p>
      </div>

      <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary-600 rounded-full"
          initial={{ width: '10%' }}
          animate={{ width: `${((analysisPhase + 1) / analysisSteps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  // --- RENDER: RESULTS VIEW ---
  const renderResults = () => {
    if (!analysisResults) return null;

    const {
      score = 0,
      targetContext = 'Target Profile',
      resumeSourceName = 'Resume Source',
      metrics = [],
      matchingSkills = [],
      missingSkills = [],
      strengths = [],
      weaknesses = [],
      importantGaps = [],
      recommendations = []
    } = analysisResults;

    return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left">
        {/* Results Header */}
        <PageHeader
          title="Resume Analysis Results"
          description={
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Target: <strong className="text-primary-600">{targetContext}</strong></span>
              <span>•</span>
              <span>Evaluated: <strong className="text-slate-800 dark:text-slate-200">{resumeSourceName}</strong></span>
              <span>•</span>
              <span>{new Date(analysisResults.timestamp || Date.now()).toLocaleDateString()}</span>
            </div>
          }
          actions={
            <>
              <button
                type="button"
                onClick={() => setViewState('input')}
                className="btn-secondary btn-compact"
              >
                <RotateCcw size={14} />
                <span>New Analysis</span>
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="btn-secondary btn-compact"
              >
                <Download size={14} />
                <span>Print / Save Report</span>
              </button>
            </>
          }
        />

        {/* Main Analytics Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Core Score Meter Card */}
          <div className="lg:col-span-5 card p-8 flex flex-col items-center justify-center relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Microscope size={15} />
              <span>Overall Match Score</span>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-56 h-56 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <motion.circle
                  cx="112"
                  cy="112"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={565}
                  initial={{ strokeDashoffset: 565 }}
                  animate={{ strokeDashoffset: 565 - (565 * animatedScore) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={cn(
                    animatedScore >= 80 ? "text-emerald-500" :
                    animatedScore >= 60 ? "text-amber-500" : "text-rose-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                  {animatedScore}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Out of 100
                </span>
              </div>
            </div>

            <div className="text-center space-y-3 mt-4">
              <span className={cn(
                "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border",
                animatedScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                animatedScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
              )}>
                ATS Compatibility: {animatedScore >= 80 ? "High Match" : animatedScore >= 60 ? "Moderate Match" : "Low Match"}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                {animatedScore >= 80
                  ? "Strong keyword alignment and role chronology. Your resume is well-primed for ATS scanning."
                  : animatedScore >= 60
                  ? "Foundational qualifications are present, but several key skills and metrics are missing."
                  : "Critical competencies or quantifiable accomplishments are absent for this specific target."}
              </p>
            </div>
          </div>

          {/* Right Metrics & Recommendations */}
          <div className="lg:col-span-7 space-y-6">
            {/* 4 Detailed KPI Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metrics.map((m, i) => (
                <div key={i} className="card p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase tracking-wider text-[11px]">{m.label}</span>
                    <span className={cn("text-sm", m.color)}>{m.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.score}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", m.score >= 75 ? "bg-emerald-500" : m.score >= 50 ? "bg-amber-500" : "bg-rose-500")}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actionable Recommendations */}
            <div className="card p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl border-none shadow-md space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                <Zap size={16} />
                <span>Actionable Recommendations</span>
              </div>

              <div className="space-y-3">
                {recommendations.map((r, i) => (
                  <div key={i} className="p-3 bg-white/10 rounded-xl flex items-start gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5",
                      r.priority === 'High' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {r.priority || 'Tip'}
                    </span>
                    <p className="text-xs text-slate-100 leading-relaxed">
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tertiary Cards: Matched Skills, Gaps & Direct Link to Builder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Matched Competencies */}
          <div className="card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
              <CheckCircle2 size={16} />
              <span>Matched Skills ({matchingSkills.length})</span>
            </div>
            {matchingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {matchingSkills.map((sk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No direct skill matches found in resume.</p>
            )}
          </div>

          {/* Missing Keywords & Important Gaps */}
          <div className="card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
              <AlertCircle size={16} />
              <span>Missing Keywords ({missingSkills.length})</span>
            </div>
            {missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((sk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">All target competency keywords detected!</p>
            )}
          </div>

          {/* Instant Improvement Callout */}
          <div className="card p-6 bg-slate-900 text-white rounded-2xl border-none shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                Direct Update
              </p>
              <h4 className="text-lg font-bold leading-snug">
                Apply gaps directly in Resume Builder
              </h4>
              <p className="text-xs text-slate-400">
                Update your skills or experience metrics in the builder to increase your ATS match score.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/candidate/resume')}
              className="btn-primary w-full text-xs font-bold"
            >
              <span>Open Resume Builder</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Strengths & Weaknesses Detailed View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Strengths</h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {strengths.map((st, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Identified Gaps</h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
      {viewState === 'input' && renderInput()}
      {viewState === 'analyzing' && renderAnalyzing()}
      {viewState === 'results' && renderResults()}

      {/* History Modal */}
      <CenterModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Resume Score Analysis History"
        maxWidth="max-w-2xl"
      >
        <div className="p-6 space-y-4 text-left">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No previous analysis scans found.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 hover:border-primary-400 transition-all cursor-pointer"
                  onClick={() => handleLoadPastScan(item)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.targetContext || 'Target Analysis'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        {item.targetType === 'jd' ? 'Job Description' : 'Industry Benchmark'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {new Date(item.timestamp).toLocaleString()} • {item.resumeSourceName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-black",
                      item.score >= 80 ? "bg-emerald-50 text-emerald-700" :
                      item.score >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {item.score}%
                    </span>
                    <ArrowRight size={14} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="btn-ghost btn-compact text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(false)}
              className="btn-secondary btn-compact ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default AIResumeScore;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { employeeAPI as api, candidateAPI, uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, GraduationCap, Sparkles, Plus, Trash2, ChevronRight, ChevronLeft,
  Download, Eye, Save, Languages, Award, Settings2, FileText, CheckCircle2,
  Image as ImageIcon, Type, Palette, MapPin, Mail, Phone, Link as LinkIcon,
  PlusCircle, XCircle, Layout, MousePointer2, Zap, Trophy, Globe,
  Check, Info, RotateCcw, Loader2, CloudUpload, ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import CenterModal from '../../shared/components/layout/CenterModal';
import PageHeader from '../../shared/components/ui/PageHeader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to sanitize skill names and remove AI/match score artifacts (e.g. 'Match:85')
export const sanitizeSkillName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return '';
  let cleaned = rawName.trim();
  cleaned = cleaned.replace(/^Match\s*:\s*\d+/i, '').replace(/Match\s*\d+/i, '').trim();
  cleaned = cleaned.replace(/^[-:,\s]+|[-:,\s]+$/g, '');
  return cleaned;
};

// Helper to initialize resume state from saved resumeData or candidate profile
const getResumeWithDefaults = (resumeData, profileData) => {
  const safeResume = resumeData || {};
  const personal = safeResume.personal || {};
  const profile = profileData || {};

  // Extract first and last name from profile.fullName if not explicitly stored in personal
  let firstName = personal.firstName || '';
  let lastName = personal.lastName || '';
  if (!firstName && !lastName && profile.fullName) {
    const parts = profile.fullName.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  // Parse profile skills into array of skill objects if safeResume.skills is empty
  let skills = Array.isArray(safeResume.skills) && safeResume.skills.length > 0 ? safeResume.skills : [];
  if (skills.length === 0 && profile.skills) {
    const rawSkills = Array.isArray(profile.skills) ? profile.skills : String(profile.skills).split(',');
    skills = rawSkills.map(s => {
      const name = typeof s === 'string' ? s.trim() : (s?.name || '');
      const cleanName = sanitizeSkillName(name);
      return cleanName ? { name: cleanName, level: 80 } : null;
    }).filter(Boolean);
  } else {
    // Sanitize any existing skill objects
    skills = skills.map(s => {
      const name = typeof s === 'string' ? s : (s?.name || '');
      const cleanName = sanitizeSkillName(name);
      return cleanName ? { name: cleanName, level: s?.level || 80 } : null;
    }).filter(Boolean);
  }

  return {
    personal: {
      photo: personal.photo || '',
      avatar: personal.avatar || profile.avatar || profile.avatarUrl || '',
      firstName: firstName || '',
      lastName: lastName || '',
      title: personal.title || profile.role || '',
      email: personal.email || profile.email || '',
      phone: personal.phone || profile.phone || '',
      address: personal.address || profile.address || '',
      city: personal.city || profile.location || profile.city || '',
      country: personal.country || profile.country || '',
      summary: personal.summary || profile.bio || '',
      linkedin: personal.linkedin || profile.linkedin || '',
      portfolio: personal.portfolio || profile.portfolio || '',
    },
    experience: Array.isArray(safeResume.experience) ? safeResume.experience : [],
    projects: Array.isArray(safeResume.projects) ? safeResume.projects : [],
    education: Array.isArray(safeResume.education) ? safeResume.education : [],
    skills: skills.length > 0 ? skills : [
      { name: 'JavaScript / React', level: 85 },
      { name: 'Node.js / Express', level: 80 },
      { name: 'Database Architecture', level: 75 },
      { name: 'REST APIs & Integration', level: 90 }
    ],
    extras: {
      certs: Array.isArray(safeResume.extras?.certs) ? safeResume.extras.certs : [],
      languages: Array.isArray(safeResume.extras?.languages) ? safeResume.extras.languages : [
        'English (Fluent)',
        'Spanish (Professional)'
      ],
      awards: Array.isArray(safeResume.extras?.awards) ? safeResume.extras.awards : [],
      interests: Array.isArray(safeResume.extras?.interests) ? safeResume.extras.interests : [
        'Open Source', 'System Design', 'UI/UX Architecture'
      ]
    },
    template: {
      color: safeResume.template?.color || '#0f172a',
      name: safeResume.template?.name || 'Classic ATS Standard'
    }
  };
};

const ResumeBuilder = () => {
  const { resume, profile, applications, updateResumeStep, syncResumeToBackend, showToast } = useCandidate();
  const [activeStep, setActiveStep] = useState(0);
  const [localData, setLocalData] = useState(() => getResumeWithDefaults(resume, profile));
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [errors, setErrors] = useState({});

  // ✨ AI Summary Preview Modal States
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [isConfirmOverwriteOpen, setIsConfirmOverwriteOpen] = useState(false);

  // Derive dynamic recommended skills based on candidate applications or industry defaults
  const recommendedSkills = useMemo(() => {
    if (applications && applications.length > 0) {
      const reqs = applications.flatMap(app => app.jobPost?.requirements || app.job?.requirements || []);
      const currentSkillNames = localData.skills.map(s => (s.name || '').toLowerCase());
      const novel = reqs.filter(r => typeof r === 'string' && !currentSkillNames.includes(r.toLowerCase()));
      const unique = [...new Set(novel)];
      if (unique.length > 0) return unique.slice(0, 8);
    }
    const standardSkills = ['React.js', 'Node.js', 'TypeScript', 'System Architecture', 'SQL / Prisma', 'Cloud Platforms (AWS/GCP)', 'RESTful APIs', 'CI/CD Pipelines'];
    const current = localData.skills.map(s => (s.name || '').toLowerCase());
    return standardSkills.filter(s => !current.includes(s.toLowerCase())).slice(0, 6);
  }, [applications, localData.skills]);

  // Sync internal state with context on initial load or profile refresh
  useEffect(() => {
    if (resume || profile) {
      setLocalData(prev => {
        const initial = getResumeWithDefaults(resume, profile);
        return {
          ...initial,
          personal: { ...initial.personal, ...prev.personal },
          experience: prev.experience?.length > 0 ? prev.experience : initial.experience,
          projects: prev.projects?.length > 0 ? prev.projects : initial.projects,
          education: prev.education?.length > 0 ? prev.education : initial.education,
          skills: prev.skills?.length > 0 ? prev.skills : initial.skills,
          extras: {
            certs: prev.extras?.certs?.length > 0 ? prev.extras.certs : initial.extras.certs,
            languages: prev.extras?.languages?.length > 0 ? prev.extras.languages : initial.extras.languages,
            awards: prev.extras?.awards?.length > 0 ? prev.extras.awards : initial.extras.awards,
            interests: prev.extras?.interests?.length > 0 ? prev.extras.interests : initial.extras.interests,
          },
          template: { ...initial.template, ...(prev.template || {}) }
        };
      });
    }
  }, [resume, profile]);

  const steps = [
    { title: 'Personal', icon: User, helper: 'Basic contact information and professional summary' },
    { title: 'Experience', icon: Briefcase, helper: 'Verified employment, responsibilities & achievements' },
    { title: 'Projects', icon: FileText, helper: 'Key software projects, technical stack & deliverables' },
    { title: 'Education', icon: GraduationCap, helper: 'Academic degrees, university and certifications' },
    { title: 'Skills', icon: Sparkles, helper: 'Technical competencies, frameworks & domain knowledge' },
    { title: 'Extras', icon: Award, helper: 'Certifications, languages, awards & interests' },
    { title: 'Template', icon: Layout, helper: 'ATS-compliant formats and executive color palettes' },
  ];

  // Validation function for current step
  const validateCurrentStep = () => {
    const newErrors = {};
    if (activeStep === 0) {
      if (!localData.personal.firstName?.trim()) newErrors.firstName = 'First Name is required';
      if (!localData.personal.lastName?.trim()) newErrors.lastName = 'Last Name is required';
      if (localData.personal.email && !/\S+@\S+\.\S+/.test(localData.personal.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      showToast('Please fill in the required fields', 'error');
      return;
    }
    const currentKey = steps[activeStep].title.toLowerCase();
    updateResumeStep(currentKey, localData[currentKey]);
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleResetStep = () => {
    const currentKey = steps[activeStep].title.toLowerCase();
    const defaults = {
      personal: { firstName: '', lastName: '', title: '', email: '', phone: '', city: '', linkedin: '', portfolio: '', summary: '', avatar: '' },
      experience: [],
      projects: [],
      education: [],
      skills: [],
      extras: { certs: [], languages: [], awards: [], interests: [] },
      template: { color: '#0f172a', name: 'Classic ATS Standard' }
    };

    setLocalData(prev => ({ ...prev, [currentKey]: defaults[currentKey] }));
    showToast(`${steps[activeStep].title} section reset to default`, 'info');
  };

  const handleSyncToBackend = async () => {
    if (!validateCurrentStep()) {
      showToast('Please correct validation errors before saving', 'error');
      return;
    }
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await syncResumeToBackend(localData);
      if (res && res.success !== false) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // AI Summary generation with backend fallback
  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await candidateAPI.aiBuildResume(localData);
      if (response && response.data && response.data.success !== false) {
        const payload = response.data.data || response.data;
        const summaryText = payload.summary || payload.reply || '';
        const insightsObj = payload.insights || {
          strengths: ["Strong verified skill profile", "Cohesive career trajectory"],
          missingInformation: ["Measurable project metrics (%, revenue, efficiency)"],
          suggestions: ["Add bullet points detailing key achievements in each position"]
        };

        setAiSummaryResult({
          summary: summaryText,
          insights: insightsObj
        });
        setEditedSummaryText(summaryText);
        setIsEditingSummary(false);
        setGeneratedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsSummaryModalOpen(true);
        showToast('AI Summary & ATS Insights Generated!', 'success');
      } else {
        throw new Error(response?.data?.error?.message || 'Failed to generate AI summary');
      }
    } catch (error) {
      console.error('AI Generation Failed:', error);
      showToast(error.message || 'AI Generation Failed. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySummaryClick = () => {
    const textToApply = isEditingSummary ? editedSummaryText : (aiSummaryResult?.summary || '');
    if (!textToApply.trim()) {
      showToast('Summary text cannot be empty', 'error');
      return;
    }
    if (localData.personal.summary && localData.personal.summary.trim().length > 10 && localData.personal.summary !== textToApply) {
      setIsConfirmOverwriteOpen(true);
    } else {
      executeApplySummary(textToApply);
    }
  };

  const executeApplySummary = async (text) => {
    const updatedData = {
      ...localData,
      personal: {
        ...localData.personal,
        summary: text.trim()
      }
    };
    setLocalData(updatedData);
    setIsConfirmOverwriteOpen(false);
    setIsSummaryModalOpen(false);
    showToast('Summary applied and synced to your resume!', 'success');
    await syncResumeToBackend(updatedData);
  };

  // Real client-side PDF export using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    showToast('Preparing high-resolution PDF...', 'info');
    try {
      const resumeElement = document.getElementById('resume-pdf-export-node');
      if (!resumeElement) {
        window.print();
        return;
      }

      const canvas = await html2canvas(resumeElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const candName = [localData.personal.firstName, localData.personal.lastName].filter(Boolean).join('_') || 'Candidate';
      pdf.save(`${candName}_Resume.pdf`);
      showToast('Resume PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Direct PDF export failed, falling back to print dialog:', err);
      showToast('Opening print dialog for PDF saving...', 'info');
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const updatePersonal = (field, value) => {
    setLocalData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['png', 'jpg', 'jpeg', 'gif', 'webp'], 5);
    if (!v.isValid) { showToast(v.message, 'error'); return; }

    try {
      showToast('Uploading profile image...', 'info');
      const res = await uploadAPI.uploadImage(file, 'hcm/avatars');
      const cloudUrl = res.data?.data?.url;
      if (cloudUrl) {
        updatePersonal('avatar', cloudUrl);
        showToast('Resume avatar uploaded successfully', 'success');
        return;
      }
    } catch (uploadErr) {
      console.warn('Avatar cloud upload fallback to data URI:', uploadErr.message);
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updatePersonal('avatar', reader.result);
      showToast('Resume photo updated', 'success');
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updatePersonal('avatar', '');
  };

  const updateTemplate = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      template: { ...(prev.template || {}), [field]: value }
    }));
  };

  const addItem = (section) => {
    const freshItems = {
      experience: { id: Date.now(), company: '', role: '', type: 'Full-time', start: '', end: '', current: false, desc: '' },
      projects: { id: Date.now(), name: '', tech: '', link: '', desc: '' },
      education: { id: Date.now(), school: '', degree: '', field: '', start: '', end: '', grade: '' },
      skills: { name: '', level: 75 }
    };
    setLocalData(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), freshItems[section]]
    }));
  };

  const removeItem = (section, index) => {
    setLocalData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const moveArrayItem = (section, index, direction) => {
    setLocalData(prev => {
      const list = [...prev[section]];
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, [section]: list };
    });
  };

  const updateArrayItem = (section, index, field, value) => {
    setLocalData(prev => {
      const newList = [...prev[section]];
      if (field === 'current' && value === true) {
        newList[index] = { ...newList[index], current: true, end: '' };
      } else {
        newList[index] = { ...newList[index], [field]: value };
      }
      return { ...prev, [section]: newList };
    });
  };

  // --- STEP 1: PERSONAL DETAILS ---
  const renderPersonal = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="group relative">
          <label className="w-32 h-32 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:bg-primary-50 hover:border-primary-400 dark:hover:bg-slate-800 transition-all cursor-pointer overflow-hidden shadow-inner relative">
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            {localData.personal.avatar ? (
              <>
                <img src={localData.personal.avatar} alt="Avatar" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition-all"
                  title="Remove image"
                >
                  <XCircle size={16} />
                </button>
              </>
            ) : (
              <>
                <ImageIcon size={32} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                <span className="text-[11px] font-bold mt-2 text-slate-500 group-hover:text-primary-600">Upload Photo</span>
              </>
            )}
          </label>
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Provide your verified contact details and core career identity for employers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label">First Name <span className="text-rose-500">*</span></label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localData.personal.firstName || ''}
              onChange={(e) => updatePersonal('firstName', e.target.value)}
              placeholder="e.g. Alex"
              className={cn("input-field pl-10", errors.firstName && "border-rose-500 focus:ring-rose-200")}
            />
          </div>
          {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="form-label">Last Name <span className="text-rose-500">*</span></label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localData.personal.lastName || ''}
              onChange={(e) => updatePersonal('lastName', e.target.value)}
              placeholder="e.g. Rivera"
              className={cn("input-field pl-10", errors.lastName && "border-rose-500 focus:ring-rose-200")}
            />
          </div>
          {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="form-label">Target Job Title</label>
          <div className="relative">
            <Briefcase size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localData.personal.title || ''}
              onChange={(e) => updatePersonal('title', e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Email Address <span className="text-rose-500">*</span></label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={localData.personal.email || ''}
              onChange={(e) => updatePersonal('email', e.target.value)}
              placeholder="e.g. alex.rivera@example.com"
              className={cn("input-field pl-10", errors.email && "border-rose-500 focus:ring-rose-200")}
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="form-label">Phone Number</label>
          <PhoneInput
            name="phone"
            value={localData.personal.phone || ''}
            onChange={(e) => updatePersonal('phone', e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">City / Location</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localData.personal.city || ''}
              onChange={(e) => updatePersonal('city', e.target.value)}
              placeholder="e.g. San Francisco, CA (or Remote)"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="form-label">LinkedIn Profile</label>
          <div className="relative">
            <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localData.personal.linkedin || ''}
              onChange={(e) => updatePersonal('linkedin', e.target.value)}
              placeholder="linkedin.com/in/alexrivera"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Portfolio / GitHub URL</label>
          <div className="relative">
            <LinkIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localData.personal.portfolio || ''}
              onChange={(e) => updatePersonal('portfolio', e.target.value)}
              placeholder="github.com/alexrivera"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="form-label mb-0">Professional Summary</label>
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="btn-ghost btn-compact text-primary-600 hover:text-primary-700"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
              <span>AI Generate</span>
            </button>
          </div>
          <textarea
            rows={5}
            value={localData.personal.summary || ''}
            onChange={(e) => updatePersonal('summary', e.target.value)}
            placeholder="Summarize your professional experience, leadership capabilities, and core value proposition..."
            className="textarea-field"
          />
        </div>
      </div>
    </div>
  );

  // --- STEP 2: EXPERIENCE ---
  const renderExperience = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Work Experience</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">List your professional employment history in reverse chronological order.</p>
        </div>
        <button
          type="button"
          onClick={() => addItem('experience')}
          className="btn-primary btn-compact"
        >
          <Plus size={16} /> <span>Add Experience</span>
        </button>
      </div>

      {localData.experience.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <Briefcase size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No work experience added yet</p>
          <p className="text-xs text-slate-400">Add past roles to showcase your career accomplishments to hiring teams.</p>
          <button
            type="button"
            onClick={() => addItem('experience')}
            className="btn-secondary btn-compact mt-2"
          >
            <Plus size={14} /> Add First Position
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {localData.experience.map((exp, idx) => (
            <div key={exp.id || idx} className="p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Position #{idx + 1} {exp.role ? `• ${exp.role}` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveArrayItem('experience', idx, -1)}
                    disabled={idx === 0}
                    className="btn-ghost btn-compact btn-icon disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('experience', idx, 1)}
                    disabled={idx === localData.experience.length - 1}
                    className="btn-ghost btn-compact btn-icon disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem('experience', idx)}
                    className="btn-danger btn-compact btn-icon ml-1"
                    title="Delete Position"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Job Title / Role</label>
                  <input
                    type="text"
                    value={exp.role || ''}
                    onChange={(e) => updateArrayItem('experience', idx, 'role', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="form-label">Company / Organization</label>
                  <input
                    type="text"
                    value={exp.company || ''}
                    onChange={(e) => updateArrayItem('experience', idx, 'company', e.target.value)}
                    placeholder="e.g. Stripe, Inc."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="month"
                    value={exp.start || ''}
                    onChange={(e) => updateArrayItem('experience', idx, 'start', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="month"
                    disabled={exp.current}
                    value={exp.current ? '' : (exp.end || '')}
                    onChange={(e) => updateArrayItem('experience', idx, 'end', e.target.value)}
                    className="input-field disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`exp-curr-${idx}`}
                    checked={exp.current || false}
                    onChange={(e) => updateArrayItem('experience', idx, 'current', e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor={`exp-curr-${idx}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                    I currently work in this role
                  </label>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="form-label">Key Responsibilities & Measurable Achievements</label>
                  <textarea
                    rows={4}
                    value={exp.desc || ''}
                    onChange={(e) => updateArrayItem('experience', idx, 'desc', e.target.value)}
                    placeholder="• Spearheaded development of core microservices, increasing throughput by 40%...&#10;• Mentored a team of 6 engineers and streamlined CI/CD pipeline deployments."
                    className="textarea-field"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- STEP 3: PROJECTS ---
  const renderProjects = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Technical Projects</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Showcase software projects, open source contributions, or live apps.</p>
        </div>
        <button
          type="button"
          onClick={() => addItem('projects')}
          className="btn-primary btn-compact"
        >
          <Plus size={16} /> <span>Add Project</span>
        </button>
      </div>

      {(!localData.projects || localData.projects.length === 0) ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No projects added yet</p>
          <p className="text-xs text-slate-400">Add key full stack / software projects to significantly boost your ATS score and fill out your portfolio.</p>
          <button
            type="button"
            onClick={() => addItem('projects')}
            className="btn-secondary btn-compact mt-2"
          >
            <Plus size={14} /> Add Project
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {localData.projects.map((proj, idx) => (
            <div key={proj.id || idx} className="p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Project #{idx + 1} {proj.name ? `• ${proj.name}` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveArrayItem('projects', idx, -1)}
                    disabled={idx === 0}
                    className="btn-ghost btn-compact btn-icon disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('projects', idx, 1)}
                    disabled={idx === (localData.projects?.length || 1) - 1}
                    className="btn-ghost btn-compact btn-icon disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem('projects', idx)}
                    className="btn-danger btn-compact btn-icon ml-1"
                    title="Delete Project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    value={proj.name || ''}
                    onChange={(e) => updateArrayItem('projects', idx, 'name', e.target.value)}
                    placeholder="e.g. E-Commerce Platform / AI Resume Parser"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Technologies Used / Tech Stack</label>
                  <input
                    type="text"
                    value={proj.tech || ''}
                    onChange={(e) => updateArrayItem('projects', idx, 'tech', e.target.value)}
                    placeholder="e.g. React.js, Node.js, PostgreSQL, Docker, AWS"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Live Demo URL / GitHub Repository (Optional)</label>
                  <input
                    type="text"
                    value={proj.link || ''}
                    onChange={(e) => updateArrayItem('projects', idx, 'link', e.target.value)}
                    placeholder="e.g. github.com/username/project or live-demo.com"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="form-label">Key Features & Engineering Impact</label>
                  <textarea
                    rows={3}
                    value={proj.desc || ''}
                    onChange={(e) => updateArrayItem('projects', idx, 'desc', e.target.value)}
                    placeholder="• Built a full-stack microservices architecture handling 10k+ daily requests.&#10;• Integrated Redis caching to reduce database read latency by 65%."
                    className="textarea-field"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- STEP 4: EDUCATION ---
  const renderEducation = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Academic Background</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add your university degrees, colleges, or formal diplomas.</p>
        </div>
        <button
          type="button"
          onClick={() => addItem('education')}
          className="btn-primary btn-compact"
        >
          <Plus size={16} /> <span>Add Education</span>
        </button>
      </div>

      {localData.education.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <GraduationCap size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No education entries added</p>
          <p className="text-xs text-slate-400">Add degree programs, colleges, or certifications to highlight your academic credentials.</p>
          <button
            type="button"
            onClick={() => addItem('education')}
            className="btn-secondary btn-compact mt-2"
          >
            <Plus size={14} /> Add Education Record
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {localData.education.map((edu, idx) => (
            <div key={edu.id || idx} className="p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  Degree #{idx + 1} {edu.school ? `• ${edu.school}` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveArrayItem('education', idx, -1)}
                    disabled={idx === 0}
                    className="btn-ghost btn-compact btn-icon disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('education', idx, 1)}
                    disabled={idx === localData.education.length - 1}
                    className="btn-ghost btn-compact btn-icon disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem('education', idx)}
                    className="btn-danger btn-compact btn-icon ml-1"
                    title="Delete Record"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">School / University</label>
                  <input
                    type="text"
                    value={edu.school || ''}
                    onChange={(e) => updateArrayItem('education', idx, 'school', e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Degree / Level</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => updateArrayItem('education', idx, 'degree', e.target.value)}
                    placeholder="e.g. Bachelor of Science (B.S.)"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Field of Study</label>
                  <input
                    type="text"
                    value={edu.field || ''}
                    onChange={(e) => updateArrayItem('education', idx, 'field', e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Graduation Year / End Date</label>
                  <input
                    type="text"
                    value={edu.end || ''}
                    onChange={(e) => updateArrayItem('education', idx, 'end', e.target.value)}
                    placeholder="e.g. 2022 (or May 2022)"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Grade / GPA / Honors (Optional)</label>
                  <input
                    type="text"
                    value={edu.grade || ''}
                    onChange={(e) => updateArrayItem('education', idx, 'grade', e.target.value)}
                    placeholder="e.g. 3.9 GPA, Magna Cum Laude"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- STEP 4: SKILLS ---
  const renderSkills = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Technical & Core Skills</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Specify your technical competencies and proficiency levels.</p>
        </div>
        <button
          type="button"
          onClick={() => addItem('skills')}
          className="btn-primary btn-compact"
        >
          <Plus size={16} /> <span>Add Skill</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localData.skills.map((skill, idx) => (
          <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={skill.name || ''}
                onChange={(e) => updateArrayItem('skills', idx, 'name', e.target.value)}
                placeholder="Skill name (e.g. React.js)"
                className="input-field h-9 text-sm font-semibold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 shrink-0 w-12 text-right">
                {skill.level}%
              </span>
              <button
                type="button"
                onClick={() => removeItem('skills', idx)}
                className="btn-danger btn-compact btn-icon h-9 w-9 shrink-0"
                title="Remove Skill"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => updateArrayItem('skills', idx, 'level', Math.max(10, parseInt(skill.level || 50) - 5))}
                className="btn-secondary btn-compact h-7 px-2 text-xs font-bold"
              >
                -5%
              </button>
              <div
                className="flex-1 relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = Math.round((x / rect.width) * 100);
                  updateArrayItem('skills', idx, 'level', Math.max(10, Math.min(100, percent)));
                }}
              >
                <motion.div
                  className="h-full bg-primary-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level || 50}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => updateArrayItem('skills', idx, 'level', Math.min(100, parseInt(skill.level || 50) + 5))}
                className="btn-secondary btn-compact h-7 px-2 text-xs font-bold"
              >
                +5%
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended skills suggestions */}
      {recommendedSkills.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-primary-50 dark:from-slate-900 dark:to-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
            <Zap size={15} />
            <span>Recommended Skills (Based on Applied Roles)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Click any skill below to add it instantly to your profile:</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {recommendedSkills.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setLocalData(prev => ({
                    ...prev,
                    skills: [...prev.skills, { name: s, level: 80 }]
                  }));
                  showToast(`Added ${s} to skills`, 'success');
                }}
                className="btn-secondary btn-compact text-xs font-semibold hover:bg-primary-600 hover:text-white transition-all shadow-sm"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // --- STEP 5: EXTRAS ---
  const renderExtras = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Certifications & Languages */}
        <div className="space-y-8">
          {/* Certifications */}
          <section className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-primary-600" />
                <span>Certifications</span>
              </h4>
              <button
                type="button"
                onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, certs: [...(prev.extras.certs || []), 'AWS Certified Solutions Architect'] } }))}
                className="btn-secondary btn-compact"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {localData.extras.certs.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-600 shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const newCerts = [...localData.extras.certs];
                    newCerts[i] = e.target.value;
                    setLocalData(prev => ({ ...prev, extras: { ...prev.extras, certs: newCerts } }));
                  }}
                  className="input-field h-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, certs: prev.extras.certs.filter((_, ci) => ci !== i) } }))}
                  className="btn-danger btn-compact btn-icon h-9 w-9 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </section>

          {/* Languages */}
          <section className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Languages size={16} className="text-indigo-600" />
                <span>Languages</span>
              </h4>
              <button
                type="button"
                onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, languages: [...(prev.extras.languages || []), 'English (Fluent)'] } }))}
                className="btn-secondary btn-compact"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {localData.extras.languages.map((l, i) => {
              const [langName = '', langProf = 'Fluent'] = l.includes('(') ? l.split(' (') : [l, 'Fluent'];
              const cleanProf = langProf.replace(')', '');
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={langName}
                    onChange={(e) => {
                      const newLangs = [...localData.extras.languages];
                      newLangs[i] = `${e.target.value} (${cleanProf})`;
                      setLocalData(prev => ({ ...prev, extras: { ...prev.extras, languages: newLangs } }));
                    }}
                    placeholder="Language"
                    className="input-field h-9 text-xs flex-1"
                  />
                  <select
                    value={cleanProf}
                    onChange={(e) => {
                      const newLangs = [...localData.extras.languages];
                      newLangs[i] = `${langName} (${e.target.value})`;
                      setLocalData(prev => ({ ...prev, extras: { ...prev.extras, languages: newLangs } }));
                    }}
                    className="select-field h-9 text-xs w-36"
                  >
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Basic">Basic</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, languages: prev.extras.languages.filter((_, li) => li !== i) } }))}
                    className="btn-danger btn-compact btn-icon h-9 w-9 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </section>
        </div>

        {/* Awards & Interests */}
        <div className="space-y-8">
          {/* Awards */}
          <section className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                <span>Achievements & Honors</span>
              </h4>
              <button
                type="button"
                onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, awards: [...(prev.extras.awards || []), 'Presidential Innovation Award'] } }))}
                className="btn-secondary btn-compact"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {localData.extras.awards.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={a}
                  onChange={(e) => {
                    const newAwards = [...localData.extras.awards];
                    newAwards[i] = e.target.value;
                    setLocalData(prev => ({ ...prev, extras: { ...prev.extras, awards: newAwards } }));
                  }}
                  className="input-field h-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, awards: prev.extras.awards.filter((_, ai) => ai !== i) } }))}
                  className="btn-danger btn-compact btn-icon h-9 w-9 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </section>

          {/* Interests */}
          <section className="space-y-4">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={16} className="text-emerald-500" />
                <span>Interests & Activities</span>
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {localData.extras.interests.map((int, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{int}</span>
                  <button
                    type="button"
                    onClick={() => setLocalData(prev => ({ ...prev, extras: { ...prev.extras, interests: prev.extras.interests.filter((_, ii) => ii !== i) } }))}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm pt-2">
              <input
                type="text"
                placeholder="Add interest (e.g. Open Source, Hiking)"
                id="new-interest-input-box"
                className="input-field h-9 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      setLocalData(prev => ({ ...prev, extras: { ...prev.extras, interests: [...prev.extras.interests, val] } }));
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-interest-input-box');
                  if (input && input.value.trim()) {
                    setLocalData(prev => ({ ...prev, extras: { ...prev.extras, interests: [...prev.extras.interests, input.value.trim()] } }));
                    input.value = '';
                  }
                }}
                className="btn-secondary btn-compact"
              >
                Add
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  // --- STEP 7: TEMPLATE & THEME ---
  const renderTemplate = () => (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customizer */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <label className="form-label">Accent Palette</label>
            <div className="grid grid-cols-5 gap-2.5">
              {['#0f172a', '#1e293b', '#2563eb', '#0284c7', '#0d9488', '#059669', '#d97706', '#dc2626', '#7c3aed', '#475569'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => updateTemplate('color', c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "w-10 h-10 rounded-xl border-2 shadow-sm hover:scale-110 transition-all",
                    localData.template?.color === c ? "border-slate-900 dark:border-white ring-2 ring-primary-500 scale-105" : "border-white dark:border-slate-800"
                  )}
                  title={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="form-label">Layout Architecture</label>
            <div className="space-y-2">
              {[
                { id: 'Classic ATS Standard', name: 'Classic ATS Standard', badge: '100% ATS' },
                { id: 'Modern Executive', name: 'Modern Executive', badge: 'Executive' },
                { id: 'Tech Professional', name: 'Tech Professional', badge: 'Dev Ready' },
                { id: 'Modern Adaptive', name: 'Modern Adaptive', badge: 'Balanced' }
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => updateTemplate('name', t.id)}
                  className={cn(
                    "w-full p-3.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between",
                    localData.template?.name === t.id
                      ? "bg-slate-900 text-white dark:bg-primary-600 border-transparent shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{t.name}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                      localData.template?.name === t.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    )}>
                      {t.badge}
                    </span>
                  </div>
                  {localData.template?.name === t.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Visual Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'Classic ATS Standard', name: 'Classic ATS Standard', desc: 'Standard single-column, 100% compliant with Workday, Greenhouse & Lever.' },
            { id: 'Modern Executive', name: 'Modern Executive', desc: 'Sleek single-column with colored accent bars and refined hierarchy.' },
            { id: 'Tech Professional', name: 'Tech Professional', desc: 'Tailored for software engineers with highlighted projects & tech stack tags.' },
            { id: 'Modern Adaptive', name: 'Modern Adaptive', desc: 'Balanced multi-section format ensuring zero empty white space.' }
          ].map((t, idx) => {
            const isSelected = localData.template?.name === t.id || (!localData.template?.name && idx === 0);
            return (
              <div
                key={idx}
                onClick={() => updateTemplate('name', t.id)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all space-y-3 group",
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/20 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400"
                )}
              >
                <div className="aspect-[4/5] bg-slate-50 dark:bg-slate-950 rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-inner relative border border-slate-200/60 dark:border-slate-800">
                  <div className="space-y-2">
                    <div className="h-3 w-2/3 mx-auto rounded" style={{ backgroundColor: isSelected ? (localData.template?.color || '#0f172a') : '#64748b' }} />
                    <div className="h-1.5 w-1/2 mx-auto bg-slate-300 dark:bg-slate-700 rounded" />
                    <div className="h-0.5 w-full bg-slate-300 dark:bg-slate-700 rounded mt-2" />
                    <div className="h-2 w-1/3 bg-slate-400 dark:bg-slate-600 rounded mt-2" />
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-1.5 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2 w-1/3 bg-slate-400 dark:bg-slate-600 rounded mt-2" />
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-1/4 bg-slate-400 dark:bg-slate-600 rounded" />
                    <div className="h-1.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 p-1.5 bg-primary-600 text-white rounded-lg shadow-md">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <span className="text-xs font-semibold text-primary-600">{isSelected ? 'Active' : 'Select'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // --- HELPER: BULLET POINT FORMATTER ---
  const renderDescriptionBullets = (text) => {
    if (!text || typeof text !== 'string') return null;
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    return (
      <ul className="space-y-1 pt-1 text-xs leading-relaxed text-slate-700">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
          if (!cleanLine) return null;
          return (
            <li key={idx} className="flex items-start gap-2">
              <span className="select-none text-slate-400 font-bold leading-none mt-1.5">•</span>
              <span className="flex-1 text-left">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Sanitized skills list for clean ATS rendering
  const cleanedSkills = useMemo(() => {
    return (localData.skills || [])
      .map(s => {
        const name = typeof s === 'string' ? s : (s?.name || '');
        const clean = sanitizeSkillName(name);
        return clean ? { name: clean, level: s?.level || 80 } : null;
      })
      .filter(Boolean);
  }, [localData.skills]);

  // --- TEMPLATE 1: CLASSIC ATS STANDARD (100% ATS Compliant) ---
  const renderClassicATS = () => (
    <div className="bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-md rounded-sm min-h-[1050px] max-w-[800px] mx-auto text-left leading-normal">
      {/* Header */}
      <header className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          {localData.personal.firstName || 'Candidate'} {localData.personal.lastName || 'Name'}
        </h1>
        {localData.personal.title && (
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            {localData.personal.title}
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-medium pt-1">
          {localData.personal.email && <span>{localData.personal.email}</span>}
          {localData.personal.phone && (
            <>
              <span>•</span>
              <span>{localData.personal.phone}</span>
            </>
          )}
          {localData.personal.city && (
            <>
              <span>•</span>
              <span>{localData.personal.city}</span>
            </>
          )}
          {localData.personal.linkedin && (
            <>
              <span>•</span>
              <span>{localData.personal.linkedin}</span>
            </>
          )}
          {localData.personal.portfolio && (
            <>
              <span>•</span>
              <span>{localData.personal.portfolio}</span>
            </>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      {localData.personal.summary && (
        <section className="mb-6 space-y-1.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Professional Summary
          </h2>
          <p className="text-xs leading-relaxed text-slate-800 text-justify">
            {localData.personal.summary}
          </p>
        </section>
      )}

      {/* Technical Skills */}
      {cleanedSkills.length > 0 && (
        <section className="mb-6 space-y-1.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Technical Skills
          </h2>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {cleanedSkills.map((s, i) => (
              <span key={i} className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-medium border border-slate-200">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {localData.experience.length > 0 && (
        <section className="mb-6 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Work Experience
          </h2>
          <div className="space-y-4">
            {localData.experience.map((e, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{e.role || 'Role'}</span>
                    <span className="text-xs font-semibold text-slate-700"> | {e.company || 'Company'}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {e.start} {e.start && (e.current || e.end) ? '–' : ''} {e.current ? 'Present' : e.end}
                  </span>
                </div>
                {renderDescriptionBullets(e.desc)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Projects */}
      {localData.projects?.length > 0 && (
        <section className="mb-6 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Technical Projects
          </h2>
          <div className="space-y-3">
            {localData.projects.map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    {p.tech && <span className="text-xs italic text-slate-600"> | {p.tech}</span>}
                  </div>
                  {p.link && <span className="text-xs font-medium text-slate-500">{p.link}</span>}
                </div>
                {renderDescriptionBullets(p.desc)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {localData.education.length > 0 && (
        <section className="mb-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Education
          </h2>
          <div className="space-y-3">
            {localData.education.map((edu, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{edu.end}</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-2 text-xs text-slate-600">
                  <span>{edu.school}</span>
                  {edu.grade && <span className="font-semibold text-slate-700">CGPA / Grade: {edu.grade}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Languages */}
      {((localData.extras?.certs?.length > 0) || (localData.extras?.languages?.length > 0)) && (
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Certifications & Languages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
            {localData.extras?.certs?.length > 0 && (
              <div>
                <span className="font-bold text-slate-900 block mb-1">Certifications:</span>
                <ul className="space-y-1">
                  {localData.extras.certs.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {localData.extras?.languages?.length > 0 && (
              <div>
                <span className="font-bold text-slate-900 block mb-1">Languages:</span>
                <p className="leading-relaxed">
                  {localData.extras.languages.join(', ')}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );

  // --- TEMPLATE 2: MODERN EXECUTIVE (ATS-Ready) ---
  const renderModernExecutive = () => (
    <div className="bg-white text-slate-900 font-sans shadow-md rounded-sm min-h-[1050px] max-w-[800px] mx-auto text-left leading-normal overflow-hidden border-t-8" style={{ borderColor: localData.template?.color || '#0f172a' }}>
      {/* Header */}
      <div className="p-8 sm:p-10 pb-6 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: localData.template?.color || '#0f172a' }}>
              {localData.personal.firstName || 'Candidate'} {localData.personal.lastName || 'Name'}
            </h1>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">
              {localData.personal.title || 'Professional Title'}
            </p>
          </div>
          {localData.personal.avatar && (
            <img src={localData.personal.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium pt-3 mt-3 border-t border-slate-200/80">
          {localData.personal.email && <span>{localData.personal.email}</span>}
          {localData.personal.phone && <span>• {localData.personal.phone}</span>}
          {localData.personal.city && <span>• {localData.personal.city}</span>}
          {localData.personal.linkedin && <span>• {localData.personal.linkedin}</span>}
          {localData.personal.portfolio && <span>• {localData.personal.portfolio}</span>}
        </div>
      </div>

      <div className="p-8 sm:p-10 space-y-6">
        {/* Summary */}
        {localData.personal.summary && (
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 border-b" style={{ color: localData.template?.color || '#0f172a', borderColor: localData.template?.color || '#0f172a' }}>
              Executive Summary
            </h3>
            <p className="text-xs leading-relaxed text-slate-700 text-justify">
              {localData.personal.summary}
            </p>
          </section>
        )}

        {/* Technical Competencies */}
        {cleanedSkills.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 border-b" style={{ color: localData.template?.color || '#0f172a', borderColor: localData.template?.color || '#0f172a' }}>
              Core Technical Competencies
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cleanedSkills.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-semibold border border-slate-200">
                  {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {localData.experience.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 border-b" style={{ color: localData.template?.color || '#0f172a', borderColor: localData.template?.color || '#0f172a' }}>
              Professional Experience
            </h3>
            <div className="space-y-4">
              {localData.experience.map((e, i) => (
                <div key={i} className="space-y-1 relative pl-3 border-l-2" style={{ borderColor: localData.template?.color || '#0f172a' }}>
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{e.role}</h4>
                    <span className="text-xs font-semibold text-slate-500">
                      {e.start} {e.start && (e.current || e.end) ? '–' : ''} {e.current ? 'Present' : e.end}
                    </span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: localData.template?.color || '#0f172a' }}>{e.company}</p>
                  {renderDescriptionBullets(e.desc)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {localData.projects?.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 border-b" style={{ color: localData.template?.color || '#0f172a', borderColor: localData.template?.color || '#0f172a' }}>
              Key Technical Projects
            </h3>
            <div className="space-y-3">
              {localData.projects.map((p, i) => (
                <div key={i} className="space-y-1 relative pl-3 border-l-2" style={{ borderColor: localData.template?.color || '#0f172a' }}>
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    {p.link && <span className="text-xs text-slate-500">{p.link}</span>}
                  </div>
                  {p.tech && <p className="text-xs font-medium text-slate-600 italic">{p.tech}</p>}
                  {renderDescriptionBullets(p.desc)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {localData.education.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider pb-1 border-b" style={{ color: localData.template?.color || '#0f172a', borderColor: localData.template?.color || '#0f172a' }}>
              Education & Credentials
            </h3>
            <div className="space-y-2">
              {localData.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline flex-wrap gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h4>
                    <p className="text-slate-600">{edu.school}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-600">{edu.end}</span>
                    {edu.grade && <p className="text-[11px] text-slate-500">Grade / CGPA: {edu.grade}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extras */}
        {((localData.extras?.certs?.length > 0) || (localData.extras?.languages?.length > 0)) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {localData.extras?.certs?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Certifications</h4>
                <ul className="text-xs text-slate-700 space-y-1">
                  {localData.extras.certs.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {localData.extras?.languages?.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Languages</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {localData.extras.languages.join(', ')}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );

  // --- TEMPLATE 3: TECH PROFESSIONAL (ATS-Ready) ---
  const renderTechProfessional = () => (
    <div className="bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-md rounded-sm min-h-[1050px] max-w-[800px] mx-auto text-left leading-normal">
      {/* Header */}
      <header className="pb-4 mb-6 border-b-2" style={{ borderColor: localData.template?.color || '#0f172a' }}>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: localData.template?.color || '#0f172a' }}>
              {localData.personal.firstName || 'Candidate'} {localData.personal.lastName || 'Name'}
            </h1>
            <p className="text-sm font-bold text-slate-700 mt-0.5">
              {localData.personal.title || 'Full Stack Engineer'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 font-medium space-y-0.5">
            {localData.personal.email && <p>{localData.personal.email}</p>}
            {localData.personal.phone && <p>{localData.personal.phone}</p>}
            {localData.personal.city && <p>{localData.personal.city}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-primary-600 font-semibold pt-2 mt-2 border-t border-slate-100">
          {localData.personal.linkedin && <span>LinkedIn: {localData.personal.linkedin}</span>}
          {localData.personal.portfolio && <span>• GitHub / Portfolio: {localData.personal.portfolio}</span>}
        </div>
      </header>

      {/* Summary */}
      {localData.personal.summary && (
        <section className="mb-6 space-y-1.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Summary
          </h2>
          <p className="text-xs leading-relaxed text-slate-700">
            {localData.personal.summary}
          </p>
        </section>
      )}

      {/* Skills Matrix */}
      {cleanedSkills.length > 0 && (
        <section className="mb-6 space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Technical Competencies
          </h2>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {cleanedSkills.map((s, i) => (
              <span key={i} className="text-[11px] px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold border border-slate-200">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {localData.projects?.length > 0 && (
        <section className="mb-6 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Technical Projects & Open Source
          </h2>
          <div className="space-y-3">
            {localData.projects.map((p, i) => (
              <div key={i} className="space-y-1 p-3 bg-slate-50/60 rounded-lg border border-slate-200/80">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  {p.link && <span className="text-[11px] font-semibold text-primary-600">{p.link}</span>}
                </div>
                {p.tech && <p className="text-[11px] font-medium text-slate-600 italic">Stack: {p.tech}</p>}
                {renderDescriptionBullets(p.desc)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {localData.experience.length > 0 && (
        <section className="mb-6 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Work Experience
          </h2>
          <div className="space-y-4">
            {localData.experience.map((e, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{e.role}</span>
                    <span className="text-xs font-semibold text-slate-600"> @ {e.company}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {e.start} {e.start && (e.current || e.end) ? '–' : ''} {e.current ? 'Present' : e.end}
                  </span>
                </div>
                {renderDescriptionBullets(e.desc)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {localData.education.length > 0 && (
        <section className="mb-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Education
          </h2>
          <div className="space-y-2">
            {localData.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                  <p className="text-slate-600 text-[11px]">{edu.school}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-600">{edu.end}</span>
                  {edu.grade && <p className="text-[10px] text-slate-500">CGPA / Grade: {edu.grade}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extras */}
      {((localData.extras?.certs?.length > 0) || (localData.extras?.languages?.length > 0)) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          {localData.extras?.certs?.length > 0 && (
            <div>
              <h4 className="font-bold uppercase text-slate-500 mb-1">Certifications</h4>
              <ul className="space-y-1">
                {localData.extras.certs.map((c, i) => <li key={i}>• {c}</li>)}
              </ul>
            </div>
          )}
          {localData.extras?.languages?.length > 0 && (
            <div>
              <h4 className="font-bold uppercase text-slate-500 mb-1">Languages</h4>
              <p>{localData.extras.languages.join(', ')}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );

  // --- TEMPLATE 4: MODERN ADAPTIVE (Balanced Layout with No Void) ---
  const renderModernAdaptive = () => (
    <div className="bg-white text-slate-900 font-sans shadow-md rounded-sm min-h-[1050px] flex flex-col max-w-[800px] mx-auto overflow-hidden text-left">
      {/* Top Header */}
      <div className="p-8 text-white grid grid-cols-12 gap-6 relative" style={{ backgroundColor: localData.template?.color || '#0f172a' }}>
        <div className="col-span-8 space-y-2 relative z-10">
          <div className="flex items-center gap-4">
            {localData.personal.avatar && (
              <img src={localData.personal.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shadow-md" />
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{localData.personal.firstName || 'Candidate'} {localData.personal.lastName || 'Name'}</h2>
              <p className="text-sm font-semibold opacity-90">{localData.personal.title || 'Professional Title'}</p>
            </div>
          </div>
          {localData.personal.summary && (
            <p className="text-xs opacity-85 leading-relaxed pt-1">{localData.personal.summary}</p>
          )}
        </div>
        <div className="col-span-4 flex flex-col justify-center items-end space-y-1 text-xs text-white/90 text-right">
          {localData.personal.city && <div>{localData.personal.city}</div>}
          {localData.personal.email && <div>{localData.personal.email}</div>}
          {localData.personal.phone && <div>{localData.personal.phone}</div>}
          {localData.personal.linkedin && <div>{localData.personal.linkedin}</div>}
        </div>
      </div>

      <div className="p-8 space-y-6 flex-1">
        {/* Technical Skills */}
        {cleanedSkills.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">Core Competencies</h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cleanedSkills.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-medium border border-slate-200">
                  {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {localData.experience.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">Employment History</h3>
            <div className="space-y-4">
              {localData.experience.map((e, i) => (
                <div key={i} className="space-y-1 relative pl-3 border-l-2" style={{ borderColor: localData.template?.color || '#0f172a' }}>
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{e.role}</h4>
                    <span className="text-[11px] font-semibold text-slate-500">{e.start} {e.start && (e.current || e.end) ? '—' : ''} {e.current ? 'Present' : e.end}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: localData.template?.color || '#0f172a' }}>{e.company}</p>
                  {renderDescriptionBullets(e.desc)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {localData.projects?.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">Technical Projects</h3>
            <div className="space-y-3">
              {localData.projects.map((p, i) => (
                <div key={i} className="space-y-1 relative pl-3 border-l-2" style={{ borderColor: localData.template?.color || '#0f172a' }}>
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    {p.link && <span className="text-[11px] text-slate-500">{p.link}</span>}
                  </div>
                  {p.tech && <p className="text-xs italic text-slate-600">{p.tech}</p>}
                  {renderDescriptionBullets(p.desc)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Credentials */}
        {localData.education.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">Education</h3>
            <div className="space-y-2">
              {localData.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-baseline flex-wrap gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h4>
                    <p className="text-[11px] text-slate-600">{edu.school}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">{edu.end}</span>
                    {edu.grade && <p className="text-[10px] text-slate-400">CGPA / Grade: {edu.grade}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extras */}
        {((localData.extras?.certs?.length > 0) || (localData.extras?.languages?.length > 0)) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            {localData.extras?.certs?.length > 0 && (
              <div>
                <h4 className="font-bold uppercase text-slate-400 mb-1">Certifications</h4>
                <ul className="space-y-1">
                  {localData.extras.certs.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
            {localData.extras?.languages?.length > 0 && (
              <div>
                <h4 className="font-bold uppercase text-slate-400 mb-1">Languages</h4>
                <p>{localData.extras.languages.join(', ')}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );

  const renderResumeDocument = () => {
    switch (localData.template?.name) {
      case 'Modern Executive':
      case 'Strict Industrial':
        return renderModernExecutive();
      case 'Tech Professional':
      case 'High-Impact Grid':
        return renderTechProfessional();
      case 'Modern Adaptive':
      case 'Strategic Clean':
        return renderModernAdaptive();
      case 'Classic ATS Standard':
      default:
        return renderClassicATS();
    }
  };

  return (
    <>
      <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto flex flex-col min-h-screen lg:min-h-0 print:hidden">
        {/* Header Section */}
        <PageHeader
          title="Resume Builder"
          description={
            <>
              Step {activeStep + 1} of {steps.length}: <span className="text-slate-900 dark:text-white font-bold">{steps[activeStep].title}</span>
              {lastSavedTime && <span className="ml-2 text-emerald-600 font-semibold">• Last synced {lastSavedTime}</span>}
            </>
          }
          actions={
            <>
              <button
                type="button"
                onClick={handleSyncToBackend}
                disabled={isSaving}
                className={cn(
                  "btn-primary",
                  saveStatus === 'saved' && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="btn-secondary"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="btn-secondary"
              >
                {isExportingPDF ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                <span>Download PDF</span>
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card p-2 sm:p-3 bg-white dark:bg-slate-900 shadow-soft rounded-2xl">
              <nav className="flex flex-row lg:flex-col overflow-x-auto gap-1 relative scrollbar-none">
                {steps.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (validateCurrentStep()) {
                        updateResumeStep(steps[activeStep].title.toLowerCase(), localData[steps[activeStep].title.toLowerCase()]);
                        setActiveStep(i);
                      }
                    }}
                    className={cn(
                      "btn-ghost w-auto lg:w-full flex items-center gap-3 p-3 rounded-xl transition-all relative z-10 whitespace-nowrap shrink-0 lg:shrink text-left",
                      activeStep === i
                        ? "bg-slate-900 text-white dark:bg-primary-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-lg shrink-0", activeStep === i ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                      <s.icon size={18} />
                    </div>
                    <span className="text-xs font-bold">{s.title}</span>
                    {i < activeStep && <CheckCircle2 size={14} className={cn("ml-auto hidden sm:inline-block", activeStep === i ? "text-white" : "text-emerald-500")} />}
                  </button>
                ))}
              </nav>
            </div>

            {/* AI Generative Assistant Card */}
            <div className="card p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl text-white overflow-hidden relative shadow-premium border-none text-left">
              <div className="absolute top-0 right-0 p-6 opacity-15">
                <Sparkles size={100} />
              </div>

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                  <span className={cn("w-2 h-2 rounded-full", isGenerating ? "bg-amber-400 animate-ping" : aiSummaryResult ? "bg-emerald-400" : "bg-indigo-300")} />
                  <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider">
                    {isGenerating ? "Analyzing..." : aiSummaryResult ? "Generated" : "Ready"}
                  </span>
                </div>
                <Sparkles size={16} />
              </div>

              <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-1 relative z-10">AI Summary Assistant</p>
              <h4 className="text-base font-bold mb-4 leading-snug relative z-10">Elevate your summary with AI insights & ATS optimization.</h4>

              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="btn-secondary w-full bg-white text-indigo-900 hover:bg-indigo-50 border-none shadow-md font-bold text-xs h-10 relative z-10"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    <span>Analyzing experience...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-indigo-600" />
                    <span>Auto-Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Step Form Viewport */}
          <div className="lg:col-span-9 flex flex-col h-full">
            <div className="card h-full p-6 sm:p-8 flex flex-col relative rounded-2xl min-h-[600px]">
              <div className="flex-1">
                <div className="mb-6 text-left pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{steps[activeStep].title} Details</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{steps[activeStep].helper}</p>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeStep === 0 && renderPersonal()}
                    {activeStep === 1 && renderExperience()}
                    {activeStep === 2 && renderProjects()}
                    {activeStep === 3 && renderEducation()}
                    {activeStep === 4 && renderSkills()}
                    {activeStep === 5 && renderExtras()}
                    {activeStep === 6 && renderTemplate()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step Navigation Actions */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  className="btn-secondary w-full sm:w-auto"
                >
                  <ChevronLeft size={16} /> Previous Step
                </button>
                <div className="flex flex-col-reverse sm:flex-row gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetStep}
                    className="btn-ghost text-xs"
                  >
                    <RotateCcw size={14} /> Reset Step
                  </button>
                  <button
                    type="button"
                    onClick={() => activeStep === steps.length - 1 ? setIsPreviewOpen(true) : handleNext()}
                    className="btn-primary w-full sm:w-auto"
                  >
                    <span>{activeStep === steps.length - 1 ? 'Preview Resume' : 'Continue to Next Step'}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Resume Preview Modal */}
      <CenterModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Resume Preview" maxWidth="max-w-4xl">
        <div className="p-4 sm:p-6 text-left bg-slate-100 dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
          {renderResumeDocument()}
          <div className="mt-6 flex justify-center items-center gap-3 print:hidden">
            <button type="button" onClick={() => setIsPreviewOpen(false)} className="btn-secondary">
              Close Preview
            </button>
            <button type="button" onClick={handleDownloadPDF} disabled={isExportingPDF} className="btn-primary">
              {isExportingPDF ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </CenterModal>

      {/* AI Summary Review & Insights Modal */}
      <CenterModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="✨ AI Generated Professional Summary"
        maxWidth="max-w-2xl"
      >
        <div className="p-6 space-y-5 text-left bg-white dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-100 dark:border-indigo-900">
                ✨ ATS Optimized
              </span>
              <span className="text-slate-400 font-medium">Generated at {generatedAt}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>{editedSummaryText.split(/\s+/).filter(Boolean).length} Words</span>
              <span>•</span>
              <span>{editedSummaryText.length} Characters</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Professional Summary</label>
              {!isEditingSummary && (
                <button
                  type="button"
                  onClick={() => setIsEditingSummary(true)}
                  className="btn-ghost btn-compact text-xs text-primary-600"
                >
                  <Type size={13} />
                  <span>Edit Text</span>
                </button>
              )}
            </div>

            {isEditingSummary ? (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={editedSummaryText}
                  onChange={(e) => setEditedSummaryText(e.target.value)}
                  className="textarea-field"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditedSummaryText(aiSummaryResult?.summary || '');
                      setIsEditingSummary(false);
                    }}
                    className="btn-ghost btn-compact"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSummary(false)}
                    className="btn-secondary btn-compact"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                {editedSummaryText}
              </div>
            )}
          </div>

          {/* AI ATS Insights Section */}
          {aiSummaryResult?.insights && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ATS Insights & Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                    <span>Strengths</span>
                  </div>
                  <ul className="text-[11px] font-medium text-emerald-900 dark:text-emerald-200 space-y-1 list-disc pl-3">
                    {(aiSummaryResult.insights.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>

                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Info size={14} />
                    <span>Recommendations</span>
                  </div>
                  <ul className="text-[11px] font-medium text-amber-900 dark:text-amber-200 space-y-1 list-disc pl-3">
                    {(aiSummaryResult.insights.missingInformation || []).map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                </div>

                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    <Sparkles size={14} />
                    <span>Suggestions</span>
                  </div>
                  <ul className="text-[11px] font-medium text-indigo-900 dark:text-indigo-200 space-y-1 list-disc pl-3">
                    {(aiSummaryResult.insights.suggestions || []).map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="btn-ghost btn-compact text-xs"
            >
              <RotateCcw size={13} className={isGenerating ? 'animate-spin' : ''} />
              <span>Regenerate</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="btn-secondary btn-compact text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplySummaryClick}
                className="btn-primary btn-compact text-xs"
              >
                <Check size={14} />
                <span>Use This Summary</span>
              </button>
            </div>
          </div>
        </div>
      </CenterModal>

      {/* Confirm Overwrite Summary Modal */}
      <CenterModal
        isOpen={isConfirmOverwriteOpen}
        onClose={() => setIsConfirmOverwriteOpen(false)}
        title="Replace Existing Summary?"
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl shrink-0">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Existing Summary Detected</h4>
              <p className="text-xs text-slate-500">
                You already have a professional summary written. Applying this AI generated text will replace your current summary.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsConfirmOverwriteOpen(false)}
              className="btn-secondary btn-compact"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => executeApplySummary(editedSummaryText || aiSummaryResult?.summary)}
              className="btn-primary btn-compact bg-amber-600 hover:bg-amber-700"
            >
              Yes, Replace Summary
            </button>
          </div>
        </div>
      </CenterModal>

      {/* Hidden container specifically for high-resolution PDF rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
        <div id="resume-pdf-export-node">
          {renderResumeDocument()}
        </div>
      </div>

      {/* Persistent Print Style */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-pdf-export-node, #resume-pdf-export-node * { visibility: visible; }
          #resume-pdf-export-node {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .modal-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default ResumeBuilder;

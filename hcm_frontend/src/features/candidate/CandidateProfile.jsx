import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, FileText, Trash2, CheckCircle2,
  ChevronRight, Plus, MapPin, Mail, Phone, Globe, Clock,
  Camera, LogOut, Save, AlertTriangle, Settings2, Info,
  RotateCcw, ShieldAlert, Key, Zap, Check, Cloud, Download, Edit3, X, ExternalLink
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import { uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import { useDateFormat } from '../../hooks/useDateFormat';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import PageHeader from '../../shared/components/ui/PageHeader';

const AVATAR_MAX_SIZE_MB = 5;
const RESUME_MAX_SIZE_MB = 10;
const DOCUMENT_MAX_SIZE_MB = 10;
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const DOC_EXTS = ['pdf', 'doc', 'docx'];

const CandidateProfile = () => {
  const { profile = {}, updateProfile, showToast, refetch } = useCandidate();
  const { formatDate } = useDateFormat();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = usePersistedTab('cand_profile', 'personal');
  const [formData, setFormData] = useState(profile);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const tabs = [
    { id: 'personal',     label: 'Personal Info',     icon: User },
    { id: 'professional', label: 'Professional Info', icon: Briefcase },
    { id: 'resume',       label: 'Resume Document',   icon: FileText },
    { id: 'skills',       label: 'Skills & Expertise',icon: Zap },
    { id: 'social',       label: 'Social Profiles',   icon: Globe },
    { id: 'documents',    label: 'Verified Documents',icon: Cloud },
  ];

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      if (refetch?.fetchProfile) await refetch.fetchProfile();
      showToast?.('Profile updated successfully', 'success');
    } catch (err) {
      showToast?.('Failed to update profile', 'error');
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file, IMAGE_EXTS, AVATAR_MAX_SIZE_MB);
      if (!validation.isValid) {
        showToast?.(validation.message, 'error');
        return;
      }
      try {
        const res = await uploadAPI.uploadImage(file, 'hcm/avatars');
        const cloudUrl = res.data?.data?.url;
        if (cloudUrl) {
          setFormData(prev => ({ ...prev, avatar: cloudUrl, avatarUrl: cloudUrl }));
          showToast?.('Avatar uploaded successfully', 'success');
        } else {
          throw new Error('No URL returned');
        }
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, avatar: reader.result, avatarBase64: reader.result }));
          showToast?.('Profile picture updated', 'success');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file, DOC_EXTS, RESUME_MAX_SIZE_MB);
      if (!validation.isValid) {
        showToast?.(validation.message, 'error');
        return;
      }
      try {
        const res = await uploadAPI.uploadDocument(file, 'hcm/resumes');
        const cloudUrl = res.data?.data?.url;
        if (cloudUrl) {
          setFormData(prev => ({ ...prev, resumeUrl: cloudUrl, resumeName: file.name }));
          showToast?.('Resume uploaded successfully', 'success');
        } else {
          throw new Error('No URL returned');
        }
      } catch (err) {
        setFormData(prev => ({ ...prev, resumeUrl: file.name, resumeName: file.name }));
        showToast?.('Resume file attached', 'success');
      }
    }
  };

  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file, [...IMAGE_EXTS, ...DOC_EXTS], DOCUMENT_MAX_SIZE_MB);
      if (!validation.isValid) {
        showToast?.(validation.message, 'error');
        return;
      }
      try {
        const res = await uploadAPI.uploadDocument(file, 'hcm/documents');
        const cloudUrl = res.data?.data?.url;
        const newDoc = {
          id: Date.now().toString(),
          type: docType,
          name: file.name,
          url: cloudUrl || file.name,
          uploadedAt: new Date().toISOString()
        };
        setFormData(prev => ({
          ...prev,
          documents: [...(prev.documents || []), newDoc]
        }));
        showToast?.(`${docType} uploaded successfully`, 'success');
      } catch (err) {
        showToast?.('Document upload failed', 'error');
      }
    }
  };

  const removeDocument = (id) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== id)
    }));
    showToast?.('Document removed', 'info');
  };

  const toggleSkill = (skill) => {
    if (!isEditing) return;
    const currentSkills = Array.isArray(formData.skills)
      ? formData.skills
      : (formData.skills ? String(formData.skills).split(',').map(s => s.trim()).filter(Boolean) : []);
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const addSkill = (e) => {
    e.preventDefault();
    const input = e.target.elements.skill;
    const skill = input.value.trim();
    if (skill) {
      const currentSkills = Array.isArray(formData.skills)
        ? formData.skills
        : (formData.skills ? String(formData.skills).split(',').map(s => s.trim()).filter(Boolean) : []);
      if (!currentSkills.includes(skill)) {
        setFormData(prev => ({ ...prev, skills: [...currentSkills, skill] }));
      }
      input.value = '';
    }
  };

  const candidateSkills = useMemo(() => {
    if (Array.isArray(formData.skills)) return formData.skills;
    if (typeof formData.skills === 'string') {
      return formData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [formData.skills]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left px-2 sm:px-0">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Candidate Profile"
        description="View and maintain your master candidate record and credentials."
        actions={
          !isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <X size={15} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            </div>
          )
        }
      />

      {/* ── Profile Snapshot Card ───────────────────────────────────── */}
      <div className="card p-5 sm:p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          {/* Avatar with Camera edit overlay */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden relative border-2 border-white dark:border-slate-800">
              {formData.avatar || formData.avatarUrl ? (
                <img src={formData.avatar || formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(formData.fullName || 'C').charAt(0).toUpperCase()}</span>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100">
                  <Camera className="text-white" size={20} />
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {formData.fullName || 'Candidate'}
            </h2>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate">
              {formData.role || 'Job Seeker'} • {formData.location || 'Remote'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2.5">
              {formData.email && (
                <span className="flex items-center gap-1.5 truncate">
                  <Mail size={13} className="shrink-0" /> {formData.email}
                </span>
              )}
              {formData.phone && (
                <span className="flex items-center gap-1.5 truncate">
                  <Phone size={13} className="shrink-0" /> {formData.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Sidebar Tabs + Content Area ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Tabs (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="card p-2 border border-slate-100 dark:border-slate-800 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left group',
                    isActive
                      ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-lg shrink-0 transition-colors',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  )}>
                    <Icon size={15} />
                  </div>
                  <span className="text-xs font-bold truncate flex-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area (8 cols) */}
        <div className="lg:col-span-8">
          <div className="card p-5 sm:p-7 border border-slate-100 dark:border-slate-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >

                {/* ── 1. PERSONAL INFO ──────────────────────────────────── */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600">
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h3>
                        <p className="text-xs text-slate-400">Manage basic contact details and identity information</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={formData.fullName || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          readOnly
                          className="input-field h-10 text-sm bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-75"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <PhoneInput
                          name="phone"
                          value={formData.phone || ''}
                          disabled={!isEditing}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location / City</label>
                        <input
                          type="text"
                          value={formData.location || formData.city || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, location: e.target.value, city: e.target.value })}
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Professional Bio</label>
                        <textarea
                          rows={4}
                          value={formData.bio || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Brief summary of your background and career goals..."
                          className={cn("textarea-field text-sm resize-none", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2. PROFESSIONAL INFO ──────────────────────────────── */}
                {activeTab === 'professional' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Professional Information</h3>
                        <p className="text-xs text-slate-400">Career aspirations, target roles, and work experience</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Role / Title</label>
                        <input
                          type="text"
                          value={formData.role || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, role: e.target.value })}
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Years of Experience</label>
                        <input
                          type="text"
                          value={formData.experience || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, experience: e.target.value })}
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Salary</label>
                        <input
                          type="text"
                          value={formData.currentSalary || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, currentSalary: e.target.value })}
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected Salary</label>
                        <input
                          type="text"
                          value={formData.expectedSalary || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })}
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 3. RESUME DOCUMENT ───────────────────────────────── */}
                {activeTab === 'resume' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Resume / CV Document</h3>
                        <p className="text-xs text-slate-400">Attached master resume file for quick applications</p>
                      </div>
                    </div>

                    {formData.resumeUrl ? (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={22} className="text-primary-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {formData.resumeName || formData.resumeUrl.split('/').pop() || 'Resume Document.pdf'}
                            </p>
                            <p className="text-[11px] text-slate-400">Master CV Attached</p>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, resumeUrl: null, resumeName: null }))}
                            className="btn-ghost btn-compact text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center space-y-3">
                        <FileText size={28} className="mx-auto text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Resume Uploaded</p>
                          <p className="text-[11px] text-slate-400">Upload a PDF or DOCX file (up to 10MB)</p>
                        </div>
                        {isEditing && (
                          <label className="btn-primary btn-compact inline-flex items-center gap-1.5 cursor-pointer">
                            <Cloud size={14} />
                            <span>Upload Resume</span>
                            <input type="file" ref={resumeInputRef} accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4. SKILLS ────────────────────────────────────────── */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
                        <Zap size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Skills & Competencies</h3>
                        <p className="text-xs text-slate-400">Technical proficiencies and professional capabilities</p>
                      </div>
                    </div>

                    {isEditing && (
                      <form onSubmit={addSkill} className="flex gap-2">
                        <input
                          type="text"
                          name="skill"
                          placeholder="Add new skill (e.g. TypeScript, React Native)..."
                          className="input-field h-10 text-xs flex-1"
                        />
                        <button type="submit" className="btn-primary btn-compact text-xs">
                          <Plus size={14} /> Add
                        </button>
                      </form>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {candidateSkills.length > 0 ? (
                        candidateSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            onClick={() => toggleSkill(skill)}
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all',
                              isEditing
                                ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/40 dark:text-primary-400 dark:border-primary-900/50 cursor-pointer hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            )}
                          >
                            <span>{skill}</span>
                            {isEditing && <X size={12} className="opacity-70" />}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">No skills added yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── 5. SOCIAL PROFILES ───────────────────────────────── */}
                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Social Profiles & Links</h3>
                        <p className="text-xs text-slate-400">External portfolios, GitHub, and professional networks</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">LinkedIn Profile</label>
                        <input
                          type="text"
                          value={formData.linkedin || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Portfolio / Website</label>
                        <input
                          type="text"
                          value={formData.portfolio || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, portfolio: e.target.value })}
                          placeholder="https://yourportfolio.dev"
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">GitHub Profile</label>
                        <input
                          type="text"
                          value={formData.github || ''}
                          readOnly={!isEditing}
                          onChange={e => setFormData({ ...formData, github: e.target.value })}
                          placeholder="https://github.com/username"
                          className={cn("input-field h-10 text-sm", !isEditing && "bg-slate-50 dark:bg-slate-800/50 cursor-default")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 6. DOCUMENTS ─────────────────────────────────────── */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600">
                        <Cloud size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Verified Documents</h3>
                        <p className="text-xs text-slate-400">Identification, academic proofs, and professional credentials</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(formData.documents || []).length > 0 ? (
                        (formData.documents || []).map((doc) => (
                          <div key={doc.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText size={18} className="text-primary-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.name || doc.type}</p>
                                <p className="text-[10px] text-slate-400">{doc.type}</p>
                              </div>
                            </div>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeDocument(doc.id)}
                                className="btn-ghost btn-compact text-rose-600 hover:text-rose-700"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-6">No additional credentials uploaded.</p>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;

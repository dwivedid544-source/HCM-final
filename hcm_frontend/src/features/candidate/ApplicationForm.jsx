import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone as PhoneIcon, Upload, FileText, Link as LinkIcon, MapPin, DollarSign, 
  Calendar, Globe, Plus, X, ArrowLeft, CheckCircle2, AlertCircle, Briefcase, 
  ChevronDown, Zap, ShieldCheck, Info, RotateCcw, Cloud, Trash2, ArrowRight, Clock
} from 'lucide-react';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import { cn } from '../../utils/cn';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCandidate } from '../../context/CandidateContext';
import { useCurrency } from '../../hooks/useCurrency';
import { uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import PageHeader from '../../shared/components/ui/PageHeader';

const ApplicationForm = () => {
  const { formatCurrency, getSymbol, getIcon } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const { applyForJob, jobs, profile, showToast } = useCandidate();
  
  // Extract job from location state or fallback to default
  const jobInfo = location.state?.job || jobs?.allJobs?.[0] || {
    id: 'job-default',
    title: 'Position',
    company: 'Company',
    department: 'General',
    location: 'Remote',
    type: 'Full-time',
    salary: 'Competitive'
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState(
    Array.isArray(profile?.skills) 
      ? profile.skills 
      : (typeof profile?.skills === 'string' && profile.skills ? profile.skills.split(',').map(s => s.trim()) : ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'])
  );
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || profile?.city || '',
    linkedin: profile?.linkedin || '',
    portfolio: profile?.portfolio || '',
    expectedSalary: profile?.expectedSalary || '',
    availability: 'Immediate',
    coverLetter: ''
  });
  const [skillInput, setSkillInput] = useState('');

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || profile.fullName || '',
        email: prev.email || profile.email || '',
        phone: prev.phone || profile.phone || '',
        location: prev.location || profile.location || profile.city || '',
        linkedin: prev.linkedin || profile.linkedin || '',
        portfolio: prev.portfolio || profile.portfolio || '',
        expectedSalary: prev.expectedSalary || profile.expectedSalary || '',
      }));
      if (profile.skills && (!skills || skills.length === 0)) {
        setSkills(Array.isArray(profile.skills) ? profile.skills : profile.skills.split(',').map(s => s.trim()));
      }
    }
  }, [profile]);

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => setSkills(skills.filter(s => s !== skillToRemove));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate resume file (type and size)
    if (resume && resume instanceof File) {
      const allowedExts = ['pdf', 'doc', 'docx'];
      const maxSizeMB = 10;
      const validation = validateFile(resume, allowedExts, maxSizeMB);
      if (!validation.isValid) {
        showToast?.(validation.message, 'error');
        setIsSubmitting(false);
        return;
      }
    }

    let cloudResumeUrl = null;
    if (resume && resume instanceof File) {
      try {
        const res = await uploadAPI.uploadDocument(resume, 'hcm/resumes');
        cloudResumeUrl = res.data?.data?.url;
      } catch (uploadErr) {
        console.warn('Resume upload failed, using fallback:', uploadErr.message);
        cloudResumeUrl = null;
      }
    }

    const submitApp = async (base64Data = null) => {
      const payload = {
        ...formData,
        skills: skills,
        resumeUrl: cloudResumeUrl || (resume ? resume.name : (profile?.resumeUrl || null)),
        resumeBase64: base64Data,
      };
      try {
        await applyForJob(jobInfo.id, payload);
        setIsSubmitting(false);
        setIsSubmitted(true);
      } catch (err) {
        setIsSubmitting(false);
        showToast?.(err.message || 'Failed to submit application', 'error');
      }
    };

    if (!cloudResumeUrl && resume && resume instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(resume);
      reader.onload = () => { submitApp(reader.result); };
    } else {
      submitApp(null);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center p-8 sm:p-12 w-full"
        >
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={42}/>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Application Submitted!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
            Your application for <span className="font-semibold text-slate-900 dark:text-white">{jobInfo.title}</span> has been received by <span className="font-semibold text-primary-600 dark:text-primary-400">{jobInfo.company}</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              onClick={() => navigate('/candidate/applications')}
              className="btn-primary w-full sm:w-auto"
            >
              <FileText size={16} />
              <span>View My Applications</span>
            </button>
            <button 
              onClick={() => navigate('/candidate/jobs')}
              className="btn-secondary w-full sm:w-auto"
            >
              <Briefcase size={16} />
              <span>Browse More Jobs</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary btn-icon shrink-0"
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <PageHeader
            title="Job Application"
            description={
              <>
                Applying for <span className="text-slate-900 dark:text-white font-semibold">{jobInfo.title}</span> at <span className="text-primary-600 dark:text-primary-400 font-semibold">{jobInfo.company}</span>
              </>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Application Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Your direct contact details for recruiters</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="form-label">Full Name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.fullName} 
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                      required 
                      className="input-field pl-10" 
                      placeholder="e.g. Alex Morgan"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">Email Address <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({ ...formData, email: e.target.value })} 
                      required 
                      className="input-field pl-10" 
                      placeholder="e.g. alex@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">Phone Number <span className="text-rose-500">*</span></label>
                  <PhoneInput 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">Current Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.location} 
                      onChange={e => setFormData({ ...formData, location: e.target.value })} 
                      className="input-field pl-10" 
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Resume / CV Document</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Upload your latest resume (PDF or DOCX, max 10MB)</p>
                </div>
              </div>

              <div>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors",
                    resume ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10" : "border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 bg-slate-50/50 dark:bg-slate-800/30"
                  )}
                  onClick={(e) => {
                    if (e.target.closest('button')) return;
                    document.getElementById('application-resume-upload').click();
                  }}
                >
                  <input 
                    id="application-resume-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) setResume(e.target.files[0]);
                    }} 
                  />
                  {resume ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{resume.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {(resume.size / (1024 * 1024)).toFixed(2)} MB • Ready for submission
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setResume(null); }}
                        className="btn-danger btn-compact"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : profile?.resumeUrl ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Profile Resume Selected</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{profile.resumeUrl.split('/').pop() || 'Saved Profile Resume'}</p>
                        </div>
                      </div>
                      <span className="btn-secondary btn-compact">Change File</span>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
                        <Upload size={22} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Click to upload your resume</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills & Compensation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label className="form-label">Relevant Skills</label>
                  <div className="input-field min-h-[44px] h-auto py-2 flex flex-wrap gap-1.5">
                    {skills.map(skill => (
                      <span 
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40"
                      >
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => removeSkill(skill)}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={skillInput} 
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder={skills.length === 0 ? "Type skill & hit Enter..." : "+ Add skill..."}
                      className="bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white flex-1 min-w-[100px] h-6"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">Expected Salary</label>
                  <div className="relative">
                    {React.createElement(getIcon(), { className: "absolute left-3.5 top-3 text-slate-400", size: 16 })}
                    <input 
                      type="text" 
                      value={formData.expectedSalary} 
                      onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })} 
                      placeholder={`e.g. ${getSymbol()}95,000 / year`}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Online Links & Cover Letter */}
            <div className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Online Profiles & Cover Letter</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Provide extra links and introduce yourself</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="form-label">LinkedIn Profile URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="url" 
                      value={formData.linkedin} 
                      onChange={e => setFormData({ ...formData, linkedin: e.target.value })} 
                      placeholder="https://linkedin.com/in/..." 
                      className="input-field pl-10" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">Portfolio / GitHub URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                      type="url" 
                      value={formData.portfolio} 
                      onChange={e => setFormData({ ...formData, portfolio: e.target.value })} 
                      placeholder="https://myportfolio.com" 
                      className="input-field pl-10" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="form-label">Cover Letter / Note</label>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Optional</span>
                </div>
                <textarea 
                  rows={5} 
                  value={formData.coverLetter}
                  onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                  placeholder="Outline your background, experience and why you are interested in this role..." 
                  className="textarea-field"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Summary Card */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="card space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Position Summary</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Overview of target role</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{jobInfo.title}</h4>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-0.5">{jobInfo.company}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin size={14} /> Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jobInfo.location || 'Remote'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Briefcase size={14} /> Employment</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jobInfo.type || 'Full-time'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><DollarSign size={14} /> Compensation</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jobInfo.salary || 'Competitive'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar size={14} /> Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jobInfo.department || 'General'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs">
                <ShieldCheck size={16} className="shrink-0" />
                <span>Verified Direct Recruitment Posting</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  User,
  Mail,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Phone,
  Globe,
  Users,
  Sparkles,
  Loader2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { publicAPI } from '../utils/apiService';
import { cn } from '../utils/cn';

const steps = [
  { id: 'org', title: 'Organization', description: 'Company Details', icon: Building2 },
  { id: 'admin', title: 'Administrator', description: 'Root Account', icon: User },
  { id: 'done', title: 'Complete', description: 'Workspace Ready', icon: CheckCircle2 }
];

export default function TenantSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const selectedPlan = searchParams.get('plan') || 'Professional';
  const selectedBilling = searchParams.get('billing') || 'Monthly';

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    organizationName: '',
    industry: 'Technology & Software',
    companySize: '1-50',
    country: 'United States',
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError(null);

    if (currentStep === 0) {
      if (!formData.organizationName.trim()) {
        setError('Please enter your company or organization name.');
        return;
      }
      if (formData.organizationName.trim().length < 2) {
        setError('Organization name must be at least 2 characters long.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.adminFullName.trim()) {
      setError('Please enter the administrator full name.');
      return;
    }
    if (!formData.adminEmail.trim()) {
      setError('Please enter a valid work email for the administrator.');
      return;
    }

    setLoading(true);

    try {
      const res = await publicAPI.registerOrganization({
        organizationName: formData.organizationName.trim(),
        industry: formData.industry,
        companySize: formData.companySize,
        country: formData.country,
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminPhone: formData.adminPhone.trim() || undefined,
        plan: selectedPlan,
        billingCycle: selectedBilling,
      });

      if (res.data?.success) {
        setSuccessData(res.data.data);
        setCurrentStep(2);
      } else {
        setError(res.data?.message || 'Failed to create workspace.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to register organization. Please check your details and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Panel - Branding & Steps */}
        <div className="lg:col-span-5 bg-slate-950 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[70px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 mb-8 sm:mb-10 group cursor-pointer w-fit">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover:bg-white/20 transition-all">
                <Cpu className="text-white" size={24} />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  HCM.ai
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  Enterprise HR
                </span>
              </div>
            </Link>

            {/* Title & Plan Badge */}
            <div className="mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Create Workspace
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  <Sparkles size={13} />
                  {selectedPlan} Plan
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedBilling}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  14-Day Free Trial
                </span>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="space-y-6 sm:space-y-7">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-4 transition-all duration-300',
                      isActive ? 'opacity-100 translate-x-1' : isPast ? 'opacity-80' : 'opacity-40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0',
                        isActive
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10'
                          : isPast
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-slate-800 bg-slate-900 text-slate-500'
                      )}
                    >
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        Step {idx + 1}
                      </p>
                      <p className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-slate-300')}>
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Footer Link */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4 ml-1 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel - Form Screens */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-xs"
                >
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="flex-1 leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-rose-400 hover:text-rose-600 cursor-pointer p-0.5"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* STEP 0: Organization Details */}
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      Tell us about your company
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      We'll configure your dedicated database workspace and security policies.
                    </p>
                  </div>

                  <form onSubmit={handleNext} className="space-y-5">
                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <Building2
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                          size={19}
                        />
                        <input
                          type="text"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleChange}
                          placeholder="e.g. Acme Corporation"
                          className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Industry & Company Size Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {/* Industry */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Industry
                        </label>
                        <div className="relative group">
                          <Briefcase
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                            size={19}
                          />
                          <select
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="w-full pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="Technology & Software">Technology & Software</option>
                            <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                            <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                            <option value="Finance & Banking">Finance & Banking</option>
                            <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                            <option value="Education & EdTech">Education & EdTech</option>
                            <option value="Professional Services">Professional Services</option>
                            <option value="Hospitality & Media">Hospitality & Media</option>
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            size={17}
                          />
                        </div>
                      </div>

                      {/* Company Size */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          Company Size
                        </label>
                        <div className="relative group">
                          <Users
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                            size={19}
                          />
                          <select
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleChange}
                            className="w-full pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                          >
                            <option value="1-15">1-15 employees</option>
                            <option value="1-50">1-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ Enterprise</option>
                          </select>
                          <ChevronDown
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            size={17}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Operating Country
                      </label>
                      <div className="relative group">
                        <Globe
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                          size={19}
                        />
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full pl-11 pr-10 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="India">India</option>
                          <option value="Singapore">Singapore</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Japan">Japan</option>
                          <option value="Global / Other">Global / Other</option>
                        </select>
                        <ChevronDown
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={17}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 flex justify-end">
                      <button
                        type="submit"
                        className="w-full sm:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 1: Administrator Profile */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      Administrator Profile
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Primary administrator for{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {formData.organizationName || 'your organization'}
                      </strong>
                      .
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Administrator Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                          size={19}
                        />
                        <input
                          type="text"
                          name="adminFullName"
                          value={formData.adminFullName}
                          onChange={handleChange}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Work Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Work Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                          size={19}
                        />
                        <input
                          type="email"
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleChange}
                          placeholder="e.g. s.jenkins@company.com"
                          className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          required
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        We will generate a secure one-time password setup link for this account.
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Direct Phone Number (Optional)
                      </label>
                      <div className="relative group">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors pointer-events-none"
                          size={19}
                        />
                        <input
                          type="tel"
                          name="adminPhone"
                          value={formData.adminPhone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-11 pr-4 h-12 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="h-12 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Provisioning Workspace...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Workspace</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Workspace Provisioned! */}
              {currentStep === 2 && successData && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-left"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    Workspace Provisioned!
                  </h1>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    Your enterprise workspace for{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {successData.organizationName || formData.organizationName}
                    </strong>{' '}
                    is configured and ready on the{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedPlan} plan</span>.
                  </p>

                  {/* Summary Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Workspace:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {successData.organizationName || formData.organizationName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Admin Email:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {successData.adminEmail || formData.adminEmail}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Subscription:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        14-Day Free Trial Activated
                      </span>
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className="space-y-3 pt-2">
                    {successData.token ? (
                      <Link
                        to={`/setup-password?token=${encodeURIComponent(successData.token)}`}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <span>Set Up Administrator Password Now</span>
                        <ArrowRight size={18} />
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <span>Sign In as Admin</span>
                        <ArrowRight size={18} />
                      </Link>
                    )}

                    <Link
                      to="/"
                      className="w-full h-11 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    >
                      Return to Homepage
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

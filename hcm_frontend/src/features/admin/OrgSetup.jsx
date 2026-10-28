import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   Building2,
   Upload,
   Globe,
   MapPin,
   Mail,
   Phone,
   CreditCard,
   Clock,
   Globe2,
   Hash,
   Save,
   RotateCcw,
   CheckCircle2,
   Trash2,
   Loader2,
   Image as ImageIcon,
   Sparkles,
   Download,
   Check,
   Eye,
   FileText,
   Receipt,
   AlertCircle,
   RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../context/AdminContext';
import { adminAPI } from '../../utils/apiService';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import PageHeader from '../../shared/components/ui/PageHeader';

const defaultOrgData = {
   companyName: '',
   legalName: '',
   websiteUrl: '',
   industry: '',
   companySize: '',
   taxId: '',
   primaryEmail: '',
   supportPhone: '',
   timezone: '',
   currency: '',
   hqAddress: '',
   logo: ''
};

const sanitizeLogo = (logo) => {
   if (!logo || typeof logo !== 'string') return '';
   return logo.trim();
};

const mapOrgFromApi = (org) => ({
   companyName: org?.name || '',
   legalName: org?.legalName || '',
   websiteUrl: org?.websiteUrl || '',
   industry: org?.industry || '',
   companySize: org?.companySize || '',
   taxId: org?.taxId || '',
   primaryEmail: org?.primaryEmail || '',
   supportPhone: org?.supportPhone || '',
   timezone: org?.timezone || '',
   currency: org?.currency || '',
   hqAddress: org?.address || '',
   logo: sanitizeLogo(org?.logoUrl),
});

const mapOrgToApi = (data) => {
   const logo = sanitizeLogo(data.logo);
   return {
      name: data.companyName?.trim() || undefined,
      legalName: data.legalName?.trim() || undefined,
      websiteUrl: data.websiteUrl?.trim() || undefined,
      industry: data.industry?.trim() || undefined,
      companySize: data.companySize?.trim() || undefined,
      taxId: data.taxId?.trim() || undefined,
      primaryEmail: data.primaryEmail?.trim() || undefined,
      supportPhone: data.supportPhone?.trim() || undefined,
      timezone: data.timezone?.trim() || undefined,
      currency: data.currency?.trim() || undefined,
      address: data.hqAddress?.trim() || undefined,
      logoUrl: logo || null,
   };
};

// Generate initials from company name for dynamic avatar fallback
const getInitials = (name) => {
   if (!name || typeof name !== 'string') return 'ORG';
   const parts = name.trim().split(/\s+/);
   if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const OrgSetup = () => {
   const { showToast } = useAdmin();

   const [orgData, setOrgData] = useState(defaultOrgData);
   const [savedData, setSavedData] = useState(defaultOrgData);
   const [orgId, setOrgId] = useState(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [isUploadingLogo, setIsUploadingLogo] = useState(false);
   const [logoLoadError, setLogoLoadError] = useState(false);
   const [isDragging, setIsDragging] = useState(false);
   const [activePreviewTab, setActivePreviewTab] = useState('sidebar'); // 'sidebar' | 'payslip'
   const [fetchError, setFetchError] = useState(null);
   const [errors, setErrors] = useState({});
   const fileInputRef = useRef(null);

   const initials = useMemo(() => getInitials(orgData.companyName), [orgData.companyName]);

   const triggerFileInput = (e) => {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }
      fileInputRef.current?.click();
   };

   const hasChanges = useMemo(() => {
      return JSON.stringify(orgData) !== JSON.stringify(savedData);
   }, [orgData, savedData]);

   const loadOrganization = useCallback(async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      setFetchError(null);
      try {
         const response = await adminAPI.getOrganization();
         const org = response.data?.data;

         if (org?.id) {
            setOrgId(org.id);
            const mapped = mapOrgFromApi(org);
            setOrgData(mapped);
            setSavedData(mapped);
            setLogoLoadError(false);
         }
      } catch (err) {
         console.error('Failed to load organization from database:', err);
         setFetchError('Unable to load organization settings. Please ensure the backend is running.');
         showToast('Failed to load organization data', 'error');
      } finally {
         if (!isSilent) setIsLoading(false);
      }
   }, [showToast]);

   useEffect(() => {
      loadOrganization();
   }, [loadOrganization]);

   useEffect(() => {
      if (orgData.logo) {
         setLogoLoadError(false);
      }
   }, [orgData.logo]);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setOrgData(prev => ({
         ...prev,
         [name]: value
      }));
      if (errors[name]) {
         setErrors(prev => ({ ...prev, [name]: null }));
      }
   };

   const handleReset = (e) => {
      e.preventDefault();
      setOrgData({ ...savedData });
      setErrors({});
      showToast('Form reset to saved organization settings', 'info');
   };

   const validateForm = () => {
      const errs = {};
      if (!orgData.companyName.trim()) {
         errs.companyName = 'Company Name is required.';
      }
      if (orgData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgData.primaryEmail.trim())) {
         errs.primaryEmail = 'Please enter a valid email address.';
      }
      setErrors(errs);
      return Object.keys(errs).length === 0;
   };

   const handleSave = async (e) => {
      e.preventDefault();
      if (!validateForm()) {
         showToast('Please fix the validation errors before saving.', 'error');
         return;
      }

      try {
         setIsSaving(true);

         let existingOrgId = orgId;
         if (!existingOrgId) {
            const existing = await adminAPI.getOrganization();
            existingOrgId = existing.data?.data?.id || null;
            if (existingOrgId) setOrgId(existingOrgId);
         }

         const payload = mapOrgToApi(orgData);
         const response = existingOrgId
            ? await adminAPI.updateOrganization(existingOrgId, payload)
            : await adminAPI.createOrganization(payload);

         const savedOrg = response.data?.data;
         if (savedOrg?.id) {
            setOrgId(savedOrg.id);
            const syncedData = mapOrgFromApi(savedOrg);
            setOrgData(syncedData);
            setSavedData(syncedData);
            setLogoLoadError(false);
         } else {
            setSavedData(orgData);
         }

         showToast('Organization settings saved successfully!', 'success');
         window.dispatchEvent(new CustomEvent('hcm_global_sync', {
            detail: { logoUrl: orgData.logo, companyName: orgData.companyName }
         }));
      } catch (err) {
         console.error('Failed to save organization:', err);
         const message = err.response?.data?.error?.message
            || err.response?.data?.message
            || (err.code === 'ERR_NETWORK' ? 'Cannot connect to server. Please ensure backend is running.' : null)
            || 'Failed to save organization configuration to database.';
         showToast(message, 'error');
      } finally {
         setIsSaving(false);
      }
   };

   const processUploadedFile = async (file) => {
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
         showToast('Logo file size must be less than 10MB', 'error');
         return;
      }

      if (!file.type.startsWith('image/')) {
         showToast('Please select a valid image file (PNG, JPG, SVG, WebP, GIF)', 'error');
         return;
      }

      const localPreview = URL.createObjectURL(file);
      setOrgData(prev => ({ ...prev, logo: localPreview }));
      setLogoLoadError(false);
      setIsUploadingLogo(true);

      const formData = new FormData();
      formData.append('logo', file);

      try {
         const response = await adminAPI.uploadOrganizationLogo(formData);
         const savedLogoUrl = response.data?.data?.logoUrl;

         if (savedLogoUrl) {
            setOrgData(prev => ({ ...prev, logo: savedLogoUrl }));
            setSavedData(prev => ({ ...prev, logo: savedLogoUrl }));
            setLogoLoadError(false);
            showToast('Company logo uploaded and saved successfully!', 'success');
            window.dispatchEvent(new CustomEvent('hcm_global_sync', {
               detail: { 
                  logoUrl: savedLogoUrl, 
                  logo: savedLogoUrl, 
                  companyName: orgData.companyName,
                  name: orgData.companyName 
               }
            }));
         } else {
            throw new Error('Upload succeeded but no logo URL was returned.');
         }
      } catch (err) {
         console.error('Logo upload error:', err);
         const errMsg = err.response?.data?.error?.message || err.message || 'Failed to upload logo.';
         showToast(errMsg, 'error');
      } finally {
         setIsUploadingLogo(false);
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
      }
   };

   const handleLogoUpload = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
         await processUploadedFile(file);
      }
   };

   const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
   };

   const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
   };

   const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
         await processUploadedFile(file);
      }
   };

   const handleRemoveLogo = async (e) => {
      if (e) e.preventDefault();
      try {
         await adminAPI.deleteOrganizationLogo();
      } catch (err) {
         console.warn('Failed to clear logo on server:', err.message);
      }
      setOrgData(prev => ({ ...prev, logo: '' }));
      setSavedData(prev => ({ ...prev, logo: '' }));
      setLogoLoadError(false);
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
      window.dispatchEvent(new CustomEvent('hcm_global_sync', {
         detail: { logoUrl: '', companyName: orgData.companyName }
      }));
      showToast('Company logo removed', 'info');
   };

   return (
      <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left max-w-7xl mx-auto">
         {/* Top Header */}
         <PageHeader
            title="Organization Setup"
            description="Configure core branding, corporate identity, and regional preferences"
            actions={
               <div className="flex items-center gap-3 flex-wrap">
                  <button
                     type="button"
                     onClick={handleReset}
                     disabled={isLoading || isSaving || !hasChanges}
                     className="btn-secondary disabled:opacity-50 cursor-pointer"
                     title="Reset to saved settings"
                  >
                     <RotateCcw size={16} />
                     <span>Reset</span>
                  </button>
                  <button
                     type="button"
                     onClick={handleSave}
                     disabled={isSaving || isLoading || !orgData.companyName.trim()}
                     className={cn(
                        "btn-primary cursor-pointer",
                        hasChanges && "animate-pulse-light",
                        (isSaving || isLoading || !orgData.companyName.trim()) && "opacity-50 cursor-not-allowed"
                     )}
                  >
                     {isSaving ? (
                        <Loader2 size={16} className="animate-spin" />
                     ) : (
                        <Save size={16} />
                     )}
                     <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
               </div>
            }
         />

         {/* Error Banner with Retry */}
         {fetchError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-4 text-rose-800 dark:text-rose-200 text-sm">
               <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{fetchError}</span>
               </div>
               <button
                  type="button"
                  onClick={() => loadOrganization()}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
               >
                  Retry
               </button>
            </div>
         )}

         {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
               <div className="lg:col-span-8 space-y-6">
                  <div className="card p-6 space-y-4 animate-pulse">
                     <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-4 space-y-6">
                  <div className="card p-6 space-y-4 animate-pulse">
                     <div className="h-32 w-32 mx-auto bg-slate-200 dark:bg-slate-800 rounded-3xl" />
                  </div>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
               {/* Main Form Area */}
               <div className="lg:col-span-8 space-y-6">
                  {/* General Info Card */}
                  <div className="card">
                     <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                           <Building2 size={20} />
                        </div>
                        <div>
                           <h3 className="hcm-section-heading">General Information</h3>
                           <p className="text-xs text-slate-400 dark:text-slate-500">Legal entity details and organizational identification</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Company Name <span className="text-rose-500">*</span>
                           </label>
                           <div className="relative group">
                              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={18} />
                              <input
                                 type="text"
                                 name="companyName"
                                 required
                                 value={orgData.companyName}
                                 onChange={handleChange}
                                 placeholder="Enter organization name"
                                 className={cn("input-field pl-11", errors.companyName && "border-rose-400 focus:ring-rose-400")}
                              />
                           </div>
                           {errors.companyName && (
                              <p className="text-xs text-rose-500 font-medium">{errors.companyName}</p>
                           )}
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Legal Entity Name
                           </label>
                           <input
                              type="text"
                              name="legalName"
                              value={orgData.legalName}
                              onChange={handleChange}
                              placeholder="e.g. Registered Legal Name Inc."
                              className="input-field"
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Website URL
                           </label>
                           <div className="relative group">
                              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors pointer-events-none" size={18} />
                              <input
                                 type="text"
                                 name="websiteUrl"
                                 value={orgData.websiteUrl}
                                 onChange={handleChange}
                                 placeholder="https://yourcompany.com"
                                 className="input-field pl-11"
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Industry Sector
                           </label>
                           <select
                              name="industry"
                              value={orgData.industry}
                              onChange={handleChange}
                              className="select-field"
                           >
                              <option value="">Select industry sector</option>
                              <option value="Information Technology">Information Technology</option>
                              <option value="Financial Services">Financial Services</option>
                              <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                              <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                              <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                              <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                              <option value="Education & Training">Education & Training</option>
                              <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                              <option value="Other">Other</option>
                           </select>
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Company Size
                           </label>
                           <select
                              name="companySize"
                              value={orgData.companySize}
                              onChange={handleChange}
                              className="select-field"
                           >
                              <option value="">Select company size</option>
                              <option value="1-50 Employees">1-50 Employees</option>
                              <option value="51-200 Employees">51-200 Employees</option>
                              <option value="201-1000 Employees">201-1000 Employees</option>
                              <option value="1000+ Employees">1000+ Employees</option>
                           </select>
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Tax ID / GSTIN / EIN
                           </label>
                           <div className="relative group">
                              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors pointer-events-none" size={18} />
                              <input
                                 type="text"
                                 name="taxId"
                                 value={orgData.taxId}
                                 onChange={handleChange}
                                 placeholder="e.g. TAX-12345678"
                                 className="input-field pl-11"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Regional & Contact Preferences */}
                  <div className="card">
                     <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                           <Globe2 size={20} />
                        </div>
                        <div>
                           <h3 className="hcm-section-heading">Regional & Contact Preferences</h3>
                           <p className="text-xs text-slate-400 dark:text-slate-500">Communication endpoints, default currency and locale settings</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Primary Email
                           </label>
                           <div className="relative group">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                              <input
                                 type="email"
                                 name="primaryEmail"
                                 value={orgData.primaryEmail}
                                 onChange={handleChange}
                                 placeholder="contact@company.com"
                                 className={cn("input-field pl-11", errors.primaryEmail && "border-rose-400 focus:ring-rose-400")}
                              />
                           </div>
                           {errors.primaryEmail && (
                              <p className="text-xs text-rose-500 font-medium">{errors.primaryEmail}</p>
                           )}
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Support Phone
                           </label>
                           <PhoneInput
                              name="supportPhone"
                              value={orgData.supportPhone}
                              onChange={handleChange}
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Default Timezone
                           </label>
                           <div className="relative group">
                              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                              <select
                                 name="timezone"
                                 value={orgData.timezone}
                                 onChange={handleChange}
                                 className="select-field pl-11"
                              >
                                 <option value="">Select timezone</option>
                                 <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                                 <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                                 <option value="UTC+00:00 (GMT / London)">UTC+00:00 (GMT / London)</option>
                                 <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                                 <option value="UTC+08:00 (Singapore / Hong Kong)">UTC+08:00 (Singapore / Hong Kong)</option>
                                 <option value="UTC+04:00 (Gulf Standard Time)">UTC+04:00 (Gulf Standard Time)</option>
                                 <option value="UTC+10:00 (Australian Eastern Time)">UTC+10:00 (Australian Eastern Time)</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Operating Currency
                           </label>
                           <div className="relative group">
                              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                              <select
                                 name="currency"
                                 value={orgData.currency}
                                 onChange={handleChange}
                                 className="select-field pl-11"
                              >
                                 <option value="">Select currency</option>
                                 <option value="USD ($)">USD ($) - US Dollar</option>
                                 <option value="EUR (€)">EUR (€) - Euro</option>
                                 <option value="GBP (£)">GBP (£) - British Pound</option>
                                 <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                                 <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                                 <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                                 <option value="AUD ($)">AUD ($) - Australian Dollar</option>
                                 <option value="SGD ($)">SGD ($) - Singapore Dollar</option>
                              </select>
                           </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                           <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                              Headquarters Address
                           </label>
                           <div className="relative group">
                              <MapPin className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                              <textarea
                                 rows={3}
                                 name="hqAddress"
                                 value={orgData.hqAddress}
                                 onChange={handleChange}
                                 placeholder="Enter headquarters office address..."
                                 className="textarea-field pl-11"
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Sidebar / Branding & Avatar Uploader */}
               <div className="lg:col-span-4 space-y-6">
                  {/* Organization Logo Card */}
                  <div className="card flex flex-col items-center">
                     <div className="flex items-center justify-between w-full mb-4">
                        <div className="flex items-center gap-2">
                           <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Brand Identity & Logo</h3>
                        </div>
                        <span className={cn(
                           "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                           orgData.logo && !logoLoadError
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}>
                           {orgData.logo && !logoLoadError ? 'Active Logo' : 'Initials Avatar'}
                        </span>
                     </div>

                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif" 
                        onChange={handleLogoUpload}
                        className="hidden"
                     />

                     {/* Dropzone & Avatar Container */}
                     <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerFileInput}
                        className={cn(
                           "relative w-40 h-40 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md group flex items-center justify-center border-2",
                           isDragging 
                              ? "border-primary-500 bg-primary-50/30 scale-105 shadow-primary-500/20" 
                              : "border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary-400 hover:shadow-lg"
                        )}
                     >
                        {orgData.logo && !logoLoadError ? (
                           <div className="w-full h-full p-3 flex items-center justify-center bg-white dark:bg-slate-900">
                              <img 
                                 src={orgData.logo} 
                                 alt="Company Logo" 
                                 className="w-full h-full object-contain"
                                 onError={() => {
                                    console.warn("Logo image load error:", orgData.logo);
                                    setLogoLoadError(true);
                                 }}
                              />
                           </div>
                        ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-500/10 via-indigo-500/5 to-purple-500/10 dark:from-primary-950/30 dark:to-purple-950/30">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 font-black text-2xl tracking-wider mb-2 group-hover:scale-110 transition-transform">
                                 {initials}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center">
                                 {isDragging ? 'Drop Image Here' : 'Click or Drag Logo'}
                              </span>
                           </div>
                        )}

                        {/* Uploading Overlay */}
                        {isUploadingLogo ? (
                           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-20 animate-fade-in">
                              <Loader2 size={28} className="animate-spin text-primary-400" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Uploading Logo...</span>
                           </div>
                        ) : (
                           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 text-white z-10">
                              <Upload size={22} />
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                 {orgData.logo && !logoLoadError ? 'Change Logo' : 'Upload Image'}
                              </span>
                           </div>
                        )}
                     </div>

                     {/* Actions buttons under logo */}
                     <div className="flex items-center gap-2 mt-4 w-full justify-center">
                        <button
                           type="button"
                           onClick={triggerFileInput}
                           disabled={isUploadingLogo}
                           className="btn-secondary btn-compact cursor-pointer"
                        >
                           <Upload size={14} />
                           <span>{orgData.logo && !logoLoadError ? 'Change' : 'Browse File'}</span>
                        </button>
                        {orgData.logo && (
                           <button
                              type="button"
                              onClick={handleRemoveLogo}
                              disabled={isUploadingLogo}
                              className="btn-danger btn-compact cursor-pointer"
                              title="Remove uploaded logo"
                           >
                              <Trash2 size={14} />
                              <span>Delete</span>
                           </button>
                        )}
                     </div>

                     <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-3 text-center px-2 leading-relaxed">
                        Supports PNG, JPG, SVG, WebP, GIF (Max 10MB). Automatically synchronized across all modules.
                     </p>
                  </div>

                  {/* Live Branding Preview Mockup */}
                  <div className="card space-y-3">
                     <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                           <Eye size={16} className="text-primary-600 dark:text-primary-400" />
                           <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Ecosystem Preview</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <button 
                              type="button"
                              onClick={() => setActivePreviewTab('sidebar')}
                              className={cn("btn-compact", activePreviewTab === 'sidebar' ? "btn-primary" : "btn-ghost")}
                           >
                              Sidebar
                           </button>
                           <button 
                              type="button"
                              onClick={() => setActivePreviewTab('payslip')}
                              className={cn("btn-compact", activePreviewTab === 'payslip' ? "btn-primary" : "btn-ghost")}
                           >
                              Document
                           </button>
                        </div>
                     </div>

                     {activePreviewTab === 'sidebar' ? (
                        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center gap-3 shadow-inner">
                           <div className="w-10 h-10 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center p-1 border border-white/10 shrink-0">
                              {orgData.logo && !logoLoadError ? (
                                 <img src={orgData.logo} alt="Logo" className="w-full h-full object-contain" />
                              ) : (
                                 <span className="font-black text-xs text-primary-400">{initials}</span>
                              )}
                           </div>
                           <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-black truncate text-white">
                                 {orgData.companyName || 'Your Organization'}
                              </h5>
                              <p className="text-[9px] text-slate-400 font-medium">Enterprise Workspace</p>
                           </div>
                           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        </div>
                     ) : (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                 <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0">
                                    {orgData.logo && !logoLoadError ? (
                                       <img src={orgData.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                       <span className="font-bold text-[10px] text-primary-600">{initials}</span>
                                    )}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                                       {orgData.companyName || 'Your Organization'}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-mono">
                                       TAX ID: {orgData.taxId || 'NOT ASSIGNED'}
                                    </div>
                                 </div>
                              </div>
                              <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 shrink-0">
                                 OFFICIAL
                              </span>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Setup Progress Checklist */}
                  <div className="card bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-950/50 dark:to-slate-900 text-white border-none shadow-soft relative overflow-hidden group">
                     <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={140} />
                     </div>
                     <h3 className="text-xs font-black text-indigo-200 dark:text-indigo-300 uppercase tracking-wider mb-4">Setup Checklist</h3>
                     <div className="space-y-3 relative z-10">
                        {[
                           { label: 'Company Profile & Entity Name', done: !!(orgData.companyName && orgData.legalName) },
                           { label: 'Brand Logo / Avatar Sync', done: !!orgData.logo },
                           { label: 'Regional Currency & Timezone', done: !!(orgData.timezone && orgData.currency) },
                           { label: 'Headquarters & Contact Details', done: !!(orgData.primaryEmail && orgData.supportPhone) },
                        ].map((step, i) => (
                           <div key={i} className="flex items-center gap-3">
                              <div className={cn(
                                 "w-5 h-5 rounded-full flex items-center justify-center border transition-all text-[10px] shrink-0",
                                 step.done 
                                    ? "bg-emerald-400 border-emerald-400 text-slate-900 font-black shadow-md" 
                                    : "border-white/20 text-white/40"
                              )}>
                                 {step.done ? <Check size={12} strokeWidth={3} /> : i + 1}
                              </div>
                              <span className={cn("text-xs font-bold transition-opacity", step.done ? "text-white" : "text-white/50")}>
                                 {step.label}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default OrgSetup;

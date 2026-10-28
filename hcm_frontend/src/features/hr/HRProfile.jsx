import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Settings, Briefcase, Camera, 
  MapPin, Phone, Mail, Building, Clock, Activity, 
  Lock, Bell, Smartphone, Globe, AlertTriangle, Key,
  X, CheckCircle2, ChevronDown, Edit3, Save, Trash2, Eye, EyeOff, FileText, Upload, Download, Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { useHR } from '../../context/HRContext';
import { useDateFormat } from '../../hooks/useDateFormat';
import { employeeAPI, uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import DatePicker from '../../shared/components/common/DatePicker';
import PageHeader from '../../shared/components/ui/PageHeader';
import { usePersistedTab } from '../../hooks/usePersistedTab';

const HRProfile = () => {
  const { user } = useAuth();
  const { showToast } = useHR();
  const { formatDate } = useDateFormat();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = usePersistedTab('hr_profile', 'personal');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    personal: {
      fullName: user?.name || user?.fullName || 'HR Manager',
      email: user?.email || '',
      phone: '',
      dob: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    work: {
      employeeId: '',
      role: user?.role || 'HR',
      department: '',
      designation: '',
      managerName: '',
      joinDate: '',
      type: 'Full-Time Regular',
      location: 'Main Office',
      status: 'Active'
    },
    emergency: {
      contactName: '',
      relation: '',
      phone: '',
      alternatePhone: '',
      email: '',
      address: ''
    },
    documents: []
  });

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, docsRes] = await Promise.allSettled([
        employeeAPI.getProfile(),
        employeeAPI.getDocuments()
      ]);
      
      if (profileRes.status === 'fulfilled' && profileRes.value?.data?.success) {
        const p = profileRes.value.data.data;
        setAvatarPreview(p.avatarUrl || p.avatar || '');
        
        let formattedDob = '';
        if (p.dob) {
          try {
            const d = new Date(p.dob);
            if (!isNaN(d.getTime())) {
              formattedDob = d.toISOString().split('T')[0];
            }
          } catch (e) {}
        }

        let formattedJoinDate = '';
        if (p.joiningDate) {
          try {
            formattedJoinDate = formatDate(p.joiningDate);
          } catch (e) {
            formattedJoinDate = String(p.joiningDate).slice(0, 10);
          }
        }

        setProfileData(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            fullName: p.fullName || user?.name || user?.fullName || 'HR Manager',
            email: user?.email || p.user?.email || '',
            phone: p.phone || '',
            dob: formattedDob,
            gender: p.gender || '',
            address: p.address || '',
          },
          work: {
            ...prev.work,
            employeeId: p.employeeId || 'EMP-1001',
            role: user?.role || p.user?.role || 'HR',
            department: p.department?.name || (typeof p.department === 'string' ? p.department : 'Human Resources'),
            managerName: p.manager?.fullName || 'Executive Leadership',
            joinDate: formattedJoinDate || '—',
            status: p.lifecycleStatus || 'Active'
          },
          emergency: {
            ...prev.emergency,
            contactName: p.emergencyName || '',
            phone: p.emergencyPhone || '',
            relation: p.emergencyRelation || '',
          }
        }));
      }

      if (docsRes.status === 'fulfilled' && docsRes.value?.data?.success) {
        setProfileData(prev => ({
          ...prev,
          documents: docsRes.value.data.data || []
        }));
      }
    } catch (err) {
      console.error('Profile loading error:', err);
      showToast('Failed to load profile data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSave = async () => {
    if (!profileData.personal.fullName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        fullName: profileData.personal.fullName,
        phone: profileData.personal.phone,
        gender: profileData.personal.gender,
        address: profileData.personal.address,
        avatarUrl: avatarPreview,
        emergencyName: profileData.emergency.contactName,
        emergencyPhone: profileData.emergency.phone,
        emergencyRelation: profileData.emergency.relation,
        dob: profileData.personal.dob || null
      };
      
      const res = await employeeAPI.updateProfile(payload);
      if (res.data?.success) {
        setIsEditing(false);
        showToast('Profile updated successfully.', 'success');
        await loadProfileData();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['png','jpg','jpeg','gif','webp'], 5);
    if (!v.isValid) { 
      showToast(v.message, 'error'); 
      return; 
    }
    try {
      showToast('Uploading avatar...');
      const response = await uploadAPI.uploadImage(file, 'hcm/avatars');
      const cloudUrl = response.data?.data?.url;
      if (cloudUrl) {
        setAvatarPreview(cloudUrl);
        showToast('Avatar uploaded successfully.', 'success');
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error('Avatar upload failed, fallback to FileReader:', err);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateField = (category, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['pdf','doc','docx','png','jpg','jpeg'], 10);
    if (!v.isValid) { 
      showToast(v.message, 'error'); 
      if (documentInputRef.current) documentInputRef.current.value = ''; 
      return; 
    }

    try {
      showToast('Uploading document...');
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      let fileData;
      try {
        const cloudResponse = await uploadAPI.uploadDocument(file, 'hcm/documents');
        fileData = cloudResponse.data?.data?.url;
      } catch (cloudErr) {
        console.error('Cloud doc upload failed, using fallback:', cloudErr);
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const payload = {
        name: file.name,
        category: 'Document',
        size: sizeMB,
        fileBase64: fileData
      };

      const res = await employeeAPI.uploadDocument(payload);
      if (res.data?.success) {
        showToast('Document uploaded successfully.', 'success');
        setProfileData(prev => ({
          ...prev,
          documents: [res.data.data, ...prev.documents]
        }));
      }
    } catch (err) {
      showToast('Failed to upload document.', 'error');
    }
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const deleteDocument = async (id) => {
    try {
      const res = await employeeAPI.deleteDocument(id);
      if (res.data?.success) {
        setProfileData(prev => ({
          ...prev,
          documents: prev.documents.filter(d => d.id !== id)
        }));
        showToast('Document deleted.', 'success');
      }
    } catch (err) {
      showToast('Failed to delete document.', 'error');
    }
    setDocToDelete(null);
  };

  const viewDocument = (url) => {
    if (url) window.open(url, '_blank');
    else showToast('Document URL not found', 'error');
  };

  const downloadDocument = async (url, filename) => {
    if (!url) {
      showToast('Document URL not found', 'error');
      return;
    }
    try {
      showToast(`Downloading ${filename}...`, 'info');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast('Document downloaded successfully!', 'success');
    } catch (err) {
      showToast('Download failed.', 'error');
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'work', label: 'Work Details', icon: Briefcase },
    { id: 'emergency', label: 'Emergency Contact', icon: AlertTriangle },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  // Helper for input classes
  const getInputClass = () => cn(
    "input-field h-11 text-xs sm:text-sm font-medium",
    isEditing 
      ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-primary-500 shadow-2xs" 
      : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300 cursor-default"
  );
  
  const getSelectClass = () => cn(
    "input-field h-11 text-xs sm:text-sm font-medium select-field",
    isEditing 
      ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-primary-500 shadow-2xs" 
      : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-700 dark:text-slate-300 cursor-default"
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="HR Profile"
        description="Manage your professional identity and records"
        actions={
          !isEditing ? (
            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button 
                type="button"
                onClick={() => { setIsEditing(false); loadProfileData(); }}
                className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button 
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
            </>
          )
        }
      />

      {/* ── Profile Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Sidebar Cards */}
        <div className="lg:col-span-4 w-full space-y-6">
          {/* Main User Card */}
          <div className="card p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center group">
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-primary-50 dark:ring-primary-950/40 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={44} className="text-slate-400" />
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs">
                    <Camera size={22} />
                    <span className="text-[10px] font-bold mt-1">Upload</span>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                )}
              </div>
              {isEditing && avatarPreview && (
                <button 
                  type="button"
                  onClick={removeAvatar}
                  className="absolute bottom-0 right-0 p-1.5 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove avatar"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {profileData.personal.fullName || 'HR Manager'}
            </h2>
            <div className="mt-2 inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 rounded-lg border border-primary-100 dark:border-primary-900/40">
              {profileData.work.role || 'HR'}
            </div>
            
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-left space-y-3.5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Email</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                  {profileData.personal.email || user?.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Phone</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                  {profileData.personal.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Join Date</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                  {profileData.work.joinDate || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Account Status</p>
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
                <CheckCircle2 size={26} />
              </div>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              ACTIVE & VERIFIED
            </p>
          </div>
        </div>

        {/* Right Content Tabs Card */}
        <div className="lg:col-span-8 w-full card p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Tabs Bar */}
          <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer select-none",
                    isActive 
                      ? "border-primary-600 text-primary-600 dark:text-white bg-white dark:bg-slate-900" 
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Form Content */}
          <div className="p-6 sm:p-8 flex-1">
            <AnimatePresence mode="wait">
              {/* PERSONAL INFO TAB */}
              {activeTab === 'personal' && (
                <motion.div 
                  key="personal" 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Full Name</label>
                      <input 
                        type="text" 
                        readOnly={!isEditing} 
                        value={profileData.personal.fullName}
                        onChange={e => updateField('personal', 'fullName', e.target.value)} 
                        className={getInputClass()} 
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Email <span className="text-rose-500">*</span></label>
                      <input 
                        type="email" 
                        readOnly={true} 
                        value={profileData.personal.email} 
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-transparent" 
                        title="Email cannot be changed" 
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Phone Number</label>
                      <PhoneInput 
                        name="phone" 
                        disabled={!isEditing} 
                        value={profileData.personal.phone} 
                        onChange={e => updateField('personal', 'phone', e.target.value)} 
                        className="h-11" 
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Gender</label>
                      <select 
                        disabled={!isEditing} 
                        value={profileData.personal.gender}
                        onChange={e => updateField('personal', 'gender', e.target.value)} 
                        className={getSelectClass()}
                      >
                        <option value="" className="dark:bg-slate-900">Select Gender</option>
                        <option value="Male" className="dark:bg-slate-900">Male</option>
                        <option value="Female" className="dark:bg-slate-900">Female</option>
                        <option value="Other" className="dark:bg-slate-900">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Date of Birth</label>
                      <DatePicker 
                        readOnly={!isEditing} 
                        value={profileData.personal.dob} 
                        onChange={val => updateField('personal', 'dob', val)} 
                        className={getInputClass()} 
                      />
                    </div>

                    <div className="space-y-1.5 text-left md:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <label className="form-label text-xs font-bold block">Address Location</label>
                      <input 
                        type="text" 
                        readOnly={!isEditing} 
                        placeholder="e.g. 123 Tech Park Way, Suite 400"
                        value={profileData.personal.address}
                        onChange={e => updateField('personal', 'address', e.target.value)} 
                        className={getInputClass()} 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* WORK DETAILS TAB */}
              {activeTab === 'work' && (
                <motion.div 
                  key="work" 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Employee ID</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={profileData.work.employeeId || 'EMP-1001'}
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent cursor-default"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Department</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={profileData.work.department || 'Human Resources'}
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent cursor-default"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Manager / Reports To</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={profileData.work.managerName || 'Executive Leadership'}
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent cursor-default"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Joining Date</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={profileData.work.joinDate || '—'}
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent cursor-default"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Employment Type</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={profileData.work.type}
                        className="input-field h-11 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent cursor-default"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Work Status</label>
                      <div className="h-11 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {profileData.work.status}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EMERGENCY CONTACT TAB */}
              {activeTab === 'emergency' && (
                <motion.div 
                  key="emergency" 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Emergency Contact Name</label>
                      <input 
                        type="text" 
                        readOnly={!isEditing} 
                        placeholder="e.g. Jane Doe"
                        value={profileData.emergency.contactName}
                        onChange={e => updateField('emergency', 'contactName', e.target.value)} 
                        className={getInputClass()} 
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="form-label text-xs font-bold block">Relationship</label>
                      <input 
                        type="text" 
                        readOnly={!isEditing} 
                        placeholder="e.g. Spouse / Parent / Sibling"
                        value={profileData.emergency.relation}
                        onChange={e => updateField('emergency', 'relation', e.target.value)} 
                        className={getInputClass()} 
                      />
                    </div>

                    <div className="space-y-1.5 text-left md:col-span-2">
                      <label className="form-label text-xs font-bold block">Emergency Phone Number</label>
                      <PhoneInput 
                        name="emergencyPhone" 
                        disabled={!isEditing} 
                        value={profileData.emergency.phone} 
                        onChange={e => updateField('emergency', 'phone', e.target.value)} 
                        className="h-11" 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <motion.div 
                  key="documents" 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Personal & Verification Documents</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Securely stored employee identity and qualification records</p>
                    </div>

                    <label className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer shrink-0">
                      <Upload size={15} />
                      <span>Upload File</span>
                      <input type="file" className="hidden" ref={documentInputRef} onChange={handleDocumentUpload} />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileData.documents.map(doc => (
                      <div key={doc.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">{doc.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {doc.category || 'Document'} • {formatDate(doc.date || doc.createdAt || new Date())}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            type="button"
                            onClick={() => downloadDocument(doc.url, doc.name)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Download Document"
                          >
                            <Download size={15} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => viewDocument(doc.url)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Document"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {profileData.documents.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                      <FileText size={32} className="mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No documents uploaded yet</p>
                      <p className="text-xs text-slate-400 mt-1">Upload ID cards, certifications, or personal records</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Document Deletion */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => deleteDocument(docToDelete.id)}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default HRProfile;

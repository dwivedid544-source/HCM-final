import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Settings, Briefcase, Camera, 
  MapPin, Phone, Mail, Building, Clock, Activity, 
  Lock, Bell, Smartphone, Globe, AlertTriangle, Key,
  X, CheckCircle2, ChevronDown, Edit3, Save, Trash2, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../context/AdminContext';
import { uploadAPI, employeeAPI, authAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import DatePicker from '../../shared/components/common/DatePicker';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import PageHeader from '../../shared/components/ui/PageHeader';

const AdminProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useAdmin();

  // Format role for display: 'ADMIN' -> 'Admin', 'SUPERADMIN' -> 'Super Admin'
  const formatRole = (role) => {
    if (!role) return 'Admin';
    const roleMap = {
      SUPERADMIN: 'Super Admin',
      ADMIN: 'Admin',
      HR: 'HR Manager',
      MANAGER: 'Manager',
      EMPLOYEE: 'Employee',
      CANDIDATE: 'Candidate',
    };
    return roleMap[role.toUpperCase()] || role;
  };

  const displayRole = formatRole(user?.role);
  const displayName = user?.name || user?.fullName || 'Admin User';
  const displayEmail = user?.email || 'admin@demo.com';

  // Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = usePersistedTab('admin_profile', 'personal');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || user?.avatarUrl || '');
  const fileInputRef = useRef(null);
  
  // Security Tab States
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Data State
  const [profileData, setProfileData] = useState({
    personal: {
      fullName: displayName,
      email: displayEmail,
      phone: user?.phone || '',
      dob: user?.dob || '1985-06-15',
      gender: user?.gender || 'Male',
      address: user?.address || '123 Enterprise Drive',
      city: user?.city || 'San Francisco',
      country: user?.country || 'USA',
      emergencyContact: user?.emergencyContact || '',
      bio: user?.bio || 'System Administrator overseeing core infrastructure and security protocols.'
    },
    work: {
      employeeId: user?.employeeId || user?.empId || 'EMP-00142',
      department: user?.department || 'Engineering & IT',
      role: displayRole,
      reportingTo: user?.reportingTo || user?.manager || 'Sarah Connor (CTO)',
      joiningDate: user?.joiningDate || user?.joinDate || '2021-03-01',
      location: user?.location || 'SF Office - Floor 4',
      type: user?.empType || 'Full-Time'
    },
    security: {
      twoFactor: true,
      loginAlerts: true,
      sessionTimeout: '30 Minutes'
    },
    preferences: {
      theme: 'System Default',
      language: 'English (US)',
      timezone: 'UTC-08:00 (Pacific)',
      dateFormat: 'MM/DD/YYYY',
      emailNotif: true,
      pushNotif: false,
      weeklySummary: true
    }
  });

  // Fetch live profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLiveProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const res = await employeeAPI.getProfile();
        const data = res.data?.data || res.data;
        if (data && isMounted) {
          const liveName = data.fullName || user?.name || user?.fullName || displayName;
          const liveAvatar = data.avatarUrl || user?.avatar || user?.avatarUrl || '';
          
          setAvatarPreview(liveAvatar);
          setProfileData(prev => ({
            ...prev,
            personal: {
              ...prev.personal,
              fullName: liveName,
              email: data.user?.email || user?.email || prev.personal.email,
              phone: data.phone || user?.phone || prev.personal.phone,
              dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : prev.personal.dob,
              gender: data.gender || prev.personal.gender,
              address: data.address || prev.personal.address,
              emergencyContact: data.emergencyPhone || data.emergencyContact || prev.personal.emergencyContact,
              bio: data.bio || user?.bio || prev.personal.bio
            },
            work: {
              ...prev.work,
              employeeId: data.employeeId || prev.work.employeeId,
              department: data.department?.name || data.department || prev.work.department,
              role: displayRole,
              reportingTo: data.manager?.fullName || prev.work.reportingTo,
              joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : prev.work.joiningDate
            },
            preferences: {
              ...prev.preferences,
              language: data.language || prev.preferences.language,
              timezone: data.timezone || prev.preferences.timezone,
              dateFormat: data.dateFormat || prev.preferences.dateFormat,
              emailNotif: data.emailNotif !== undefined ? data.emailNotif : prev.preferences.emailNotif,
              pushNotif: data.pushNotif !== undefined ? data.pushNotif : prev.preferences.pushNotif,
              weeklySummary: data.weeklySummary !== undefined ? data.weeklySummary : prev.preferences.weeklySummary
            }
          }));
        }
      } catch (err) {
        console.warn('Could not load live profile from API, using auth session:', err.message);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchLiveProfile();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Synchronize when user updates from useAuth
  useEffect(() => {
    if (!isEditing && user) {
      const activeName = user.name || user.fullName || displayName;
      const activeAvatar = user.avatar || user.avatarUrl || '';
      
      setProfileData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          fullName: activeName,
          email: user.email || prev.personal.email,
          phone: user.phone || prev.personal.phone,
          bio: user.bio || prev.personal.bio
        }
      }));
      if (activeAvatar) {
        setAvatarPreview(activeAvatar);
      }
    }
  }, [user, isEditing]);

  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'MacBook Pro 16"', browser: 'Chrome', ip: '192.168.1.104', lastActive: 'Current Session' },
    { id: 2, device: 'iPhone 15 Pro', browser: 'Safari', ip: '172.20.10.2', lastActive: '2 hours ago' },
    { id: 3, device: 'Windows Desktop', browser: 'Edge', ip: '10.0.0.45', lastActive: 'Yesterday' }
  ]);

  // Handlers
  const handleSave = async () => {
    if (isEditing) {
      if (!profileData.personal.fullName || !profileData.personal.email) {
         showToast('Error: Name and Email cannot be empty.', 'error');
         return;
      }
      try {
        const res = await employeeAPI.updateProfile({
          fullName: profileData.personal.fullName,
          phone: profileData.personal.phone,
          dob: profileData.personal.dob,
          gender: profileData.personal.gender,
          address: profileData.personal.address,
          emergencyPhone: profileData.personal.emergencyContact,
          avatarUrl: avatarPreview,
          bio: profileData.personal.bio,
          language: profileData.preferences.language,
          timezone: profileData.preferences.timezone,
          dateFormat: profileData.preferences.dateFormat,
          emailNotif: profileData.preferences.emailNotif,
          pushNotif: profileData.preferences.pushNotif,
          weeklySummary: profileData.preferences.weeklySummary
        });

        if (res.data?.success) {
          const updatedUser = {
            ...user,
            name: profileData.personal.fullName,
            fullName: profileData.personal.fullName,
            email: profileData.personal.email,
            phone: profileData.personal.phone,
            avatar: avatarPreview,
            avatarUrl: avatarPreview,
            bio: profileData.personal.bio
          };
          localStorage.setItem('hcm_user', JSON.stringify(updatedUser));
          sessionStorage.setItem('hcm_user', JSON.stringify(updatedUser));
          if (refreshUser) {
            await refreshUser();
          }
          setIsEditing(false);
          showToast('Profile updated securely.');
        } else {
          showToast('Failed to update profile on server', 'error');
        }
      } catch (err) {
        console.error('Failed to save profile changes:', err);
        showToast('Error saving profile changes', 'error');
      }
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['png','jpg','jpeg','gif','webp'], 5);
    if (!v.isValid) { showToast(v.message, 'error'); return; }
    try {
      const response = await uploadAPI.uploadImage(file, 'hcm/avatars');
      const cloudUrl = response.data?.data?.url;
      if (cloudUrl) {
        setAvatarPreview(cloudUrl);
        showToast('Avatar uploaded to Cloudinary successfully!');
        try {
          await employeeAPI.updateProfile({ avatarUrl: cloudUrl });
          if (refreshUser) await refreshUser();
        } catch (autoSaveErr) {
          console.warn('Auto-save avatar warning:', autoSaveErr.message);
        }
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error('Cloud avatar upload failed, using base64 fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSession = (id) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
    showToast('Remote session terminated.');
  };

  // Updaters
  const updateField = (category, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'work', label: 'Work Info', icon: Briefcase },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in focus:outline-none max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="My Profile"
        description="Manage your account information and preferences"
        actions={
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  if (activeTab === 'security') setActiveTab('personal');
                }}
                className="btn-primary"
                id="admin-edit-profile-btn"
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                  id="admin-cancel-edit-btn"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary"
                  id="admin-save-profile-btn"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft text-center group rounded-3xl">
              <div className="relative inline-block mb-4">
                 <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary-50 dark:ring-primary-950/50 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" onError={(e)=>{e.target.onerror=null; e.target.src='https://via.placeholder.com/150';}} />
                    ) : (
                      <User size={48} className="text-slate-400" />
                    )}
                    {isEditing && (
                       <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs form-label">
                          <Camera size={24}/>
                          <span className="text-[10px] font-bold mt-1">Upload</span>
                          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                       </label>
                    )}
                 </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{profileData.personal.fullName}</h2>
              <span className="mt-2 inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 rounded-lg border border-primary-100 dark:border-primary-800/60">
                 {profileData.work.role}
              </span>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-left space-y-4">
                 <div>
                    <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{profileData.personal.email}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Last Login</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Just now</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Account Status</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                       <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">Active & Secured</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-5 rounded-3xl">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Stats</h3>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Shield size={18} className="text-slate-400 dark:text-slate-500"/>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Security Score</span>
                 </div>
                 <span className="text-sm font-black text-slate-900 dark:text-white">98%</span>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Smartphone size={18} className="text-slate-400 dark:text-slate-500"/>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Sessions</span>
                 </div>
                 <span className="text-sm font-black text-slate-900 dark:text-white">{activeSessions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-slate-400 dark:text-slate-500"/>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Profile Completion</span>
                 </div>
                 <span className="text-sm font-black text-slate-900 dark:text-white">100%</span>
              </div>
           </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
           {/* Tabs */}
           <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-800 hide-scrollbar bg-slate-50/50 dark:bg-slate-800/40">
              {tabs.map((tab) => {
                 const Icon = tab.icon;
                 const isActive = activeTab === tab.id;
                 return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn("flex items-center gap-2 px-6 sm:px-8 py-4.5 text-sm font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer",
                           isActive 
                             ? "border-primary-600 text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-900" 
                             : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                        )}
                    >
                       <Icon size={18} />
                       {tab.label}
                    </button>
                 );
              })}
           </div>

           <div className="p-6 sm:p-8 flex-1 bg-white dark:bg-slate-900">
              <AnimatePresence mode="wait">
                 {/* PERSONAL INFO TAB */}
                 {activeTab === 'personal' && (
                    <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Full Name</label>
                              <input type="text" readOnly={!isEditing} value={profileData.personal.fullName} onChange={e => updateField('personal', 'fullName', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Email <span className="text-red-400">*</span></label>
                              <input type="email" readOnly={!isEditing} value={profileData.personal.email} onChange={e => updateField('personal', 'email', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Phone</label>
                              <PhoneInput name="phone" disabled={!isEditing} value={profileData.personal.phone} onChange={e => updateField('personal', 'phone', e.target.value)} className={cn(isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Gender</label>
                              <select disabled={!isEditing} value={profileData.personal.gender} onChange={e => updateField('personal', 'gender', e.target.value)} className={cn("input-field h-12 font-bold appearance-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")}>
                                 <option>Male</option>
                                 <option>Female</option>
                                 <option>Other</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Date of Birth</label>
                              <DatePicker readOnly={!isEditing} value={profileData.personal.dob} onChange={e => updateField('personal', 'dob', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Emergency Contact</label>
                              <input type="text" readOnly={!isEditing} value={profileData.personal.emergencyContact} onChange={e => updateField('personal', 'emergencyContact', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Address</label>
                              <input type="text" readOnly={!isEditing} value={profileData.personal.address} onChange={e => updateField('personal', 'address', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">City</label>
                              <input type="text" readOnly={!isEditing} value={profileData.personal.city} onChange={e => updateField('personal', 'city', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Country</label>
                              <input type="text" readOnly={!isEditing} value={profileData.personal.country} onChange={e => updateField('personal', 'country', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Bio</label>
                              <textarea readOnly={!isEditing} value={profileData.personal.bio} onChange={e => updateField('personal', 'bio', e.target.value)} rows="5" className={cn("input-field h-auto w-full p-4 rounded-2xl font-bold border transition-all text-sm resize-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                           </div>
                        </div>
                    </motion.div>
                 )}

                 {/* WORK INFO TAB */}
                 {activeTab === 'work' && (
                    <motion.div key="work" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Employee ID <span className="text-primary-600 dark:text-primary-400 ml-1">(Read-Only)</span></label>
                             <input type="text" readOnly value={profileData.work.employeeId} className="input-field h-12 font-bold bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Role <span className="text-primary-600 dark:text-primary-400 ml-1">(Read-Only)</span></label>
                             <input type="text" readOnly value={profileData.work.role} className="input-field h-12 font-bold bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Department</label>
                             <select disabled={!isEditing} value={profileData.work.department} onChange={e => updateField('work', 'department', e.target.value)} className={cn("input-field h-12 font-bold appearance-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")}>
                                <option>Engineering & IT</option>
                                <option>Human Resources</option>
                                <option>Finance</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Reporting To</label>
                             <input type="text" readOnly={!isEditing} value={profileData.work.reportingTo} onChange={e => updateField('work', 'reportingTo', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Joining Date</label>
                             <DatePicker readOnly={!isEditing} value={profileData.work.joiningDate} onChange={e => updateField('work', 'joiningDate', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Work Location</label>
                             <input type="text" readOnly={!isEditing} value={profileData.work.location} onChange={e => updateField('work', 'location', e.target.value)} className={cn("input-field h-12 font-bold", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Employment Type</label>
                             <select disabled={!isEditing} value={profileData.work.type} onChange={e => updateField('work', 'type', e.target.value)} className={cn("input-field h-12 font-bold appearance-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")}>
                                <option>Full-Time</option>
                                <option>Part-Time</option>
                                <option>Contract</option>
                             </select>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {/* SECURITY TAB */}
                 {activeTab === 'security' && (
                    <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                       
                       {/* Change Password */}
                       <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/60 pb-3">Change Password</h3>
                          <div className="grid grid-cols-1 gap-5 max-w-xl">
                             {['current', 'new', 'confirm'].map((field) => (
                                <div key={field} className="space-y-1.5">
                                   <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">
                                     {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm Password'}
                                   </label>
                                   <div className="relative">
                                      <input 
                                         type={showPassword[field] ? 'text' : 'password'} 
                                         value={passwords[field]}
                                         onChange={e => setPasswords({...passwords, [field]: e.target.value})}
                                         placeholder="••••••••"
                                         className="input-field h-11 font-medium pr-10"
                                      />
                                      <button 
                                         type="button" 
                                         onClick={() => setShowPassword({...showPassword, [field]: !showPassword[field]})}
                                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                                      >
                                         {showPassword[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                                      </button>
                                   </div>
                                </div>
                             ))}
                             <div>
                                <button 
                                   type="button"
                                   className="btn-primary w-full sm:w-auto mt-2" 
                                   disabled={isChangingPassword}
                                   onClick={async () => {
                                      if (!passwords.current || !passwords.new || !passwords.confirm) {
                                         showToast('Please fill in all password fields.', 'error');
                                         return;
                                      }
                                      if (passwords.new !== passwords.confirm) {
                                         showToast('Error: Passwords do not match.', 'error');
                                         return;
                                      }
                                      if (passwords.new.length < 6) {
                                         showToast('Password must be at least 6 characters.', 'error');
                                         return;
                                      }
                                      setIsChangingPassword(true);
                                      try {
                                         await authAPI.changePassword({
                                            currentPassword: passwords.current,
                                            newPassword: passwords.new,
                                            confirmPassword: passwords.confirm
                                         });
                                         showToast('Password updated securely.', 'success');
                                         setPasswords({ current: '', new: '', confirm: '' });
                                      } catch (err) {
                                         const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update password. Please verify current password.';
                                         showToast(msg, 'error');
                                      } finally {
                                         setIsChangingPassword(false);
                                      }
                                   }}
                                >
                                   <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                                </button>
                             </div>
                          </div>
                        </div>

                        {/* Security Controls */}
                        <div className="space-y-4">
                           <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Security Controls</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600" onClick={() => isEditing && updateField('security', 'twoFactor', !profileData.security.twoFactor)}>
                                 <div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Lock size={16}/> Two-Factor Auth </span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block">Enhance account security</span>
                                 </div>
                                 <div className={cn("w-12 h-6 rounded-full p-1 transition-colors", profileData.security.twoFactor ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-transform shadow-xs", profileData.security.twoFactor ? "translate-x-6" : "translate-x-0")} />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600" onClick={() => isEditing && updateField('security', 'loginAlerts', !profileData.security.loginAlerts)}>
                                 <div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle size={16}/> Login Alerts </span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block">Notify on new devices</span>
                                 </div>
                                 <div className={cn("w-12 h-6 rounded-full p-1 transition-colors", profileData.security.loginAlerts ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-transform shadow-xs", profileData.security.loginAlerts ? "translate-x-6" : "translate-x-0")} />
                                 </div>
                              </div>
                           </div>
                        </div>

                       {/* Active Sessions */}
                       <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Sessions</h3>
                          <div className="card border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-none">
                             <div className="hcm-table-container">
                                <table className="w-full text-left border-collapse hcm-table">
                                   <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 hcm-thead">
                                      <tr className="hcm-tr">
                                         <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hcm-th">Device</th>
                                         <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hcm-th">Location / IP</th>
                                         <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hcm-th">Last Active</th>
                                         <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right hcm-th">Action</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {activeSessions.map(session => (
                                         <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 hcm-td">
                                               <div className="flex items-center gap-3">
                                                  {session.device.includes('iPhone') ? <Smartphone size={18} className="text-slate-400"/> : <Globe size={18} className="text-slate-400"/>}
                                                  <div>
                                                     <p className="text-sm font-bold text-slate-900 dark:text-white">{session.device}</p>
                                                     <p className="text-xs text-slate-500 dark:text-slate-400">{session.browser}</p>
                                                  </div>
                                               </div>
                                            </td>
                                            <td className="px-6 py-4 hcm-td">
                                               <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{session.ip}</p>
                                            </td>
                                            <td className="px-6 py-4 hcm-td">
                                               <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg", session.lastActive === 'Current Session' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>{session.lastActive}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right hcm-td">
                                               {session.lastActive !== 'Current Session' && (
                                                  <button 
                                                     type="button" 
                                                     onClick={() => removeSession(session.id)}
                                                     className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                                     title="Logout Session"
                                                  >
                                                     <Trash2 size={16} />
                                                  </button>
                                               )}
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {/* PREFERENCES TAB */}
                 {activeTab === 'preferences' && (
                    <motion.div key="preferences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Language</label>
                             <select disabled={!isEditing} value={profileData.preferences.language} onChange={e => updateField('preferences', 'language', e.target.value)} className={cn("input-field h-12 font-bold appearance-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")}>
                                <option>English (US)</option>
                                <option>Spanish (ES)</option>
                                <option>French (FR)</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Timezone</label>
                             <select disabled={!isEditing} value={profileData.preferences.timezone} onChange={e => updateField('preferences', 'timezone', e.target.value)} className={cn("input-field h-12 font-bold appearance-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")}>
                                <option>UTC-08:00 (Pacific)</option>
                                <option>UTC-05:00 (Eastern)</option>
                                <option>UTC+00:00 (London)</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 form-label">Date Format</label>
                             <select disabled={!isEditing} value={profileData.preferences.dateFormat} onChange={e => updateField('preferences', 'dateFormat', e.target.value)} className={cn("input-field h-12 font-bold appearance-none", isEditing ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-600 dark:text-slate-400 cursor-default")}>
                                <option>MM/DD/YYYY</option>
                                <option>DD/MM/YYYY</option>
                                <option>YYYY-MM-DD</option>
                             </select>
                          </div>

                          <div className="md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                             <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Notification Settings</h3>
                             
                             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent dark:border-slate-800">
                                <div>
                                   <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email Notifications</span>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Receive alerts via email</p>
                                </div>
                                <input type="checkbox" disabled={!isEditing} checked={profileData.preferences.emailNotif} onChange={e => updateField('preferences', 'emailNotif', e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer disabled:cursor-default" />
                             </div>
                             
                             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent dark:border-slate-800">
                                <div>
                                   <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Push Notifications</span>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Receive real-time in-app alerts</p>
                                </div>
                                <input type="checkbox" disabled={!isEditing} checked={profileData.preferences.pushNotif} onChange={e => updateField('preferences', 'pushNotif', e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer disabled:cursor-default" />
                             </div>

                             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent dark:border-slate-800">
                                <div>
                                   <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Weekly Digest</span>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Receive weekly system health summaries</p>
                                </div>
                                <input type="checkbox" disabled={!isEditing} checked={profileData.preferences.weeklySummary} onChange={e => updateField('preferences', 'weeklySummary', e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer disabled:cursor-default" />
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;

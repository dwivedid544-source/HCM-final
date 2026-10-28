import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Briefcase,
  Camera,
  MapPin,
  Phone,
  Mail,
  Building,
  Clock,
  Activity,
  AlertTriangle,
  X,
  CheckCircle2,
  Edit3,
  Save,
  Trash2,
  Users,
  Target,
  FileText,
  ExternalLink,
  Loader2,
  Calendar,
  Heart
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { useManager } from '../../context/ManagerContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useDateFormat } from '../../hooks/useDateFormat';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import { uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import DatePicker from '../../shared/components/common/DatePicker';

import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';
import Avatar from '../../shared/components/ui/Avatar';
import EmptyState from '../../shared/components/ui/EmptyState';

const ManagerProfile = () => {
  const { getSymbol } = useCurrency();
  const { formatDate } = useDateFormat();
  const { user } = useAuth();
  const { profile, updateProfile, teamMembers = [], documents = [], uploadDoc, deleteDoc, showToast } = useManager();

  // Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = usePersistedTab('mgr_profile', 'personal');
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Data State
  const [profileData, setProfileData] = useState({
    personal: { fullName: '', email: '', phone: '', dob: '', gender: '', address: '', bio: '' },
    work: { employeeId: '', department: '', role: '', reportingTo: '', joiningDate: '', location: '' },
    teamScope: { teamSize: 0, directReports: 0, budget: `${getSymbol()}250,000 / Quarter`, projectsActive: 4 },
    emergency: { contactName: '', relation: '', phone: '' }
  });

  // Sync DB profile to state
  useEffect(() => {
    if (profile) {
      setProfileData({
        personal: {
          fullName: profile.fullName || user?.name || '',
          email: profile.user?.email || user?.email || '',
          phone: profile.phone || '',
          dob: profile.dob ? profile.dob.split('T')[0] : '',
          gender: profile.gender || 'Male',
          address: profile.address || '',
          bio: profile.bio || 'Regional Manager focus on team growth and sustainable results.',
          avatarUrl: profile.avatarUrl || ''
        },
        work: {
          employeeId: profile.employeeId || 'MGR-1001',
          department: profile.department?.name || 'Operations',
          role: profile.user?.role || 'MANAGER',
          reportingTo: profile.manager?.fullName || 'VP of Operations',
          joiningDate: profile.joiningDate ? profile.joiningDate.split('T')[0] : '2023-01-15',
          location: 'HQ Campus'
        },
        teamScope: {
          teamSize: teamMembers.length || 1,
          directReports: teamMembers.length || 1,
          budget: `${getSymbol()}250,000 / Quarter`,
          projectsActive: 4
        },
        emergency: {
          contactName: profile.emergencyName || '',
          relation: profile.emergencyRelation || '',
          phone: profile.emergencyPhone || ''
        }
      });
      setAvatarPreview(profile.avatarUrl || '');
    }
  }, [profile, user, teamMembers, getSymbol]);

  // Handlers
  const handleSave = async () => {
    if (!profileData.personal.fullName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    try {
      setSaving(true);
      const updatePayload = {
        fullName: profileData.personal.fullName.trim(),
        phone: profileData.personal.phone,
        dob: profileData.personal.dob || null,
        gender: profileData.personal.gender,
        address: profileData.personal.address,
        bio: profileData.personal.bio,
        emergencyName: profileData.emergency.contactName,
        emergencyRelation: profileData.emergency.relation,
        emergencyPhone: profileData.emergency.phone
      };

      if (avatarPreview && avatarPreview !== profile?.avatarUrl) {
        updatePayload.avatarUrl = avatarPreview;
      } else if (avatarPreview === '') {
        updatePayload.avatarUrl = null;
      }

      await updateProfile(updatePayload);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Failed to save profile changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['png', 'jpg', 'jpeg', 'gif', 'webp'], 5);
    if (!v.isValid) {
      showToast(v.message, 'error');
      return;
    }
    try {
      const response = await uploadAPI.uploadImage(file, 'hcm/avatars');
      const cloudUrl = response.data?.data?.url;
      if (cloudUrl) {
        setAvatarPreview(cloudUrl);
        updateField('personal', 'avatarUrl', cloudUrl);
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error('Cloud avatar upload failed, using base64 fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        updateField('personal', 'avatarUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'], 10);
    if (!v.isValid) {
      showToast(v.message, 'error');
      return;
    }
    try {
      const response = await uploadAPI.uploadDocument(file, 'hcm/documents');
      const cloudUrl = response.data?.data?.url;
      if (cloudUrl) {
        uploadDoc({
          name: file.name,
          category: 'Document',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileBase64: cloudUrl
        });
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error('Cloud doc upload failed, using base64 fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        uploadDoc({
          name: file.name,
          category: 'Document',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileBase64: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Updaters
  const updateField = (category, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const inputClass = isEditing
    ? 'w-full p-3 bg-white dark:bg-slate-900 border border-primary-500 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all'
    : 'w-full p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-default';

  const textareaClass = isEditing
    ? 'w-full p-3 bg-white dark:bg-slate-900 border border-primary-500 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none'
    : 'w-full p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-default resize-none';

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'work', label: 'Work Info', icon: Briefcase },
    { id: 'team', label: 'Team Scope', icon: Users },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Manager Profile"
        subtitle="Manage your team leadership identity and records"
      >
        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Edit3}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={X}
                isDisabled={saving}
                onClick={() => {
                  setIsEditing(false);
                  if (profile) {
                    setAvatarPreview(profile.avatarUrl || '');
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Save}
                isLoading={saving}
                isDisabled={saving}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Profile Card & Quick Recap */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Identity Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary-100 dark:ring-primary-950/50 mx-auto relative group">
                <Avatar
                  name={profileData.personal.fullName || 'Manager'}
                  src={avatarPreview}
                  size="xl"
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-xs">
                    <Camera size={22} />
                    <span className="text-[10px] font-bold mt-1">Upload</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {isEditing && avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview('');
                    updateField('personal', 'avatarUrl', null);
                  }}
                  className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-sm hover:bg-rose-600 transition-colors"
                  title="Remove avatar"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {profileData.personal.fullName || 'Manager Name'}
              </h3>
              <div className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 border border-primary-100 dark:border-primary-900/40">
                {profileData.work.role || 'MANAGER'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email
                </p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {profileData.personal.email || 'manager@hcm.ai'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Last Login
                </p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  Just now
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Account Status
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Recap Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Quick Recap
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <Users size={16} className="text-primary-500" />
                  <span>Team Members</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                  {profileData.teamScope.teamSize}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <Target size={16} className="text-amber-500" />
                  <span>Active Goals</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                  {profileData.teamScope.projectsActive}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs & Form Fields */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs Nav */}
          <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1.5 gap-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Icon size={16} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* PERSONAL INFO TAB */}
              {activeTab === 'personal' && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        readOnly={!isEditing}
                        value={profileData.personal.fullName}
                        onChange={(e) => updateField('personal', 'fullName', e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={profileData.personal.email}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <PhoneInput
                        name="phone"
                        disabled={!isEditing}
                        value={profileData.personal.phone}
                        onChange={(e) => updateField('personal', 'phone', e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Gender
                      </label>
                      <select
                        disabled={!isEditing}
                        value={profileData.personal.gender}
                        onChange={(e) => updateField('personal', 'gender', e.target.value)}
                        className={cn(inputClass, 'appearance-none')}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Date of Birth
                      </label>
                      <DatePicker
                        readOnly={!isEditing}
                        value={profileData.personal.dob}
                        onChange={(e) => updateField('personal', 'dob', e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Address
                      </label>
                      <input
                        type="text"
                        readOnly={!isEditing}
                        value={profileData.personal.address}
                        onChange={(e) => updateField('personal', 'address', e.target.value)}
                        placeholder="Enter location / street address..."
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Bio / Summary
                      </label>
                      <textarea
                        rows={3}
                        readOnly={!isEditing}
                        value={profileData.personal.bio}
                        onChange={(e) => updateField('personal', 'bio', e.target.value)}
                        placeholder="Write a brief professional summary..."
                        className={textareaClass}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* WORK INFO TAB */}
              {activeTab === 'work' && (
                <motion.div
                  key="work"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Employee / Manager ID</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.work.employeeId}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Role</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.work.role}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Department</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.work.department}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Reporting To</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.work.reportingTo}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Joining Date</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.work.joiningDate ? formatDate(profileData.work.joiningDate) : 'N/A'}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Work Location</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.work.location}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TEAM SCOPE TAB */}
              {activeTab === 'team' && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Team Size</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={profileData.teamScope.teamSize}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Direct Reports</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={profileData.teamScope.directReports}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Quarterly Budget</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={profileData.teamScope.budget}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Active Goals / Projects</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={profileData.teamScope.projectsActive}
                        className="w-full p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EMERGENCY TAB */}
              {activeTab === 'emergency' && (
                <motion.div
                  key="emergency"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        readOnly={!isEditing}
                        value={profileData.emergency.contactName}
                        onChange={(e) => updateField('emergency', 'contactName', e.target.value)}
                        placeholder="Name of emergency contact..."
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Relationship
                      </label>
                      <input
                        type="text"
                        readOnly={!isEditing}
                        value={profileData.emergency.relation}
                        onChange={(e) => updateField('emergency', 'relation', e.target.value)}
                        placeholder="e.g. Spouse, Parent, Sibling..."
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Emergency Contact Phone
                      </label>
                      <PhoneInput
                        name="emergencyPhone"
                        disabled={!isEditing}
                        value={profileData.emergency.phone}
                        onChange={(e) => updateField('emergency', 'phone', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Employment Records
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage your leadership certifications, contracts and IDs
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={docInputRef}
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={FileText}
                      onClick={() => docInputRef.current?.click()}
                    >
                      Upload Document
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {documents.map((doc, i) => (
                      <div
                        key={doc.id || i}
                        className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:border-primary-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-primary-600 dark:text-primary-400 shadow-xs">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {doc.name || 'Untitled Document'}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                              {doc.category || 'Document'} • {doc.createdAt ? formatDate(doc.createdAt) : 'Recent'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-slate-500 hover:text-primary-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Document"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteDoc(doc.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {documents.length === 0 && (
                      <EmptyState
                        icon={FileText}
                        title="No Documents Uploaded"
                        description="Click Upload Document to add your employment records or identity proofs."
                      />
                    )}
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

export default ManagerProfile;

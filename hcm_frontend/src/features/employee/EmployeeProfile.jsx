import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Briefcase, ShieldCheck, FolderLock, 
  Edit2, X, Building2, CheckCircle2, Camera, Plus, Trash2, Download, Eye, FileText, 
  Loader2, AlertCircle, RefreshCw, Upload, Check, Calendar, ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import { employeeService } from '../../services/employee.service';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import CenterModal from '../../shared/components/layout/CenterModal';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import DatePicker from '../../shared/components/common/DatePicker';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';

const EmployeeProfile = () => {
  const { showToast } = useEmployee();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = usePersistedTab('emp_profile_tab', 'personal');

  // Core profile & documents state
  const [profileData, setProfileData] = useState(null);
  const [documentsList, setDocumentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Profile Modal state & sub-tab
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState('work');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O-',
    address: '',
    avatarUrl: null,
    employeeId: '',
    department: '',
    role: '',
    joiningDate: '',
    managerName: '',
    employmentType: 'Full-time',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: ''
  });
  const avatarInputRef = useRef(null);

  // Document Upload Modal state
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('ID Proof');
  const [newDocFile, setNewDocFile] = useState(null);
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocSize, setNewDocSize] = useState('');
  const [documentCategoryFilter, setDocumentCategoryFilter] = useState('All');
  const [previewDoc, setPreviewDoc] = useState(null);
  const docFileInputRef = useRef(null);

  // Fetch Profile & Documents dynamically
  const fetchProfileAndDocs = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      setError(null);
      const [profileRes, docsRes] = await Promise.all([
        employeeService.getProfile(),
        employeeService.getDocuments().catch(() => ({ data: { data: [] } }))
      ]);

      const prof = profileRes.data?.data || profileRes.data;
      const docs = docsRes.data?.data || docsRes.data || [];

      setProfileData(prof);
      setDocumentsList(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Error loading employee profile:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load profile');
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndDocs(true);
  }, [fetchProfileAndDocs]);

  // Open Edit Profile Modal populated with current values
  const handleOpenEditModal = useCallback((targetTab = null) => {
    if (!profileData) return;
    setEditForm({
      fullName: profileData.fullName || '',
      phone: profileData.phone || '',
      dob: profileData.dob ? String(profileData.dob).slice(0, 10) : '',
      gender: profileData.gender || 'Male',
      bloodGroup: profileData.bloodGroup || 'O-',
      address: profileData.address || '',
      avatarUrl: profileData.avatarUrl || profileData.avatar || null,
      employeeId: profileData.employeeId || '',
      department: profileData.department?.name || profileData.departmentName || profileData.department || '',
      role: profileData.designation || profileData.user?.role || '',
      joiningDate: profileData.joiningDate ? String(profileData.joiningDate).slice(0, 10) : '',
      managerName: profileData.manager?.fullName || profileData.managerName || '',
      employmentType: profileData.employmentType || 'Full-time',
      emergencyName: profileData.emergencyName || profileData.emergencyContact?.name || '',
      emergencyRelation: profileData.emergencyRelation || profileData.emergencyContact?.relation || '',
      emergencyPhone: profileData.emergencyPhone || profileData.emergencyContact?.phone || ''
    });

    if (targetTab) {
      setEditModalTab(targetTab);
    } else if (activeTab === 'work') {
      setEditModalTab('work');
    } else if (activeTab === 'emergency') {
      setEditModalTab('emergency');
    } else {
      setEditModalTab('personal');
    }

    setIsEditModalOpen(true);
  }, [profileData, activeTab]);

  // Removed redundant useEffect to prevent tab-switching race condition

  // Optional ?edit=true or ?edit=work query trigger on mount/load
  const hasTriggeredInitialEdit = useRef(false);
  useEffect(() => {
    if (!profileData || hasTriggeredInitialEdit.current) return;
    const editParam = searchParams.get('edit');
    if (editParam === 'true' || editParam === 'work' || editParam === 'personal' || editParam === 'emergency') {
      hasTriggeredInitialEdit.current = true;
      handleOpenEditModal(editParam === 'true' ? (searchParams.get('tab') || 'work') : editParam);
    }
  }, [profileData, searchParams, handleOpenEditModal]);

  // Avatar file selection in Edit Modal
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatarImage = () => {
    setEditForm(prev => ({ ...prev, avatarUrl: null }));
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // Submit Profile Updates: PUT /employee/profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      let parsedDob = editForm.dob;
      if (editForm.dob) {
        const d = new Date(editForm.dob);
        if (!isNaN(d.getTime())) {
          parsedDob = d.toISOString();
        }
      }

      let parsedJoiningDate = editForm.joiningDate;
      if (editForm.joiningDate) {
        const d = new Date(editForm.joiningDate);
        if (!isNaN(d.getTime())) {
          parsedJoiningDate = d.toISOString();
        }
      }

      const payload = {
        fullName: editForm.fullName,
        phone: editForm.phone,
        dob: parsedDob,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        address: editForm.address,
        avatarUrl: editForm.avatarUrl,
        employeeId: editForm.employeeId,
        department: editForm.department,
        role: editForm.role,
        joiningDate: parsedJoiningDate,
        managerName: editForm.managerName,
        employmentType: editForm.employmentType,
        emergencyName: editForm.emergencyName,
        emergencyRelation: editForm.emergencyRelation,
        emergencyPhone: editForm.emergencyPhone,
        emergencyContact: {
          name: editForm.emergencyName,
          relation: editForm.emergencyRelation,
          phone: editForm.emergencyPhone
        }
      };

      const res = await employeeService.updateProfile(payload);
      const updatedProfile = res.data?.data || res.data;
      if (updatedProfile) {
        setProfileData(updatedProfile);
      }
      showToast('Profile information updated successfully!', 'success');
      setIsEditModalOpen(false);
      await fetchProfileAndDocs(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast(err.response?.data?.error?.message || err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Document file selection for upload
  const handleDocFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Document size must be under 10MB', 'error');
      return;
    }
    setNewDocFile(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setNewDocSize(sizeInMb > 0.1 ? `${sizeInMb} MB` : `${(file.size / 1024).toFixed(0)} KB`);
    if (!newDocName) {
      setNewDocName(file.name);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewDocContent(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Document Upload: POST /employee/documents with progress tracking
  const handleUploadDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!newDocFile && !newDocContent) {
      showToast('Please select a document file to upload', 'error');
      return;
    }

    setIsUploadingDoc(true);
    setUploadProgress(20);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
    }, 200);

    try {
      const payload = {
        name: newDocName || newDocFile?.name || 'Document.pdf',
        category: newDocCategory,
        size: newDocSize || '1.0 MB',
        fileBase64: newDocContent,
        content: newDocContent
      };

      await employeeService.uploadDocument(payload);
      clearInterval(progressInterval);
      setUploadProgress(100);

      await new Promise(r => setTimeout(r, 350));
      showToast('Document uploaded successfully!', 'success');
      setNewDocName('');
      setNewDocCategory('ID Proof');
      setNewDocFile(null);
      setNewDocContent('');
      setNewDocSize('');
      if (docFileInputRef.current) docFileInputRef.current.value = '';
      setIsUploadDocModalOpen(false);
      await fetchProfileAndDocs(false);
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Failed to upload document:', err);
      showToast(err.response?.data?.error?.message || err.message || 'Failed to upload document', 'error');
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress(0);
    }
  };

  // Delete document
  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await employeeService.deleteDocument(id);
      showToast('Document deleted successfully', 'success');
      await fetchProfileAndDocs(false);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete document', 'error');
    }
  };

  // Download document
  const handleDownloadDoc = (doc) => {
    if (!doc) return;
    if (doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://'))) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Download started');
      return;
    }
    if (doc.content && doc.content.startsWith('data:')) {
      const parts = doc.content.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const file = new Blob([uInt8Array], { type: contentType });
      const element = document.createElement('a');
      element.href = URL.createObjectURL(file);
      element.download = doc.name || 'document.pdf';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('Download started');
    } else {
      showToast('Unable to download this document format', 'error');
    }
  };

  // Date formatter (DD/MM/YYYY)
  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return 'Not Specified';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Initials generator
  const getInitials = (name) => {
    if (!name) return 'EM';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Tabs definition matching user screenshot
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'work', label: 'Work Details', icon: Briefcase },
    { id: 'emergency', label: 'Emergency Contacts', icon: ShieldCheck },
    { id: 'documents', label: 'Documents', icon: FolderLock },
  ];

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    if (documentCategoryFilter === 'All') return documentsList;
    return documentsList.filter(d => (d.category || '').toLowerCase() === documentCategoryFilter.toLowerCase());
  }, [documentsList, documentCategoryFilter]);

  // 1. Error State with Retry
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm max-w-5xl mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 mb-2">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-950 dark:text-white">Failed to Load Profile</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button 
          onClick={() => fetchProfileAndDocs(true)}
          variant="primary"
          leftIcon={RefreshCw}
          className="mt-4"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (loading || !profileData) {
    return (
      <div className="space-y-8 pb-12 animate-pulse px-4 sm:px-0 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="w-36 h-36 rounded-[2rem] bg-slate-200 dark:bg-slate-800 mx-auto" />
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
            <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
            <div className="flex justify-center gap-2 pt-2">
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800" />
            <div className="h-96 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc = profileData.avatarUrl || profileData.avatar;
  const userRole = profileData.designation || profileData.user?.role || 'EMPLOYEE';
  const departmentName = profileData.department?.name || profileData.departmentName || profileData.department || 'Operations';
  const employeeCode = profileData.employeeId || 'EMP-001';
  const userEmail = profileData.user?.email || profileData.email || 'employee@hcm.ai';
  const residentialAddress = profileData.address || 'Address not specified';

  return (
    <div className="space-y-8 pb-12 animate-fade-in focus:outline-none px-4 sm:px-0 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal and professional identity"
      >
        <Button 
          type="button"
          onClick={() => handleOpenEditModal(activeTab)}
          variant="primary"
          leftIcon={Edit2}
        >
          Edit Profile
        </Button>
      </PageHeader>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Card: Employee Identity Card (Exact UI Style from Screenshot) */}
        <div className="lg:col-span-4 w-full bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
           
           {/* Avatar with Status Badge */}
           <div className="relative inline-block mb-5">
              <div className="w-36 h-36 rounded-[2rem] bg-indigo-600 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative">
                {avatarSrc && !avatarSrc.includes('ui-avatars.com') ? (
                  <img 
                    src={avatarSrc} 
                    alt="Employee" 
                    className="w-full h-full object-cover rounded-[1.75rem]" 
                  />
                ) : (
                  <span className="text-4xl font-black text-white tracking-widest">
                    {getInitials(profileData.fullName)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 text-white rounded-2xl flex items-center justify-center border-3 border-white dark:border-slate-900 shadow-md">
                 <CheckCircle2 size={18} />
              </div>
           </div>

           {/* Name & Role */}
           <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
             {profileData.fullName || 'Employee'}
           </h3>
           <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider mt-1.5">
             {userRole}
           </p>

           {/* Department & Employee ID Badges */}
           <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="px-3.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-slate-200/60 dark:border-slate-700">
                {departmentName}
              </span>
              <span className="px-3.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                {employeeCode}
              </span>
           </div>

           {/* Quick Contact Rows */}
           <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/80 space-y-4 text-left">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                 <Mail size={16} className="text-slate-400 shrink-0" />
                 <span className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{userEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                 <MapPin size={16} className="text-slate-400 shrink-0" />
                 <span className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{residentialAddress}</span>
              </div>
           </div>
        </div>

        {/* Right Area: Tabs & Data Sections */}
        <div className="lg:col-span-8 w-full space-y-6">
           
           {/* Section Tabs Pill Header */}
           <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto">
              {tabs.map((tab) => (
                 <button
                   key={tab.id}
                   type="button"
                   onClick={() => setActiveTab(tab.id)}
                   className={cn(
                     "flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
                     activeTab === tab.id 
                       ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-slate-900/10" 
                       : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
                   )}
                 >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                 </button>
              ))}
           </div>

           {/* Details Panel Card */}
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[520px] text-left">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 8 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -8 }}
                   transition={{ duration: 0.15 }}
                 >
                    {/* Tab 1: Personal Data */}
                    {activeTab === 'personal' && (
                       <div className="space-y-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 border-l-4 border-indigo-600 pl-3 leading-none">
                               Personal Data
                             </h3>
                             <Button 
                               type="button"
                               onClick={() => handleOpenEditModal('personal')}
                               variant="ghost"
                               size="sm"
                               leftIcon={Edit2}
                             >
                                Edit Personal Info
                             </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Full Name</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{profileData.fullName || 'Not specified'}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Email Address</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{userEmail}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{profileData.phone || 'Not specified'}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{formatDisplayDate(profileData.dob)}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Blood Group</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{profileData.bloodGroup || 'Not specified'}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Gender</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{profileData.gender || 'Not specified'}</p>
                             </div>

                             <div className="md:col-span-2 pt-2">
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Residential Address</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{residentialAddress}</p>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Tab 2: Work Details */}
                    {activeTab === 'work' && (
                       <div className="space-y-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 border-l-4 border-indigo-600 pl-3 leading-none">
                               Work Details
                             </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Employee ID</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{employeeCode}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Department</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{departmentName}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Designation</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{userRole}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Joining Date</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{formatDisplayDate(profileData.joiningDate)}</p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Manager</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                  {profileData.manager?.fullName || profileData.managerName || 'Direct to Leadership'}
                                </p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Employment Type</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{profileData.employmentType || 'Full-time'}</p>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Tab 3: Emergency Contacts */}
                    {activeTab === 'emergency' && (
                       <div className="space-y-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 border-l-4 border-indigo-600 pl-3 leading-none">
                               Emergency Contacts
                             </h3>
                             <Button 
                               type="button"
                               onClick={() => handleOpenEditModal('emergency')}
                               variant="ghost"
                               size="sm"
                               leftIcon={Edit2}
                             >
                                Edit Emergency Contacts
                             </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Contact Name</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                  {profileData.emergencyName || profileData.emergencyContact?.name || 'Not Specified'}
                                </p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Relation</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                  {profileData.emergencyRelation || profileData.emergencyContact?.relation || 'Not Specified'}
                                </p>
                             </div>

                             <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                  {profileData.emergencyPhone || profileData.emergencyContact?.phone || 'Not Specified'}
                                </p>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Tab 4: Documents (ID Proof, Certificates, Contracts) */}
                    {activeTab === 'documents' && (
                       <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 border-l-4 border-indigo-600 pl-3 leading-none">
                               Employee Documents
                             </h3>
                             <Button 
                               type="button"
                               onClick={() => setIsUploadDocModalOpen(true)}
                               variant="primary"
                               size="sm"
                               leftIcon={Plus}
                             >
                                Upload Document
                             </Button>
                          </div>

                          {/* Category Filter Tabs */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                             {['All', 'ID Proof', 'Certificates', 'Contracts'].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setDocumentCategoryFilter(cat)}
                                  className={cn(
                                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                                    documentCategoryFilter === cat 
                                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                                  )}
                                >
                                   {cat}
                                </button>
                             ))}
                          </div>

                          {/* Document List or Empty State */}
                          {filteredDocuments.length === 0 ? (
                             <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                                <EmptyState
                                  icon={FolderLock}
                                  title={`No ${documentCategoryFilter !== 'All' ? documentCategoryFilter : ''} documents found`}
                                  message="Upload official employee records such as ID Proof, Certificates, and Contracts for verification."
                                  action={{
                                    label: "Upload Document",
                                    onClick: () => {
                                      if (documentCategoryFilter !== 'All') setNewDocCategory(documentCategoryFilter);
                                      setIsUploadDocModalOpen(true);
                                    },
                                    icon: Plus
                                  }}
                                />
                             </div>
                          ) : (
                             <div className="grid grid-cols-1 gap-4">
                                {filteredDocuments.map((doc) => (
                                   <div 
                                     key={doc.id}
                                     className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                   >
                                      <div className="flex items-center gap-4 truncate">
                                         <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
                                            <FileText size={22} />
                                         </div>
                                         <div className="truncate">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                                            <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                                               <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                                                 {doc.category || 'Document'}
                                               </span>
                                               <span>•</span>
                                               <span>{doc.size || '1.0 MB'}</span>
                                               <span>•</span>
                                               <span>{doc.date || 'Recent'}</span>
                                            </p>
                                         </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-center">
                                         {doc.url && (
                                            <button 
                                              type="button"
                                              onClick={() => setPreviewDoc(doc)}
                                              title="Preview Document"
                                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                               <Eye size={18} />
                                            </button>
                                         )}
                                         <button 
                                           type="button"
                                           onClick={() => handleDownloadDoc(doc)}
                                           title="Download Document"
                                           className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                         >
                                            <Download size={18} />
                                         </button>
                                         <button 
                                           type="button"
                                           onClick={() => handleDeleteDocument(doc.id)}
                                           title="Delete Document"
                                           className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                         >
                                            <Trash2 size={18} />
                                         </button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Edit Profile Modal (PUT /employee/profile) with Tabs */}
      <CenterModal 
        isOpen={isEditModalOpen} 
        onClose={() => !isSavingProfile && setIsEditModalOpen(false)} 
        title="Edit Profile Information"
      >
         {/* Sub-tab Navigation inside Edit Modal */}
         <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-6 pt-2 pb-3 overflow-x-auto">
            <Button
              type="button"
              onClick={() => setEditModalTab('personal')}
              variant={editModalTab === 'personal' ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={User}
            >
              Personal Info
            </Button>
            <Button
              type="button"
              onClick={() => setEditModalTab('work')}
              variant={editModalTab === 'work' ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={Briefcase}
            >
              Work Details
            </Button>
            <Button
              type="button"
              onClick={() => setEditModalTab('emergency')}
              variant={editModalTab === 'emergency' ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={ShieldCheck}
            >
              Emergency Contacts
            </Button>
         </div>

         <form onSubmit={handleSaveProfile} className="space-y-6 p-6 text-left max-h-[70vh] overflow-y-auto">
            {/* 1. Personal Information Tab in Modal */}
            {editModalTab === 'personal' && (
               <div className="space-y-5">
                  {/* Profile Avatar Upload */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profile Image</label>
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 overflow-hidden flex items-center justify-center text-white font-black text-xl border-2 border-white shadow-md shrink-0">
                           {editForm.avatarUrl ? (
                              <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                           ) : (
                              <span>{getInitials(editForm.fullName || profileData.fullName)}</span>
                           )}
                        </div>
                        <div className="flex items-center gap-3">
                           <input 
                             type="file" 
                             ref={avatarInputRef}
                             accept="image/*"
                             onChange={handleAvatarFileSelect}
                             className="hidden" 
                           />
                           <Button
                             type="button"
                             onClick={() => avatarInputRef.current?.click()}
                             variant="secondary"
                             size="sm"
                             leftIcon={Camera}
                           >
                              Change Photo
                           </Button>
                           {editForm.avatarUrl && (
                              <Button
                                type="button"
                                onClick={handleRemoveAvatarImage}
                                variant="ghost"
                                size="sm"
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              >
                                Remove
                              </Button>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                        <input 
                          type="text"
                          value={editForm.fullName}
                          onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="e.g. Bob Marley"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                        <PhoneInput 
                          name="phone"
                          value={editForm.phone}
                          onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Birth</label>
                        <DatePicker 
                          value={editForm.dob}
                          onChange={e => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</label>
                        <select
                          value={editForm.gender}
                          onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Other">Other</option>
                        </select>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Group</label>
                        <select
                          value={editForm.bloodGroup}
                          onChange={e => setEditForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                           <option value="A+">A+</option>
                           <option value="A-">A-</option>
                           <option value="B+">B+</option>
                           <option value="B-">B-</option>
                           <option value="AB+">AB+</option>
                           <option value="AB-">AB-</option>
                           <option value="O+">O+</option>
                           <option value="O-">O-</option>
                        </select>
                     </div>

                     <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Residential Address</label>
                        <textarea 
                          rows="2"
                          value={editForm.address}
                          onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter your residential address..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>
                  </div>
               </div>
            )}

            {/* 2. Work Details Tab in Modal */}
            {editModalTab === 'work' && (
               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee ID</label>
                        <input 
                          type="text"
                          value={editForm.employeeId}
                          onChange={e => setEditForm(prev => ({ ...prev, employeeId: e.target.value }))}
                          placeholder="e.g. EMP-004"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
                        <input 
                          type="text"
                          list="profile-department-options"
                          value={editForm.department}
                          onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="e.g. Engineering"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <datalist id="profile-department-options">
                           <option value="Engineering" />
                           <option value="Human Resources" />
                           <option value="Product & Design" />
                           <option value="Operations" />
                           <option value="Marketing" />
                           <option value="Finance" />
                           <option value="Management" />
                        </datalist>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation / Role</label>
                        <input 
                          type="text"
                          value={editForm.role}
                          onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Joining Date</label>
                        <DatePicker 
                          value={editForm.joiningDate}
                          onChange={e => setEditForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reporting Manager</label>
                        <input 
                          type="text"
                          list="profile-manager-options"
                          value={editForm.managerName}
                          onChange={e => setEditForm(prev => ({ ...prev, managerName: e.target.value }))}
                          placeholder="e.g. Deo John"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <datalist id="profile-manager-options">
                           <option value="Deo John" />
                           <option value="Alice Cooper" />
                           <option value="Sarah Connor" />
                           <option value="Bob Marley" />
                        </datalist>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employment Type</label>
                        <select
                          value={editForm.employmentType}
                          onChange={e => setEditForm(prev => ({ ...prev, employmentType: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                           <option value="Full-time">Full-time</option>
                           <option value="Part-time">Part-time</option>
                           <option value="Contract">Contract</option>
                           <option value="Intern">Intern</option>
                           <option value="Probation">Probation</option>
                        </select>
                     </div>
                  </div>
               </div>
            )}

            {/* 3. Emergency Contacts Tab in Modal */}
            {editModalTab === 'emergency' && (
               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Name</label>
                        <input 
                          type="text"
                          value={editForm.emergencyName}
                          onChange={e => setEditForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                          placeholder="e.g. Jane Marley"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Relationship</label>
                        <input 
                          type="text"
                          value={editForm.emergencyRelation}
                          onChange={e => setEditForm(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                          placeholder="e.g. Spouse / Parent / Sibling"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                     </div>

                     <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Emergency Phone</label>
                        <PhoneInput 
                          name="emergencyPhone"
                          value={editForm.emergencyPhone}
                          onChange={e => setEditForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        />
                     </div>
                  </div>
               </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
               <Button 
                 type="button"
                 isDisabled={isSavingProfile}
                 onClick={() => setIsEditModalOpen(false)}
                 variant="secondary"
               >
                 Cancel
               </Button>
               <Button 
                 type="submit"
                 isDisabled={isSavingProfile}
                 isLoading={isSavingProfile}
                 variant="primary"
               >
                  Save Changes
               </Button>
            </div>
         </form>
      </CenterModal>

      {/* Upload Document Modal (POST /employee/documents with Upload Progress) */}
      <CenterModal 
        isOpen={isUploadDocModalOpen}
        onClose={() => !isUploadingDoc && setIsUploadDocModalOpen(false)}
        title="Upload Official Document"
      >
         <form onSubmit={handleUploadDocumentSubmit} className="space-y-6 p-6 text-left">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Name</label>
               <input 
                 type="text"
                 value={newDocName}
                 onChange={e => setNewDocName(e.target.value)}
                 placeholder="e.g. National_ID_Card.pdf"
                 required
                 disabled={isUploadingDoc}
                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Category</label>
               <select 
                 value={newDocCategory}
                 onChange={e => setNewDocCategory(e.target.value)}
                 disabled={isUploadingDoc}
                 className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               >
                  <option value="ID Proof">ID Proof</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Contracts">Contracts</option>
               </select>
            </div>

            {/* File Dropzone */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Document File</label>
               <input 
                 type="file" 
                 ref={docFileInputRef}
                 accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                 onChange={handleDocFileSelect}
                 className="hidden" 
                 disabled={isUploadingDoc}
               />
               <div 
                 onClick={() => !isUploadingDoc && docFileInputRef.current?.click()}
                 className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
               >
                  <Upload size={28} className="mx-auto text-slate-400 mb-2" />
                  {newDocFile ? (
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-indigo-600 truncate">{newDocFile.name}</p>
                        <p className="text-xs text-slate-400 font-mono">({newDocSize})</p>
                     </div>
                  ) : (
                     <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to choose a file</p>
                        <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX, PNG or JPG up to 10MB</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploadingDoc && (
               <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                     <span>Uploading to secure vault...</span>
                     <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-[1px]">
                     <div 
                       className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                       style={{ width: `${uploadProgress}%` }}
                     />
                  </div>
               </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
               <Button 
                 type="button"
                 isDisabled={isUploadingDoc}
                 onClick={() => setIsUploadDocModalOpen(false)}
                 variant="secondary"
               >
                 Cancel
               </Button>
               <Button 
                 type="submit"
                 isDisabled={isUploadingDoc || (!newDocFile && !newDocContent)}
                 isLoading={isUploadingDoc}
                 variant="primary"
               >
                  Upload Document
               </Button>
            </div>
         </form>
      </CenterModal>

      {/* Preview Document Modal */}
      <CenterModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name || 'Document Preview'}
      >
         <div className="p-6 space-y-4 text-left">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
               <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{previewDoc?.name}</p>
                  <p className="text-xs text-slate-400 font-bold">{previewDoc?.category} • {previewDoc?.size}</p>
               </div>
               <Button
                 type="button"
                 onClick={() => handleDownloadDoc(previewDoc)}
                 variant="primary"
                 size="sm"
                 leftIcon={Download}
               >
                  Download
               </Button>
            </div>
            <div className="h-[450px] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800">
               {previewDoc?.url?.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || previewDoc?.content?.startsWith('data:image') ? (
                  <img src={previewDoc?.url || previewDoc?.content} alt="Preview" className="max-h-full max-w-full object-contain" />
               ) : previewDoc?.url ? (
                  <iframe src={previewDoc.url} className="w-full h-full" title="Document Preview" />
               ) : (
                  <div className="text-center p-6 text-slate-400">
                     <FileText size={48} className="mx-auto mb-2 opacity-50" />
                     <p className="text-sm font-bold">Preview not available for this file type</p>
                     <p className="text-xs mt-1">Please use the download button to view the file locally.</p>
                  </div>
               )}
            </div>
         </div>
      </CenterModal>
    </div>
  );
};

export default EmployeeProfile;

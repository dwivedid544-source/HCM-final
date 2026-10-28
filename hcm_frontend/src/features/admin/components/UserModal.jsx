import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  Mail,
  ShieldCheck,
  Briefcase,
  Phone,
  Calendar,
  Camera,
  ChevronRight,
  User,
  Lock,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  Building2,
  UserCog,
  FileText,
  Activity,
  AlertCircle,
  Eye,
  EyeOff,
  Hash,
  Globe,
  Shield,
  Star,
  Zap,
  RefreshCw,
  Send
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

// ──────────────────────────────────────────
// Reusable field components
// ──────────────────────────────────────────
const inputCls = (error) => cn(
  'w-full h-11 px-4 rounded-xl border text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400',
  'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
  'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all',
  'hover:border-slate-300 dark:hover:border-slate-600',
  error && 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20'
);

const selectCls = (error) => cn(
  'w-full h-11 px-4 pr-10 rounded-xl border text-sm font-medium text-slate-800 dark:text-slate-200 appearance-none',
  'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
  'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all',
  'hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer',
  error && 'border-rose-400'
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-0.5">
    {children}
    {required && <span className="text-rose-500 ml-1">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-[10px] font-bold text-rose-500 mt-1 px-0.5 flex items-center gap-1"><AlertCircle size={10} />{msg}</p> : null;

const InputWithIcon = ({ icon: Icon, error, className, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
    <input
      {...props}
      className={cn(inputCls(error), Icon ? 'pl-10' : '', className)}
    />
  </div>
);

const SelectWithIcon = ({ icon: Icon, children, error, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />}
    <select {...props} className={cn(selectCls(error), Icon ? 'pl-10' : '')}>
      {children}
    </select>
    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);

// Toggle Switch
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={cn(
      'relative inline-flex h-5 w-10 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer',
      checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )}
    />
  </button>
);

// Permission Row
const PermissionRow = ({ icon: Icon, title, desc, checked, onChange, badge }) => (
  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
    <div className="flex items-start gap-3 min-w-0">
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        checked ? 'bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
      )}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{title}</p>
          {badge && <span className={cn('text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full', checked ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400')}>{badge}</span>}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">{desc}</p>
      </div>
    </div>
    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
      <Toggle checked={checked} onChange={onChange} />
      <span className={cn('text-[9px] font-black uppercase', checked ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')}>
        {checked ? 'On' : 'Off'}
      </span>
    </div>
  </div>
);

// ──────────────────────────────────────────
// Main UserModal
// ──────────────────────────────────────────
const UserModal = ({ isOpen, onClose, userToEdit = null }) => {
  const { departments, roles, addUser, updateUser, users } = useAdmin();

  const EMPTY_FORM = {
    name: '',
    email: '',
    phone: '',
    empId: '',
    role: 'Employee',
    department: '',
    manager: 'None',
    joinDate: new Date().toISOString().split('T')[0],
    empType: 'Full-time',
    status: 'Active',
    address: '',
    city: '',
    state: '',
    country: '',
    notes: '',
    designation: '',
    salary: '',
    password: '',
    sendInvite: true,
  };

  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [activeTab, setActiveTab]   = useState('basic');
  const [isDirty, setIsDirty]       = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [isSuccess, setIsSuccess]   = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [photoUrl, setPhotoUrl]     = useState('');
  const photoInputRef = useRef(null);

  const [permissions, setPermissions] = useState({
    adminSettings:       false,
    payrollAccess:       false,
    employeeManagement:  true,
    reportingAccess:     false,
    leaveApproval:       false,
    attendanceManagement: false,
  });

  // ── Reset on open/userToEdit change ──
  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      setFormData({ ...EMPTY_FORM, ...userToEdit, password: '', sendInvite: false });
      setPhotoUrl(userToEdit.img || userToEdit.avatar || '');
      setPermissions({
        adminSettings:        ['Super Admin', 'Admin'].includes(userToEdit.role),
        payrollAccess:        ['Super Admin', 'HR Manager'].includes(userToEdit.role),
        employeeManagement:   !['Employee', 'Candidate'].includes(userToEdit.role),
        reportingAccess:      ['Super Admin', 'Admin', 'HR Manager'].includes(userToEdit.role),
        leaveApproval:        ['Super Admin', 'Admin', 'HR Manager', 'Manager'].includes(userToEdit.role),
        attendanceManagement: ['Super Admin', 'Admin', 'HR Manager'].includes(userToEdit.role),
      });
    } else {
      const nextId = users.length + 1;
      setFormData({
        ...EMPTY_FORM,
        empId: `EMP-${String(nextId).padStart(3, '0')}`,
        department: departments[0]?.name || '',
      });
      setPhotoUrl('');
      setPermissions({
        adminSettings: false,
        payrollAccess: false,
        employeeManagement: true,
        reportingAccess: false,
        leaveApproval: false,
        attendanceManagement: false,
      });
    }

    setActiveTab('basic');
    setIsDirty(false);
    setIsSuccess(false);
    setIsSaving(false);
    setErrors({});
    setShowPass(false);
  }, [userToEdit, isOpen]); // eslint-disable-line

  // ── Close on ESC ──
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Validate ──
  const validate = useCallback(() => {
    const errs = {};
    if (!formData.name.trim())      errs.name  = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    } else if (users.some(u => u.email?.toLowerCase() === formData.email.trim().toLowerCase() && u.id !== userToEdit?.id)) {
      errs.email = 'This email already exists in the organization';
    }
    if (!formData.empId.trim()) {
      errs.empId = 'Employee ID is required';
    } else if (users.some(u => u.empId?.toLowerCase() === formData.empId.trim().toLowerCase() && u.id !== userToEdit?.id)) {
      errs.empId = 'This Employee ID is already taken';
    }
    if (!userToEdit && formData.password && formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData, users, userToEdit]);

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Jump to first tab with error
      if (errors.name || errors.email || errors.empId || errors.phone || errors.password) setActiveTab('basic');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...formData, img: photoUrl, permissions };
      if (userToEdit) {
        await updateUser(userToEdit.id, payload);
      } else {
        await addUser(payload);
      }
      setIsSuccess(true);
      setTimeout(() => { setIsSuccess(false); setIsDirty(false); onClose(); }, 700);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'An error occurred';
      if (msg.toLowerCase().includes('email'))       setErrors(p => ({ ...p, email: msg }));
      else if (msg.toLowerCase().includes('empid') || msg.toLowerCase().includes('employee id')) setErrors(p => ({ ...p, empId: msg }));
      else setErrors(p => ({ ...p, submit: msg }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setIsDirty(true);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  // Photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoUrl(ev.target.result); setIsDirty(true); };
    reader.readAsDataURL(file);
  };

  // ── Auto-set permissions when role changes ──
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData(prev => ({ ...prev, role }));
    setIsDirty(true);
    setPermissions({
      adminSettings:        ['Super Admin', 'Admin'].includes(role),
      payrollAccess:        ['Super Admin', 'HR Manager'].includes(role),
      employeeManagement:   !['Employee', 'Candidate'].includes(role),
      reportingAccess:      ['Super Admin', 'Admin', 'HR Manager'].includes(role),
      leaveApproval:        ['Super Admin', 'Admin', 'HR Manager', 'Manager'].includes(role),
      attendanceManagement: ['Super Admin', 'Admin', 'HR Manager'].includes(role),
    });
  };

  // ── Tabs config ──
  const tabs = [
    { id: 'basic',      label: 'Basic Info',      icon: User },
    { id: 'employment', label: 'Employment',       icon: Briefcase },
    { id: 'additional', label: 'Additional',       icon: MapPin },
    { id: 'permissions',label: 'Permissions',      icon: Shield },
    { id: 'activity',   label: 'Activity',         icon: Activity },
  ];

  const statusColorMap = {
    Active:   'bg-emerald-500',
    Inactive: 'bg-slate-300',
    Pending:  'bg-amber-500',
  };

  const activePermissionCount = Object.values(permissions).filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-7 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              {/* Avatar + title */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Photo */}
                <div className="relative shrink-0 group">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="w-14 h-14 rounded-[1.1rem] border-2 border-dashed border-slate-200 dark:border-slate-700 group-hover:border-primary-400 dark:group-hover:border-primary-500 transition-all flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden cursor-pointer"
                    title="Click to upload photo"
                  >
                    {photoUrl ? (
                      <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={22} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[1rem]">
                      <Camera size={16} className="text-white" />
                    </div>
                  </div>
                  {/* Online dot */}
                  <span className={cn('absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900', statusColorMap[formData.status] || 'bg-slate-300')} />
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      {userToEdit ? 'Edit Workspace User' : 'Add Workspace User'}
                    </h2>
                    <span className="text-[9px] font-black bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800 uppercase tracking-wider">
                      {formData.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                    {userToEdit ? 'Update profile, onboarding status and system privileges.' : 'Create a new workspace user and configure their access.'}
                  </p>
                  {/* Quick actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-300 transition-all bg-white dark:bg-slate-800 cursor-pointer"
                    >
                      Upload photo
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => { setPhotoUrl(''); setIsDirty(true); }}
                        className="text-[10px] font-bold text-rose-500 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-gradient-to-br from-primary-50/80 to-indigo-50/50 dark:from-primary-950/30 dark:to-indigo-950/20 border border-primary-100/60 dark:border-primary-800/30 rounded-xl p-3.5 grid grid-cols-2 gap-x-5 gap-y-2 shrink-0 w-full sm:w-auto sm:min-w-[240px]">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                  <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 uppercase font-mono">{formData.empId || '—'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <span className={cn(
                    'inline-flex items-center gap-1 mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full',
                    formData.status === 'Active'   ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                    formData.status === 'Pending'  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', statusColorMap[formData.status])} />
                    {formData.status}
                  </span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                  <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 truncate max-w-[100px]">{formData.role || '—'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                  <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 truncate max-w-[100px]">{formData.department || '—'}</p>
                </div>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 sm:static p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── TABS ── */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/30 dark:bg-slate-800/20">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2 relative cursor-pointer shrink-0',
                    activeTab === id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700'
                  )}
                >
                  <Icon size={13} />
                  {label}
                  {id === 'permissions' && activePermissionCount > 0 && (
                    <span className="ml-1 text-[8px] font-black bg-primary-600 text-white px-1.5 py-0.5 rounded-full leading-none">{activePermissionCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── FORM BODY (scrollable) ── */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-none px-5 sm:px-7 py-5">
                <AnimatePresence mode="wait">

                  {/* ── TAB 1: Basic Information ── */}
                  {activeTab === 'basic' && (
                    <motion.div key="basic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Full Name */}
                        <div className="sm:col-span-2">
                          <FieldLabel required>Full Name</FieldLabel>
                          <InputWithIcon
                            icon={User}
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            error={errors.name}
                            autoComplete="name"
                          />
                          <FieldError msg={errors.name} />
                        </div>

                        {/* Employee ID */}
                        <div>
                          <FieldLabel required>Employee ID</FieldLabel>
                          <InputWithIcon
                            icon={Hash}
                            type="text"
                            name="empId"
                            value={formData.empId}
                            onChange={handleChange}
                            placeholder="EMP-001"
                            error={errors.empId}
                            className="uppercase font-mono"
                          />
                          <FieldError msg={errors.empId} />
                        </div>

                        {/* Status */}
                        <div>
                          <FieldLabel>Account Status</FieldLabel>
                          <SelectWithIcon icon={Activity} name="status" value={formData.status} onChange={handleChange}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending">Pending</option>
                          </SelectWithIcon>
                        </div>

                        {/* Email */}
                        <div>
                          <FieldLabel required>Email Address</FieldLabel>
                          <InputWithIcon
                            icon={Mail}
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe@company.com"
                            error={errors.email}
                            autoComplete="email"
                          />
                          <FieldError msg={errors.email} />
                        </div>

                        {/* Phone */}
                        <div>
                          <FieldLabel>Phone Number</FieldLabel>
                          <InputWithIcon
                            icon={Phone}
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => {
                              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              handleChange(e);
                            }}
                            placeholder="e.g. 9876543210"
                            maxLength={10}
                            error={errors.phone}
                          />
                          <FieldError msg={errors.phone} />
                        </div>

                        {/* Designation */}
                        <div>
                          <FieldLabel>Designation / Title</FieldLabel>
                          <InputWithIcon
                            icon={Star}
                            type="text"
                            name="designation"
                            value={formData.designation || ''}
                            onChange={handleChange}
                            placeholder="e.g. Senior Engineer"
                          />
                        </div>

                        {/* Password (only on add) */}
                        {!userToEdit && (
                          <div>
                            <FieldLabel>Temporary Password</FieldLabel>
                            <div className="relative">
                              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              <input
                                type={showPass ? 'text' : 'password'}
                                name="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                className={cn(inputCls(errors.password), 'pl-10 pr-10')}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                            <FieldError msg={errors.password} />
                            <p className="text-[10px] text-slate-400 mt-1 px-0.5">Leave blank to auto-generate. Employee can reset on first login.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── TAB 2: Employment Details ── */}
                  {activeTab === 'employment' && (
                    <motion.div key="employment" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Role */}
                        <div>
                          <FieldLabel>System Role</FieldLabel>
                          <SelectWithIcon icon={ShieldCheck} name="role" value={formData.role} onChange={handleRoleChange}>
                            {roles.length > 0 ? roles.map(r => (
                              <option key={r.id} value={r.name}>{r.name}</option>
                            )) : (
                              <>
                                <option>Employee</option>
                                <option>Manager</option>
                                <option>HR Manager</option>
                                <option>Admin</option>
                                <option>Super Admin</option>
                              </>
                            )}
                          </SelectWithIcon>
                          <p className="text-[10px] text-slate-400 mt-1 px-0.5">Controls dashboard access and module visibility.</p>
                        </div>

                        {/* Department */}
                        <div>
                          <FieldLabel>Department</FieldLabel>
                          <SelectWithIcon icon={Building2} name="department" value={formData.department} onChange={handleChange}>
                            <option value="">— None —</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                          </SelectWithIcon>
                        </div>

                        {/* Reporting Manager */}
                        <div>
                          <FieldLabel>Reporting Manager</FieldLabel>
                          <SelectWithIcon icon={UserCog} name="manager" value={formData.manager} onChange={handleChange}>
                            <option value="None">— Direct Reporting (None) —</option>
                            {users.filter(u => u.role !== 'Candidate' && u.id !== userToEdit?.id).map(u => (
                              <option key={u.id} value={u.name || u.employeeProfile?.fullName}>
                                {u.name || u.employeeProfile?.fullName} ({u.role})
                              </option>
                            ))}
                          </SelectWithIcon>
                        </div>

                        {/* Employment Type */}
                        <div>
                          <FieldLabel>Employment Type</FieldLabel>
                          <SelectWithIcon icon={Briefcase} name="empType" value={formData.empType} onChange={handleChange}>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Intern</option>
                            <option>Consultant</option>
                          </SelectWithIcon>
                        </div>

                        {/* Joining Date */}
                        <div>
                          <FieldLabel>Joining Date</FieldLabel>
                          <div className="relative">
                            <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                            <input
                              type="date"
                              name="joinDate"
                              value={formData.joinDate || ''}
                              onChange={handleChange}
                              className={cn(inputCls(false), 'pl-10')}
                            />
                          </div>
                        </div>

                        {/* Base Salary */}
                        <div>
                          <FieldLabel>Base Salary (Monthly)</FieldLabel>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">₹</span>
                            <input
                              type="number"
                              name="salary"
                              value={formData.salary || ''}
                              onChange={handleChange}
                              placeholder="e.g. 50000"
                              min={0}
                              className={cn(inputCls(false), 'pl-7')}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── TAB 3: Additional Details ── */}
                  {activeTab === 'additional' && (
                    <motion.div key="additional" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Street Address */}
                        <div className="sm:col-span-2">
                          <FieldLabel>Street Address</FieldLabel>
                          <div className="relative">
                            <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                            <textarea
                              name="address"
                              value={formData.address || ''}
                              onChange={handleChange}
                              rows={3}
                              placeholder="Street, area, locality..."
                              className={cn(
                                'w-full px-4 py-3 pl-10 rounded-xl border text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none',
                                'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
                                'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all'
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <FieldLabel>City</FieldLabel>
                          <InputWithIcon icon={MapPin} type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="Mumbai" />
                        </div>

                        <div>
                          <FieldLabel>State / Province</FieldLabel>
                          <InputWithIcon icon={Globe} type="text" name="state" value={formData.state || ''} onChange={handleChange} placeholder="Maharashtra" />
                        </div>

                        <div>
                          <FieldLabel>Country</FieldLabel>
                          <SelectWithIcon icon={Globe} name="country" value={formData.country || ''} onChange={handleChange}>
                            <option value="">— Select Country —</option>
                            <option value="India">India</option>
                            <option value="USA">United States</option>
                            <option value="UK">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="Singapore">Singapore</option>
                            <option value="UAE">United Arab Emirates</option>
                            <option value="Germany">Germany</option>
                          </SelectWithIcon>
                        </div>

                        {/* Private Notes */}
                        <div className="sm:col-span-2">
                          <FieldLabel>Private Notes</FieldLabel>
                          <textarea
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Background checks, internal feedback, onboarding remarks..."
                            className={cn(
                              'w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none',
                              'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
                              'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all'
                            )}
                          />
                          <p className="text-[10px] text-slate-400 mt-1 px-0.5">Visible only to HR administrators.</p>
                        </div>

                        {/* Onboarding Invite (new users only) */}
                        {!userToEdit && (
                          <div className="sm:col-span-2">
                            <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                  <Send size={15} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Send Onboarding Invitation</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Email login credentials and a welcome message to this employee</p>
                                </div>
                              </div>
                              <Toggle checked={formData.sendInvite} onChange={() => setFormData(p => ({ ...p, sendInvite: !p.sendInvite }))} />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── TAB 4: Permissions ── */}
                  {activeTab === 'permissions' && (
                    <motion.div key="permissions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                      <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30 rounded-xl flex items-start gap-2">
                        <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                          Permissions are auto-configured based on the selected role. You can override them below.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <PermissionRow
                          icon={ShieldCheck}
                          title="System Administration"
                          desc="Full workspace configuration, backend settings access, and department management."
                          checked={permissions.adminSettings}
                          onChange={() => togglePermission('adminSettings')}
                          badge="Admin Only"
                        />
                        <PermissionRow
                          icon={Zap}
                          title="Payroll & Financials"
                          desc="Access to compensation, tax documents, bank details, and monthly pay runs."
                          checked={permissions.payrollAccess}
                          onChange={() => togglePermission('payrollAccess')}
                          badge="Sensitive"
                        />
                        <PermissionRow
                          icon={User}
                          title="Employee Directory Management"
                          desc="Create, edit, suspend, and terminate workspace user profiles."
                          checked={permissions.employeeManagement}
                          onChange={() => togglePermission('employeeManagement')}
                        />
                        <PermissionRow
                          icon={FileText}
                          title="Confidential Workforce Reports"
                          desc="View predictive turnover models, headcount charts, and salary statistics."
                          checked={permissions.reportingAccess}
                          onChange={() => togglePermission('reportingAccess')}
                        />
                        <PermissionRow
                          icon={CheckCircle2}
                          title="Leave Approval"
                          desc="Approve or reject leave requests for direct reports and team members."
                          checked={permissions.leaveApproval}
                          onChange={() => togglePermission('leaveApproval')}
                        />
                        <PermissionRow
                          icon={Clock}
                          title="Attendance Management"
                          desc="View, edit, and manage attendance records and override punch entries."
                          checked={permissions.attendanceManagement}
                          onChange={() => togglePermission('attendanceManagement')}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ── TAB 5: Activity Log ── */}
                  {activeTab === 'activity' && (
                    <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                      {userToEdit ? (
                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-6 ml-3 space-y-5">
                          {[
                            { action: 'Compensation structure updated', info: 'Modified base salary & direct deposit settings', time: '12 minutes ago', icon: Zap, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
                            { action: 'Onboarding verification completed', info: 'Address and legal documents reviewed successfully', time: '2 days ago', icon: ShieldCheck, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
                            { action: 'Role changed to Manager', info: 'Role updated by system administrator', time: '5 days ago', icon: UserCog, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
                            { action: 'Signed in via SSO', info: 'Logged in from Mumbai, MH (IP: 192.168.1.10)', time: '1 week ago', icon: Globe, color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
                          ].map((log, i) => (
                            <div key={i} className="relative">
                              <span className={cn('absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-slate-900', log.color)}>
                                <log.icon size={10} />
                              </span>
                              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{log.action}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5">{log.info}</p>
                                <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider mt-2 inline-block">{log.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Clock size={24} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">No activity logs yet</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">Logs will appear here once this profile is created and the user starts using the system.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* ── STICKY FOOTER ── */}
              <div className="shrink-0 px-5 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 flex-wrap">
                {/* Left: status indicators */}
                <div className="flex items-center gap-2 min-w-0">
                  <AnimatePresence mode="wait">
                    {isSuccess && (
                      <motion.div key="success" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Saved!</span>
                      </motion.div>
                    )}
                    {isDirty && !isSuccess && (
                      <motion.div key="dirty" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Unsaved changes</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.submit && (
                    <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} />{errors.submit}
                    </p>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isSuccess}
                    className={cn(
                      'h-10 px-5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer',
                      isSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20',
                      (isSaving || isSuccess) && 'opacity-80 cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <><Loader2 size={14} className="animate-spin" /><span>Saving…</span></>
                    ) : isSuccess ? (
                      <><CheckCircle2 size={14} /><span>Saved!</span></>
                    ) : (
                      <><span>{userToEdit ? 'Save Changes' : 'Create User'}</span><ChevronRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserModal;

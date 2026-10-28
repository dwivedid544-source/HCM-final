import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  MoreVertical, 
  ChevronRight, 
  Search,
  Layout,
  Users,
  Settings,
  ChevronDown,
  Info,
  Layers,
  Copy,
  LayoutDashboard,
  Building2,
  CreditCard,
  CalendarDays,
  Bot,
  Scale,
  Plug,
  Receipt,
  FileSearch,
  BarChart2,
  Briefcase,
  GitMerge,
  UserCheck,
  MessageSquare,
  Clock,
  CheckSquare,
  Target,
  ClipboardList,
  Star,
  User,
  Gift,
  BookOpen,
  Bell,
  Calendar,
  FileText,
  Activity
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const ROLE_MODULES = {
   admin: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'org_setup', label: 'Org Setup', icon: Building2 },
      { id: 'departments', label: 'Departments', icon: Building2 },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'roles_permissions', label: 'Roles & Permissions', icon: ShieldCheck },
      { id: 'payroll_center', label: 'Payroll Center', icon: CreditCard },
      { id: 'holidays', label: 'Holidays', icon: CalendarDays },
      { id: 'benefits_config', label: 'Benefits Config', icon: Gift },
      { id: 'ai_center', label: 'AI Center', icon: Bot },
      { id: 'compliance', label: 'Compliance', icon: Scale },
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'billing', label: 'Billing', icon: Receipt },
      { id: 'audit_logs', label: 'Audit Logs', icon: FileSearch },
      { id: 'reports', label: 'Reports', icon: BarChart2 },
      { id: 'settings', label: 'Settings', icon: Settings },
   ],
   hr: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'job_posts', label: 'Job Posts', icon: Briefcase },
      { id: 'candidates', label: 'Candidates', icon: Users },
      { id: 'interviews', label: 'Interviews', icon: Calendar },
      { id: 'hiring_pipeline', label: 'Hiring Pipeline', icon: GitMerge },
      { id: 'offer_management', label: 'Offer Management', icon: FileText },
      { id: 'onboarding', label: 'Onboarding', icon: UserCheck },
      { id: 'reports', label: 'Reports', icon: BarChart2 },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
   ],
   manager: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'team_members', label: 'Team Members', icon: Users },
      { id: 'attendance_review', label: 'Attendance Review', icon: Clock },
      { id: 'leave_approval', label: 'Leave Approval', icon: CheckSquare },
      { id: 'kpi_tracking', label: 'KPI Tracking', icon: Target },
      { id: 'tasks', label: 'Tasks', icon: ClipboardList },
      { id: 'reviews', label: 'Reviews', icon: Star },
      { id: 'reports', label: 'Reports', icon: BarChart2 },
   ],
   employee: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'attendance', label: 'Attendance', icon: Clock },
      { id: 'leave', label: 'Leave', icon: CalendarDays },
      { id: 'payroll', label: 'Payroll', icon: CreditCard },
      { id: 'benefits', label: 'Benefits', icon: Gift },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'performance', label: 'Performance', icon: Activity },
      { id: 'help_desk', label: 'Help Desk', icon: BookOpen },
   ],
   candidate: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'browse_jobs', label: 'Browse Jobs', icon: Briefcase },
      { id: 'my_applications', label: 'My Applications', icon: ClipboardList },
      { id: 'resume_builder', label: 'Resume Builder', icon: FileText },
      { id: 'ai_resume_score', label: 'AI Resume Score', icon: Star },
      { id: 'interview_schedule', label: 'Interview Schedule', icon: Calendar },
      { id: 'notifications', label: 'Notifications', icon: Bell },
   ]
};

const getModulesForRole = (roleName) => {
   const normalized = (roleName || '').toLowerCase();
   if (normalized.includes('admin')) return ROLE_MODULES.admin;
   if (normalized.includes('hr')) return ROLE_MODULES.hr;
   if (normalized.includes('manager')) return ROLE_MODULES.manager;
   if (normalized.includes('candidate')) return ROLE_MODULES.candidate;
   return ROLE_MODULES.employee;
};

const RoleModal = ({ isOpen, onClose, roleToEdit = null }) => {
  const { roles, addRole, updateRole, users, showToast } = useAdmin();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cloneFrom: '',
    permissions: {},
    assignedUsers: []
  });

  const modules = getModulesForRole(formData.name || formData.cloneFrom);

  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'];

  useEffect(() => {
    if (roleToEdit) {
      setFormData({
        ...roleToEdit,
        assignedUsers: users.filter(u => u.role === roleToEdit.name).map(u => u.id)
      });
    } else {
      setFormData({
        name: '',
        description: '',
        cloneFrom: '',
        permissions: {},
        assignedUsers: []
      });
      setStep(1);
    }
  }, [roleToEdit, isOpen, users]);

  const togglePermission = (module, action) => {
    setFormData(prev => {
      const current = prev.permissions[module] || [];
      const updated = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: updated
        }
      };
    });
  };

  const toggleAllInModule = (module) => {
     setFormData(prev => {
        const current = prev.permissions[module] || [];
        const isAllSelected = current.length === actions.length;
        return {
           ...prev,
           permissions: {
              ...prev.permissions,
              [module]: isAllSelected ? [] : [...actions]
           }
        };
     });
  };

  const handleCloneChange = (roleName) => {
     const roleToClone = roles.find(r => r.name === roleName);
     if (roleToClone) {
        setFormData(prev => ({
           ...prev,
           cloneFrom: roleName,
           permissions: { ...roleToClone.permissions }
        }));
        showToast(`Initial permissions cloned from ${roleName}`, 'info');
     }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!formData.name.trim()) {
      showToast('Role name is required', 'error');
      setStep(1);
      return;
    }

    if (roleToEdit) {
      updateRole(roleToEdit.id, formData);
    } else {
      addRole(formData);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="py-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg transform -rotate-3">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-none dark:text-white">
                    {roleToEdit ? 'Configure Role' : 'Create Custom Role'}
                  </h2>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Role Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Senior Recruiter" 
                                        className="input-field h-11 bg-slate-50 border-transparent font-bold text-slate-700" 
                                    />
                                </div>
                            </div>

                            {!roleToEdit && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Select Role</label>
                                    <select 
                                        value={formData.cloneFrom}onChange={(e) => handleCloneChange(e.target.value)}>
                                        <option value="">Don't clone, start fresh</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden overflow-x-auto">
                                <div className="min-w-[760px]">
                                    <div className="grid grid-cols-12 bg-slate-900 py-3 px-6">
                                        <div className="col-span-4 text-[10px] font-bold text-white uppercase tracking-widest">Module</div>
                                        <div className="col-span-8 grid grid-cols-7 gap-1">
                                            {actions.map(action => (
                                                <div key={action}>{action}</div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {modules.map((mod) => (
                                            <div key={mod.id}>
                                                <div className="col-span-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-primary-600 transition-colors shadow-xs shrink-0">
                                                        <mod.icon size={16} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{mod.label}</span>
                                                </div>
                                                <div className="col-span-8 grid grid-cols-7 gap-1">
                                                    {actions.map(action => (
                                                        <div key={action}>
                                                            <label className={cn(
                                                                "w-6 h-6 rounded-lg cursor-pointer flex items-center justify-center transition-all",
                                                                (formData.permissions[mod.id] || []).includes(action)
                                                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-100"
                                                                    : "bg-white border border-slate-100 text-slate-100 hover:border-slate-300"
                                                            )}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="sr-only"
                                                                    checked={(formData.permissions[mod.id] || []).includes(action)}
                                                                    onChange={() => togglePermission(mod.id, action)}
                                                                />
                                                                {(formData.permissions[mod.id] || []).includes(action) && <ShieldCheck size={12} fill="currentColor" />}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                             <div className="card p-5 border border-slate-100 bg-slate-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-none dark:text-white">Assign Users Directly</h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Select users who should immediately inherit this role</p>
                                    </div>
                                    <div className="relative w-64 group">
                                        <Search className="absolute left-3 top-2.5 text-slate-300 group-focus-within:text-primary-400 transition-colors" size={16} />
                                        <input type="text" placeholder="Search users..." className="input-field h-10 pl-10 text-xs bg-white border-slate-200" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {users.filter(u => u.role !== 'Admin').map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => {
                                                const current = formData.assignedUsers;
                                                const updated = current.includes(user.name) // Using name for role sync logic
                                                    ? current.filter(u => u !== user.id)
                                                    : [...current, user.id];
                                                setFormData(prev => ({ ...prev, assignedUsers: updated }));
                                            }}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-4",
                                                formData.assignedUsers.includes(user.id)
                                                    ? "bg-primary-50 border-primary-200 ring-1 ring-primary-200"
                                                    : "bg-white border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <img src={user.img}alt="" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.05em]">{user.department}</p>
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                formData.assignedUsers.includes(user.id)
                                                    ? "bg-primary-600 border-primary-600 text-white"
                                                    : "bg-slate-50 border-slate-200"
                                            )}>
                                                {formData.assignedUsers.includes(user.id) && <ShieldCheck size={10} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="sticky bottom-0 py-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-4">
              {step > 1 ? (
                <button 
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary"
                >
                  Back
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={onClose} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button 
                type="button"
                onClick={handleSubmit}
                className="btn-primary"
              >
                <span>{step < 3 ? 'Continue' : (roleToEdit ? 'Save Changes' : 'Create Role')}</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RoleModal;

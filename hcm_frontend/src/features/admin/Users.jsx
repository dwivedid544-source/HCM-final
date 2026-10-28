import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Download, 
  Filter, 
  Mail, 
  ShieldCheck, 
  X, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  UserPlus, 
  Send, 
  Ban, 
  CheckCircle2, 
  Briefcase, 
  Phone, 
  Calendar,
  Lock,
  RotateCcw,
  Zap,
  MapPin,
  ChevronRight,
  UserCircle,
  Eye,
  FileText,
  Activity,
  Upload,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { cn } from '../../utils/cn';
import UserModal from './components/UserModal';
import ImportModal from '../../shared/components/import/ImportModal';
import ConfirmDialog from './components/ConfirmDialog';
import ActionDropdown from './components/ActionDropdown';
import PermissionGate from '../../shared/components/common/PermissionGate';
import PageHeader from '../../shared/components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';

// ============================================================
// Bounded Safe Avatar Component
// ============================================================
const SafeAvatar = ({ src, alt = '', name = '', size = 40, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const isValidUrl = useMemo(() => {
    if (!src || typeof src !== 'string') return false;
    const clean = src.trim();
    if (clean === '' || clean === 'null' || clean === 'undefined' || clean === '[object Object]') return false;
    return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image/');
  }, [src]);

  const initials = useMemo(() => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <div 
      className={cn(
        "relative shrink-0 overflow-hidden select-none flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-200 ring-2 ring-white dark:ring-slate-800 shadow-2xs font-extrabold",
        className
      )}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        minWidth: `${size}px`, 
        maxWidth: `${size}px`, 
        minHeight: `${size}px`, 
        maxHeight: `${size}px` 
      }}
    >
      {isValidUrl && !hasError ? (
        <>
          <img 
            src={src} 
            alt={alt || name}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'cover',
              objectPosition: 'center',
              display: isLoaded ? 'block' : 'none'
            }}
          />
          {!isLoaded && (
            <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>
              {initials}
            </span>
          )}
        </>
      ) : (
        <span style={{ fontSize: `${Math.max(10, Math.floor(size * 0.35))}px` }}>
          {initials}
        </span>
      )}
    </div>
  );
};

// ============================================================
// Employee Profile View Inspector Drawer / Modal
// ============================================================
const UserViewModal = ({ user, onClose, onEdit }) => {
  if (!user) return null;

  const salaryDisplay = (user.baseSalary || user.monthlyCTC) 
    ? `$${Number(user.baseSalary || user.monthlyCTC).toLocaleString()}/mo` 
    : 'Not Allocated';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex justify-end text-left">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-4">
              <SafeAvatar src={user.img} name={user.name} size={56} />
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 inline-block mb-1">
                  {user.role || 'Employee'}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {user.name}
                </h2>
                <p className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                  {user.empId || 'EMP-000'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Account Status
                </p>
                <span className={cn(
                  "hcm-badge inline-block",
                  user.status === 'Active' && "hcm-badge-active",
                  user.status === 'Pending' && "hcm-badge-pending",
                  user.status === 'Resigned' && "hcm-badge-draft",
                  user.status === 'Terminated' && "hcm-badge-inactive"
                )}>
                  {user.status || 'Active'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Allocated Salary
                </p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {salaryDisplay}
                </p>
              </div>
            </div>

            {/* Profile Details List */}
            <div className="space-y-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail size={15} className="text-slate-400 shrink-0" />
                <span className="font-semibold truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <span className="font-semibold">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Briefcase size={15} className="text-slate-400 shrink-0" />
                <span className="font-semibold">{user.department || 'Unassigned'} ({user.empType || 'Full-time'})</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <ShieldCheck size={15} className="text-slate-400 shrink-0" />
                <span className="font-semibold">Reports to: {user.manager || 'None'}</span>
              </div>
              {user.joinDate && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Calendar size={15} className="text-slate-400 shrink-0" />
                  <span className="font-semibold">Joined: {user.joinDate}</span>
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{user.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <Activity size={15} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-400 dark:text-slate-500">Last Login: {user.lastLogin || 'Never'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
                className="btn-primary flex-1 text-xs"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 text-xs"
              >
                <span>Close Inspector</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================================
// Main Users Feature Component
// ============================================================
const Users = () => {
  const { 
    users, 
    departments, 
    roles, 
    deleteUser, 
    updateUser, 
    bulkUpdateUsersStatus, 
    bulkDeleteUsers,
    fetchUsers,
    loading,
    showToast 
  } = useAdmin();
  const { check: hasPermission } = usePermission('users');

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [deptFilter, setDeptFilter] = useState('All Depts');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToView, setUserToView] = useState(null);

  // Initial fetch on load
  useEffect(() => {
    let isMounted = true;
    if (users.length === 0) {
      fetchUsers().catch(() => {});
    }
    return () => { isMounted = false; };
  }, [fetchUsers, users.length]);

  // Debounced Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchUsers();
      showToast('Employee list refreshed successfully', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dynamic KPI Metrics
  const stats = [
    { 
      label: 'Total Employees', 
      value: users.length, 
      icon: UsersIcon, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-950/30' 
    },
    { 
      label: 'Active Now', 
      value: users.filter(u => u.status === 'Active').length, 
      icon: CheckCircle2, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30' 
    },
    { 
      label: 'Pending Invites', 
      value: users.filter(u => u.status === 'Pending').length, 
      icon: Send, 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-950/30' 
    },
  ];

  const filteredUsers = useMemo(() => {
    const q = debouncedSearchTerm.toLowerCase().trim();
    return (users || [])
      .filter(u => {
        const matchesSearch = !q || 
          (u.name && u.name.toLowerCase().includes(q)) || 
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.empId && u.empId.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q)) ||
          (u.department && u.department.toLowerCase().includes(q));
        const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
        const matchesDept = deptFilter === 'All Depts' || u.department === deptFilter;
        const matchesStatus = statusFilter === 'All Status' || u.status === statusFilter;
        return matchesSearch && matchesRole && matchesDept && matchesStatus;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, debouncedSearchTerm, roleFilter, deptFilter, statusFilter]);

  // Handlers
  const handleExport = () => {
    if (filteredUsers.length === 0) {
      showToast('No user records found to export', 'error');
      return;
    }

    const headers = ['Employee Name', 'Email', 'Role', 'Department', 'Employee ID', 'Joining Date', 'Status', 'Employment Type', 'Manager', 'Allocated Salary', 'Last Login'];
    const rows = filteredUsers.map(u => [
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.role || '').replace(/"/g, '""')}"`,
      `"${(u.department || 'None').replace(/"/g, '""')}"`,
      `"${(u.empId || '').replace(/"/g, '""')}"`,
      `"${(u.joinDate || '').replace(/"/g, '""')}"`,
      `"${(u.status || 'Active').replace(/"/g, '""')}"`,
      `"${(u.empType || 'Full-time').replace(/"/g, '""')}"`,
      `"${(u.manager || 'None').replace(/"/g, '""')}"`,
      `"${(u.baseSalary || u.monthlyCTC) ? '$' + Number(u.baseSalary || u.monthlyCTC).toLocaleString() + '/mo' : 'Not Allocated'}"`,
      `"${(u.lastLogin || 'Never').replace(/"/g, '""')}"`
    ]);

    // UTF-8 BOM + CSV
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Employees list exported to CSV successfully!', 'success');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} employees?`)) {
        await bulkDeleteUsers(selectedUsers);
        setSelectedUsers([]);
      }
    } else if (action === 'activate') {
      await bulkUpdateUsersStatus(selectedUsers, 'Active');
      setSelectedUsers([]);
    } else if (action === 'deactivate') {
      await bulkUpdateUsersStatus(selectedUsers, 'Inactive');
      setSelectedUsers([]);
    }
  };

  const handleResendInvite = (user) => {
    showToast(`Invitation resent to ${user.email}`, 'success');
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none text-left">
      {/* Header */}
      <PageHeader
        title="Employee Management"
        description="Oversee platform access, assign roles and configure workforce identities"
        actions={
          <>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="btn-secondary whitespace-nowrap cursor-pointer"
              title="Refresh employee list"
            >
              <RefreshCw size={16} className={cn(isRefreshing && "animate-spin text-primary-600")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <PermissionGate module="users" action="create">
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="btn-secondary whitespace-nowrap cursor-pointer"
                title="Import employees from XLSX or CSV"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
              </button>
            </PermissionGate>

            <PermissionGate module="users" action="view">
              <button 
                type="button"
                onClick={handleExport}
                className="btn-secondary whitespace-nowrap cursor-pointer"
                title="Export filtered employee dataset to CSV"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </PermissionGate>

            <PermissionGate module="users" action="create">
              <button 
                type="button"
                onClick={() => {
                  setUserToEdit(null);
                  setIsAddUserOpen(true);
                }}
                className="btn-primary whitespace-nowrap cursor-pointer"
              >
                <UserPlus size={18} />
                <span>Add Employee</span>
              </button>
            </PermissionGate>
          </>
        }
      />

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((_, idx) => (
            <div key={idx} className="card p-6 animate-pulse">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))
        ) : (
          stats.map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft"
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-3.5 rounded-2xl flex items-center justify-center shadow-xs", stat.bg, stat.color)}>
                  <stat.icon size={26} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Control Bar & Search */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0 text-slate-400">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or employee ID..." 
              className="input-field pl-11 h-[44px] w-full" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns - Single horizontal row on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0 w-full sm:w-auto">
            <select 
              className="select-field h-[44px] min-w-[130px] w-full sm:w-auto text-xs font-semibold cursor-pointer" 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All Roles">All Roles</option>
              {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>

            <select 
              className="select-field h-[44px] min-w-[130px] w-full sm:w-auto text-xs font-semibold cursor-pointer" 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All Depts">All Depts</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>

            <select 
              className="select-field h-[44px] min-w-[130px] w-full sm:w-auto text-xs font-semibold cursor-pointer" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Floating Bar */}
        {selectedUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex items-center gap-4 bg-primary-50 dark:bg-primary-950/40 p-3.5 rounded-2xl border border-primary-200 dark:border-primary-800 shadow-sm"
          >
            <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
              {selectedUsers.length} Employee{selectedUsers.length > 1 ? 's' : ''} Selected
            </span>
            <div className="h-4 w-px bg-primary-200 dark:bg-primary-800" />
            <div className="flex items-center gap-2">
              <PermissionGate module="users" action="edit">
                <button className="btn-secondary btn-compact cursor-pointer" onClick={() => handleBulkAction('activate')}>
                  Bulk Activate
                </button>
                <button className="btn-secondary btn-compact cursor-pointer" onClick={() => handleBulkAction('deactivate')}>
                  Bulk Deactivate
                </button>
              </PermissionGate>
              <PermissionGate module="users" action="delete">
                <button className="btn-danger btn-compact cursor-pointer" onClick={() => handleBulkAction('delete')}>
                  Bulk Delete
                </button>
              </PermissionGate>
              <button className="btn-ghost btn-compact cursor-pointer" onClick={() => setSelectedUsers([])}>
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card p-6 space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Data Table (md and up) */}
            <div className="hidden md:block card p-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left hcm-table min-w-[760px]">
                  <thead className="hcm-thead">
                    <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-4 w-12 text-center hcm-th">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-md accent-primary-600 cursor-pointer" 
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length} 
                          onChange={handleSelectAll} 
                        />
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                        Employee Info
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                        Role / Dept
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                        Allocated Salary
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                        Last Login
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className={cn("hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors hcm-tr", selectedUsers.includes(user.id) && "bg-primary-50/20 dark:bg-primary-950/20")}>
                          <td className="px-4 py-4 text-center hcm-td">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded-md accent-primary-600 cursor-pointer"
                              checked={selectedUsers.includes(user.id)} 
                              onChange={() => handleSelectUser(user.id)} 
                            />
                          </td>
                          <td className="px-6 py-4 hcm-td">
                            <div className="flex items-center gap-3.5">
                              <SafeAvatar src={user.img} name={user.name} size={40} />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hcm-td">
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {user.role}
                            </p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                              {user.department || 'Unassigned'}
                            </p>
                          </td>
                          <td className="px-6 py-4 hcm-td">
                            {(user.baseSalary || user.monthlyCTC) ? (
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
                                ${Number(user.baseSalary || user.monthlyCTC).toLocaleString()}/mo
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs italic font-medium">
                                Not Allocated
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center hcm-td text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {user.lastLogin || 'Never'}
                          </td>
                          <td className="px-6 py-4 text-center hcm-td">
                            <span className={cn(
                              "hcm-badge",
                              user.status === 'Active' && "hcm-badge-active",
                              user.status === 'Pending' && "hcm-badge-pending",
                              user.status === 'Resigned' && "hcm-badge-draft",
                              user.status === 'Terminated' && "hcm-badge-inactive"
                            )}>
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right hcm-td">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setUserToView(user)} 
                                title="View Profile Inspector" 
                                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Eye size={17} />
                              </button>
                              <PermissionGate module="users" action="edit">
                                <button 
                                  onClick={() => { setUserToEdit(user); setIsAddUserOpen(true); }} 
                                  title="Edit Employee Profile" 
                                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Edit3 size={17} />
                                </button>
                              </PermissionGate>
                              <ActionDropdown 
                                actions={[
                                  user.status === 'Pending' ? {
                                    label: 'Resend Invite',
                                    icon: Send,
                                    onClick: () => handleResendInvite(user)
                                  } : null,
                                  hasPermission('edit') ? { 
                                    label: user.status === 'Active' ? 'Deactivate' : 'Activate', 
                                    icon: user.status === 'Active' ? Ban : CheckCircle2, 
                                    onClick: () => updateUser(user.id, { status: user.status === 'Active' ? 'Inactive' : 'Active' }) 
                                  } : null,
                                  hasPermission('delete') ? { 
                                    label: 'Delete Employee', 
                                    icon: Trash2, 
                                    danger: true, 
                                    onClick: () => setUserToDelete(user) 
                                  } : null
                                ].filter(Boolean)} 
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hcm-tr">
                        <td colSpan={7} className="px-8 py-16 text-center hcm-td">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                              <UsersIcon size={28} />
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                                {searchTerm || roleFilter !== 'All Roles' || deptFilter !== 'All Depts' || statusFilter !== 'All Status' 
                                  ? 'No matching employees found' 
                                  : 'No employees added yet'}
                              </p>
                              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                {searchTerm || roleFilter !== 'All Roles' || deptFilter !== 'All Depts' || statusFilter !== 'All Status'
                                  ? 'Try adjusting your search query or dropdown filters' 
                                  : 'Get started by adding your organization’s first team member'}
                              </p>
                            </div>
                            {searchTerm || roleFilter !== 'All Roles' || deptFilter !== 'All Depts' || statusFilter !== 'All Status' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm('');
                                  setRoleFilter('All Roles');
                                  setDeptFilter('All Depts');
                                  setStatusFilter('All Status');
                                }}
                                className="btn-secondary btn-compact mt-2 cursor-pointer"
                              >
                                Clear Filters
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToEdit(null);
                                  setIsAddUserOpen(true);
                                }}
                                className="btn-primary btn-compact mt-2 cursor-pointer"
                              >
                                <UserPlus size={14} />
                                <span>Add First Employee</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (< md screens) */}
            <div className="block md:hidden space-y-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft space-y-4"
                  >
                    {/* Top Row: Checkbox, Avatar, Name & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-md accent-primary-600 cursor-pointer shrink-0"
                          checked={selectedUsers.includes(user.id)} 
                          onChange={() => handleSelectUser(user.id)} 
                        />
                        <SafeAvatar src={user.img} name={user.name} size={40} />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white tracking-tight truncate text-sm">
                            {user.name}
                          </h4>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "hcm-badge shrink-0",
                        user.status === 'Active' && "hcm-badge-active",
                        user.status === 'Pending' && "hcm-badge-pending",
                        user.status === 'Resigned' && "hcm-badge-draft",
                        user.status === 'Terminated' && "hcm-badge-inactive"
                      )}>
                        {user.status || 'Active'}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Role / Dept</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{user.role}</p>
                        <p className="text-[11px] text-slate-400">{user.department || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Allocated Salary</span>
                        <div className="mt-0.5">
                          {(user.baseSalary || user.monthlyCTC) ? (
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              ${Number(user.baseSalary || user.monthlyCTC).toLocaleString()}/mo
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Not Allocated</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setUserToView(user)} 
                        className="btn-secondary btn-compact cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <PermissionGate module="users" action="edit">
                        <button 
                          onClick={() => { setUserToEdit(user); setIsAddUserOpen(true); }} 
                          className="btn-secondary btn-compact cursor-pointer"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>
                      </PermissionGate>
                      <ActionDropdown 
                        actions={[
                          user.status === 'Pending' ? {
                            label: 'Resend Invite',
                            icon: Send,
                            onClick: () => handleResendInvite(user)
                          } : null,
                          hasPermission('edit') ? { 
                            label: user.status === 'Active' ? 'Deactivate' : 'Activate', 
                            icon: user.status === 'Active' ? Ban : CheckCircle2, 
                            onClick: () => updateUser(user.id, { status: user.status === 'Active' ? 'Inactive' : 'Active' }) 
                          } : null,
                          hasPermission('delete') ? { 
                            label: 'Delete Employee', 
                            icon: Trash2, 
                            danger: true, 
                            onClick: () => setUserToDelete(user) 
                          } : null
                        ].filter(Boolean)} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <UsersIcon size={24} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No employees found</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search query or dropdown filters</p>
                  {searchTerm || roleFilter !== 'All Roles' || deptFilter !== 'All Depts' || statusFilter !== 'All Status' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setRoleFilter('All Roles');
                        setDeptFilter('All Depts');
                        setStatusFilter('All Status');
                      }}
                      className="btn-secondary btn-compact cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUserToEdit(null);
                        setIsAddUserOpen(true);
                      }}
                      className="btn-primary btn-compact cursor-pointer"
                    >
                      <UserPlus size={14} />
                      <span>Add Employee</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals & Drawers */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        entity="employees"
        onImportSuccess={() => fetchUsers()}
      />

      <UserModal 
        isOpen={isAddUserOpen} 
        onClose={() => {
          setIsAddUserOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />

      <UserViewModal 
        user={userToView}
        onClose={() => setUserToView(null)}
        onEdit={(u) => {
          setUserToEdit(u);
          setIsAddUserOpen(true);
        }}
      />

      <ConfirmDialog 
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (userToDelete) {
            await deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        title="Delete Employee Record"
        message={`Are you sure you want to delete employee "${userToDelete?.name}"? This action will remove their account and platform access.`}
        confirmText="Delete Employee"
        type="danger"
      />
    </div>
  );
};

export default Users;

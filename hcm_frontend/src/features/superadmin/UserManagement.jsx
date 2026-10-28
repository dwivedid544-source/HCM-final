import React, { useState } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useAuth } from '../../hooks/useAuth';
import { superAdminAPI } from '../../utils/apiService';
import {
  Users, UserPlus, Trash2, Edit3, Search, X, Shield,
  Building2, Mail, UserCheck, Power, RefreshCw, Activity,
  DollarSign, AlertCircle, KeyRound, Globe, Calendar, CheckCircle2,
  ChevronDown, Filter, ShieldCheck, UserCog, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionDropdown from '../admin/components/ActionDropdown';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import UserAvatar from '../../shared/components/ui/UserAvatar';
import PageHeader from '../../shared/components/ui/PageHeader';

const getRoleBadgeStyle = (role) => {
  const r = (role || '').toUpperCase();
  switch (r) {
    case 'SUPERADMIN':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'ADMIN':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    case 'HR':
      return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
    case 'MANAGER':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'EMPLOYEE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'CANDIDATE':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

const SYSTEM_ROLES = [
  { value: 'SUPERADMIN', label: 'SUPERADMIN', desc: 'Full platform access across all tenants' },
  { value: 'ADMIN', label: 'ADMIN', desc: 'Organization administrator' },
  { value: 'HR', label: 'HR', desc: 'HR and people operations' },
  { value: 'MANAGER', label: 'MANAGER', desc: 'Team & department supervisor' },
  { value: 'EMPLOYEE', label: 'EMPLOYEE', desc: 'Standard staff profile' },
  { value: 'CANDIDATE', label: 'CANDIDATE', desc: 'Job applicant / talent network' },
];

const UserManagement = () => {
  const {
    users, addUser, updateUser, deleteUser, toggleUserActive,
    changeUserRole, resetUserPassword, organizations, departments,
    refetch, showToast
  } = useSuperAdmin();
  const { user: currentUser } = useAuth();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [targetRole, setTargetRole] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [salary, setSalary] = useState('');
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedActualDeptId, setSelectedActualDeptId] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch?.fetchUsers?.();
    setIsRefreshing(false);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setSalary('');
    setSelectedRole('EMPLOYEE');
    setSelectedDept(organizations[0]?.name || '');
    setSelectedActualDeptId('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword('');
    setSalary(user.baseSalary || user.monthlyCTC || '');
    setSelectedRole(user.role || 'EMPLOYEE');
    setSelectedDept(user.organization?.name || user.organizationName || '');
    setSelectedActualDeptId(user.employeeProfile?.department?.id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const salaryNumber = salary !== '' && !isNaN(Number(salary)) ? Number(salary) : 0;

    let success = false;
    if (editingUser) {
      success = await updateUser(editingUser.id, {
        name,
        email,
        ...(password && { password }),
        role: selectedRole,
        department: selectedDept || undefined,
        departmentId: selectedActualDeptId || undefined,
        salary: salaryNumber,
        baseSalary: salaryNumber,
        monthlyCTC: salaryNumber
      });
    } else {
      success = await addUser({
        name,
        email,
        ...(password && { password }),
        role: selectedRole,
        department: selectedDept || undefined,
        departmentId: selectedActualDeptId || undefined,
        status: 'active',
        salary: salaryNumber,
        baseSalary: salaryNumber,
        monthlyCTC: salaryNumber
      });
    }

    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleToggleStatus = (user) => {
    if (user.id === currentUser?.id || user.email === currentUser?.email) {
      showToast('You cannot deactivate your own SuperAdmin account.', 'error');
      return;
    }
    toggleUserActive(user.id);
  };

  const handleResetPassword = async (user) => {
    await resetUserPassword(user.id);
    setIsResetModalOpen(false);
    setTargetResetUser(null);
  };

  const handleRoleChangeConfirm = async () => {
    if (!userToChangeRole || !targetRole) return;
    await changeUserRole(userToChangeRole.id, targetRole);
    setUserToChangeRole(null);
    setTargetRole('');
  };

  // Dynamic Filtering
  const filteredUsers = users.filter(user => {
    const nameStr = (user.name || '').toLowerCase();
    const emailStr = (user.email || '').toLowerCase();
    const orgStr = (user.organization?.name || user.organizationName || 'Platform / Global').toLowerCase();
    const roleStr = (user.role || '').toUpperCase();
    const statusStr = user.isActive ? 'ACTIVE' : 'INACTIVE';
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch = !query || 
      nameStr.includes(query) || 
      emailStr.includes(query) || 
      orgStr.includes(query) || 
      roleStr.includes(query.toUpperCase());

    const matchesRole = roleFilter === 'ALL' || roleStr === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || statusStr === statusFilter;
    
    let matchesOrg = true;
    if (orgFilter === 'NONE') {
      matchesOrg = !user.organizationId && !user.organization;
    } else if (orgFilter !== 'ALL') {
      matchesOrg = user.organization?.name === orgFilter || user.organizationName === orgFilter;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesOrg;
  });

  return (
    <div className="hcm-superadmin-container pb-12">
      {/* Header */}
      <PageHeader
        title="Global User Management"
        description="Authoritative platform-wide user directory: inspect real system roles, manage tenant affiliations, and control account security."
        icon={Users}
        actions={
          <>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary btn-compact cursor-pointer"
              title="Refresh user list"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={openAddModal} className="btn-primary cursor-pointer">
              <UserPlus size={16} />
              <span>Add User</span>
            </button>
          </>
        }
      />

      {/* Control Bar: Search & Multi-Filters */}
      <div className="mt-6 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
            <input
              type="text"
              placeholder="Search by name, email, organization, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 h-10 w-full text-sm"
            />
          </div>

          {/* Filter Group */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="w-full sm:w-40">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select-field h-10 text-xs font-medium">
                <option value="ALL">All Roles</option>
                {SYSTEM_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Organization Filter */}
            <div className="w-full sm:w-48">
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="select-field h-10 text-xs font-medium">
                <option value="ALL">All Organizations</option>
                <option value="NONE">Platform / Global (No Tenant)</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.name}>{org.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field h-10 text-xs font-medium">
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{users.length}</strong> registered users
          </span>
          {(searchTerm || roleFilter !== 'ALL' || orgFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setOrgFilter('ALL'); setStatusFilter('ALL'); }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Contained horizontal scrolling container */}
        <div className="overflow-x-auto w-full">
          <table className="hcm-table min-w-[950px]">
            <thead className="hcm-thead">
              <tr className="hcm-tr">
                <th className="hcm-th">User Info</th>
                <th className="hcm-th">Organization</th>
                <th className="hcm-th">System Role</th>
                <th className="hcm-th">Status</th>
                <th className="hcm-th">Created Date</th>
                <th className="hcm-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSuperAdmin = user.role === 'SUPERADMIN';
                  const isSelf = user.email === currentUser?.email || user.id === currentUser?.id;
                  const orgName = user.organization?.name || user.organizationName;

                  return (
                    <tr key={user.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* User Info (Name + Email + Employee ID) */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {user.name}
                              </p>
                              {user.employeeProfile?.employeeId && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {user.employeeProfile.employeeId}
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                              <Mail size={12} className="text-slate-400" />
                              <span>{user.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Organization Relationship */}
                      <td className="hcm-td">
                        {orgName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800">
                            <Building2 size={13} className="text-slate-500" />
                            <span>{orgName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                            <Globe size={13} className="text-indigo-500" />
                            <span>Platform / Global</span>
                          </span>
                        )}
                      </td>

                      {/* Actual System Role from Database */}
                      <td className="hcm-td">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
                          <Shield size={12} />
                          <span>{user.role || 'EMPLOYEE'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="hcm-td">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="hcm-td text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="hcm-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit User Button */}
                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit User"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <Edit3 size={15} />
                          </button>

                          {/* Quick Role Switch */}
                          <button
                            onClick={() => {
                              setUserToChangeRole(user);
                              setTargetRole(user.role || 'EMPLOYEE');
                            }}
                            title="Manage Role"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors">
                            <UserCog size={15} />
                          </button>

                          {/* Action Dropdown for Reset Password, Toggle Active, Delete */}
                          <ActionDropdown
                            actions={[
                              {
                                label: 'Reset Password',
                                icon: KeyRound,
                                onClick: () => {
                                  setTargetResetUser(user);
                                  setIsResetModalOpen(true);
                                }
                              },
                              {
                                label: user.isActive ? 'Deactivate Account' : 'Activate Account',
                                icon: Power,
                                danger: user.isActive,
                                onClick: () => handleToggleStatus(user)
                              },
                              ...(!isSuperAdmin && !isSelf ? [{
                                label: 'Delete Account',
                                icon: Trash2,
                                danger: true,
                                onClick: () => setUserToDelete(user)
                              }] : [])
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="hcm-tr">
                  <td colSpan={6} className="p-12 text-center hcm-td text-slate-400">
                    No users match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto z-10 my-auto flex flex-col"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <UserCheck className="text-primary-600" size={22} />
                  <span>{editingUser ? 'Edit User Profile' : 'Create Platform User'}</span>
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">
                    {editingUser ? 'Set New Password (Optional)' : 'Initial Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? "Leave blank to keep current password" : "Min. 6 characters"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* System Role */}
                  <div>
                    <label className="form-label">System Role *</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="select-field"
                    >
                      {SYSTEM_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="form-label">Organization</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => { setSelectedDept(e.target.value); setSelectedActualDeptId(''); }}
                      className="select-field"
                    >
                      <option value="">Platform / Global (No Tenant)</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.name}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDept && (
                  <div>
                    <label className="form-label">Department (Optional)</label>
                    <select
                      value={selectedActualDeptId}
                      onChange={(e) => setSelectedActualDeptId(e.target.value)}
                      className="select-field"
                    >
                      <option value="">All / Organization Wide</option>
                      {departments.filter(d => d.organizationName === selectedDept).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label flex items-center gap-1">
                    <DollarSign size={14} /> Monthly Base Salary (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 6500"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Management Modal */}
      <AnimatePresence>
        {userToChangeRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToChangeRole(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 z-10"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCog className="text-primary-600" size={20} />
                  <span>Change System Role</span>
                </h3>
                <button
                  onClick={() => setUserToChangeRole(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select new authoritative role for <strong className="text-slate-800 dark:text-slate-200">{userToChangeRole.name}</strong> ({userToChangeRole.email}).
                </p>

                <div className="space-y-2">
                  {SYSTEM_ROLES.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        targetRole === r.value
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="targetRole"
                            value={r.value}
                            checked={targetRole === r.value}
                            onChange={() => setTargetRole(r.value)}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{r.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-5">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserToChangeRole(null)}
                  className="btn-secondary btn-compact">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRoleChangeConfirm}
                  className="btn-primary btn-compact">
                  Apply Role Change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setTargetResetUser(null);
        }}
        onConfirm={() => targetResetUser && handleResetPassword(targetResetUser)}
        title="Send Password Reset"
        message={`Trigger an automated password reset procedure for ${targetResetUser?.name} (${targetResetUser?.email})?`}
        confirmText="Send Reset Link"
        type="info"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) deleteUser(userToDelete.id);
          setUserToDelete(null);
        }}
        title="Delete User Account"
        message={`Are you sure you want to delete the user account for ${userToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete Account"
        type="danger"
      />
    </div>
  );
};

export default UserManagement;

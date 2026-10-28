import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  Download, 
  Filter, 
  Users, 
  UserCircle, 
  Upload, 
  Archive, 
  Edit3, 
  Trash2,
  RefreshCw,
  X,
  Layers
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { cn } from '../../utils/cn';
import DepartmentModal from './components/DepartmentModal';
import ConfirmDialog from './components/ConfirmDialog';
import PermissionGate from '../../shared/components/common/PermissionGate';
import ImportModal from '../../shared/components/import/ImportModal';
import PageHeader from '../../shared/components/ui/PageHeader';

const Departments = () => {
  const { departments, deleteDepartment, updateDepartment, fetchDepartments, showToast } = useAdmin();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState(null);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (departments.length === 0) {
        setIsLoading(true);
        try {
          await fetchDepartments();
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [fetchDepartments, departments.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDepartments();
      showToast('Departments updated successfully', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    if (filteredDepts.length === 0) {
      showToast('No department records found to export', 'error');
      return;
    }

    const headers = ['Department Name', 'Dept. Code', 'H.O.D (Head)', 'Employees', 'Status', 'Parent Department', 'Description'];
    const rows = filteredDepts.map(d => [
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.code || '').replace(/"/g, '""')}"`,
      `"${(d.head || 'Not Assigned').replace(/"/g, '""')}"`,
      d.employees || 0,
      `"${d.status || 'Active'}"`,
      `"${(d.parent || 'Corporate').replace(/"/g, '""')}"`,
      `"${(d.description || '').replace(/"/g, '""')}"`
    ]);

    // UTF-8 BOM + CSV
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `departments_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Departments list exported to CSV successfully!', 'success');
  };

  const totalEmployeesInDepts = useMemo(() => {
    return (departments || []).reduce((sum, d) => sum + (Number(d.employees) || 0), 0);
  }, [departments]);

  const assignedHeadsCount = useMemo(() => {
    return (departments || []).filter(d => 
      d.head && 
      d.head.trim() !== '' && 
      d.head.toLowerCase() !== 'not assigned' && 
      d.head.toLowerCase() !== 'none'
    ).length;
  }, [departments]);

  const stats = [
    { 
      label: 'Total Depts', 
      value: departments.length, 
      icon: Building2, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-950/30' 
    },
    { 
      label: 'Total Employees', 
      value: totalEmployeesInDepts, 
      icon: Users, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30' 
    },
    { 
      label: 'Heads Assigned', 
      value: `${assignedHeadsCount} / ${departments.length}`, 
      icon: UserCircle, 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-950/30' 
    },
  ];

  const filteredDepts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return (departments || []).filter(d => {
      const matchesSearch = !q || 
        d.name?.toLowerCase().includes(q) || 
        (d.code || '').toLowerCase().includes(q) ||
        (d.head || '').toLowerCase().includes(q) ||
        (d.parent || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return;
    if (deptToDelete.employees > 0 || deptToDelete.subDepartmentsCount > 0) {
      setDeptToDelete(null);
      return;
    }
    const ok = await deleteDepartment(deptToDelete.id);
    if (ok) {
      setDeptToDelete(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in focus:outline-none">
      {/* Header */}
      <PageHeader
        title="Departments"
        description="Manage your company structure, team categories, and organizational leadership"
        actions={
          <>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="btn-secondary whitespace-nowrap cursor-pointer"
              title="Refresh department records"
            >
              <RefreshCw size={16} className={cn(isRefreshing && "animate-spin text-primary-600")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <PermissionGate module="departments" action="create">
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="btn-secondary whitespace-nowrap cursor-pointer"
                title="Import departments from XLSX or CSV"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
              </button>
            </PermissionGate>

            <PermissionGate module="departments" action="view">
              <button 
                type="button"
                onClick={handleExport}
                className="btn-secondary whitespace-nowrap cursor-pointer"
                title="Export current departments to CSV"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </PermissionGate>

            <PermissionGate module="departments" action="create">
              <button 
                type="button"
                onClick={() => {
                  setDeptToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="btn-primary whitespace-nowrap cursor-pointer"
              >
                <Plus size={18} />
                <span>Add Department</span>
              </button>
            </PermissionGate>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
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

      {/* Filter & Search Bar */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 text-slate-400">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder="Search by department name, code, manager, or parent entity..." 
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
          <div className="flex items-center gap-3">
            <div className="relative min-w-[160px] group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field pl-11 cursor-pointer h-[44px] text-xs font-semibold"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="card p-6 space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md and up) */}
            <div className="hidden md:block card p-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left hcm-table min-w-[680px]">
                  <thead className="hcm-thead">
                    <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                        Department Name
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                        Dept. Code
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                        H.O.D (Head)
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                        Employees
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredDepts.length > 0 ? (
                      filteredDepts.map((dept) => (
                        <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 hcm-td">
                            <div className="flex items-center gap-3.5">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0" 
                                style={{ backgroundColor: dept.color || '#4f46e5' }}
                              >
                                <Building2 size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white tracking-tight truncate">
                                  {dept.name}
                                </p>
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                  <Layers size={12} className="shrink-0" />
                                  <span>{dept.parent || 'Corporate'}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center hcm-td">
                            <code className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg font-mono">
                              {dept.code || '—'}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-center hcm-td">
                            {dept.head && dept.head.trim() !== '' && dept.head.toLowerCase() !== 'none' && dept.head.toLowerCase() !== 'not assigned' ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-primary-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {(dept.head.trim()[0] || 'U').toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                                  {dept.head}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700/80">
                                <UserCircle size={13} className="text-slate-400" />
                                <span>Not Assigned</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center hcm-td">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              <Users size={13} className="text-slate-400 dark:text-slate-500" />
                              <span>{dept.employees || 0}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center hcm-td">
                            <span className={cn(
                              "hcm-badge",
                              dept.status === 'Active' && "hcm-badge-active",
                              dept.status === 'Inactive' && "hcm-badge-inactive",
                              dept.status === 'Archived' && "hcm-badge-archived"
                            )}>
                              {dept.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right hcm-td">
                            <div className="flex justify-end items-center gap-1">
                              <PermissionGate module="departments" action="edit">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setDeptToEdit(dept);
                                    setIsAddModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit Department"
                                >
                                  <Edit3 size={17} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => updateDepartment(dept.id, { 
                                    status: dept.status === 'Archived' ? 'Active' : 'Archived' 
                                  })}
                                  className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={dept.status === 'Archived' ? "Restore Department" : "Archive Department"}
                                >
                                  <Archive size={17} />
                                </button>
                              </PermissionGate>
                              <PermissionGate module="departments" action="delete">
                                <button 
                                  type="button"
                                  onClick={() => setDeptToDelete(dept)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Delete Department"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hcm-tr">
                        <td colSpan="6" className="px-8 py-16 text-center hcm-td">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                              <Building2 size={28} />
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                                {searchTerm || statusFilter !== 'All Status' ? 'No matching departments found' : 'No departments configured yet'}
                              </p>
                              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                {searchTerm || statusFilter !== 'All Status' 
                                  ? 'Try adjusting your search query or status filter' 
                                  : 'Get started by creating your organization’s first department'}
                              </p>
                            </div>
                            {searchTerm || statusFilter !== 'All Status' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm('');
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
                                  setDeptToEdit(null);
                                  setIsAddModalOpen(true);
                                }}
                                className="btn-primary btn-compact mt-2 cursor-pointer"
                              >
                                <Plus size={14} />
                                <span>Create Department</span>
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
              {filteredDepts.length > 0 ? (
                filteredDepts.map((dept) => (
                  <div 
                    key={dept.id} 
                    className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft space-y-4"
                  >
                    {/* Header: Badge, Name, Code & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0" 
                          style={{ backgroundColor: dept.color || '#4f46e5' }}
                        >
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white tracking-tight truncate text-sm">
                            {dept.name}
                          </h4>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Layers size={11} className="shrink-0" />
                            <span>{dept.parent || 'Corporate'}</span>
                          </span>
                        </div>
                      </div>
                      <span className={cn(
                        "hcm-badge shrink-0",
                        dept.status === 'Active' && "hcm-badge-active",
                        dept.status === 'Inactive' && "hcm-badge-inactive",
                        dept.status === 'Archived' && "hcm-badge-archived"
                      )}>
                        {dept.status || 'Active'}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Code</span>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {dept.code || '—'}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">H.O.D</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300 truncate">
                          {dept.head && dept.head !== 'None' ? dept.head : 'Unassigned'}
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Employees</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {dept.employees || 0}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <PermissionGate module="departments" action="edit">
                        <button 
                          type="button"
                          onClick={() => {
                            setDeptToEdit(dept);
                            setIsAddModalOpen(true);
                          }}
                          className="btn-secondary btn-compact cursor-pointer"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateDepartment(dept.id, { 
                            status: dept.status === 'Archived' ? 'Active' : 'Archived' 
                          })}
                          className="btn-secondary btn-compact cursor-pointer"
                        >
                          <Archive size={14} />
                          <span>{dept.status === 'Archived' ? 'Restore' : 'Archive'}</span>
                        </button>
                      </PermissionGate>
                      <PermissionGate module="departments" action="delete">
                        <button 
                          type="button"
                          onClick={() => setDeptToDelete(dept)}
                          className="btn-danger btn-compact cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <Building2 size={24} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No departments found</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search query or status filter</p>
                  {searchTerm || statusFilter !== 'All Status' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
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
                        setDeptToEdit(null);
                        setIsAddModalOpen(true);
                      }}
                      className="btn-primary btn-compact cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Department</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        entity="departments"
        onImportSuccess={() => {
          fetchDepartments();
          showToast('Departments imported successfully', 'success');
        }}
      />

      {/* Department Add/Edit Modal */}
      <DepartmentModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setDeptToEdit(null);
        }}
        deptToEdit={deptToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={
          (deptToDelete?.employees > 0 || deptToDelete?.subDepartmentsCount > 0)
            ? (deptToDelete?.employees > 0
                ? `Cannot delete "${deptToDelete?.name}": it currently has ${deptToDelete.employees} assigned employee(s). Please reassign them in the Employees directory first.`
                : `Cannot delete "${deptToDelete?.name}": it currently has ${deptToDelete.subDepartmentsCount} sub-department(s). Please reassign or delete sub-departments first.`)
            : `Are you sure you want to delete the "${deptToDelete?.name}" department? This action will permanently remove it from the organization.`
        }
        confirmText={(deptToDelete?.employees > 0 || deptToDelete?.subDepartmentsCount > 0) ? "Understood" : "Delete Department"}
        type={(deptToDelete?.employees > 0 || deptToDelete?.subDepartmentsCount > 0) ? "warning" : "danger"}
      />
    </div>
  );
};

export default Departments;

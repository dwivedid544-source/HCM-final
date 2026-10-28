import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Heart, 
  Users, 
  DollarSign, 
  ShieldCheck, 
  Edit3, 
  Ban,
  X,
  Trash2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { cn } from '../../utils/cn';
import BenefitPlanModal from '../../features/admin/components/BenefitPlanModal';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import ActionDropdown from './components/ActionDropdown';
import PermissionGate from '../../shared/components/common/PermissionGate';
import { usePermission } from '../../hooks/usePermission';
import { useCurrency } from '../../hooks/useCurrency';
import PageHeader from '../../shared/components/ui/PageHeader';

const BenefitsConfig = () => {
  const { formatCurrency } = useCurrency();
  const { benefits = [], deleteBenefit, showToast, updateBenefit, addBenefit, fetchBenefits, loading } = useAdmin();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch benefit plans on component mount
  useEffect(() => {
    if (fetchBenefits) {
      fetchBenefits();
    }
  }, [fetchBenefits]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchBenefits) {
      await fetchBenefits();
    }
    setIsRefreshing(false);
    showToast('Benefits synchronized successfully');
  };

  // Dynamic Categories from actual database records
  const uniqueCategories = useMemo(() => {
    const cats = Array.isArray(benefits) ? benefits.map(b => b.category).filter(Boolean) : [];
    return ['All Categories', ...Array.from(new Set(cats))];
  }, [benefits]);

  const filteredBenefits = useMemo(() => {
    return benefits.filter(b => {
      const matchesSearch = (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (b.provider || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All Categories' || b.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || (b.status || 'Active').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [benefits, searchTerm, categoryFilter, statusFilter]);

  // Compute metric totals dynamically
  const { dynamicActiveEnrollees, dynamicTotalContribution } = useMemo(() => {
    let enrollees = 0;
    let totalContribution = 0;

    benefits.forEach(b => {
      if (b.status?.toLowerCase() === 'inactive' || b.status?.toLowerCase() === 'disabled') return;

      const activeForPlan = Array.isArray(b.employeeBenefits) 
        ? b.employeeBenefits.filter(eb => eb.status === 'Active' || eb.status === 'Approved' || eb.status === 'Enrolled').length 
        : 0;
      
      enrollees += activeForPlan;
      
      let val = 0;
      const str = String(b.contribution || b.employerContribution || '0').toLowerCase();
      const matches = str.match(/[\d.]+/g);
      if (matches && matches.length > 0) {
        val = parseFloat(matches[0]);
        if (str.includes('k')) val *= 1000;
      }
      
      totalContribution += (activeForPlan > 0 ? (val * activeForPlan) : val);
    });

    return { dynamicActiveEnrollees: enrollees, dynamicTotalContribution: totalContribution };
  }, [benefits]);

  const stats = [
    { label: 'Total Benefit Plans', value: benefits.length, icon: Heart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Active Enrollees', value: dynamicActiveEnrollees, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Total Contribution', value: formatCurrency(dynamicTotalContribution), icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none text-left">
      {/* Header */}
      <PageHeader
        title="Benefits Configuration"
        description="Design, manage and assign multi-tier employee benefit packages"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              title="Sync latest benefits data"
              className="btn-secondary"
            >
              <RefreshCw size={15} className={cn((isRefreshing || loading) && "animate-spin text-primary-600")} />
              <span>Sync</span>
            </button>

            <PermissionGate module="benefits_config" action="view">
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const csvRows = [
                    ['Plan Name', 'Category', 'Provider', 'Eligibility', 'Contribution', 'Status'].join(','),
                    ...filteredBenefits.map(b => [
                      `"${b.name}"`, 
                      `"${b.category}"`, 
                      `"${b.provider}"`, 
                      `"${b.eligibility}"`, 
                      `"${b.contribution}"`, 
                      `"${b.status}"`
                    ].join(','))
                  ];
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'benefits_audit.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Audit exported to CSV');
                }}>
                <Download size={15} />
                <span className="hidden sm:inline">Export Audit</span>
              </button>
            </PermissionGate>
            <PermissionGate module="benefits_config" action="create">
              <button 
                type="button"
                className="btn-primary cursor-pointer"
                onClick={() => {
                  setPlanToEdit(null);
                  setIsAddModalOpen(true);
                }}>
                <Plus size={16} />
                <span>Create Plan</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
            </div>
            <div className={cn("p-3.5 rounded-2xl shrink-0 shadow-xs", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 w-full text-slate-400 dark:text-slate-500">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by plan name, category or provider..." 
              className="input-field pl-9 h-10 text-xs w-full bg-white dark:bg-slate-900" 
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select-field h-10 text-xs font-bold cursor-pointer"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button 
              type="button"
              onClick={() => setStatusFilter(prev => prev === 'All' ? 'Active' : prev === 'Active' ? 'Disabled' : 'All')}
              className={cn("btn-secondary h-10 cursor-pointer whitespace-nowrap", 
                statusFilter !== 'All' 
                  ? "bg-primary-50 text-primary-600 border border-primary-200" 
                  : "text-slate-600 bg-white"
              )}
            >
              <Filter size={15} />
              <span className="hidden sm:inline">{statusFilter !== 'All' ? `Status: ${statusFilter}` : 'Filter Status'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View (≥ md) */}
        <div className="hidden md:block card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
          <table className="hcm-table w-full text-left">
            <thead className="hcm-thead">
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Benefit Plan</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Category</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Provider</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Eligibility</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Employer Contribution</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Status</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredBenefits.length > 0 ? (
                filteredBenefits.map((plan, idx) => (
                  <tr key={plan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
                    <td className="px-6 py-4 hcm-td">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/40 shadow-xs">
                          <ShieldCheck size={19} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm">{plan.name}</p>
                          {plan.description && <p className="text-xs text-slate-400 truncate max-w-xs">{plan.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center hcm-td">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80">
                        {plan.category || 'Insurance'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hcm-td text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {plan.provider}
                    </td>
                    <td className="px-6 py-4 hcm-td">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200/60">
                        {plan.eligibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 hcm-td font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      {plan.contribution}
                    </td>
                    <td className="px-6 py-4 text-center hcm-td">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border inline-flex items-center gap-1.5",
                        (plan.status || 'Active').toLowerCase() === 'active' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", (plan.status || 'Active').toLowerCase() === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                        <span>{plan.status || 'Active'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right hcm-td select-none">
                      <PermissionGate module="benefits_config" action="edit">
                        <ActionDropdown
                          actions={[
                            {
                              label: 'Edit Details',
                              icon: Edit3,
                              onClick: () => { setPlanToEdit(plan); setIsAddModalOpen(true); }
                            },
                            {
                              label: (plan.status || 'Active').toLowerCase() === 'active' ? 'Disable Plan' : 'Activate Plan',
                              icon: (plan.status || 'Active').toLowerCase() === 'active' ? Ban : CheckCircle2,
                              onClick: () => updateBenefit(plan.id, { status: (plan.status || 'Active').toLowerCase() === 'active' ? 'Disabled' : 'Active' })
                            },
                            {
                              label: 'Duplicate Plan',
                              icon: Plus,
                              onClick: () => addBenefit({
                                name: `${plan.name} (Copy)`,
                                category: plan.category || 'Insurance',
                                provider: plan.provider || 'Internal',
                                eligibility: plan.eligibility || 'All Employees',
                                contribution: plan.contribution || '$0',
                                empContribution: plan.empContribution || '$0.00',
                                description: plan.description || '',
                                autoEnroll: Boolean(plan.autoEnroll)
                              })
                            },
                            {
                              label: 'Delete Plan',
                              icon: Trash2,
                              danger: true,
                              onClick: () => setPlanToDelete(plan)
                            }
                          ]}
                          direction={filteredBenefits.length > 2 && idx >= filteredBenefits.length - 2 ? 'up' : 'down'}
                        />
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="hcm-tr">
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 hcm-td">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3">
                        <Heart size={26} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No benefit plans found</h3>
                      <p className="text-xs text-slate-400 mb-4">Try adjusting your search query or filter settings.</p>
                      <button
                        type="button"
                        onClick={() => { setPlanToEdit(null); setIsAddModalOpen(true); }}
                        className="btn-primary btn-compact cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Create Benefit Plan</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (< md) */}
        <div className="block md:hidden space-y-4">
          {filteredBenefits.length > 0 ? (
            filteredBenefits.map((plan) => (
              <div key={plan.id} className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{plan.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">{plan.provider}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border shrink-0",
                    (plan.status || 'Active').toLowerCase() === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {plan.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Contribution</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{plan.contribution}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Eligibility</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{plan.eligibility}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <PermissionGate module="benefits_config" action="edit">
                    <ActionDropdown
                      actions={[
                        { label: 'Edit Details', icon: Edit3, onClick: () => { setPlanToEdit(plan); setIsAddModalOpen(true); } },
                        { label: (plan.status || 'Active').toLowerCase() === 'active' ? 'Disable Plan' : 'Activate Plan', icon: (plan.status || 'Active').toLowerCase() === 'active' ? Ban : CheckCircle2, onClick: () => updateBenefit(plan.id, { status: (plan.status || 'Active').toLowerCase() === 'active' ? 'Disabled' : 'Active' }) },
                        { label: 'Duplicate Plan', icon: Plus, onClick: () => addBenefit({ name: `${plan.name} (Copy)`, category: plan.category || 'Insurance', provider: plan.provider || 'Internal', eligibility: plan.eligibility || 'All Employees', contribution: plan.contribution || '$0', empContribution: plan.empContribution || '$0.00', description: plan.description || '', autoEnroll: Boolean(plan.autoEnroll) }) },
                        { label: 'Delete Plan', icon: Trash2, danger: true, onClick: () => setPlanToDelete(plan) }
                      ]}
                    />
                  </PermissionGate>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No benefit plans found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BenefitPlanModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setPlanToEdit(null);
        }}
        planToEdit={planToEdit}
      />

      <ConfirmDialog 
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={() => {
          deleteBenefit(planToDelete.id);
          setPlanToDelete(null);
        }}
        title="Delete Benefit Plan"
        message={`Are you sure you want to delete the "${planToDelete?.name}" plan? Enrolled employees will be unassigned from this plan.`}
        confirmText="Delete Plan"
        type="danger"
      />
    </div>
  );
};

export default BenefitsConfig;

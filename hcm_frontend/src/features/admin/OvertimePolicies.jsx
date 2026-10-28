import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Plus, Edit3, Trash2, Search, XCircle, ShieldCheck, Copy, Check, RefreshCw, Zap, AlertCircle, Calendar
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import ActionDropdown from './components/ActionDropdown';
import { cn } from '../../utils/cn';
import PageHeader from '../../shared/components/ui/PageHeader';

// ============================================================
// Add / Edit Overtime Policy Modal
// ============================================================
const OvertimePolicyModal = ({ isOpen, onClose, policyToEdit, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    minOvertimeMin: 30,
    maxOvertimeMin: 240,
    weekdayMultiplier: 1.5,
    weekendMultiplier: 2.0,
    holidayMultiplier: 2.0,
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (policyToEdit) {
      setFormData({
        name: policyToEdit.name || '',
        minOvertimeMin: policyToEdit.minOvertimeMin ?? policyToEdit.minMinutesForOT ?? 30,
        maxOvertimeMin: policyToEdit.maxOvertimeMin ?? 240,
        weekdayMultiplier: policyToEdit.weekdayMultiplier ?? policyToEdit.rateMultiplier ?? 1.5,
        weekendMultiplier: policyToEdit.weekendMultiplier ?? policyToEdit.rateMultiplier ?? 2.0,
        holidayMultiplier: policyToEdit.holidayMultiplier ?? policyToEdit.rateMultiplier ?? 2.0,
        isDefault: Boolean(policyToEdit.isDefault)
      });
    } else {
      setFormData({
        name: '',
        minOvertimeMin: 30,
        maxOvertimeMin: 240,
        weekdayMultiplier: 1.5,
        weekendMultiplier: 2.0,
        holidayMultiplier: 2.0,
        isDefault: false
      });
    }
    setErrors({});
  }, [policyToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Policy name is required.';
    }
    if (formData.minOvertimeMin < 0) {
      errs.minOvertimeMin = 'Minimum overtime threshold cannot be negative.';
    }
    if (formData.maxOvertimeMin <= formData.minOvertimeMin) {
      errs.maxOvertimeMin = 'Maximum overtime cap must be greater than minimum threshold.';
    }
    if (formData.weekdayMultiplier < 1.0) {
      errs.weekdayMultiplier = 'Weekday multiplier must be at least 1.0x.';
    }
    if (formData.weekendMultiplier < 1.0) {
      errs.weekendMultiplier = 'Weekend multiplier must be at least 1.0x.';
    }
    if (formData.holidayMultiplier < 1.0) {
      errs.holidayMultiplier = 'Holiday multiplier must be at least 1.0x.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSave(formData);
    setIsSubmitting(false);
    if (success !== false) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 text-left">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/60 shadow-xs">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {policyToEdit?.id ? 'Edit Overtime Policy' : 'Create Overtime Policy'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure overtime calculation multipliers and daily threshold limits
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                Policy Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Standard 1.5x Overtime Policy, Weekend Double Pay"
                className={cn("input-field w-full", errors.name && "border-rose-500 focus:border-rose-500")}
              />
              {errors.name && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Threshold & Max Cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Min Threshold (Mins) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.minOvertimeMin}
                  onChange={(e) => setFormData({ ...formData, minOvertimeMin: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 30"
                  className={cn("input-field w-full", errors.minOvertimeMin && "border-rose-500")}
                />
                {errors.minOvertimeMin && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.minOvertimeMin}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Max Cap Per Day (Mins) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxOvertimeMin}
                  onChange={(e) => setFormData({ ...formData, maxOvertimeMin: parseInt(e.target.value) || 240 })}
                  placeholder="e.g. 240"
                  className={cn("input-field w-full", errors.maxOvertimeMin && "border-rose-500")}
                />
                {errors.maxOvertimeMin && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.maxOvertimeMin}</p>}
              </div>
            </div>

            {/* Multipliers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Weekday (x) *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.weekdayMultiplier}
                  onChange={(e) => setFormData({ ...formData, weekdayMultiplier: parseFloat(e.target.value) || 1.0 })}
                  className={cn("input-field w-full", errors.weekdayMultiplier && "border-rose-500")}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Weekend (x)
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.weekendMultiplier}
                  onChange={(e) => setFormData({ ...formData, weekendMultiplier: parseFloat(e.target.value) || 1.0 })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Holiday (x)
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.holidayMultiplier}
                  onChange={(e) => setFormData({ ...formData, holidayMultiplier: parseFloat(e.target.value) || 1.0 })}
                  className="input-field w-full"
                />
              </div>
            </div>

            {/* Default Policy Checkbox */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 cursor-pointer select-none form-label">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="checkbox rounded"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Set as Default Overtime Rule
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Payroll calculations will automatically apply this rate multiplier for unassigned staff.
                </p>
              </div>
            </label>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : (policyToEdit ? 'Update Policy' : 'Create Policy')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================================
// Single Policy Desktop Row
// ============================================================
const OvertimePolicyRow = ({ policy, onEdit, onDelete, onDuplicate, onSetDefault }) => {
  const minMins = policy.minOvertimeMin ?? policy.minMinutesForOT ?? 30;
  const maxMins = policy.maxOvertimeMin ?? 240;
  const weekdayRate = policy.weekdayMultiplier ?? policy.rateMultiplier ?? 1.5;
  const weekendRate = policy.weekendMultiplier ?? policy.rateMultiplier ?? 2.0;

  return (
    <tr className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors hcm-tr">
      <td className="px-6 py-4 hcm-td">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40 shadow-xs">
            <Clock size={19} />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm truncate">
                {policy.name}
              </p>
              {policy.isDefault && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Default Rule
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Min Threshold: {minMins}m &bull; Max Daily Cap: {(maxMins / 60).toFixed(1).replace('.0', '')}h ({maxMins}m)
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 hcm-td text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
            {weekdayRate}x Weekday
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold text-xs border border-indigo-200 dark:border-indigo-800">
            {weekendRate}x Weekend
          </span>
        </div>
      </td>
      <td className="px-6 py-4 hcm-td text-right select-none">
        <ActionDropdown 
          actions={[
            { label: 'Edit Policy', icon: Edit3, onClick: () => onEdit(policy) },
            { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate(policy) },
            ...(!policy.isDefault ? [{ label: 'Set as Default', icon: ShieldCheck, onClick: () => onSetDefault(policy) }] : []),
            { label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete(policy) },
          ]}
        />
      </td>
    </tr>
  );
};

// ============================================================
// Main Overtime Policies Feature Component
// ============================================================
const OvertimePolicies = () => {
  const { overtimePolicies = [], fetchOvertimePolicies, createOvertimePolicy, updateOvertimePolicy, deleteOvertimePolicy, loading } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policyToEdit, setPolicyToEdit] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (fetchOvertimePolicies) fetchOvertimePolicies();
  }, [fetchOvertimePolicies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchOvertimePolicies) await fetchOvertimePolicies();
    setIsRefreshing(false);
  };

  const handleSavePolicy = async (formData) => {
    if (policyToEdit?.id) {
      return updateOvertimePolicy(policyToEdit.id, formData);
    } else {
      return createOvertimePolicy(formData);
    }
  };

  const handleDuplicate = (policy) => {
    setPolicyToEdit({
      name: `${policy.name} (Copy)`,
      minOvertimeMin: policy.minOvertimeMin ?? policy.minMinutesForOT ?? 30,
      maxOvertimeMin: policy.maxOvertimeMin ?? 240,
      weekdayMultiplier: policy.weekdayMultiplier ?? policy.rateMultiplier ?? 1.5,
      weekendMultiplier: policy.weekendMultiplier ?? policy.rateMultiplier ?? 2.0,
      holidayMultiplier: policy.holidayMultiplier ?? policy.rateMultiplier ?? 2.0,
      isDefault: false
    });
    setIsModalOpen(true);
  };

  const handleSetDefault = (policy) => {
    updateOvertimePolicy(policy.id, { ...policy, isDefault: true });
  };

  const filteredPolicies = useMemo(() => {
    return overtimePolicies.filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [overtimePolicies, searchTerm]);

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none text-left">
      {/* Header */}
      <PageHeader
        title="Overtime Rules"
        description="Configure overtime calculation policies and multipliers"
        actions={
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleRefresh} 
              title="Refresh policies" 
              className="btn-secondary"
            >
              <RefreshCw size={16} className={cn((isRefreshing || loading) && "animate-spin text-primary-600")} />
            </button>
            <button
              type="button"
              className="btn-primary cursor-pointer"
              onClick={() => { setPolicyToEdit(null); setIsModalOpen(true); }}
            >
              <Plus size={18} />
              <span>Add Policy</span>
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full text-slate-400 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search policies by name..."
            className="input-field pl-9 h-10 text-xs w-full"
          />
        </div>
      </div>

      {/* Desktop Table View (≥ md) */}
      <div className="hidden md:block card p-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="hcm-table w-full text-left">
            <thead className="hcm-thead">
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 hcm-tr border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hcm-th">Policy Details</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-center hcm-th">Multiplier</th>
                <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider text-right hcm-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map(policy => (
                  <OvertimePolicyRow
                    key={policy.id}
                    policy={policy}
                    onEdit={(p) => { setPolicyToEdit(p); setIsModalOpen(true); }}
                    onDelete={setPolicyToDelete}
                    onDuplicate={handleDuplicate}
                    onSetDefault={handleSetDefault}
                  />
                ))
              ) : (
                <tr className="hcm-tr">
                  <td colSpan="3" className="px-4 py-16 text-center hcm-td">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <Clock size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">No overtime policies configured</p>
                        <p className="text-xs text-slate-400 mt-0.5">Click "Add Policy" to create your first overtime rule.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View (< md) */}
      <div className="block md:hidden space-y-4">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => {
            const minMins = policy.minOvertimeMin ?? policy.minMinutesForOT ?? 30;
            const maxMins = policy.maxOvertimeMin ?? 240;
            const weekdayRate = policy.weekdayMultiplier ?? policy.rateMultiplier ?? 1.5;
            const weekendRate = policy.weekendMultiplier ?? policy.rateMultiplier ?? 2.0;

            return (
              <div key={policy.id} className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40 shadow-xs">
                      <Clock size={19} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{policy.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">Threshold: {minMins}m &bull; Max: {maxMins}m</p>
                    </div>
                  </div>
                  {policy.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                      Default
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                    {weekdayRate}x Weekday
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200">
                    {weekendRate}x Weekend
                  </span>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <ActionDropdown 
                    actions={[
                      { label: 'Edit Policy', icon: Edit3, onClick: () => { setPolicyToEdit(policy); setIsModalOpen(true); } },
                      { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(policy) },
                      ...(!policy.isDefault ? [{ label: 'Set as Default', icon: ShieldCheck, onClick: () => handleSetDefault(policy) }] : []),
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setPolicyToDelete(policy) },
                    ]}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No overtime policies configured</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <OvertimePolicyModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setPolicyToEdit(null); }}
          policyToEdit={policyToEdit}
          onSave={handleSavePolicy}
        />
      )}

      <ConfirmDialog
        isOpen={!!policyToDelete}
        onClose={() => setPolicyToDelete(null)}
        onConfirm={() => {
          deleteOvertimePolicy(policyToDelete.id);
          setPolicyToDelete(null);
        }}
        title="Delete Overtime Policy"
        message={`Are you sure you want to delete "${policyToDelete?.name}"? Assigned employee rate multipliers will fall back to the default organization policy.`}
        confirmText="Delete Policy"
        type="danger"
      />
    </div>
  );
};

export default OvertimePolicies;

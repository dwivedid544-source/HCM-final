import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Briefcase, DollarSign, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const BenefitPlanModal = ({ isOpen, onClose, planToEdit }) => {
  const { addBenefit, updateBenefit, showToast } = useAdmin();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Insurance',
    provider: '',
    eligibility: 'All Employees',
    contribution: '',
    empContribution: '',
    autoEnroll: false,
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name || '',
        category: planToEdit.category || 'Insurance',
        provider: planToEdit.provider || '',
        eligibility: planToEdit.eligibility || 'All Employees',
        contribution: planToEdit.contribution || '',
        empContribution: planToEdit.empContribution || '',
        autoEnroll: Boolean(planToEdit.autoEnroll),
        status: planToEdit.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        category: 'Insurance',
        provider: '',
        eligibility: 'All Employees',
        contribution: '',
        empContribution: '',
        autoEnroll: false,
        status: 'Active'
      });
    }
    setErrors({});
  }, [planToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Benefit plan name is required.';
    }
    if (!formData.provider || !formData.provider.trim()) {
      errs.provider = 'Service provider is required.';
    }
    if (!formData.contribution || !formData.contribution.trim()) {
      errs.contribution = 'Employer contribution amount is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (planToEdit?.id) {
        await updateBenefit(planToEdit.id, formData);
      } else {
        await addBenefit(formData);
      }
      onClose();
    } catch (e) {
      console.error('Error saving benefit plan:', e);
    } finally {
      setIsSubmitting(false);
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
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/60 shadow-xs">
                <Heart size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {planToEdit?.id ? 'Edit Benefit Plan' : 'Create Benefit Plan'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure corporate perks, coverage rules, and contribution allocations
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Comprehensive Health & Dental, Gym Stipend"
                className={cn("input-field w-full", errors.name && "border-rose-500")}
              />
              {errors.name && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="select-field w-full"
                >
                  <option>Insurance</option>
                  <option>Wellness</option>
                  <option>Retirement</option>
                  <option>Allowance</option>
                  <option>Reimbursement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Eligible For *
                </label>
                <select
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  className="select-field w-full"
                >
                  <option>All Employees</option>
                  <option>Full-time Only</option>
                  <option>Senior Management</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                Service Provider *
              </label>
              <input
                type="text"
                required
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g. MetLife International, Vanguard, Company Direct"
                className={cn("input-field w-full", errors.provider && "border-rose-500")}
              />
              {errors.provider && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.provider}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Employer Contribution *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contribution}
                  onChange={(e) => setFormData({ ...formData, contribution: e.target.value })}
                  placeholder="e.g. $450/mo or 5% Match"
                  className={cn("input-field w-full", errors.contribution && "border-rose-500")}
                />
                {errors.contribution && <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.contribution}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 form-label">
                  Employee Share
                </label>
                <input
                  type="text"
                  value={formData.empContribution}
                  onChange={(e) => setFormData({ ...formData, empContribution: e.target.value })}
                  placeholder="e.g. $50/mo or $0.00"
                  className="input-field w-full"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 cursor-pointer select-none form-label">
              <input
                type="checkbox"
                checked={formData.autoEnroll}
                onChange={(e) => setFormData({ ...formData, autoEnroll: e.target.checked })}
                className="checkbox rounded"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Auto-Enrolment On Hiring</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Automatically enroll new eligible hires into this plan during onboarding.</p>
              </div>
            </label>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary cursor-pointer">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary cursor-pointer">
                {isSubmitting ? 'Saving...' : (planToEdit?.id ? 'Update Plan' : 'Create Plan')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BenefitPlanModal;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';

const AuditFilterModal = ({ isOpen, onClose, filters, setFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFilters(localFilters);
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
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <form onSubmit={handleSubmit}>
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Filter size={20} />
                   </div>
                   <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Advanced Filters</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Severity</label>
                  <select value={localFilters.severity}onChange={e => setLocalFilters({...localFilters, severity: e.target.value})}>
                    <option>All</option>
                    <option>Security</option>
                    <option>Critical</option>
                    <option>Warning</option>
                    <option>Info</option>
                    <option>System</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Module</label>
                  <select value={localFilters.module}onChange={e => setLocalFilters({...localFilters, module: e.target.value})}>
                    <option>All</option>
                    <option>Auth</option>
                    <option>Payroll</option>
                    <option>Roles</option>
                    <option>Integrations</option>
                    <option>Settings</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Environment</label>
                  <select value={localFilters.environment}onChange={e => setLocalFilters({...localFilters, environment: e.target.value})}>
                    <option>All</option>
                    <option>Production</option>
                    <option>Staging</option>
                  </select>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex gap-4">
                <button type="button" onClick={() => setLocalFilters({ severity: 'All', module: 'All', environment: 'All' })} className="btn-secondary flex-1 h-11 shrink-0">Clear</button>
                <button type="submit" className="btn-primary flex-1 h-11 shrink-0">Apply Filters</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default AuditFilterModal;

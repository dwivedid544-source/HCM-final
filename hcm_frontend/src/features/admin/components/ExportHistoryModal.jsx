import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const ExportHistoryModal = ({ isOpen, onClose }) => {
  const { showToast } = useAdmin();
  const [formData, setFormData] = useState({ dateRange: 'Last 30 Days', status: 'All', format: 'PDF' });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Billing history exported as ${formData.format}`);
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
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Export History</h2>
                  <p className="text-xs font-bold text-slate-500">Download billing records</p>
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
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Date Range</label>
                  <select value={formData.dateRange}onChange={e => setFormData({...formData, dateRange: e.target.value})}>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>This Year</option>
                    <option>All Time</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Status</label>
                  <select value={formData.status}onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option>All</option>
                    <option>Paid</option>
                    <option>Refunded</option>
                    <option>Failed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Format</label>
                  <select value={formData.format}onChange={e => setFormData({...formData, format: e.target.value})}>
                    <option>PDF</option>
                    <option>Excel (CSV)</option>
                    <option>JSON</option>
                  </select>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex gap-4">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11 shrink-0">Cancel</button>
                <button type="submit" className="btn-primary flex-1 h-11 shrink-0"><Download size={16} /> Export</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default ExportHistoryModal;

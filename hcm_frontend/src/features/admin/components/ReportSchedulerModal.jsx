import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Clock, Mail } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const ReportSchedulerModal = ({ isOpen, onClose }) => {
  const { addReportSchedule } = useAdmin();
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'Weekly',
    time: '09:00',
    recipients: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.recipients) return;
    addReportSchedule(formData);
    setFormData({ name: '', frequency: 'Weekly', time: '09:00', recipients: '' });
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
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Schedule Report</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Automate recurring report deliveries</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  id="scheduler-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                    Schedule Name *
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    type="text"
                    placeholder="e.g. Weekly Executive HR Summary"
                    className="input-field h-11 w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                    id="scheduler-name-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                      className="input-field h-11 w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                      id="scheduler-frequency-select"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Bi-Weekly</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                      Delivery Time
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                        className="input-field h-11 w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                        id="scheduler-time-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider form-label">
                    Recipient Emails *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                    <input
                      required
                      value={formData.recipients}
                      onChange={e => setFormData({ ...formData, recipients: e.target.value })}
                      type="text"
                      placeholder="executives@company.com, hr-lead@company.com"
                      className="input-field h-11 w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-medium"
                      id="scheduler-recipients-input"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Separate multiple email addresses with commas</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs"
                  id="scheduler-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                  id="scheduler-save-btn"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportSchedulerModal;

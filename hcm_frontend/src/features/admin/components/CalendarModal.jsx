import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const CalendarModal = ({ isOpen, onClose }) => {
  const { createCalendar, showToast } = useAdmin();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Calendar name is required.', 'error');
      return;
    }
    
    createCalendar({ name, timezone, description });
    
    // Reset form
    setName('');
    setTimezone('UTC');
    setDescription('');
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
            className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <Calendar size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-none dark:text-white">
                    Add Work Calendar
                  </h2>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1.5 leading-none">
                    Create a new schedule
                  </p>
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
            
            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Calendar Name</label>
                  <input 
                    type="text"
                    value={name}onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. US Shift Calendar"
                    className="input-field h-12 bg-slate-50 border-transparent font-bold text-slate-700 w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Timezone</label>
                  <select 
                    value={timezone}onChange={(e) => setTimezone(e.target.value)}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">EST (America/New_York)</option>
                    <option value="America/Los_Angeles">PST (America/Los_Angeles)</option>
                    <option value="Europe/London">GMT (Europe/London)</option>
                    <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                    <option value="Asia/Singapore">SGT (Asia/Singapore)</option>
                    <option value="Australia/Sydney">AEST (Australia/Sydney)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description about this calendar..."
                    className="input-field min-h-[80px] py-3 bg-slate-50 border-transparent font-medium text-slate-700 w-full resize-none"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Create Calendar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CalendarModal;

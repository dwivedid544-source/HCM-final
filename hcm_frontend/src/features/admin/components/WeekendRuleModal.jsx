import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const WeekendRuleModal = ({ isOpen, onClose, selectedCalendarId, setSelectedCalendarId }) => {
  const { calendars, updateCalendar, showToast } = useAdmin();
  const [localCalendarId, setLocalCalendarId] = useState(selectedCalendarId || '');
  const [dayOfWeek, setDayOfWeek] = useState('SATURDAY');
  const [type, setType] = useState('FULL_DAY');

  // Update local state when prop changes
  React.useEffect(() => {
    if (isOpen) {
      setLocalCalendarId(selectedCalendarId || '');
    }
  }, [isOpen, selectedCalendarId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localCalendarId) {
      showToast('Please select a calendar first.', 'error');
      return;
    }
    
    const cal = calendars.find(c => c.id === localCalendarId);
    if (!cal) return;

    const activeVersion = cal?.versions?.[0];
    const existingWeekends = activeVersion?.weekends || [];
    
    if (existingWeekends.some(w => w.dayOfWeek === dayOfWeek)) {
      showToast(`${dayOfWeek} is already added as a weekend rule.`, 'error');
      return;
    }

    const newWeekends = [...existingWeekends, { dayOfWeek, type }];
    updateCalendar(localCalendarId, { weekends: newWeekends.map(w => ({ dayOfWeek: w.dayOfWeek, type: w.type })) });
    
    if (setSelectedCalendarId) {
      setSelectedCalendarId(localCalendarId);
    }
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
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <CalendarDays size={20} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-none dark:text-white">
                    Add Weekend Rule
                  </h2>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1.5 leading-none">
                    Configure Non-Working Days
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
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Work Calendar</label>
                  <select 
                    value={localCalendarId}onChange={(e) => setLocalCalendarId(e.target.value)}>
                    <option value="">-- Select Calendar --</option>
                    {calendars?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Day of Week</label>
                  <select 
                    value={dayOfWeek}onChange={(e) => setDayOfWeek(e.target.value)}>
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                    <option value="SUNDAY">Sunday</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Rule Type</label>
                  <select 
                    value={type}onChange={(e) => setType(e.target.value)}>
                    <option value="FULL_DAY">Full Day</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
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
                  Add Rule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WeekendRuleModal;

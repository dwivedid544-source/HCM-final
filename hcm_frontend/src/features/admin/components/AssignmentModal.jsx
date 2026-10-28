import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const AssignmentModal = ({ isOpen, onClose, selectedCalendarId }) => {
  const { calendars, assignCalendar, showToast, users, departments, shifts } = useAdmin();
  const [localCalendarId, setLocalCalendarId] = useState(selectedCalendarId || '');
  const [entityType, setEntityType] = useState('EMPLOYEE');
  const [entityId, setEntityId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localCalendarId) {
      showToast('Please select a calendar.', 'error');
      return;
    }
    if (!entityId.trim()) {
      showToast('Entity ID is required.', 'error');
      return;
    }
    
    assignCalendar({ 
      calendarId: localCalendarId, 
      entityType, 
      entityId: entityId.trim() 
    });
    
    // Reset fields except calendar
    setEntityId('');
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
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-none dark:text-white">
                    Assign Calendar
                  </h2>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1.5 leading-none">
                    Link to an entity
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
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Calendar</label>
                  <select 
                    value={localCalendarId}onChange={(e) => setLocalCalendarId(e.target.value)}required
                  >
                    <option value="" disabled>Select a Calendar</option>
                    {calendars.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Entity Type</label>
                  <select 
                    value={entityType}onChange={(e) => setEntityType(e.target.value)}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="LOCATION">Location</option>
                    <option value="SHIFT">Shift</option>
                    <option value="BRANCH">Branch</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">
                    Select {entityType.toLowerCase()}
                  </label>
                  
                  {entityType === 'EMPLOYEE' && (
                    <select
                      value={entityId}onChange={(e) => setEntityId(e.target.value)}required
                    >
                      <option value="" disabled>Select an Employee</option>
                      {users?.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  )}
                  
                  {entityType === 'DEPARTMENT' && (
                    <select
                      value={entityId}onChange={(e) => setEntityId(e.target.value)}required
                    >
                      <option value="" disabled>Select a Department (Assigns to all inside)</option>
                      {departments?.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                  
                  {entityType === 'SHIFT' && (
                    <select
                      value={entityId}onChange={(e) => setEntityId(e.target.value)}required
                    >
                      <option value="" disabled>Select a Shift</option>
                      {shifts?.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                      ))}
                    </select>
                  )}
                  
                  {(entityType === 'LOCATION' || entityType === 'BRANCH') && (
                    <input 
                      type="text"
                      value={entityId}onChange={(e) => setEntityId(e.target.value)}
                      placeholder={`Enter ${entityType.toLowerCase()} UUID...`}required
                    />
                  )}
                  
                  <p className="text-xs text-slate-400 px-1 mt-1 font-medium">
                    {entityType === 'EMPLOYEE' 
                      ? "Assigns this calendar to a specific employee only." 
                      : entityType === 'DEPARTMENT' 
                        ? "Assigns this calendar to all employees within this department." 
                        : "Enter the exact ID to link this calendar."}
                  </p>
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
                  Add Assignment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssignmentModal;

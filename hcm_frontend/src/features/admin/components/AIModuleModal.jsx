import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Bot, Sliders } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const AIModuleModal = ({ isOpen, onClose, module }) => {
  const { updateAiModule } = useAdmin();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (module) {
      setFormData({
        status: module.status,
        confidence: module.confidence,
        autoAction: module.settings?.autoAction || false,
        notification: module.settings?.notification || 'None',
        dataSource: module.settings?.dataSource || 'Internal Data',
        refresh: module.settings?.refresh || 'Daily',
        priority: module.settings?.priority || 'Normal',
        notes: module.settings?.notes || '',
        // Specific fields
        minScore: module.settings?.minScore || 80,
        riskThreshold: module.settings?.riskThreshold || 70,
        skillWeight: module.settings?.skillWeight || 50,
        chatTone: module.settings?.chatTone || 'Professional',
      });
    }
  }, [module, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateAiModule(module.id, {
      status: formData.status,
      confidence: formData.confidence,
      settings: formData
    });
    onClose();
  };

  if (!module) return null;

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
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg transform -rotate-6">
                  <Sliders size={22} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-none dark:text-white">
                    Configure Rules
                  </h2>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.2em] mt-2 leading-none">
                    {module.name}
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
              <div className="flex-1 p-10 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Status</label>
                    <select
                      value={formData.status || 'Active'}onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Priority Level</label>
                    <select
                      value={formData.priority || 'Normal'}onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                      <option>Low</option>
                      <option>Normal</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest form-label">Confidence Threshold</label>
                      <span className="text-xs font-bold text-primary-600">{formData.confidence}%</span>
                   </div>
                   <input 
                      type="range" min="0" max="100" 
                      value={formData.confidence || 80}
                      onChange={e => setFormData({...formData, confidence: parseInt(e.target.value)})}/>
                </div>

                {module.name === 'Resume Screening' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Min Acceptable Score</label>
                    <input type="number" value={formData.minScore}onChange={e => setFormData({...formData, minScore: e.target.value})}/>
                  </div>
                )}

                {module.name === 'Attrition Prediction' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Risk Alert Threshold</label>
                    <input type="number" value={formData.riskThreshold}onChange={e => setFormData({...formData, riskThreshold: e.target.value})}/>
                  </div>
                )}

                {module.name === 'Smart Hiring Suggestions' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Skill vs Experience Weight</label>
                    <input type="range" min="0" max="100" value={formData.skillWeight} onChange={e => setFormData({...formData, skillWeight: e.target.value})}/>
                    <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Skills</span>
                        <span>Experience</span>
                    </div>
                  </div>
                )}

                {module.name === 'AI Chat Assistant' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Chat Tone</label>
                    <select value={formData.chatTone}onChange={e => setFormData({...formData, chatTone: e.target.value})}>
                       <option>Professional</option>
                       <option>Friendly</option>
                       <option>Direct</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Refresh Frequency</label>
                    <select value={formData.refresh}onChange={e => setFormData({...formData, refresh: e.target.value})}>
                      <option>Real-time</option>
                      <option>Hourly</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Notification Trigger</label>
                    <select value={formData.notification}onChange={e => setFormData({...formData, notification: e.target.value})}>
                      <option>None</option>
                      <option>On Event</option>
                      <option>Daily Summary</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div>
                       <p className="text-sm font-bold text-slate-900">Auto Execute Action</p>
                       <p className="text-xs text-slate-500 mt-1">Allow AI to directly take actions based on rules.</p>
                   </div>
                   <input type="checkbox" checked={formData.autoAction} onChange={e => setFormData({...formData, autoAction: e.target.checked})}/>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-4 shrink-0">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 h-11">
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIModuleModal;

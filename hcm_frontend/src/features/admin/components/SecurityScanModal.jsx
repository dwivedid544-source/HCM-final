import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Activity } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const SecurityScanModal = ({ isOpen, onClose }) => {
  const { showToast, addSystemLog } = useAdmin();
  const [formData, setFormData] = useState({ scanType: 'Quick', integrations: true, notify: false });
  const [status, setStatus] = useState('idle'); // idle, scanning, finished

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setFormData({ scanType: 'Quick', integrations: true, notify: false });
    }
  }, [isOpen]);

  const handleStart = () => {
    setStatus('scanning');
    setTimeout(() => {
      setStatus('finished');
      addSystemLog({
         user: 'System Bot',
         action: `Completed ${formData.scanType} Scan`,
         module: 'Security',
         ip: 'Internal',
         device: 'Server',
         level: 'System'
      });
      showToast(`Security scan completed. No critical threats found.`);
    }, 4000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={status !== 'scanning' ? onClose : undefined}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                    <ShieldCheck size={20} fill="currentColor" />
                 </div>
                 <div>
                   <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Security Scan</h2>
                   <p className="text-xs font-bold text-slate-500">Run vulnerability checks</p>
                 </div>
              </div>
              {status !== 'scanning' && (
                 <button
                   type="button"
                   onClick={onClose}
                   className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                 >
                   <X size={20} />
                 </button>
              )}
            </div>

            <div className="p-8 space-y-6 bg-slate-50/50">
               {status === 'idle' && (
                 <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Scan Type</label>
                    <select value={formData.scanType}onChange={e => setFormData({...formData, scanType: e.target.value})}>
                      <option>Quick Scan</option>
                      <option>Deep Vulnerability Scan</option>
                      <option>Permissions Audit</option>
                      <option>Login Threats Analysis</option>
                    </select>
                  </div>
                  <div className="w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer" onClick={() => setFormData(p => ({...p, integrations: !p.integrations}))}>
                     <span className="text-xs font-bold text-slate-700">Include Integrations</span>
                     <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.integrations ? 'bg-primary-600' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.integrations ? 'translate-x-5' : ''}`} />
                     </div>
                  </div>
                  <div className="w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer" onClick={() => setFormData(p => ({...p, notify: !p.notify}))}>
                     <span className="text-xs font-bold text-slate-700">Notify Admins on Failure</span>
                     <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${formData.notify ? 'bg-primary-600' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.notify ? 'translate-x-5' : ''}`} />
                     </div>
                  </div>
                 </>
               )}

               {status === 'scanning' && (
                 <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 tracking-tight dark:text-white">Analyzing System...</h3>
                       <p className="text-xs font-bold text-slate-500 font-bold mt-2">{formData.scanType} in progress</p>
                    </div>
                 </div>
               )}

               {status === 'finished' && (
                 <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                       <ShieldCheck size={40} />
                    </div>
                    <div>
                       <h3 className="text-xl font-extrabold text-emerald-600 tracking-tight">Scan Complete</h3>
                       <p className="text-xs font-bold text-slate-500 mt-2">No critical vulnerabilities detected.</p>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4">
                {status === 'idle' && (
                   <button type="button" onClick={handleStart} className="btn-primary w-full">
                      <Activity size={18} /> Start Security Scan
                   </button>
                )}
                {status === 'finished' && (
                  <button type="button" onClick={onClose} className="btn-primary w-full">Done</button>
                )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default SecurityScanModal;

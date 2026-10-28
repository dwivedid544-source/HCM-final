import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Code, Copy } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const APIDocsDrawer = ({ isOpen, onClose }) => {
  const { showToast } = useAdmin();

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-10 w-full max-w-md sm:max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <Terminal size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">API Documentation</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">v2.0 (Stable)</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 text-sm text-slate-600 font-medium">
               <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 font-bold border-b border-slate-100 pb-2 dark:text-white">Base URL</h3>
                  <div className="flex bg-slate-50 p-4 rounded-xl items-center justify-between font-mono text-xs">
                     <span className="text-indigo-600">https://api.system.hcm.io/v2</span>
                     <button type="button" onClick={() => handleCopy('https://api.system.hcm.io/v2')} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Copy URL"><Copy size={16} /></button>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 font-bold border-b border-slate-100 pb-2 dark:text-white">Authentication</h3>
                  <p>All API requests require Bearer token authorization in the HTTP header.</p>
                  <div className="flex bg-slate-900 p-4 rounded-xl items-center justify-between font-mono text-xs text-white">
                     <span>Authorization: Bearer sk_live_...</span>
                     <button type="button" onClick={() => handleCopy('Authorization: Bearer')} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer" title="Copy header"><Copy size={16} /></button>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 font-bold border-b border-slate-100 pb-2 dark:text-white">Example Request</h3>
                  <div className="bg-slate-900 p-6 rounded-2xl relative">
                     <button type="button" onClick={() => handleCopy(`curl -X POST https://api.system.hcm.io/v2/users \\ \n -H "Authorization: Bearer sk_live_123"`)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer" title="Copy snippet"><Copy size={16} /></button>
                     <pre className="font-mono text-xs text-emerald-400 leading-loose">
<span className="text-rose-400">curl</span> -X POST https://api.system.hcm.io/v2/users \
     -H <span className="text-blue-300">"Authorization: Bearer sk_live_123"</span> \
     -H <span className="text-blue-300">"Content-Type: application/json"</span> \
     -d <span className="text-amber-300">{"'{\"name\":\"John\",\"role\":\"Admin\"}'"}</span>
                     </pre>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-900 font-bold border-b border-slate-100 pb-2 dark:text-white">Webhook Events</h3>
                  <div className="hcm-table-container">
<table className="w-full text-xs text-left text-slate-600 font-mono hcm-table">
                     <tbody>
                        <tr className="border-b border-slate-50 hcm-tr"><td className="py-3 font-bold text-indigo-600 hcm-td">user.created</td><td className="py-3 hcm-td">Fired when a new user is provisioned.</td></tr>
                        <tr className="border-b border-slate-50 hcm-tr"><td className="py-3 font-bold text-indigo-600 hcm-td">payroll.processed</td><td className="py-3 hcm-td">Fired upon success of payroll run.</td></tr>
                        <tr className="border-b border-slate-50 hcm-tr"><td className="py-3 font-bold text-indigo-600 hcm-td">policy.signed</td><td className="py-3 hcm-td">Fired when a user acknowledges policy.</td></tr>
                     </tbody>
                  </table>
</div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default APIDocsDrawer;

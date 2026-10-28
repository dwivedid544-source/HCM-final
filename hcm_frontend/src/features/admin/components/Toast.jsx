import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const Toast = () => {
  const { toasts } = useAdmin();

  return (
    <div className="fixed top-5 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-center gap-3.5 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl shadow-2xl w-full min-w-0 sm:min-w-[340px] max-w-md border backdrop-blur-xl transition-all",
              toast.type === 'success' 
                ? "bg-white/95 dark:bg-slate-900/95 border-emerald-300 dark:border-emerald-700/60 text-slate-900 dark:text-white shadow-emerald-500/10" 
                : toast.type === 'error' 
                ? "bg-white/95 dark:bg-slate-900/95 border-rose-400 dark:border-rose-700/60 text-slate-900 dark:text-white shadow-rose-500/10" 
                : "bg-white/95 dark:bg-slate-900/95 border-indigo-300 dark:border-indigo-700/60 text-slate-900 dark:text-white shadow-indigo-500/10"
            )}
          >
            <div className={cn(
              "shrink-0 p-2.5 rounded-xl flex items-center justify-center",
              toast.type === 'success' ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" :
              toast.type === 'error' ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400" :
              "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
            )}>
              {toast.type === 'success' && <CheckCircle2 size={18} className="stroke-[2.5]" />}
              {toast.type === 'error' && <AlertCircle size={18} className="stroke-[2.5]" />}
              {toast.type === 'info' && <Info size={18} className="stroke-[2.5]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-400 mb-0.5">
                {toast.type === 'error' ? 'Validation Warning' : toast.type === 'success' ? 'Success' : 'Notice'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug break-words">
                {toast.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;

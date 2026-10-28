import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const AuditLogDrawer = ({ isOpen, onClose, log, onUpdateLog }) => {
  const { showToast, updateSystemLog } = useAdmin();

  if (!log) return null;

  const actorEmail = typeof log.user === 'object' && log.user !== null 
    ? (log.user.email || 'System Admin') 
    : (log.user || 'System Admin');

  const actorInitial = (actorEmail || 'A')[0].toLowerCase();

  const timestampFormatted = log.createdAt 
    ? new Date(log.createdAt).toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    : (log.time || '10/09/2026, 16:22:26');

  const isFlagged = log.incidentStatus === 'FLAGGED' || log.isFlagged;

  const handleToggleFlag = () => {
    const nextFlagged = !isFlagged;
    const updated = {
      ...log,
      isFlagged: nextFlagged,
      incidentStatus: nextFlagged ? 'FLAGGED' : 'NORMAL'
    };
    updateSystemLog?.(log.id, updated);
    onUpdateLog?.(updated);
    if (nextFlagged) {
      showToast(`Flagged incident for event ${log.action || 'USER_LOGIN'}`, 'warning');
    } else {
      showToast(`Incident flag removed for event ${log.action || 'USER_LOGIN'}`, 'success');
    }
  };

  const handleExportRow = () => {
    const dataStr = JSON.stringify(log, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_${log.action || 'event'}_${log.id || 'record'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Log record exported successfully as JSON');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-20 w-full max-w-md sm:max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
                  {actorInitial}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {log.action || 'USER_LOGIN'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {timestampFormatted}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                aria-label="Close drawer" 
                title="Close" 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Actor */}
                <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                    Actor
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
                    {actorEmail}
                  </span>
                </div>

                {/* Module */}
                <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                    Module
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight block">
                    {log.module || 'USER'}
                  </span>
                </div>

                {/* IP Address */}
                <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                    IP Address
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono block">
                    {log.ipAddress || log.ip || '127.0.0.1'}
                  </span>
                </div>

                {/* Status */}
                <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                    Status
                  </span>
                  <div>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      {log.status || 'SUCCESS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="p-6 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  ACTIVITY SUMMARY
                </span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {log.details || log.description || `${log.action || 'User'} logged in successfully`}
                </p>
              </div>
            </div>
            
            {/* Footer matching screenshot with fixed layout */}
            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 mt-auto shrink-0">
              <button 
                type="button" 
                className={cn(
                  "btn-secondary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors",
                  isFlagged && "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                )} 
                onClick={handleToggleFlag}
              >
                {isFlagged ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <span>Flagged</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>Flag Incident</span>
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" 
                onClick={handleExportRow}
              >
                <Download size={18} className="shrink-0" />
                <span>Export Row</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuditLogDrawer;

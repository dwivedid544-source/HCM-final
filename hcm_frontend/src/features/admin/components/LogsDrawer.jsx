import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const LogsDrawer = ({ isOpen, onClose }) => {
  const { aiLogs } = useAdmin();

  const getIcon = (type) => {
    switch (type) {
      case 'Success': return <CheckCircle2 size={16}/>;
      case 'In Progress': return <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse ml-1" />;
      case 'Queue': return <Clock size={16}/>;
      default: return <AlertCircle size={16}/>;
    }
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
            className="fixed inset-y-0 right-0 z-10 w-full max-w-md sm:max-w-xl bg-slate-950 text-white shadow-2xl flex flex-col border-l border-white/10"
          >
            <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10 text-white">
                  <Terminal size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Inference Logs</h2>
                  <p className="text-xs font-mono text-slate-500 mt-1">tail -f /var/log/ai-engine.log</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
               <div className="space-y-3">
                  {aiLogs.length === 0 ? (
                    <p className="text-slate-600 text-center py-10">No logs found.</p>
                  ) : (
                    aiLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                        <div className="min-w-[70px] text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 truncate">{log.label}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-widest",
                             log.type === 'Success' ? 'text-emerald-500' :
                             log.type === 'In Progress' ? 'text-primary-400' :
                             'text-amber-500'
                           )}>{log.type}</span>
                           {getIcon(log.type)}
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogsDrawer;

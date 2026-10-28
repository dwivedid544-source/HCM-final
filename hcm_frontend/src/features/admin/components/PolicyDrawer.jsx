import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Download, ShieldCheck, Mail, Edit3, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const PolicyDrawer = ({ isOpen, onClose, policy, onEdit }) => {
  const { totalActiveEmployees, sendPolicyReminder, resolvePolicy } = useAdmin();

  if (!policy) return null;

  // Acknowledgment calculations
  const acknowledgedList = policy.policyAcknowledgments || [];
  const ackCount = acknowledgedList.length > 0 
    ? acknowledgedList.length 
    : (typeof policy.acknowledgments === 'string' && policy.acknowledgments.includes('/')
        ? parseInt(policy.acknowledgments.split('/')[0]) || 0
        : parseInt(policy.acknowledgments) || 0);

  const totalTarget = typeof policy.acknowledgments === 'string' && policy.acknowledgments.includes('/')
    ? parseInt(policy.acknowledgments.split('/')[1]) || totalActiveEmployees || 1
    : totalActiveEmployees || 1;

  const ackPercentage = Math.min(100, Math.round((ackCount / Math.max(1, totalTarget)) * 100));

  const handleDownload = () => {
    if (!policy.pdfData) {
      alert('No PDF file attached to this policy.');
      return;
    }
    const a = document.createElement('a');
    a.href = policy.pdfData;
    a.download = policy.pdfName || `${policy.name.replace(/\s+/g, '_')}.pdf`;
    a.target = '_blank';
    a.click();
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
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-primary-600 shadow-sm border border-slate-100 dark:border-slate-700">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{policy.name}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">{policy.category} • V{policy.version || '1.0'}</p>
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
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective Date</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{policy.effectiveDate || policy.date || 'TBD'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deadline / Expiry Date</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{policy.expiryDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <p className={cn(
                    "text-sm font-bold mt-1",
                    policy.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' :
                    policy.status === 'Resolved' ? 'text-blue-600 dark:text-blue-400' :
                    'text-amber-500 dark:text-amber-400'
                  )}>{policy.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner / Department</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{policy.owner || policy.department || 'HR Dept'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2 dark:text-white">Description</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{policy.description || 'No detailed description provided for this policy document.'}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2 dark:text-white">Acknowledgment Progress</h3>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {ackCount}
                      </span>
                      <span className="text-sm font-bold text-slate-400"> / {totalTarget}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{ackPercentage}% Acknowledged</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${ackPercentage}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Acknowledged Employees List */}
              {acknowledgedList.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 dark:text-white">Acknowledged Employees</h3>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-2">
                    {acknowledgedList.map(ack => {
                      const empName = ack.user?.employeeProfile?.fullName || ack.user?.email || 'Employee';
                      const empDept = ack.user?.employeeProfile?.department?.name || 'General';
                      const ackDate = ack.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleDateString() : 'Signed';
                      return (
                        <div key={ack.id} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{empName}</p>
                              <p className="text-[10px] text-slate-400">{empDept}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500">{ackDate}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attached Document section */}
              <div className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={20} className="text-primary-600 shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{policy.pdfName || `${policy.name}.pdf`}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{policy.pdfData ? 'PDF Attachment Ready' : 'No attachment file'}</p>
                  </div>
                </div>
                {policy.pdfData && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Download size={15} /> Download
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3 mt-auto flex-wrap">
              <button 
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  onClose();
                  onEdit(policy);
                }}
              >
                <Edit3 size={16} /> Edit
              </button>
              
              <button
                type="button"
                className="btn-secondary flex-1 text-slate-700 dark:text-slate-200"
                onClick={() => {
                  resolvePolicy(policy.id);
                  onClose();
                }}
              >
                <CheckCircle2 size={16} className="text-emerald-500" />
                {policy.status === 'Resolved' ? 'Reopen Policy' : 'Mark Resolved'}
              </button>

              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => sendPolicyReminder(policy.id)}
              >
                <Mail size={16} /> Remind All
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PolicyDrawer;

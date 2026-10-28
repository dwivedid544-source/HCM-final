import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Loader2 } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { adminAPI } from '../../../utils/apiService';

const ExportAuditModal = ({ isOpen, onClose }) => {
  const { showToast } = useAdmin();
  const [formData, setFormData] = useState({ dateRange: 'Last 7 Days', module: 'All Modules', severity: 'All Severities', format: 'JSON' });
  const [isExporting, setIsExporting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsExporting(true);

    try {
      // Build filters based on formData
      const params = { limit: 5000 }; // Fetch up to 5000 records for the export
      
      if (formData.module !== 'All Modules') {
        params.module = formData.module;
      }
      if (formData.severity !== 'All Severities') {
        params.level = formData.severity;
      }

      // Date range logic
      const now = new Date();
      let startDate;
      if (formData.dateRange === 'Last 24 Hours') startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (formData.dateRange === 'Last 7 Days') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (formData.dateRange === 'Last 30 Days') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (formData.dateRange === 'Year to Date') startDate = new Date(now.getFullYear(), 0, 1);
      
      if (startDate) {
        params.startDate = startDate.toISOString();
      }

      const res = await adminAPI.getAuditLogs(params);
      const logs = res.data?.data || res.data || [];

      if (logs.length === 0) {
        showToast('No logs found for the selected criteria.', 'warning');
        setIsExporting(false);
        return;
      }

      let dataStr;
      let mimeType;
      let extension;

      if (formData.format === 'JSON') {
        dataStr = JSON.stringify(logs, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // Simple CSV fallback
        const headers = ['ID', 'Timestamp', 'Level', 'Module', 'Action', 'User', 'IP Address', 'Details'];
        const rows = logs.map(log => [
          log.id,
          log.createdAt,
          log.level,
          log.module,
          log.action,
          log.user?.email || 'System',
          log.ipAddress,
          `"${(log.details || '').replace(/"/g, '""')}"`
        ]);
        dataStr = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_report_${new Date().getTime()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Audit report generated successfully as ${formData.format}`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to generate audit report', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isExporting ? onClose : undefined}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <form onSubmit={handleSubmit}>
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Export Audit Report</h2>
                  <p className="text-xs font-bold text-slate-500">Generate compliance report</p>
                </div>
                <button type="button" onClick={onClose} disabled={isExporting} className="disabled:opacity-50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Date Range</label>
                  <select disabled={isExporting} value={formData.dateRange} onChange={e => setFormData({...formData, dateRange: e.target.value})} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100">
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Year to Date</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Module</label>
                  <select disabled={isExporting} value={formData.module} onChange={e => setFormData({...formData, module: e.target.value})} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100">
                    <option>All Modules</option>
                    <option>AUTH</option>
                    <option>PAYROLL</option>
                    <option>USER</option>
                    <option>ROLE</option>
                    <option>SETTINGS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Severity</label>
                  <select disabled={isExporting} value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100">
                    <option>All Severities</option>
                    <option>Critical</option>
                    <option>Warning</option>
                    <option>Security</option>
                    <option>Info</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Format</label>
                  <select disabled={isExporting} value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100">
                    <option>JSON</option>
                    <option>CSV</option>
                  </select>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex gap-4">
                <button type="button" onClick={onClose} disabled={isExporting} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isExporting} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex-1 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isExporting ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default ExportAuditModal;

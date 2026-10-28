import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const AuditArchiveModal = ({ isOpen, onClose }) => {
  const { policies = [], showToast, totalActiveEmployees } = useAdmin();
  const [formData, setFormData] = useState({
    dateRange: 'All Time',
    policyType: 'All Types',
    format: 'PDF',
    includeAttachments: false
  });

  const handleGenerate = (e) => {
    e.preventDefault();

    if (!policies.length) {
      showToast('No compliance records available for archive export', 'error');
      return;
    }

    // Filter policies by type and dateRange
    let filtered = policies;
    if (formData.policyType !== 'All Types') {
      filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(formData.policyType.toLowerCase()));
    }

    const now = new Date();
    if (formData.dateRange === 'This Month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(p => new Date(p.createdAt || p.effectiveDate) >= monthStart);
    } else if (formData.dateRange === 'This Year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(p => new Date(p.createdAt || p.effectiveDate) >= yearStart);
    }

    if (!filtered.length) {
      showToast(`No policies found matching range "${formData.dateRange}" and type "${formData.policyType}"`, 'error');
      return;
    }

    if (formData.format.includes('CSV') || formData.format.includes('Excel')) {
      const headers = ['Policy ID', 'Name', 'Category', 'Owner', 'Effective Date', 'Expiry Date', 'Status', 'Acknowledgments'];
      const rows = filtered.map(p => [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.owner || p.department || 'HR'}"`,
        `"${p.effectiveDate || p.date || 'TBD'}"`,
        `"${p.expiryDate || 'N/A'}"`,
        `"${p.status}"`,
        `"${p.acknowledgments || `0/${totalActiveEmployees}`}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance_audit_archive_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`Audit Archive exported as CSV (${filtered.length} records)`, 'success');
      onClose();
    } else {
      // PDF Printable Audit Document
      const printWindow = window.open('', '_blank');
      const dateStr = new Date().toLocaleDateString();
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Compliance Audit Archive Report - ${dateStr}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; }
            h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #1e1b4b; }
            p.sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            .badge-active { background: #dcfce7; color: #166534; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-resolved { background: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <h1>HCM Compliance Audit Archive Report</h1>
          <p class="sub">Generated on ${dateStr} • Filter: ${formData.dateRange} • Type: ${formData.policyType}</p>
          <table>
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Effective Date</th>
                <th>Expiry Date</th>
                <th>Acknowledgments</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.category}</td>
                  <td>${p.owner || p.department || 'HR'}</td>
                  <td>${p.effectiveDate || p.date || 'TBD'}</td>
                  <td>${p.expiryDate || 'N/A'}</td>
                  <td>${p.acknowledgments || `0/${totalActiveEmployees}`}</td>
                  <td><span class="badge ${p.status === 'Active' ? 'badge-active' : p.status === 'Resolved' ? 'badge-resolved' : 'badge-warning'}">${p.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();

      showToast(`Audit Archive PDF report ready (${filtered.length} records)`, 'success');
      onClose();
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
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Audit Archive</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Generate compliance activity & audit reports</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Date Range</label>
                <select 
                  value={formData.dateRange}
                  onChange={e => setFormData({...formData, dateRange: e.target.value})}
                  className="select-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="All Time">All Time</option>
                  <option value="This Month">This Month</option>
                  <option value="This Year">This Year</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Policy Type</label>
                  <select 
                    value={formData.policyType}
                    onChange={e => setFormData({...formData, policyType: e.target.value})}
                    className="select-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="All Types">All Types</option>
                    <option value="HR">HR Policies</option>
                    <option value="Legal">Legal Compliance</option>
                    <option value="Security">Security & Ethics</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Export Format</label>
                  <select 
                    value={formData.format}
                    onChange={e => setFormData({...formData, format: e.target.value})}
                    className="select-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="PDF Document">PDF Document</option>
                    <option value="Excel / CSV">Excel / CSV</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="attachments" 
                  checked={formData.includeAttachments} 
                  onChange={e => setFormData({...formData, includeAttachments: e.target.checked})}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="attachments" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer form-label">
                  Include acknowledgment metadata
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5">
                  <Download size={16} /> Generate Archive
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuditArchiveModal;

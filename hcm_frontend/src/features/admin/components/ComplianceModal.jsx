import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileBadge, X, ShieldCheck, Download, Paperclip, Trash2, Calendar } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import DatePicker from '../../../shared/components/common/DatePicker';
import { uploadAPI } from '../../../utils/apiService';
import { validateFile } from '../../../utils/fileValidator';

const ComplianceModal = ({ isOpen, onClose, policy, isRenewing = false }) => {
  const { addPolicy, updatePolicy, renewPolicy, departments = [], showToast } = useAdmin();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Internal Policy',
    department: 'Human Resources',
    owner: 'HR Dept',
    effectiveDate: '',
    expiryDate: '',
    version: '1.0',
    requiresSignature: true,
    status: 'Active',
    description: '',
    pdfName: '',
    pdfData: ''
  });
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = React.useRef(null);

  useEffect(() => {
    if (policy) {
      let nextVersion = policy.version || '1.0';
      if (isRenewing) {
        const numVer = parseFloat(nextVersion);
        nextVersion = !isNaN(numVer) ? (numVer + 1.0).toFixed(1) : '2.0';
      }

      setFormData({
        name: policy.name || '',
        category: policy.category || 'Internal Policy',
        department: policy.department || 'Human Resources',
        owner: policy.owner || 'HR Dept',
        effectiveDate: policy.effectiveDate || policy.date || '',
        expiryDate: policy.expiryDate || '',
        version: nextVersion,
        requiresSignature: policy.requiresSignature !== undefined ? policy.requiresSignature : true,
        status: isRenewing ? 'Active' : (policy.status || 'Active'),
        description: policy.description || '',
        pdfName: policy.pdfName || '',
        pdfData: policy.pdfData || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Internal Policy',
        department: 'Human Resources',
        owner: 'HR Dept',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        version: '1.0',
        requiresSignature: true,
        status: 'Active',
        description: '',
        pdfName: '',
        pdfData: ''
      });
    }
  }, [policy, isOpen, isRenewing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Policy Title is required', 'error');
      return;
    }

    try {
      if (isRenewing && policy) {
        await renewPolicy(policy.id, {
          ...formData,
          date: formData.effectiveDate || 'TBD'
        });
      } else if (policy) {
        await updatePolicy(policy.id, {
          ...formData,
          date: formData.effectiveDate || 'TBD'
        });
      } else {
        await addPolicy({
          ...formData,
          date: formData.effectiveDate || 'TBD',
          acknowledgments: '0'
        });
      }
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file, ['pdf'], 10);
    if (!v.isValid) { showToast(v.message, 'error'); return; }
    setIsUploadingPdf(true);
    try {
      const res = await uploadAPI.uploadDocument(file, 'hcm/policies');
      const cloudUrl = res.data?.data?.url;
      if (cloudUrl) {
        setFormData(prev => ({ ...prev, pdfName: file.name, pdfData: cloudUrl }));
        showToast('Policy PDF uploaded successfully!', 'success');
        return;
      }
    } catch (uploadErr) {
      console.warn('Policy PDF upload failed, using fallback:', uploadErr.message);
    } finally {
      setIsUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
    // Base64 fallback
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, pdfName: file.name, pdfData: reader.result }));
      showToast('Policy PDF loaded locally', 'info');
    };
    reader.readAsDataURL(file);
  };

  const modalTitle = isRenewing ? 'Renew Policy' : (policy ? 'Edit Policy' : 'Publish Policy');

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
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md">
                    <FileBadge size={22} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{modalTitle}</h2>
                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] mt-2 leading-none">
                      {isRenewing ? 'Reset employee acknowledgments & update version' : 'Secure workforce agreement'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
                  <X size={22} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Policy Title *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Workplace Ethics & Security Policy 2026"
                    className="input-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="select-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="Internal Policy">Internal Policy</option>
                      <option value="Legal Compliance">Legal Compliance</option>
                      <option value="Ethics & Conduct">Ethics & Conduct</option>
                      <option value="Health & Safety">Health & Safety</option>
                      <option value="Information Security">Information Security</option>
                      <option value="HR Policy">HR Policy</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Version</label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={e => setFormData({...formData, version: e.target.value})}
                      placeholder="1.0"
                      className="input-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Effective Date</label>
                    <DatePicker value={formData.effectiveDate} onChange={e => setFormData({...formData, effectiveDate: e.target.value})}/>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Deadline / Expiry Date</label>
                    <DatePicker value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Primary Owner / Dept</label>
                    <select
                      value={formData.owner}
                      onChange={e => setFormData({...formData, owner: e.target.value, department: e.target.value})}
                      className="select-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="HR Dept">HR Dept</option>
                      <option value="Legal">Legal</option>
                      <option value="Security">Security</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="select-field w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Renewing">Renewing</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 form-label">Description & Directives</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide detailed instructions or policy compliance context for employees..."
                    className="input-field w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Upload Section */}
                <div
                  className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                    {isUploadingPdf
                      ? <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                      : <Download className="transform rotate-180" size={24} />
                    }
                  </div>
                  <div className="text-center">
                    {formData.pdfName ? (
                      <div className="flex items-center justify-center gap-2">
                        <Paperclip size={14} className="text-primary-600" />
                        <span className="text-sm font-bold text-primary-700 dark:text-primary-300 truncate max-w-[240px]">{formData.pdfName}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, pdfName: '', pdfData: '' })); }}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">Upload Policy PDF Document</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">PDF up to 10MB • Secured cloud storage</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-primary-600" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Requires Signature / Acknowledgment</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.requiresSignature}
                      onChange={e => setFormData({...formData, requiresSignature: e.target.checked})}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Employees must read and digitally acknowledge this document before their compliance record is marked clean.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3 shrink-0 mt-auto">
                <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5">
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6 py-2.5">
                  {isRenewing ? 'Confirm Renewal' : (policy ? 'Save Changes' : 'Publish Policy')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ComplianceModal;

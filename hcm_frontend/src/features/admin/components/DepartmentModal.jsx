import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  Terminal, 
  UserCircle, 
  ChevronRight, 
  Grid,
  Palette,
  FileText,
  Layers,
  Loader2
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';

const DepartmentModal = ({ isOpen, onClose, deptToEdit = null }) => {
  const { users, departments, addDepartment, updateDepartment } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    head: '',
    parent: 'Corporate',
    parentId: null,
    description: '',
    color: '#4f46e5',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (deptToEdit) {
      setFormData({
        name: deptToEdit.name || '',
        code: deptToEdit.code || '',
        head: deptToEdit.head || '',
        parent: deptToEdit.parent || 'Corporate',
        parentId: deptToEdit.parentId || null,
        description: deptToEdit.description || '',
        color: deptToEdit.color || '#4f46e5',
        status: deptToEdit.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        code: '',
        head: '',
        parent: 'Corporate',
        parentId: null,
        description: '',
        color: '#4f46e5',
        status: 'Active'
      });
    }
    setErrors({});
  }, [deptToEdit, isOpen]);

  // Eligible managers/leads for Head of Dept.
  const eligibleHeads = useMemo(() => {
    return (users || []).filter(u => {
      const role = (u.role || '').toLowerCase();
      return u.status === 'Active' && !role.includes('candidate');
    });
  }, [users]);

  // Eligible parent departments (exclude self)
  const eligibleParents = useMemo(() => {
    return (departments || []).filter(d => !deptToEdit || d.id !== deptToEdit.id);
  }, [departments, deptToEdit]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Department name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    } else {
      const isDuplicateCode = departments.some(d => 
        (!deptToEdit || d.id !== deptToEdit.id) &&
        (d.code || '').trim().toLowerCase() === formData.code.trim().toLowerCase()
      );
      if (isDuplicateCode) {
        newErrors.code = 'Department code must be unique in organization';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (deptToEdit) {
        await updateDepartment(deptToEdit.id, formData);
      } else {
        await addDepartment(formData);
      }
      onClose();
    } catch {
      // Errors handled via context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate 3-letter code from name if creating new and code wasn't manually edited
      if (name === 'name' && !deptToEdit && (!prev.code || prev.code === prev.name.slice(0, 3).toUpperCase())) {
        updated.code = value.slice(0, 3).toUpperCase();
      }
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleParentChange = (e) => {
    const selectedParentName = e.target.value;
    if (selectedParentName === 'Corporate') {
      setFormData(prev => ({
        ...prev,
        parent: 'Corporate',
        parentId: null
      }));
    } else {
      const foundParent = eligibleParents.find(p => p.name === selectedParentName);
      setFormData(prev => ({
        ...prev,
        parent: selectedParentName,
        parentId: foundParent ? foundParent.id : null
      }));
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
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-4">
                <div 
                  className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-md transition-colors"
                  style={{ backgroundColor: formData.color || '#4f46e5' }}
                >
                  <Grid size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {deptToEdit ? 'Edit Department' : 'Create New Department'}
                  </h2>
                  <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mt-0.5">
                    Organizational Structure
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-5 sm:p-6 space-y-5">
                {/* Department Name */}
                <div className="space-y-1.5">
                  <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Engineering, Marketing, Finance" 
                      className={cn(
                        "input-field pl-11",
                        errors.name && "border-rose-400 focus:ring-rose-400"
                      )}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name}</p>}
                </div>

                {/* Code & Head of Dept */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Dept. Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={18} />
                      <input 
                        type="text" 
                        name="code"
                        required
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="ENG" 
                        maxLength={10}
                        className={cn(
                          "input-field pl-11 uppercase font-mono",
                          errors.code && "border-rose-400 focus:ring-rose-400"
                        )}
                      />
                    </div>
                    {errors.code && <p className="text-xs text-rose-500 font-medium">{errors.code}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Head of Department (H.O.D)
                    </label>
                    <div className="relative group">
                      <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <select 
                        name="head"
                        value={formData.head}
                        onChange={handleChange}
                        className="select-field pl-11 cursor-pointer"
                      >
                        <option value="">Not Assigned</option>
                        {eligibleHeads.map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name} {u.role ? `(${u.role})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parent Entity & Brand Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Parent Entity / Group
                    </label>
                    <div className="relative group">
                      <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <select 
                        name="parent"
                        value={formData.parent}
                        onChange={handleParentChange}
                        className="select-field pl-11 cursor-pointer"
                      >
                        <option value="Corporate">Corporate (Top Level)</option>
                        {eligibleParents.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Brand Accent Color
                    </label>
                    <div className="relative group">
                      <Palette className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                      <div className="flex items-center gap-3 input-field pl-11 h-[44px]">
                        <input 
                          type="color" 
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {formData.color}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="space-y-1.5">
                  <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Department Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Active', 'Inactive', 'Archived'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: s }))}
                        className={cn(
                          "py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center cursor-pointer",
                          formData.status === s 
                            ? "bg-primary-600 text-white border-primary-600 shadow-sm" 
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope Description */}
                <div className="space-y-1.5">
                  <label className="form-label text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Description & Key Functions
                  </label>
                  <div className="relative group">
                    <FileText className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" size={18} />
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe the primary mission, goals, and focus areas of this department..."
                      className="textarea-field pl-11 min-h-[90px]"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3 mt-auto">
                <button 
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{deptToEdit ? 'Save Changes' : 'Create Department'}</span>
                  {!isSubmitting && <ChevronRight size={16} />}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DepartmentModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Plus, Edit3, Trash2 } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import DatePicker from '../../../shared/components/common/DatePicker';

const TaxRulesModal = ({ isOpen, onClose }) => {
  const { taxRules, addTaxRule, updateTaxRule, deleteTaxRule } = useAdmin();
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [ruleToEdit, setRuleToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    region: 'Global',
    slabType: 'Progressive',
    percentage: '',
    minSalary: '',
    maxSalary: '',
    effectiveDate: '',
    status: 'Active'
  });

  useEffect(() => {
    if (isOpen) setView('list');
  }, [isOpen]);

  const handleEdit = (rule) => {
    setRuleToEdit(rule);
    setFormData(rule);
    setView('form');
  };

  const handleAdd = () => {
    setRuleToEdit(null);
    setFormData({
      name: '',
      region: 'Global',
      slabType: 'Progressive',
      percentage: '',
      minSalary: '',
      maxSalary: '',
      effectiveDate: '',
      status: 'Active'
    });
    setView('form');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ruleToEdit) {
      updateTaxRule(ruleToEdit.id, formData);
    } else {
      addTaxRule(formData);
    }
    setView('list');
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
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg transform -rotate-6">
                  <Calculator size={22} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-none dark:text-white">
                    Tax Rules Configuration
                  </h2>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.2em] mt-2 leading-none">
                    Manage slabs & regions
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {view === 'list' && (
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex justify-end">
                  <button type="button" onClick={handleAdd} className="btn-primary">
                    <Plus size={16} /> Add Rule
                  </button>
                </div>
                {taxRules.length === 0 ? (
                  <p className="text-center text-slate-400 mt-10 text-sm font-medium">No tax rules defined.</p>
                ) : (
                  <div className="space-y-4">
                    {taxRules.map(rule => (
                      <div key={rule.id}>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{rule.name} <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] uppercase">{rule.region}</span></h4>
                          <p className="text-xs text-slate-500 mt-1">{rule.percentage}% • {rule.slabType} • {rule.status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button  onClick={() => handleEdit(rule)} aria-label="Edit tax rule" title="Edit" className="btn-ghost p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit3 size={16} /></button>
                          <button  onClick={() => deleteTaxRule(rule.id)} aria-label="Delete tax rule" title="Delete" className="btn-danger p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'form' && (
              <form onSubmit={handleSubmit}>
                <div className="flex-1 p-10 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Rule Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Standard Federal Tax"
                      className="input-field h-14 bg-slate-50 border-transparent font-bold text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 font-bold px-1 form-label">Region</label>
                      <select
                        value={formData.region}onChange={(e) => setFormData({...formData, region: e.target.value})}>
                        <option>Global</option>
                        <option>USA</option>
                        <option>India</option>
                        <option>Europe</option>
                        <option>APAC</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Slab Type</label>
                      <select
                        value={formData.slabType}onChange={(e) => setFormData({...formData, slabType: e.target.value})}>
                        <option>Progressive</option>
                        <option>Flat</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Percentage (%)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={formData.percentage}onChange={(e) => setFormData({...formData, percentage: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Status</label>
                      <select
                        value={formData.status}onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Min Salary</label>
                      <input
                        required
                        type="number"
                        value={formData.minSalary}onChange={(e) => setFormData({...formData, minSalary: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Max Salary</label>
                      <input
                        required
                        type="number"
                        value={formData.maxSalary}onChange={(e) => setFormData({...formData, maxSalary: e.target.value})}/>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 form-label">Effective Date</label>
                    <DatePicker required
                      
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}/>
                  </div>
                </div>
                
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end gap-4 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setView('list')}
                    className="btn-secondary"
                  >
                    Back to List
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaxRulesModal;

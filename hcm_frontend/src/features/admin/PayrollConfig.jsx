import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Calculator, 
  ShieldAlert, 
  FileText, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Check, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Percent, 
  DollarSign, 
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Info,
  Scale
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { payrollConfigAPI } from '../../utils/apiService';
import { useCurrency } from '../../hooks/useCurrency';
import CenterModal from '../../shared/components/layout/CenterModal';
import ConfirmDialog from './components/ConfirmDialog';
import { cn } from '../../utils/cn';
import PageHeader from '../../shared/components/ui/PageHeader';

const PayrollConfig = () => {
  const { showToast } = useAdmin();
  const { formatCurrency, getSymbol } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = ['structures', 'components', 'deductions', 'taxes'];

  const getInitialTab = () => {
    const urlTab = searchParams.get('tab') || searchParams.get('section');
    if (urlTab && validTabs.includes(urlTab)) return urlTab;
    const saved = localStorage.getItem('hcm_payroll_config_tab');
    if (saved && validTabs.includes(saved)) return saved;
    return 'structures';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    localStorage.setItem('hcm_payroll_config_tab', tabKey);
    setSearchParams({ tab: tabKey });
  };

  useEffect(() => {
    const urlTab = searchParams.get('tab') || searchParams.get('section');
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
      localStorage.setItem('hcm_payroll_config_tab', urlTab);
    }
  }, [searchParams]);

  // Data states
  const [structures, setStructures] = useState([]);
  const [components, setComponents] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal Open States
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showViewStructureModal, setShowViewStructureModal] = useState(false);
  const [selectedStructureForView, setSelectedStructureForView] = useState(null);
  const [editingStructureId, setEditingStructureId] = useState(null);

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState(null);

  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [editingDeductionId, setEditingDeductionId] = useState(null);

  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showViewTaxModal, setShowViewTaxModal] = useState(false);
  const [selectedTaxForView, setSelectedTaxForView] = useState(null);
  const [editingTaxId, setEditingTaxId] = useState(null);

  // Confirm Delete Dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Forms
  const [structureForm, setStructureForm] = useState({
    name: '',
    description: '',
    currency: 'USD',
    isDefault: false,
    components: [] // [{ componentId, sequence }]
  });

  const [componentForm, setComponentForm] = useState({
    name: '',
    code: '',
    category: 'Earning',
    calculationBase: 'Basic',
    calculationType: 'Percentage',
    value: '',
    isTaxable: true,
    isAutoBalance: false,
    isEmployerContribution: false,
    isEmployeeDeduction: false,
    formula: '',
    roundingRule: 'Nearest',
    displayOrder: 0
  });

  const [deductionForm, setDeductionForm] = useState({
    name: '',
    code: '',
    category: 'PF',
    valueType: 'Fixed',
    value: '',
    isPreTax: false
  });

  const [taxForm, setTaxForm] = useState({
    name: '',
    country: '',
    state: '',
    description: '',
    slabs: [
      { min: 0, max: 250000, rate: 0, baseTax: 0 },
      { min: 250000, max: 500000, rate: 5, baseTax: 0 },
      { min: 500000, max: 1000000, rate: 20, baseTax: 12500 },
      { min: 1000000, max: null, rate: 30, baseTax: 112500 }
    ]
  });

  // Fetch all config data
  const fetchConfig = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // Always fetch master components as structures modal needs them
      const [structRes, compRes, dedRes, taxRes] = await Promise.all([
        payrollConfigAPI.getStructures().catch(() => ({ data: [] })),
        payrollConfigAPI.getComponents().catch(() => ({ data: [] })),
        payrollConfigAPI.getDeductions().catch(() => ({ data: [] })),
        payrollConfigAPI.getTaxes().catch(() => ({ data: [] }))
      ]);

      const extractData = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.data)) return res.data.data;
        return [];
      };

      setStructures(extractData(structRes));
      setComponents(extractData(compRes));
      setDeductions(extractData(dedRes));
      setTaxes(extractData(taxRes));
    } catch (err) {
      console.error('Failed to fetch payroll configuration:', err);
      showToast('Failed to load payroll configuration', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [activeTab]);

  // ============================================================
  // SALARY STRUCTURE HANDLERS
  // ============================================================
  const handleOpenAddStructure = () => {
    setEditingStructureId(null);
    setStructureForm({
      name: '',
      description: '',
      currency: 'USD',
      isDefault: structures.length === 0,
      components: components.map((c, idx) => ({ componentId: c.id, sequence: idx + 1 }))
    });
    setShowStructureModal(true);
  };

  const handleOpenEditStructure = (struct) => {
    setEditingStructureId(struct.id);
    const activeVer = struct.versions?.[0];
    const existingCompMap = activeVer?.components || [];
    
    // Build list of selected components with their sequence
    const mappedComponents = existingCompMap.map((sc, idx) => ({
      componentId: sc.componentId || sc.salaryComponent?.id,
      sequence: sc.sequence || (idx + 1)
    })).filter(x => !!x.componentId);

    setStructureForm({
      name: struct.name || '',
      description: struct.description || '',
      currency: struct.currency || 'USD',
      isDefault: Boolean(struct.isDefault),
      components: mappedComponents.length > 0 ? mappedComponents : components.map((c, idx) => ({ componentId: c.id, sequence: idx + 1 }))
    });
    setShowStructureModal(true);
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (!structureForm.name.trim()) {
      showToast('Structure name is required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      if (editingStructureId) {
        await payrollConfigAPI.updateStructure(editingStructureId, structureForm);
        showToast('Salary structure updated successfully', 'success');
      } else {
        await payrollConfigAPI.createStructure(structureForm);
        showToast('Salary structure created successfully', 'success');
      }
      setShowStructureModal(false);
      setEditingStructureId(null);
      await fetchConfig(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving salary structure', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultStructure = async (s) => {
    try {
      await payrollConfigAPI.setDefaultStructure(s.id);
      showToast(`'${s.name}' is now the default salary structure`, 'success');
      await fetchConfig(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error setting default structure', 'error');
    }
  };

  const handleDeleteStructure = (struct) => {
    const assignedCount = struct._count?.compensations || 0;
    if (assignedCount > 0) {
      setDeleteDialog({
        isOpen: true,
        title: 'Cannot Delete Salary Structure',
        message: `This structure cannot be deleted because ${assignedCount} active employee(s) are currently assigned to it. Please reassign those employees to another structure first.`,
        confirmText: 'Understood',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    setDeleteDialog({
      isOpen: true,
      title: 'Delete Salary Structure',
      message: `Are you sure you want to delete '${struct.name}'? This action cannot be undone.`,
      confirmText: 'Delete Structure',
      type: 'danger',
      onConfirm: async () => {
        try {
          await payrollConfigAPI.deleteStructure(struct.id);
          showToast('Salary structure deleted successfully', 'success');
          await fetchConfig(true);
        } catch (err) {
          showToast(err.response?.data?.message || 'Error deleting structure', 'error');
        }
      }
    });
  };

  const handleToggleStructureComponent = (compId) => {
    setStructureForm(prev => {
      const exists = prev.components.some(c => c.componentId === compId);
      if (exists) {
        const filtered = prev.components.filter(c => c.componentId !== compId);
        // Re-index sequences
        return {
          ...prev,
          components: filtered.map((c, i) => ({ ...c, sequence: i + 1 }))
        };
      } else {
        return {
          ...prev,
          components: [...prev.components, { componentId: compId, sequence: prev.components.length + 1 }]
        };
      }
    });
  };

  const handleMoveStructureComponent = (index, direction) => {
    setStructureForm(prev => {
      const list = [...prev.components];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        components: list.map((c, i) => ({ ...c, sequence: i + 1 }))
      };
    });
  };

  // ============================================================
  // MASTER COMPONENT HANDLERS
  // ============================================================
  const handleOpenAddComponent = () => {
    setEditingComponentId(null);
    setComponentForm({
      name: '',
      code: '',
      category: 'Earning',
      calculationBase: 'Basic',
      calculationType: 'Percentage',
      value: '',
      isTaxable: true,
      isAutoBalance: false,
      isEmployerContribution: false,
      isEmployeeDeduction: false,
      formula: '',
      roundingRule: 'Nearest',
      displayOrder: components.length + 1
    });
    setShowComponentModal(true);
  };

  const handleOpenEditComponent = (comp) => {
    setEditingComponentId(comp.id);
    setComponentForm({
      name: comp.name || '',
      code: comp.code || '',
      category: comp.category || 'Earning',
      calculationBase: comp.calculationBase || 'Basic',
      calculationType: comp.calculationType || 'Percentage',
      value: comp.value !== null && comp.value !== undefined ? String(comp.value) : '',
      isTaxable: Boolean(comp.isTaxable),
      isAutoBalance: Boolean(comp.isAutoBalance),
      isEmployerContribution: Boolean(comp.isEmployerContribution),
      isEmployeeDeduction: Boolean(comp.isEmployeeDeduction),
      formula: comp.formula || '',
      roundingRule: comp.roundingRule || 'Nearest',
      displayOrder: comp.displayOrder || 0
    });
    setShowComponentModal(true);
  };

  const handleSaveComponent = async (e) => {
    e.preventDefault();
    if (!componentForm.name.trim() || !componentForm.code.trim()) {
      showToast('Component name and code are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...componentForm,
        code: componentForm.code.trim().toUpperCase(),
        displayOrder: Number(componentForm.displayOrder) || 0
      };

      if (editingComponentId) {
        await payrollConfigAPI.updateComponent(editingComponentId, payload);
        showToast('Salary component updated successfully', 'success');
      } else {
        await payrollConfigAPI.createComponent(payload);
        showToast('Salary component created successfully', 'success');
      }
      setShowComponentModal(false);
      setEditingComponentId(null);
      await fetchConfig(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving component', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComponent = (comp) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Delete Master Component',
      message: `Are you sure you want to delete component '${comp.name}' (${comp.code})? It will be removed if it is not currently used by active structures.`,
      confirmText: 'Delete Component',
      type: 'danger',
      onConfirm: async () => {
        try {
          await payrollConfigAPI.deleteComponent(comp.id);
          showToast('Salary component deleted successfully', 'success');
          await fetchConfig(true);
        } catch (err) {
          showToast(err.response?.data?.message || 'Error deleting component', 'error');
        }
      }
    });
  };

  // ============================================================
  // DEDUCTION HANDLERS
  // ============================================================
  const handleOpenAddDeduction = () => {
    setEditingDeductionId(null);
    setDeductionForm({
      name: '',
      code: '',
      category: 'PF',
      valueType: 'Fixed',
      value: '',
      isPreTax: false
    });
    setShowDeductionModal(true);
  };

  const handleOpenEditDeduction = (ded) => {
    setEditingDeductionId(ded.id);
    setDeductionForm({
      name: ded.name || '',
      code: ded.code || '',
      category: ded.category || 'PF',
      valueType: ded.valueType || 'Fixed',
      value: ded.value !== null && ded.value !== undefined ? String(ded.value) : '',
      isPreTax: Boolean(ded.isPreTax)
    });
    setShowDeductionModal(true);
  };

  const handleSaveDeduction = async (e) => {
    e.preventDefault();
    if (!deductionForm.name.trim() || !deductionForm.code.trim()) {
      showToast('Deduction name and code are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...deductionForm,
        code: deductionForm.code.trim().toUpperCase()
      };
      if (editingDeductionId) {
        await payrollConfigAPI.updateDeduction(editingDeductionId, payload);
        showToast('Deduction rule updated successfully', 'success');
      } else {
        await payrollConfigAPI.createDeduction(payload);
        showToast('Deduction rule added successfully', 'success');
      }
      setShowDeductionModal(false);
      setEditingDeductionId(null);
      await fetchConfig(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving deduction rule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeduction = (ded) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Delete Deduction Rule',
      message: `Are you sure you want to delete deduction rule '${ded.name}' (${ded.code})?`,
      confirmText: 'Delete Rule',
      type: 'danger',
      onConfirm: async () => {
        try {
          await payrollConfigAPI.deleteDeduction(ded.id);
          showToast('Deduction rule deleted successfully', 'success');
          await fetchConfig(true);
        } catch (err) {
          showToast(err.response?.data?.message || 'Error deleting deduction rule', 'error');
        }
      }
    });
  };

  // ============================================================
  // TAX RULE HANDLERS
  // ============================================================
  const parseTaxSlabs = (slabsRaw) => {
    if (!slabsRaw) return [];
    if (Array.isArray(slabsRaw)) return slabsRaw;
    try {
      const parsed = JSON.parse(slabsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleOpenAddTax = () => {
    setEditingTaxId(null);
    setTaxForm({
      name: '',
      country: '',
      state: '',
      description: '',
      slabs: [
        { min: 0, max: 250000, rate: 0, baseTax: 0 },
        { min: 250000, max: 500000, rate: 5, baseTax: 0 },
        { min: 500000, max: 1000000, rate: 20, baseTax: 12500 },
        { min: 1000000, max: null, rate: 30, baseTax: 112500 }
      ]
    });
    setShowTaxModal(true);
  };

  const handleOpenEditTax = (tax) => {
    setEditingTaxId(tax.id);
    const parsedSlabs = parseTaxSlabs(tax.slabs);
    setTaxForm({
      name: tax.name || '',
      country: tax.country || '',
      state: tax.state || '',
      description: typeof tax.slabs === 'string' && !tax.slabs.startsWith('[') ? tax.slabs : '',
      slabs: parsedSlabs.length > 0 ? parsedSlabs : [
        { min: 0, max: 250000, rate: 0, baseTax: 0 },
        { min: 250000, max: 500000, rate: 5, baseTax: 0 },
        { min: 500000, max: 1000000, rate: 20, baseTax: 12500 },
        { min: 1000000, max: null, rate: 30, baseTax: 112500 }
      ]
    });
    setShowTaxModal(true);
  };

  const handleAddSlabRow = () => {
    setTaxForm(prev => {
      const last = prev.slabs[prev.slabs.length - 1];
      const nextMin = last ? (last.max !== null && last.max !== undefined ? Number(last.max) : Number(last.min) + 500000) : 0;
      return {
        ...prev,
        slabs: [...prev.slabs, { min: nextMin, max: null, rate: 20, baseTax: 0 }]
      };
    });
  };

  const handleRemoveSlabRow = (index) => {
    setTaxForm(prev => ({
      ...prev,
      slabs: prev.slabs.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSlabRow = (index, field, value) => {
    setTaxForm(prev => {
      const updated = [...prev.slabs];
      updated[index] = {
        ...updated[index],
        [field]: value === '' ? (field === 'max' ? null : 0) : (field === 'max' && value === null ? null : Number(value))
      };
      return { ...prev, slabs: updated };
    });
  };

  const handleSaveTax = async (e) => {
    e.preventDefault();
    if (!taxForm.name.trim() || !taxForm.country.trim()) {
      showToast('Regime name and country are required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: taxForm.name.trim(),
        country: taxForm.country.trim(),
        state: taxForm.state ? taxForm.state.trim() : null,
        slabs: taxForm.slabs && taxForm.slabs.length > 0 ? JSON.stringify(taxForm.slabs) : (taxForm.description || '[]')
      };

      if (editingTaxId) {
        await payrollConfigAPI.updateTax(editingTaxId, payload);
        showToast('Tax regime updated successfully', 'success');
      } else {
        await payrollConfigAPI.createTax(payload);
        showToast('Tax regime created successfully', 'success');
      }
      setShowTaxModal(false);
      setEditingTaxId(null);
      await fetchConfig(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving tax regime', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTax = (tax) => {
    setDeleteDialog({
      isOpen: true,
      title: 'Delete Tax Regime',
      message: `Are you sure you want to delete tax regime '${tax.name}' (${tax.country})?`,
      confirmText: 'Delete Regime',
      type: 'danger',
      onConfirm: async () => {
        try {
          await payrollConfigAPI.deleteTax(tax.id);
          showToast('Tax regime deleted successfully', 'success');
          await fetchConfig(true);
        } catch (err) {
          showToast(err.response?.data?.message || 'Error deleting tax regime', 'error');
        }
      }
    });
  };

  // Filtered lists
  const filteredStructures = useMemo(() => {
    return structures.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [structures, searchTerm]);

  const filteredComponents = useMemo(() => {
    return components.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [components, searchTerm, categoryFilter]);

  const filteredDeductions = useMemo(() => {
    return deductions.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [deductions, searchTerm]);

  const filteredTaxes = useMemo(() => {
    return taxes.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.state && t.state.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [taxes, searchTerm]);

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none text-left">
      {/* Top Header */}
      <PageHeader
        title="Enterprise Payroll Configuration"
        description="Configure salary structures, master earnings & deductions, and tax compliance engines"
        actions={
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchConfig()}
              disabled={loading}
              className="btn-secondary whitespace-nowrap"
              title="Refresh configuration data"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin text-primary-600")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -2 }}
          className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl flex items-center justify-center shadow-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Layers size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Salary Structures
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {structures.length}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl flex items-center justify-center shadow-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Calculator size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Master Components
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {components.length}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl flex items-center justify-center shadow-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <ShieldAlert size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Deductions & Benefits
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {deductions.length}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="card p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl flex items-center justify-center shadow-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Scale size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Tax Regimes
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {taxes.length}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={() => handleTabChange('structures')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === 'structures'
              ? "bg-primary-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Layers size={15} />
          <span>Salary Structures ({structures.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('components')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === 'components'
              ? "bg-primary-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Calculator size={15} />
          <span>Salary Components ({components.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('deductions')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === 'deductions'
              ? "bg-primary-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <ShieldAlert size={15} />
          <span>Deductions & Benefits ({deductions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('taxes')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
            activeTab === 'taxes'
              ? "bg-primary-600 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Scale size={15} />
          <span>Tax Rules Engine ({taxes.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <div className="card p-6 space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* TAB 1: SALARY STRUCTURES */}
            {/* ============================================================ */}
            {activeTab === 'structures' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Salary Structures (Templates)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Define monthly CTC breakdown templates with calculated components assigned to employees.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search structures..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
                      />
                    </div>
                    <button
                      onClick={handleOpenAddStructure}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Add Structure
                    </button>
                  </div>
                </div>

                {/* Desktop Table View (≥ md) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4">Structure Name</th>
                        <th className="px-5 py-4">Version</th>
                        <th className="px-5 py-4">Components</th>
                        <th className="px-5 py-4">Assigned Employees</th>
                        <th className="px-5 py-4">Status / Default</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {filteredStructures.length > 0 ? (
                        filteredStructures.map(s => {
                          const activeVer = s.versions?.[0];
                          const compCount = activeVer?.components?.length || 0;
                          const assignedCount = s._count?.compensations || 0;

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                                {s.description && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">{s.description}</div>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                  v{activeVer?.version || 1}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {compCount} components
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                                  assignedCount > 0
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                  {assignedCount} employee{assignedCount === 1 ? '' : 's'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {s.isDefault ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <Star size={12} className="fill-emerald-500 text-emerald-500" /> Default Template
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetDefaultStructure(s)}
                                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
                                  >
                                    Set Default
                                  </button>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedStructureForView(s);
                                      setShowViewStructureModal(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="View Breakdown"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditStructure(s)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit Structure"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStructure(s)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete Structure"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                              <Layers size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                              <p className="font-bold">No salary structures configured yet</p>
                              <p className="text-xs text-slate-400 mt-0.5">Click 'Add Structure' to create your organization's first salary template.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (< md) */}
                <div className="block md:hidden space-y-4">
                  {filteredStructures.length > 0 ? (
                    filteredStructures.map(s => {
                      const activeVer = s.versions?.[0];
                      const compCount = activeVer?.components?.length || 0;
                      const assignedCount = s._count?.compensations || 0;

                      return (
                        <div key={s.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h3>
                              {s.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                              )}
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                              v{activeVer?.version || 1}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">{compCount} components</span>
                            <span className="font-bold text-blue-600">{assignedCount} employee{assignedCount === 1 ? '' : 's'}</span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            {s.isDefault ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Star size={12} className="fill-emerald-500 text-emerald-500" /> Default
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetDefaultStructure(s)}
                                className="text-xs font-bold text-slate-500 underline"
                              >
                                Set Default
                              </button>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStructureForView(s);
                                  setShowViewStructureModal(true);
                                }}
                                className="p-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleOpenEditStructure(s)}
                                className="p-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStructure(s)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="font-bold text-slate-800 text-sm">No salary structures configured yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: SALARY COMPONENTS */}
            {/* ============================================================ */}
            {activeTab === 'components' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Master Salary Components
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure earnings, employer contributions, and formulas (Basic, HRA, Allowances).
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Earning">Earnings</option>
                      <option value="Deduction">Deductions</option>
                      <option value="Employer Contribution">Employer Contribution</option>
                    </select>

                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search components..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                      />
                    </div>

                    <button
                      onClick={handleOpenAddComponent}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Add Component
                    </button>
                  </div>
                </div>

                {/* Desktop Table View (≥ md) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4">Name & Code</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Base</th>
                        <th className="px-5 py-4">Calculation Logic</th>
                        <th className="px-5 py-4">Taxable</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {filteredComponents.length > 0 ? (
                        filteredComponents.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {c.name}
                                {c.isAutoBalance && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    Auto Balance
                                  </span>
                                )}
                              </div>
                              <code className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                                {c.code}
                              </code>
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                                c.category === 'Earning'
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : c.category === 'Deduction'
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                              )}>
                                {c.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                              {c.calculationBase || 'Basic'}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {c.calculationType}
                                </span>
                                <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold">
                                  {c.calculationType === 'Formula' ? c.formula : (
                                    c.calculationType === 'Percentage' ? `${c.value}% of ${c.calculationBase}` : (
                                      c.calculationType === 'Fixed' ? `${formatCurrency(Number(c.value) || 0)}` : c.value
                                    )
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {c.isTaxable ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  <Check size={14} /> Taxable
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">
                                  Exempt
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditComponent(c)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit Component"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComponent(c)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete Component"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                              <Calculator size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                              <p className="font-bold">No salary components found</p>
                              <p className="text-xs text-slate-400 mt-0.5">Click 'Add Component' to create Basic, HRA, or Allowance rules.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (< md) */}
                <div className="block md:hidden space-y-4">
                  {filteredComponents.length > 0 ? (
                    filteredComponents.map(c => (
                      <div key={c.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h3>
                            <code className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{c.code}</code>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            {c.category}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                          <p><strong>Base:</strong> {c.calculationBase || 'Basic'}</p>
                          <p><strong>Calculation:</strong> {c.calculationType} ({c.calculationType === 'Percentage' ? `${c.value}%` : c.value})</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-xs font-bold text-emerald-600">{c.isTaxable ? 'Taxable' : 'Exempt'}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenEditComponent(c)} className="p-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteComponent(c)} className="p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold cursor-pointer">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="font-bold text-slate-800 text-sm">No salary components found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: DEDUCTIONS & BENEFITS */}
            {/* ============================================================ */}
            {activeTab === 'deductions' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Statutory Deductions & Benefit Rules
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure Provident Fund (PF), ESI, Professional Tax, Health Insurance, and Pre-Tax exemptions.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search deductions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
                      />
                    </div>
                    <button
                      onClick={handleOpenAddDeduction}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Add Deduction Rule
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4">Rule Name & Code</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Value Type & Value</th>
                        <th className="px-5 py-4">Pre-Tax Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {filteredDeductions.length > 0 ? (
                        filteredDeductions.map(d => (
                          <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900 dark:text-white">{d.name}</div>
                              <code className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                                {d.code}
                              </code>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                {d.category}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {d.valueType}
                                </span>
                                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {d.valueType === 'Percentage' ? `${d.value}% of Basic` : (
                                    d.valueType === 'Fixed' ? formatCurrency(Number(d.value) || 0) : d.value
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {d.isPreTax ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  <Check size={14} /> Pre-Tax Deductible
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  Post-Tax Deduction
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditDeduction(d)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit Deduction"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteDeduction(d)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete Deduction"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                              <ShieldAlert size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                              <p className="font-bold">No deduction rules configured</p>
                              <p className="text-xs text-slate-400 mt-0.5">Click 'Add Deduction Rule' to configure statutory PF, ESI, or taxes.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: TAX RULES ENGINE */}
            {/* ============================================================ */}
            {activeTab === 'taxes' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Tax Regimes & Slab Engine
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure national or state-specific progressive income tax brackets and algorithmic slabs.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search tax rules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
                      />
                    </div>
                    <button
                      onClick={handleOpenAddTax}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Add Tax Regime
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-4">Regime Name</th>
                        <th className="px-5 py-4">Jurisdiction</th>
                        <th className="px-5 py-4">Configured Brackets</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {filteredTaxes.length > 0 ? (
                        filteredTaxes.map(t => {
                          const slabsArr = parseTaxSlabs(t.slabs);
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                    {t.country || 'Universal'}
                                  </span>
                                  {t.state && (
                                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {t.state}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                {slabsArr.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                    {slabsArr.length} progressive tax bracket{slabsArr.length === 1 ? '' : 's'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 max-w-xs line-clamp-1">
                                    {t.slabs || 'General policy rules'}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedTaxForView(t);
                                      setShowViewTaxModal(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="View Brackets"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditTax(t)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit Tax Regime"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTax(t)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete Tax Regime"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col items-center justify-center">
                              <Scale size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                              <p className="font-bold">No tax regimes configured</p>
                              <p className="text-xs text-slate-400 mt-0.5">Click 'Add Tax Regime' to build progressive tax slabs.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: ADD / EDIT SALARY STRUCTURE */}
      {/* ============================================================ */}
      {showStructureModal && (
        <CenterModal
          isOpen={true}
          title={editingStructureId ? "Edit Salary Structure Template" : "Add Salary Structure Template"}
          onClose={() => setShowStructureModal(false)}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveStructure} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Structure Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Standard Executive CTC Structure"
                value={structureForm.name}
                onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={structureForm.currency}
                  onChange={(e) => setStructureForm({ ...structureForm, currency: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="SGD">SGD ($)</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="relative flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={structureForm.isDefault}
                    onChange={(e) => setStructureForm({ ...structureForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Set as Default Organization Structure
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Optional description of this CTC template..."
                value={structureForm.description}
                onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Included Salary Components & Execution Order
                </span>
                <span className="text-xs text-indigo-600 font-bold">
                  {structureForm.components.length} Selected
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {components.length > 0 ? (
                  components.map(comp => {
                    const selectedIdx = structureForm.components.findIndex(c => c.componentId === comp.id);
                    const isSelected = selectedIdx !== -1;
                    const seq = isSelected ? structureForm.components[selectedIdx].sequence : null;

                    return (
                      <div
                        key={comp.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all text-sm",
                          isSelected
                            ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStructureComponent(comp.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{comp.name}</span>
                            <span className="ml-2 text-xs font-bold text-slate-500">({comp.code})</span>
                            {comp.isAutoBalance && (
                              <span className="ml-2 text-[10px] font-bold text-amber-600 uppercase">Auto Balance</span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Seq #{seq}
                            </span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => handleMoveStructureComponent(selectedIdx, -1)}
                                disabled={selectedIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                              >
                                <MoveUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStructureComponent(selectedIdx, 1)}
                                disabled={selectedIdx === structureForm.components.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                              >
                                <MoveDown size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No master components available. Add components first.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStructureModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : (editingStructureId ? 'Update Structure' : 'Create Structure')}
              </button>
            </div>
          </form>
        </CenterModal>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: VIEW SALARY STRUCTURE DETAILS */}
      {/* ============================================================ */}
      {showViewStructureModal && selectedStructureForView && (
        <CenterModal
          isOpen={true}
          title={`Structure Breakdown: ${selectedStructureForView.name}`}
          onClose={() => setShowViewStructureModal(false)}
          maxWidth="max-w-2xl"
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">Currency</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStructureForView.currency || 'USD'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Version</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">v{selectedStructureForView.versions?.[0]?.version || 1}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Assigned Employees</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStructureForView._count?.compensations || 0}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Default Template</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStructureForView.isDefault ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Calculated Components Breakdown
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Component</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Calculation Logic</th>
                      <th className="px-4 py-3">Taxable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedStructureForView.versions?.[0]?.components?.length > 0 ? (
                      selectedStructureForView.versions[0].components.map((sc, idx) => {
                        const comp = sc.salaryComponent || {};
                        return (
                          <tr key={sc.id || idx}>
                            <td className="px-4 py-3 font-bold text-slate-500">{sc.sequence || idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              {comp.name || 'Component'}
                              <span className="ml-1 text-slate-400 font-normal">({comp.code})</span>
                            </td>
                            <td className="px-4 py-3">{comp.category || 'Earning'}</td>
                            <td className="px-4 py-3">{comp.calculationType}</td>
                            <td className="px-4 py-3 font-mono font-bold">
                              {comp.calculationType === 'Formula' ? comp.formula : (
                                comp.calculationType === 'Percentage' ? `${comp.value}% of ${comp.calculationBase}` : comp.value
                              )}
                            </td>
                            <td className="px-4 py-3">{comp.isTaxable ? 'Yes' : 'No'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-6 text-center text-slate-400">
                          No components attached to this structure version.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowViewStructureModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </CenterModal>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ADD / EDIT MASTER COMPONENT */}
      {/* ============================================================ */}
      {showComponentModal && (
        <CenterModal
          isOpen={true}
          title={editingComponentId ? "Edit Master Salary Component" : "Add Master Salary Component"}
          onClose={() => setShowComponentModal(false)}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveComponent} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Component Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic Salary, House Rent Allowance"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Component Code (Unique) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BASIC, HRA, SPECIAL_ALLOW"
                  value={componentForm.code}
                  onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={componentForm.category}
                  onChange={(e) => setComponentForm({ ...componentForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Earning">Earning (Taxable Allowance / Base)</option>
                  <option value="Deduction">Deduction (Employee Side)</option>
                  <option value="Employer Contribution">Employer Contribution (CTC Overhead)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Calculation Base
                </label>
                <select
                  value={componentForm.calculationBase}
                  onChange={(e) => setComponentForm({ ...componentForm, calculationBase: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CTC">Monthly CTC</option>
                  <option value="Basic">Basic Salary</option>
                  <option value="Gross">Gross Salary</option>
                  <option value="Net">Net Salary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Calculation Type
                </label>
                <select
                  value={componentForm.calculationType}
                  onChange={(e) => setComponentForm({ ...componentForm, calculationType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount</option>
                  <option value="Formula">Custom Formula Expression</option>
                  <option value="Auto Balance">Auto Balance (Plug Difference)</option>
                  <option value="Manual">Manual Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  {componentForm.calculationType === 'Percentage' ? 'Percentage (%) Value' : 'Value'}
                </label>
                <input
                  type="text"
                  required={componentForm.calculationType !== 'Formula' && componentForm.calculationType !== 'Auto Balance'}
                  disabled={componentForm.calculationType === 'Auto Balance'}
                  placeholder={
                    componentForm.calculationType === 'Percentage'
                      ? 'e.g. 50 (for 50%)'
                      : (componentForm.calculationType === 'Auto Balance' ? 'Calculated automatically' : 'Value')
                  }
                  value={componentForm.calculationType === 'Auto Balance' ? 'AUTO' : componentForm.value}
                  onChange={(e) => setComponentForm({ ...componentForm, value: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            {componentForm.calculationType === 'Formula' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Formula Expression
                </label>
                <input
                  type="text"
                  placeholder="e.g. max([Basic] * 0.4, 2500) or [CTC] * 0.12"
                  value={componentForm.formula}
                  onChange={(e) => setComponentForm({ ...componentForm, formula: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">Use component codes in square brackets: e.g. [BASIC], [CTC], [HRA].</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={componentForm.isTaxable}
                  onChange={(e) => setComponentForm({ ...componentForm, isTaxable: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Is Taxable Earning
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={componentForm.isAutoBalance}
                  onChange={(e) => setComponentForm({
                    ...componentForm,
                    isAutoBalance: e.target.checked,
                    calculationType: e.target.checked ? 'Auto Balance' : componentForm.calculationType
                  })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Is Auto-Balance (Special Allowance)
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowComponentModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : (editingComponentId ? 'Update Component' : 'Save Component')}
              </button>
            </div>
          </form>
        </CenterModal>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ADD / EDIT DEDUCTION RULE */}
      {/* ============================================================ */}
      {showDeductionModal && (
        <CenterModal
          isOpen={true}
          title={editingDeductionId ? "Edit Statutory Deduction Rule" : "Add Statutory Deduction Rule"}
          onClose={() => setShowDeductionModal(false)}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveDeduction} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Deduction Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee PF Contribution"
                  value={deductionForm.name}
                  onChange={(e) => setDeductionForm({ ...deductionForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Deduction Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PF_EMP, ESI, PT"
                  value={deductionForm.code}
                  onChange={(e) => setDeductionForm({ ...deductionForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={deductionForm.category}
                  onChange={(e) => setDeductionForm({ ...deductionForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PF">Provident Fund (PF)</option>
                  <option value="ESI">Employee State Insurance (ESI)</option>
                  <option value="Professional Tax">Professional Tax (PT)</option>
                  <option value="Health Insurance">Health Insurance Premium</option>
                  <option value="401k">401(k) Retirement</option>
                  <option value="Other">Other Statutory / Voluntary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Value Type
                </label>
                <select
                  value={deductionForm.valueType}
                  onChange={(e) => setDeductionForm({ ...deductionForm, valueType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Fixed">Fixed Amount</option>
                  <option value="Percentage">Percentage (%) of Basic</option>
                  <option value="Formula">Formula Expression</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {deductionForm.valueType === 'Percentage' ? 'Percentage (%) Value' : 'Value / Expression'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={deductionForm.valueType === 'Percentage' ? 'e.g. 12 (for 12% PF)' : 'Value'}
                value={deductionForm.value}
                onChange={(e) => setDeductionForm({ ...deductionForm, value: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deductionForm.isPreTax}
                  onChange={(e) => setDeductionForm({ ...deductionForm, isPreTax: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Is Pre-Tax Deduction (Deduct before calculating income tax)
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeductionModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : (editingDeductionId ? 'Update Deduction' : 'Save Deduction Rule')}
              </button>
            </div>
          </form>
        </CenterModal>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: ADD / EDIT TAX RULE & SLABS */}
      {/* ============================================================ */}
      {showTaxModal && (
        <CenterModal
          isOpen={true}
          title={editingTaxId ? "Edit Tax Regime & Slabs" : "Add Tax Regime & Slabs"}
          onClose={() => setShowTaxModal(false)}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveTax} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Regime Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard New Tax Regime"
                  value={taxForm.name}
                  onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. India, United States"
                  value={taxForm.country}
                  onChange={(e) => setTaxForm({ ...taxForm, country: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  State / Region (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. California, Federal"
                  value={taxForm.state}
                  onChange={(e) => setTaxForm({ ...taxForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Interactive Slab Builder */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Progressive Tax Slabs Engine
                </span>
                <button
                  type="button"
                  onClick={handleAddSlabRow}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Plus size={14} /> Add Slab Bracket
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2.5">Min Income</th>
                      <th className="px-3 py-2.5">Max Income</th>
                      <th className="px-3 py-2.5">Tax Rate (%)</th>
                      <th className="px-3 py-2.5">Base Flat Tax</th>
                      <th className="px-3 py-2.5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {taxForm.slabs.map((slab, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={slab.min}
                            onChange={(e) => handleUpdateSlabRow(idx, 'min', e.target.value)}
                            className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            placeholder="Unlimited"
                            value={slab.max === null || slab.max === undefined ? '' : slab.max}
                            onChange={(e) => handleUpdateSlabRow(idx, 'max', e.target.value === '' ? null : e.target.value)}
                            className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={slab.rate}
                              onChange={(e) => handleUpdateSlabRow(idx, 'rate', e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <span className="font-bold">%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={slab.baseTax || 0}
                            onChange={(e) => handleUpdateSlabRow(idx, 'baseTax', e.target.value)}
                            className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSlabRow(idx)}
                            disabled={taxForm.slabs.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Tax Compliance Notes / Policy Overview
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes regarding exemption criteria, standard deduction limits, or statutory references..."
                value={taxForm.description}
                onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTaxModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : (editingTaxId ? 'Update Tax Regime' : 'Save Tax Regime')}
              </button>
            </div>
          </form>
        </CenterModal>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: VIEW TAX REGIME BRACKETS */}
      {/* ============================================================ */}
      {showViewTaxModal && selectedTaxForView && (
        <CenterModal
          isOpen={true}
          title={`Tax Brackets: ${selectedTaxForView.name}`}
          onClose={() => setShowViewTaxModal(false)}
          maxWidth="max-w-2xl"
        >
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                Country: {selectedTaxForView.country}
              </span>
              {selectedTaxForView.state && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  State: {selectedTaxForView.state}
                </span>
              )}
            </div>

            {parseTaxSlabs(selectedTaxForView.slabs).length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">Income Range</th>
                      <th className="px-4 py-3">Tax Rate</th>
                      <th className="px-4 py-3">Base Flat Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {parseTaxSlabs(selectedTaxForView.slabs).map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(Number(s.min) || 0)} - {s.max !== null && s.max !== undefined ? formatCurrency(Number(s.max)) : 'Above'}
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{s.rate}%</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                          {s.baseTax ? formatCurrency(Number(s.baseTax)) : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
                {selectedTaxForView.slabs || 'No custom slab table defined for this regime.'}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowViewTaxModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </CenterModal>
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        confirmText={deleteDialog.confirmText}
        type={deleteDialog.type}
        onClose={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteDialog.onConfirm}
      />
    </div>
  );
};

export default PayrollConfig;

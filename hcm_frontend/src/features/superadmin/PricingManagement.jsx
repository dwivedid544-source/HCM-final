import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt, Plus, Trash2, Edit3, Save, X, Eye,
  ArrowUp, ArrowDown, CheckCircle2, AlertCircle, ToggleLeft,
  ToggleRight, Sparkles, Shield, Users, HardDrive, Cpu,
  Layers, RefreshCw, Check, Clock, AlertTriangle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { superAdminAPI } from '../../utils/apiService';
import { useCurrency } from '../../hooks/useCurrency';
import ConfirmDialog from '../admin/components/ConfirmDialog';

const PricingManagement = () => {
  const { formatCurrency, currencyCode, masterCurrency } = useCurrency();

  // Plans & Loading State
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [previewPlanData, setPreviewPlanData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    dialogType: 'danger',
    action: null
  });

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('0');
  const [yearlyPrice, setYearlyPrice] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [billingCycle, setBillingCycle] = useState('Both');
  const [trialDays, setTrialDays] = useState('14');
  const [maxEmployees, setMaxEmployees] = useState('50');
  const [maxAdmins, setMaxAdmins] = useState('3');
  const [storageLimit, setStorageLimit] = useState('10');
  const [aiCredits, setAiCredits] = useState('0');
  const [supportLevel, setSupportLevel] = useState('Standard');
  const [buttonText, setButtonText] = useState('Start Free Trial');
  const [buttonLink, setButtonLink] = useState('/login');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [features, setFeatures] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── FETCH PRICING PLANS FROM DATABASE ────────────────────────
  const fetchPlans = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    else setLoading(true);
    try {
      const res = await superAdminAPI.getAdminPricingPlans();
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setPlans(res.data.data);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error('Failed to load pricing plans:', err);
      showToast(err.response?.data?.error?.message || 'Failed to load pricing plans.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── DYNAMIC METRICS ──────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.isActive !== false).length;
    const popularPlan = plans.find(p => p.isPopular);
    const totalSubscribedOrgs = plans.reduce((acc, p) => acc + (p._count?.organizations || 0), 0);
    return { totalPlans, activePlans, popularPlan, totalSubscribedOrgs };
  }, [plans]);

  // ── OPEN ADD / EDIT MODAL ────────────────────────────────────
  const openAddModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setMonthlyPrice('19');
    setYearlyPrice('190');
    setCurrency(currencyCode || masterCurrency || 'USD');
    setBillingCycle('Both');
    setTrialDays('14');
    setMaxEmployees('50');
    setMaxAdmins('3');
    setStorageLimit('10');
    setAiCredits('100');
    setSupportLevel('Priority Email');
    setButtonText('Start Free Trial');
    setButtonLink('/login');
    setIsPopular(false);
    setIsActive(true);
    setDisplayOrder((plans.length + 1).toString());
    setFeatures([
      { id: Date.now().toString(), text: 'Full Core HR & Directory Access', displayOrder: 0 },
      { id: (Date.now() + 1).toString(), text: 'Employee Self-Service Portal', displayOrder: 1 },
      { id: (Date.now() + 2).toString(), text: 'Leave & Attendance Tracking', displayOrder: 2 }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setName(plan.name || '');
    setDescription(plan.description || '');
    setMonthlyPrice((plan.monthlyPrice ?? 0).toString());
    setYearlyPrice((plan.yearlyPrice ?? 0).toString());
    setCurrency(plan.currency || currencyCode || masterCurrency || 'USD');
    setBillingCycle(plan.billingCycle || 'Both');
    setTrialDays((plan.trialDays ?? 14).toString());
    setMaxEmployees((plan.maxEmployees ?? 100).toString());
    setMaxAdmins((plan.maxAdmins ?? 3).toString());
    setStorageLimit((plan.storageLimit ?? 10).toString());
    setAiCredits((plan.aiCredits ?? 0).toString());
    setSupportLevel(plan.supportLevel || 'Standard');
    setButtonText(plan.buttonText || 'Start Free Trial');
    setButtonLink(plan.buttonLink || '/login');
    setIsPopular(!!plan.isPopular);
    setIsActive(plan.isActive !== false);
    setDisplayOrder((plan.displayOrder ?? 0).toString());
    setFeatures(
      (plan.features || []).map((f, i) => ({
        id: f.id || i.toString(),
        text: f.feature || '',
        displayOrder: f.displayOrder ?? i
      }))
    );
    setIsModalOpen(true);
  };

  // ── FEATURE LIST MANAGEMENT ──────────────────────────────────
  const handleAddFeature = () => {
    setFeatures([...features, { id: Date.now().toString(), text: '', displayOrder: features.length }]);
  };

  const handleRemoveFeature = (id) => {
    const updated = features.filter(f => f.id !== id).map((f, index) => ({ ...f, displayOrder: index }));
    setFeatures(updated);
  };

  const handleFeatureTextChange = (id, text) => {
    setFeatures(features.map(f => f.id === id ? { ...f, text } : f));
  };

  const moveFeature = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === features.length - 1) return;

    const newFeatures = [...features];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newFeatures[index];
    newFeatures[index] = newFeatures[targetIndex];
    newFeatures[targetIndex] = temp;

    const reordered = newFeatures.map((f, i) => ({ ...f, displayOrder: i }));
    setFeatures(reordered);
  };

  // ── TOGGLE ACTIVE STATUS ─────────────────────────────────────
  const handleToggleStatus = async (plan) => {
    try {
      const res = await superAdminAPI.togglePricingPlanStatus(plan.id);
      if (res.data && res.data.success) {
        showToast(`Plan "${plan.name}" status updated.`);
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to toggle status.', 'error');
    }
  };

  // ── REORDER PLANS ────────────────────────────────────────────
  const handleMovePlan = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === plans.length - 1) return;

    const newPlans = [...plans];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newPlans[index];
    newPlans[index] = newPlans[targetIndex];
    newPlans[targetIndex] = temp;

    setPlans(newPlans);

    try {
      const ids = newPlans.map(p => p.id);
      await superAdminAPI.reorderPricingPlans(ids);
      showToast('Plan display order saved.');
    } catch {
      showToast('Failed to update display order on server.', 'error');
      fetchPlans();
    }
  };

  // ── DELETE PLAN (WITH IN-USE SUBSCRIPTION GUARD) ──────────────
  const handleDeletePlan = (plan) => {
    const orgsUsing = plan._count?.organizations || 0;

    // Check whether organizations currently use this plan
    if (orgsUsing > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Plan In Use',
        message: `Cannot delete pricing plan "${plan.name}" because it is currently assigned to ${orgsUsing} active organization subscription(s). Please reassign those tenants to another tier in Subscription Management first.`,
        confirmText: 'Understood',
        dialogType: 'warning',
        action: () => setConfirmDialog(prev => ({ ...prev, isOpen: false, action: null }))
      });
      return;
    }

    // Safe to delete confirmation
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Pricing Plan',
      message: `Are you sure you want to permanently delete "${plan.name}"? This plan will be removed from the platform and future tenant registrations.`,
      confirmText: 'Delete Permanently',
      dialogType: 'danger',
      action: async () => {
        try {
          const res = await superAdminAPI.deletePricingPlan(plan.id);
          if (res.data && res.data.success) {
            showToast(`Pricing plan "${plan.name}" deleted successfully.`);
            setPlans(prev => prev.filter(p => p.id !== plan.id));
          }
        } catch (err) {
          showToast(err.response?.data?.error?.message || 'Failed to delete pricing plan.', 'error');
        }
      }
    });
  };

  // ── PREVIEW PLAN CARD ────────────────────────────────────────
  const handlePreview = () => {
    setPreviewPlanData({
      name,
      description,
      monthlyPrice: parseFloat(monthlyPrice) || 0,
      yearlyPrice: parseFloat(yearlyPrice) || 0,
      currency,
      billingCycle,
      trialDays: parseInt(trialDays) || 0,
      maxEmployees: parseInt(maxEmployees) || 0,
      maxAdmins: parseInt(maxAdmins) || 0,
      storageLimit: parseInt(storageLimit) || 0,
      aiCredits: parseInt(aiCredits) || 0,
      supportLevel,
      buttonText,
      buttonLink,
      isPopular,
      isActive,
      features: features.filter(f => f.text.trim() !== '').map(f => f.text)
    });
    setIsPreviewOpen(true);
  };

  // ── SUBMIT CREATE / EDIT FORM ────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Plan Name is required.', 'error');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      monthlyPrice: parseFloat(monthlyPrice) || 0,
      yearlyPrice: parseFloat(yearlyPrice) || 0,
      currency,
      billingCycle,
      trialDays: parseInt(trialDays) || 0,
      maxEmployees: parseInt(maxEmployees) || 0,
      maxAdmins: parseInt(maxAdmins) || 0,
      storageLimit: parseInt(storageLimit) || 0,
      aiCredits: parseInt(aiCredits) || 0,
      supportLevel: supportLevel.trim() || 'Standard',
      buttonText: buttonText.trim() || 'Start Free Trial',
      buttonLink: buttonLink.trim() || '/login',
      isPopular: !!isPopular,
      isActive: !!isActive,
      displayOrder: parseInt(displayOrder) || 0,
      features: features.filter(f => f.text.trim() !== '').map(f => ({
        feature: f.text.trim(),
        displayOrder: f.displayOrder
      }))
    };

    try {
      let res;
      if (editingPlan) {
        res = await superAdminAPI.updatePricingPlan(editingPlan.id, payload);
      } else {
        res = await superAdminAPI.createPricingPlan(payload);
      }

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Plan saved successfully.');
        setIsModalOpen(false);
        fetchPlans(true);
      }
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save pricing plan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="hcm-superadmin-container pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <PageHeader
        icon={Receipt}
        title="Pricing Plans Management"
        subtitle="Configure system-wide SaaS tiers, quotas, add-ons, features, and active/popular statuses"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPlans(true)}
            disabled={isRefreshing}
            className="btn-secondary btn-compact flex items-center gap-2"
            title="Refresh pricing plans from database"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-primary-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>Create Plan</span>
          </button>
        </div>
      </PageHeader>

      {/* ── KPI METRICS SUMMARY ROW ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Defined Plans</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{metrics.totalPlans}</span>
          <span className="text-xs text-slate-400 mt-0.5 block">{metrics.activePlans} active for new signups</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assigned Tenants</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{metrics.totalSubscribedOrgs}</span>
          <span className="text-xs text-slate-400 mt-0.5 block">Subscribed across all plans</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Featured Tier</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block truncate">
            {metrics.popularPlan ? metrics.popularPlan.name : 'None'}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">Marked as popular badge</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active Status</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {metrics.activePlans} / {metrics.totalPlans}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">Available in Subscription UI</span>
        </div>
      </div>

      {/* ── PLANS CONTENT ───────────────────────────────────────── */}
      {loading && plans.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <RefreshCw size={28} className="animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">Loading pricing plans from database...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="card p-12 text-center border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-3xl">
          <Receipt size={48} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Pricing Tiers Defined</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 mb-6">
            Click "Create Plan" to configure your first SaaS subscription tier in the database.
          </p>
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={16} className="mr-2" />
            Create First Plan
          </button>
        </div>
      ) : (
        <>
          {/* 1. DESKTOP DATA TABLE (hidden on mobile/tablet) */}
          <div className="hidden lg:block card p-0 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
            <div className="hcm-table-container border-0 rounded-none overflow-x-auto w-full">
              <table className="hcm-table w-full text-left">
                <thead className="hcm-thead">
                  <tr className="hcm-tr bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-16 text-center">Order</th>
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Plan Details</th>
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Pricing</th>
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Quotas</th>
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tenants</th>
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {plans.map((plan, index) => {
                    const orgsUsing = plan._count?.organizations || 0;
                    return (
                      <tr key={plan.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Order Controls */}
                        <td className="hcm-td py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMovePlan(index, 'up')}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30"
                              title="Move plan up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <span className="text-[11px] font-bold text-slate-400 font-mono">{index + 1}</span>
                            <button
                              disabled={index === plans.length - 1}
                              onClick={() => handleMovePlan(index, 'down')}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30"
                              title="Move plan down"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Plan Details */}
                        <td className="hcm-td py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-base">
                              {plan.name}
                            </span>
                            {plan.isPopular && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold">
                                <Sparkles size={10} /> Popular
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-xs">
                            {plan.description || 'No description provided'}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {plan.features?.length || 0} features configured • {plan.trialDays}d trial
                          </span>
                        </td>

                        {/* Pricing */}
                        <td className="hcm-td py-3.5 px-4 whitespace-nowrap">
                          <div className="font-black text-slate-800 dark:text-slate-100 text-base">
                            {formatCurrency(plan.monthlyPrice)}<span className="text-xs font-normal text-slate-400">/mo</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatCurrency(plan.yearlyPrice)}<span className="text-[10px]">/yr</span>
                          </div>
                        </td>

                        {/* Quotas */}
                        <td className="hcm-td py-3.5 px-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Users size={13} className="text-indigo-500" />
                            <span>{plan.maxEmployees > 9999 ? 'Unlimited' : `${plan.maxEmployees} Seats`}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
                            <HardDrive size={11} />
                            <span>{plan.storageLimit} GB Storage</span>
                            <span className="mx-0.5">•</span>
                            <Shield size={11} />
                            <span>{plan.maxAdmins} Admins</span>
                          </div>
                        </td>

                        {/* Assigned Tenants */}
                        <td className="hcm-td py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            orgsUsing > 0
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {orgsUsing} {orgsUsing === 1 ? 'tenant' : 'tenants'}
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="hcm-td py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(plan)}
                            className="btn-icon p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
                          >
                            {plan.isActive ? (
                              <ToggleRight size={30} className="text-emerald-500" />
                            ) : (
                              <ToggleLeft size={30} className="text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="hcm-td py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setPreviewPlanData(plan);
                                setIsPreviewOpen(true);
                              }}
                              className="btn-secondary btn-compact text-xs flex items-center gap-1"
                              title="Preview tier card"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => openEditModal(plan)}
                              className="btn-secondary btn-compact text-xs flex items-center gap-1"
                              title="Edit tier parameters"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan)}
                              className="btn-compact text-xs flex items-center gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg py-1 px-2.5"
                              title={orgsUsing > 0 ? `Cannot delete: in use by ${orgsUsing} tenant(s)` : 'Delete tier'}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. TABLET & MOBILE ADAPTIVE CARD GRID (hidden on desktop) */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan, index) => {
              const orgsUsing = plan._count?.organizations || 0;
              return (
                <div
                  key={plan.id}
                  className="card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                            {plan.name}
                          </h3>
                          {plan.isPopular && (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-600 rounded-full text-[10px] font-bold">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {plan.description || 'No description'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className="btn-icon p-0.5"
                        title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
                      >
                        {plan.isActive ? (
                          <ToggleRight size={28} className="text-emerald-500" />
                        ) : (
                          <ToggleLeft size={28} className="text-slate-300" />
                        )}
                      </button>
                    </div>

                    {/* Price & Quotas Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Pricing</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatCurrency(plan.monthlyPrice)}/mo
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Seat Quota</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {plan.maxEmployees > 9999 ? 'Unlimited' : `${plan.maxEmployees} Seats`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Storage</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {plan.storageLimit} GB
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Active Tenants</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {orgsUsing} org(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMovePlan(index, 'up')}
                        className="btn-secondary btn-compact p-1 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        disabled={index === plans.length - 1}
                        onClick={() => handleMovePlan(index, 'down')}
                        className="btn-secondary btn-compact p-1 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewPlanData(plan);
                          setIsPreviewOpen(true);
                        }}
                        className="btn-secondary btn-compact text-xs p-2"
                        title="Preview"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => openEditModal(plan)}
                        className="btn-secondary btn-compact text-xs"
                      >
                        <Edit3 size={13} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="btn-compact text-xs text-rose-600 border border-rose-200 dark:border-rose-900/40 rounded-lg p-2"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── CREATE / EDIT PRICING PLAN MODAL ───────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSaving && setIsModalOpen(false)}
                className="fixed inset-0"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 max-h-[90vh] overflow-y-auto z-10 my-auto flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-600" />
                    {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New SaaS Pricing Tier'}
                  </h3>
                  <button
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="btn-ghost btn-icon btn-compact"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5 mt-4 flex-1">
                  {/* Section 1: Profile */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Plan Profile</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Plan Name *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g., Growth Tier"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Support Level</label>
                        <input
                          type="text"
                          value={supportLevel}
                          onChange={e => setSupportLevel(e.target.value)}
                          placeholder="e.g., 24/7 Dedicated Support"
                          className="input-field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label">Description</label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Short summary of this subscription tier..."
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Pricing & Billing */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">2. Pricing & Terms</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="form-label">Monthly Price ({currency}) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={monthlyPrice}
                          onChange={e => setMonthlyPrice(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Yearly Price ({currency}) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={yearlyPrice}
                          onChange={e => setYearlyPrice(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Trial Days</label>
                        <input
                          type="number"
                          min="0"
                          value={trialDays}
                          onChange={e => setTrialDays(e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Quotas */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">3. Entitlements & Quotas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="form-label">Max Employees</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={maxEmployees}
                          onChange={e => setMaxEmployees(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Storage (GB)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={storageLimit}
                          onChange={e => setStorageLimit(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Max Admins</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={maxAdmins}
                          onChange={e => setMaxAdmins(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">AI Credits</label>
                        <input
                          type="number"
                          min="0"
                          value={aiCredits}
                          onChange={e => setAiCredits(e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Features List */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Features Included</h4>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="btn-secondary btn-compact text-xs flex items-center gap-1"
                      >
                        <Plus size={13} /> Add Feature
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {features.map((f, index) => (
                        <div key={f.id} className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveFeature(index, 'up')}
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-20 p-0.5"
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              disabled={index === features.length - 1}
                              onClick={() => moveFeature(index, 'down')}
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-20 p-0.5"
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={f.text}
                            onChange={e => handleFeatureTextChange(f.id, e.target.value)}
                            placeholder="Feature bullet point..."
                            className="input-field text-xs py-1.5 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(f.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 5: Badges & Status */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isPopular}
                          onChange={e => setIsPopular(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span>Highlight as "Popular / Most Wanted"</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={e => setIsActive(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span>Active for new Tenant Subscriptions</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handlePreview}
                      className="btn-secondary btn-compact text-xs flex items-center gap-1.5"
                    >
                      <Eye size={13} />
                      Preview Card
                    </button>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setIsModalOpen(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{isSaving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── PLAN PREVIEW MODAL ─────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isPreviewOpen && previewPlanData && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)} className="fixed inset-0" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Card Preview</span>
                  <button onClick={() => setIsPreviewOpen(false)} className="btn-ghost btn-icon btn-compact"><X size={16} /></button>
                </div>

                <div className={`p-6 rounded-2xl border ${
                  previewPlanData.isPopular
                    ? 'border-indigo-500 shadow-lg ring-1 ring-indigo-500 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}>
                  {previewPlanData.isPopular && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mb-3">
                      <Sparkles size={12} /> Most Popular
                    </span>
                  )}
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">{previewPlanData.name || 'Plan Name'}</h4>
                  <p className="text-xs text-slate-400 mt-1">{previewPlanData.description || 'Plan description goes here'}</p>

                  <div className="my-4">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(previewPlanData.monthlyPrice)}
                    </span>
                    <span className="text-xs text-slate-400"> / month</span>
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>{previewPlanData.maxEmployees > 9999 ? 'Unlimited Employees' : `Up to ${previewPlanData.maxEmployees} Employees`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>{previewPlanData.storageLimit} GB Encrypted Storage</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Check size={14} className="text-emerald-500" />
                      <span>{previewPlanData.supportLevel}</span>
                    </div>
                    {previewPlanData.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Check size={14} className="text-emerald-500" />
                        <span>{typeof f === 'string' ? f : f.feature}</span>
                      </div>
                    ))}
                  </div>

                  <button type="button" className={`w-full mt-4 py-2.5 rounded-xl font-bold text-xs ${previewPlanData.isPopular ? 'btn-primary' : 'btn-secondary'}`}>
                    {previewPlanData.buttonText || 'Start Free Trial'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── CONFIRM DIALOG ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.dialogType}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false, action: null }))}
      />
    </div>
  );
};

export default PricingManagement;

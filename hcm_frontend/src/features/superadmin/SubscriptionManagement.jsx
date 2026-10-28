import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard, Search, AlertCircle, CheckCircle, Clock,
  Calendar, Users, RefreshCw, X, Edit3,
  PauseCircle, PlayCircle, Hash, Copy, Check
} from 'lucide-react';
import PageHeader from '../../shared/components/layout/PageHeader';
import { superAdminAPI } from '../../utils/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useCurrency } from '../../hooks/useCurrency';
import ConfirmDialog from '../admin/components/ConfirmDialog';

const SubscriptionManagement = () => {
  const { formatCurrency } = useCurrency();

  const [organizations, setOrganizations] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    plan: 'Trial',
    pricingPlanId: '',
    status: 'ACTIVE',
    subscriptionStatus: 'TRIAL',
    maxEmployees: 15,
    billingCycle: 'Monthly'
  });
  const [isSaving, setIsSaving] = useState(false);

  const [toastMsg, setToastMsg] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    dialogType: 'danger',
    action: null
  });

  const [copiedOrgId, setCopiedOrgId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showToast = useCallback((message, type = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchSubscriptions = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    else setLoading(true);
    try {
      const [orgsRes, plansRes] = await Promise.all([
        superAdminAPI.getAllOrganizations(),
        superAdminAPI.getAdminPricingPlans().catch(() => ({ data: { data: [] } }))
      ]);

      if (orgsRes.data?.success && Array.isArray(orgsRes.data.data)) {
        setOrganizations(orgsRes.data.data);
      }
      if (plansRes.data?.success && Array.isArray(plansRes.data.data)) {
        setPricingPlans(plansRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      showToast(err.response?.data?.error?.message || 'Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSubscriptions(false);
  }, [fetchSubscriptions]);

  const metrics = useMemo(() => {
    const totalSubscriptions = organizations.length;
    const activePaidPlans = organizations.filter(o => {
      const isActive = (o.status || '').toUpperCase() === 'ACTIVE';
      const hasPaidPlan = o.pricingPlan && (o.pricingPlan.monthlyPrice > 0 || o.pricingPlan.yearlyPrice > 0);
      const isNotTrial = (o.subscriptionStatus || '').toUpperCase() !== 'TRIAL';
      return isActive && hasPaidPlan && isNotTrial;
    }).length;

    const trialAccounts = organizations.filter(o => {
      const subStatus = (o.subscriptionStatus || '').toUpperCase();
      const planName = (o.pricingPlan?.name || o.plan || '').toLowerCase();
      return subStatus === 'TRIAL' || planName.includes('trial') || (!o.pricingPlan && !o.pricingPlanId);
    }).length;

    const suspendedPastDue = organizations.filter(o => {
      const status = (o.status || '').toUpperCase();
      const subStatus = (o.subscriptionStatus || '').toUpperCase();
      return status === 'SUSPENDED' || subStatus === 'PAST_DUE' || subStatus === 'EXPIRED';
    }).length;

    return { totalSubscriptions, activePaidPlans, trialAccounts, suspendedPastDue };
  }, [organizations]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter(org => {
      const orgName = (org.name || '').toLowerCase();
      const orgId = (org.id || '').toLowerCase();
      const planName = (org.pricingPlan?.name || (org.subscriptionStatus === 'TRIAL' ? 'Trial' : org.plan || '')).toLowerCase();
      const orgStatus = (org.status || 'ACTIVE').toUpperCase();
      const subStatus = (org.subscriptionStatus || '').toUpperCase();

      const query = debouncedSearch.trim().toLowerCase();
      const matchesSearch = !query || orgName.includes(query) || orgId.includes(query) || planName.includes(query);

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = orgStatus === 'ACTIVE' && subStatus !== 'TRIAL';
      } else if (statusFilter === 'TRIAL') {
        matchesStatus = subStatus === 'TRIAL' || planName.includes('trial') || (!org.pricingPlan && !org.pricingPlanId);
      } else if (statusFilter === 'SUSPENDED') {
        matchesStatus = orgStatus === 'SUSPENDED';
      } else if (statusFilter === 'PAST_DUE') {
        matchesStatus = subStatus === 'PAST_DUE' || subStatus === 'EXPIRED';
      }

      let matchesPlan = true;
      if (planFilter !== 'ALL') {
        if (planFilter.toUpperCase() === 'TRIAL') {
          matchesPlan = subStatus === 'TRIAL' || planName.includes('trial') || (!org.pricingPlan && !org.pricingPlanId);
        } else {
          matchesPlan = (org.pricingPlan?.name || '').toUpperCase() === planFilter.toUpperCase();
        }
      }

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [organizations, debouncedSearch, statusFilter, planFilter]);

  const copyTenantId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedOrgId(id);
    showToast('Tenant ID copied to clipboard!');
    setTimeout(() => setCopiedOrgId(null), 2000);
  };

  const handleOpenEdit = (org) => {
    setSelectedOrg(org);
    const isTrial = (org.subscriptionStatus || '').toUpperCase() === 'TRIAL' || (!org.pricingPlan && !org.pricingPlanId);
    const currentPlanName = org.pricingPlan?.name || (isTrial ? 'Trial' : org.plan || 'Trial');
    const matchedPlan = pricingPlans.find(p => p.name === currentPlanName || p.id === org.pricingPlanId);

    setEditFormData({
      plan: currentPlanName,
      pricingPlanId: org.pricingPlanId || matchedPlan?.id || '',
      status: (org.status || 'ACTIVE').toUpperCase(),
      subscriptionStatus: (org.subscriptionStatus || (isTrial ? 'TRIAL' : 'ACTIVE')).toUpperCase(),
      maxEmployees: matchedPlan?.maxEmployees || org.pricingPlan?.maxEmployees || 15,
      billingCycle: org.billingCycle || 'Monthly'
    });
    setIsEditModalOpen(true);
  };

  const handlePlanChange = (selectedPlanName) => {
    if (selectedPlanName === 'Trial') {
      setEditFormData(prev => ({ ...prev, plan: 'Trial', pricingPlanId: '', maxEmployees: 15, subscriptionStatus: 'TRIAL' }));
      return;
    }
    const matchedPlan = pricingPlans.find(p => p.name === selectedPlanName);
    setEditFormData(prev => ({
      ...prev,
      plan: selectedPlanName,
      pricingPlanId: matchedPlan?.id || '',
      maxEmployees: matchedPlan?.maxEmployees || prev.maxEmployees,
      subscriptionStatus: 'ACTIVE'
    }));
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setIsSaving(true);
    try {
      const res = await superAdminAPI.updateOrgSubscription(selectedOrg.id, {
        plan: editFormData.plan,
        pricingPlanId: editFormData.pricingPlanId || undefined,
        status: editFormData.status,
        subscriptionStatus: editFormData.subscriptionStatus,
      });

      if (res.data?.success && res.data?.data) {
        setOrganizations(prev => prev.map(o => o.id === selectedOrg.id ? { ...o, ...res.data.data } : o));
      }
      showToast(`Subscription plan updated for ${selectedOrg.name}!`, 'success');
      setIsEditModalOpen(false);
      fetchSubscriptions(true);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update subscription', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = (org) => {
    const isCurrentlyActive = (org.status || '').toUpperCase() === 'ACTIVE';
    setConfirmDialog({
      isOpen: true,
      title: isCurrentlyActive ? 'Suspend Subscription' : 'Activate Subscription',
      message: isCurrentlyActive
        ? `Are you sure you want to suspend the subscription for "${org.name}"? Users from this tenant will be blocked from accessing the SaaS platform until reactivated.`
        : `Are you sure you want to activate the subscription for "${org.name}"? Full platform access will be restored immediately.`,
      confirmText: isCurrentlyActive ? 'Suspend Tenant' : 'Activate Tenant',
      dialogType: isCurrentlyActive ? 'danger' : 'primary',
      action: async () => {
        try {
          if (isCurrentlyActive) {
            await superAdminAPI.suspendOrganization(org.id);
            showToast(`Subscription for "${org.name}" suspended.`, 'success');
          } else {
            await superAdminAPI.activateOrganization(org.id);
            showToast(`Subscription for "${org.name}" activated!`, 'success');
          }
          fetchSubscriptions(true);
        } catch (err) {
          showToast(err.response?.data?.error?.message || 'Failed to update organization status', 'error');
        }
      }
    });
  };

  const getStatusBadge = (org) => {
    const s = (org.status || '').toUpperCase();
    const sub = (org.subscriptionStatus || '').toUpperCase();
    const isTrial = sub === 'TRIAL' || (!org.pricingPlan && !org.pricingPlanId);
    if (s === 'SUSPENDED') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">Suspended</span>;
    if (sub === 'PAST_DUE' || sub === 'EXPIRED') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">{sub === 'PAST_DUE' ? 'Past Due' : 'Expired'}</span>;
    if (isTrial) return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">Trial</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">Active</span>;
  };

  const getPlanBadge = (org) => {
    const isTrial = (org.subscriptionStatus || '').toUpperCase() === 'TRIAL' || (!org.pricingPlan && !org.pricingPlanId);
    const planName = org.pricingPlan?.name || (isTrial ? '14-Day Free Trial' : (org.plan || 'Custom'));
    const p = planName.toLowerCase();
    let style = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    if (p.includes('enterprise')) style = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    else if (p.includes('pro')) style = 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    else if (p.includes('starter') || p.includes('team')) style = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    else if (isTrial || p.includes('trial')) style = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${style}`}>{planName}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">{org.pricingPlan?.monthlyPrice ? `${formatCurrency(org.pricingPlan.monthlyPrice)}/mo` : (isTrial ? 'Trial Tier' : 'Custom')}</span>
      </div>
    );
  };

  return (
    <div className="hcm-superadmin-container pb-12">
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border ${toastMsg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:border-emerald-700 dark:text-emerald-200'}`}>
            {toastMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{toastMsg.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader title="Subscription Management" subtitle="Govern tenant subscription plans, renewals, seat entitlements, and billing lifecycles" icon={CreditCard}>
        <button type="button" className="btn-secondary btn-compact flex items-center gap-2" onClick={() => fetchSubscriptions(true)} disabled={isRefreshing} title="Refresh subscription data">
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-primary-600' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Subscriptions</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30"><CreditCard size={20} /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalSubscriptions}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all registered tenants</p>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Paid Plans</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"><CheckCircle size={20} /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.activePaidPlans}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generating recurring revenue</p>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Trial Accounts</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"><Clock size={20} /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.trialAccounts}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">14-day free trial tier</p>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Suspended / Past Due</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"><AlertCircle size={20} /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.suspendedPastDue}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Platform access blocked</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" className="input-field pl-10 w-full text-sm" placeholder="Search by organization name, plan, or tenant ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Status:</label>
            <select className="select-field text-xs py-2 px-3 min-w-[120px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PAST_DUE">Past Due</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Plan:</label>
            <select className="select-field text-xs py-2 px-3 min-w-[130px]" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              <option value="ALL">All Plans</option>
              <option value="TRIAL">14-Day Free Trial</option>
              {pricingPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          {(searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL') && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setPlanFilter('ALL'); }} className="btn-secondary btn-compact text-xs text-slate-600 dark:text-slate-300" title="Reset search and filters">Clear Filters</button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>Showing <strong className="text-slate-800 dark:text-slate-200">{filteredOrgs.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{organizations.length}</strong> subscriptions</span>
      </div>

      <div className="card p-0 overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
        <div className="hcm-table-container border-0 rounded-none overflow-x-auto w-full">
          <table className="hcm-table w-full text-left">
            <thead className="hcm-thead">
              <tr className="hcm-tr bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Organization</th>
                <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Current Plan</th>
                <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Seat Limit</th>
                <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Created Date</th>
                <th className="hcm-th py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr className="hcm-tr"><td colSpan={6} className="hcm-td py-16 text-center text-slate-400"><div className="flex flex-col items-center justify-center gap-2"><RefreshCw size={24} className="animate-spin text-primary-600" /><span className="text-sm font-medium">Loading subscription data...</span></div></td></tr>
              ) : filteredOrgs.length === 0 ? (
                <tr className="hcm-tr"><td colSpan={6} className="hcm-td py-16 text-center text-slate-400"><div className="max-w-md mx-auto space-y-2"><CreditCard className="w-8 h-8 text-slate-400 mx-auto" /><p className="font-semibold text-slate-700 dark:text-slate-300">No subscriptions found</p><p className="text-xs text-slate-500">No subscription records matched your search query or filters.</p></div></td></tr>
              ) : (
                filteredOrgs.map((org) => {
                  const isOrgActive = (org.status || '').toUpperCase() === 'ACTIVE';
                  const isTrial = (org.subscriptionStatus || '').toUpperCase() === 'TRIAL' || (!org.pricingPlan && !org.pricingPlanId);
                  const seatLimit = org.pricingPlan?.maxEmployees || (isTrial ? 15 : 50);
                  return (
                    <tr key={org.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="hcm-td py-4 px-4"><div className="flex items-center gap-3 min-w-[200px]"><div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border overflow-hidden ${isOrgActive ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{org.logoUrl ? (<img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />) : (org.name?.charAt(0).toUpperCase() || 'O')}</div><div className="min-w-0"><div className="font-bold text-slate-900 dark:text-white truncate" title={org.name}>{org.name}</div><div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5"><Hash className="w-3 h-3 text-slate-400 flex-shrink-0" /><span className="truncate">{org.id.slice(0, 12)}...</span><button onClick={() => copyTenantId(org.id)} className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0" title="Copy Tenant ID">{copiedOrgId === org.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}</button></div></div></div></td>
                      <td className="hcm-td py-4 px-4 whitespace-nowrap">{getPlanBadge(org)}</td>
                      <td className="hcm-td py-4 px-4 whitespace-nowrap">{getStatusBadge(org)}</td>
                      <td className="hcm-td py-4 px-4 whitespace-nowrap"><div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold"><Users size={14} className="text-slate-400" /><span>{seatLimit} Seats</span></div></td>
                      <td className="hcm-td py-4 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"><div className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /><span>{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}</span></div></td>
                      <td className="hcm-td py-4 px-4 text-right whitespace-nowrap"><div className="flex items-center justify-end gap-2"><button type="button" className="btn-secondary btn-compact text-xs flex items-center gap-1.5" onClick={() => handleOpenEdit(org)} title="Edit subscription plan"><Edit3 size={13} /><span>Edit Plan</span></button><button type="button" onClick={() => handleToggleStatus(org)} title={isOrgActive ? 'Suspend Subscription' : 'Activate Subscription'} className={`btn-compact text-xs flex items-center gap-1.5 ${isOrgActive ? 'btn-danger' : 'btn-success'}`}>{isOrgActive ? (<><PauseCircle size={14} /><span>Suspend</span></>) : (<><PlayCircle size={14} /><span>Activate</span></>)}</button></div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditModalOpen && selectedOrg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSaving && setIsEditModalOpen(false)} className="fixed inset-0" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40"><div><h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600" />Edit Subscription Plan</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{selectedOrg.name}</p></div><button disabled={isSaving} onClick={() => setIsEditModalOpen(false)} className="btn-ghost btn-icon btn-compact"><X size={18} /></button></div>
                <form onSubmit={handleSaveSubscription} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div><label className="form-label">Subscription Tier *</label><select className="select-field" value={editFormData.plan} onChange={(e) => handlePlanChange(e.target.value)}><option value="Trial">14-Day Free Trial (15 Seats)</option>{pricingPlans.map(p => <option key={p.id} value={p.name}>{p.name} ({formatCurrency(p.monthlyPrice)}/mo • {p.maxEmployees} Seats)</option>)}</select></div>
                  <div><label className="form-label">Max Employee Seats</label><div className="relative"><input type="number" disabled className="input-field bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed font-semibold text-slate-700 dark:text-slate-300" value={editFormData.maxEmployees} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Allocated by Tier</span></div></div>
                  <div><label className="form-label">Account Status</label><select className="select-field" value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}><option value="ACTIVE">Active (Full Access)</option><option value="SUSPENDED">Suspended (Blocked Access)</option><option value="INACTIVE">Inactive</option></select></div>
                  <div><label className="form-label">Subscription Lifecycle Status</label><select className="select-field" value={editFormData.subscriptionStatus} onChange={(e) => setEditFormData({ ...editFormData, subscriptionStatus: e.target.value })}><option value="ACTIVE">Active</option><option value="TRIAL">Trial Period</option><option value="PAST_DUE">Past Due</option><option value="EXPIRED">Expired</option></select></div>
                  <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800"><button type="button" className="btn-secondary" disabled={isSaving} onClick={() => setIsEditModalOpen(false)}>Cancel</button><button type="submit" className="btn-primary flex items-center gap-2" disabled={isSaving}>{isSaving ? <RefreshCw size={14} className="animate-spin" /> : null}<span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span></button></div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} confirmText={confirmDialog.confirmText} type={confirmDialog.dialogType} onConfirm={confirmDialog.action} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false, action: null }))} />
    </div>
  );
};

export default SubscriptionManagement;

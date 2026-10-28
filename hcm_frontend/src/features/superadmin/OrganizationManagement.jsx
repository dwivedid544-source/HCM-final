import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { superAdminAPI } from '../../utils/apiService';
import {
  Building2, Plus, Search, Trash2, Edit3, X,
  Shield, Mail, Phone, Calendar, PlayCircle, PauseCircle,
  Activity, ExternalLink, CheckCircle, CreditCard, Key,
  Copy, Check, Users, Layers, MapPin, RefreshCw,
  AlertTriangle, Filter, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';
import PageHeader from '../../shared/components/layout/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import ActionDropdown from '../admin/components/ActionDropdown';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import { useCurrency } from '../../hooks/useCurrency';

const OrganizationManagement = () => {
  const { formatCurrency } = useCurrency();

  // Organizations & Pagination State
  const [organizations, setOrganizations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 9; // 3 cards per row x 3 rows on desktop

  // Live Pricing Plans for plan assignment & filtering
  const [pricingPlans, setPricingPlans] = useState([]);

  // Modals & Selection State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Toast State
  const [showToastMsg, setShowToastMsg] = useState(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '',
    org: null,
    title: '',
    message: '',
    confirmText: 'Confirm',
    dialogType: 'danger',
    action: null
  });

  // Copy-to-clipboard tracker
  const [copiedOrgId, setCopiedOrgId] = useState(null);

  // ── DEBOUNCE SEARCH INPUT (300ms) ───────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const showToast = useCallback((msg, type = 'success') => {
    setShowToastMsg({ msg, type });
    setTimeout(() => setShowToastMsg(null), 3500);
  }, []);

  // ── FETCH ORGANIZATIONS DYNAMICALLY ─────────────────────────
  const fetchOrganizations = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    else setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        plan: planFilter !== 'ALL' ? planFilter : undefined,
      };

      const res = await superAdminAPI.getAllOrganizations(params);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setOrganizations(res.data.data);
        setTotalCount(res.data.meta?.total ?? res.data.data.length);
      } else {
        setOrganizations([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      showToast(err.response?.data?.error?.message || 'Failed to load organizations', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, planFilter, showToast]);

  // ── FETCH PRICING PLANS ──────────────────────────────────────
  const fetchPricingPlans = useCallback(async () => {
    try {
      const res = await superAdminAPI.getAdminPricingPlans();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPricingPlans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pricing plans:', err);
    }
  }, []);

  useEffect(() => {
    fetchPricingPlans();
  }, [fetchPricingPlans]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // ── COPY TENANT ID ───────────────────────────────────────────
  const copyTenantId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedOrgId(id);
    showToast('Tenant ID copied to clipboard!');
    setTimeout(() => setCopiedOrgId(null), 2000);
  };

  // ── PROVISION TENANT FORM STATE ──────────────────────────────
  const [provisionForm, setProvisionForm] = useState({
    orgName: '',
    industry: 'Technology',
    country: 'United States',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'Trial',
    billingCycle: 'Monthly',
  });
  const [isProvisioning, setIsProvisioning] = useState(false);

  const handleOpenProvisionModal = () => {
    setProvisionForm({
      orgName: '',
      industry: 'Technology',
      country: 'United States',
      adminFullName: '',
      adminEmail: '',
      adminPassword: '',
      plan: 'Trial',
      billingCycle: 'Monthly',
    });
    setIsProvisionModalOpen(true);
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    if (!provisionForm.orgName.trim() || !provisionForm.adminFullName.trim() || !provisionForm.adminEmail.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setIsProvisioning(true);
    try {
      const payload = {
        organization: {
          name: provisionForm.orgName.trim(),
          industry: provisionForm.industry.trim() || null,
          country: provisionForm.country.trim() || null,
        },
        admin: {
          fullName: provisionForm.adminFullName.trim(),
          email: provisionForm.adminEmail.trim().toLowerCase(),
          password: provisionForm.adminPassword.trim() || '12345678',
        },
        subscription: {
          plan: provisionForm.plan,
          billingCycle: provisionForm.billingCycle,
        }
      };

      const res = await superAdminAPI.provisionOrganization(payload);
      showToast(res.data?.message || `Tenant "${provisionForm.orgName}" provisioned successfully!`, 'success');
      setIsProvisionModalOpen(false);
      setPage(1);
      fetchOrganizations();
    } catch (err) {
      console.error('Provisioning error:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to provision organization';
      showToast(msg, 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  // ── VIEW TENANT DETAILS ──────────────────────────────────────
  const viewDetails = async (org) => {
    setSelectedOrg(org);
    setOrgDetails(null);
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await superAdminAPI.getOrganizationDetails(org.id);
      if (res.data?.success && res.data.data) {
        setOrgDetails(res.data.data);
      } else {
        setOrgDetails(org);
      }
    } catch (err) {
      console.error('Failed to load details:', err);
      showToast('Unable to load full tenant details', 'error');
      setOrgDetails(org);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ── EDIT TENANT METADATA ─────────────────────────────────────
  const [editFormData, setEditFormData] = useState({
    name: '',
    industry: '',
    address: '',
    primaryEmail: '',
    phone: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEditMetadata = (org) => {
    setSelectedOrg(org);
    setEditFormData({
      name: org.name || '',
      industry: org.industry || 'Technology',
      address: org.address || '',
      primaryEmail: org.primaryEmail || org.email || '',
      phone: org.phone || org.supportPhone || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditMetadata = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setIsSavingEdit(true);
    try {
      const res = await superAdminAPI.updateOrganization(selectedOrg.id, editFormData);
      showToast(res.data?.message || `Tenant "${editFormData.name}" updated successfully!`, 'success');
      setIsEditModalOpen(false);
      if (isDetailsModalOpen) {
        viewDetails({ ...selectedOrg, ...editFormData });
      }
      fetchOrganizations();
    } catch (err) {
      console.error('Update org metadata error:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update organization', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── EDIT TENANT SUBSCRIPTION ─────────────────────────────────
  const [subFormData, setSubFormData] = useState({
    plan: 'Trial',
    pricingPlanId: '',
    maxEmployees: 100,
    status: 'ACTIVE',
    subscriptionStatus: 'TRIAL',
  });
  const [isSavingSub, setIsSavingSub] = useState(false);

  const handleOpenEditSub = (org) => {
    setSelectedOrg(org);
    const currentPlanName = org.pricingPlan?.name || (org.subscriptionStatus === 'TRIAL' ? 'Trial' : org.plan || 'Trial');
    const matchedPlan = pricingPlans.find(p => p.name === currentPlanName || p.id === org.pricingPlanId);

    setSubFormData({
      plan: currentPlanName,
      pricingPlanId: org.pricingPlanId || matchedPlan?.id || '',
      maxEmployees: matchedPlan?.maxEmployees || org.pricingPlan?.maxEmployees || 100,
      status: (org.status || 'ACTIVE').toUpperCase(),
      subscriptionStatus: (org.subscriptionStatus || (currentPlanName === 'Trial' ? 'TRIAL' : 'ACTIVE')).toUpperCase()
    });
    setIsSubModalOpen(true);
  };

  const handlePlanChange = (selectedPlanName) => {
    if (selectedPlanName === 'Trial') {
      setSubFormData(prev => ({
        ...prev,
        plan: 'Trial',
        pricingPlanId: '',
        maxEmployees: 15,
        subscriptionStatus: 'TRIAL'
      }));
      return;
    }

    const matchedPlan = pricingPlans.find(p => p.name === selectedPlanName);
    setSubFormData(prev => ({
      ...prev,
      plan: selectedPlanName,
      pricingPlanId: matchedPlan?.id || '',
      maxEmployees: matchedPlan?.maxEmployees || prev.maxEmployees,
      subscriptionStatus: 'ACTIVE'
    }));
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setIsSavingSub(true);
    try {
      await superAdminAPI.updateOrgSubscription(selectedOrg.id, {
        plan: subFormData.plan,
        pricingPlanId: subFormData.pricingPlanId || undefined,
        status: subFormData.status,
        subscriptionStatus: subFormData.subscriptionStatus,
      });
      showToast(`Subscription plan updated for ${selectedOrg.name}!`, 'success');
      setIsSubModalOpen(false);
      if (isDetailsModalOpen) {
        viewDetails(selectedOrg);
      }
      fetchOrganizations();
    } catch (err) {
      console.error('Failed to update subscription:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update subscription plan', 'error');
    } finally {
      setIsSavingSub(false);
    }
  };

  // ── ACTIVATE / SUSPEND TENANT ────────────────────────────────
  const handleToggleStatus = (org) => {
    const isCurrentlyActive = (org.status || '').toUpperCase() === 'ACTIVE';
    setConfirmDialog({
      isOpen: true,
      org,
      title: isCurrentlyActive ? 'Suspend Tenant' : 'Activate Tenant',
      message: isCurrentlyActive
        ? `Are you sure you want to suspend "${org.name}"? Users and employees belonging to this tenant will temporarily lose access to the platform.`
        : `Are you sure you want to activate "${org.name}"? This will restore complete platform access for all tenant users.`,
      confirmText: isCurrentlyActive ? 'Suspend Tenant' : 'Activate Tenant',
      dialogType: isCurrentlyActive ? 'danger' : 'primary',
      action: async () => {
        try {
          if (isCurrentlyActive) {
            await superAdminAPI.suspendOrganization(org.id);
            showToast(`Tenant "${org.name}" has been suspended.`, 'success');
          } else {
            await superAdminAPI.activateOrganization(org.id);
            showToast(`Tenant "${org.name}" has been activated!`, 'success');
          }
          fetchOrganizations();
        } catch (err) {
          showToast(err.response?.data?.error?.message || 'Failed to update status', 'error');
        }
      }
    });
  };

  // ── DELETE TENANT ───────────────────────────────────────────
  const handleDeleteTenant = (org) => {
    setConfirmDialog({
      isOpen: true,
      org,
      title: 'Delete Tenant Organization',
      message: `Are you sure you want to permanently delete "${org.name}"? This will irreversibly erase the organization, all associated users, departments, employee profiles, and payroll data. This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      dialogType: 'danger',
      action: async () => {
        try {
          await superAdminAPI.deleteOrganization(org.id);
          showToast(`Organization "${org.name}" deleted permanently.`, 'success');
          fetchOrganizations();
        } catch (err) {
          console.error('Delete org error:', err);
          showToast(err.response?.data?.error?.message || 'Failed to delete organization', 'error');
        }
      }
    });
  };

  // ── TOTAL PAGES CALCULATION ──────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="hcm-superadmin-container">
      <PageHeader
        title="Organization Management"
        subtitle="Provision and govern multi-tenant organizations across the SaaS platform"
        icon={Building2}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrganizations(true)}
            disabled={isRefreshing}
            className="btn-secondary flex items-center gap-2"
            title="Refresh organizations list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={handleOpenProvisionModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Provision Tenant</span>
          </button>
        </div>
      </PageHeader>

      {/* Global Notification Toast */}
      {showToastMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-5 ${
          showToastMsg.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {showToastMsg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{showToastMsg.msg}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Dynamic Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, industry, or tenant ID..."
            className="input-field pl-10 w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Status:</label>
            <select
              className="select-field text-xs py-2 px-3 min-w-[120px]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Plan:</label>
            <select
              className="select-field text-xs py-2 px-3 min-w-[130px]"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Plans</option>
              <option value="TRIAL">14-Day Trial</option>
              {pricingPlans.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPlanFilter('ALL');
                setPage(1);
              }}
              className="btn-secondary btn-compact text-xs text-slate-600 dark:text-slate-300"
              title="Reset search and filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Meta Counter Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{organizations.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> organizations
        </span>
        {totalPages > 1 && (
          <span>Page {page} of {totalPages}</span>
        )}
      </div>

      {/* Organizations Responsive Grid (1-col mobile, 2-col tablet, 3-col desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading tenant organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          /* Empty State */
          <div className="col-span-full py-16 px-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/30">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              No organizations found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL'
                ? `No organizations matched your current filters. Try refining your search query or reset filters.`
                : 'There are currently zero SaaS tenants provisioned in the platform database.'}
            </p>
            {searchTerm || statusFilter !== 'ALL' || planFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setPlanFilter('ALL');
                  setPage(1);
                }}
                className="btn-secondary"
              >
                Clear All Filters
              </button>
            ) : (
              <button onClick={handleOpenProvisionModal} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Provision First Tenant
              </button>
            )}
          </div>
        ) : (
          organizations.map((org) => {
            const isOrgActive = (org.status || '').toUpperCase() === 'ACTIVE';
            const isSuspended = (org.status || '').toUpperCase() === 'SUSPENDED';
            const isTrial = (org.subscriptionStatus || '').toUpperCase() === 'TRIAL' || (!org.pricingPlan && !org.pricingPlanId);
            const planDisplayName = org.pricingPlan?.name || (isTrial ? '14-Day Free Trial' : (org.plan || 'Custom Plan'));

            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="card w-full relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Status indicator line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isOrgActive ? 'bg-emerald-500' : (isSuspended ? 'bg-rose-500' : 'bg-amber-500')
                }`} />

                <div className="p-5 flex-1 flex flex-col justify-between">
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 shadow-xs overflow-hidden ${
                          isOrgActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {org.logoUrl ? (
                            <img
                              src={org.logoUrl}
                              alt={org.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            org.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug truncate" title={org.name}>
                            {org.name}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                            {org.industry || 'General Industry'}
                          </span>
                        </div>
                      </div>

                      {/* Action Dropdown */}
                      <ActionDropdown
                        trigger={
                          <button className="btn-icon btn-compact p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg" title="Tenant actions">
                            <Edit3 size={15} />
                          </button>
                        }
                        items={[
                          { label: 'View Details', icon: ExternalLink, onClick: () => viewDetails(org) },
                          { label: 'Edit Metadata', icon: Edit3, onClick: () => handleOpenEditMetadata(org) },
                          { label: 'Change Plan / Seats', icon: CreditCard, onClick: () => handleOpenEditSub(org) },
                          {
                            label: isOrgActive ? 'Suspend Tenant' : 'Activate Tenant',
                            icon: isOrgActive ? PauseCircle : PlayCircle,
                            onClick: () => handleToggleStatus(org),
                            danger: isOrgActive
                          },
                          { label: 'Delete Organization', icon: Trash2, onClick: () => handleDeleteTenant(org), danger: true }
                        ]}
                      />
                    </div>

                    {/* Tenant Identifier Badge */}
                    <div className="mb-4 flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono truncate">
                        <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{org.id.slice(0, 16)}...</span>
                      </span>
                      <button
                        onClick={() => copyTenantId(org.id)}
                        className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0 ml-2"
                        title="Copy Tenant UUID"
                      >
                        {copiedOrgId === org.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Plan & Status Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {/* Real Subscription Plan */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-indigo-500" /> Plan
                        </p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={planDisplayName}>
                          {planDisplayName}
                        </p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {org.pricingPlan?.monthlyPrice ? `${formatCurrency(org.pricingPlan.monthlyPrice)}/mo` : (isTrial ? 'Trial Tier' : 'Custom')}
                        </span>
                      </div>

                      {/* Database Status */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-500" /> Status
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5 border ${
                          isOrgActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                            : (isSuspended
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700')
                        }`}>
                          {isOrgActive ? 'Active' : (isSuspended ? 'Suspended' : org.status)}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry Summary Row */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Users</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{org._count?.users || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Employees</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{org._count?.employeeProfiles || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Depts</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{org._count?.departments || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => viewDetails(org)}
                      className="btn-secondary btn-compact text-xs font-semibold py-1 px-2.5"
                    >
                      Manage &rarr;
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="btn-secondary btn-compact p-2 disabled:opacity-40"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                page === p
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="btn-secondary btn-compact p-2 disabled:opacity-40"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── PROVISION TENANT MODAL ─────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isProvisionModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0"
                onClick={() => !isProvisioning && setIsProvisionModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 10 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Provision SaaS Tenant Organization
                  </h2>
                  <button
                    disabled={isProvisioning}
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="btn-ghost btn-icon btn-compact"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Form Body */}
                <form id="provisionForm" onSubmit={handleProvisionSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* 1. Organization Profile */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" /> 1. Organization Profile
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Organization Name *</label>
                        <input
                          required
                          type="text"
                          value={provisionForm.orgName}
                          onChange={(e) => setProvisionForm({ ...provisionForm, orgName: e.target.value })}
                          placeholder="e.g., Nexus Global Technologies"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Industry</label>
                        <select
                          value={provisionForm.industry}
                          onChange={(e) => setProvisionForm({ ...provisionForm, industry: e.target.value })}
                          className="select-field"
                        >
                          <option value="Technology">Technology</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Finance">Finance & Banking</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Retail">Retail & E-commerce</option>
                          <option value="Education">Education</option>
                          <option value="Professional Services">Professional Services</option>
                          <option value="Hospitality">Hospitality</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label">Location / Country</label>
                        <input
                          type="text"
                          value={provisionForm.country}
                          onChange={(e) => setProvisionForm({ ...provisionForm, country: e.target.value })}
                          placeholder="e.g., United States / Headquarters"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Primary Tenant Administrator */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" /> 2. Primary Administrator Account
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Admin Full Name *</label>
                        <input
                          required
                          type="text"
                          value={provisionForm.adminFullName}
                          onChange={(e) => setProvisionForm({ ...provisionForm, adminFullName: e.target.value })}
                          placeholder="e.g., Jane Smith"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="form-label">Admin Email Address *</label>
                        <input
                          required
                          type="email"
                          value={provisionForm.adminEmail}
                          onChange={(e) => setProvisionForm({ ...provisionForm, adminEmail: e.target.value })}
                          placeholder="e.g., admin@nexusglobal.com"
                          className="input-field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="form-label">Initial Password (Optional)</label>
                        <input
                          type="text"
                          value={provisionForm.adminPassword}
                          onChange={(e) => setProvisionForm({ ...provisionForm, adminPassword: e.target.value })}
                          placeholder="Leave blank for default: 12345678"
                          className="input-field"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Key className="w-3 h-3 text-indigo-600" /> Default credentials will be generated with role <strong>ADMIN</strong> and an initial employee profile.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Subscription & Billing Tier */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" /> 3. SaaS Subscription Tier
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Subscription Tier *</label>
                        <select
                          value={provisionForm.plan}
                          onChange={(e) => setProvisionForm({ ...provisionForm, plan: e.target.value })}
                          className="select-field"
                        >
                          <option value="Trial">14-Day Free Trial (15 Seats)</option>
                          {pricingPlans && pricingPlans.length > 0 ? (
                            pricingPlans.filter(p => p.isActive !== false).map(p => (
                              <option key={p.id} value={p.name}>
                                {p.name} ({formatCurrency(p.monthlyPrice)}/mo • {p.maxEmployees} Seats)
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Starter">Starter Plan</option>
                              <option value="Professional">Professional Plan</option>
                              <option value="Enterprise">Enterprise Plan</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Billing Cycle</label>
                        <select
                          value={provisionForm.billingCycle}
                          onChange={(e) => setProvisionForm({ ...provisionForm, billingCycle: e.target.value })}
                          className="select-field"
                        >
                          <option value="Monthly">Monthly Billing</option>
                          <option value="Yearly">Annual Billing (Discounted)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/60 dark:bg-slate-800/40">
                  <button
                    type="button"
                    disabled={isProvisioning}
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="provisionForm"
                    disabled={isProvisioning}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isProvisioning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Provisioning Tenant...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Provision Tenant</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── VIEW TENANT DETAILS MODAL ──────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isDetailsModalOpen && selectedOrg && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0"
                onClick={() => setIsDetailsModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 10 }}
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-3xl w-full z-10 overflow-hidden flex flex-col max-h-[88vh]"
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30 overflow-hidden shrink-0">
                      {(orgDetails?.logoUrl || selectedOrg.logoUrl) ? (
                        <img
                          src={orgDetails?.logoUrl || selectedOrg.logoUrl}
                          alt={selectedOrg.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        selectedOrg.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedOrg.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        ID: {selectedOrg.id}
                      </p>
                    </div>
                  </div>
                  <button className="btn-ghost btn-icon btn-compact" onClick={() => setIsDetailsModalOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {loadingDetails ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
                      <p className="text-xs text-slate-500">Loading tenant details from database...</p>
                    </div>
                  ) : (
                    <>
                      {/* KPI Telemetry Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Status</span>
                          <span className={`text-base font-bold ${
                            (orgDetails?.status || selectedOrg.status).toUpperCase() === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {orgDetails?.status || selectedOrg.status}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Users</span>
                          <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                            {orgDetails?._count?.users ?? selectedOrg._count?.users ?? 0}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Employees</span>
                          <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                            {orgDetails?._count?.employeeProfiles ?? selectedOrg._count?.employeeProfiles ?? 0}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Departments</span>
                          <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                            {orgDetails?._count?.departments ?? selectedOrg._count?.departments ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* 2-Column Split: Subscription & Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Active Subscription Details */}
                        <div className="bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-indigo-600" /> SaaS Subscription</span>
                            <button
                              onClick={() => {
                                setIsDetailsModalOpen(false);
                                handleOpenEditSub(selectedOrg);
                              }}
                              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                            >
                              Edit Plan &rarr;
                            </button>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Plan Tier:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {orgDetails?.pricingPlan?.name || (orgDetails?.subscriptionStatus === 'TRIAL' ? '14-Day Free Trial' : 'No Assigned Tier')}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Subscription Status:</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {orgDetails?.subscriptionStatus || 'TRIAL'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Seat Capacity:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {orgDetails?.pricingPlan?.maxEmployees ? `${orgDetails.pricingPlan.maxEmployees} Seats` : '15 Seats (Trial)'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Monthly Price:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {orgDetails?.pricingPlan?.monthlyPrice ? `${formatCurrency(orgDetails.pricingPlan.monthlyPrice)}/mo` : 'Free / Trial'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tenant Organization Metadata */}
                        <div className="bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-indigo-600" /> Organization Profile</span>
                            <button
                              onClick={() => {
                                setIsDetailsModalOpen(false);
                                handleOpenEditMetadata(selectedOrg);
                              }}
                              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                            >
                              Edit Profile &rarr;
                            </button>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Industry:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {orgDetails?.industry || selectedOrg.industry || 'Not specified'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Headquarters / Country:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {orgDetails?.address || selectedOrg.address || 'Headquarters'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Primary Contact:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {orgDetails?.primaryEmail || orgDetails?.email || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Tenant Joined Date:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(orgDetails?.createdAt || selectedOrg.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Departments Breakdown */}
                      {orgDetails?.departments && orgDetails.departments.length > 0 && (
                        <div className="bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Configured Departments ({orgDetails.departments.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {orgDetails.departments.map(dept => (
                              <div key={dept.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.name}</span>
                                <span className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                                  {dept._count?.employees || 0} emp
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/60 dark:bg-slate-800/40">
                  <button onClick={() => setIsDetailsModalOpen(false)} className="btn-secondary">
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── EDIT TENANT METADATA MODAL ─────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditModalOpen && selectedOrg && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0" onClick={() => !isSavingEdit && setIsEditModalOpen(false)} />
              <motion.div initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 10 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full relative z-10 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                    Edit Tenant: {selectedOrg.name}
                  </h2>
                  <button disabled={isSavingEdit} onClick={() => setIsEditModalOpen(false)} className="btn-ghost btn-icon btn-compact">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditMetadata} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="form-label">Organization Name *</label>
                    <input
                      required
                      type="text"
                      className="input-field"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Industry</label>
                    <select
                      className="select-field"
                      value={editFormData.industry}
                      onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                    >
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance & Banking</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail & E-commerce</option>
                      <option value="Education">Education</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Hospitality">Hospitality</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Headquarters / Location</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. San Francisco, CA"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Primary Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. contact@nexusglobal.com"
                      value={editFormData.primaryEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, primaryEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Support Phone</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button type="button" disabled={isSavingEdit} onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSavingEdit} className="btn-primary">
                      {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── EDIT SUBSCRIPTION / CHANGE PLAN MODAL ──────────────── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isSubModalOpen && selectedOrg && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0" onClick={() => !isSavingSub && setIsSubModalOpen(false)} />
              <motion.div initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 10 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full relative z-10 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Edit Subscription: {selectedOrg.name}
                  </h2>
                  <button disabled={isSavingSub} onClick={() => setIsSubModalOpen(false)} className="btn-ghost btn-icon btn-compact">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSub} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="form-label">Subscription Tier</label>
                    <select
                      className="select-field"
                      value={subFormData.plan}
                      onChange={(e) => handlePlanChange(e.target.value)}
                    >
                      <option value="Trial">14-Day Free Trial (15 Seats)</option>
                      {pricingPlans && pricingPlans.length > 0 ? (
                        pricingPlans.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({formatCurrency(p.monthlyPrice)}/mo • {p.maxEmployees} Seats)
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Starter">Starter Plan</option>
                          <option value="Professional">Professional Plan</option>
                          <option value="Enterprise">Enterprise Plan</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Seat Limit</label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled
                        className="input-field bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed font-semibold text-slate-700 dark:text-slate-300"
                        value={subFormData.maxEmployees}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        Allocated by Tier
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Account Status</label>
                    <select
                      className="select-field"
                      value={subFormData.status}
                      onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button type="button" disabled={isSavingSub} onClick={() => setIsSubModalOpen(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSavingSub} className="btn-primary">
                      {isSavingSub ? 'Updating...' : 'Update Subscription'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── GENERIC CONFIRM DIALOG ─────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.dialogType}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false, org: null, action: null }))}
      />
    </div>
  );
};

export default OrganizationManagement;


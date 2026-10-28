import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Check, X, Save, RefreshCw, AlertCircle, CheckCircle,
  Layers, Lock, Sparkles, Sliders, Info, Zap, Search, Filter,
  CheckCheck, XCircle, ArrowUpDown, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import PageHeader from '../../shared/components/layout/PageHeader';
import { superAdminAPI } from '../../utils/apiService';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureManagement = () => {
  const [featureConfig, setFeatureConfig] = useState({
    features: [],
    plans: {},
    plansList: []
  });
  const [loading, setLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [togglingKeys, setTogglingKeys] = useState({}); // { `${planId}-${featureId}`: true }
  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'cards'

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getPlatformFeatures();
      if (res.data?.data) {
        setFeatureConfig(res.data.data);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      showToast('Failed to load feature matrix', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const plansList = useMemo(() => {
    if (Array.isArray(featureConfig.plansList) && featureConfig.plansList.length > 0) {
      return featureConfig.plansList;
    }
    return Object.keys(featureConfig.plans || {}).map(name => ({ id: name, name }));
  }, [featureConfig.plansList, featureConfig.plans]);

  // Dynamic categories from backend database with fallback
  const categories = useMemo(() => {
    if (Array.isArray(featureConfig.categories) && featureConfig.categories.length > 0) {
      return featureConfig.categories;
    }
    const cats = new Set((featureConfig.features || []).map(f => f.category));
    return ['ALL', ...Array.from(cats)];
  }, [featureConfig.categories, featureConfig.features]);

  // Filter features based on search and category
  const filteredFeatures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (featureConfig.features || []).filter(feature => {
      const matchesSearch = 
        !query ||
        (feature.name && feature.name.toLowerCase().includes(query)) ||
        (feature.description && feature.description.toLowerCase().includes(query)) ||
        (feature.category && feature.category.toLowerCase().includes(query)) ||
        (feature.id && feature.id.toLowerCase().includes(query));
      const matchesCategory = selectedCategory === 'ALL' || feature.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [featureConfig.features, searchQuery, selectedCategory]);

  // Check if a feature is enabled for a plan
  const isFeatureEnabled = (plan, featureId) => {
    const planNameFeatures = featureConfig.plans[plan.name] || [];
    const planIdFeatures = plan.id ? (featureConfig.plans[plan.id] || []) : [];
    return planNameFeatures.includes(featureId) || planIdFeatures.includes(featureId);
  };

  // Instant toggle with optimistic update & auto-save to backend
  const handleToggleFeature = async (plan, feature) => {
    const planKey = plan.name;
    const planId = plan.id;
    const featureId = feature.id;
    const isCurrentlyEnabled = isFeatureEnabled(plan, featureId);
    const nextState = !isCurrentlyEnabled;

    const toggleKey = `${planId || planKey}-${featureId}`;
    setTogglingKeys(prev => ({ ...prev, [toggleKey]: true }));

    // Optimistic UI Update
    setFeatureConfig(prev => {
      const updatePlanArray = (currList = []) => {
        return nextState
          ? (currList.includes(featureId) ? currList : [...currList, featureId])
          : currList.filter(id => id !== featureId);
      };

      const newPlans = { ...prev.plans };
      if (planKey) newPlans[planKey] = updatePlanArray(newPlans[planKey]);
      if (planId && planId !== planKey) newPlans[planId] = updatePlanArray(newPlans[planId]);

      return {
        ...prev,
        plans: newPlans
      };
    });

    // Auto-save to backend
    try {
      const res = await superAdminAPI.togglePlatformFeature({
        planId,
        planName: planKey,
        featureId,
        isEnabled: nextState
      });

      if (res.data?.success) {
        showToast(`${feature.name} ${nextState ? 'enabled' : 'disabled'} for ${plan.name}`, 'success');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showToast(`Failed to update ${feature.name}. Reverting...`, 'error');
      // Revert on failure
      setFeatureConfig(prev => {
        const revertPlanArray = (currList = []) => {
          return isCurrentlyEnabled
            ? (currList.includes(featureId) ? currList : [...currList, featureId])
            : currList.filter(id => id !== featureId);
        };
        const revertedPlans = { ...prev.plans };
        if (planKey) revertedPlans[planKey] = revertPlanArray(revertedPlans[planKey]);
        if (planId && planId !== planKey) revertedPlans[planId] = revertPlanArray(revertedPlans[planId]);
        return { ...prev, plans: revertedPlans };
      });
    } finally {
      setTogglingKeys(prev => {
        const next = { ...prev };
        delete next[toggleKey];
        return next;
      });
    }
  };

  // Bulk enable/disable all features for a plan
  const handleBulkAction = async (plan, enableAll) => {
    const allFeatureIds = enableAll ? featureConfig.features.map(f => f.id) : [];
    const planKey = plan.name;
    const planId = plan.id;

    // Optimistic update
    setFeatureConfig(prev => {
      const newPlans = { ...prev.plans };
      if (planKey) newPlans[planKey] = allFeatureIds;
      if (planId && planId !== planKey) newPlans[planId] = allFeatureIds;
      return { ...prev, plans: newPlans };
    });

    setIsSavingAll(true);
    try {
      await superAdminAPI.updatePlatformFeatures({
        plans: {
          [planId || planKey]: allFeatureIds
        }
      });
      showToast(`${enableAll ? 'Enabled all' : 'Disabled all'} features for ${plan.name}`, 'success');
    } catch (err) {
      showToast('Failed to update plan features', 'error');
      fetchFeatures();
    } finally {
      setIsSavingAll(false);
    }
  };

  // Save all changes explicitly
  const handleSaveAllChanges = async () => {
    setIsSavingAll(true);
    try {
      await superAdminAPI.updatePlatformFeatures({ plans: featureConfig.plans });
      showToast('All plan feature entitlements saved and published across the platform!', 'success');
      setHasUnsavedChanges(false);
    } catch (err) {
      showToast('Failed to save feature matrix configuration', 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="hcm-superadmin-container pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium border backdrop-blur-md ${
              toastMsg.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200'
                : 'bg-emerald-50/95 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
            }`}
          >
            {toastMsg.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
            <span>{toastMsg.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Feature Management"
        subtitle="Configure module access, feature flags, and entitlement matrices across all SaaS subscription tiers."
        icon={ShieldCheck}
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchFeatures}
              disabled={loading}
              className="btn-secondary btn-compact">
              <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleSaveAllChanges}
              disabled={isSavingAll}
              className="btn-primary btn-compact">
              {isSavingAll ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Save Changes</span>
            </button>
          </div>
        }
      />

      {/* Plan Entitlement Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plansList.map(plan => {
          const totalFeatures = featureConfig.features.length || 15;
          const enabledCount = (featureConfig.features || []).filter(f => isFeatureEnabled(plan, f.id)).length;
          const percentage = Math.round((enabledCount / (totalFeatures || 1)) * 100);

          return (
            <div
              key={plan.id || plan.name}
              className="card p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base truncate">
                      {plan.name}
                    </span>
                    {plan.isPopular && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {plan.monthlyPrice !== undefined ? `${plan.currency || '$'}${plan.monthlyPrice}/month` : 'Tier Plan'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {enabledCount} / {totalFeatures}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">
                    Features ({percentage}%)
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Quick Bulk Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px]">Quick Action:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkAction(plan, true)}
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    Enable All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => handleBulkAction(plan, false)}
                    className="font-medium text-rose-600 dark:text-rose-400 hover:underline">
                    Disable All
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl flex items-start gap-3.5 text-sm text-indigo-900 dark:text-indigo-200">
        <Info size={20} className="shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <span className="font-semibold">Live SaaS Modular Entitlement Guard: </span>
          Clicking any feature toggle auto-saves and updates tenant access in real time. Disabled modules are restricted across tenant portals and guarded at the API layer.
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, features, or keywords..."
            className="w-full pl-9 pr-14 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              Clear
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Matrix Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* View 1: Matrix Table with contained horizontal scroll */}
      {viewMode === 'matrix' ? (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 w-2/5 min-w-[260px]">HCM Module / Feature</th>
                <th className="px-4 py-4 min-w-[140px]">Category</th>
                {plansList.map(plan => (
                  <th key={plan.id || plan.name} className="px-4 py-4 text-center min-w-[130px]">
                    <div className="inline-flex flex-col items-center gap-0.5">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold">
                        {plan.name}
                      </span>
                      {plan.monthlyPrice !== undefined && (
                        <span className="text-[11px] font-medium text-slate-500 lowercase">
                          {plan.currency || '$'}{plan.monthlyPrice}/mo
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={plansList.length + 2} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading authoritative feature matrix from database...
                  </td>
                </tr>
              ) : filteredFeatures.length === 0 ? (
                <tr>
                  <td colSpan={plansList.length + 2} className="px-6 py-12 text-center text-slate-500">
                    No modules or features match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFeatures.map(feature => (
                  <tr key={feature.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {feature.id.includes('ai') && <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        <span>{feature.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feature.description}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {feature.category}
                      </span>
                    </td>
                    {plansList.map(plan => {
                      const isEnabled = isFeatureEnabled(plan, feature.id);
                      const toggleKey = `${plan.id || plan.name}-${feature.id}`;
                      const isToggling = !!togglingKeys[toggleKey];

                      return (
                        <td key={plan.id || plan.name} className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(plan, feature)}
                            disabled={isToggling}
                            className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all ${
                              isToggling
                                ? 'bg-slate-200 dark:bg-slate-700 animate-pulse cursor-wait'
                                : isEnabled
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs hover:bg-emerald-200 dark:hover:bg-emerald-900/80 cursor-pointer active:scale-95'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer active:scale-95'
                            }`}
                            title={`${isEnabled ? 'Enabled' : 'Disabled'} for ${plan.name} (Click to toggle)`}
                          >
                            {isToggling ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : isEnabled ? (
                              <Check size={18} strokeWidth={2.8} />
                            ) : (
                              <X size={16} strokeWidth={2} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* View 2: Responsive Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFeatures.map(feature => (
            <div
              key={`card-${feature.id}`}
              className="card p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    {feature.id.includes('ai') && <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    <span>{feature.name}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    {feature.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
              </div>

              {/* Plan Toggles Grid */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan Entitlements:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {plansList.map(plan => {
                    const isEnabled = isFeatureEnabled(plan, feature.id);
                    const toggleKey = `${plan.id || plan.name}-${feature.id}`;
                    const isToggling = !!togglingKeys[toggleKey];

                    return (
                      <button
                        key={`toggle-${plan.id || plan.name}-${feature.id}`}
                        type="button"
                        onClick={() => handleToggleFeature(plan, feature)}
                        disabled={isToggling}
                        className={`btn-secondary flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isEnabled
                            ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span className="truncate">{plan.name}</span>
                        <div className="shrink-0 ml-1.5">
                          {isToggling ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : isEnabled ? (
                            <span className="flex items-center gap-0.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                              <Check size={13} strokeWidth={3} /> ON
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[11px] text-slate-400 font-normal">
                              <X size={12} /> OFF
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeatureManagement;

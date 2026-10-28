import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, X, CheckCircle2, Check, Zap, ShieldCheck,
  Sparkles, Users, ArrowRight, Building, Award, Plus,
  Layers, CreditCard, ChevronRight, Loader2
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { useCurrency } from '../../../hooks/useCurrency';
import { cn } from '../../../utils/cn';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    tier: 'Essential',
    monthlyPrice: 99,
    yearlyPrice: 79,
    usersLimit: 15,
    userLabel: 'Up to 15 team members',
    badge: null,
    highlight: false,
    description: 'Perfect for small teams and emerging startups establishing core HR.',
    features: [
      'Basic Workforce Reporting',
      'Attendance & Time Off Tracking',
      'Standard Support (24h SLA)',
      '10GB Secure Document Cloud',
      'Employee Self-Service Portal',
      'Standard Tax Calculations'
    ]
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    tier: 'Professional',
    monthlyPrice: 299,
    yearlyPrice: 239,
    usersLimit: 75,
    userLabel: 'Up to 75 team members',
    badge: 'MOST POPULAR',
    highlight: true,
    description: 'Designed for fast-growing companies that need advanced analytics and automation.',
    features: [
      'Everything in Starter, plus:',
      'Advanced Workforce Analytics & KPIs',
      'Priority 24/7 Chat & Ticket Support',
      'Multi-Currency Global Payroll',
      '100GB Document Cloud & e-Signatures',
      'Custom Role-Based Access (RBAC)',
      'Biometric & Shift Scheduling'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    tier: 'Enterprise',
    monthlyPrice: 4280,
    yearlyPrice: 3420,
    usersLimit: 'Unlimited',
    userLabel: 'Unlimited staff & subsidiaries',
    badge: 'BEST FOR SCALE',
    highlight: false,
    description: 'Enterprise-grade infrastructure, bespoke compliance, and dedicated support.',
    features: [
      'Everything in Growth, plus:',
      'Unlimited Active Employee Seats',
      'Dedicated Strategic Account Manager',
      '24/7 Phone & Dedicated Slack Channel',
      'Enterprise SSO (SAML, Okta, Azure)',
      'Unlimited Storage & Automated Backups',
      'Full REST API & Custom Webhooks',
      '99.99% Uptime SLA & SOC-2 Vault'
    ]
  }
];

const AVAILABLE_ADDONS = [
  {
    id: 'ai_engine',
    name: 'AI Workforce Intelligence Copilot',
    desc: 'Predictive attrition analytics, automated review synthesis, and candidate scoring.',
    monthly: 49,
    yearly: 39
  },
  {
    id: 'compliance_vault',
    name: 'Global Statutory Compliance Vault',
    desc: 'Automated multi-jurisdiction tax filings, audits, and legal template generator.',
    monthly: 79,
    yearly: 65
  },
  {
    id: 'dedicated_support',
    name: 'Dedicated 24/7 Priority Concierge',
    desc: '15-minute SLA on all tickets, direct phone line, and quarterly strategic reviews.',
    monthly: 129,
    yearly: 99
  }
];

const UpgradePlanModal = ({ isOpen, onClose }) => {
  const { billingPlan = {}, updatePlan, showToast } = useAdmin();
  const { formatCurrency, masterCurrency } = useCurrency();

  const [cycle, setCycle] = useState(billingPlan?.cycle || 'Monthly');
  const [selectedPlanName, setSelectedPlanName] = useState(billingPlan?.name || 'Enterprise Plan');
  const [selectedAddons, setSelectedAddons] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from current plan
  useEffect(() => {
    if (isOpen) {
      setCycle(billingPlan?.cycle || 'Monthly');
      setSelectedPlanName(billingPlan?.name || 'Enterprise Plan');

      // Initialize addons if any
      let currentAddons = [];
      if (Array.isArray(billingPlan?.addons)) {
        currentAddons = billingPlan.addons;
      } else if (typeof billingPlan?.addons === 'string') {
        try { currentAddons = JSON.parse(billingPlan.addons); } catch {}
      }
      setSelectedAddons(new Set(currentAddons.map(a => {
        const match = AVAILABLE_ADDONS.find(ad => ad.name.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(ad.id));
        return match ? match.id : null;
      }).filter(Boolean)));
    }
  }, [isOpen, billingPlan]);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isSubmitting, onClose]);

  // Find active selected plan object
  const activePlan = useMemo(() => {
    return PLANS.find(p => p.name === selectedPlanName) || PLANS[2];
  }, [selectedPlanName]);

  // Check if selected plan is the current active subscription
  const isCurrentActive = useMemo(() => {
    return billingPlan?.name === activePlan.name && (billingPlan?.cycle || 'Monthly') === cycle;
  }, [billingPlan, activePlan, cycle]);

  // Dynamic pricing calculation
  const planBasePrice = cycle === 'Monthly' ? activePlan.monthlyPrice : activePlan.yearlyPrice;
  const planRegularPrice = activePlan.monthlyPrice;

  const addonsTotal = useMemo(() => {
    let sum = 0;
    selectedAddons.forEach(id => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id);
      if (addon) {
        sum += (cycle === 'Monthly' ? addon.monthly : addon.yearly);
      }
    });
    return sum;
  }, [selectedAddons, cycle]);

  const totalMonthlyEquivalent = planBasePrice + addonsTotal;
  const annualSavings = useMemo(() => {
    if (cycle !== 'Yearly') return 0;
    const monthlyTotal = activePlan.monthlyPrice * 12;
    const yearlyTotal = activePlan.yearlyPrice * 12;
    return monthlyTotal - yearlyTotal;
  }, [activePlan, cycle]);

  const toggleAddon = (id) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const chosenAddonNames = Array.from(selectedAddons).map(id => {
        const found = AVAILABLE_ADDONS.find(a => a.id === id);
        return found ? found.name : id;
      });

      const payload = {
        name: activePlan.name,
        cycle,
        price: totalMonthlyEquivalent,
        users: activePlan.usersLimit === 'Unlimited' ? 'Unlimited' : activePlan.usersLimit,
        addons: chosenAddonNames
      };

      await updatePlan(payload);
      showToast(`Subscription plan updated to ${activePlan.name} (${cycle})!`, 'success');
      onClose();
    } catch (err) {
      console.error('Plan update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-left">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
                <Star size={20} fill="currentColor" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Upgrade Subscription Plan
                  </h2>
                  {billingPlan?.name && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      Active: {billingPlan.name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                  Select the best fit for your team • Scale seats & enterprise capabilities
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7 max-h-[calc(92vh-140px)]">
            {/* Billing Cycle Switcher */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setCycle('Monthly')}
                  className={cn(
                    'h-10 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    cycle === 'Monthly'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('Yearly')}
                  className={cn(
                    'h-10 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
                    cycle === 'Yearly'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <span>Yearly Billing</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>

              {cycle === 'Yearly' && annualSavings > 0 && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <Sparkles size={14} />
                  <span>Annual billing saves you up to ${annualSavings.toLocaleString()} every year!</span>
                </p>
              )}
            </div>

            {/* 3 Tier Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanName === plan.name;
                const isPlanCurrent = billingPlan?.name === plan.name;
                const priceToShow = cycle === 'Monthly' ? plan.monthlyPrice : plan.yearlyPrice;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanName(plan.name)}
                    className={cn(
                      'rounded-3xl p-6 transition-all cursor-pointer flex flex-col justify-between relative border-2 text-left',
                      isSelected
                        ? 'border-primary-500 bg-primary-50/15 dark:bg-primary-950/20 shadow-xl shadow-primary-500/10 ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div>
                      {/* Top Header */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {plan.tier}
                          </span>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                            {plan.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isPlanCurrent && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Current
                            </span>
                          )}
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            )}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] leading-relaxed mb-4">
                        {plan.description}
                      </p>

                      {/* Pricing */}
                      <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                            ${priceToShow.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-400">/mo</span>
                        </div>

                        {cycle === 'Yearly' && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            Billed ${(priceToShow * 12).toLocaleString()}/year (Save 20%)
                          </p>
                        )}
                      </div>

                      {/* User Capacity */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 mb-5">
                        <Users size={14} className="text-primary-500 shrink-0" />
                        <span>{plan.userLabel}</span>
                      </div>

                      {/* Features List */}
                      <div className="space-y-2.5 mb-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Included Capabilities
                        </p>
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Select Pill */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <button
                        type="button"
                        className={cn(
                          'w-full h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                          isSelected
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        {isSelected ? (
                          <>
                            <Check size={14} strokeWidth={3} />
                            <span>Selected Plan</span>
                          </>
                        ) : (
                          <span>Select {plan.name}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Enterprise Add-ons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Power-Up Your Tier with Modular Add-Ons
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enable enterprise-grade modules anytime on your subscription.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AVAILABLE_ADDONS.map((addon) => {
                  const isChecked = selectedAddons.has(addon.id);
                  const cost = cycle === 'Monthly' ? addon.monthly : addon.yearly;

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={cn(
                        'p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between',
                        isChecked
                          ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {addon.name}
                          </span>
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                              isChecked
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            )}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                          {addon.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-slate-400">Add-on cost</span>
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                          +${cost}/mo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            {/* Price Breakdown */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total Estimated Subscription
                </span>
                {cycle === 'Yearly' && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                    Billed Annually
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  ${totalMonthlyEquivalent.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">/month</span>
                {selectedAddons.size > 0 && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (${planBasePrice} base + ${addonsTotal} add-ons)
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="flex-1 sm:flex-initial h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={cn(
                  'flex-1 sm:flex-initial h-11 px-6 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary-500/20 cursor-pointer',
                  isCurrentActive && selectedAddons.size === 0
                    ? 'bg-slate-800 hover:bg-slate-900'
                    : 'bg-primary-600 hover:bg-primary-700'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Upgrade...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} fill="currentColor" />
                    <span>
                      {isCurrentActive && selectedAddons.size === 0
                        ? 'Keep Current Plan'
                        : `Confirm & Upgrade (${activePlan.name})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradePlanModal;

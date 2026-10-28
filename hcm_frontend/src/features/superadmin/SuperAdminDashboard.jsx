import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminAPI } from '../../utils/apiService';
import {
  Users,
  ShieldCheck,
  Building2,
  TrendingUp,
  LayoutDashboard,
  DollarSign,
  RefreshCw,
  Activity,
  Settings,
  Lock,
  UserPlus,
  X,
  Search,
  Download,
  AlertCircle,
  CreditCard,
  Briefcase,
  HardDrive,
  CheckCircle2,
  PieChart,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import StatCard from '../../shared/components/ui/StatCard';
import { cn } from '../../utils/cn';
import { useCurrency } from '../../hooks/useCurrency';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const SuperAdminDashboard = () => {
  const { formatCurrency, masterCurrency } = useCurrency();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Real backend data states
  const [statsData, setStatsData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Audit modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // ── FETCH ALL SAAS PLATFORM DATA ──────────────────────────────
  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      setError(null);
      const [statsRes, usageRes, orgsRes, auditRes] = await Promise.all([
        superAdminAPI.getPlatformStats().catch(err => ({ data: { success: false, data: null, error: err } })),
        superAdminAPI.getGlobalUsage().catch(err => ({ data: { success: false, data: null, error: err } })),
        superAdminAPI.getAllOrganizations().catch(err => ({ data: { success: false, data: [], error: err } })),
        superAdminAPI.getPlatformAuditLogs({ take: 10 }).catch(err => ({ data: { success: false, data: [], error: err } }))
      ]);

      if (statsRes.data?.success && statsRes.data?.data) {
        setStatsData(statsRes.data.data);
      }
      if (usageRes.data?.success && usageRes.data?.data) {
        setUsageData(usageRes.data.data);
      }
      if (orgsRes.data?.success && Array.isArray(orgsRes.data?.data)) {
        setOrganizations(orgsRes.data.data);
      }
      if (auditRes.data?.success && Array.isArray(auditRes.data?.data)) {
        setActivityLogs(auditRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load some platform metrics. Please try again.');
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // ── DYNAMIC 15 SAAS PLATFORM METRICS CALCULATION ──────────────
  const metrics = useMemo(() => {
    const summary = usageData?.summary || {};
    const orgs = organizations || [];

    // 1. Total Organizations
    const totalOrgs = summary.totalOrganizations ?? statsData?.totalOrganizations ?? orgs.length;

    // 2. Active Organizations
    const activeOrgs = summary.activeOrganizations ?? orgs.filter(o => (o.status || '').toUpperCase() === 'ACTIVE').length;

    // 3. Trial Organizations
    const trialOrgs = summary.trialOrganizations ?? orgs.filter(o => {
      const s = (o.status || '').toUpperCase();
      const p = (o.pricingPlan?.name || o.plan || '').toUpperCase();
      return s === 'TRIAL' || p.includes('TRIAL');
    }).length;

    // 4. Suspended Organizations
    const suspendedOrgs = summary.suspendedOrganizations ?? orgs.filter(o => (o.status || '').toUpperCase() === 'SUSPENDED').length;

    // 5. Total Users
    const totalUsers = statsData?.totalUsers ?? summary.totalUsers ?? 0;

    // 6. Total Employees
    const totalEmployees = statsData?.totalEmployees ?? summary.totalEmployees ?? 0;

    // 7. Total Candidates
    const totalCandidates = statsData?.totalCandidates ?? 0;

    // 8. Active Jobs
    const activeJobs = statsData?.totalJobPosts ?? 0;

    // 9. Active Subscriptions
    const activeSubscriptions = orgs.filter(o => o.pricingPlan && (o.status || '').toUpperCase() === 'ACTIVE').length;

    // 10. MRR
    const mrr = statsData?.revenueMetrics?.mrr ?? 0;

    // 11. ARR
    const arr = statsData?.revenueMetrics?.arr ?? (mrr * 12);

    // 12. Trial Conversion Rate
    const paidSubscriptions = orgs.filter(o => o.pricingPlan && (o.pricingPlan.monthlyPrice > 0 || o.pricingPlan.yearlyPrice > 0)).length;
    const totalTrialAndPaid = trialOrgs + paidSubscriptions;
    const trialConversionRate = totalTrialAndPaid > 0 ? Math.round((paidSubscriptions / totalTrialAndPaid) * 100) : null;

    // 13. Seat Utilization Rate
    const allocatedSeats = summary.totalAllocatedSeats || (totalOrgs * 50) || 1;
    const seatUtilizationRate = Math.min(100, Math.round((totalEmployees / allocatedSeats) * 100));

    // 14. Storage Utilization Rate
    const storageUsedGB = summary.totalStorageUsedGB || 0;
    const maxStorageGB = summary.totalMaxStorageGB || (totalOrgs * 20) || 1;
    const storageUtilizationRate = Math.min(100, Math.round((storageUsedGB / maxStorageGB) * 100));

    // 15. Platform Activity
    const platformActivityCount = activityLogs.length;

    // Additional Platform Stats
    const totalAiRequests = statsData?.totalAiRequests ?? summary.totalAiRequests ?? 0;
    const newOrgsThisMonth = statsData?.revenueMetrics?.newOrgsThisMonth ?? 0;
    const momGrowth = statsData?.revenueMetrics?.momGrowth ?? 0;

    // Plan Distribution Calculation
    let enterpriseCount = 0;
    let proCount = 0;
    let teamCount = 0;

    orgs.forEach(o => {
      const planName = (o.pricingPlan?.name || o.plan || '').toLowerCase();
      if (planName.includes('enterprise') || planName.includes('custom')) {
        enterpriseCount += 1;
      } else if (planName.includes('pro') || planName.includes('growth')) {
        proCount += 1;
      } else if (planName.includes('starter') || planName.includes('team')) {
        teamCount += 1;
      }
    });

    const totalCalculatedPlans = enterpriseCount + proCount + teamCount || 1;
    const enterprisePct = Math.round((enterpriseCount / totalCalculatedPlans) * 100);
    const proPct = Math.round((proCount / totalCalculatedPlans) * 100);
    const teamPct = Math.round((teamCount / totalCalculatedPlans) * 100);

    return {
      totalOrgs,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      totalUsers,
      totalEmployees,
      totalCandidates,
      activeJobs,
      activeSubscriptions,
      paidSubscriptions,
      mrr,
      arr,
      trialConversionRate,
      allocatedSeats,
      seatUtilizationRate,
      storageUsedGB,
      maxStorageGB,
      storageUtilizationRate,
      platformActivityCount,
      totalAiRequests,
      newOrgsThisMonth,
      momGrowth,
      enterpriseCount,
      proCount,
      teamCount,
      enterprisePct,
      proPct,
      teamPct
    };
  }, [statsData, usageData, organizations, activityLogs]);

  // Top 5 Platform KPI Stat Cards
  const topKpiCards = [
    {
      label: 'Total Organizations',
      value: metrics.totalOrgs,
      sub: `${metrics.activeOrgs} Active • ${metrics.trialOrgs} Trial`,
      icon: Building2,
      color: 'from-violet-500 to-indigo-600',
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-900/30'
    },
    {
      label: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      sub: `${metrics.paidSubscriptions} Paid Subscriptions`,
      icon: CreditCard,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30'
    },
    {
      label: 'Platform Users',
      value: metrics.totalUsers,
      sub: `${metrics.totalEmployees} Employees • ${metrics.totalCandidates} Candidates`,
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/30'
    },
    {
      label: 'Active Job Posts',
      value: metrics.activeJobs,
      sub: 'Ecosystem Job Listings',
      icon: Briefcase,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/30'
    },
    {
      label: 'System Status',
      value: '100%',
      sub: 'All Systems Operational',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30'
    }
  ];

  const getActionCategory = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('PASSWORD') || act.includes('LOGOUT')) {
      return { label: 'AUTH', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    }
    if (act.includes('ORGANIZATION') || act.includes('TENANT') || act.includes('ORG')) {
      return { label: 'TENANT', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    }
    if (act.includes('PLAN') || act.includes('SUBSCRIPTION') || act.includes('BILLING')) {
      return { label: 'BILLING', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    }
    if (act.includes('ROLE') || act.includes('PERMISSION') || act.includes('SECURITY')) {
      return { label: 'SECURITY', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    }
    return { label: 'SYSTEM', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
  };

  return (
    <motion.div
      className="hcm-superadmin-container pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Platform Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="Super Admin Platform Console"
        subtitle="SaaS Platform Console • Real-time tenant telemetry, subscription distribution, and platform health."
        actions={
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="btn-secondary btn-compact flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-rose-200 dark:border-rose-800/50">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 5 Platform KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {topKpiCards.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            style={stat}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* SaaS Revenue & Subscription Overview Card */}
      <motion.div className="card xl:col-span-3" variants={cardVariants}>
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-primary-600 dark:text-primary-400" />
                <h2 className="hcm-section-heading">SaaS Revenue & Subscription Overview</h2>
              </div>
              <span className="text-xs font-bold bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 px-3 py-1 rounded-full w-fit">
                ARR: {formatCurrency(metrics.arr)}
              </span>
            </div>

            {/* 4 Metric Cards - Fixed Truncation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Metric 1: Platform Organizations */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                  Platform Organizations
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {metrics.totalOrgs}
                </p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} /> +{metrics.newOrgsThisMonth} this month
                </p>
              </div>

              {/* Metric 2: Monthly Recurring (MRR) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                  Monthly Recurring (MRR)
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(metrics.mrr)}
                </p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} /> +{metrics.momGrowth}% MoM
                </p>
              </div>

              {/* Metric 3: Seat Utilization */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                  Seat Utilization
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {metrics.seatUtilizationRate}%
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {metrics.totalEmployees} of {metrics.allocatedSeats} Seats
                </p>
              </div>

              {/* Metric 4: Storage Utilization */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 hover:border-amber-200 dark:hover:border-amber-800/50 transition-colors">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-snug">
                  Storage Utilization
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {metrics.storageUtilizationRate}%
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {metrics.storageUsedGB} GB of {metrics.maxStorageGB} GB
                </p>
              </div>
            </div>

            {/* Plan Distribution Visual Bar */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 gap-2">
                <span className="flex items-center gap-1.5">
                  <PieChart size={14} className="text-primary-600 dark:text-primary-400" />
                  Subscription Plan Distribution
                </span>
                <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                  {metrics.enterpriseCount} Enterprise • {metrics.proCount} Pro • {metrics.teamCount} Starter/Team
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                <div
                  className="h-full bg-violet-500 transition-all duration-1000 ease-out"
                  style={{ width: `${metrics.enterprisePct}%` }}
                  title={`Enterprise (${metrics.enterprisePct}%)`}
                />
                <div
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                  style={{ width: `${metrics.proPct}%` }}
                  title={`Professional (${metrics.proPct}%)`}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: `${metrics.teamPct}%` }}
                  title={`Starter/Team (${metrics.teamPct}%)`}
                />
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                  <span>Enterprise ({metrics.enterprisePct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Professional ({metrics.proPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Starter / Team ({metrics.teamPct}%)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* SaaS Infrastructure & Tenant Lifecycle (Replaced Tenant HR Operational Bleed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Lifecycle Breakdown */}
        <motion.div className="card space-y-4" variants={cardVariants}>
          <div className="flex items-center justify-between">
            <h3 className="hcm-section-heading flex items-center gap-2">
              <Layers size={18} className="text-primary-600 dark:text-primary-400" />
              Tenant Lifecycle & Health
            </h3>
            <span className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              {metrics.trialConversionRate !== null ? `${metrics.trialConversionRate}% Conversion Rate` : 'No Active Trials'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">Active</span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5 block">{metrics.activeOrgs}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-center">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">Trial</span>
              <span className="text-xl font-black text-blue-900 dark:text-blue-200 mt-0.5 block">{metrics.trialOrgs}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-center">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">Suspended</span>
              <span className="text-xl font-black text-rose-900 dark:text-rose-200 mt-0.5 block">{metrics.suspendedOrgs}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Customer Retention Rate:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.totalOrgs > 0 ? `${Math.round((metrics.activeOrgs / metrics.totalOrgs) * 100)}%` : '100%'}
            </span>
          </div>
        </motion.div>

        {/* Platform Infrastructure & Telemetry */}
        <motion.div className="card space-y-4" variants={cardVariants}>
          <div className="flex items-center justify-between">
            <h3 className="hcm-section-heading flex items-center gap-2">
              <HardDrive size={18} className="text-primary-600 dark:text-primary-400" />
              Platform Infrastructure
            </h3>
            <span className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Optimal Telemetry
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">AI Recruiter & Analytics API Queries</span>
              <span className="font-black text-slate-900 dark:text-white">{metrics.totalAiRequests}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Database & Ecosystem Health</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Active & Secured
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Total Allocated Cloud Storage</span>
              <span className="font-black text-slate-900 dark:text-white">{metrics.storageUsedGB} / {metrics.maxStorageGB} GB</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Real Activity & System Monitoring */}
      <motion.div className="card xl:col-span-3 space-y-4" variants={cardVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary-600 dark:text-primary-400" />
            <h2 className="hcm-section-heading">Live Platform Activity Stream</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary btn-compact text-xs flex items-center gap-1.5"
              onClick={() => setIsAuditModalOpen(true)}
            >
              <span>Inspect All Logs</span>
            </button>
            <button
              type="button"
              className="btn-primary btn-compact text-xs flex items-center gap-1.5"
              onClick={() => navigate('/superadmin/audit-logs')}
            >
              <span>Security & Audit Page</span>
            </button>
          </div>
        </div>

        {activityLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Activity size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No platform activity records found.</p>
            <p className="text-xs text-slate-400">New administrative and security actions will stream here live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activityLogs.slice(0, 6).map((log, idx) => {
              const cat = getActionCategory(log.action);
              const actorEmail = typeof log.user === 'object' && log.user !== null ? (log.user.email || 'System') : (log.user || 'System');
              const orgName = log.user?.organization?.name || log.Organization?.name || 'Platform-wide';
              const formattedDate = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent';

              return (
                <div
                  key={log.id || `act-log-${idx}`}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/30">
                      {cat.label === 'AUTH' ? <Lock size={14} /> :
                       cat.label === 'TENANT' ? <Building2 size={14} /> :
                       cat.label === 'SECURITY' ? <ShieldCheck size={14} /> :
                       cat.label === 'BILLING' ? <CreditCard size={14} /> :
                       <Activity size={14} />}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={log.action}>
                        {log.action}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1" title={log.details}>
                      {log.details || 'Administrative system operation executed'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                        {actorEmail}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[120px] text-slate-500">
                        {orgName}
                      </span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Ecosystem Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={activityLogs}
      />
    </motion.div>
  );
};

// ============================================================
// Ecosystem Audit Logs Modal Component
// ============================================================
const AuditLogsModal = ({ isOpen, onClose, logs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const filteredLogs = useMemo(() => {
    return (logs || []).filter(log => {
      const userStr = typeof log.user === 'object' && log.user !== null ? (log.user.email || '') : (log.user || '');
      const actionStr = log.action || '';
      const detailsStr = log.details || '';
      const matchesSearch =
        actionStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detailsStr.toLowerCase().includes(searchTerm.toLowerCase());

      const action = actionStr.toUpperCase();
      let matchType = true;
      if (selectedType === 'Auth') matchType = action.includes('LOGIN') || action.includes('AUTH');
      else if (selectedType === 'Tenant') matchType = action.includes('ORG') || action.includes('TENANT');
      else if (selectedType === 'Security') matchType = action.includes('SECURITY') || action.includes('ROLE');

      return matchesSearch && matchType;
    });
  }, [logs, searchTerm, selectedType]);

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Action,Details,User,Organization,IPAddress,CreatedAt\n'];
    const rows = filteredLogs.map(l => {
      const user = typeof l.user === 'object' && l.user !== null ? (l.user.email || 'System') : (l.user || 'System');
      const org = l.user?.organization?.name || l.Organization?.name || 'Platform-wide';
      return `"${l.action}","${(l.details || '').replace(/"/g, '""')}","${user}","${org}","${l.ipAddress || ''}","${l.createdAt}"`;
    });
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 my-auto"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Platform Audit Stream</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verified immutable sequence of platform administrative activities</p>
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filters & Search */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search logs by action, email, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 h-10 text-xs w-full"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                {['All', 'Auth', 'Tenant', 'Security'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "btn-compact rounded-xl border text-xs font-semibold transition-all px-3 py-1.5",
                      selectedType === type
                        ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-800 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredLogs.map((log, idx) => {
                    const actorEmail = typeof log.user === 'object' && log.user !== null ? (log.user.email || 'System') : (log.user || 'System');
                    const orgName = log.user?.organization?.name || log.Organization?.name || 'Platform-wide';
                    const formattedDate = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A';

                    return (
                      <div
                        key={log.id || `modal-log-${idx}`}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-left space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formattedDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{log.details}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5 font-medium">
                          <span>Actor: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{actorEmail}</strong></span>
                          <span>•</span>
                          <span>Tenant: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{orgName}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <Activity size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold">No matching audit logs found.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4 mt-auto">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Showing {filteredLogs.length} of {logs.length} entries
              </span>
              <button
                type="button"
                className="btn-secondary btn-compact text-xs flex items-center gap-1.5"
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuperAdminDashboard;


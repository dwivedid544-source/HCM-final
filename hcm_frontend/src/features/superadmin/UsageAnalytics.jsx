import React, { useState, useEffect } from 'react';
import {
  BarChart2, HardDrive, Users, Sparkles, RefreshCw,
  Search, FileText, Activity, AlertCircle, ArrowUpRight,
  TrendingUp, Database, Cpu, Building2, Layers, CheckCircle2,
  AlertTriangle, ShieldAlert
} from 'lucide-react';
import PageHeader from '../../shared/components/layout/PageHeader';
import { superAdminAPI } from '../../utils/apiService';
import { motion } from 'framer-motion';

const formatStorage = (bytes) => {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getStatusBadge = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (s === 'TRIAL') {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }
  if (s === 'SUSPENDED' || s === 'INACTIVE' || s === 'DEACTIVATED') {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

const UsageAnalytics = () => {
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminAPI.getGlobalUsage();
      if (res.data?.data) {
        setUsageData(res.data.data);
      } else {
        throw new Error('Malformed response from usage analytics endpoint.');
      }
    } catch (err) {
      console.error('Failed to load usage analytics:', err);
      const msg = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to connect to Global Usage service.';
      setError(msg);
      setUsageData(null); // STRICT: Never mask API failure as zero!
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const summary = usageData?.summary || null;
  const tenants = usageData?.tenants || [];

  const filteredTenants = tenants.filter(t =>
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.plan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hcm-superadmin-container pb-12">
      <PageHeader
        title="Global Usage Analytics"
        subtitle="Real-time platform monitoring: allocated seats, actual storage, total documents, and tenant-scoped resource utilization directly from database."
        icon={BarChart2}
        actions={
          <button
            onClick={fetchUsage}
            disabled={loading}
            className="btn-secondary btn-compact">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* ERROR STATE: Rendered when API fails - NEVER mask as 0 */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-rose-900 dark:text-rose-200">
                Failed to Load Usage Analytics
              </h4>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                {error}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={fetchUsage}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SKELETON LOADER */}
      {loading && !usageData && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      )}

      {/* REAL METRICS SUMMARY CARDS */}
      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* 1. Tenant Count Card */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Tenants
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {summary.tenantCount ?? summary.totalOrganizations ?? 0}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">Tenants</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {summary.activeOrganizations ?? 0} Active
                  </span>
                  <span>•</span>
                  <span>{summary.trialOrganizations ?? 0} Trial</span>
                  {summary.suspendedOrganizations > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-rose-500">{summary.suspendedOrganizations} Suspended</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Seat Capacity & Utilization */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seat Utilization
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {summary.totalUsedSeats ?? 0}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    / {summary.totalAllocatedSeats ?? 0} Allocated
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.seatUtilizationPct ?? 0)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>{summary.seatUtilizationPct ?? 0}% Utilized</span>
                  <span>{summary.totalEmployees ?? 0} Profiles</span>
                </div>
              </div>
            </div>

            {/* 3. Storage Usage & Capacity */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cloud Storage
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <HardDrive size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {formatStorage(summary.totalStorageUsedBytes)}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    / {summary.totalStorageCapacityGB ?? 0} GB
                  </span>
                </div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.storageUtilizationPct ?? 0)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>{summary.storageUtilizationPct ?? 0}% Allocated Used</span>
                  <span>Actual bytes in DB</span>
                </div>
              </div>
            </div>

            {/* 4. Total Documents & AI Workload */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Docs & AI Usage
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <FileText size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {summary.totalDocuments ?? 0}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">Documents</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} className="text-indigo-500" />
                    AI Requests:
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {summary.totalAiRequests ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TENANT USAGE BREAKDOWN TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Tenant Resource Utilization</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tenants.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tenant-scoped metrics: seats, storage, documents, and real usage %
                </p>
              </div>

              {/* Real-time search across organizations */}
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 h-10 w-full text-sm"
                />
              </div>
            </div>

            {/* Contained horizontal scrolling container to prevent page overflow */}
            <div className="overflow-x-auto w-full">
              <table className="hcm-table min-w-[800px]">
                <thead className="hcm-thead">
                  <tr className="hcm-tr">
                    <th className="hcm-th">Organization</th>
                    <th className="hcm-th">Plan</th>
                    <th className="hcm-th">Status</th>
                    <th className="hcm-th">Users / Employees</th>
                    <th className="hcm-th">Storage</th>
                    <th className="hcm-th">Documents</th>
                    <th className="hcm-th text-right">Usage %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTenants.length === 0 ? (
                    <tr className="hcm-tr">
                      <td colSpan={7} className="hcm-td py-12 text-center text-slate-500">
                        {searchTerm ? `No organizations match "${searchTerm}".` : 'No organizations found in database.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr key={tenant.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Organization */}
                        <td className="hcm-td">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {tenant.name}
                          </div>
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {tenant.slug || 'tenant'}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="hcm-td">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                            {tenant.plan || 'Unassigned'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="hcm-td">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(tenant.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              (tenant.status || '').toUpperCase() === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            {tenant.status || 'ACTIVE'}
                          </span>
                        </td>

                        {/* Users / Employees */}
                        <td className="hcm-td">
                          <div className="flex items-baseline gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            <span>{tenant.usersCount ?? 0}</span>
                            <span className="text-xs font-normal text-slate-500">
                              / {tenant.allocatedSeats > 0 ? `${tenant.allocatedSeats} seats` : 'No quota'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {tenant.employeesCount ?? 0} employee profiles
                          </div>
                        </td>

                        {/* Storage */}
                        <td className="hcm-td">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {formatStorage(tenant.storageUsedBytes)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {tenant.storageCapacityGB > 0 ? `Limit: ${tenant.storageCapacityGB} GB` : 'No limit'}
                          </div>
                        </td>

                        {/* Documents */}
                        <td className="hcm-td">
                          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <FileText size={14} className="text-slate-400" />
                            <span>{tenant.documentsCount ?? 0}</span>
                          </div>
                        </td>

                        {/* Usage % */}
                        <td className="hcm-td text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (tenant.usagePct ?? 0) > 85 
                                    ? 'bg-rose-500' 
                                    : (tenant.usagePct ?? 0) > 60 
                                    ? 'bg-amber-500' 
                                    : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(100, tenant.usagePct ?? 0)}%` }}
                              />
                            </div>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 min-w-[32px]">
                              {tenant.usagePct ?? 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsageAnalytics;

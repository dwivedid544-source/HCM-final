import React, { useState, useEffect, useCallback } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import PageHeader from '../../shared/components/layout/PageHeader';
import UserAvatar from '../../shared/components/ui/UserAvatar';
import { superAdminAPI } from '../../utils/apiService';
import { 
  FileSearch, Search, Filter, RefreshCw, User, Shield, 
  Globe, Clock, Database, AlertCircle, Calendar, CheckCircle2,
  XCircle, ChevronLeft, ChevronRight, Eye, ShieldCheck, X,
  Building2, Laptop, ArrowUpDown, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'All Action Events' },
  { value: 'USER_LOGIN', label: 'USER_LOGIN' },
  { value: 'CREATE_USER', label: 'CREATE_USER' },
  { value: 'UPDATE_USER', label: 'UPDATE_USER' },
  { value: 'DELETE_USER', label: 'DELETE_USER' },
  { value: 'CHANGE_USER_ROLE', label: 'CHANGE_USER_ROLE' },
  { value: 'SUSPEND_USER', label: 'SUSPEND_USER' },
  { value: 'ACTIVATE_USER', label: 'ACTIVATE_USER' },
  { value: 'RESET_USER_PASSWORD', label: 'RESET_USER_PASSWORD' },
  { value: 'CREATE_ORGANIZATION', label: 'CREATE_ORGANIZATION' },
  { value: 'PROVISION_ORGANIZATION', label: 'PROVISION_ORGANIZATION' },
  { value: 'UPDATE_ORGANIZATION', label: 'UPDATE_ORGANIZATION' },
  { value: 'DELETE_ORGANIZATION', label: 'DELETE_ORGANIZATION' },
  { value: 'UPDATE_ORG_SUBSCRIPTION', label: 'UPDATE_ORG_SUBSCRIPTION' },
  { value: 'CREATE_PRICING_PLAN', label: 'CREATE_PRICING_PLAN' },
  { value: 'UPDATE_PRICING_PLAN', label: 'UPDATE_PRICING_PLAN' },
  { value: 'DELETE_PRICING_PLAN', label: 'DELETE_PRICING_PLAN' },
  { value: 'DEACTIVATE_PRICING_PLAN', label: 'DEACTIVATE_PRICING_PLAN' },
  { value: 'REORDER_PRICING_PLANS', label: 'REORDER_PRICING_PLANS' },
  { value: 'TOGGLE_FEATURE_ENTITLEMENT', label: 'TOGGLE_FEATURE_ENTITLEMENT' },
  { value: 'BACKUP_CREATED', label: 'BACKUP_CREATED' },
  { value: 'BACKUP_DOWNLOADED', label: 'BACKUP_DOWNLOADED' },
  { value: 'BACKUP_DELETED', label: 'BACKUP_DELETED' },
];

const getActionBadgeStyle = (action = '') => {
  const a = action.toUpperCase();
  if (a.includes('DELETE') || a.includes('REVOKE') || a.includes('SUSPEND') || a.includes('DEACTIVATE')) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  }
  if (a.includes('CREATE') || a.includes('PROVISION') || a.includes('REGISTER') || a.includes('ACTIVATE')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (a.includes('UPDATE') || a.includes('CHANGE') || a.includes('REORDER')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }
  if (a.includes('LOGIN') || a.includes('AUTH') || a.includes('PASSWORD')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
  }
  return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
};

const AuditLogs = () => {
  const { users, organizations } = useSuperAdmin();

  // Server-side State
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedOrg, setSelectedOrg] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchLogs = useCallback(async (pageOverride) => {
    setLoading(true);
    try {
      const activePage = pageOverride || meta.page;
      const params = {
        page: activePage,
        limit: meta.limit,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedUser !== 'ALL') params.userId = selectedUser;
      if (selectedOrg !== 'ALL') params.organizationId = selectedOrg;
      if (selectedAction !== 'ALL') params.action = selectedAction;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      // Date Range Calculation
      const now = new Date();
      if (dateRange === 'TODAY') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        params.startDate = start;
      } else if (dateRange === '7D') {
        params.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '30D') {
        params.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await superAdminAPI.getPlatformAuditLogs(params);
      if (res.data?.data) {
        setLogs(res.data.data);
        if (res.data.meta) {
          setMeta(res.data.meta);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [meta.page, meta.limit, searchTerm, selectedUser, selectedOrg, selectedAction, selectedStatus, dateRange]);

  useEffect(() => {
    fetchLogs(1);
  }, [searchTerm, selectedUser, selectedOrg, selectedAction, selectedStatus, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(meta.page);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setMeta(prev => ({ ...prev, page: newPage }));
      fetchLogs(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    setMeta(prev => ({ ...prev, limit: newLimit, page: 1 }));
    // Will trigger useEffect through fetchLogs(1)
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUser('ALL');
    setSelectedOrg('ALL');
    setSelectedAction('ALL');
    setSelectedStatus('ALL');
    setDateRange('ALL');
  };

  const hasActiveFilters = searchTerm || selectedUser !== 'ALL' || selectedOrg !== 'ALL' || selectedAction !== 'ALL' || selectedStatus !== 'ALL' || dateRange !== 'ALL';

  return (
    <div className="hcm-superadmin-container pb-12">
      {/* Header */}
      <PageHeader
        icon={FileSearch}
        title="Global Security & Audit Trail"
        subtitle="Cryptographically sealed, immutable platform audit logs tracking administrative actions, authorization events, and tenant operations."
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary btn-compact">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Control Bar: Filters & Search */}
      <div className="mt-6 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        {/* Row 1: Search and Primary Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
            <input
              type="text"
              placeholder="Search by action, details, actor, IP address, organization..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10 h-10 w-full text-sm"
            />
          </div>

          {/* Filter Group */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="select-field h-10 text-xs font-medium w-full">
              {ACTION_OPTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>

            {/* Organization Filter */}
            <select
              value={selectedOrg}
              onChange={e => setSelectedOrg(e.target.value)}
              className="select-field h-10 text-xs font-medium w-full">
              <option value="ALL">All Organizations</option>
              <option value="none">Platform / Global (No Tenant)</option>
              {organizations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            {/* Actor / User Filter */}
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="select-field h-10 text-xs font-medium w-full">
              <option value="ALL">All Actors</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="select-field h-10 text-xs font-medium w-full">
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Status Filter & Counts */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <Filter size={13} className="text-slate-400" />
              <span>Result:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {['ALL', 'SUCCESS', 'FAILURE'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}>
                  {st === 'ALL' ? 'All' : st === 'SUCCESS' ? 'Success' : 'Failure'}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium ml-2">
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              Total Records: <strong className="text-slate-800 dark:text-slate-200">{meta.total}</strong>
            </span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={meta.limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Contained horizontal scrolling container to prevent page overflow */}
        <div className="overflow-x-auto w-full">
          <table className="hcm-table min-w-[950px]">
            <thead className="hcm-thead">
              <tr className="hcm-tr">
                <th className="hcm-th">Timestamp</th>
                <th className="hcm-th">Actor Context</th>
                <th className="hcm-th">Organization</th>
                <th className="hcm-th">Action Event</th>
                <th className="hcm-th">Details</th>
                <th className="hcm-th">Result</th>
                <th className="hcm-th text-right">IP / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {loading ? (
                <tr className="hcm-tr">
                  <td colSpan={7} className="hcm-td py-16 text-center text-slate-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading server audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr className="hcm-tr">
                  <td colSpan={7} className="hcm-td py-16 text-center text-slate-400">
                    No audit records match your query and filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="hcm-tr hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                      {/* Timestamp */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span className="whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Actor Context */}
                      <td className="hcm-td">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                            {log.actorName ? log.actorName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {log.actorName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {log.actorRole || 'SYSTEM'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="hcm-td">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 max-w-[160px] truncate">
                          <Building2 size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{log.organizationName || 'Platform / Global'}</span>
                        </span>
                      </td>

                      {/* Action Event */}
                      <td className="hcm-td">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getActionBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Details (Truncated) */}
                      <td className="hcm-td max-w-[260px] truncate text-slate-700 dark:text-slate-300 font-medium" title={log.details}>
                        {log.details || log.action}
                      </td>

                      {/* Status / Result */}
                      <td className="hcm-td">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                          {isSuccess ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      {/* IP / Device */}
                      <td className="hcm-td text-right">
                        <div className="flex items-center justify-end gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <Globe size={11} className="text-slate-400" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(meta.page * meta.limit, meta.total)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{meta.total}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-2">
              Page {meta.page} of {meta.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={!meta.hasPrevPage || loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page">
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={!meta.hasNextPage || loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto z-10 my-auto flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getActionBadgeStyle(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedLog.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    }`}>
                      {selectedLog.status === 'SUCCESS' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span>{selectedLog.status}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    Audit Event Inspection
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-5 space-y-5 text-sm">
                {/* Event ID Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 font-mono text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-400">ID:</span>
                    <span className="truncate">{selectedLog.id}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedLog.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
                    title="Copy Log ID">
                    {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Timestamp */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Timestamp
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                      <Clock size={13} className="text-slate-400" />
                      <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Client IP */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Network IP Address
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                      <Globe size={13} className="text-slate-400" />
                      <span>{selectedLog.ipAddress || '127.0.0.1 (Localhost / Tunnel)'}</span>
                    </div>
                  </div>

                  {/* Actor Details */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Actor Context
                    </span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {selectedLog.actorName}
                    </p>
                    {selectedLog.actorEmail && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {selectedLog.actorEmail}
                      </p>
                    )}
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {selectedLog.actorRole}
                    </span>
                  </div>

                  {/* Organization Context */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Organization Scope
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{selectedLog.organizationName || 'Platform / Global'}</span>
                    </div>
                    {selectedLog.organizationId && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Tenant ID: {selectedLog.organizationId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Event Details Box */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Action Event Payload & Description
                  </label>
                  <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                    {selectedLog.details}
                  </div>
                </div>

                {/* Immutability Seal */}
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 dark:text-indigo-200">
                    <strong className="font-bold">Immutable Audit Record:</strong> Recorded directly by the platform security kernel. Modification or deletion of audit records is strictly prevented.
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="btn-secondary">
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogs;

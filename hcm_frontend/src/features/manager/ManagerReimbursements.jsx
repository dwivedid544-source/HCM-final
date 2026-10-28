import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  MessageSquare,
  Check,
  X,
  Info,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  DollarSign,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCurrency } from '../../hooks/useCurrency';
import { useDateFormat } from '../../hooks/useDateFormat';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import { useManager } from '../../context/ManagerContext';
import { managerAPI } from '../../utils/apiService';

import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';
import Avatar from '../../shared/components/ui/Avatar';
import EmptyState from '../../shared/components/ui/EmptyState';
import StatCard from '../../shared/components/ui/StatCard';
import CenterModal from '../../shared/components/layout/CenterModal';

const ManagerReimbursements = () => {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDateFormat();
  const { showToast } = useManager();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = usePersistedTab('mgr_reimbursements', 'Pending');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await managerAPI.getManagerReimbursements();
      if (res.data?.success) {
        setClaims(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch reimbursement claims:', err);
      showToast('Failed to load reimbursement claims.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    if (!selectedClaim) return;
    try {
      setActionLoading(true);
      const res = await managerAPI.reviewManagerReimbursement(selectedClaim.id, {
        status,
        comment: comment.trim()
      });

      if (res.data?.success) {
        showToast(`Claim ${status.toLowerCase()} successfully!`, 'success');
        setComment('');
        setSelectedClaim(null);
        await fetchClaims();
      } else {
        showToast(res.data?.error?.message || 'Failed to update claim.', 'error');
      }
    } catch (err) {
      console.error('Error reviewing claim:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update claim status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openClaimModal = (claim) => {
    setSelectedClaim(claim);
    setComment(claim.managerComment || '');
  };

  // Stats calculate
  const stats = useMemo(() => {
    const pending = claims.filter(c => c.managerStatus === 'Pending').length;
    const approved = claims.filter(c => c.managerStatus === 'Approved').length;
    const rejected = claims.filter(c => c.managerStatus === 'Rejected').length;
    const total = claims.length;

    return [
      {
        title: 'Pending Approvals',
        value: pending.toString(),
        icon: Clock,
        color: 'amber'
      },
      {
        title: 'Approved Claims',
        value: approved.toString(),
        icon: CheckCircle2,
        color: 'emerald'
      },
      {
        title: 'Rejected Claims',
        value: rejected.toString(),
        icon: XCircle,
        color: 'rose'
      },
      {
        title: 'Total Claims',
        value: total.toString(),
        icon: FileText,
        color: 'primary'
      }
    ];
  }, [claims]);

  // Tab counts
  const counts = useMemo(() => ({
    Pending: claims.filter(c => c.managerStatus === 'Pending').length,
    Approved: claims.filter(c => c.managerStatus === 'Approved').length,
    Rejected: claims.filter(c => c.managerStatus === 'Rejected').length,
    All: claims.length
  }), [claims]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesTab = activeTab === 'All' ? true : c.managerStatus === activeTab;
      const term = searchQuery.toLowerCase().trim();
      if (!term) return matchesTab;

      const employeeName = (c.employee?.fullName || '').toLowerCase();
      const empId = (c.employee?.employeeId || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      const provider = (c.provider || '').toLowerCase();
      const amountStr = (c.amount || '').toString();

      const matchesSearch =
        employeeName.includes(term) ||
        empId.includes(term) ||
        title.includes(term) ||
        provider.includes(term) ||
        amountStr.includes(term);

      return matchesTab && matchesSearch;
    });
  }, [claims, activeTab, searchQuery]);

  // CSV Export logic
  const handleExport = () => {
    try {
      setIsExporting(true);
      const headers = ['Claim ID', 'Employee Name', 'Employee ID', 'Department', 'Claim Title', 'Provider', 'Amount', 'Submitted Date', 'Manager Status', 'Manager Comment', 'Overall Status'];
      
      const rows = filteredClaims.map(c => [
        `"${c.id || ''}"`,
        `"${c.employee?.fullName || 'N/A'}"`,
        `"${c.employee?.employeeId || 'N/A'}"`,
        `"${c.employee?.department?.name || 'N/A'}"`,
        `"${c.title || ''}"`,
        `"${c.provider || ''}"`,
        `"${c.amount || 0}"`,
        `"${c.claimedAt ? formatDate(c.claimedAt) : ''}"`,
        `"${c.managerStatus || 'Pending'}"`,
        `"${(c.managerComment || '').replace(/"/g, '""')}"`,
        `"${c.overallStatus || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reimbursement_claims_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Reimbursements report exported successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export report.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return {
          label: 'Approved',
          color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
        };
      case 'Pending':
      default:
        return {
          label: 'Pending Review',
          color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Reimbursement Approvals"
        subtitle="Manage team reimbursement claims"
      >
        <Button
          variant="export"
          size="sm"
          leftIcon={Download}
          isLoading={isExporting}
          isDisabled={filteredClaims.length === 0}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Status Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-xl">
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => {
            const isActive = activeTab === tab;
            const count = counts[tab] || 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <span>{tab}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, claim or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Claims Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin text-primary-500 mb-3" />
            <p className="text-xs font-medium">Loading reimbursement claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Claims Found"
            description={
              searchQuery
                ? `No claims matched "${searchQuery}" under ${activeTab} status.`
                : `There are currently no claims with status "${activeTab}".`
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Claim Title & Provider
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredClaims.map((claim) => {
                    const badge = getStatusBadge(claim.managerStatus);
                    return (
                      <tr
                        key={claim.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={claim.employee?.fullName || 'Employee'}
                              src={claim.employee?.avatarUrl || claim.employee?.avatar}
                              size="md"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {claim.employee?.fullName || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {claim.employee?.employeeId || 'ID N/A'} • {claim.employee?.department?.name || 'Department'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {claim.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {claim.provider || 'General Expense'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(claim.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            {claim.claimedAt ? formatDate(claim.claimedAt) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                              badge.color
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant={claim.managerStatus === 'Pending' ? 'primary' : 'secondary'}
                            size="sm"
                            leftIcon={Eye}
                            onClick={() => openClaimModal(claim)}
                          >
                            {claim.managerStatus === 'Pending' ? 'Review' : 'View'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="block md:hidden p-4 space-y-4">
              {filteredClaims.map((claim) => {
                const badge = getStatusBadge(claim.managerStatus);
                return (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4"
                  >
                    {/* Header: Employee info & status */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={claim.employee?.fullName || 'Employee'}
                          src={claim.employee?.avatarUrl || claim.employee?.avatar}
                          size="md"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {claim.employee?.fullName || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {claim.employee?.employeeId || 'ID N/A'} • {claim.employee?.department?.name || 'Department'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0',
                          badge.color
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Claim Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                          Claim Title
                        </p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {claim.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                          Amount
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {formatCurrency(claim.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                          Provider / Category
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {claim.provider || 'General Expense'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                          Date Submitted
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {claim.claimedAt ? formatDate(claim.claimedAt) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button
                        variant={claim.managerStatus === 'Pending' ? 'primary' : 'secondary'}
                        size="sm"
                        leftIcon={Eye}
                        onClick={() => openClaimModal(claim)}
                        className="w-full sm:w-auto"
                      >
                        {claim.managerStatus === 'Pending' ? 'Review Claim' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <CenterModal
            isOpen={true}
            maxWidth="max-w-xl"
            onClose={() => {
              if (!actionLoading) {
                setSelectedClaim(null);
                setComment('');
              }
            }}
            title={selectedClaim.managerStatus === 'Pending' ? 'Review Reimbursement Claim' : 'Claim Details'}
          >
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Employee Summary Box */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <Avatar
                  name={selectedClaim.employee?.fullName}
                  src={selectedClaim.employee?.avatarUrl || selectedClaim.employee?.avatar}
                  size="lg"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedClaim.employee?.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedClaim.employee?.department?.name || 'Department'} • {selectedClaim.employee?.employeeId}
                  </p>
                </div>
              </div>

              {/* Claim Key Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Claim Title
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedClaim.title}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Requested Amount
                  </p>
                  <p className="text-base font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                    {formatCurrency(selectedClaim.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Submitted Date
                  </p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedClaim.claimedAt ? formatDate(selectedClaim.claimedAt) : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Overall Status
                  </p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {selectedClaim.overallStatus || selectedClaim.managerStatus}
                  </p>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Provider / Description
                  </p>
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {selectedClaim.provider || 'No additional details provided.'}
                  </div>
                </div>

                {/* Receipt attachment if available */}
                {(selectedClaim.receiptUrl || selectedClaim.receiptName) && (
                  <div className="col-span-1 sm:col-span-2 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Receipt Attachment
                    </p>
                    <a
                      href={selectedClaim.receiptUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline bg-primary-50 dark:bg-primary-950/30 px-3 py-2 rounded-lg border border-primary-100 dark:border-primary-900/40"
                    >
                      <ExternalLink size={14} />
                      <span>{selectedClaim.receiptName || 'View Uploaded Receipt'}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Workflow Status Track */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Approval Workflow Track
                </p>
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 size={16} />
                    <span>Submitted</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-3" />
                  <div
                    className={cn(
                      'flex items-center gap-1.5 font-semibold',
                      selectedClaim.managerStatus === 'Approved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : selectedClaim.managerStatus === 'Rejected'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {selectedClaim.managerStatus === 'Approved' ? (
                      <CheckCircle2 size={16} />
                    ) : selectedClaim.managerStatus === 'Rejected' ? (
                      <XCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                    <span>Manager Review</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-3" />
                  <div
                    className={cn(
                      'flex items-center gap-1.5 font-semibold',
                      selectedClaim.overallStatus === 'Approved' || selectedClaim.overallStatus === 'Paid'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    <Clock size={16} />
                    <span>Final Approval</span>
                  </div>
                </div>
              </div>

              {/* Review Form or Decision Banner */}
              {selectedClaim.managerStatus === 'Pending' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} />
                      Manager Notes / Feedback (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add notes for employee or final approver..."
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <Button
                      variant="secondary"
                      size="md"
                      isDisabled={actionLoading}
                      onClick={() => {
                        setSelectedClaim(null);
                        setComment('');
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      isDisabled={actionLoading}
                      isLoading={actionLoading}
                      leftIcon={X}
                      onClick={() => handleReview('Rejected')}
                      className="w-full sm:w-auto"
                    >
                      Reject Claim
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      isDisabled={actionLoading}
                      isLoading={actionLoading}
                      leftIcon={Check}
                      onClick={() => handleReview('Approved')}
                      className="w-full sm:w-auto"
                    >
                      Approve Claim
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
                    <Info className="text-primary-500 shrink-0 mt-0.5" size={18} />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Claim Already Reviewed
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        This claim was <span className="font-bold">{selectedClaim.managerStatus.toLowerCase()}</span> by you.
                        {selectedClaim.managerComment && (
                          <span className="block italic mt-1 text-slate-700 dark:text-slate-300">
                            "{selectedClaim.managerComment}"
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setSelectedClaim(null);
                        setComment('');
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CenterModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerReimbursements;

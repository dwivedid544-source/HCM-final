import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, CheckCircle2, AlertCircle, FileText, X, Eye,
  ShieldCheck, CheckSquare, Clock, Search, CalendarCheck,
  RefreshCw, ExternalLink, Tag, Building2, Hash
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import CenterModal from '../../shared/components/layout/CenterModal';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '—'; }
};

const openAttachment = (pdfData, pdfName) => {
  if (!pdfData) return;
  if (typeof pdfData === 'string' && (pdfData.startsWith('http://') || pdfData.startsWith('https://'))) {
    window.open(pdfData, '_blank', 'noopener');
    return;
  }
  try {
    const base64 = pdfData.includes(',') ? pdfData.split(',')[1] : pdfData;
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length).map((_, i) => bytes.charCodeAt(i));
    const blob = new Blob([arr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfName || 'policy.pdf';
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    window.open(pdfData, '_blank', 'noopener');
  }
};

const PolicyCard = ({ policy, onRead, onAccept, accepting }) => {
  const accepted = policy.hasAcknowledged;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'card p-6 flex flex-col justify-between gap-5 border transition-all hover:shadow-lg group',
        accepted ? 'border-emerald-100 bg-emerald-50/20' : 'border-amber-100 bg-amber-50/10'
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border',
            accepted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-primary-600'
          )}>
            <ShieldCheck size={22} />
          </div>
          {accepted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 shrink-0">
              <CheckCircle2 size={12} /> Accepted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100 shrink-0">
              <Clock size={12} /> Pending
            </span>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug mb-1 group-hover:text-primary-700 transition-colors">
            {policy.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><Tag size={10} />{policy.category}</span>
            {policy.version && <span className="flex items-center gap-1"><Hash size={10} />Ver {policy.version}</span>}
            {policy.department && policy.department !== 'All' && (
              <span className="flex items-center gap-1"><Building2 size={10} />{policy.department}</span>
            )}
          </div>
        </div>

        {policy.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{policy.description}</p>
        )}

        {policy.pdfName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500 w-fit max-w-full">
            <FileText size={13} className="text-rose-500 shrink-0" />
            <span className="truncate">{policy.pdfName}</span>
          </div>
        )}

        {accepted && policy.acknowledgedAt && (
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
            <CalendarCheck size={13} />
            <span>Accepted on {formatDate(policy.acknowledgedAt)}{policy.version ? ` · Version ${policy.version}` : ''}</span>
          </div>
        )}
        {policy.effectiveDate && (
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <Clock size={11} />
            <span>Effective {formatDate(policy.effectiveDate)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <Button
          onClick={() => onRead(policy)}
          variant="secondary"
          leftIcon={Eye}
        >
          Read Policy
        </Button>

        {!accepted && (
          <Button
            onClick={() => onAccept(policy)}
            isDisabled={accepting === policy.id}
            isLoading={accepting === policy.id}
            variant="primary"
            leftIcon={CheckSquare}
            className="ml-auto"
          >
            Accept
          </Button>
        )}

        {accepted && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 size={14} /> Confirmed
          </span>
        )}
      </div>
    </motion.div>
  );
};

const EmployeeCompliance = () => {
  const { showToast, service } = useEmployee();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const fetchPolicies = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await service.getPolicies();
      setPolicies(res.data?.data || []);
    } catch (err) {
      showToast(err?.response?.data?.error?.message || 'Failed to load compliance policies', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [service, showToast]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const handleAccept = (policy) => {
    setAcceptTarget(policy);
    setIsAcceptModalOpen(true);
  };

  const confirmAccept = async () => {
    if (!acceptTarget) return;
    const target = acceptTarget;
    setAccepting(target.id);
    setIsAcceptModalOpen(false);
    setAcceptTarget(null);
    try {
      await service.acceptPolicy(target.id);
      showToast(`"${target.name}" accepted successfully`);
      await fetchPolicies(true);
      if (selectedPolicy?.id === target.id) {
        setSelectedPolicy(prev => prev ? { ...prev, hasAcknowledged: true } : null);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error?.message || 'Failed to accept policy';
      showToast(msg, 'error');
    } finally {
      setAccepting(null);
    }
  };

  const pendingPolicies = policies.filter(p => !p.hasAcknowledged);
  const acceptedPolicies = policies.filter(p => p.hasAcknowledged);

  const tabList = [
    { key: 'All', label: 'All', count: policies.length },
    { key: 'Pending', label: 'Pending', count: pendingPolicies.length },
    { key: 'Accepted', label: 'Accepted', count: acceptedPolicies.length },
  ];

  const baseList = activeTab === 'Pending' ? pendingPolicies : activeTab === 'Accepted' ? acceptedPolicies : policies;

  const filteredPolicies = baseList.filter(p =>
    !searchTerm ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Pending Acknowledgment', value: pendingPolicies.length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Acknowledged Policies', value: acceptedPolicies.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Policies', value: policies.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  if (loading) {
    return (
      <div className="space-y-8 pb-12 max-w-7xl mx-auto text-left">
        <div className="text-center py-20">
          <div className="w-14 h-14 border-4 border-t-primary-600 border-primary-100 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading compliance policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left">

      {/* Header */}
      <PageHeader
        title="Compliance & Policies"
        subtitle="Review and acknowledge company policies and compliance documents"
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchPolicies(true)}
            isDisabled={refreshing}
            isLoading={refreshing}
            variant="secondary"
            leftIcon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <motion.div key={idx} whileHover={{ y: -4 }}
            className="card p-5 flex items-center gap-4 border border-slate-100">
            <div className={cn('p-3 rounded-2xl shrink-0', stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabList.map(tab => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'bg-white text-slate-400 border border-slate-100 hover:border-primary-200'
              )}
            >
              {tab.label}
              <span className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black',
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 h-11 text-sm bg-white border-slate-200"
          />
        </div>
      </div>

      {/* Policy Grid */}
      <AnimatePresence mode="popLayout">
        {filteredPolicies.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredPolicies.map(policy => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onRead={(p) => { setSelectedPolicy(p); setIsReadModalOpen(true); }}
                onAccept={handleAccept}
                accepting={accepting}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
            <EmptyState 
              icon={Scale}
              title={searchTerm ? 'No matching policies' : 'No policies found'}
              description={searchTerm ? 'Try a different search term.' : 'There are no compliance policies available at this time.'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read Modal */}
      <CenterModal
        isOpen={isReadModalOpen}
        onClose={() => setIsReadModalOpen(false)}
        maxWidth="max-w-2xl"
        title={selectedPolicy?.name || 'Policy'}
      >
        {selectedPolicy && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {selectedPolicy.hasAcknowledged ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                  <CheckCircle2 size={12} /> Accepted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100">
                  <Clock size={12} /> Pending Acceptance
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedPolicy.category}
                {selectedPolicy.version ? ` · Version ${selectedPolicy.version}` : ''}
                {selectedPolicy.effectiveDate ? ` · Effective ${formatDate(selectedPolicy.effectiveDate)}` : ''}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-h-[45vh] overflow-y-auto space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedPolicy.description || 'This document contains the standard operating procedures and compliance rules. By acknowledging this document, you agree to adhere to the policies stated within.'}
              </p>

              {(selectedPolicy.pdfName || selectedPolicy.pdfData) && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{selectedPolicy.pdfName || 'Policy Document'}</p>
                      <p className="text-xs text-slate-400">PDF Document</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => openAttachment(selectedPolicy.pdfData, selectedPolicy.pdfName)}
                    variant="secondary"
                    leftIcon={ExternalLink}
                  >
                    Open
                  </Button>
                </div>
              )}
            </div>

            {selectedPolicy.hasAcknowledged && selectedPolicy.acknowledgedAt && (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                <CalendarCheck size={16} />
                <span>
                  Accepted on {formatDate(selectedPolicy.acknowledgedAt)}
                  {selectedPolicy.version ? ` — Version ${selectedPolicy.version}` : ''}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                onClick={() => setIsReadModalOpen(false)}
                variant="secondary"
              >
                Close
              </Button>
              {!selectedPolicy.hasAcknowledged && (
                <Button
                  onClick={() => { setIsReadModalOpen(false); handleAccept(selectedPolicy); }}
                  variant="primary"
                  leftIcon={CheckSquare}
                  className="flex-1"
                >
                  Accept Policy
                </Button>
              )}
            </div>
          </div>
        )}
      </CenterModal>

      {/* Accept Confirmation Modal */}
      <CenterModal
        isOpen={isAcceptModalOpen}
        onClose={() => { setIsAcceptModalOpen(false); setAcceptTarget(null); }}
        maxWidth="max-w-md"
        title="Accept Policy"
      >
        {acceptTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-snug">{acceptTarget.name}</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  {acceptTarget.category}{acceptTarget.version ? ` · Ver ${acceptTarget.version}` : ''}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              By clicking <strong>"I Accept"</strong>, you confirm that you have read and understood this policy and agree to comply with all terms outlined in this document.
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              This acceptance will be recorded with today's date and the current policy version.
            </p>

            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => { setIsAcceptModalOpen(false); setAcceptTarget(null); }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAccept}
                variant="primary"
                leftIcon={CheckCircle2}
                className="flex-[2]"
              >
                I Accept
              </Button>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
};

export default EmployeeCompliance;

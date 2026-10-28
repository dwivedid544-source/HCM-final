import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, CheckCircle2, XCircle, Clock,
  MapPin, DollarSign, Calendar, ChevronRight,
  Building2, ArrowRight, ShieldCheck, FileText,
  Download, Eye, AlertCircle, RefreshCw, Wifi,
  ExternalLink, Sparkles, Check, Info, AlertTriangle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useCandidate } from '../../context/CandidateContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';

// ─── Skeletons ────────────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg', className)} />
);

const OfferCardSkeleton = () => (
  <div className="card p-5 sm:p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3.5">
        <SkeletonBox className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-36" />
          <SkeletonBox className="h-3 w-24" />
        </div>
      </div>
      <SkeletonBox className="h-6 w-20 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-3 pt-2">
      <SkeletonBox className="h-12 rounded-xl" />
      <SkeletonBox className="h-12 rounded-xl" />
    </div>
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
      <SkeletonBox className="h-8 w-24 rounded-lg" />
      <SkeletonBox className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);

// ─── Status configuration ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending: {
    label: 'Action Required',
    style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    icon: Clock
  },
  Sent: {
    label: 'Action Required',
    style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
    icon: Clock
  },
  Accepted: {
    label: 'Accepted',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
    icon: CheckCircle2
  },
  Declined: {
    label: 'Declined',
    style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50',
    icon: XCircle
  },
  Expired: {
    label: 'Expired',
    style: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    icon: AlertCircle
  }
};

const normalizeStatus = (status, isExpired) => {
  if (isExpired) return 'Expired';
  if (!status) return 'Pending';
  const s = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if (s === 'Sent' || s === 'Pending') return 'Pending';
  if (s === 'Accepted') return 'Accepted';
  if (s === 'Declined' || s === 'Rejected') return 'Declined';
  if (s === 'Expired') return 'Expired';
  return s;
};

// ─── Main Offers Component ────────────────────────────────────────────────────
const Offers = () => {
  const {
    offers = [],
    profile,
    respondToOffer,
    showToast,
    refetch,
    isLoading,
    error
  } = useCandidate();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'accepted', 'past'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseType, setResponseType] = useState('Accepted'); // 'Accepted' | 'Declined'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger offers refresh on mount
  useEffect(() => {
    if (refetch?.fetchOffers) refetch.fetchOffers();
  }, [refetch]);

  // Normalized offer records
  const normalizedOffers = useMemo(() => {
    const now = new Date();
    return offers.map(offer => {
      let isExpired = offer.isExpired || false;
      if (offer.expirationDate) {
        const exp = new Date(offer.expirationDate);
        if (!isNaN(exp.getTime()) && now > exp) {
          isExpired = true;
        }
      }
      const normStatus = normalizeStatus(offer.status, isExpired);
      const company = offer.application?.jobPost?.organization?.name || offer.company || 'GlobalTech Solutions';
      const role = offer.role || offer.application?.jobPost?.title || 'Position';
      const department = offer.application?.jobPost?.department || 'Engineering';
      const location = offer.application?.jobPost?.location || 'Remote';
      const jobType = offer.application?.jobPost?.jobType || 'Full-time';

      return {
        ...offer,
        displayStatus: normStatus,
        isExpired,
        company,
        role,
        department,
        location,
        jobType,
        isActionable: normStatus === 'Pending' && !isExpired
      };
    });
  }, [offers]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = normalizedOffers.length;
    const actionRequired = normalizedOffers.filter(o => o.isActionable).length;
    const accepted = normalizedOffers.filter(o => o.displayStatus === 'Accepted').length;
    return { total, actionRequired, accepted };
  }, [normalizedOffers]);

  // Filtered offers by active tab
  const filteredOffers = useMemo(() => {
    if (activeTab === 'pending') {
      return normalizedOffers.filter(o => o.isActionable);
    }
    if (activeTab === 'accepted') {
      return normalizedOffers.filter(o => o.displayStatus === 'Accepted');
    }
    if (activeTab === 'past') {
      return normalizedOffers.filter(o => !o.isActionable);
    }
    return normalizedOffers;
  }, [normalizedOffers, activeTab]);

  // ── Action Handlers ─────────────────────────────────────────────────────────
  const handleOpenDetails = (offer) => {
    setSelectedOffer(offer);
    setDetailsModalOpen(true);
  };

  const handleResponseInit = (offer, type) => {
    setSelectedOffer(offer);
    setResponseType(type);
    setResponseModalOpen(true);
  };

  const confirmResponse = async () => {
    if (!selectedOffer) return;
    try {
      setIsSubmitting(true);
      await respondToOffer(selectedOffer.id, responseType);
      setResponseModalOpen(false);
      setDetailsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadLetter = (offer) => {
    if (offer.documentUrl) {
      window.open(offer.documentUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const company = offer.company || 'GlobalTech Solutions';
    const role = offer.role || 'Position';
    const candidateName = offer.candidate || profile?.fullName || 'Candidate';
    const date = offer.sentDate || new Date(offer.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const salary = offer.salary || 'Competitive Compensation';
    const joinDate = offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To Be Determined';

    const content = `================================================================================
                           OFFICIAL OFFER OF EMPLOYMENT
                            ${company.toUpperCase()}
================================================================================

Date: ${date}
Offer Reference ID: ${offer.id}

To: ${candidateName}
Position Title: ${role}
Department: ${offer.department || 'Operations'}
Location: ${offer.location || 'Company Headquarters'}
Employment Type: ${offer.jobType || 'Full-time'}

Dear ${candidateName},

On behalf of ${company}, we are delighted to extend this formal offer of employment
for the position of ${role}.

1. COMPENSATION & SCHEDULE
--------------------------------------------------------------------------------
- Annual Base Compensation: ${salary}
- Target Start Date: ${joinDate}
- Offer Expiration: ${offer.expirationDate ? new Date(offer.expirationDate).toLocaleDateString() : '14 days from issuance'}

2. BENEFITS & PERKS
--------------------------------------------------------------------------------
${offer.benefits ? offer.benefits : `• Comprehensive Medical, Dental, and Vision coverage
• 401(k) Retirement Savings Plan with company match
• Flexible Paid Time Off (PTO) & Public Holidays
• Annual Learning & Professional Development stipend`}

3. TERMS & CONDITIONS
--------------------------------------------------------------------------------
${offer.terms ? offer.terms : `This offer is contingent upon standard pre-employment checks, including verification
of academic credentials and past employment references. Employment with ${company}
is at-will and subject to standard company policies and procedures.`}

${offer.letterContent ? `\nADDITIONAL NOTES FROM HIRING COMMITTEE:\n--------------------------------------------------------------------------------\n${offer.letterContent}\n` : ''}
--------------------------------------------------------------------------------
Offer Status at Download: ${offer.displayStatus.toUpperCase()}
Issued By: Talent Acquisition & HR Leadership (${company})
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Offer_Letter_${company.replace(/[^a-zA-Z0-9]/g, '_')}_${role.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast?.('Offer letter downloaded successfully.', 'success');
  };

  // ── Retry Handler ───────────────────────────────────────────────────────────
  const handleRetry = () => {
    if (refetch?.fetchOffers) refetch.fetchOffers();
  };

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error && offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shadow-sm">
          <Wifi size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Offers</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
        </div>
        <button className="btn-primary" onClick={handleRetry}>
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto text-left px-2 sm:px-0">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="My Offers"
        description="Review, evaluate, and respond to your official employment offers."
        actions={
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Offers', count: stats.total },
              { id: 'pending', label: 'Action Required', count: stats.actionRequired },
              { id: 'accepted', label: 'Accepted', count: stats.accepted },
              { id: 'past', label: 'Archived', count: stats.total - stats.actionRequired }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        }
      />

      {/* ── KPI Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={Briefcase}
          label="Total Offers"
          value={stats.total}
          bg="bg-blue-50 dark:bg-blue-950/20"
          iconColor="text-blue-600 dark:text-blue-400"
          sub={stats.total > 0 ? `${stats.total} formal record${stats.total !== 1 ? 's' : ''}` : 'No offers received yet'}
        />
        <StatCard
          icon={Clock}
          label="Action Required"
          value={stats.actionRequired}
          bg="bg-amber-50 dark:bg-amber-950/20"
          iconColor="text-amber-600 dark:text-amber-400"
          sub={stats.actionRequired > 0 ? `${stats.actionRequired} offer awaiting your decision` : 'All offers up to date'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Accepted"
          value={stats.accepted}
          bg="bg-emerald-50 dark:bg-emerald-950/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          sub={stats.accepted > 0 ? `${stats.accepted} offer accepted` : 'No accepted offers yet'}
        />
      </div>

      {/* ── Offers Grid / Empty State ───────────────────────────────── */}
      {isLoading && offers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OfferCardSkeleton />
          <OfferCardSkeleton />
        </div>
      ) : normalizedOffers.length === 0 ? (
        /* Empty State */
        <div className="card p-12 sm:p-16 text-center space-y-4 border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Briefcase className="text-slate-300 dark:text-slate-600" size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Offers Yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              You don't have any job offers right now. Keep applying and crushing those interviews!
            </p>
          </div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No offers matching filter</p>
          <p className="text-xs text-slate-400">There are no offers under the selected "{activeTab}" tab.</p>
          <button className="btn-secondary btn-compact mx-auto" onClick={() => setActiveTab('all')}>View All Offers</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onOpenDetails={handleOpenDetails}
              onRespond={handleResponseInit}
              onDownload={handleDownloadLetter}
            />
          ))}
        </div>
      )}

      {/* ── Offer Details Modal ──────────────────────────────────────── */}
      <CenterModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Job Offer Overview"
        maxWidth="max-w-2xl"
      >
        {selectedOffer && (
          <div className="p-5 sm:p-7 space-y-6 text-left">
            {/* Header info */}
            <div className="flex items-start gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                {(selectedOffer.company || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn('px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border', STATUS_CONFIG[selectedOffer.displayStatus]?.style)}>
                    {selectedOffer.displayStatus}
                  </span>
                  {selectedOffer.isActionable && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                      Pending Action
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{selectedOffer.role}</h2>
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 flex items-center gap-1.5">
                  <Building2 size={13} /> {selectedOffer.company} • {selectedOffer.department}
                </p>
              </div>
            </div>

            {/* Compensation & dates grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <DollarSign size={12} /> Total Compensation
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-white">{selectedOffer.salary || 'Competitive'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Calendar size={12} /> Proposed Start Date
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedOffer.joiningDate ? new Date(selectedOffer.joiningDate).toLocaleDateString() : 'To Be Determined'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Clock size={12} /> Date Sent
                </span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedOffer.sentDate || 'Recently'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <AlertTriangle size={12} /> Expiration
                </span>
                <p className={cn(
                  'text-sm font-bold',
                  selectedOffer.isExpired ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'
                )}>
                  {selectedOffer.expirationDate ? new Date(selectedOffer.expirationDate).toLocaleDateString() : '14 days from issuance'}
                  {selectedOffer.isExpired && ' (Expired)'}
                </p>
              </div>
            </div>

            {/* Benefits section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" /> Benefits & Perks
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedOffer.benefits || (
                  '• Comprehensive Health, Dental & Vision Insurance\n• 401(k) Retirement Plan with Match\n• Flexible PTO & Paid Holidays\n• Equipment Stipend & Professional Development Budget'
                )}
              </div>
            </div>

            {/* Terms section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-primary-500" /> Terms & Conditions
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedOffer.terms || 'This employment offer is contingent upon successful reference checks and proof of eligibility to work. Standard employment is at-will.'}
              </div>
            </div>

            {/* Letter content if present */}
            {selectedOffer.letterContent && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-blue-500" /> Official Offer Letter
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line font-mono text-[11px]">
                  {selectedOffer.letterContent}
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadLetter(selectedOffer)}
                className="btn-secondary w-full sm:w-auto text-xs flex items-center justify-center gap-1.5"
              >
                <Download size={13} />
                <span>Download Official Letter</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedOffer.isActionable ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setDetailsModalOpen(false); handleResponseInit(selectedOffer, 'Declined'); }}
                      className="btn-secondary text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs flex-1 sm:flex-none"
                    >
                      <XCircle size={13} />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDetailsModalOpen(false); handleResponseInit(selectedOffer, 'Accepted'); }}
                      className="btn-primary text-xs flex-1 sm:flex-none"
                    >
                      <CheckCircle2 size={13} />
                      <span>Accept Offer</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDetailsModalOpen(false)}
                    className="btn-secondary text-xs w-full sm:w-auto"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </CenterModal>

      {/* ── Confirmation Response Modal ───────────────────────────────── */}
      <CenterModal
        isOpen={responseModalOpen}
        onClose={() => !isSubmitting && setResponseModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="p-6 sm:p-8 text-center space-y-5">
          <div className={cn(
            'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center',
            responseType === 'Accepted'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'
          )}>
            {responseType === 'Accepted' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {responseType === 'Accepted' ? 'Accept Employment Offer?' : 'Decline Employment Offer?'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              You are about to <span className="font-bold lowercase">{responseType}</span> the formal offer for{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOffer?.role}</span> at{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOffer?.company}</span>.
              {responseType === 'Accepted'
                ? ' This will inform the recruitment team and begin your onboarding workflow.'
                : ' This decision is irreversible and your application will be archived.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setResponseModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmResponse}
              disabled={isSubmitting}
              className={cn(
                'flex-1 text-xs flex items-center justify-center gap-1.5',
                responseType === 'Accepted' ? 'btn-primary' : 'btn-danger'
              )}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm {responseType === 'Accepted' ? 'Acceptance' : 'Decline'}</span>
              )}
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

// ─── Sub-Component: Offer Card ────────────────────────────────────────────────
const OfferCard = ({ offer, onOpenDetails, onRespond, onDownload }) => {
  const currentConfig = STATUS_CONFIG[offer.displayStatus] || STATUS_CONFIG.Pending;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'card p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between',
        offer.isActionable
          ? 'border-amber-200 dark:border-amber-900/50 ring-1 ring-amber-100 dark:ring-amber-900/20'
          : 'border-slate-100 dark:border-slate-800'
      )}
    >
      <div>
        {/* Top bar: Company & status pill */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {(offer.company || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{offer.role}</h3>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate flex items-center gap-1">
                <Building2 size={12} /> {offer.company}
              </p>
            </div>
          </div>

          <span className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0',
            currentConfig.style
          )}>
            {currentConfig.label}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <DollarSign size={11} /> Compensation
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {offer.salary || 'Competitive'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Calendar size={11} /> Target Join Date
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString() : 'TBD'}
            </p>
          </div>
        </div>

        {/* Dates metadata footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1">
            <Clock size={12} /> Sent: {offer.sentDate || 'Recent'}
          </span>
          {offer.expirationDate && (
            <span className={cn(
              'flex items-center gap-1',
              offer.isExpired ? 'text-rose-500 font-bold' : ''
            )}>
              Expires: {new Date(offer.expirationDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div className="pt-4 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={() => onOpenDetails(offer)}
          className="btn-ghost btn-compact text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Eye size={13} />
          <span>View Details</span>
        </button>

        <div className="flex items-center gap-2">
          {offer.isActionable ? (
            <>
              <button
                type="button"
                onClick={() => onRespond(offer, 'Declined')}
                className="btn-secondary btn-compact text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1"
              >
                <XCircle size={13} />
                <span>Decline</span>
              </button>
              <button
                type="button"
                onClick={() => onRespond(offer, 'Accepted')}
                className="btn-primary btn-compact text-xs flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                <span>Accept</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onDownload(offer)}
              className="btn-secondary btn-compact text-xs flex items-center gap-1"
            >
              <Download size={13} />
              <span>Download Letter</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Offers;

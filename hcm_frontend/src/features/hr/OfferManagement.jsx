import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  Plus, Search, DollarSign, FileText, Calendar,
  Send, CheckCircle2, X, Eye, Download,
  RotateCcw, FileSearch, Trash2, Loader2, Sparkles,
  User, Check, XCircle, Printer, Copy, Edit3, Award,
  Briefcase
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useHR } from '../../context/HRContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useDateFormat } from '../../hooks/useDateFormat';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import DatePicker from '../../shared/components/common/DatePicker';
import StatCard from '../../shared/components/ui/StatCard';
import PageHeader from '../../shared/components/ui/PageHeader';
import { employeeAPI, uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import { printIsolatedHTML } from '../../utils/printAndPdfUtils';

const getInitials = (name) => {
  if (!name) return 'CA';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const OfferLetterDocument = ({ data, mode = 'preview' }) => {
  if (!data) return null;

  let parsedData = data;
  if (data.letterContent) {
    try {
      parsedData = typeof data.letterContent === 'string' ? JSON.parse(data.letterContent) : data.letterContent;
    } catch (e) {
      console.error("Failed to parse saved letter content:", e);
    }
  }

  const isRawOffer = !parsedData.company && parsedData.candidate;

  const company = isRawOffer ? { name: 'GlobalTech Solutions', address: '100 Innovation Blvd, Suite 400, Tech City, TC 10101' } : (parsedData.company || {});
  const candidate = isRawOffer ? { name: parsedData.candidate, email: '' } : (parsedData.candidate || {});
  const pos = isRawOffer ? { jobTitle: parsedData.role, salary: parsedData.salary, joiningDate: parsedData.joiningDate } : (parsedData.positionDetails || {});
  const sig = isRawOffer ? { name: 'HR Operations Division', designation: 'Head of People & Culture' } : (parsedData.signatory || {});

  const paragraphs = isRawOffer ? [
    `Dear ${parsedData.candidate.split(' ')[0]},`,
    `On behalf of GlobalTech Solutions, we are thrilled to formally offer you the position of ${parsedData.role}. Following our review and interviews, we are confident that your expertise, vision, and talent will be a tremendous asset to our organization.`,
    `We look forward to welcoming you aboard and shaping the future of enterprise software together.`
  ] : (parsedData.bodyParagraphs || []);

  const terms = isRawOffer ? [
    "Compensation: Base annual compensation package as outlined below.",
    "Anticipated Commencement: Joining date as scheduled.",
    "Probationary Review: Standard 90-day evaluation period.",
    "Benefits: Comprehensive health insurance, paid leave, and performance incentives."
  ] : (parsedData.terms || []);

  return (
    <div
      id="offer-letter-print-area"
      className={cn(
        "bg-white text-slate-900 font-sans leading-relaxed text-xs p-8 sm:p-12 box-border text-left relative",
        mode === 'preview' && "w-full max-w-[210mm] min-h-[297mm] shadow-2xl mx-auto border border-slate-200 dark:border-slate-800 rounded-2xl",
        (mode === 'print' || mode === 'pdf') && "w-[210mm] min-h-[297mm] shadow-none border-none p-12"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
        <div>
          <h4 className="text-base font-black text-primary-600 tracking-tight uppercase">{company.name || 'GlobalTech Solutions'}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">{company.address || '100 Innovation Blvd, Suite 400'}</p>
        </div>

        <div className="text-right text-[9px] text-slate-400 uppercase tracking-wider">
          <p className="font-bold text-slate-800">Formal Offer Reference</p>
          <p className="font-mono text-primary-600 font-bold">{data.reference || `REF-${Math.floor(Math.random() * 9000 + 1000)}-2026`}</p>
          <p className="mt-1">{data.sentDate || data.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Candidate Details */}
      <div className="space-y-1 mb-6 text-xs">
        <p className="font-bold text-slate-900 text-sm">{candidate.name || 'Candidate Name'}</p>
        {candidate.email && <p className="text-slate-500">{candidate.email}</p>}
        {candidate.address && <p className="text-slate-500">{candidate.address}</p>}
      </div>

      {/* Subject */}
      <p className="font-bold text-slate-950 border-l-3 border-primary-600 pl-3 py-1 my-5 text-xs uppercase tracking-wider bg-slate-50 p-2 rounded-r-lg">
        {data.subject || `Subject: Formal Offer of Employment — ${pos.jobTitle || 'Position'}`}
      </p>

      {/* Salutation */}
      <p className="my-3 font-semibold text-slate-900">{data.salutation || `Dear ${candidate.name || 'Candidate'},`}</p>

      {/* Paragraphs */}
      <div className="space-y-3 text-slate-700 leading-relaxed text-xs">
        {paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>

      {/* Compensation Details Box */}
      <div className="border border-slate-200 rounded-xl p-4 my-6 bg-slate-50/80">
        <p className="font-bold text-[10px] text-primary-700 uppercase tracking-wider mb-3">Position & Compensation Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-700">
          <p><span className="font-bold text-slate-900">Job Title:</span> {pos.jobTitle || 'N/A'}</p>
          <p><span className="font-bold text-slate-900">Proposed Salary:</span> {pos.salary || 'N/A'}</p>
          <p><span className="font-bold text-slate-900">Joining Date:</span> {pos.joiningDate || 'N/A'}</p>
          <p><span className="font-bold text-slate-900">Employment Type:</span> {pos.employmentType || 'Full-Time'}</p>
          {pos.department && <p><span className="font-bold text-slate-900">Department:</span> {pos.department}</p>}
        </div>
      </div>

      {/* Terms & Conditions */}
      {terms.length > 0 && (
        <div className="my-5 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-[10px] text-primary-700 uppercase tracking-wider mb-2">Key Terms & Conditions</p>
          {terms.map((term, idx) => (
            <p key={idx} className="flex items-start gap-1.5">
              <span className="text-primary-600 font-bold">•</span>
              <span>{term}</span>
            </p>
          ))}
        </div>
      )}

      {/* Signature Area */}
      <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-end">
        <div>
          <p className="my-1 text-xs text-slate-600">{data.closing?.text || 'We look forward to welcoming you to the GlobalTech team.'}</p>
          <div className="mt-6">
            <p className="text-xs text-slate-500">Sincerely,</p>
            <p className="font-bold mt-3 text-slate-900">{sig.name || 'Authorized Signatory'}</p>
            <p className="text-[11px] text-slate-400">{sig.designation || 'People & Culture Operations'}</p>
          </div>
        </div>

        <div className="text-right text-[10px] text-slate-400 border border-dashed border-slate-300 p-2.5 rounded-xl bg-slate-50/50">
          <p className="font-bold text-slate-600">Digital Seal Verified</p>
          <p className="text-[9px] text-slate-400">GlobalTech HCM Signatory</p>
        </div>
      </div>
    </div>
  );
};

const OfferManagement = () => {
  const { formatCurrency, getSymbol, getIcon, masterCurrency } = useCurrency();
  const { formatDate } = useDateFormat();

  const { offers = [], addOffer, updateOffer, deleteOffer, candidates = [], showToast, refetch } = useHR();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedFile, setSelectedFile] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);

  const fileInputRef = useRef(null);

  // AI Letter Generator States
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [letterData, setLetterData] = useState(null);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [activeOfferForLetter, setActiveOfferForLetter] = useState(null);
  const [previewingOffer, setPreviewingOffer] = useState(null);

  const [formData, setFormData] = useState({
    candidate: '', 
    role: '', 
    salary: '', 
    joiningDate: '', 
    status: 'Sent'
  });

  const candidatesReadyForOffer = useMemo(() => {
    return (candidates || []).filter(c => {
      const isOfferStage = c.stage === 'Offer' || c.stage === 'OFFERED' || c.stage === 'Shortlisted' || c.stage === 'Interview' || c.stage === 'Hired';
      const hasOffer = (offers || []).some(o => o.applicationId === c.id || o.candidate?.toLowerCase() === c.name?.toLowerCase());
      return isOfferStage && !hasOffer;
    });
  }, [candidates, offers]);

  const handleOpenCreate = useCallback(() => {
    setEditingOffer(null);
    setSelectedFile(null);
    setFormData({ candidate: '', role: '', salary: '', joiningDate: '', status: 'Sent' });
    setIsModalOpen(true);
  }, []);

  const handleOpenCreateForCandidate = useCallback((cand) => {
    setEditingOffer(null);
    setSelectedFile(null);
    setFormData({
      candidate: cand.name || '',
      role: cand.role || '',
      salary: cand.expectedSalary || '',
      joiningDate: '',
      status: 'Sent'
    });
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (location.state?.openCreate) {
      handleOpenCreate();
      window.history.replaceState({}, document.title);
    }
  }, [location, handleOpenCreate]);

  // Dynamic KPI Stats
  const stats = useMemo(() => {
    const draftCount = offers.filter(o => o.status === 'Draft').length;
    const sentCount = offers.filter(o => o.status === 'Sent').length;
    const acceptedCount = offers.filter(o => o.status === 'Accepted').length;
    const declinedCount = offers.filter(o => o.status === 'Declined').length;

    return [
      { 
        label: 'Draft Offers', 
        value: draftCount, 
        sub: `${draftCount} in preparation`,
        trendPct: draftCount > 0 ? `+${draftCount}` : '0',
        icon: FileText, 
        bg: 'bg-blue-50 dark:bg-blue-950/30', 
        iconColor: 'text-blue-600 dark:text-blue-400',
        onClick: () => setFilterStatus('Draft')
      },
      { 
        label: 'Sent Offers', 
        value: sentCount, 
        sub: `${sentCount} awaiting decision`,
        trendPct: sentCount > 0 ? `+${sentCount}` : '0',
        icon: Send, 
        bg: 'bg-amber-50 dark:bg-amber-950/30', 
        iconColor: 'text-amber-600 dark:text-amber-400',
        onClick: () => setFilterStatus('Sent')
      },
      { 
        label: 'Accepted', 
        value: acceptedCount, 
        sub: `${acceptedCount} converted to hires`,
        trendPct: acceptedCount > 0 ? `+${acceptedCount}` : '0',
        icon: CheckCircle2, 
        bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        onClick: () => setFilterStatus('Accepted')
      },
      { 
        label: 'Declined', 
        value: declinedCount, 
        sub: `${declinedCount} declined offers`,
        trendPct: declinedCount > 0 ? `+${declinedCount}` : '0',
        icon: XCircle, 
        bg: 'bg-rose-50 dark:bg-rose-950/30', 
        iconColor: 'text-rose-600 dark:text-rose-400',
        onClick: () => setFilterStatus('Declined')
      },
    ];
  }, [offers]);

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer.id);
    setSelectedFile(offer.fileName ? { name: offer.fileName } : null);
    setFormData({ ...offer });
    setIsModalOpen(true);
  };

  const handleOpenPreview = (offer) => {
    setPreviewingOffer(offer);
  };

  const handleSubmit = async (e, forceDraft = false) => {
    if (e) e.preventDefault();
    if (!formData.candidate.trim()) return showToast('Please select a candidate', 'error');

    const status = forceDraft ? 'Draft' : formData.status || 'Sent';
    const activeCand = candidates.find(c => c.name === formData.candidate) || {};

    let uploadedOfferUrl = selectedFile?.url || null;
    if (selectedFile && !uploadedOfferUrl && selectedFile instanceof File) {
      try {
        const res = await uploadAPI.uploadDocument(selectedFile, 'hcm/offers');
        uploadedOfferUrl = res.data?.data?.url || null;
      } catch (uploadErr) {
        console.warn('Offer letter upload failed, proceeding:', uploadErr.message);
      }
    }

    const payload = {
      ...formData,
      status,
      applicationId: activeCand.id,
      role: formData.role || activeCand.role || 'Role',
      fileName: selectedFile ? selectedFile.name : null,
      offerLetterUrl: uploadedOfferUrl,
      sentDate: formatDate(new Date())
    };

    if (editingOffer) {
      await updateOffer(editingOffer, payload);
    } else {
      await addOffer(payload);
    }

    setIsModalOpen(false);
    setSelectedFile(null);
  };

  const handleDeleteOffer = (offer) => {
    setOfferToDelete(offer);
  };

  const handleConfirmDelete = async () => {
    if (offerToDelete) {
      await deleteOffer(offerToDelete.id);
      setOfferToDelete(null);
    }
  };

  const handleRefresh = async () => {
    showToast('Refreshing offer data...', 'info');
    if (refetch && refetch.fetchOffers) {
      await refetch.fetchOffers();
    }
    if (refetch && refetch.fetchApplications) {
      await refetch.fetchApplications();
    }
    showToast('Offers refreshed successfully', 'success');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const v = validateFile(file, ['pdf', 'doc', 'docx'], 10);
    if (!v.isValid) { showToast(v.message, 'error'); return; }
    setSelectedFile(file);
    try {
      const res = await uploadAPI.uploadDocument(file, 'hcm/offers');
      const cloudUrl = res.data?.data?.url;
      if (cloudUrl) {
        file.url = cloudUrl;
        showToast(`Document uploaded: ${file.name}`, 'success');
        return;
      }
    } catch (uploadErr) {
      console.warn('Document upload deferred:', uploadErr.message);
    }
    showToast(`File selected: ${file.name}`);
  };

  const assembleLetterText = (data) => {
    if (!data) return '';
    const company = data.company || {};
    const candidate = data.candidate || {};
    const pos = data.positionDetails || {};
    const sig = data.signatory || {};
    const paragraphs = data.bodyParagraphs || [];
    const terms = data.terms || [];

    return `${company.name || 'GlobalTech Solutions'}
${company.address || '100 Innovation Blvd, Suite 400'}

Date: ${data.date || new Date().toLocaleDateString()}

To:
${candidate.name || 'Candidate Name'}
${candidate.email || ''}

Subject: ${data.subject || 'Formal Offer of Employment'}

${data.salutation || 'Dear Candidate,'}

${paragraphs.join('\n\n')}

Position Details:
- Job Title: ${pos.jobTitle || 'N/A'}
- Proposed Salary: ${pos.salary || 'N/A'}
- Joining Date: ${pos.joiningDate || 'N/A'}
- Employment Type: ${pos.employmentType || 'Full-Time'}

Terms & Conditions:
${terms.map(t => `- ${t}`).join('\n')}

Sincerely,
${sig.name || 'Authorized Signatory'}
${sig.designation || 'People & Culture Operations'}`;
  };

  const handleGenerateAiLetter = async (offerObj) => {
    const targetOffer = offerObj || offers[0];
    if (!targetOffer) {
      showToast('Please create or select an offer first.', 'warning');
      return;
    }

    setActiveOfferForLetter(targetOffer);

    if (targetOffer.letterContent) {
      try {
        const parsed = typeof targetOffer.letterContent === 'string' ? JSON.parse(targetOffer.letterContent) : targetOffer.letterContent;
        setLetterData(parsed);
        setGeneratedLetter(assembleLetterText(parsed));
        setIsEditingLetter(false);
        setShowLetterPreview(true);
        showToast('Loaded saved offer letter!', 'success');
        return;
      } catch {
        setGeneratedLetter(targetOffer.letterContent);
        setLetterData({
          company: { name: 'GlobalTech Solutions' },
          candidate: { name: targetOffer.candidate },
          positionDetails: { jobTitle: targetOffer.role, salary: targetOffer.salary, joiningDate: targetOffer.joiningDate },
          bodyParagraphs: [targetOffer.letterContent]
        });
        setIsEditingLetter(false);
        setShowLetterPreview(true);
        showToast('Loaded saved offer letter!', 'success');
        return;
      }
    }

    setIsGeneratingLetter(true);
    showToast('Generating AI Offer Letter...', 'info');
    try {
      const cand = candidates.find(c => c.name === targetOffer.candidate) || {};
      const contextData = {
        type: 'Offer Letter',
        candidateName: targetOffer.candidate,
        candidateEmail: cand.email || '',
        jobTitle: targetOffer.role,
        salary: targetOffer.salary,
        joiningDate: targetOffer.joiningDate
      };

      const res = await employeeAPI.aiGenerateLetter("Offer Letter", contextData);

      if (res && res.data && res.data.success) {
        const contentObj = res.data.data;
        setLetterData(contentObj);
        const formattedText = assembleLetterText(contentObj);
        setGeneratedLetter(formattedText);
        setIsEditingLetter(false);
        setShowLetterPreview(true);
        showToast('AI Offer Letter Generated!', 'success');
      } else {
        throw new Error(res.data?.error || 'AI generation failed');
      }
    } catch (e) {
      console.error('AI Letter generation failed:', e);
      showToast(e.message || 'AI Letter Generation failed', 'error');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const displaySalary = (val) => {
    if (!val) return 'N/A';
    const cleaned = String(val).replace(/[$,₹,€,£,\s]/g, '');
    if (!isNaN(cleaned) && cleaned.trim() !== '') {
      return formatCurrency(Number(cleaned));
    }
    return val;
  };

  const handleDownloadOffer = () => {
    const activeData = showLetterPreview ? letterData : previewingOffer;
    if (!activeData) {
      showToast('Error: No offer letter data found.', 'error');
      return;
    }
    showToast('Generating PDF document...', 'info');

    const candName = activeData.candidate?.name || activeData.candidate || 'Candidate';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('GLOBALTECH SOLUTIONS', 20, 25);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('100 Innovation Blvd, Suite 400 • Tech City, TC 10101', 20, 31);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 190, 25, { align: 'right' });
    doc.text(`REF: OFF-${Math.floor(Math.random() * 9000 + 1000)}-2026`, 190, 31, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, 190, 36);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`FORMAL OFFER OF EMPLOYMENT: ${activeData.role || activeData.positionDetails?.jobTitle || 'Role'}`, 20, 46);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Dear ${candName},`, 20, 56);

    const body = `We are pleased to extend this formal offer of employment for the position of ${activeData.role || activeData.positionDetails?.jobTitle || 'Team Member'} at GlobalTech Solutions. We believe your skills and background will make a substantial contribution to our company goals.`;
    const lines = doc.splitTextToSize(body, 170);
    doc.text(lines, 20, 64);

    doc.setFillColor(248, 250, 252);
    doc.rect(20, 80, 170, 28, 'F');
    doc.rect(20, 80, 170, 28, 'D');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229);
    doc.text('COMPENSATION & COMMENCEMENT', 25, 87);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Position: ${activeData.role || activeData.positionDetails?.jobTitle || 'N/A'}`, 25, 95);
    doc.text(`Joining Date: ${activeData.joiningDate || activeData.positionDetails?.joiningDate || 'TBD'}`, 25, 102);
    doc.text(`Proposed Annual Salary: ${activeData.salary || activeData.positionDetails?.salary || 'Competitive'}`, 110, 95);
    doc.text('Employment Type: Full-Time Regular', 110, 102);

    doc.text('Sincerely,', 20, 130);
    doc.setFont('Helvetica', 'bold');
    doc.text('HR Operations & People Team', 20, 140);
    doc.setFont('Helvetica', 'normal');
    doc.text('GlobalTech Solutions Inc.', 20, 146);

    const sanitizedName = candName.replace(/\s+/g, '_');
    doc.save(`Offer_Letter_${sanitizedName}.pdf`);
    showToast('PDF downloaded successfully!', 'success');
  };

  const handlePrintOfferDocument = () => {
    const el = document.getElementById('offer-letter-print-area');
    if (el) {
      printIsolatedHTML(el.innerHTML, `Offer Letter — ${previewingOffer?.candidate || 'Candidate'}`);
    } else {
      window.print();
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (o.candidate || '').toLowerCase().includes(q) ||
        (o.role || '').toLowerCase().includes(q);
      const matchStatus = filterStatus !== 'All' ? o.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [offers, searchTerm, filterStatus]);

  const CurrencyIcon = useMemo(() => getIcon(), [getIcon]);
  const currentCurrencySymbol = getSymbol();

  const statusTabs = [
    { key: 'All', label: 'All', count: offers.length },
    { key: 'Draft', label: 'Draft', count: offers.filter(o => o.status === 'Draft').length },
    { key: 'Sent', label: 'Sent', count: offers.filter(o => o.status === 'Sent').length },
    { key: 'Accepted', label: 'Accepted', count: offers.filter(o => o.status === 'Accepted').length },
    { key: 'Declined', label: 'Declined', count: offers.filter(o => o.status === 'Declined').length },
  ];

  const hasActiveFilters = searchTerm.trim() !== '' || filterStatus !== 'All';

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Offer Management"
        description="Send, track, and generate formal employment offers for selected candidates"
        actions={
          <>
            {/* Standardized Refresh Button */}
            <button 
              type="button"
              onClick={handleRefresh}
              className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Standardized AI Letter Generator Button */}
            <button
              type="button"
              onClick={() => handleGenerateAiLetter()}
              disabled={isGeneratingLetter}
              className="h-11 px-4 sm:px-5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isGeneratingLetter ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>AI Letter Generator</span>
            </button>

            {/* Standardized Primary Create Offer Button */}
            <button 
              type="button"
              onClick={handleOpenCreate}
              className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Create New Offer</span>
            </button>
          </>
        }
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            trendPct={stat.trendPct}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* ── Candidates Ready for Offer Banner ── */}
      {candidatesReadyForOffer.length > 0 && (
        <div className="card p-5 sm:p-6 bg-gradient-to-r from-primary-50/60 via-purple-50/40 to-emerald-50/40 dark:from-primary-950/30 dark:via-purple-950/20 dark:to-emerald-950/20 border border-primary-100 dark:border-primary-900/40 shadow-xs rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Candidates Ready for Formal Offer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These candidates successfully passed interview rounds and are ready for official offer letters.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 rounded-full text-xs font-black self-start sm:self-center shrink-0">
              {candidatesReadyForOffer.length} Awaiting Offer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
            {candidatesReadyForOffer.map((cand) => (
              <div
                key={cand.id}
                className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitials(cand.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{cand.name}</h4>
                      <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 truncate">{cand.role}</p>
                    </div>
                  </div>

                  {cand.match && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                      {cand.match}% Match
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {cand.expectedSalary ? `Exp: ${cand.expectedSalary}` : 'Interview Passed'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateForCandidate(cand)}
                    className="h-7 px-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer select-none"
                  >
                    <Plus size={12} />
                    <span>Create Offer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
          <input 
            type="text" 
            placeholder="Search offer by candidate name or job role..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide shrink-0">
          <div className="flex gap-1.5">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                className={cn(
                  "px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none inline-flex items-center gap-1.5",
                  filterStatus === tab.key 
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs" 
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-extrabold",
                  filterStatus === tab.key
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setFilterStatus('All'); }}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer shrink-0"
              title="Reset filters"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Offer Table Card ── */}
      <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[320px]">
        {filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {hasActiveFilters ? 'No offers match your search' : 'No offers drafted yet'}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {hasActiveFilters ? 'Try adjusting your search criteria or resetting filters' : 'Create an offer from the pipeline or generate one using AI.'}
            </p>
            {!hasActiveFilters && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
              >
                <Plus size={16} />
                <span>Create First Offer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="hcm-table w-full text-left min-w-[820px]">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th text-left">Candidate</th>
                  <th className="hcm-th text-left">Role</th>
                  <th className="hcm-th text-left">Salary</th>
                  <th className="hcm-th text-left">Joining Date</th>
                  <th className="hcm-th text-left">Status</th>
                  <th className="hcm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Candidate */}
                    <td className="hcm-td">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleOpenEdit(offer)}>
                        <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {getInitials(offer.candidate)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors leading-none truncate max-w-[180px]">
                            {offer.candidate}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">
                            {offer.status === 'Draft' ? 'Drafted' : 'Sent'}: {offer.sentDate || offer.date || 'Recently'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="hcm-td text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {offer.role || 'Job Candidate'}
                    </td>

                    {/* Salary */}
                    <td className="hcm-td">
                      <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-extrabold text-xs">
                        <span>{displaySalary(offer.salary)}</span>
                      </div>
                    </td>

                    {/* Joining Date */}
                    <td className="hcm-td text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{offer.joiningDate || 'TBD'}</span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="hcm-td">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = offer.status === 'Draft' ? 'Sent' : offer.status === 'Sent' ? 'Accepted' : offer.status === 'Accepted' ? 'Declined' : 'Draft';
                          updateOffer(offer.id, { status: nextStatus, applicationId: offer.applicationId });
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border inline-block whitespace-nowrap cursor-pointer hover:opacity-85 active:scale-95",
                          offer.status === 'Accepted'
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
                            : offer.status === 'Sent'
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40"
                            : offer.status === 'Declined'
                            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        )}
                        title="Click to cycle Draft -> Sent -> Accepted -> Declined"
                      >
                        {offer.status || 'Sent'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="hcm-td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {offer.status !== 'Accepted' && (
                          <button
                            type="button"
                            onClick={() => updateOffer(offer.id, { status: 'Accepted', applicationId: offer.applicationId })}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                            title="Accept Offer & Advance Candidate"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleGenerateAiLetter(offer)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-purple-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="Generate / View AI Offer Letter"
                        >
                          <Sparkles size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(offer)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="Preview Document"
                        >
                          <FileSearch size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateOffer(offer.id, { status: 'Sent', sentDate: formatDate(new Date()) })}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="Resend Formal Offer"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="Delete Offer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Offer Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col text-left"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingOffer ? 'Edit Candidate Offer' : 'Create Candidate Offer'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Candidate Selection */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                      Candidate <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.candidate}
                      onChange={(e) => {
                        const sel = e.target.value;
                        const cand = (candidates || []).find((c) => c.name === sel);
                        setFormData({
                          ...formData,
                          candidate: sel,
                          role: cand?.role || formData.role || ''
                        });
                      }}
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    >
                      <option value="">Select Candidate from Pipeline</option>
                      {(candidates || []).map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} — {c.role} ({c.stage || 'Applied'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Proposed Salary */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Proposed Salary (Annual)</label>
                    <div className="relative">
                      {CurrencyIcon ? (
                        <CurrencyIcon className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      ) : (
                        <DollarSign className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      )}
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder={`e.g. ${currentCurrencySymbol}140,000`}
                        className="w-full pl-10 pr-3.5 h-10 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Joining Date</label>
                    <DatePicker
                      className="w-full h-10"
                      value={formData.joiningDate}
                      onChange={(val) => setFormData({ ...formData, joiningDate: typeof val === 'string' ? val : val?.target?.value || '' })}
                    />
                  </div>

                  {/* Offer Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Offer Status</label>
                    <select
                      value={formData.status || 'Sent'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted (Hire Candidate)</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">Attach Letter / Contract</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-10 px-3 flex items-center justify-center gap-2 cursor-pointer hover:border-primary-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500"
                    >
                      <FileText size={15} className="text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{selectedFile ? selectedFile.name : 'Select PDF / Doc Letter'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer"
                  >
                    <Send size={16} />
                    <span>{editingOffer ? 'Update Offer' : 'Send Offer'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Document Preview Modal ── */}
      <AnimatePresence>
        {previewingOffer && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewingOffer(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col text-left">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Offer_Letter_{previewingOffer.candidate.replace(/\s+/g, '_')}.pdf</h2>
                    <p className="text-[10px] text-slate-400">Formal Employment Document • {previewingOffer.sentDate || 'Preview'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadOffer}
                    className="h-9 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer select-none"
                    title="Download PDF"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewingOffer(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer select-none"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-y-auto p-4 sm:p-8 flex justify-center">
                <OfferLetterDocument data={previewingOffer} mode="preview" />
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewingOffer(null)}
                  className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintOfferDocument}
                  className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <Printer size={16} />
                  <span>Print Document</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AI Generated Letter Preview Modal ── */}
      <AnimatePresence>
        {showLetterPreview && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLetterPreview(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col text-left">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Generated Offer Letter</h2>
                    <p className="text-[10px] text-slate-400">Review, customize, and attach directly to the offer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLetter);
                      showToast('Offer letter text copied to clipboard!', 'success');
                    }}
                    className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadOffer}
                    className="h-9 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all select-none cursor-pointer shadow-xs"
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLetterPreview(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-y-auto p-4 sm:p-8 flex justify-center">
                <OfferLetterDocument data={letterData} mode="preview" />
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLetterPreview(false)}
                  className="h-11 px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xs select-none cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const candName = activeOfferForLetter?.candidate || 'candidate';
                    const fileName = `${candName.replace(/\s+/g, '_')}_AI_Offer_Letter.txt`;
                    const mockFile = new File([generatedLetter], fileName, { type: 'text/plain' });
                    setSelectedFile(mockFile);

                    setFormData({
                      candidate: activeOfferForLetter.candidate,
                      role: activeOfferForLetter.role,
                      salary: activeOfferForLetter.salary,
                      joiningDate: activeOfferForLetter.joiningDate || '',
                      status: activeOfferForLetter.status || 'Sent'
                    });

                    setShowLetterPreview(false);
                    setIsModalOpen(true);
                    showToast('AI Offer Letter attached to offer form!', 'success');
                  }}
                  className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer"
                >
                  <Check size={16} />
                  <span>Attach & Use Offer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Candidate Offer"
        message={`Are you sure you want to delete the offer for ${offerToDelete?.candidate}? This action will permanently remove the record.`}
      />
    </div>
  );
};

export default OfferManagement;

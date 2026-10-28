import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Heart, 
  Sun, 
  Stethoscope, 
  Briefcase, 
  X, 
  Download, 
  Upload, 
  Loader2,
  Paperclip,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useEmployee } from '../../hooks/useEmployee';
import CenterModal from '../../shared/components/layout/CenterModal';
import Button from '../../shared/components/ui/Button';
import PageHeader from '../../shared/components/ui/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { uploadAPI } from '../../utils/apiService';
import { validateFile } from '../../utils/fileValidator';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import DatePicker from '../../shared/components/common/DatePicker';
import PermissionGate from '../../shared/components/common/PermissionGate';
import { employeeService } from '../../services/employee.service';

const EmployeeLeave = () => {
  const { leaves, profile, requestLeave, cancelLeave, showToast, loading, error, refetchAll, refetch } = useEmployee();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [requestForm, setRequestForm] = useState({
    type: 'Casual Leave',
    emergency: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveAttachment, setLeaveAttachment] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const leaveFileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancellingId, setIsCancellingId] = useState(null);

  // Dynamic fetch leaves when search or filter changes
  useEffect(() => {
    const params = {};
    if (filterStatus && filterStatus !== 'ALL') {
      params.status = filterStatus;
    }
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    refetch.fetchLeaves?.(params);
  }, [filterStatus, searchTerm, refetch]);

  // Dynamic Leave Balances
  const balanceCards = useMemo(() => {
    const b = leaves?.balance || {};
    const sick = b.sick ?? 12;
    const sickTotal = b.sickTotal ?? 12;
    const annual = b.annual ?? 18;
    const annualTotal = b.annualTotal ?? 18;
    const casual = b.casual ?? 6;
    const casualTotal = b.casualTotal ?? 6;
    const totalUsed = b.totalUsed ?? 0;
    const totalAllowed = b.totalAllowance ?? (sickTotal + annualTotal + casualTotal);

    return [
      {
        label: 'CASUAL LEAVE',
        value: `${casual} Available`,
        sub: `${casualTotal} Total Days`,
        icon: Sun,
        iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
        barColor: 'bg-amber-500'
      },
      {
        label: 'ANNUAL LEAVE',
        value: `${annual} Available`,
        sub: `${annualTotal} Total Days`,
        icon: Briefcase,
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
        barColor: 'bg-indigo-600'
      },
      {
        label: 'SICK LEAVE',
        value: `${sick} Available`,
        sub: `${sickTotal} Total Days`,
        icon: Stethoscope,
        iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
        barColor: 'bg-rose-500'
      },
      {
        label: 'TOTAL USED',
        value: `${totalUsed} Days Used`,
        sub: `${totalAllowed} Total Allowed`,
        icon: CheckCircle2,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
        barColor: 'bg-slate-200 dark:bg-slate-700'
      }
    ];
  }, [leaves?.balance]);

  // Client-side fallback filter for instant response
  const filteredHistory = useMemo(() => {
    return (leaves?.requests || []).filter(item => {
      if (!item) return false;
      const matchesSearch = !searchTerm || 
        (item.type || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusUpper = (item.status || '').toUpperCase();
      const matchesFilter = filterStatus === 'ALL' ? true :
                            filterStatus === 'APPROVED' ? (statusUpper === 'APPROVED') :
                            filterStatus === 'PENDING' ? (statusUpper === 'PENDING' || statusUpper === 'MANAGER_APPROVED') :
                            filterStatus === 'REJECTED' ? (statusUpper === 'REJECTED') :
                            filterStatus === 'CANCELLED' ? (statusUpper === 'CANCELLED') :
                            true;
      return matchesSearch && matchesFilter;
    });
  }, [leaves?.requests, searchTerm, filterStatus]);

  const handleExport = () => {
    if (filteredHistory.length === 0) {
      showToast('No leave records to export', 'error');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Type,Start Date,End Date,Days,Status,Reason\n";
    filteredHistory.forEach(item => {
      csvContent += `"${item.type}","${item.startDate}","${item.endDate}","${item.days}","${item.status}","${(item.reason || '').replace(/"/g, '""')}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leave_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leave report exported successfully');
  };

  const handleProcessFile = async (file) => {
    if (!file) return;
    const v = validateFile(file, ['pdf','doc','docx','png','jpg','jpeg'], 10);
    if (!v.isValid) {
      showToast(v.message, 'error');
      if (leaveFileInputRef.current) leaveFileInputRef.current.value = '';
      return;
    }
    const kb = file.size / 1024;
    const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;

    try {
      const res = await uploadAPI.uploadDocument(file, 'hcm/leaves');
      const cloudUrl = res.data?.data?.url;
      if (cloudUrl) {
        setLeaveAttachment({
          name: file.name,
          size: sizeStr,
          url: cloudUrl
        });
        showToast('Leave document attached');
        return;
      }
    } catch (uploadErr) {
      console.warn('Direct upload failed, using fallback reader:', uploadErr.message);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLeaveAttachment({
        name: file.name,
        size: sizeStr,
        url: reader.result
      });
      showToast('Leave document attached');
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLeaveAttachment = (e) => {
    e.stopPropagation();
    setLeaveAttachment(null);
    if (leaveFileInputRef.current) {
      leaveFileInputRef.current.value = '';
    }
  };

  const handleOpenRequestModal = () => {
    const defaultType = leaves?.policies?.[0]?.name || 'Casual Leave';
    const defaultEmergency = profile?.emergencyPhone || profile?.emergencyContact?.phone || profile?.phone || '';
    setRequestForm({
      type: defaultType,
      emergency: defaultEmergency,
      startDate: '',
      endDate: '',
      reason: ''
    });
    setLeaveAttachment(null);
    if (leaveFileInputRef.current) {
      leaveFileInputRef.current.value = '';
    }
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { type, emergency, startDate: startDateVal, endDate: endDateVal, reason } = requestForm;

    if (!startDateVal || !endDateVal) {
      showToast('Please select both start and end dates', 'error');
      return;
    }

    const startDate = new Date(startDateVal);
    const endDate = new Date(endDateVal);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    if (days <= 0) {
      showToast('End date must be on or after start date', 'error');
      return;
    }

    if (!reason || !reason.trim()) {
      showToast('Please provide a reason for the request', 'error');
      return;
    }

    const policyDetail = leaves?.balance?.details?.find(d => d.name === type);
    let remaining = policyDetail?.remaining;
    if (remaining === undefined) {
      if (type === 'Casual Leave') remaining = leaves?.balance?.casual ?? 6;
      else if (type === 'Annual Leave') remaining = leaves?.balance?.annual ?? 18;
      else if (type === 'Sick Leave') remaining = leaves?.balance?.sick ?? 12;
    }

    if (remaining !== undefined && type !== 'Unpaid Leave' && remaining < days) {
      showToast(`Insufficient balance for ${type}. You have ${remaining} days remaining.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestLeave({
        leaveType: type || 'Casual Leave',
        startDate: startDateVal,
        endDate: endDateVal,
        reason: reason.trim(),
        emergencyContact: (emergency || '').trim(),
        totalDays: days,
        attachment: leaveAttachment
      });
      
      setLeaveAttachment(null);
      if (leaveFileInputRef.current) {
        leaveFileInputRef.current.value = '';
      }
      setIsRequestModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to submit leave request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (isCancellingId) return;
    setIsCancellingId(id);
    try {
      await cancelLeave(id);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to cancel leave', 'error');
    } finally {
      setIsCancellingId(null);
    }
  };

  if (error) {
    return (
      <div className="px-4 sm:px-0 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 text-left">
        <AlertCircle className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Failed to Load Time Off Info</h3>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <Button onClick={refetchAll} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  if (loading || !leaves) {
    return (
      <div className="space-y-8 pb-12 animate-fade-in px-4 sm:px-0 text-left">
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-indigo-100 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading Time Off details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in relative px-4 sm:px-0 text-left">
      {/* Header Section */}
      <PageHeader
        title="Time Off Management"
        subtitle="Manage your leave balance, history, and requests"
      >
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport}
            variant="secondary"
            leftIcon={Download}
          >
            Report
          </Button>
          <PermissionGate module="leave" action="create">
            <Button 
               onClick={handleOpenRequestModal}
               variant="primary"
               leftIcon={Plus}
            >
              Request Time Off
            </Button>
          </PermissionGate>
        </div>
      </PageHeader>

      {/* Leave Balances Cards (Dynamic Casual, Annual, Sick, Total Used) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {balanceCards.map((card, idx) => (
          <div 
            key={idx} 
            className="card p-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", card.iconBg)}>
                  <card.icon size={22} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  {card.label}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {card.value}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  {card.sub}
                </p>
              </div>
            </div>
            {/* Color Accent Bar */}
            <div className="mt-5 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={cn("h-full rounded-full w-full", card.barColor)} />
            </div>
          </div>
        ))}
      </div>

      {/* History Area */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight italic dark:text-white">
              My Leave History
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
               {/* Search Input */}
               <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
               </div>

               {/* Status Filter Tabs */}
               <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'CANCELLED'].map(status => (
                    <Button 
                      key={status} 
                      onClick={() => setFilterStatus(status)} 
                      variant={filterStatus === status ? "primary" : "ghost"}
                      size="sm"
                    >
                      {status}
                    </Button>
                  ))}
               </div>
            </div>
         </div>

         {/* Desktop View: History Table */}
         <div className="hidden md:block hcm-table-container">
            <table className="hcm-table">
               <thead className="hcm-thead">
                  <tr className="hcm-tr">
                     <th className="hcm-th px-8">Leave Type</th>
                     <th className="hcm-th px-8">Duration</th>
                     <th className="hcm-th px-8 text-center">Calculated Days</th>
                     <th className="hcm-th px-8 text-center">Status</th>
                     <th className="hcm-th px-8 text-right">Reason / Logic</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredHistory.length > 0 ? filteredHistory.map((item, i) => {
                     const isApproved = item.status === 'Approved' || item.status === 'APPROVED';
                     const isPending = item.status === 'Pending' || item.status === 'PENDING' || item.status === 'MANAGER_APPROVED';
                     const isRejected = item.status === 'Rejected' || item.status === 'REJECTED';
                     const isCancelled = item.status === 'Cancelled' || item.status === 'CANCELLED';

                     return (
                        <tr key={i}>
                           <td className="hcm-td px-8 py-7">
                              <p className="font-black text-slate-900 dark:text-white text-sm uppercase">
                                {item.type.replace(/\s+/g, '_')}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-bold mt-1">
                                UID: #LV-{item.id.toString().slice(-4)}
                              </p>
                           </td>
                           <td className="hcm-td px-8 py-7">
                              <div className="flex items-center gap-3">
                                 <Calendar size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                 <p className="font-bold text-slate-700 dark:text-slate-300 text-xs tabular-nums leading-none">
                                   {item.startDate} <span className="text-slate-300 dark:text-slate-600 mx-2">—</span> {item.endDate}
                                 </p>
                              </div>
                           </td>
                           <td className="hcm-td px-8 py-7 text-center">
                              <span className="font-black text-slate-900 dark:text-white text-base tabular-nums">
                                {item.days}
                              </span>
                           </td>
                           <td className="hcm-td px-8 py-7 text-center">
                              <span className={cn(
                                 "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                 isApproved 
                                   ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                                   : isPending 
                                   ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                   : isRejected
                                   ? "bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                                   : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                              )}>
                                 {item.status === 'MANAGER_APPROVED' ? 'PENDING HR' : item.status.toUpperCase()}
                              </span>
                           </td>
                           <td className="hcm-td px-8 py-7 text-right">
                              <div className="space-y-1 text-right">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">
                                    "{item.reason || 'No reason specified'}"
                                  </p>
                                  {item.attachmentUrl && (
                                    <div className="flex justify-end mt-1">
                                      <a 
                                        href={item.attachmentUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline"
                                      >
                                        <Paperclip size={12} />
                                        <span>{item.attachmentName || 'Attachment'}</span>
                                      </a>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end gap-3 pt-0.5">
                                     {isPending && (
                                       <PermissionGate module="leave" action="delete">
                                         <Button 
                                            variant="link"
                                            size="sm"
                                            onClick={() => handleCancelLeave(item.id)} 
                                            isDisabled={isCancellingId === item.id}
                                            className="text-rose-600 dark:text-rose-400 h-auto p-0 text-[10px]"
                                            leftIcon={isCancellingId === item.id ? Loader2 : Trash2}
                                         >
                                           <span>Cancel</span>
                                         </Button>
                                       </PermissionGate>
                                     )}
                                     <p className="text-[10px] font-black text-primary-600 dark:text-primary-400">
                                       {isCancelled ? 'Cancelled' : isApproved ? 'Approved' : isRejected ? 'Rejected' : (item.managerComment ? 'Reviewed' : 'Awaiting Review')}
                                     </p>
                                 </div>
                              </div>
                           </td>
                        </tr>
                     );
                  }) : (
                    <tr className="hcm-tr">
                      <td colSpan="5" className="py-20 hcm-td">
                        <EmptyState
                          icon={Calendar}
                          title="No leave records found"
                        />
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Mobile View: History Cards */}
         <div className="block md:hidden space-y-4">
            {filteredHistory.length > 0 ? filteredHistory.map((item, i) => {
               const isApproved = item.status === 'Approved' || item.status === 'APPROVED';
               const isPending = item.status === 'Pending' || item.status === 'PENDING' || item.status === 'MANAGER_APPROVED';
               const isRejected = item.status === 'Rejected' || item.status === 'REJECTED';
               const isCancelled = item.status === 'Cancelled' || item.status === 'CANCELLED';

               return (
                  <div key={i} className="card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 text-left">
                     <div className="flex items-center justify-between gap-3">
                        <div>
                           <p className="font-black text-slate-900 dark:text-white text-sm uppercase">
                              {item.type.replace(/\s+/g, '_')}
                           </p>
                           <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                              UID: #LV-{item.id.toString().slice(-4)}
                           </p>
                        </div>
                        <span className={cn(
                           "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                           isApproved 
                             ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                             : isPending 
                             ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                             : isRejected
                             ? "bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                             : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}>
                           {item.status === 'MANAGER_APPROVED' ? 'PENDING HR' : item.status.toUpperCase()}
                        </span>
                     </div>

                     <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                           <Calendar size={14} className="text-slate-400" />
                           <span>{item.startDate} — {item.endDate}</span>
                        </div>
                        <div className="text-right font-black text-slate-900 dark:text-white">
                           <span>{item.days} {item.days === 1 ? 'Day' : 'Days'}</span>
                        </div>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl space-y-2">
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                           "{item.reason || 'No reason provided'}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] pt-1">
                           {item.attachmentUrl && (
                             <a 
                               href={item.attachmentUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className="inline-flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400 hover:underline"
                             >
                               <Paperclip size={11} />
                               <span>{item.attachmentName || 'Attachment'}</span>
                             </a>
                           )}
                           <div className="ml-auto flex items-center gap-3">
                              {isPending && (
                                 <Button 
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleCancelLeave(item.id)} 
                                    isDisabled={isCancellingId === item.id}
                                    className="text-rose-600 dark:text-rose-400 h-auto p-0"
                                 >
                                    {isCancellingId === item.id ? 'Cancelling...' : 'Cancel Request'}
                                 </Button>
                              )}
                              <span className="font-bold text-primary-600 dark:text-primary-400">
                                 {isCancelled ? 'Cancelled' : isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Awaiting Review'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
               );
            }) : (
               <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <EmptyState
                    icon={Calendar}
                    title="No leave records found"
                  />
               </div>
            )}
         </div>
      </div>

      {/* Leave Request Modal */}
      <CenterModal 
        isOpen={isRequestModalOpen} 
        onClose={() => !isSubmitting && setIsRequestModalOpen(false)} 
        title="New Time Off Request"
        maxWidth="max-w-xl"
      >
         <form onSubmit={handleRequestSubmit} className="p-4 sm:p-8 pt-5 sm:pt-6 space-y-4 sm:space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-0.5">
                    Select Leave Type
                  </label>
                  <select 
                    name="type" 
                    value={requestForm.type}
                    onChange={e => setRequestForm(prev => ({ ...prev, type: e.target.value }))}
                    required 
                    className="select-field h-11 text-xs sm:text-sm font-medium w-full cursor-pointer"
                  >
                     {leaves?.policies && leaves.policies.length > 0 ? (
                       leaves.policies.map((policy, idx) => {
                         const detail = leaves?.balance?.details?.find(d => d.name === policy.name);
                         let balanceText = '';
                         if (detail && detail.isPaid && detail.allowance > 0) {
                           balanceText = ` (Available: ${detail.remaining} / ${detail.allowance} days)`;
                         } else if (policy.name === 'Casual Leave') {
                           balanceText = ` (Available: ${leaves?.balance?.casual ?? 6} / ${leaves?.balance?.casualTotal ?? 6} days)`;
                         } else if (policy.name === 'Annual Leave') {
                           balanceText = ` (Available: ${leaves?.balance?.annual ?? 18} / ${leaves?.balance?.annualTotal ?? 18} days)`;
                         } else if (policy.name === 'Sick Leave') {
                           balanceText = ` (Available: ${leaves?.balance?.sick ?? 12} / ${leaves?.balance?.sickTotal ?? 12} days)`;
                         }
                         return <option key={idx} value={policy.name}>{policy.name}{balanceText}</option>;
                       })
                     ) : (
                       <>
                         <option value="Casual Leave">Casual Leave (Available: {leaves?.balance?.casual ?? 6} / {leaves?.balance?.casualTotal ?? 6} days)</option>
                         <option value="Annual Leave">Annual Leave (Available: {leaves?.balance?.annual ?? 18} / {leaves?.balance?.annualTotal ?? 18} days)</option>
                         <option value="Sick Leave">Sick Leave (Available: {leaves?.balance?.sick ?? 12} / {leaves?.balance?.sickTotal ?? 12} days)</option>
                         <option value="Unpaid Leave">Unpaid Leave</option>
                       </>
                     )}
                  </select>
               </div>

               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-0.5">
                    Emergency Contact
                  </label>
                  <PhoneInput 
                    name="emergency" 
                    value={requestForm.emergency}
                    onChange={e => setRequestForm(prev => ({ ...prev, emergency: e.target.value }))}
                    placeholder="e.g. 9999999999"
                    className="text-xs sm:text-sm font-medium h-11"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-0.5">
                    Start Date
                  </label>
                  <DatePicker 
                    name="startDate" 
                    value={requestForm.startDate}
                    onChange={e => {
                      const val = e?.target?.value !== undefined ? e.target.value : e;
                      setRequestForm(prev => ({ 
                        ...prev, 
                        startDate: val,
                        endDate: prev.endDate && prev.endDate < val ? val : prev.endDate
                      }));
                    }}
                    required 
                    placeholder="dd/mm/yyyy"
                    className="input-field h-11 text-xs sm:text-sm font-medium w-full cursor-pointer"
                  />
               </div>

               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-0.5">
                    End Date
                  </label>
                  <DatePicker 
                    name="endDate" 
                    value={requestForm.endDate}
                    min={requestForm.startDate || undefined}
                    onChange={e => {
                      const val = e?.target?.value !== undefined ? e.target.value : e;
                      setRequestForm(prev => ({ ...prev, endDate: val }));
                    }}
                    required 
                    placeholder="dd/mm/yyyy"
                    className="input-field h-11 text-xs sm:text-sm font-medium w-full cursor-pointer"
                  />
               </div>
            </div>

            <div className="space-y-1.5 text-left">
               <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-0.5">
                 Reason for Request
               </label>
               <textarea 
                 name="reason" 
                 rows="3" 
                 value={requestForm.reason}
                 onChange={e => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                 required 
                 className="textarea-field text-xs sm:text-sm font-medium w-full resize-none min-h-[90px]" 
                 placeholder="Provide context for your manager..."
               />
            </div>

            <div className="space-y-1.5 text-left">
               <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-0.5">
                 Document Attachment (Optional)
               </label>
               <input 
                 type="file" 
                 ref={leaveFileInputRef} 
                 onChange={handleLeaveFileChange}
                 accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                 className="hidden"
               />
               <div 
                 onClick={() => leaveFileInputRef.current?.click()}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
                 className={cn(
                   "p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center",
                   isDragging 
                     ? "border-primary-500 bg-primary-50/20 dark:bg-primary-950/20" 
                     : "border-slate-200 dark:border-slate-700 hover:border-primary-500 bg-slate-50/50 dark:bg-slate-800/40"
                 )}
               >
                  {leaveAttachment ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={18} className="text-primary-600 shrink-0"/>
                        <span className="truncate text-slate-800 dark:text-white text-xs font-bold">{leaveAttachment.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">({leaveAttachment.size})</span>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLeaveAttachment}
                        title="Remove File"
                        className="p-1 h-auto text-rose-500 hover:text-rose-600"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full gap-2 text-slate-400 text-xs font-bold">
                       <Upload size={16} />
                       <span>Upload Attachment Document</span>
                    </div>
                  )}
               </div>
            </div>
            
            <div className="pt-2 flex items-center justify-end gap-3">
                <Button 
                  type="button"
                  variant="secondary"
                  size="md"
                  isDisabled={isSubmitting} 
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  size="md"
                  isDisabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  Submit Request
                </Button>
             </div>
         </form>
      </CenterModal>
    </div>
  );
};

export default EmployeeLeave;

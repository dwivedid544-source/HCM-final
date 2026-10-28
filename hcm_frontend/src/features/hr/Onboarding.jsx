import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Mail, Calendar, CheckCircle2,
  Clock, MoreVertical, Download, X, Briefcase,
  Monitor, FileText, ChevronRight, Users,
  ArrowUpRight, Send, Trash2, RotateCcw, Check,
  UserCheck, ShieldCheck, Sparkles, AlertCircle,
  Laptop, KeyRound, Building2, User, Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDateFormat } from '../../hooks/useDateFormat';
import { useHR } from '../../context/HRContext';
import { authAPI, adminAPI } from '../../utils/apiService';
import PermissionGate from '../../shared/components/common/PermissionGate';
import DatePicker from '../../shared/components/common/DatePicker';
import StatCard from '../../shared/components/ui/StatCard';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import PageHeader from '../../shared/components/ui/PageHeader';

const getInitials = (name) => {
  if (!name) return 'NH';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const Onboarding = () => {
  const { formatDate } = useDateFormat();
  const {
    onboarding = [],
    addOnboarding,
    updateOnboarding,
    deleteOnboarding,
    showToast,
    candidates = [],
    remindManager,
    sendWelcomeEmail,
    employees = [],
    promoteCandidate,
    refetch
  } = useHR();

  const [selectedHire, setSelectedHire] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  const [onboardingToDelete, setOnboardingToDelete] = useState(null);

  const [showPromoteForm, setShowPromoteForm] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteData, setPromoteData] = useState({
    employeeId: '',
    departmentId: '',
    managerId: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    candidateId: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    manager: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  // Fetch departments for dropdowns
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await adminAPI.getDepartments();
        if (res.data?.data) setDepartments(res.data.data);
        else if (res.data && Array.isArray(res.data)) setDepartments(res.data);
      } catch (e) {
        setDepartments([]);
      }
    };
    fetchDepts();
  }, []);

  // Synchronize promote form when hire is selected
  useEffect(() => {
    if (selectedHire) {
      const stableId = `EMP-${(selectedHire.id || Math.random().toString(36).substring(2, 8)).slice(0, 8).toUpperCase()}`;
      const matchedDept = departments.find(d => d.name === selectedHire.department);
      const matchedMgr = employees.find(e => e.fullName === selectedHire.manager || e.name === selectedHire.manager);

      setPromoteData({
        employeeId: stableId,
        departmentId: matchedDept ? matchedDept.id : '',
        managerId: matchedMgr ? matchedMgr.id : '',
        joiningDate: selectedHire.joiningDate || new Date().toISOString().split('T')[0]
      });
      setShowPromoteForm(false);
    }
  }, [selectedHire, departments, employees]);

  // Hired candidates eligible for onboarding
  const eligibleCandidates = useMemo(() => {
    return candidates.filter(c =>
      ['Offer', 'Offered', 'Hired', 'Selected', 'Offer Accepted', 'Ready for Onboarding'].includes(c.stage)
    );
  }, [candidates]);

  // Candidates who accepted offer or are hired but not yet in the onboarding table
  const candidatesReadyToStart = useMemo(() => {
    const existingEmails = new Set(onboarding.map(o => (o.email || '').toLowerCase()).filter(Boolean));
    const existingNames = new Set(onboarding.map(o => (o.name || '').toLowerCase()).filter(Boolean));
    return eligibleCandidates.filter(c => {
      const email = (c.email || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      return (!email || !existingEmails.has(email)) && (!name || !existingNames.has(name));
    });
  }, [eligibleCandidates, onboarding]);

  const handleCandidateChange = (e) => {
    const selectedId = e.target.value;
    const cand = eligibleCandidates.find(c => c.id === selectedId);
    if (cand) {
      setFormData(prev => ({
        ...prev,
        candidateId: cand.id,
        name: cand.name || '',
        email: cand.email || '',
        phone: cand.phone || '',
        role: cand.role || '',
        department: cand.department || prev.department || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        candidateId: '',
        name: '',
        email: '',
        phone: '',
        role: '',
      }));
    }
  };

  const handleOpenCreateForCandidate = (cand) => {
    setFormData({
      candidateId: cand.id,
      name: cand.name || '',
      email: cand.email || '',
      phone: cand.phone || '',
      role: cand.role || '',
      department: cand.department || '',
      manager: '',
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setFormData({
      candidateId: '',
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      manager: '',
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.role?.trim()) {
      showToast('Please provide both Employee Name and Role', 'error');
      return;
    }

    try {
      await addOnboarding({
        ...formData,
        progress: 33,
        status: 'Awaiting Documents'
      });
      setIsModalOpen(false);
      if (refetch?.fetchOnboarding) await refetch.fetchOnboarding();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    showToast('Refreshing onboarding data...', 'info');
    if (refetch?.fetchOnboarding) await refetch.fetchOnboarding();
    if (refetch?.fetchEmployees) await refetch.fetchEmployees();
    if (refetch?.fetchApplications) await refetch.fetchApplications();
    showToast('Onboarding tasks refreshed', 'success');
  };

  const handleSendWelcomeEmail = async () => {
    if (onboarding.length === 0) {
      showToast('No active onboarding candidates to email', 'warning');
      return;
    }
    setIsSendingWelcome(true);
    try {
      await sendWelcomeEmail(onboarding.map(o => o.id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingWelcome(false);
    }
  };

  const handleSendIndividualWelcome = async (hire) => {
    try {
      await sendWelcomeEmail([hire.id]);
      showToast(`Welcome email dispatched to ${hire.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (onboardingToDelete) {
      await deleteOnboarding(onboardingToDelete.id);
      if (selectedHire && selectedHire.id === onboardingToDelete.id) {
        setSelectedHire(null);
      }
      setOnboardingToDelete(null);
    }
  };

  const steps = [
    { id: 1, label: 'Offer Accepted & Terms Confirmed' },
    { id: 2, label: 'Identity & Educational Documents Submitted' },
    { id: 3, label: 'Workstation & IT Credentials Provisioned' }
  ];

  const toggleStep = async (hire, stepIdx) => {
    const progressMap = [33, 67, 100];
    const isDone = progressMap[stepIdx] <= (hire.progress || 0);

    let newProgress;
    if (isDone) {
      newProgress = stepIdx === 0 ? 0 : progressMap[stepIdx - 1];
    } else {
      newProgress = progressMap[stepIdx];
    }

    let newStatus = hire.status;
    if (newProgress >= 100) newStatus = 'Ready';
    else if (newProgress === 0) newStatus = 'Not Started';
    else if (newProgress <= 33) newStatus = 'Awaiting Documents';
    else newStatus = 'In Progress';

    const updated = { ...hire, progress: newProgress, status: newStatus };
    await updateOnboarding(hire.id, { progress: newProgress, status: newStatus });
    if (selectedHire && selectedHire.id === hire.id) {
      setSelectedHire(updated);
    }
  };

  const handleConfirmPromote = async () => {
    if (!promoteData.employeeId) {
      showToast('Employee ID is required', 'error');
      return;
    }

    setIsPromoting(true);
    let emailToUse = selectedHire?.email;

    try {
      if (!emailToUse) {
        emailToUse = `${(selectedHire?.name || 'employee').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${promoteData.employeeId}@company.com`;
        await updateOnboarding(selectedHire.id, { email: emailToUse });
      }

      let updatePayload = { status: 'Completed', joiningDate: promoteData.joiningDate };
      if (promoteData.managerId) {
        const selectedManager = employees.find(e => e.id === promoteData.managerId);
        if (selectedManager) updatePayload.manager = selectedManager.fullName || selectedManager.name;
      }
      if (promoteData.departmentId) {
        const selectedDept = departments.find(d => d.name === promoteData.departmentId || d.id === promoteData.departmentId);
        if (selectedDept) updatePayload.department = selectedDept.name;
      }
      await updateOnboarding(selectedHire.id, updatePayload);

      await authAPI.register({
        name: selectedHire.name || 'Employee',
        email: emailToUse,
        password: 'password123',
        role: 'EMPLOYEE'
      }).catch(() => {});

      const res = await promoteCandidate(selectedHire.id, promoteData);
      if (res?.success || res?.message?.includes('promoted') || res?.message?.includes('in use')) {
        setShowPromoteForm(false);
        setPromoteData({ employeeId: '', departmentId: '', managerId: '', joiningDate: new Date().toISOString().split('T')[0] });
        setSelectedHire(null);
        if (refetch?.fetchOnboarding) await refetch.fetchOnboarding();
        if (refetch?.fetchEmployees) await refetch.fetchEmployees();
      }
    } catch (err) {
      console.error('Promotion error:', err);
    } finally {
      setIsPromoting(false);
    }
  };

  // Dynamic KPI Stats
  const countTotal = onboarding.length;
  const countPendingDocs = onboarding.filter(o => o.status === 'Awaiting Documents' || (o.progress > 0 && o.progress <= 33)).length;
  const countInProgress = onboarding.filter(o => o.status === 'In Progress' || (o.progress > 33 && o.progress < 100)).length;
  const countReady = onboarding.filter(o => o.status === 'Ready' || o.status === 'Completed' || o.progress >= 100).length;

  const stats = [
    {
      label: 'New Joiners',
      value: countTotal,
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      onClick: () => setFilterStatus('All'),
      sub: `${countReady} ready for start`
    },
    {
      label: 'Pending Docs',
      value: countPendingDocs,
      icon: FileText,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      onClick: () => setFilterStatus('Pending Docs'),
      sub: 'Awaiting submission'
    },
    {
      label: 'In Progress',
      value: countInProgress,
      icon: Clock,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      onClick: () => setFilterStatus('In Progress'),
      sub: 'IT setup & credentials'
    },
    {
      label: 'Ready to Start',
      value: countReady,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      onClick: () => setFilterStatus('Ready'),
      sub: 'Ready for promotion'
    },
  ];

  const statusTabs = [
    { key: 'All', label: 'All Hires', count: countTotal },
    { key: 'Pending Docs', label: 'Pending Docs', count: countPendingDocs },
    { key: 'In Progress', label: 'In Progress', count: countInProgress },
    { key: 'Ready', label: 'Ready to Start', count: countReady },
    { key: 'Completed', label: 'Completed', count: onboarding.filter(o => o.status === 'Completed').length }
  ];

  // Filtering
  const filteredOnboards = useMemo(() => {
    return onboarding.filter(o => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.role && o.role.toLowerCase().includes(q)) ||
        (o.department && o.department.toLowerCase().includes(q)) ||
        (o.email && o.email.toLowerCase().includes(q));

      let matchStatus = true;
      if (filterStatus === 'Pending Docs') {
        matchStatus = o.status === 'Awaiting Documents' || (o.progress > 0 && o.progress <= 33);
      } else if (filterStatus === 'In Progress') {
        matchStatus = o.status === 'In Progress' || (o.progress > 33 && o.progress < 100);
      } else if (filterStatus === 'Ready') {
        matchStatus = o.status === 'Ready' || o.progress >= 100;
      } else if (filterStatus === 'Completed') {
        matchStatus = o.status === 'Completed';
      }

      return matchSearch && matchStatus;
    });
  }, [onboarding, searchTerm, filterStatus]);

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'All';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in text-left">
      {/* ── Page Header ── */}
      <PageHeader
        title="Onboarding"
        description="Coordinate the transition and preparation for your new hires"
        actions={
          <>
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-secondary cursor-pointer"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <PermissionGate module="onboarding" action="manage">
              {/* Standardized Secondary Send Welcome Email Button */}
              <button
                type="button"
                onClick={handleSendWelcomeEmail}
                disabled={isSendingWelcome || onboarding.length === 0}
                className="h-11 px-4 sm:px-5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs select-none cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSendingWelcome ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Send Welcome Email</span>
              </button>

              {/* Standardized Primary Start Onboarding Button */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="h-11 px-4 sm:px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 select-none cursor-pointer shrink-0"
              >
                <Plus size={16} />
                <span>Start Onboarding</span>
              </button>
            </PermissionGate>
          </>
        }
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            color={stat.iconColor}
            bg={stat.bg}
            onClick={stat.onClick}
          />
        ))}
      </div>

      {/* ── Ready for Onboarding Banner (if hired candidates await workflow) ── */}
      {candidatesReadyToStart.length > 0 && (
        <div className="card p-5 sm:p-6 bg-gradient-to-r from-primary-50/70 via-blue-50/50 to-indigo-50/50 dark:from-primary-950/30 dark:via-blue-950/20 dark:to-indigo-950/20 border border-primary-100 dark:border-primary-900/40 shadow-xs rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Hired Candidates Ready for Onboarding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These candidates accepted their offers and are ready to be enrolled in the onboarding workflow.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 rounded-full text-xs font-black self-start sm:self-center shrink-0">
              {candidatesReadyToStart.length} Pending Onboarding
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
            {candidatesReadyToStart.map((cand) => (
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

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                    {cand.stage}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[150px]">
                    {cand.email || 'Hired Candidate'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateForCandidate(cand)}
                    className="h-7 px-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer select-none shrink-0"
                  >
                    <Plus size={12} />
                    <span>Enroll Now</span>
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
            placeholder="Search new hire by name, role, department, or email..."
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

      {/* ── Main Onboarding Table Card ── */}
      <div className="card p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[340px]">
        {filteredOnboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400 dark:text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <Briefcase size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {hasActiveFilters ? 'No onboarding tasks match your search' : 'No onboarding tasks found'}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {hasActiveFilters ? 'Try adjusting your search criteria or resetting filters' : 'Clear filters or start a new onboarding workflow for hired candidates.'}
            </p>
            {!hasActiveFilters && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer"
              >
                <Plus size={16} />
                <span>Start First Onboarding</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="hcm-table w-full text-left min-w-[850px]">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th text-left">New Employee</th>
                  <th className="hcm-th text-left">Position & Dept</th>
                  <th className="hcm-th text-left">Manager</th>
                  <th className="hcm-th text-left">Joining Date</th>
                  <th className="hcm-th text-left">Onboarding Progress</th>
                  <th className="hcm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOnboards.map((hire) => (
                  <tr
                    key={hire.id}
                    className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* New Employee */}
                    <td className="hcm-td">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setSelectedHire(hire)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {getInitials(hire.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-none truncate max-w-[180px]">
                            {hire.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[180px]">
                            {hire.email || 'No email registered'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Position & Dept */}
                    <td className="hcm-td">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {hire.role}
                        </p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[170px]">
                          {hire.department || 'General'}
                        </span>
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="hcm-td text-xs">
                      {hire.manager ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <User size={13} className="text-slate-400" />
                          <span>{hire.manager}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not Assigned</span>
                      )}
                    </td>

                    {/* Joining Date */}
                    <td className="hcm-td text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{hire.joiningDate ? formatDate(hire.joiningDate) : (hire.start ? formatDate(hire.start) : 'TBD')}</span>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="hcm-td">
                      <div className="flex flex-col gap-1.5 min-w-[150px] max-w-[190px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn(
                            "text-[10px] font-extrabold uppercase tracking-wider",
                            hire.progress >= 100 || hire.status === 'Completed' || hire.status === 'Ready'
                              ? "text-emerald-600 dark:text-emerald-400"
                              : hire.progress > 33
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-amber-600 dark:text-amber-400"
                          )}>
                            {hire.status}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {hire.progress || 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(hire.progress || 0, 100)}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              hire.progress >= 100 || hire.status === 'Completed' || hire.status === 'Ready'
                                ? "bg-emerald-500"
                                : hire.progress > 33
                                ? "bg-purple-600"
                                : "bg-amber-500"
                            )}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="hcm-td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Send individual welcome email */}
                        <button
                          type="button"
                          onClick={() => handleSendIndividualWelcome(hire)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="Send Welcome Email"
                        >
                          <Send size={15} />
                        </button>

                        {/* Remind Manager */}
                        <button
                          type="button"
                          onClick={() => remindManager(hire.id)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="Remind Manager"
                        >
                          <Mail size={15} />
                        </button>

                        {/* View Checklist & Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedHire(hire)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                          title="View Checklist & Details"
                        >
                          <ChevronRight size={18} />
                        </button>

                        {/* Delete Onboarding Task */}
                        <PermissionGate module="onboarding" action="delete">
                          <button
                            type="button"
                            onClick={() => setOnboardingToDelete(hire)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 size={15} />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Start New Onboarding Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto"
            >
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Start New Onboarding
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enroll a candidate into the employee preparation workflow
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-left">
                {/* Eligible Candidate Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select From Hired Candidates (Optional Auto-Fill)
                  </label>
                  <select
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    value={formData.candidateId}
                    onChange={handleCandidateChange}
                  >
                    <option value="">Select an eligible candidate...</option>
                    {eligibleCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.role} ({c.stage})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="sarah@example.com"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Role / Position <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department
                    </label>
                    <select
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Assigned Manager
                    </label>
                    <select
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    >
                      <option value="">Select Manager...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.fullName || emp.name}>
                          {emp.fullName || emp.name} ({emp.designation || emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Joining Date
                    </label>
                    <DatePicker
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={formData.joiningDate}
                      onChange={(val) => setFormData({ ...formData, joiningDate: typeof val === 'string' ? val : val?.target?.value || '' })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-primary-500/20 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Start Onboarding</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Candidate Checklist & Detail Modal ── */}
      <AnimatePresence>
        {selectedHire && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHire(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-primary-500/20">
                    {getInitials(selectedHire.name)}
                  </div>
                  <div className="min-w-0 text-left">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                      {selectedHire.name}
                    </h2>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 truncate">
                      {selectedHire.role} • <span className="text-slate-500 dark:text-slate-400 font-medium">{selectedHire.department || 'General'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHire(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-left">
                {/* Onboarding Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {selectedHire.email || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Manager</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {selectedHire.manager || 'Not Assigned'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {selectedHire.joiningDate ? formatDate(selectedHire.joiningDate) : 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Checklist Workflow */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-primary-600" />
                      Onboarding Workflow Checklist
                    </h3>
                    <span className="text-xs font-bold text-slate-500">
                      Progress: <span className="text-primary-600 dark:text-primary-400 font-black">{selectedHire.progress || 0}%</span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    {steps.map((step, idx) => {
                      const progressMap = [33, 67, 100];
                      const stepTarget = progressMap[idx];
                      const isDone = stepTarget <= (selectedHire.progress || 0);

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3",
                            isDone
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all",
                              isDone
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                              {isDone ? <Check size={14} /> : idx + 1}
                            </div>
                            <span className={cn(
                              "text-xs font-bold leading-snug truncate",
                              isDone ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"
                            )}>
                              {step.label}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleStep(selectedHire, idx)}
                            className={cn(
                              "h-7 px-3 rounded-lg text-[11px] font-bold uppercase transition-all select-none cursor-pointer shrink-0 inline-flex items-center gap-1",
                              isDone
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                                : "bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
                            )}
                          >
                            {isDone ? "Reopen" : "Mark Done"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Equipment & IT Setup Preview */}
                <section className="p-4 sm:p-5 bg-slate-900 dark:bg-slate-950 rounded-2xl text-white border border-slate-800 dark:border-slate-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider flex items-center gap-2">
                      <Monitor size={15} />
                      Equipment & IT Setup Provisioning
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-950 text-primary-300 border border-primary-800">
                      IT Auto-Sync
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-2">
                        <Laptop size={14} className="text-slate-400" />
                        Workstation Laptop (Mac/PC)
                      </span>
                      <span className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider",
                        selectedHire.progress >= 100 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {selectedHire.progress >= 100 ? 'Assigned' : 'Pending Allocation'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-slate-400" />
                        Corporate Email & Accounts
                      </span>
                      <span className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider",
                        selectedHire.progress >= 67 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {selectedHire.progress >= 67 ? 'Configured' : 'Awaiting Setup'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-2">
                        <KeyRound size={14} className="text-slate-400" />
                        Office Key Card & Access Pass
                      </span>
                      <span className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider",
                        selectedHire.progress >= 33 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {selectedHire.progress >= 33 ? 'Generated' : 'Pending Request'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Promotion Drawer / Form */}
              {showPromoteForm ? (
                <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 space-y-4 text-left">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Official Employee Promotion Detail
                    </h4>
                    <p className="text-xs text-slate-400">
                      Assign Employee ID and organizational hierarchy to complete promotion
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Employee ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        value={promoteData.employeeId}
                        onChange={e => setPromoteData({ ...promoteData, employeeId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Joining Date
                      </label>
                      <DatePicker
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        value={promoteData.joiningDate}
                        onChange={val => setPromoteData({ ...promoteData, joiningDate: typeof val === 'string' ? val : val?.target?.value || '' })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Department
                      </label>
                      <select
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        value={promoteData.departmentId}
                        onChange={e => setPromoteData({ ...promoteData, departmentId: e.target.value })}
                      >
                        <option value="">None</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Reporting Manager
                      </label>
                      <select
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        value={promoteData.managerId}
                        onChange={e => setPromoteData({ ...promoteData, managerId: e.target.value })}
                      >
                        <option value="">None</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.fullName || emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPromoteForm(false)}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isPromoting}
                      onClick={handleConfirmPromote}
                      className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isPromoting ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                      <span>Confirm Promotion</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Footer Action Buttons */
                <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => remindManager(selectedHire.id)}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Mail size={15} />
                      <span>Remind Manager</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendIndividualWelcome(selectedHire)}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Send size={15} />
                      <span>Send Welcome</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPromoteForm(true)}
                    disabled={selectedHire.status === 'Completed'}
                    className={cn(
                      "h-10 px-5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm select-none cursor-pointer",
                      selectedHire.status === 'Completed'
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                        : selectedHire.progress >= 100
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                        : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
                    )}
                  >
                    <ArrowUpRight size={16} />
                    <span>
                      {selectedHire.status === 'Completed'
                        ? 'Already Promoted'
                        : selectedHire.progress >= 100
                        ? 'Promote to Employee'
                        : 'Promote Early'}
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!onboardingToDelete}
        onClose={() => setOnboardingToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Onboarding Task"
        message={`Are you sure you want to remove ${onboardingToDelete?.name || 'this candidate'} from the onboarding queue? This action cannot be undone.`}
        confirmText="Delete Task"
        type="danger"
      />
    </div>
  );
};

export default Onboarding;

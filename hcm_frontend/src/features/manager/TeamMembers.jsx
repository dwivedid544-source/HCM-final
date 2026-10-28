import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Download,
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  Star,
  Clock,
  Mail,
  Phone,
  Target,
  BarChart3,
  TrendingUp,
  MapPin,
  MessageSquare,
  LayoutGrid,
  Loader2,
  X,
  FileText
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import PhoneInput from '../../shared/components/ui/PhoneInput';
import PermissionGate from '../../shared/components/common/PermissionGate';
import { useDateFormat } from '../../hooks/useDateFormat';
import { useCurrency } from '../../hooks/useCurrency';
import DatePicker from '../../shared/components/common/DatePicker';
import EmptyState from '../../shared/components/ui/EmptyState';
import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';

const TeamMembers = () => {
  const { 
    teamMembers, 
    addTeamMember, 
    tasks, 
    kpis, 
    attendance, 
    showToast, 
    orgEmployees, 
    addKpi, 
    addReview, 
    profile, 
    assignTask, 
    requestSalaryIncrement 
  } = useManager();
  const { formatDate } = useDateFormat();
  const { formatCurrency } = useCurrency();

  // UI States
  const [selectedMember, setSelectedMember] = useState(null);
  const [profileTab, setProfileTab] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Form State
  const [newMember, setNewMember] = useState({ id: '', name: '', email: '', role: '', department: 'Engineering', phone: '', joinDate: '' });

  // Goal & Review Modals State
  const [showAssignGoalModal, setShowAssignGoalModal] = useState(false);
  const [showInitiateReviewModal, setShowInitiateReviewModal] = useState(false);

  // Goal Form State
  const [newGoal, setNewGoal] = useState({ title: '', category: 'Productivity', priority: 'Medium', deadline: '' });

  // Review Form State
  const [newReview, setNewReview] = useState({ period: 'Q4 2026', type: 'Quarterly', rating: 5, strengths: '', improvement: '', summary: '' });

  // Task Modal & Form State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', deadline: '' });

  // Notes State
  const [notesList, setNotesList] = useState([]);
  const [noteText, setNoteText] = useState('');

  // Increment Modal State
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [incrementReq, setIncrementReq] = useState({ requestedSalary: '', effectiveDate: '', reason: '' });

  // Dynamic Departments List
  const departmentsList = useMemo(() => {
    const set = new Set(teamMembers.map(m => m.department).filter(Boolean));
    ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Operations'].forEach(d => set.add(d));
    return Array.from(set);
  }, [teamMembers]);

  // Filtering Logic
  const filteredTeam = useMemo(() => {
    return teamMembers.filter(m => {
      const matchesSearch = (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.role || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter ? m.department === deptFilter : true;
      const matchesRating = ratingFilter ? (m.rating || 0) >= parseFloat(ratingFilter) : true;
      return matchesSearch && matchesDept && matchesRating;
    });
  }, [teamMembers, searchQuery, deptFilter, ratingFilter]);

  const summaryMetrics = useMemo(() => {
    if (!selectedMember) return { taskRatio: '0 / 0', reliability: '100%' };
    const userTasks = tasks.filter(t => t.employeeId === selectedMember.id);
    const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = userTasks.length;
    const taskRatio = `${completedTasks} / ${totalTasks}`;

    const userAttendance = attendance.filter(a => a.userId === selectedMember.userId);
    const presentDays = userAttendance.filter(a => a.status === 'Present' || a.status === 'Clocked In').length;
    const totalDays = userAttendance.length;
    const reliability = totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : '100%';

    return { taskRatio, reliability };
  }, [selectedMember, tasks, attendance]);

  useEffect(() => {
    if (selectedMember) {
      const saved = localStorage.getItem(`manager_notes_${selectedMember.id}`);
      setNotesList(saved ? JSON.parse(saved) : [
        { text: "Core team contributor. Consistently delivers sprint goals on schedule.", author: profile?.fullName || "Manager", date: formatDate(new Date()) }
      ]);
    }
  }, [selectedMember, profile, formatDate]);

  const resetFilters = () => {
    setSearchQuery('');
    setDeptFilter('');
    setRatingFilter('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const email = (newMember.email || '').trim();
    const role = (newMember.role || '').trim();
    const department = (newMember.department || 'Engineering').trim();
    let name = (newMember.name || '').trim();

    if (!email || !role) {
      showToast('Work Email and Primary Role are required.', 'error');
      return;
    }

    // Auto-match by email in orgEmployees if id wasn't selected directly
    let empId = newMember.id || undefined;
    if (!empId && orgEmployees && orgEmployees.length > 0) {
      const match = orgEmployees.find(emp => emp.user?.email?.toLowerCase() === email.toLowerCase());
      if (match) {
        empId = match.id;
        if (!name) name = match.fullName;
      }
    }

    if (!name) {
      const prefix = email.split('@')[0].replace(/[._-]/g, ' ');
      name = prefix.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Team Member';
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name,
        email,
        role,
        department,
        status: 'Active',
        rating: 4.5,
        phone: newMember.phone || '',
        joinDate: newMember.joinDate || new Date().toISOString().split('T')[0],
        img: newMember.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      if (empId) {
        payload.id = empId;
      }

      await addTeamMember(payload);
      setShowAddModal(false);
      setNewMember({ id: '', name: '', email: '', role: '', department: 'Engineering', phone: '', joinDate: '' });
    } catch (err) {
      console.error('Failed to add team member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.deadline) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await addKpi({
        title: newGoal.title,
        assignedTo: selectedMember.name,
        employeeId: selectedMember.id,
        progress: 0,
        status: 'On Track',
        priority: newGoal.priority,
        deadline: newGoal.deadline,
        category: newGoal.category
      });
      setShowAssignGoalModal(false);
      setNewGoal({ title: '', category: 'Productivity', priority: 'Medium', deadline: '' });
      setProfileTab('kpi');
    } catch (err) {
      showToast('Failed to assign goal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await addReview({
        employeeId: selectedMember.id,
        name: selectedMember.name,
        role: selectedMember.role,
        period: newReview.period,
        type: newReview.type,
        rating: Number(newReview.rating),
        status: 'Draft',
        strengths: newReview.strengths || '',
        improvement: newReview.improvement || '',
        summary: newReview.summary || ''
      });
      setShowInitiateReviewModal(false);
      setNewReview({ period: 'Q4 2026', type: 'Quarterly', rating: 5, strengths: '', improvement: '', summary: '' });
      showToast(`Review cycle initiated for ${selectedMember.name}`);
    } catch (err) {
      showToast('Failed to initiate review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestIncrement = async (e) => {
    e.preventDefault();
    if (!incrementReq.requestedSalary || !incrementReq.effectiveDate) {
      showToast('Please fill in required fields.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await requestSalaryIncrement({
        employeeId: selectedMember.id,
        requestedSalary: Number(incrementReq.requestedSalary),
        effectiveDate: incrementReq.effectiveDate,
        reason: incrementReq.reason
      });
      setShowIncrementModal(false);
      setIncrementReq({ requestedSalary: '', effectiveDate: '', reason: '' });
    } catch (err) {
      showToast('Failed to request increment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      text: noteText,
      author: profile?.fullName || "Manager",
      date: formatDate(new Date())
    };
    const updated = [newNote, ...notesList];
    setNotesList(updated);
    if (selectedMember) {
      localStorage.setItem(`manager_notes_${selectedMember.id}`, JSON.stringify(updated));
    }
    setNoteText('');
    showToast('Internal note posted successfully');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.deadline) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await assignTask({
        employeeId: selectedMember.id,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.deadline
      });
      setShowAssignTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'Medium', deadline: '' });
      setProfileTab('tasks');
    } catch (err) {
      showToast('Failed to assign task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    showToast('Preparing team roster database...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Name', 'Email', 'Role', 'Department', 'Phone', 'Join Date', 'Status'];
        const rows = teamMembers.map(m => [
          `"${m.name || ''}"`,
          `"${m.email || ''}"`,
          `"${m.role || ''}"`,
          `"${m.department || ''}"`,
          `"${m.phone || 'N/A'}"`,
          `"${m.joinDate || 'N/A'}"`,
          `"${m.status || 'Active'}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `team_members_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Team roster database exported successfully!', 'success');
      } catch (err) {
        showToast('Error exporting team members', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative max-w-full overflow-hidden">
      {/* Header Section */}
      <PageHeader
        title="Team Members"
        subtitle="Manage your team's access, view performance and assign roles"
      >
        <PermissionGate module="team_members" action="manage">
          <Button 
            variant="export" 
            size="sm"
            leftIcon={Download} 
            isLoading={isExporting} 
            onClick={handleExport}
          >
            Export List
          </Button>
        </PermissionGate>
        
        <PermissionGate module="team_members" action="create">
          <Button 
            variant="primary" 
            size="sm"
            leftIcon={Plus} 
            onClick={() => setShowAddModal(true)}
          >
            Add Member
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Filter Bar */}
      <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3 sm:gap-4 text-left">
        <div className="relative flex-1 w-full text-slate-400">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="input-field pl-10 h-11 w-full text-xs sm:text-sm font-medium" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <select
            className="select-field h-11 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[150px] flex-1 sm:flex-none"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            className="select-field h-11 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[130px] flex-1 sm:flex-none"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="4.5">4.5+ ★</option>
            <option value="4.0">4.0+ ★</option>
            <option value="3.5">3.5+ ★</option>
          </select>

          <button 
            type="button"
            onClick={resetFilters}
            title="Reset Filters"
            className="h-11 w-11 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Table View (Hidden on mobile) */}
      <div className="hidden md:block card p-0 border-none bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
        <div className="hcm-table-container">
          <table className="hcm-table w-full">
            <thead className="hcm-thead">
              <tr className="hcm-tr">
                <th className="hcm-th text-left">Member Info</th>
                <th className="hcm-th text-left">Position / Dept</th>
                <th className="hcm-th text-center">Avg Rating</th>
                <th className="hcm-th text-center">Status</th>
                <th className="hcm-th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredTeam.length > 0 ? (
                filteredTeam.map((user) => (
                  <tr key={user.id} className="hcm-tr hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="hcm-td">
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <Avatar src={user.img} alt={user.name} size="md" />
                          <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs", user.status === 'Online' || user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300')} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 dark:text-white leading-tight truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hcm-td">
                      <p className="font-bold text-slate-700 dark:text-slate-200 leading-tight truncate">{user.role}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{user.department}</p>
                    </td>
                    <td className="hcm-td text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 font-bold">
                        <Star size={14} className={cn("fill-amber-400", user.rating > 0 ? "text-amber-400" : "text-slate-300")} />
                        <span className="font-black text-slate-800 dark:text-slate-200">{user.rating || '-'}</span>
                      </div>
                    </td>
                    <td className="hcm-td text-center">
                      <span className={cn("px-3 py-1 rounded-lg text-xs font-bold inline-block", user.status === 'Active' || user.status === 'Online' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700")}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="hcm-td text-right">
                      <button 
                        type="button"
                        onClick={() => setSelectedMember(user)}
                        className="h-9 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye size={14} className="text-slate-500" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="hcm-tr">
                  <td colSpan="5" className="hcm-td p-12 text-center">
                    <EmptyState
                      icon={Users}
                      title="No team members found"
                      description="No team members match your active search or filter criteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards View (Shown only on mobile) */}
      <div className="block md:hidden space-y-4 text-left">
        {filteredTeam.length > 0 ? (
          filteredTeam.map(user => (
            <div key={user.id} className="card p-4 space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar src={user.img} alt={user.name} size="md" />
                    <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900", user.status === 'Active' || user.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300')} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0", user.status === 'Active' || user.status === 'Online' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                  {user.status || 'Active'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Role & Dept</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{user.role}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.department}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Avg Rating</span>
                  <div className="inline-flex items-center gap-1 font-bold mt-0.5">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{user.rating || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMember(user)}
                  className="h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Eye size={14} />
                  <span>View Profile</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center bg-white dark:bg-slate-900">
            <EmptyState
              icon={Users}
              title="No team members found"
              description="No team members match your active search or filter criteria."
            />
          </div>
        )}
      </div>

      {/* Member Profile Detail Modal */}
      <CenterModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Member Performance Profile"
        maxWidth="max-w-4xl"
      >
        {selectedMember && (
          <div className="flex flex-col h-full overflow-hidden text-left bg-white dark:bg-slate-900">
            {/* Hero Section */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-5 sm:gap-6 bg-slate-50/50 dark:bg-slate-800/30">
              <Avatar src={selectedMember.img} alt={selectedMember.name} size="xl" />
              
              <div className="text-center md:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedMember.name}</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-100 dark:border-emerald-900/30">
                    {selectedMember.status || 'Active'}
                  </span>
                </div>

                <p className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider text-[11px]">{selectedMember.role}</p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} /> 
                    <span className="text-xs sm:text-sm font-semibold">{selectedMember.email}</span>
                  </div>
                  {selectedMember.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} /> 
                      <span className="text-xs sm:text-sm font-semibold">{selectedMember.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} /> 
                    <span className="text-xs sm:text-sm font-semibold">{selectedMember.department || 'Operations'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
              {[
                { id: 'summary', label: 'Summary', icon: LayoutGrid },
                { id: 'attendance', label: 'Attendance', icon: Clock },
                { id: 'tasks', label: 'Team Tasks', icon: CheckCircle2 },
                { id: 'kpi', label: 'KPI Index', icon: Target },
                { id: 'notes', label: 'Internal Notes', icon: MessageSquare }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProfileTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer",
                    profileTab === tab.id 
                      ? "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400" 
                      : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {profileTab === 'summary' && (
                  <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Performance Rating</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">{selectedMember.rating || '4.5'}</span>
                          <Star size={16} className="fill-amber-400 text-amber-400"/>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Task Ratio</p>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{summaryMetrics.taskRatio}</span>
                      </div>

                      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Reliability Score</p>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.reliability}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">Professional Summary</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{selectedMember.name} is a key member of the {selectedMember.department || 'Operations'} team. Demonstrates strong execution abilities and reliable sprint completion."
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedMember.department || 'Engineering'}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Joining Date</label>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedMember.joinDate || 'Jan 15, 2024'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {profileTab === 'attendance' && (() => {
                  const userAttendance = attendance.filter(a => a.userId === selectedMember.userId);
                  const presentDays = userAttendance.filter(a => a.status === 'Present' || a.status === 'Clocked In').length;
                  const totalDays = userAttendance.length || 1;
                  const eff = userAttendance.length > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
                  return (
                    <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="card p-5 bg-slate-900 dark:bg-slate-950 border-none shadow-md text-white flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-1">Monthly Attendance Score</p>
                          <h4 className="text-2xl font-black">{eff}% Reliability Rate</h4>
                        </div>
                        <TrendingUp size={32} className="text-primary-400" />
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 28 }).map((_, i) => {
                          const dayAtt = userAttendance.find(a => new Date(a.date).getDate() === i + 1);
                          const isPresent = dayAtt ? (dayAtt.status === 'Present' || dayAtt.status === 'Clocked In') : true;
                          return (
                            <div key={i} className={cn(
                              "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border text-xs font-bold",
                              isPresent ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                            )}>
                              <span className="text-[10px] opacity-60">{i + 1}</span>
                              <CheckCircle2 size={12} />
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })()}

                {profileTab === 'tasks' && (
                  <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Assignments</h4>
                      <button 
                        type="button"
                        onClick={() => setShowAssignTaskModal(true)}
                        className="btn-primary h-9 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Assign Task</span>
                      </button>
                    </div>

                    {tasks.filter(t => t.employeeId === selectedMember.id).map((task, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center justify-between mb-2 text-left">
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{task.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Due {task.dueDate ? formatDate(task.dueDate) : 'N/A'} • {task.priority || 'Medium'} Priority</p>
                          </div>
                          <span className="text-xs font-black text-primary-600 dark:text-primary-400">{task.status || 'Pending'}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600 rounded-full" style={{ width: task.status === 'Completed' ? '100%' : task.status === 'In Progress' ? '50%' : '15%' }} />
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.employeeId === selectedMember.id).length === 0 && (
                      <div className="p-6 text-center text-slate-400">
                        <p className="text-xs font-bold">No active tasks assigned.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {profileTab === 'kpi' && (
                  <motion.div key="kpi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <div className="space-y-3">
                      {kpis.filter(k => k.employeeId === selectedMember.id).map((m, i) => (
                        <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{m.progress || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${m.progress || 0}%` }} />
                          </div>
                        </div>
                      ))}
                      {kpis.filter(k => k.employeeId === selectedMember.id).length === 0 && (
                        <div className="p-6 text-center text-slate-400">
                          <p className="text-xs font-bold">No active performance goals found.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {profileTab === 'notes' && (
                  <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    <textarea
                      placeholder="Add internal performance notes for this member..."
                      className="w-full h-24 input-field p-3 font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 resize-none"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                    />
                    
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={handlePostNote}
                        className="btn-primary h-9 px-4 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Post Note
                      </button>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {notesList.map((note, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">"{note.text}"</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1.5">— {note.author}, {note.date}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center gap-3 shrink-0">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowAssignGoalModal(true); }}
                className="btn-secondary h-11 px-4 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Target size={16} />
                <span>Assign Goal</span>
              </button>

              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowInitiateReviewModal(true); }}
                className="btn-secondary h-11 px-4 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <BarChart3 size={16} />
                <span>Initiate Review</span>
              </button>

              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowIncrementModal(true); }}
                className="btn-secondary h-11 px-4 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <TrendingUp size={16} />
                <span>Request Increment</span>
              </button>
            </div>
          </div>
        )}
      </CenterModal>

      {/* Add Member Modal */}
      <CenterModal
        isOpen={showAddModal}
        onClose={() => !isSubmitting && setShowAddModal(false)}
        title="Add New Team Member"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddMember} className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Select Employee</label>
            <select
              className="select-field h-11 w-full text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
              value={newMember.id || ''}
              onChange={e => {
                const selectedId = e.target.value;
                const emp = orgEmployees?.find(item => item.id === selectedId);
                if (emp) {
                  const empRole = emp.designation || emp.jobTitle || emp.role || (emp.user?.role && emp.user.role !== 'EMPLOYEE' ? emp.user.role : '') || '';
                  setNewMember({
                    id: emp.id,
                    name: emp.fullName || '',
                    email: emp.user?.email || '',
                    role: empRole,
                    department: emp.department?.name || emp.department || 'Engineering',
                    phone: emp.phone || '',
                    joinDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : (newMember.joinDate || new Date().toISOString().split('T')[0])
                  });
                } else {
                  setNewMember({ id: '', name: '', email: '', role: '', department: 'Engineering', phone: '', joinDate: '' });
                }
              }}
            >
              <option value="">-- Select employee from organization --</option>
              {orgEmployees && orgEmployees.length > 0 ? (
                orgEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.user?.email || 'No email'})
                  </option>
                ))
              ) : (
                <option value="" disabled>No unassigned employees available</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Work Email</label>
              <input
                type="email"
                required
                placeholder="email@company.com"
                className="input-field h-11 text-xs sm:text-sm font-medium w-full"
                value={newMember.email}
                onChange={e => {
                  const emailVal = e.target.value;
                  const matchedEmp = orgEmployees?.find(emp => emp.user?.email?.toLowerCase() === emailVal.toLowerCase().trim());
                  if (matchedEmp) {
                    const empRole = matchedEmp.designation || matchedEmp.jobTitle || matchedEmp.role || (matchedEmp.user?.role && matchedEmp.user.role !== 'EMPLOYEE' ? matchedEmp.user.role : '') || '';
                    setNewMember({
                      ...newMember,
                      id: matchedEmp.id,
                      name: matchedEmp.fullName || '',
                      email: emailVal,
                      role: newMember.role || empRole,
                      department: matchedEmp.department?.name || matchedEmp.department || newMember.department,
                      joinDate: matchedEmp.joiningDate ? matchedEmp.joiningDate.split('T')[0] : newMember.joinDate
                    });
                  } else {
                    setNewMember({ ...newMember, email: emailVal });
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Primary Role</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Engineer"
                className="input-field h-11 text-xs sm:text-sm font-medium w-full"
                value={newMember.role}
                onChange={e => setNewMember({ ...newMember, role: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Department</label>
              <select
                className="select-field h-11 text-xs sm:text-sm font-medium w-full"
                value={newMember.department}
                onChange={e => setNewMember({ ...newMember, department: e.target.value })}
              >
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Joining Date</label>
              <DatePicker 
                className="input-field h-11 text-xs sm:text-sm font-medium w-full cursor-pointer"
                value={newMember.joinDate}
                onChange={e => setNewMember({ ...newMember, joinDate: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 sm:pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowAddModal(false)}
              className="btn-secondary h-11 px-6 rounded-xl font-bold w-full sm:w-auto text-xs sm:text-sm cursor-pointer"
            >
              Cancel
            </button>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-11 px-6 rounded-xl font-bold w-full sm:w-auto text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Confirm Onboarding</span>}
            </button>
          </div>
        </form>
      </CenterModal>

      {/* Assign Goal Modal */}
      <CenterModal
        isOpen={showAssignGoalModal}
        onClose={() => !isSubmitting && setShowAssignGoalModal(false)}
        title={`Assign Goal: ${selectedMember?.name}`}
      >
        <form onSubmit={handleAssignGoal} className="space-y-4 text-left p-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Goal Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Q4 API Audit"
              className="input-field h-11 text-xs font-medium"
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Category</label>
              <select
                className="select-field h-11 text-xs font-bold"
                value={newGoal.category}
                onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
              >
                <option value="Productivity">Productivity</option>
                <option value="Quality">Quality</option>
                <option value="Development">Development</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Priority</label>
              <select
                className="select-field h-11 text-xs font-bold"
                value={newGoal.priority}
                onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Deadline Date</label>
            <DatePicker 
              required
              className="input-field h-11 text-xs font-medium"
              value={newGoal.deadline}
              onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              disabled={isSubmitting}
              onClick={() => setShowAssignGoalModal(false)}
              className="btn-secondary h-11 px-5 rounded-xl font-bold w-1/3 text-xs sm:text-sm cursor-pointer"
            >
              Discard
            </button>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-11 rounded-xl font-bold w-2/3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Create Goal</span>}
            </button>
          </div>
        </form>
      </CenterModal>

      {/* Initiate Review Modal */}
      <CenterModal
        isOpen={showInitiateReviewModal}
        onClose={() => !isSubmitting && setShowInitiateReviewModal(false)}
        title={`Initiate Review: ${selectedMember?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleInitiateReviewSubmit} className="space-y-4 text-left p-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Review Period</label>
              <select
                className="select-field h-11 text-xs font-bold"
                value={newReview.period}
                onChange={e => setNewReview({ ...newReview, period: e.target.value })}
              >
                <option value="Q1 2026">Q1 2026</option>
                <option value="Q2 2026">Q2 2026</option>
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q4 2026">Q4 2026</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Type</label>
              <select
                className="select-field h-11 text-xs font-bold"
                value={newReview.type}
                onChange={e => setNewReview({ ...newReview, type: e.target.value })}
              >
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                required
                className="input-field h-11 text-xs font-medium"
                value={newReview.rating}
                onChange={e => setNewReview({ ...newReview, rating: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Core Strengths</label>
            <textarea
              rows="2"
              placeholder="Highlight employee strengths..."
              className="w-full input-field p-3 text-xs font-medium resize-none"
              value={newReview.strengths}
              onChange={e => setNewReview({ ...newReview, strengths: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Evaluation Summary</label>
            <textarea
              rows="2"
              placeholder="Detailed performance summary..."
              className="w-full input-field p-3 text-xs font-medium resize-none"
              value={newReview.summary}
              onChange={e => setNewReview({ ...newReview, summary: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              disabled={isSubmitting}
              onClick={() => setShowInitiateReviewModal(false)}
              className="btn-secondary h-11 px-5 rounded-xl font-bold w-1/3 text-xs sm:text-sm cursor-pointer"
            >
              Discard
            </button>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-11 rounded-xl font-bold w-2/3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Submit Review</span>}
            </button>
          </div>
        </form>
      </CenterModal>

      {/* Increment Request Modal */}
      <CenterModal
        isOpen={showIncrementModal}
        onClose={() => !isSubmitting && setShowIncrementModal(false)}
        title={`Request Salary Increment: ${selectedMember?.name}`}
      >
        <form onSubmit={handleRequestIncrement} className="space-y-4 text-left p-1">
          {selectedMember?.compensationProfile?.monthlyCTC && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Current Monthly CTC</p>
                <p className="text-lg font-black text-indigo-900 dark:text-indigo-200 mt-0.5">{formatCurrency(selectedMember.compensationProfile.monthlyCTC)}</p>
              </div>
              <TrendingUp className="text-indigo-500" size={24} />
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Requested Monthly CTC ($)</label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 5000"
              className="input-field h-11 text-xs font-medium"
              value={incrementReq.requestedSalary}
              onChange={e => setIncrementReq({ ...incrementReq, requestedSalary: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Effective Date</label>
            <DatePicker 
              required
              className="input-field h-11 text-xs font-medium"
              value={incrementReq.effectiveDate}
              onChange={e => setIncrementReq({ ...incrementReq, effectiveDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Reason for Request</label>
            <textarea
              className="input-field p-3 h-20 text-xs font-medium resize-none"
              placeholder="Justification for increment..."
              value={incrementReq.reason}
              onChange={e => setIncrementReq({ ...incrementReq, reason: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              disabled={isSubmitting}
              onClick={() => setShowIncrementModal(false)}
              className="btn-secondary h-11 px-5 rounded-xl font-bold w-1/3 text-xs sm:text-sm cursor-pointer"
            >
              Cancel
            </button>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-11 rounded-xl font-bold w-2/3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Request Increment</span>}
            </button>
          </div>
        </form>
      </CenterModal>

      {/* Assign Task Modal */}
      <CenterModal
        isOpen={showAssignTaskModal}
        onClose={() => !isSubmitting && setShowAssignTaskModal(false)}
        title={`Assign Task: ${selectedMember?.name}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-left p-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Write unit tests for auth service"
              className="input-field h-11 text-xs font-medium"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Priority</label>
              <select
                className="select-field h-11 text-xs font-bold"
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Due Date</label>
              <DatePicker 
                required
                className="input-field h-11 text-xs font-medium"
                value={newTask.deadline}
                onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              disabled={isSubmitting}
              onClick={() => setShowAssignTaskModal(false)}
              className="btn-secondary h-11 px-5 rounded-xl font-bold w-1/3 text-xs sm:text-sm cursor-pointer"
            >
              Discard
            </button>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-11 rounded-xl font-bold w-2/3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <span>Assign Task</span>}
            </button>
          </div>
        </form>
      </CenterModal>
    </div>
  );
};

export default TeamMembers;


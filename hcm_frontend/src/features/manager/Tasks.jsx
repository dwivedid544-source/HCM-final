import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Calendar, 
  MessageSquare, 
  ChevronRight, 
  X, 
  Briefcase, 
  Zap, 
  Target, 
  RotateCcw, 
  CheckCircle, 
  Loader2,
  Trash2,
  Edit3,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import StatCard from '../../shared/components/ui/StatCard';
import CenterModal from '../../shared/components/layout/CenterModal';
import PermissionGate from '../../shared/components/common/PermissionGate';
import DatePicker from '../../shared/components/common/DatePicker';
import { usePersistedTab } from '../../hooks/usePersistedTab';
import { useDateFormat } from '../../hooks/useDateFormat';
import PageHeader from '../../shared/components/ui/PageHeader';
import Button from '../../shared/components/ui/Button';
import Avatar from '../../shared/components/ui/Avatar';
import EmptyState from '../../shared/components/ui/EmptyState';

const Tasks = () => {
  const { 
    tasks = [], 
    teamMembers = [], 
    orgEmployees = [],
    showToast, 
    addTask, 
    updateTaskStatus,
    updateTask,
    deleteTask 
  } = useManager();
  
  // UI States
  const [viewMode, setViewMode] = usePersistedTab('mgr_tasks_view', 'board', 'view');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for New Task
  const [newTask, setNewTask] = useState({ 
    title: '', 
    employeeId: '', 
    priority: 'Medium', 
    dueDate: new Date().toISOString().split('T')[0], 
    status: 'Pending', 
    description: '' 
  });

  const { formatDate } = useDateFormat();

  // Combine team members and org employees for assignee selection dropdown
  const memberOptions = useMemo(() => {
    const combined = [...(teamMembers || [])];
    (orgEmployees || []).forEach(emp => {
      if (!combined.some(m => m.id === emp.id || m.id?.toString() === emp.id?.toString())) {
        combined.push({
          id: emp.id,
          name: emp.fullName || emp.user?.fullName || emp.name || emp.user?.email || 'Team Member',
          role: emp.role || emp.user?.role || 'Team Member',
          department: emp.department?.name || emp.department || 'General'
        });
      }
    });
    return combined;
  }, [teamMembers, orgEmployees]);

  // Normalize and resolve task object properties
  const resolvedTasks = useMemo(() => {
    return (tasks || []).map(t => {
      const matchedMember = memberOptions.find(m => 
        m.id === t.employeeId || 
        m.id?.toString() === t.employeeId?.toString()
      );
      const assigneeName = t.employee?.fullName || matchedMember?.name || t.user || t.assignee || 'Unassigned';
      const assigneeRole = matchedMember?.role || t.employee?.role || 'Team Member';
      const assigneeImg = matchedMember?.img || t.employee?.avatarUrl || '';
      
      let rawDate = t.dueDate || t.deadline || '';
      if (rawDate && typeof rawDate === 'string' && rawDate.includes('T')) {
        rawDate = rawDate.split('T')[0];
      }

      return {
        ...t,
        assigneeName,
        assigneeRole,
        assigneeImg,
        dueDateFormatted: rawDate ? formatDate(rawDate) : 'No Due Date',
        status: t.status || 'Pending',
        priority: t.priority || 'Medium',
        progress: typeof t.progress === 'number' ? t.progress : (t.status === 'Completed' ? 100 : t.status === 'In Progress' ? 50 : t.status === 'Review' ? 85 : 0)
      };
    });
  }, [tasks, memberOptions, formatDate]);

  // Filtering Logic
  const filteredTasks = useMemo(() => {
    return resolvedTasks.filter(t => {
      const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (t.assigneeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [resolvedTasks, searchQuery, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    return [
      { label: 'Total Tasks', value: resolvedTasks.length.toString(), icon: Briefcase, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
      { label: 'In Progress', value: resolvedTasks.filter(t => t.status === 'In Progress').length.toString(), icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
      { label: 'Final Review', value: resolvedTasks.filter(t => t.status === 'Review').length.toString(), icon: AlertCircle, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
      { label: 'Completed', value: resolvedTasks.filter(t => t.status === 'Completed').length.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    ];
  }, [resolvedTasks]);

  const columns = [
    { key: 'Pending', title: 'Pending', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-400', badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
    { key: 'In Progress', title: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-500', badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
    { key: 'Review', title: 'Review', color: 'text-indigo-500', bg: 'bg-indigo-500', badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' },
    { key: 'Completed', title: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
  ];

  const handleOpenCreateModal = (defaultStatus = 'Pending') => {
    setNewTask({ 
      title: '', 
      employeeId: '', 
      priority: 'Medium', 
      dueDate: new Date().toISOString().split('T')[0], 
      status: defaultStatus, 
      description: '' 
    });
    setShowAddModal(true);
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = newTask.title.trim();
    if (!trimmedTitle) {
      showToast('Please provide a task title.', 'error');
      return;
    }
    if (trimmedTitle.length < 3) {
      showToast('Task title must be at least 3 characters long.', 'error');
      return;
    }
    if (!newTask.employeeId) {
      showToast('Please assign an employee to this task.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTask({
        employeeId: newTask.employeeId.toString(),
        title: trimmedTitle,
        description: (newTask.description || '').trim(),
        priority: newTask.priority || 'Medium',
        dueDate: newTask.dueDate || undefined,
        status: newTask.status || 'Pending',
      });
      setShowAddModal(false);
      setNewTask({ 
        title: '', 
        employeeId: '', 
        priority: 'Medium', 
        dueDate: new Date().toISOString().split('T')[0], 
        status: 'Pending', 
        description: '' 
      });
    } catch (err) {
      console.error('Task creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task moved to ${newStatus}.`, 'success');
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      if (deleteTask) {
        await deleteTask(taskId);
      }
      setSelectedTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in relative text-left">
      {/* Header Section */}
      <PageHeader
        title="Team Task Management"
        subtitle="Oversee work distribution, monitor progress and ensure deadlines are met"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Segmented Grid / List View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button 
              type="button"
              onClick={() => setViewMode('board')}
              title="Kanban Board View"
              className={cn(
                "p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === 'board' 
                  ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs border border-slate-200/60 dark:border-slate-800" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('table')}
              title="List Table View"
              className={cn(
                "p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === 'table' 
                  ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs border border-slate-200/60 dark:border-slate-800" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <ListIcon size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <PermissionGate module="tasks" action="create">
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={Plus} 
              onClick={() => handleOpenCreateModal('Pending')}
            >
              Create Task
            </Button>
          </PermissionGate>
        </div>
      </PageHeader>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-left">
        <div className="relative flex-1 w-full text-slate-400">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks by title, assignee or description..." 
            className="input-field pl-10 h-11 w-full text-xs sm:text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto shrink-0">
          {['All', 'Pending', 'In Progress', 'Review', 'Completed'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer select-none",
                statusFilter === st
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.title);

            return (
              <div 
                key={col.key} 
                className="min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-start flex-1 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", col.bg)} />
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{col.title}</h3>
                  </div>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black border border-slate-200/80 dark:border-slate-700", col.badgeBg)}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="space-y-3 min-h-[380px]">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layoutId={`task-${task.id}`}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-primary-300 dark:hover:border-primary-700/60 transition-all cursor-pointer space-y-3 text-left group"
                    >
                      {/* Priority Tag & Actions */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider border",
                          task.priority === 'High' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40" :
                          task.priority === 'Medium' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" :
                          "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40"
                        )}>
                          {task.priority} Priority
                        </span>
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                      </div>
                      
                      {/* Title */}
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {task.title}
                      </h4>
                      
                      {/* Description Preview if available */}
                      {task.description && (
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                          "{task.description}"
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>Progress</span>
                          <span className="text-slate-700 dark:text-slate-200 font-extrabold">{task.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              task.status === 'Completed' ? "bg-emerald-500" :
                              task.status === 'In Progress' ? "bg-amber-500" :
                              task.status === 'Review' ? "bg-indigo-500" : "bg-slate-400"
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: Assignee & Due Date */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar src={task.assigneeImg} alt={task.assigneeName} size="xs" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                            {task.assigneeName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                          <Calendar size={11} className="text-slate-400" />
                          <span>{task.dueDateFormatted}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500">No tasks in {col.title}</p>
                    </div>
                  )}

                  {/* Add Task Quick Trigger */}
                  <button 
                    type="button"
                    onClick={() => handleOpenCreateModal(col.title)}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/50 dark:bg-slate-900/50"
                  >
                    <Plus size={15} />
                    <span>Add Task to {col.title}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Table View */
        <div className="card p-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
          <div className="hcm-table-container">
            <table className="hcm-table w-full">
              <thead className="hcm-thead">
                <tr className="hcm-tr">
                  <th className="hcm-th text-left min-w-[240px]">Task Title</th>
                  <th className="hcm-th text-left min-w-[180px]">Assigned Employee</th>
                  <th className="hcm-th text-center min-w-[120px]">Priority</th>
                  <th className="hcm-th text-center min-w-[140px]">Status</th>
                  <th className="hcm-th text-center min-w-[140px]">Progress %</th>
                  <th className="hcm-th text-center min-w-[140px]">Due Date</th>
                  <th className="hcm-th text-right min-w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hcm-tr hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="hcm-td">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate italic max-w-xs">{task.description}</p>
                          )}
                        </div>
                      </td>

                      <td className="hcm-td">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={task.assigneeImg} alt={task.assigneeName} size="xs" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{task.assigneeName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{task.assigneeRole}</p>
                          </div>
                        </div>
                      </td>

                      <td className="hcm-td text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold inline-block border",
                          task.priority === 'High' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40" :
                          task.priority === 'Medium' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" :
                          "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40"
                        )}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="hcm-td text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-extrabold inline-block border",
                          task.status === 'Completed' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" :
                          task.status === 'In Progress' ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" :
                          task.status === 'Review' ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        )}>
                          {task.status}
                        </span>
                      </td>

                      <td className="hcm-td text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-600 rounded-full" 
                              style={{ width: `${task.progress}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.progress}%</span>
                        </div>
                      </td>

                      <td className="hcm-td text-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {task.dueDateFormatted}
                        </span>
                      </td>

                      <td className="hcm-td text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hcm-tr">
                    <td colSpan="7" className="hcm-td p-12 text-center">
                      <EmptyState
                        icon={Briefcase}
                        title="No tasks found"
                        description="No team tasks match your search query or status filter."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CenterModal 
        isOpen={showAddModal} 
        onClose={() => !isSubmitting && setShowAddModal(false)} 
        title="Create Team Task"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateTaskSubmit} className="p-4 sm:p-7 space-y-4 sm:space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. Implement Q4 Authentication API" 
              className="input-field h-11 text-xs sm:text-sm font-medium w-full"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Assign Employee <span className="text-rose-500">*</span>
              </label>
              <select
                className="select-field h-11 text-xs sm:text-sm font-semibold w-full cursor-pointer"
                value={newTask.employeeId}
                onChange={(e) => setNewTask(prev => ({ ...prev, employeeId: e.target.value }))}
                required
              >
                <option value="">-- Choose Assignee --</option>
                {memberOptions.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role || 'Member'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Initial Column / Status
              </label>
              <select
                className="select-field h-11 text-xs sm:text-sm font-semibold w-full cursor-pointer"
                value={newTask.status}
                onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Priority Level
              </label>
              <select
                className="select-field h-11 text-xs sm:text-sm font-semibold w-full cursor-pointer"
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                Due Date
              </label>
              <DatePicker 
                className="input-field h-11 text-xs sm:text-sm font-medium w-full cursor-pointer"
                value={newTask.dueDate}
                onChange={(e) => {
                  const val = e?.target?.value !== undefined ? e.target.value : e;
                  setNewTask(prev => ({ ...prev, dueDate: val }));
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
              Task Description / Deliverables
            </label>
            <textarea
              rows="3"
              placeholder="Provide context, acceptance criteria or links for this task..."
              className="textarea-field text-xs sm:text-sm font-medium w-full resize-none min-h-[90px]"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              isDisabled={isSubmitting}
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={Plus}
            >
              Create Task
            </Button>
          </div>
        </form>
      </CenterModal>

      {/* Task Details & Status Update Modal */}
      <CenterModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        title="Task Overview & Status"
      >
        {selectedTask && (
          <div className="space-y-6 text-left p-1">
            {/* Header info card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <span className={cn(
                  "text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider",
                  selectedTask.priority === 'High' ? "bg-rose-500 text-white" :
                  selectedTask.priority === 'Medium' ? "bg-amber-500 text-white" :
                  "bg-indigo-500 text-white"
                )}>
                  {selectedTask.priority} Priority
                </span>

                <span className="text-xs font-extrabold bg-white/10 px-3 py-1 rounded-lg">
                  {selectedTask.status}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug">
                {selectedTask.title}
              </h3>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Assignee</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar src={selectedTask.assigneeImg} alt={selectedTask.assigneeName} size="xs" />
                    <span className="font-extrabold text-white">{selectedTask.assigneeName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Due Date</span>
                  <p className="font-extrabold text-white mt-1 flex items-center gap-1.5">
                    <Calendar size={13} className="text-white/60" />
                    {selectedTask.dueDateFormatted}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Description</label>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                {selectedTask.description ? `"${selectedTask.description}"` : 'No description provided.'}
              </div>
            </div>

            {/* Status Selector & Update */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Update Status Column
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Pending', 'In Progress', 'Review', 'Completed'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(selectedTask.id, st)}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center",
                      selectedTask.status === st
                        ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Button
                variant="danger"
                size="sm"
                leftIcon={Trash2}
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                Delete Task
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
};

export default Tasks;

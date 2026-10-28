import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Download, 
  Zap, 
  Save, 
  MessageSquare, 
  Trash2,
  Edit
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useManager } from '../../context/ManagerContext';
import CenterModal from '../../shared/components/layout/CenterModal';
import Avatar from '../../shared/components/ui/Avatar';
import EmptyState from '../../shared/components/ui/EmptyState';
import DatePicker from '../../shared/components/common/DatePicker';
import Button from '../../shared/components/ui/Button';
import IconButton from '../../shared/components/ui/IconButton';
import PageHeader from '../../shared/components/ui/PageHeader';
import PermissionGate from '../../shared/components/common/PermissionGate';
import { usePersistedTab } from '../../hooks/usePersistedTab';

const KPITracking = () => {
  const { kpis, teamMembers, showToast, addKpi, updateKpi, deleteKpi } = useManager();
  
  // UI States
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = usePersistedTab('mgr_kpi', 'Active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Form State
  const [newGoal, setNewGoal] = useState({ title: '', employeeId: '', category: 'Productivity', priority: 'Medium', deadline: '' });

  // Resolve KPI assignee details from team members dynamically
  const resolvedKpis = useMemo(() => {
    return (kpis || []).map(k => {
      const member = (teamMembers || []).find(m => 
        m.name === k.assignedTo || 
        m.id?.toString() === k.employeeId?.toString() ||
        m.id?.toString() === k.assignedTo?.toString()
      );
      return {
        ...k,
        name: k.name || k.assignedTo || (member ? member.name : 'Team Member'),
        img: k.img || (member ? member.img : '')
      };
    });
  }, [kpis, teamMembers]);

  // Average performance % calculation
  const avgPerformance = useMemo(() => {
    if (resolvedKpis.length === 0) return '0%';
    const totalProgress = resolvedKpis.reduce((acc, k) => acc + (Number(k.progress) || 0), 0);
    const avg = Math.round(totalProgress / resolvedKpis.length);
    return `${avg}%`;
  }, [resolvedKpis]);

  // Stats calculation
  const stats = useMemo(() => {
    return [
      { label: 'Active Goals', value: resolvedKpis.filter(k => k.status !== 'Completed').length.toString(), icon: Target, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-950/20' },
      { label: 'Completed', value: resolvedKpis.filter(k => k.status === 'Completed').length.toString(), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
      { label: 'At Risk', value: resolvedKpis.filter(k => k.status === 'At Risk' || k.status === 'Delayed').length.toString(), icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' },
      { label: 'Avg Performance', value: avgPerformance, icon: BarChart3, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    ];
  }, [resolvedKpis, avgPerformance]);

  // Filtering Logic
  const filteredGoals = useMemo(() => {
    return resolvedKpis.filter(k => {
      const matchesTab = activeTab === 'All' ? true : 
                         activeTab === 'Active' ? k.status !== 'Completed' :
                         activeTab === 'Completed' ? k.status === 'Completed' :
                         activeTab === 'At Risk' ? (k.status === 'At Risk' || k.status === 'Delayed') : true;
      const titleLower = (k.title || '').toLowerCase();
      const nameLower = (k.name || '').toLowerCase();
      const queryLower = (searchQuery || '').toLowerCase();
      const matchesSearch = titleLower.includes(queryLower) || nameLower.includes(queryLower);
      return matchesTab && matchesSearch;
    });
  }, [resolvedKpis, activeTab, searchQuery]);

  const handleExport = () => {
    setIsExporting(true);
    showToast('Compiling KPI metrics report...', 'info');
    setTimeout(() => {
      try {
        const headers = ['Goal/Objective', 'Assigned To', 'Progress %', 'Deadline', 'Status', 'Category', 'Priority'];
        const rows = filteredGoals.map(g => [
          `"${(g.title || '').replace(/"/g, '""')}"`,
          `"${(g.name || '').replace(/"/g, '""')}"`,
          g.progress || 0,
          g.deadline || '',
          g.status || '',
          g.category || '',
          g.priority || ''
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `kpi_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('KPI report compiled and downloaded successfully!', 'success');
      } catch (err) {
        console.error('Export error:', err);
        showToast('Failed to export KPI report', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.employeeId) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    
    await addKpi({
      title: newGoal.title,
      assignedTo: teamMembers.find(m => m.id?.toString() === newGoal.employeeId?.toString())?.name || '',
      employeeId: newGoal.employeeId,
      progress: 0,
      status: 'On Track',
      priority: newGoal.priority,
      deadline: newGoal.deadline,
      category: newGoal.category
    });

    setShowAddModal(false);
    setNewGoal({ title: '', employeeId: '', category: 'Productivity', priority: 'Medium', deadline: '' });
  };

  const handleUpdateKPI = async (e) => {
    e.preventDefault();
    if (selectedGoal) {
      let updatedStatus = selectedGoal.status;
      if (selectedGoal.progress === 100) {
        updatedStatus = 'Completed';
      } else if (selectedGoal.progress < 30) {
        updatedStatus = 'At Risk';
      } else if (selectedGoal.progress < 70) {
        updatedStatus = 'Delayed';
      } else {
        updatedStatus = 'On Track';
      }

      await updateKpi(selectedGoal.id, { 
        title: selectedGoal.title,
        progress: selectedGoal.progress,
        priority: selectedGoal.priority,
        status: updatedStatus,
        feedback: feedback
      });
    }
    setSelectedGoal(null);
    setFeedback('');
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this performance goal?')) {
      await deleteKpi(id);
      if (selectedGoal && selectedGoal.id === id) {
        setSelectedGoal(null);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in relative">
      {/* Header Section */}
      <PageHeader
        title="KPI Tracking & Goals"
        subtitle="Track employee objectives, progress and team performance metrics"
      >
        <PermissionGate module="kpi_tracking" action="manage">
          <Button 
            variant="export" 
            size="sm"
            leftIcon={Download} 
            isLoading={isExporting} 
            onClick={handleExport}
          >
            Export KPI
          </Button>
        </PermissionGate>
        <PermissionGate module="kpi_tracking" action="create">
          <Button 
            variant="primary" 
            size="sm"
            leftIcon={Plus} 
            onClick={() => setShowAddModal(true)}
          >
            Add New Goal
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all flex items-center gap-4 text-left"
          >
            <div className={cn("p-3.5 rounded-2xl shrink-0", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Goals Filter & List Area */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
               {['Active', 'Completed', 'At Risk', 'All'].map((cat) => {
                  const count = cat === 'All' ? resolvedKpis.length :
                                cat === 'Active' ? resolvedKpis.filter(k => k.status !== 'Completed').length :
                                cat === 'Completed' ? resolvedKpis.filter(k => k.status === 'Completed').length :
                                resolvedKpis.filter(k => k.status === 'At Risk' || k.status === 'Delayed').length;

                  return (
                     <button 
                        key={cat} 
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                           "px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap border flex items-center gap-2 cursor-pointer",
                           activeTab === cat
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm border-slate-900 dark:border-white"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                     >
                        <span>{cat} Tracking</span>
                        <span className={cn(
                           "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                           activeTab === cat
                              ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                           {count}
                        </span>
                     </button>
                  );
               })}
            </div>
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by goal or employee..." 
                 className="h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none w-full shadow-sm" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
         </div>

         {/* Desktop Goal Table */}
         <div className="hidden md:block hcm-table-container">
            <table className="hcm-table">
               <thead className="hcm-thead">
                  <tr className="hcm-tr">
                     <th className="hcm-th">Goal / Objective</th>
                     <th className="hcm-th">Assigned To</th>
                     <th className="hcm-th text-center">Progress %</th>
                     <th className="hcm-th text-center">Deadline</th>
                     <th className="hcm-th text-center">Status</th>
                     <th className="hcm-th text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredGoals.length > 0 ? (
                     filteredGoals.map((goal) => (
                        <tr key={goal.id} className="hcm-tr">
                           <td className="hcm-td">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-slate-100 dark:border-slate-700 shrink-0">
                                    <Target size={20} />
                                 </div>
                                 <div className="text-left">
                                    <p className="font-extrabold text-slate-900 dark:text-white leading-tight">{goal.title}</p>
                                    <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                       {goal.category || 'Productivity'}
                                    </span>
                                 </div>
                              </div>
                           </td>
                           <td className="hcm-td">
                              <div className="flex items-center gap-3">
                                 <Avatar src={goal.img} alt={goal.name}/>
                                 <p className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">{goal.name}</p>
                              </div>
                           </td>
                           <td className="hcm-td">
                              <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                 <span className="text-xs font-extrabold text-slate-900 dark:text-white">{goal.progress}%</span>
                                 <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${goal.progress}%` }}
                                      className={cn(
                                         "h-full rounded-full transition-all",
                                         goal.status === 'Completed' ? "bg-emerald-500" : (goal.status === 'At Risk' || goal.status === 'Delayed') ? "bg-rose-500" : "bg-primary-500"
                                      )} 
                                    />
                                 </div>
                              </div>
                           </td>
                           <td className="hcm-td text-center whitespace-nowrap">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{goal.deadline || 'N/A'}</p>
                           </td>
                           <td className="hcm-td text-center">
                              <span className={cn(
                                 "text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold border inline-block whitespace-nowrap",
                                 goal.status === 'On Track' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" :
                                 goal.status === 'At Risk' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50" :
                                 goal.status === 'Completed' ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50" :
                                 "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
                              )}>
                                 {goal.status}
                              </span>
                           </td>
                           <td className="hcm-td text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                 <IconButton 
                                    icon={Edit} 
                                    variant="ghost" 
                                    tooltip="Edit Goal" 
                                    onClick={() => { setSelectedGoal(goal); setFeedback(goal.feedback || ''); }} 
                                 />
                                 <PermissionGate module="kpi_tracking" action="manage">
                                    <IconButton 
                                       icon={Trash2} 
                                       variant="danger" 
                                       tooltip="Delete Goal" 
                                       onClick={() => handleDeleteGoal(goal.id)} 
                                    />
                                 </PermissionGate>
                              </div>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr className="hcm-tr">
                        <td colSpan="6" className="hcm-td p-12 text-center">
                           <EmptyState
                              icon={Target}
                              title="No matching goals found"
                              description="No employee performance goals match your search filter."
                           />
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Mobile Responsive Cards */}
         <div className="block md:hidden space-y-4">
            {filteredGoals.length > 0 ? (
               filteredGoals.map((goal) => (
                  <div key={goal.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
                     {/* Header */}
                     <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-slate-100 dark:border-slate-700 shrink-0">
                              <Target size={20} />
                           </div>
                           <div>
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{goal.title}</h4>
                              <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                 {goal.category || 'Productivity'}
                              </span>
                           </div>
                        </div>
                        <span className={cn(
                           "text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold border shrink-0",
                           goal.status === 'On Track' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                           goal.status === 'At Risk' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400" :
                           goal.status === 'Completed' ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400" :
                           "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                        )}>
                           {goal.status}
                        </span>
                     </div>

                     {/* Details Grid */}
                     <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2.5">
                           <Avatar src={goal.img} alt={goal.name} size="sm"/>
                           <div>
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Assigned To</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{goal.name}</span>
                           </div>
                        </div>
                        <div>
                           <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Deadline</span>
                           <span className="font-extrabold text-slate-800 dark:text-slate-200">{goal.deadline || 'N/A'}</span>
                        </div>
                     </div>

                     {/* Progress bar */}
                     <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Progress</span>
                           <span className="font-extrabold text-slate-900 dark:text-white">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                           <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${goal.progress}%` }} 
                              className={cn(
                                 "h-full rounded-full transition-all",
                                 goal.status === 'Completed' ? "bg-emerald-500" : (goal.status === 'At Risk' || goal.status === 'Delayed') ? "bg-rose-500" : "bg-primary-500"
                              )} 
                           />
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedGoal(goal); setFeedback(goal.feedback || ''); }}>
                           Review & Edit
                        </Button>
                        <PermissionGate module="kpi_tracking" action="manage">
                           <Button variant="danger" size="sm" onClick={() => handleDeleteGoal(goal.id)}>
                              Delete
                           </Button>
                        </PermissionGate>
                     </div>
                  </div>
               ))
            ) : (
               <EmptyState
                  icon={Target}
                  title="No matching goals found"
                  description="No employee performance goals match your search filter."
               />
            )}
         </div>
      </div>

      {/* Goal Review & Edit Modal */}
      <CenterModal 
        isOpen={!!selectedGoal} 
        onClose={() => setSelectedGoal(null)} 
        title="Objective Performance Review"
      >
         {selectedGoal && (
            <form onSubmit={handleUpdateKPI} className="p-6 sm:p-8 space-y-6 text-left bg-white dark:bg-slate-900">
               <div className="p-5 sm:p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl relative overflow-hidden group text-left">
                  <div className="absolute top-0 right-0 p-6 opacity-10 text-white">
                     <Target size={120}/>
                  </div>
                  <div className="relative z-10 text-left">
                     <div className="flex items-center gap-2 mb-3">
                        <Zap size={16} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{selectedGoal.category || 'Productivity'} Objective</span>
                     </div>
                     <input
                        type="text"
                        className="text-xl sm:text-2xl font-black text-white dark:text-indigo-200 tracking-tight leading-tight w-full bg-transparent border-b border-white/20 focus:border-primary-400 focus:outline-none py-1"
                        value={selectedGoal.title || ''}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, title: e.target.value })}
                     />
                     
                     <div className="mt-6 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                           <Avatar src={selectedGoal.img} alt={selectedGoal.name} size="sm"/>
                           <div>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Assignee</p>
                              <p className="text-sm font-bold text-white">{selectedGoal.name}</p>
                           </div>
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden sm:block" />
                        <div>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Deadline</p>
                           <p className="text-sm font-bold text-white">{selectedGoal.deadline || 'N/A'}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between text-left">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievement Level</h4>
                     <span className="text-2xl font-black text-slate-900 dark:text-white">{selectedGoal.progress}%</span>
                  </div>
                  <input
                     type="range"
                     min="0"
                     max="100"
                     step="5"
                     className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                     value={selectedGoal.progress || 0}
                     onChange={(e) => setSelectedGoal({ ...selectedGoal, progress: parseInt(e.target.value) })}
                  />
                  <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${selectedGoal.progress}%` }}
                        className={cn(
                           "h-full rounded-full transition-all",
                           selectedGoal.progress === 100 ? "bg-emerald-500" : selectedGoal.progress < 30 ? "bg-rose-500" : "bg-primary-500"
                        )}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-left space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Override</p>
                     <select
                        className="bg-transparent font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-0 p-0 text-sm w-full cursor-pointer select-field"
                        value={selectedGoal.status}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, status: e.target.value })}
                     >
                        <option value="On Track" className="dark:bg-slate-900">On Track</option>
                        <option value="At Risk" className="dark:bg-slate-900">At Risk</option>
                        <option value="Delayed" className="dark:bg-slate-900">Delayed</option>
                        <option value="Completed" className="dark:bg-slate-900">Completed</option>
                     </select>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-left space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority Level</p>
                     <select
                        className="bg-transparent font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-0 p-0 text-sm w-full cursor-pointer select-field"
                        value={selectedGoal.priority}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, priority: e.target.value })}
                     >
                        <option value="Low" className="dark:bg-slate-900">Low</option>
                        <option value="Medium" className="dark:bg-slate-900">Medium</option>
                        <option value="High" className="dark:bg-slate-900">High</option>
                        <option value="Critical" className="dark:bg-slate-900">Critical</option>
                     </select>
                  </div>
               </div>

               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 form-label">
                     <MessageSquare size={16}/> Qualitative Feedback
                  </label>
                  <textarea 
                     className="input-field min-h-[90px] py-3 px-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium resize-none rounded-xl textarea-field" 
                     placeholder="Provide constructive feedback for the employee..."
                     value={feedback}
                     onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
               </div>

               <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                  <Button type="submit" variant="primary" className="w-full sm:flex-1" leftIcon={Save}>
                     Save Changes
                  </Button>
                  <Button type="button" variant="ghost" className="w-full sm:flex-1" onClick={() => { setSelectedGoal(null); setFeedback(''); }}>
                     Discard
                  </Button>
                  <PermissionGate module="kpi_tracking" action="manage">
                     <Button type="button" variant="danger" className="w-full sm:w-auto" leftIcon={Trash2} onClick={() => handleDeleteGoal(selectedGoal.id)}>
                        Delete
                     </Button>
                  </PermissionGate>
               </div>
            </form>
         )}
      </CenterModal>

      {/* Add New Goal Modal */}
      <CenterModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Assign Performance Goal"
      >
         <form onSubmit={handleAddGoal} className="p-6 space-y-5 text-left bg-white dark:bg-slate-900">
            <div className="space-y-1.5 text-left">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider form-label block">Goal Objective</label>
               <input 
                 type="text" 
                 placeholder="e.g. Automate CI/CD & Unit Test Suite Coverage" 
                 className="input-field h-11 font-bold text-sm text-slate-900 dark:text-white rounded-xl"
                 value={newGoal.title}
                 onChange={e => setNewGoal({...newGoal, title: e.target.value})}
               />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider form-label block">Assign to Member</label>
                  <select 
                    className="input-field h-11 font-semibold text-sm select-field text-slate-900 dark:text-white rounded-xl"
                    value={newGoal.employeeId}
                    onChange={e => setNewGoal({...newGoal, employeeId: e.target.value})}
                  >
                     <option value="" className="dark:bg-slate-900">Select Member</option>
                     {teamMembers.map(m => <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider form-label block">Category</label>
                  <select 
                    className="input-field h-11 font-semibold text-sm select-field text-slate-900 dark:text-white rounded-xl"
                    value={newGoal.category}
                    onChange={e => setNewGoal({...newGoal, category: e.target.value})}
                  >
                     <option className="dark:bg-slate-900">Productivity</option>
                     <option className="dark:bg-slate-900">Quality</option>
                     <option className="dark:bg-slate-900">Innovation</option>
                     <option className="dark:bg-slate-900">Leadership</option>
                     <option className="dark:bg-slate-900">Compliance</option>
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider form-label block">Target Deadline</label>
                  <DatePicker  
                    className="input-field h-11 font-semibold text-sm"
                    value={newGoal.deadline}
                    onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider form-label block">Priority Level</label>
                  <select 
                    className="input-field h-11 font-semibold text-sm select-field text-slate-900 dark:text-white rounded-xl"
                    value={newGoal.priority}
                    onChange={e => setNewGoal({...newGoal, priority: e.target.value})}
                  >
                     <option className="dark:bg-slate-900">Low</option>
                     <option className="dark:bg-slate-900">Medium</option>
                     <option className="dark:bg-slate-900">High</option>
                     <option className="dark:bg-slate-900">Critical</option>
                  </select>
               </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3 text-left">
               <Button type="submit" variant="primary" className="w-full sm:flex-1">
                  Set Objective
               </Button>
               <Button type="button" variant="ghost" className="w-full sm:flex-1" onClick={() => setShowAddModal(false)}>
                  Discard Draft
               </Button>
            </div>
         </form>
      </CenterModal>
    </div>
  );
};

export default KPITracking;

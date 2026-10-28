import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  GitMerge, 
  Edit3, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { approvalWorkflowAPI } from '../../utils/apiService';
import WorkflowBuilder from '../../components/settings/WorkflowBuilder';
import PageHeader from '../../shared/components/ui/PageHeader';

const MODULE_LABELS = {
  LeaveRequest: 'Leave Request',
  LEAVE_REQUEST: 'Leave Request',
  Reimbursement: 'Reimbursement & Claims',
  REIMBURSEMENT: 'Reimbursement & Claims',
  SalaryIncrementRequest: 'Salary Increment',
  SalaryIncrement: 'Salary Increment',
  ExitLifecycle: 'Exit & Offboarding',
  EXIT_LIFECYCLE: 'Exit & Offboarding',
  BenefitClaim: 'Reimbursement & Claims',
  BenefitEnrollment: 'Benefit Enrollment'
};

const ApprovalWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await approvalWorkflowAPI.getWorkflows();
      if (res.data?.success) {
        setWorkflows(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      showToast('Failed to load workflows. ' + (err.response?.data?.error?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreateNew = () => {
    setCurrentWorkflow(null);
    setIsEditing(true);
  };

  const handleEdit = (workflow) => {
    setCurrentWorkflow(workflow);
    setIsEditing(true);
  };

  const handleSave = async (workflowData) => {
    try {
      setIsSaving(true);
      if (currentWorkflow) {
        const res = await approvalWorkflowAPI.updateWorkflow(currentWorkflow.id, workflowData);
        showToast(`Workflow "${res.data?.data?.name || workflowData.name}" updated successfully (v${res.data?.data?.version || '2'}).`);
      } else {
        const res = await approvalWorkflowAPI.createWorkflow(workflowData);
        showToast(`Workflow "${res.data?.data?.name || workflowData.name}" created successfully.`);
      }
      setIsEditing(false);
      setCurrentWorkflow(null);
      await fetchWorkflows();
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Failed to save workflow. ' + (err.response?.data?.error?.message || err.message), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (workflow) => {
    try {
      const nextActive = !workflow.isActive;
      await approvalWorkflowAPI.toggleStatus(workflow.id, nextActive, nextActive ? 'Active' : 'Inactive');
      showToast(`Workflow status changed to ${nextActive ? 'Active' : 'Inactive'}.`);
      await fetchWorkflows();
    } catch (err) {
      console.error('Toggle status failed:', err);
      showToast('Failed to update workflow status.', 'error');
    }
  };

  const handleDelete = (workflow) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      id: workflow.id,
      title: 'Delete Workflow',
      message: `Are you sure you want to permanently delete "${workflow.name}"? If historical approval records exist, it will be safely archived.`
    });
  };

  const confirmAction = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ isOpen: false, type: null, id: null, title: '', message: '' });

    try {
      if (type === 'delete') {
        await approvalWorkflowAPI.hardDeleteWorkflow(id);
        showToast('Workflow deleted successfully.');
      }
      await fetchWorkflows();
    } catch (err) {
      console.error(`${type} failed:`, err);
      showToast(`Failed to ${type} workflow. ` + (err.response?.data?.error?.message || err.message), 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in focus:outline-none w-full text-left">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all transform duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header matching other Admin Panels */}
      <PageHeader
        title="Approval Workflows"
        description="Configure generic multi-step approval engines for various modules."
        actions={
          !isEditing && (
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={fetchWorkflows}
                disabled={loading}
                className="btn-secondary cursor-pointer"
                title="Sync latest workflows"
              >
                <RefreshCw size={15} className={cn(loading && "animate-spin text-primary-600")} />
                <span>Sync</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                className="btn-primary flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Create Workflow</span>
              </button>
            </div>
          )
        }
      />

      {/* Main Content Area */}
      {isEditing ? (
        <div className="transition-all duration-200">
          <WorkflowBuilder
            workflow={currentWorkflow}
            onSave={handleSave}
            onCancel={() => {
              setIsEditing(false);
              setCurrentWorkflow(null);
            }}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left hcm-table">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 hcm-thead">
                <tr className="border-b border-slate-100 dark:border-slate-800 hcm-tr">
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hcm-th"
                  >
                    WORKFLOW NAME
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hcm-th"
                  >
                    MODULE
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hcm-th"
                  >
                    VERSION
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hcm-th"
                  >
                    STATUS
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hcm-th"
                  >
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading workflows...</span>
                      </div>
                    </td>
                  </tr>
                ) : workflows.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <GitMerge className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Workflows Configured</p>
                        <p className="text-xs text-slate-400">Create an approval workflow to automate multi-step verification chains for expense claims, leave requests, and offboarding.</p>
                        <button
                          type="button"
                          onClick={handleCreateNew}
                          className="btn-primary text-xs flex items-center gap-1.5 mt-2 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Create First Workflow</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  workflows.map((wf) => {
                    const stepCount = wf.steps?.length || 0;
                    const isActive = wf.isActive && wf.status === 'Active';
                    const isArchived = wf.status === 'Archived';

                    return (
                      <tr key={wf.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition duration-150">
                        {/* Workflow Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                              <GitMerge className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{wf.name}</div>
                              {wf.description ? (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">{wf.description}</div>
                              ) : (
                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                  {stepCount} {stepCount === 1 ? 'approval step' : 'approval steps'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {MODULE_LABELS[wf.module] || wf.module}
                          </span>
                        </td>

                        {/* Version */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono font-semibold">
                          v{wf.version || 1}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase",
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : isArchived
                                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isActive ? 'bg-emerald-500' : isArchived ? 'bg-slate-400' : 'bg-amber-500'
                              )}
                            />
                            <span>{wf.status || (isActive ? 'Active' : 'Inactive')}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(wf)}
                              className="px-2.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition cursor-pointer"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(wf)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(wf)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'delete' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}
              >
                {confirmModal.type === 'delete' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <Archive className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400">Irreversible operational action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{confirmModal.message}</p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null, id: null, title: '', message: '' })}
                className="btn-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflows;

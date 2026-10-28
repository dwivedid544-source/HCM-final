import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  User, 
  GitMerge, 
  AlertCircle, 
  Loader2, 
  X,
  Check,
  Briefcase,
  ShieldCheck,
  Users
} from 'lucide-react';
import { adminAPI } from '../../utils/apiService';
import { cn } from '../../utils/cn';

const MODULE_OPTIONS = [
  { value: 'LeaveRequest', label: 'Leave Request', description: 'Time-off and paid leave approvals' },
  { value: 'Reimbursement', label: 'Reimbursement & Claims', description: 'Expense reports and medical benefit claims' },
  { value: 'SalaryIncrementRequest', label: 'Salary Increment', description: 'Compensation and salary adjustment requests' },
  { value: 'ExitLifecycle', label: 'Exit & Offboarding', description: 'Employee resignations and exit clearances' }
];

const PREDEFINED_ROLES = [
  { value: 'MANAGER', label: 'Reporting Manager' },
  { value: 'HR', label: 'HR Administrator' },
  { value: 'ADMIN', label: 'System Administrator' },
  { value: 'SUPERADMIN', label: 'Super Admin' }
];

const WorkflowBuilder = ({ workflow, onSave, onCancel, isSaving = false }) => {
  const [name, setName] = useState(workflow ? workflow.name : '');
  const [module, setModule] = useState(workflow ? workflow.module : 'LeaveRequest');
  const [description, setDescription] = useState(workflow ? (workflow.description || '') : '');
  const [isActive, setIsActive] = useState(workflow ? (workflow.isActive !== undefined ? workflow.isActive : true) : true);
  const [steps, setSteps] = useState(
    workflow && workflow.steps && workflow.steps.length > 0
      ? workflow.steps.map((s, idx) => ({
          sequence: s.sequence || (idx + 1),
          approverType: s.approverType || 'ROLE',
          approverRole: s.approverRole || 'MANAGER',
          isRequired: s.isRequired !== undefined ? s.isRequired : true,
          canSkip: s.canSkip !== undefined ? s.canSkip : false
        }))
      : [
          { sequence: 1, approverType: 'ROLE', approverRole: 'MANAGER', isRequired: true, canSkip: false }
        ]
  );

  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [validationError, setValidationError] = useState(null);

  // Load real users and roles for approver assignment
  useEffect(() => {
    let isMounted = true;
    const loadOrgData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.allSettled([
          adminAPI.getAllUsers(),
          adminAPI.getRoles ? adminAPI.getRoles() : Promise.resolve({ data: { data: [] } })
        ]);

        if (isMounted) {
          if (usersRes.status === 'fulfilled') {
            const rawUsers = usersRes.value?.data?.data || usersRes.value?.data || [];
            setAvailableUsers(Array.isArray(rawUsers) ? rawUsers : []);
          }
          if (rolesRes.status === 'fulfilled') {
            const rawRoles = rolesRes.value?.data?.data || rolesRes.value?.data || [];
            setAvailableRoles(Array.isArray(rawRoles) ? rawRoles : []);
          }
        }
      } catch (err) {
        console.warn('Could not load organizational users/roles for workflow builder:', err);
      }
    };

    loadOrgData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddStep = () => {
    setValidationError(null);
    const newSeq = steps.length + 1;
    setSteps([
      ...steps,
      {
        sequence: newSeq,
        approverType: 'ROLE',
        approverRole: 'HR',
        isRequired: true,
        canSkip: false
      }
    ]);
  };

  const handleRemoveStep = (index) => {
    setValidationError(null);
    if (steps.length <= 1) {
      setValidationError('At least one approval step is required for a workflow.');
      return;
    }
    const updated = steps.filter((_, i) => i !== index);
    // Re-sequence 1-indexed
    updated.forEach((s, idx) => {
      s.sequence = idx + 1;
    });
    setSteps(updated);
  };

  const handleMoveStep = (index, direction) => {
    setValidationError(null);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-sequence
    updated.forEach((s, idx) => {
      s.sequence = idx + 1;
    });
    setSteps(updated);
  };

  const handleChangeStep = (index, field, value) => {
    setValidationError(null);
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // If approverType changed, reset approverRole default
    if (field === 'approverType') {
      if (value === 'MANAGER') {
        updated[index].approverRole = 'MANAGER';
      } else if (value === 'ROLE') {
        updated[index].approverRole = 'HR';
      } else if (value === 'CUSTOM_ROLE') {
        updated[index].approverRole = availableRoles[0]?.name || 'Manager';
      } else if (value === 'SPECIFIC_USER') {
        const firstUser = availableUsers[0];
        updated[index].approverRole = firstUser?.email || firstUser?.role || 'HR';
      }
    }

    setSteps(updated);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Please provide a descriptive Workflow Name.');
      return;
    }

    if (!module) {
      setValidationError('Please select a target Module for this workflow.');
      return;
    }

    if (!steps || steps.length === 0) {
      setValidationError('A workflow must contain at least one approval step.');
      return;
    }

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (!s.approverRole || !String(s.approverRole).trim()) {
        setValidationError(`Step ${s.sequence || (i + 1)} is missing an assigned Approver.`);
        return;
      }
    }

    onSave({
      name: name.trim(),
      module,
      description: description.trim(),
      isActive,
      status: isActive ? 'Active' : 'Inactive',
      steps: steps.map((s, idx) => ({
        sequence: idx + 1,
        stepOrder: idx + 1,
        approverType: s.approverType,
        approverRole: s.approverRole,
        isRequired: Boolean(s.isRequired),
        canSkip: Boolean(s.canSkip)
      }))
    });
  };

  return (
    <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-soft max-w-4xl mx-auto animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 shadow-2xs">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {workflow ? 'Edit Approval Workflow' : 'Create Approval Workflow'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {workflow ? `Modifying version v${workflow.version || 1} • Changes will govern future approval requests` : 'Configure multi-step sequential approval chain for automated request handling'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start space-x-3 text-rose-800 dark:text-rose-200 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="flex-1 leading-relaxed">{validationError}</div>
        </div>
      )}

      {/* Workflow Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Workflow Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Workflow Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Executive Reimbursement Review"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Target Module */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Target Module <span className="text-rose-500">*</span>
            </label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide business context on when this approval workflow executes..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            />
          </div>

          {/* Active Status Card */}
          <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center space-x-3.5">
              <div className={cn("w-3 h-3 rounded-full transition-colors", isActive ? "bg-emerald-500" : "bg-slate-400")} />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isActive ? 'Active Workflow' : 'Inactive / Draft Mode'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isActive 
                    ? 'This workflow will immediately govern all new requests submitted for this module.' 
                    : 'Workflow is saved as draft and will not intercept live requests until activated.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {/* Approval Steps Section */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Approval Steps Chain
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-900/40">
                {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl transition-all shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Step sequence badge & re-order controls */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-xl bg-primary-600 text-white font-extrabold text-xs shadow-xs">
                      {step.sequence}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveStep(index, -1)}
                        className={cn(
                          "p-1.5 rounded-lg transition",
                          index === 0 
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
                        )}
                        title="Move Step Up"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        type="button"
                        disabled={index === steps.length - 1}
                        onClick={() => handleMoveStep(index, 1)}
                        className={cn(
                          "p-1.5 rounded-lg transition",
                          index === steps.length - 1 
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
                        )}
                        title="Move Step Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Approver Type & Assignment Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Approver Type */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Approver Type
                      </label>
                      <select
                        value={step.approverType}
                        onChange={(e) => handleChangeStep(index, 'approverType', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                      >
                        <option value="ROLE">System Role</option>
                        <option value="MANAGER">Reporting Manager</option>
                        <option value="SPECIFIC_USER">Specific User / Employee</option>
                        <option value="CUSTOM_ROLE">Custom Role</option>
                      </select>
                    </div>

                    {/* Approver Target */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Assigned Approver
                      </label>

                      {step.approverType === 'MANAGER' ? (
                        <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span>Direct Reporting Hierarchy Manager</span>
                        </div>
                      ) : step.approverType === 'ROLE' ? (
                        <select
                          value={step.approverRole}
                          onChange={(e) => handleChangeStep(index, 'approverRole', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                        >
                          {PREDEFINED_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : step.approverType === 'CUSTOM_ROLE' ? (
                        availableRoles.length > 0 ? (
                          <select
                            value={step.approverRole}
                            onChange={(e) => handleChangeStep(index, 'approverRole', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                          >
                            {availableRoles.map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={step.approverRole}
                            onChange={(e) => handleChangeStep(index, 'approverRole', e.target.value)}
                            placeholder="Enter custom role name"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                        )
                      ) : (
                        // SPECIFIC_USER
                        availableUsers.length > 0 ? (
                          <select
                            value={step.approverRole}
                            onChange={(e) => handleChangeStep(index, 'approverRole', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                          >
                            {availableUsers.map((u) => (
                              <option key={u.id} value={u.email || u.role}>
                                {u.employeeProfile?.fullName || u.email} ({u.role || 'Staff'})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={step.approverRole}
                            onChange={(e) => handleChangeStep(index, 'approverRole', e.target.value)}
                            placeholder="User Email or Identifier"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Conditions & Actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 shrink-0">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={step.isRequired}
                        onChange={(e) => handleChangeStep(index, 'isRequired', e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                      <span>Required</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={step.canSkip}
                        onChange={(e) => handleChangeStep(index, 'canSkip', e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                      />
                      <span>Can Skip</span>
                    </label>

                    <button
                      type="button"
                      disabled={steps.length <= 1}
                      onClick={() => handleRemoveStep(index)}
                      className={cn(
                        "p-2 rounded-xl transition",
                        steps.length <= 1
                          ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                      )}
                      title={steps.length <= 1 ? 'At least one step required' : 'Delete Step'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="btn-secondary text-xs px-4 py-2 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary text-xs px-5 py-2 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving Workflow...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>{workflow ? 'Save Changes' : 'Create Workflow'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkflowBuilder;

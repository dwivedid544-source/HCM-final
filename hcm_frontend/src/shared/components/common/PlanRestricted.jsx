import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { usePermissionContext } from '../../../context/PermissionContext';

const PlanRestricted = ({ moduleName, featureId }) => {
  const navigate = useNavigate();
  const { planName, isSuperAdmin } = usePermissionContext();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 px-4 py-12">
      <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700 max-w-lg w-full text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-indigo-200/50 dark:border-indigo-700/50">
          <Lock className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 mb-3">
          <Sparkles size={13} />
          <span>Subscription Plan Restriction</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {moduleName ? `${moduleName} Not Included` : 'Feature Not Included'}
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
          This SaaS module is not enabled for your organization's current{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {planName || 'Standard'}
          </span>{' '}
          subscription plan.
        </p>

        <p className="text-slate-400 dark:text-slate-500 text-xs mb-8">
          Platform administrators can adjust plan entitlements dynamically in SuperAdmin Feature Management, or upgrade the organization's tier to unlock immediate access.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/admin/billing')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            View Subscription Plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanRestricted;

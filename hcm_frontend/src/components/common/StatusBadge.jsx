import React from 'react';
import { cn } from '../../utils/cn';

export const StatusBadge = ({ status, className = '' }) => {
  const normalized = (status || '').toString().toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (['approved', 'present', 'on time', 'completed', 'active', 'paid', 'success'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-[#10B981] dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40';
  } else if (['pending', 'late', 'in progress', 'under review', 'on leave', 'warning'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-[#F59E0B] dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40';
  } else if (['rejected', 'absent', 'overdue', 'inactive', 'unpaid', 'danger', 'cancelled'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-[#EF4444] dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40';
  } else if (['submitted', 'info', 'processing'].includes(normalized)) {
    colorClasses = 'bg-indigo-50 text-[#4F46E5] dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize shrink-0',
        colorClasses,
        className
      )}
    >
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;

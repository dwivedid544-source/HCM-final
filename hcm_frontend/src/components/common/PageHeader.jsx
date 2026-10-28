import React from 'react';
import { cn } from '../../utils/cn';

export const PageHeader = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 text-left mb-6', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

import React from 'react';
import { cn } from '../../../utils/cn';

export const PageHeader = ({
  title,
  subtitle,
  description,
  icon: Icon,
  actions,
  children,
  className
}) => {
  const subText = description || subtitle;
  const headerActions = actions || children;

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="hcm-page-title">
          {Icon && <Icon className="text-primary-600 dark:text-primary-400 shrink-0" size={32} />}
          <span>{title}</span>
        </h1>
        {subText && <p className="hcm-page-subtitle">{subText}</p>}
      </div>
      {headerActions && (
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-start sm:self-auto">
          {headerActions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

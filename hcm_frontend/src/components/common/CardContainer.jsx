import React from 'react';
import { cn } from '../../utils/cn';

export const CardContainer = ({ children, className = '', ...props }) => {
  return (
    <div
      className={cn(
        'bg-[#FFFFFF] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs text-left',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default CardContainer;

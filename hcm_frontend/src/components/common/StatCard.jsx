import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'primary',
  className = '',
  onClick
}) => {
  const getColorStyles = (c) => {
    switch (c) {
      case 'emerald':
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-[#10B981]';
      case 'amber':
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/40 text-[#F59E0B]';
      case 'rose':
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/40 text-[#EF4444]';
      case 'indigo':
      case 'primary':
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5]';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        'bg-[#FFFFFF] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all duration-300 text-left',
        onClick && 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        {Icon && (
          <div className={cn('p-3 rounded-xl shrink-0 flex items-center justify-center', getColorStyles(color))}>
            <Icon size={22} />
          </div>
        )}
        {trend && (
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider">
          {label}
        </p>
        <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight tabular-nums truncate">
          {value}
        </h3>
        {sub && (
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;

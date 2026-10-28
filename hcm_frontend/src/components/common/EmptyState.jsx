import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  heading,
  description,
  message,
  subtitle,
  action,
  className = ''
}) => {
  const displayTitle = title || heading || 'No Data Available';
  const displayDescription = description !== undefined ? description : (message !== undefined ? message : subtitle);

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    if (typeof action === 'object' && (action.label || action.onClick || action.onAction)) {
      const ActionIcon = action.icon;
      const handleClick = action.onClick || action.onAction;
      return (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer',
            action.className
          )}
        >
          {ActionIcon && (
            React.isValidElement(ActionIcon) ? ActionIcon : <ActionIcon size={15} strokeWidth={2.5} />
          )}
          <span>{action.label}</span>
        </button>
      );
    }
    return null;
  };

  const renderIcon = () => {
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'function') return <Icon size={30} strokeWidth={1.75} />;
    return <Inbox size={30} strokeWidth={1.75} />;
  };

  return (
    <div className={cn('p-12 text-center flex flex-col items-center justify-center my-auto', className)}>
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-xs">
        {renderIcon()}
      </div>
      <h4 className="text-base font-extrabold text-[#111827] dark:text-white tracking-tight">
        {displayTitle}
      </h4>
      {displayDescription && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
          {displayDescription}
        </p>
      )}
      {action && <div className="mt-5">{renderAction()}</div>}
    </div>
  );
};

export default EmptyState;


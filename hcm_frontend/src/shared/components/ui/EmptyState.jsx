import React from 'react';
import { FileSearch } from 'lucide-react';
import { cn } from '../../../utils/cn';

const EmptyState = ({
  icon: Icon = FileSearch,
  title = "No records found",
  heading,
  description,
  message,
  subtitle,
  action,
  className
}) => {
  const displayTitle = title || heading || "No records found";
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
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer mt-4',
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
    if (typeof Icon === 'function') return <Icon size={40} />;
    return <FileSearch size={40} />;
  };

  return (
    <div className={cn("py-16 px-4 text-center flex flex-col items-center justify-center opacity-80", className)}>
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 text-slate-400 dark:text-slate-500">
        {renderIcon()}
      </div>
      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-1">{displayTitle}</h4>
      {displayDescription && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-2">{displayDescription}</p>}
      {renderAction()}
    </div>
  );
};

export default EmptyState;


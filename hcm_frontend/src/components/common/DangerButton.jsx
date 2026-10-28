import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const DangerButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  icon: Icon,
  fullWidth = false,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'h-10 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs',
        'bg-[#EF4444] hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30',
        disabled && 'opacity-60 cursor-not-allowed active:scale-100',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default DangerButton;

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const PrimaryButton = ({
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
        'h-10 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm',
        'bg-[#4F46E5] hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30',
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

export default PrimaryButton;

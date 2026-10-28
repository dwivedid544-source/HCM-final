import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../../utils/cn';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const Avatar = ({ src, alt, name, size = 'md', className, iconClassName }) => {
  const [imageError, setImageError] = useState(false);
  const isImageValid = src && typeof src === 'string' && src.trim() !== '' && !imageError;
  const sizeClasses = sizeMap[size] || sizeMap.md;

  const displayName = alt || name || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  if (isImageValid) {
    return (
      <img
        src={src}
        alt={displayName || 'Avatar'}
        onError={() => setImageError(true)}
        className={cn('rounded-full object-cover shrink-0 border border-slate-200/60 dark:border-slate-800', sizeClasses, className)}
      />
    );
  }

  if (initials) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shrink-0 border border-primary-200/60 dark:border-primary-800/40 select-none',
          sizeClasses,
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0 border border-slate-200/60 dark:border-slate-800',
        sizeClasses,
        className
      )}
    >
      <User className={cn('w-1/2 h-1/2', iconClassName)} />
    </div>
  );
};

export default Avatar;

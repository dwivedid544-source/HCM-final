import React, { useState, useMemo } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Enterprise UserAvatar component with 3-tier fallback:
 * 1. Valid avatar image (onError cascades to initials)
 * 2. Initials badge (e.g. "SA" for "Super Admin")
 * 3. Generic Lucide User icon
 */
export const UserAvatar = ({
  user,
  size = 'md',
  className,
  ring = true
}) => {
  const [imageError, setImageError] = useState(false);

  const avatarUrl = user?.avatar || user?.avatarUrl;

  const initials = useMemo(() => {
    const rawName = user?.name || user?.fullName;
    if (!rawName) return '';
    const parts = rawName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return rawName.slice(0, 2).toUpperCase();
  }, [user?.name, user?.fullName]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
    '3xl': 'w-32 h-32 text-3xl'
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64
  };

  const ringClass = ring ? 'ring-2 ring-slate-100 dark:ring-slate-800' : '';
  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentIconSize = iconSizes[size] || 20;

  // 1. Valid avatar image
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name || user?.fullName || 'User avatar'}
        onError={() => setImageError(true)}
        className={cn(
          "rounded-xl object-cover shrink-0 select-none",
          currentSizeClass,
          ringClass,
          className
        )}
      />
    );
  }

  // 2. Initials fallback badge
  if (initials) {
    return (
      <div
        className={cn(
          "rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-extrabold flex items-center justify-center shrink-0 select-none shadow-xs tracking-wider",
          currentSizeClass,
          ringClass,
          className
        )}
        title={user?.name || user?.fullName || 'User'}
      >
        {initials}
      </div>
    );
  }

  // 3. Generic user icon
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 select-none",
        currentSizeClass,
        ringClass,
        className
      )}
    >
      <User size={currentIconSize} />
    </div>
  );
};

export default UserAvatar;

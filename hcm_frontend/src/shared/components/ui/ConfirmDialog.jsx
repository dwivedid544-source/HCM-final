import React from 'react';
import CenterModal from '../layout/CenterModal';
import { AlertTriangle, Info, CheckCircle2, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

const TYPE_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40',
    confirmButtonClass: 'btn-danger',
    defaultConfirmText: 'Delete'
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40',
    confirmButtonClass: 'btn-primary',
    defaultConfirmText: 'Continue'
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40',
    confirmButtonClass: 'btn-primary',
    defaultConfirmText: 'Confirm'
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40',
    confirmButtonClass: 'btn-success',
    defaultConfirmText: 'Done'
  }
};

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText,
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
  maxWidth = "max-w-md"
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.danger;
  const Icon = config.icon;

  return (
    <CenterModal isOpen={isOpen} onClose={onClose} maxWidth={maxWidth}>
      <div className="p-6 sm:p-8 text-center space-y-4">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm", config.iconBg)}>
          <Icon size={26} />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-3">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={cn(config.confirmButtonClass, "flex-1")}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <span>{confirmText || config.defaultConfirmText}</span>
            )}
          </button>
        </div>
      </div>
    </CenterModal>
  );
};

export default ConfirmDialog;

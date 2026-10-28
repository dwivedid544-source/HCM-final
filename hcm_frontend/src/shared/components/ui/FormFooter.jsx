import React from 'react';
import { cn } from '../../../utils/cn';

const FormFooter = ({
  onCancel,
  cancelText = 'Cancel',
  saveText = 'Save Changes',
  loading = false,
  disabled = false,
  className
}) => {
  return (
    <div className={cn('form-footer', className)}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}>
          {cancelText}
        </button>
      )}
      <button
        type="submit"
        disabled={loading || disabled}>
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Saving...</span>
          </div>
        ) : (
          saveText
        )}
      </button>
    </div>
  );
};

export default FormFooter;

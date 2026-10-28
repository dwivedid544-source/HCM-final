import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

const TablePagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  className
}) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn("hcm-pagination", className)}>
      <span className="text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-900 dark:text-white">{start}</span> to{' '}
        <span className="font-bold text-slate-900 dark:text-white">{end}</span> of{' '}
        <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> entries
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          type="button"
          aria-label="Previous Page"
          className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 min-h-[36px] disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>
        <span className="text-xs px-2 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          type="button"
          aria-label="Next Page"
          className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 min-h-[36px] disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;

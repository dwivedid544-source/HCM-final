import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import EmptyState from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no items to display at this time.',
  emptyIcon,
  renderMobileCard,
  onRowClick,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={32} className="animate-spin text-[#4F46E5] mb-3" />
        <p className="text-xs font-medium">Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={cn(
                    'px-6 py-4 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.headerClassName
                  )}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={cn(
                      'px-6 py-4 text-xs font-medium text-slate-800 dark:text-slate-200',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-3 p-4">
        {data.map((row, rowIdx) => (
          <div
            key={row.id || rowIdx}
            onClick={() => onRowClick && onRowClick(row)}
            className={cn(
              'bg-[#FFFFFF] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 text-left',
              onRowClick && 'cursor-pointer active:scale-[0.99] transition-transform'
            )}
          >
            {renderMobileCard ? (
              renderMobileCard(row, rowIdx)
            ) : (
              <div className="space-y-2">
                {columns.map((col, colIdx) => (
                  <div key={col.key || colIdx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px]">
                      {col.title}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;

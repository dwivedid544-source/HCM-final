import React from 'react';
import { Search, RotateCcw, Download } from 'lucide-react';
import { cn } from '../../../utils/cn';

const FilterBar = ({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onReset,
  onExport,
  exportLabel = 'Export',
  children,
  className
}) => {
  return (
    <div className={cn('hcm-filter-bar', className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
        {onSearchChange !== undefined && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-field pl-10 w-full"
            />
          </div>
        )}

        {filters.map((f, idx) => (
          <select
            key={idx}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            {f.options.map((opt, oIdx) => (
              <option key={oIdx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {children}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="btn-secondary"
          >
            <Download size={16} />
            <span>{exportLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

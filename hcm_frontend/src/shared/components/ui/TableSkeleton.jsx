import React from 'react';

const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx}>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableSkeleton;

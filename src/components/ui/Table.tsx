import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
}

interface TableBodyProps {
  children: ReactNode;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeaderCellProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('min-w-full divide-y divide-gray-200 border-collapse', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return <thead className="bg-gray-50 sticky top-0">{children}</thead>;
};

export const TableBody: React.FC<TableBodyProps> = ({ children }) => {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
};

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '', 
  onClick 
}) => {
  return (
    <tr 
      className={clsx(
        'border-b border-gray-100',
        onClick && 'hover:bg-gray-50 cursor-pointer transition-colors duration-150',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <th className={clsx('px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '',
  colSpan
}) => {
  return (
    <td className={clsx('px-4 py-3 text-sm text-gray-900', className)} colSpan={colSpan}>
      {children}
    </td>
  );
};
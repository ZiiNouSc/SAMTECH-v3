import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface ListViewProps {
  children: ReactNode;
  className?: string;
}

const ListView: React.FC<ListViewProps> = ({ children, className = '' }) => {
  return (
    <div className={clsx('space-y-3', className)}>
      {children}
    </div>
  );
};

export default ListView;
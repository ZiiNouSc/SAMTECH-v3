import React from 'react';
import { Grid, List, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';

interface ViewToggleProps {
  currentView: 'table' | 'grid' | 'list';
  onViewChange: (view: 'table' | 'grid' | 'list') => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange, className = '' }) => {
  const views = [
    { id: 'table' as const, icon: List, label: 'Tableau' }, 
    { id: 'grid' as const, icon: LayoutGrid, label: 'Grille' }, 
    { id: 'list' as const, icon: Grid, label: 'Liste' } 
  ];

  return (
    <div className={clsx('flex items-center bg-gray-100 rounded-md p-1', className)}>
      {(Array.isArray(views) ? views : []).map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={clsx(
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              currentView === view.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900' 
            )}
            title={view.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
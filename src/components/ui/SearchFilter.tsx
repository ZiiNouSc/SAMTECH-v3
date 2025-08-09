import React, { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';

interface FilterOption {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
  onClearFilters?: () => void;
  placeholder?: string;
  showDateFilter?: boolean;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchValue,
  onSearchChange, 
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  placeholder = "Rechercher...",
  showDateFilter = false,
  dateRange,
  onDateRangeChange
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some(value => value && value !== 'tous');

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(Array.isArray(filters) ? filters : []).length > 0 && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={clsx(
                'flex items-center px-3 py-2 border rounded-lg font-medium transition-colors',
                showAdvancedFilters || hasActiveFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(activeFilters).filter(v => v && v !== 'tous').length}
                </span>
              )}
            </button>
          )}

          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters} 
              className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Array.isArray(filters) ? filters : []).map((filter) => (
              <div key={filter.id} className="relative">
                <select
                  value={activeFilters[filter.id] || ''}
                  onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{filter.label}</option>
                  {(filter.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}

            {showDateFilter && onDateRangeChange && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input 
                    type="date"
                    value={dateRange?.start || ''}
                    onChange={(e) => onDateRangeChange({
                      start: e.target.value,
                      end: dateRange?.end || ''
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={dateRange?.end || ''}
                    onChange={(e) => onDateRangeChange({
                      start: dateRange?.start || '',
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
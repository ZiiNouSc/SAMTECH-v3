import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  IconButton,
  Input,
  Select,
  Option,
  Chip,
} from '@material-tailwind/react';
import { MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface ArgonTableProps {
  title?: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  loading?: boolean;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: {
    view?: (row: any) => void;
    edit?: (row: any) => void;
    delete?: (row: any) => void;
    custom?: Array<{
      icon: React.ComponentType<any>;
      onClick: (row: any) => void;
      color?: string;
      label?: string;
    }>;
  };
  headerActions?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    totalItems: number;
  };
  emptyMessage?: string;
  className?: string;
}

const ArgonTable: React.FC<ArgonTableProps> = ({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  searchable = true,
  searchValue = '',
  onSearchChange,
  actions,
  headerActions,
  pagination,
  emptyMessage = 'Aucune donnée disponible',
  className = '',
}) => {
  const hasActions = actions && (actions.view || actions.edit || actions.delete || actions.custom);

  const TABLE_HEAD = [
    ...columns.map(col => col.label),
    ...(hasActions ? ['Actions'] : [])
  ];

  const renderCellValue = (column: Column, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return (
        <Chip
          size="sm"
          variant="ghost"
          value={value ? 'Oui' : 'Non'}
          color={value ? 'green' : 'red'}
        />
      );
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR');
    }
    
    return String(value);
  };

  const renderActionButtons = (row: any) => {
    if (!hasActions) return null;

    return (
      <div className="flex gap-2">
        {actions?.view && (
          <IconButton
            variant="text"
            size="sm"
            onClick={() => actions.view!(row)}
            className="text-blue-500 hover:bg-blue-50"
          >
            <EyeIcon className="h-4 w-4" />
          </IconButton>
        )}
        {actions?.edit && (
          <IconButton
            variant="text"
            size="sm"
            onClick={() => actions.edit!(row)}
            className="text-green-500 hover:bg-green-50"
          >
            <PencilIcon className="h-4 w-4" />
          </IconButton>
        )}
        {actions?.delete && (
          <IconButton
            variant="text"
            size="sm"
            onClick={() => actions.delete!(row)}
            className="text-red-500 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </IconButton>
        )}
        {actions?.custom?.map((customAction, index) => (
          <IconButton
            key={index}
            variant="text"
            size="sm"
            onClick={() => customAction.onClick(row)}
            className={`text-${customAction.color || 'gray'}-500 hover:bg-${customAction.color || 'gray'}-50`}
            title={customAction.label}
          >
            <customAction.icon className="h-4 w-4" />
          </IconButton>
        ))}
      </div>
    );
  };

  return (
    <Card className={`h-full w-full ${className}`}>
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            {title && (
              <Typography variant="h5" color="blue-gray">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography color="gray" className="mt-1 font-normal">
                {subtitle}
              </Typography>
            )}
          </div>
          <div className="flex w-full shrink-0 gap-2 md:w-max">
            {searchable && (
              <div className="w-full md:w-72">
                <Input
                  label="Rechercher"
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  crossOrigin=""
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-scroll px-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-gray-500">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              {emptyMessage}
            </Typography>
          </div>
        ) : (
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head) => (
                  <th
                    key={head}
                    className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal leading-none opacity-70"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const isLast = index === data.length - 1;
                const classes = isLast
                  ? "p-4"
                  : "p-4 border-b border-blue-gray-50";

                return (
                  <tr key={row.id || index} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className={classes} style={{ width: column.width }}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {renderCellValue(column, row)}
                        </Typography>
                      </td>
                    ))}
                    {hasActions && (
                      <td className={classes}>
                        {renderActionButtons(row)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardBody>
      
      {pagination && (
        <div className="flex items-center justify-between border-t border-blue-gray-50 p-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Page {pagination.currentPage} sur {pagination.totalPages} 
            ({pagination.totalItems} éléments)
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outlined"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ArgonTable; 
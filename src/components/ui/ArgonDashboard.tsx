import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  IconButton,
  Button,
} from '@material-tailwind/react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  trend?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  footer?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  footer,
  className = '',
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    orange: 'bg-orange-500 text-white',
    purple: 'bg-purple-500 text-white',
  };

  return (
    <Card className={`${className}`}>
      <CardHeader
        variant="gradient"
        className={`absolute -mt-4 grid h-16 w-16 place-items-center ${colorClasses[color]}`}
      >
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardBody className="p-4 text-right">
        <Typography variant="small" className="font-normal text-blue-gray-600">
          {title}
        </Typography>
        <Typography variant="h4" color="blue-gray">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </Typography>
      </CardBody>
      {(trend || footer) && (
        <CardFooter className="border-t border-blue-gray-50 p-4">
          <div className="flex items-center justify-between">
            {trend && (
              <div className="flex items-center gap-1">
                {trend.type === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <Typography
                  variant="small"
                  className={`font-medium ${
                    trend.type === 'increase' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {trend.value}%
                </Typography>
                {trend.period && (
                  <Typography variant="small" className="text-blue-gray-400">
                    {trend.period}
                  </Typography>
                )}
              </div>
            )}
            {footer && (
              <Typography variant="small" className="text-blue-gray-400">
                {footer}
              </Typography>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
}) => {
  return (
    <Card className={`${className}`}>
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="flex items-center justify-between gap-8">
          <div>
            <Typography variant="h5" color="blue-gray">
              {title}
            </Typography>
            {subtitle && (
              <Typography color="gray" className="mt-1 font-normal">
                {subtitle}
              </Typography>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardBody className="px-2 pb-0">
        {children}
      </CardBody>
    </Card>
  );
};

interface InfoCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  actions?: React.ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  children,
  icon: Icon,
  color = 'blue',
  actions,
  className = '',
}) => {
  const colorClasses = {
    blue: 'border-t-blue-500',
    green: 'border-t-green-500',
    red: 'border-t-red-500',
    orange: 'border-t-orange-500',
    purple: 'border-t-purple-500',
  };

  return (
    <Card className={`border-t-4 ${colorClasses[color]} ${className}`}>
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className={`p-3 rounded-lg bg-${color}-50`}>
                <Icon className={`h-6 w-6 text-${color}-500`} />
              </div>
            )}
            <div>
              <Typography variant="h6" color="blue-gray">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="small" color="gray">
                  {subtitle}
                </Typography>
              )}
            </div>
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardBody className="pt-4">
        {children}
      </CardBody>
    </Card>
  );
};

interface DashboardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  cols = 4,
  gap = 6,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={`grid ${gridCols[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Typography variant="h4" color="blue-gray">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="paragraph" color="gray" className="mt-1">
              {subtitle}
            </Typography>
          )}
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  StatCard,
  ChartCard,
  InfoCard,
  DashboardGrid,
  PageHeader,
}; 
import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white/80 rounded-2xl shadow-lg p-6 animate-fade-in ${className}`}>
    {children}
  </div>
);

export default Card;
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => (
  <button
    className={`bg-gradient-to-r from-[#A259F7] to-[#2ED8FF] text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:scale-105 hover:shadow-xl transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </button>
);
Button.displayName = 'Button';
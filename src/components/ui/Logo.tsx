import React from 'react';
import samtechLogo from '../../samtech.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo SamTech */}
      <img 
        src={samtechLogo} 
        alt="SamTech Logo" 
        className={`${sizeClasses[size]} object-contain transition-shadow duration-500 drop-shadow-lg hover:drop-shadow-[0_0_20px_#A259F7]`}
      />
    </div>
  );
};

export default Logo;

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

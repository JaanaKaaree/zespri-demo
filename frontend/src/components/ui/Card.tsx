import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      {...props}
    >
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
};

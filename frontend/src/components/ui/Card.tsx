import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Card = ({ children, className = '', title, description }: CardProps) => {
  return (
    <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-lg overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-[#2A2A2A]">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

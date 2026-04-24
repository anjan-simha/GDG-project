import React from 'react';

interface Props {
  className?: string;
}

export const SkeletonLoader: React.FC<Props> = ({ className = "h-32 w-full" }) => {
  return (
    <div className={`rounded-lg bg-grid-panel bg-gradient-to-r from-grid-panel via-grid-slate to-grid-panel bg-[length:400%_100%] animate-shimmer ${className}`}>
    </div>
  );
};

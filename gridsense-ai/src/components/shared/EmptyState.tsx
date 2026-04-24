import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-border-subtle bg-grid-panel/50">
      <Icon className="text-text-muted mb-4" size={48} />
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-transparent border border-border-active text-cyan-electric text-sm font-medium rounded hover:bg-cyan-electric/10 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

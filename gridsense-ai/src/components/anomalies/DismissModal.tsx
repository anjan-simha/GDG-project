import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => void;
}

export const DismissModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('Seasonal Event');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-grid-navy/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-grid-panel border border-border-subtle rounded-lg shadow-xl animate-fade-in-up">
        <h3 className="text-lg font-medium text-text-primary mb-4">Dismiss Anomaly Flag</h3>
        <p className="text-sm text-text-secondary mb-4">Please provide a reason code for dismissing this flag to maintain auditability.</p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Reason Code</label>
            <select 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              className="w-full bg-grid-slate border border-border-subtle text-text-primary text-sm rounded px-3 py-2 outline-none focus:border-cyan-electric"
            >
              <option value="Seasonal Event">Seasonal Event</option>
              <option value="Known Maintenance">Known Maintenance</option>
              <option value="Data Gap">Data Gap</option>
              <option value="Peer Group Error">Peer Group Error</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Optional Notes</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-grid-slate border border-border-subtle text-text-primary text-sm rounded px-3 py-2 outline-none focus:border-cyan-electric min-h-[80px]"
              placeholder="Provide additional context..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-transparent text-text-secondary text-sm font-medium rounded hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(reason, notes)}
            className="px-4 py-2 bg-risk-high text-white text-sm font-medium rounded hover:bg-risk-critical transition-colors"
          >
            Confirm Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

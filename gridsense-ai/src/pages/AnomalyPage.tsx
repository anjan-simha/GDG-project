import React, { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAppStore } from '../store/useAppStore';
import { AnomalyFlagCard } from '../components/anomalies/AnomalyFlagCard';
import { DismissModal } from '../components/anomalies/DismissModal';

export const AnomalyPage: React.FC = () => {
  const { anomalyFlags, dismissFlag, zones } = useAppStore();
  const [activeFlag, setActiveFlag] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const filteredFlags = anomalyFlags.filter(f => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (zoneFilter !== 'ALL' && f.zoneId !== zoneFilter) return false;
    return true;
  });

  const handleDismiss = (reason: string, notes: string) => {
    if (activeFlag) {
      dismissFlag(activeFlag, reason, notes);
      setActiveFlag(null);
    }
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">Anomaly & Theft Detection</h2>
        <p className="text-text-secondary">Review and manage detected anomalies across the network.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-grid-panel border border-border-subtle rounded-lg">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium uppercase">Status</label>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-grid-slate border border-border-subtle text-text-primary text-sm rounded px-3 py-1.5 outline-none focus:border-cyan-electric min-w-[150px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium uppercase">Zone</label>
          <select 
            value={zoneFilter} 
            onChange={e => setZoneFilter(e.target.value)}
            className="bg-grid-slate border border-border-subtle text-text-primary text-sm rounded px-3 py-1.5 outline-none focus:border-cyan-electric min-w-[150px]"
          >
            <option value="ALL">All Zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.id}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-4xl">
        {filteredFlags.length > 0 ? (
          filteredFlags.map(flag => (
            <AnomalyFlagCard key={flag.flagId} flag={flag} onDismiss={() => setActiveFlag(flag.flagId)} />
          ))
        ) : (
          <div className="p-8 text-center text-text-muted bg-grid-panel border border-dashed border-border-subtle rounded-lg">
            No anomalies match the selected filters.
          </div>
        )}
      </div>

      <DismissModal 
        isOpen={!!activeFlag} 
        onClose={() => setActiveFlag(null)} 
        onConfirm={handleDismiss} 
      />
    </PageWrapper>
  );
};

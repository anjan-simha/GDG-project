import React, { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { AnomalyFlagCard } from '../components/anomalies/AnomalyFlagCard';
import { DismissModal } from '../components/anomalies/DismissModal';
import { useAnomalies, useDismissFlag, useConfirmFlag, useReviewFlag, useRunAnomalyScan } from '../hooks/useAnomalies';
import { useZones } from '../hooks/useZones';
import { SkeletonLoader } from '../components/shared/SkeletonLoader';
import { Activity } from 'lucide-react';

export const AnomalyPage: React.FC = () => {
  const [activeFlag, setActiveFlag] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const filters: any = {};
  if (statusFilter !== 'ALL') filters.status = statusFilter;
  if (zoneFilter !== 'ALL') filters.zone_id = zoneFilter;

  const { data: anomalyFlags, isLoading } = useAnomalies(filters);
  const { data: zones } = useZones();
  
  const dismissMutation = useDismissFlag();
  const confirmMutation = useConfirmFlag();
  const reviewMutation = useReviewFlag();
  const scanMutation = useRunAnomalyScan();

  const handleDismiss = (reason: string, notes: string) => {
    if (activeFlag) {
      dismissMutation.mutate({ id: activeFlag, payload: { reason_code: reason, notes } });
      setActiveFlag(null);
    }
  };

  const handleConfirm = (id: string) => {
    confirmMutation.mutate(id);
  };

  const handleReview = (id: string) => {
    reviewMutation.mutate(id);
  };

  const handleScan = () => {
    scanMutation.mutate();
  };

  return (
    <PageWrapper>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">Anomaly & Theft Detection</h2>
          <p className="text-text-secondary">Review and manage detected anomalies across the network.</p>
        </div>
        <button 
          onClick={handleScan}
          disabled={scanMutation.isPending}
          className="bg-navy-lighter hover:bg-navy-light text-cyan-electric border border-cyan-electric/30 px-4 py-2 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Activity size={18} className={scanMutation.isPending ? "animate-spin" : ""} />
          {scanMutation.isPending ? "Scanning..." : "Run Scan"}
        </button>
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
            <option value="UNDER_REVIEW">Under Review</option>
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
            {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.id}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonLoader key={i} className="h-48 w-full" />)}
          </div>
        ) : anomalyFlags && anomalyFlags.length > 0 ? (
          anomalyFlags.map((flag: any) => (
            <AnomalyFlagCard 
              key={flag.id} 
              flag={flag} 
              onDismiss={() => setActiveFlag(flag.id)} 
              onConfirm={() => handleConfirm(flag.id)}
              onReview={() => handleReview(flag.id)}
            />
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

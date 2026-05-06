import React from 'react';
import { useParams } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useZoneDetail, useZoneMeters } from '../hooks/useZones';
import { useForecasts } from '../hooks/useForecasts';
import { useAnomalies } from '../hooks/useAnomalies';
import { StatusBadge } from '../components/shared/StatusBadge';
import { DemandForecastChart } from '../components/forecasting/DemandForecastChart';
import { EmptyState } from '../components/shared/EmptyState';
import { Map, AlertTriangle } from 'lucide-react';
import { SkeletonLoader } from '../components/shared/SkeletonLoader';
import { InspectionReport } from '../components/intelligence/InspectionReport';

export const ZoneDetailPage: React.FC = () => {
  const { zoneId } = useParams<{ zoneId: string }>();
  
  const { data: zone, isLoading: isLoadingZone } = useZoneDetail(zoneId || '');
  const { data: zoneForecasts, isLoading: isLoadingForecasts } = useForecasts({ zone_id: zoneId });
  const { data: zoneFlags, isLoading: isLoadingFlags } = useAnomalies({ zone_id: zoneId });
  const { data: meters, isLoading: isLoadingMeters } = useZoneMeters(zoneId || '');

  if (isLoadingZone) {
    return (
      <PageWrapper>
        <div className="space-y-6">
          <SkeletonLoader className="h-16 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonLoader className="h-24" />
            <SkeletonLoader className="h-24" />
            <SkeletonLoader className="h-24" />
          </div>
          <SkeletonLoader className="h-80 w-full" />
        </div>
      </PageWrapper>
    );
  }

  if (!zone) {
    return (
      <PageWrapper>
        <EmptyState icon={Map} title="Zone Not Found" description={`We could not find data for zone ${zoneId}.`} />
      </PageWrapper>
    );
  }

  // Next 1h forecast logic (take the first forecast that is in the future, or just the first one if mock)
  const nextForecast = zoneForecasts && zoneForecasts.length > 0 ? zoneForecasts[0] : null;

  return (
    <PageWrapper>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">{zone.id} · {zone.name}</h2>
          <p className="text-text-secondary">Last updated: {zone.last_updated ? new Date(zone.last_updated).toLocaleString() : new Date().toLocaleString()}</p>
        </div>
        <StatusBadge status={zone.risk_level} pulse={zone.risk_level === 'CRITICAL'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg">
          <div className="text-sm text-text-secondary mb-1">Current Load</div>
          <div className="text-2xl font-mono font-bold text-text-primary">{zone.current_load_kwh != null ? zone.current_load_kwh.toFixed(1) : '-'} kWh</div>
        </div>
        <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg">
          <div className="text-sm text-text-secondary mb-1">Forecast (Next 1h)</div>
          <div className="text-2xl font-mono font-bold text-text-primary">{nextForecast ? nextForecast.predicted_kwh.toFixed(1) : '-'} kWh</div>
        </div>
        <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg">
          <div className="text-sm text-text-secondary mb-1">Active Anomalies</div>
          <div className={`text-2xl font-mono font-bold ${(zoneFlags || [])?.filter((f: any) => f.status === 'OPEN').length > 0 ? 'text-risk-high' : 'text-text-primary'}`}>
            {(zoneFlags || [])?.filter((f: any) => f.status === 'OPEN').length || 0}
          </div>
        </div>
      </div>

      <div className="mb-8 p-6 bg-grid-panel border border-border-subtle rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-text-primary mb-4">Demand Chart</h3>
        {isLoadingForecasts ? (
          <SkeletonLoader className="h-64 w-full" />
        ) : (
          <DemandForecastChart data={zoneForecasts || []} />
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-text-primary mb-4">Meters in Zone</h3>
        <div className="bg-grid-panel border border-border-subtle rounded-lg overflow-hidden">
          {isLoadingMeters ? (
            <div className="p-4"><SkeletonLoader className="h-32 w-full" /></div>
          ) : (
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-grid-slate text-text-muted border-b border-border-subtle">
                <tr>
                  <th className="px-4 py-3 font-mono">Meter ID</th>
                  <th className="px-4 py-3 font-mono">Status</th>
                  <th className="px-4 py-3 font-mono">Last Reading At</th>
                </tr>
              </thead>
              <tbody>
                {meters?.map((m: any, i: number) => {
                  const mFlags = zoneFlags?.filter((f: any) => f.meter_id === m.id && f.status === 'OPEN') || [];
                  return (
                    <tr key={i} className="border-b border-border-subtle/50 hover:bg-grid-slate/50">
                      <td className="px-4 py-3 font-mono text-cyan-electric">{m.id}</td>
                      <td className="px-4 py-3 font-mono">
                        {mFlags.length > 0 ? <StatusBadge status={(mFlags[0] as any).anomaly_type || mFlags[0].anomalyType} size="sm" /> : <StatusBadge status={m.status} size="sm" />}
                      </td>
                      <td className="px-4 py-3 font-mono text-text-muted">{m.last_reading_at ? new Date(m.last_reading_at).toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Anomaly History</h3>
        {isLoadingFlags ? (
          <SkeletonLoader className="h-32 w-full" />
        ) : zoneFlags && zoneFlags.length > 0 ? (
          <div className="space-y-4">
            {zoneFlags.map((f: any) => (
              <div key={f.id} className="p-4 bg-grid-panel border border-border-subtle rounded-lg flex items-start gap-4">
                <AlertTriangle className="text-risk-moderate mt-1 shrink-0" size={20} />
                <div>
                  <div className="font-mono text-sm mb-1">{f.meter_id} · {new Date(f.detected_at).toLocaleString()}</div>
                  <div className="text-sm font-sans text-text-secondary">{f.explanation}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={AlertTriangle} title="No History" description="There are no recorded anomalies for this zone." />
        )}
      </div>

      <section className="mt-6">
        <InspectionReport zoneId={zoneId || ''} zoneName={zone?.name ?? (zoneId || '')} />
      </section>
    </PageWrapper>
  );
};

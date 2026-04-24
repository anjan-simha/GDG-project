import React from 'react';
import { useParams } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/shared/StatusBadge';
import { DemandForecastChart } from '../components/forecasting/DemandForecastChart';
import { EmptyState } from '../components/shared/EmptyState';
import { Map, AlertTriangle } from 'lucide-react';

export const ZoneDetailPage: React.FC = () => {
  const { zoneId } = useParams<{ zoneId: string }>();
  const { zones, forecasts, anomalyFlags, readings } = useAppStore();

  const zone = zones.find(z => z.id === zoneId);
  const zoneForecasts = forecasts.filter(f => f.zoneId === zoneId);
  const zoneFlags = anomalyFlags.filter(f => f.zoneId === zoneId);

  if (!zone) {
    return (
      <PageWrapper>
        <EmptyState icon={Map} title="Zone Not Found" description={`We could not find data for zone ${zoneId}.`} />
      </PageWrapper>
    );
  }

  // Find meters in this zone
  const meterIds = Array.from(new Set(readings.filter(r => r.zoneId === zoneId).map(r => r.meterId)));

  return (
    <PageWrapper>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">{zone.id} · {zone.name}</h2>
          <p className="text-text-secondary">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <StatusBadge status={zone.riskLevel} pulse={zone.riskLevel === 'CRITICAL'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg">
          <div className="text-sm text-text-secondary mb-1">Current Load</div>
          <div className="text-2xl font-mono font-bold text-text-primary">{zone.currentLoad.toFixed(1)} kWh</div>
        </div>
        <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg">
          <div className="text-sm text-text-secondary mb-1">Forecast (Next 1h)</div>
          <div className="text-2xl font-mono font-bold text-text-primary">{zone.forecastLoad.toFixed(1)} kWh</div>
        </div>
        <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg">
          <div className="text-sm text-text-secondary mb-1">Active Anomalies</div>
          <div className={`text-2xl font-mono font-bold ${zone.activeAnomalyCount > 0 ? 'text-risk-high' : 'text-text-primary'}`}>{zone.activeAnomalyCount}</div>
        </div>
      </div>

      <div className="mb-8 p-6 bg-grid-panel border border-border-subtle rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-text-primary mb-4">Demand Chart</h3>
        <DemandForecastChart data={zoneForecasts} />
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium text-text-primary mb-4">Meters in Zone</h3>
        <div className="bg-grid-panel border border-border-subtle rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="text-xs uppercase bg-grid-slate text-text-muted border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 font-mono">Meter ID</th>
                <th className="px-4 py-3 font-mono">Current (kWh)</th>
                <th className="px-4 py-3 font-mono">Status</th>
              </tr>
            </thead>
            <tbody>
              {meterIds.map((mId, i) => {
                const latestReading = readings.filter(r => r.meterId === mId).pop();
                const mFlags = zoneFlags.filter(f => f.meterId === mId && f.status === 'OPEN');
                return (
                  <tr key={i} className="border-b border-border-subtle/50 hover:bg-grid-slate/50">
                    <td className="px-4 py-3 font-mono text-cyan-electric">{mId}</td>
                    <td className="px-4 py-3 font-mono text-text-primary">{latestReading?.consumptionKWh.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 font-mono">
                      {mFlags.length > 0 ? <StatusBadge status={mFlags[0].anomalyType} size="sm" /> : <StatusBadge status="NORMAL" size="sm" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Anomaly History</h3>
        {zoneFlags.length > 0 ? (
          <div className="space-y-4">
            {zoneFlags.map(f => (
              <div key={f.flagId} className="p-4 bg-grid-panel border border-border-subtle rounded-lg flex items-start gap-4">
                <AlertTriangle className="text-risk-moderate mt-1" size={20} />
                <div>
                  <div className="font-mono text-sm mb-1">{f.meterId} · {new Date(f.detectedAt).toLocaleString()}</div>
                  <div className="text-sm font-sans text-text-secondary">{f.explanation}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={AlertTriangle} title="No History" description="There are no recorded anomalies for this zone." />
        )}
      </div>
    </PageWrapper>
  );
};

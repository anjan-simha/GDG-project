import React from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useDashboardSummary, useDashboardZoneGrid, useDashboardRecentFlags, useDashboardSystemStatus } from '../hooks/useDashboardSummary';
import { KPICard } from '../components/dashboard/KPICard';
import { Activity, AlertTriangle, ShieldAlert, Map } from 'lucide-react';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import { SkeletonLoader } from '../components/shared/SkeletonLoader';

export const DashboardPage: React.FC = () => {
  const { data: summary } = useDashboardSummary();
  const { data: zones, isLoading: isLoadingZones } = useDashboardZoneGrid();
  const { data: recentFlags, isLoading: isLoadingFlags } = useDashboardRecentFlags();
  const { data: systemStatus } = useDashboardSystemStatus();

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">Network Overview</h2>
        <p className="text-text-secondary">Real-time status of BESCOM distribution zones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Zones Monitored" value={summary?.zone_count ?? '-'} icon={Map} />
        <KPICard title="High-Risk Zones" value={summary?.high_risk_count ?? '-'} icon={AlertTriangle} />
        <KPICard title="Open Anomaly Flags" value={summary?.open_flags ?? '-'} icon={ShieldAlert} />
        <KPICard title="Forecast Accuracy (24h)" value={summary?.forecast_accuracy ? `${summary.forecast_accuracy}%` : '-'} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <h3 className="text-lg font-medium text-text-primary mb-4">Zone Risk Grid</h3>
          {isLoadingZones ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonLoader key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones?.map((zone: any, idx: number) => (
                <div key={zone.id} className="p-4 bg-grid-panel border border-border-subtle rounded-lg hover:border-border-active transition-all" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-mono font-bold text-text-primary">{zone.id}</h4>
                      <span className="text-xs text-text-secondary">{zone.name}</span>
                    </div>
                    <StatusBadge status={zone.risk_level} pulse={zone.risk_level === 'CRITICAL'} />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs text-text-muted mb-1">Current Load</div>
                      <div className="text-xl font-mono font-bold text-text-primary">
                        {zone.current_load_kwh !== null ? `${zone.current_load_kwh.toFixed(0)} kWh` : '---'}
                      </div>
                    </div>
                    <Link to={`/zones/${zone.id}`} className="text-xs font-sans font-medium text-cyan-electric hover:underline">
                      View Detail &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium text-text-primary mb-4">Recent Anomalies</h3>
          {isLoadingFlags ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => <SkeletonLoader key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentFlags?.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border-subtle rounded-lg text-text-secondary text-sm">
                  No recent open anomalies.
                </div>
              ) : (
                recentFlags?.map((flag: any) => (
                  <div key={flag.id} className={`p-4 bg-grid-panel border border-border-subtle rounded-lg border-l-4 ${flag.severity_score > 80 ? 'border-l-risk-critical' : 'border-l-risk-moderate'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono bg-grid-slate px-1.5 py-0.5 rounded text-text-primary">
                        {flag.anomaly_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono text-text-muted">
                        {new Date(flag.detected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="text-sm font-sans text-text-secondary mb-3 line-clamp-2" title={flag.explanation}>
                      {flag.explanation}
                    </div>
                    <Link to={`/anomalies?id=${flag.id}`} className="text-xs font-medium text-cyan-electric hover:underline">
                      Review Flag &rarr;
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-border-subtle flex justify-between items-center text-xs text-text-muted">
        <div>Last sync: {systemStatus?.last_sync_time ? new Date(systemStatus.last_sync_time).toLocaleTimeString() : '...'}</div>
        <div className="flex gap-4">
          <span>Active Meters: {systemStatus?.meter_count ?? '-'}</span>
          <span className="text-risk-low flex items-center gap-1"><div className="w-1.5 h-1.5 bg-risk-low rounded-full"></div>Live</span>
        </div>
      </div>
    </PageWrapper>
  );
};

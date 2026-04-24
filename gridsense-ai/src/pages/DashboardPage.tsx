import React from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAppStore } from '../store/useAppStore';
import { KPICard } from '../components/dashboard/KPICard';
import { Activity, AlertTriangle, ShieldAlert, Map } from 'lucide-react';
import { StatusBadge } from '../components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import { ZoneRiskLevel } from '../types/meter';

export const DashboardPage: React.FC = () => {
  const { zones, anomalyFlags } = useAppStore();

  const totalZones = zones.length;
  const highRiskZones = zones.filter(z => z.riskLevel === ZoneRiskLevel.HIGH || z.riskLevel === ZoneRiskLevel.CRITICAL).length;
  const openFlags = anomalyFlags.filter(f => f.status === 'OPEN').length;

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">Network Overview</h2>
        <p className="text-text-secondary">Real-time status of BESCOM distribution zones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Zones Monitored" value={totalZones} icon={Map} />
        <KPICard title="High-Risk Zones" value={highRiskZones} icon={AlertTriangle} delta="+1 from yesterday" />
        <KPICard title="Open Anomaly Flags" value={openFlags} icon={ShieldAlert} delta="+3 from last week" />
        <KPICard title="Forecast Accuracy (24h)" value="94.2%" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <h3 className="text-lg font-medium text-text-primary mb-4">Zone Risk Grid</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone, idx) => (
              <div key={zone.id} className="p-4 bg-grid-panel border border-border-subtle rounded-lg hover:border-border-active transition-all" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-mono font-bold text-text-primary">{zone.id}</h4>
                    <span className="text-xs text-text-secondary">{zone.name}</span>
                  </div>
                  <StatusBadge status={zone.riskLevel} pulse={zone.riskLevel === 'CRITICAL'} />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Current Load</div>
                    <div className="text-xl font-mono font-bold text-text-primary">{zone.currentLoad.toFixed(0)} kWh</div>
                  </div>
                  <Link to={`/zones/${zone.id}`} className="text-xs font-sans font-medium text-cyan-electric hover:underline">
                    View Detail &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-text-primary mb-4">Recent Anomalies</h3>
          <div className="flex flex-col gap-3">
            {anomalyFlags.slice(0, 5).map(flag => (
              <div key={flag.flagId} className={`p-4 bg-grid-panel border border-border-subtle rounded-lg border-l-4 ${flag.severityScore > 80 ? 'border-l-risk-critical' : 'border-l-risk-moderate'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono bg-grid-slate px-1.5 py-0.5 rounded text-text-primary">
                    {flag.anomalyType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-text-muted">{new Date(flag.detectedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="text-sm font-sans text-text-secondary mb-3 line-clamp-2">
                  {flag.explanation}
                </div>
                <Link to="/anomalies" className="text-xs font-medium text-cyan-electric hover:underline">
                  Review Flag &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-border-subtle flex justify-between items-center text-xs text-text-muted">
        <div>Last sync: {new Date().toLocaleTimeString()}</div>
        <div className="flex gap-4">
          <span>Active Meters: 48</span>
          <span className="text-risk-low flex items-center gap-1"><div className="w-1.5 h-1.5 bg-risk-low rounded-full"></div>Live</span>
        </div>
      </div>
    </PageWrapper>
  );
};

import React, { useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { DemandForecastChart } from '../components/forecasting/DemandForecastChart';
import { ZoneRiskMap } from '../components/forecasting/ZoneRiskMap';
import { useAppStore } from '../store/useAppStore';
import { useZones } from '../hooks/useZones';
import { useForecasts, useForecastAccuracy } from '../hooks/useForecasts';
import { SkeletonLoader } from '../components/shared/SkeletonLoader';

export const ForecastingPage: React.FC = () => {
  const { selectedZone, setSelectedZone } = useAppStore();
  const { data: zones } = useZones();
  const { data: accuracy } = useForecastAccuracy();

  // Make sure we have a selected zone if zones are loaded
  const activeZone = selectedZone || (zones && zones.length > 0 ? zones[0].id : '');
  
  useEffect(() => {
    if (zones && zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0].id);
    }
  }, [zones, selectedZone, setSelectedZone]);

  const { data: zoneForecasts, isLoading: isLoadingForecasts } = useForecasts({ zone_id: activeZone });

  return (
    <PageWrapper>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">Demand Forecasting</h2>
          <p className="text-text-secondary">Short-term load predictions and risk modeling.</p>
        </div>
        {accuracy && (
          <div className="bg-grid-panel border border-border-subtle rounded px-4 py-2 flex flex-col items-end">
            <span className="text-xs text-text-muted">{accuracy.description}</span>
            <span className="text-lg font-mono text-cyan-electric font-bold">{accuracy.mae_percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 bg-grid-panel border border-border-subtle rounded-lg shadow-[0_4px_24px_rgba(0,229,255,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-text-primary">Load Forecast ({activeZone})</h3>
              <select 
                value={activeZone} 
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-grid-slate border border-border-subtle text-text-primary text-sm rounded px-3 py-1.5 focus:border-cyan-electric outline-none"
              >
                {zones?.map((z: any) => <option key={z.id} value={z.id}>{z.id} - {z.name}</option>)}
              </select>
            </div>
            {isLoadingForecasts ? (
              <SkeletonLoader className="h-64 w-full" />
            ) : (
              <DemandForecastChart data={zoneForecasts || []} />
            )}
          </div>

          <div className="p-6 bg-grid-panel border border-border-subtle rounded-lg">
            <h3 className="text-lg font-medium text-text-primary mb-4">Forecast Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-secondary">
                <thead className="text-xs uppercase bg-grid-slate text-text-muted border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 font-mono">Time</th>
                    <th className="px-4 py-3 font-mono">Predicted</th>
                    <th className="px-4 py-3 font-mono">Baseline</th>
                    <th className="px-4 py-3 font-mono">Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingForecasts ? (
                    <tr>
                      <td colSpan={4} className="p-4"><SkeletonLoader className="h-8 w-full" /></td>
                    </tr>
                  ) : (
                    zoneForecasts?.slice(0, 10).map((f: any, i: number) => {
                      const dev = ((f.predicted_kwh - f.baseline_kwh) / f.baseline_kwh) * 100;
                      return (
                        <tr key={i} className={`border-b border-border-subtle/50 transition-colors ${Math.abs(dev) > 15 ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'hover:bg-grid-slate/50'}`}>
                          <td className="px-4 py-3 font-mono text-text-primary">{new Date(f.forecast_timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                          <td className="px-4 py-3 font-mono text-cyan-electric font-medium">{f.predicted_kwh.toFixed(1)}</td>
                          <td className="px-4 py-3 font-mono text-text-muted">{f.baseline_kwh.toFixed(1)}</td>
                          <td className={`px-4 py-3 font-mono ${dev > 10 ? 'text-risk-moderate' : 'text-risk-low'}`}>
                            {dev > 0 ? '+' : ''}{dev.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="p-4 bg-grid-panel border border-border-subtle rounded-lg sticky top-6">
            <h3 className="text-lg font-medium text-text-primary mb-4">Zone Risk Map</h3>
            <p className="text-xs text-text-secondary mb-4">Select a zone to view its forecast.</p>
            <ZoneRiskMap />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

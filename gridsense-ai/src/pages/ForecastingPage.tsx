import React from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { DemandForecastChart } from '../components/forecasting/DemandForecastChart';
import { ZoneRiskMap } from '../components/forecasting/ZoneRiskMap';
import { useAppStore } from '../store/useAppStore';

export const ForecastingPage: React.FC = () => {
  const { forecasts, selectedZone, setSelectedZone, zones } = useAppStore();

  const activeZone = selectedZone || (zones.length > 0 ? zones[0].id : '');
  const zoneForecasts = forecasts.filter(f => f.zoneId === activeZone);

  return (
    <PageWrapper>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">Demand Forecasting</h2>
        <p className="text-text-secondary">Short-term load predictions and risk modeling.</p>
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
                {zones.map(z => <option key={z.id} value={z.id}>{z.id} - {z.name}</option>)}
              </select>
            </div>
            <DemandForecastChart data={zoneForecasts} />
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
                  {zoneForecasts.slice(0, 10).map((f, i) => {
                    const dev = ((f.predictedKWh - f.baselineKWh) / f.baselineKWh) * 100;
                    return (
                      <tr key={i} className="border-b border-border-subtle/50 hover:bg-grid-slate/50">
                        <td className="px-4 py-3 font-mono text-text-primary">{new Date(f.forecastTimestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td className="px-4 py-3 font-mono text-cyan-electric font-medium">{f.predictedKWh.toFixed(1)}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{f.baselineKWh.toFixed(1)}</td>
                        <td className={`px-4 py-3 font-mono ${dev > 10 ? 'text-risk-moderate' : 'text-risk-low'}`}>
                          {dev > 0 ? '+' : ''}{dev.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
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

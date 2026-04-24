import React, { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAppStore } from '../store/useAppStore';

export const SettingsPage: React.FC = () => {
  const { thresholds, updateThreshold } = useAppStore();
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [toast, setToast] = useState(false);

  const handleSave = () => {
    Object.entries(localThresholds).forEach(([k, v]) => {
      updateThreshold(k as keyof typeof thresholds, Number(v));
    });
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalThresholds({
      ...localThresholds,
      [e.target.name]: e.target.value
    });
  };

  return (
    <PageWrapper>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-mono tracking-tight text-text-primary mb-2">System Settings</h2>
          <p className="text-text-secondary">Configure detection thresholds and system parameters.</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-grid-panel border border-border-subtle rounded-lg">
            <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-subtle pb-2">Anomaly Detection Thresholds</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Sudden Drop Threshold</label>
                <div className="flex items-center">
                  <input type="number" step="0.01" name="dropThreshold" value={localThresholds.dropThreshold} onChange={handleChange} className="w-full bg-grid-slate border border-border-subtle rounded-l px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-electric" />
                  <span className="bg-grid-slate border border-l-0 border-border-subtle rounded-r px-3 py-2 text-text-muted">ratio</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Sudden Spike Threshold</label>
                <div className="flex items-center">
                  <input type="number" step="0.01" name="spikeThreshold" value={localThresholds.spikeThreshold} onChange={handleChange} className="w-full bg-grid-slate border border-border-subtle rounded-l px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-electric" />
                  <span className="bg-grid-slate border border-l-0 border-border-subtle rounded-r px-3 py-2 text-text-muted">ratio</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Consecutive Intervals for Flag</label>
                <div className="flex items-center">
                  <input type="number" name="consecutiveIntervalsForFlag" value={localThresholds.consecutiveIntervalsForFlag} onChange={handleChange} className="w-full bg-grid-slate border border-border-subtle rounded-l px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-electric" />
                  <span className="bg-grid-slate border border-l-0 border-border-subtle rounded-r px-3 py-2 text-text-muted">intervals</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-grid-panel border border-border-subtle rounded-lg">
            <h3 className="text-lg font-medium text-text-primary mb-4 border-b border-border-subtle pb-2">Demand Forecast Settings</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Critical Zone Threshold</label>
                <div className="flex items-center">
                  <input type="number" name="criticalKWh" value={localThresholds.criticalKWh} onChange={handleChange} className="w-full bg-grid-slate border border-border-subtle rounded-l px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-electric" />
                  <span className="bg-grid-slate border border-l-0 border-border-subtle rounded-r px-3 py-2 text-text-muted">kWh</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">High Zone Threshold</label>
                <div className="flex items-center">
                  <input type="number" name="highKWh" value={localThresholds.highKWh} onChange={handleChange} className="w-full bg-grid-slate border border-border-subtle rounded-l px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-electric" />
                  <span className="bg-grid-slate border border-l-0 border-border-subtle rounded-r px-3 py-2 text-text-muted">kWh</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Moderate Zone Threshold</label>
                <div className="flex items-center">
                  <input type="number" name="moderateKWh" value={localThresholds.moderateKWh} onChange={handleChange} className="w-full bg-grid-slate border border-border-subtle rounded-l px-3 py-2 text-text-primary focus:outline-none focus:border-cyan-electric" />
                  <span className="bg-grid-slate border border-l-0 border-border-subtle rounded-r px-3 py-2 text-text-muted">kWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button className="px-4 py-2 bg-transparent text-risk-high border border-risk-high rounded hover:bg-risk-high/10 transition-colors">
            Reset Defaults
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-cyan-electric text-text-inverse font-medium rounded hover:bg-cyan-dim transition-colors">
            Save Changes
          </button>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 bg-risk-low text-grid-navy font-medium px-4 py-2 rounded shadow-[0_4px_24px_rgba(16,185,129,0.2)] animate-fade-in-up">
            Settings saved successfully.
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

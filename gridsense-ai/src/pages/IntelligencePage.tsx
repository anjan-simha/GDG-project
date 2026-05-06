import { PageWrapper } from '../components/layout/PageWrapper';
import { OperatorChat } from '../components/intelligence/OperatorChat';
import { Bot, Sparkles } from 'lucide-react';

export function IntelligencePage() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bot size={24} style={{ color: 'var(--color-cyan-electric)' }} />
          <div>
            <h1
              className="text-2xl"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'Space Mono, monospace' }}
            >
              GridSense Intelligence
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Natural language interface powered by Gemini · Synthetic data only
            </p>
          </div>
          <span
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 rounded"
            style={{
              background: 'rgba(245,158,11,0.10)',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Sparkles size={10} />
            SYNTHETIC DATA MODE
          </span>
        </div>

        {/* Chat panel — full height */}
        <div style={{ height: '600px' }}>
          <OperatorChat />
        </div>

        {/* Usage guidance */}
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            background: 'var(--color-grid-panel)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)' }}>How this works:</strong>
          {' '}The AI assistant reads live data from the dashboard (zone risk levels, open flags,
          forecast accuracy) and answers your questions in plain English. It never has access to
          raw consumption data or real meter readings. All responses are grounded in the synthetic
          network state shown in the dashboard.
        </div>
      </div>
    </PageWrapper>
  );
}

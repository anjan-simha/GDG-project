import { useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { useZoneReport } from '../../hooks/useIntelligence';

interface Props {
  zoneId: string;
  zoneName: string;
}

export function InspectionReport({ zoneId, zoneName }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const { mutate, isPending, isError } = useZoneReport();

  const handleGenerate = () => {
    mutate(zoneId, {
      onSuccess: (data) => {
        setReport(data.report_text);
        setGeneratedAt(data.generated_at);
      },
    });
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridsense-report-${zoneId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ background: 'var(--color-grid-panel)', border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: 'var(--color-cyan-electric)' }} />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'Space Mono, monospace' }}
          >
            Inspection Report
          </span>
        </div>

        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Download size={10} />
              Export
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
            style={{
              background: isPending ? 'rgba(0,229,255,0.06)' : 'var(--color-cyan-electric)',
              color: isPending ? 'var(--color-cyan-electric)' : 'var(--color-text-inverse)',
              border: isPending ? '1px solid rgba(0,229,255,0.3)' : 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {isPending && <Loader2 size={10} className="animate-spin" />}
            {isPending ? 'Generating…' : report ? 'Regenerate' : 'Generate Report'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {generatedAt && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              Generated: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
          <pre
            className="text-sm leading-relaxed whitespace-pre-wrap rounded p-3"
            style={{
              background: 'var(--color-grid-slate)',
              color: 'var(--color-text-primary)',
              fontFamily: 'DM Sans, sans-serif',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            {report}
          </pre>
        </>
      )}

      {!report && !isPending && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          Click "Generate Report" to create an AI-powered inspection summary for {zoneName}.
        </p>
      )}

      {isError && (
        <p className="text-xs" style={{ color: 'var(--color-risk-high)' }}>
          Report generation failed. Please try again or check the AI service status.
        </p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useEnrichFlag } from '../../hooks/useIntelligence';

interface Props {
  flagId: string;
  templateExplanation: string;  // Always available — the safe fallback
}

export function EnrichedExplanation({ flagId, templateExplanation }: Props) {
  const [enriched, setEnriched] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const { mutate, isPending, isError } = useEnrichFlag();

  const handleEnrich = () => {
    mutate(flagId, {
      onSuccess: (data) => {
        setEnriched(data.enriched_explanation);
        setFallbackUsed(data.fallback_used);
      },
    });
  };

  return (
    <div className="space-y-2">
      {/* Always show template explanation as the base */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Sans, sans-serif' }}
      >
        {enriched ?? templateExplanation}
      </p>

      {/* Show enriched badge if AI version is loaded */}
      {enriched && !fallbackUsed && (
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0,229,255,0.08)',
            color: 'var(--color-cyan-electric)',
            border: '1px solid rgba(0,229,255,0.2)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Sparkles size={10} />
          AI-enriched · Gemini
        </span>
      )}

      {/* Fallback notice */}
      {enriched && fallbackUsed && (
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <AlertCircle size={10} />
          AI unavailable — showing system explanation
        </span>
      )}

      {/* Enrich button — only shown before enrichment is loaded */}
      {!enriched && (
        <button
          onClick={handleEnrich}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-all"
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,229,255,0.25)',
            color: 'var(--color-cyan-electric)',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {isPending ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Sparkles size={10} />
          )}
          {isPending ? 'Enriching…' : 'Enrich with AI'}
        </button>
      )}

      {isError && (
        <p className="text-xs" style={{ color: 'var(--color-risk-high)' }}>
          Failed to reach AI service. Template explanation shown above.
        </p>
      )}
    </div>
  );
}

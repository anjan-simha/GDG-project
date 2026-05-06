import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { useAskOperator } from '../../hooks/useIntelligence';
import { api } from '../../services/api';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  modelUsed?: string;
  timestamp: Date;
}

interface HealthStatus {
  status: 'ok' | 'degraded' | 'loading' | 'unreachable';
  gemini_reachable?: boolean;
  api_key_configured?: boolean;
  db_seeded?: boolean;
  model_primary?: string;
  gemini_error?: string | null;
  db_zones?: number;
  db_flags?: number;
}

const SUGGESTED_QUESTIONS = [
  'Which zones are at highest risk right now?',
  'How many open anomaly flags are there?',
  'Are there any suspected tampering cases?',
  'What is the overall network status?',
];

export function OperatorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello. I am GridSense, your smart grid assistant. Ask me about zone risk levels, anomaly flags, or the overall network state.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [health, setHealth] = useState<HealthStatus>({ status: 'loading' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useAskOperator();

  // ── Health check on mount ──────────────────────────────────────────────
  useEffect(() => {
    api
      .get('/api/intelligence/health')
      .then((r) => {
        setHealth(r.data);
        if (r.data.status === 'degraded') {
          // Surface the exact problem to the operator
          const problems: string[] = [];
          if (!r.data.api_key_configured)
            problems.push('GEMINI_API_KEY is not set in backend/.env');
          if (!r.data.gemini_reachable)
            problems.push(
              r.data.gemini_error
                ? `Gemini API error: ${r.data.gemini_error}`
                : `Model "${r.data.model_primary}" not reachable`
            );
          if (!r.data.db_seeded)
            problems.push(
              `Database has only ${r.data.db_zones} zones — run the seeder: python -m app.seed.seed_data`
            );

          setMessages((prev) => [
            ...prev,
            {
              role: 'error',
              content:
                `AI service is degraded:\n` + problems.map((p) => `• ${p}`).join('\n'),
              timestamp: new Date(),
            },
          ]);
        }
      })
      .catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (question: string) => {
    if (!question.trim() || isPending) return;

    const userMsg: Message = {
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    mutate(question, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            modelUsed: data.model_used,
            timestamp: new Date(),
          },
        ]);
      },
      onError: (err: Error) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'error',
            content: `Request failed: ${err.message}. Check that the backend is running on port 8000.`,
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  // ── Status badge ──────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (health.status === 'loading')
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 size={10} className="animate-spin" /> Checking…
        </span>
      );
    if (health.status === 'ok')
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-risk-low)' }}>
          <CheckCircle2 size={10} /> {health.model_primary}
        </span>
      );
    if (health.status === 'unreachable')
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-risk-high)' }}>
          <WifiOff size={10} /> Backend unreachable
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-risk-moderate)' }}>
        <AlertTriangle size={10} /> Degraded — see chat
      </span>
    );
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-grid-panel)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <Bot size={16} style={{ color: 'var(--color-cyan-electric)' }} />
        <span
          className="text-sm font-medium"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'Space Mono, monospace',
          }}
        >
          GridSense AI
        </span>
        <span className="ml-auto">
          <StatusBadge />
        </span>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {(msg.role === 'assistant' || msg.role === 'error') && (
              <div className="mt-1 flex-shrink-0">
                {msg.role === 'error' ? (
                  <AlertTriangle size={16} style={{ color: 'var(--color-risk-moderate)' }} />
                ) : (
                  <Bot size={16} style={{ color: 'var(--color-cyan-electric)' }} />
                )}
              </div>
            )}

            <div className="max-w-xs space-y-1">
              <div
                className="rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background:
                    msg.role === 'user'
                      ? 'rgba(0,229,255,0.12)'
                      : msg.role === 'error'
                      ? 'rgba(245,158,11,0.08)'
                      : 'var(--color-grid-slate)',
                  color: 'var(--color-text-primary)',
                  border:
                    msg.role === 'user'
                      ? '1px solid rgba(0,229,255,0.25)'
                      : msg.role === 'error'
                      ? '1px solid rgba(245,158,11,0.25)'
                      : '1px solid var(--color-border-subtle)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {msg.content}
              </div>

              {/* Model attribution */}
              {msg.modelUsed && msg.role === 'assistant' && (
                <p
                  className="text-xs pl-1"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {msg.modelUsed}
                </p>
              )}
            </div>

            {msg.role === 'user' && (
              <User
                size={16}
                className="mt-1 flex-shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              />
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isPending && (
          <div className="flex gap-2 justify-start">
            <Bot size={16} className="mt-1" style={{ color: 'var(--color-cyan-electric)' }} />
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              style={{
                background: 'var(--color-grid-slate)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested questions ────────────────────────────────────────── */}
      {messages.length <= 1 && health.status === 'ok' && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={
            health.status === 'unreachable'
              ? 'Backend unreachable — start the FastAPI server'
              : health.status === 'degraded'
              ? 'AI degraded — check the error above'
              : 'Ask about zones, flags, forecasts…'
          }
          disabled={isPending || health.status === 'unreachable'}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isPending || !input.trim() || health.status === 'unreachable'}
          style={{
            color:
              input.trim() && health.status !== 'unreachable'
                ? 'var(--color-cyan-electric)'
                : 'var(--color-text-muted)',
            cursor:
              input.trim() && !isPending && health.status !== 'unreachable'
                ? 'pointer'
                : 'not-allowed',
            transition: 'color 150ms',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

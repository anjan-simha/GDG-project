import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { useAskOperator } from '../../hooks/useIntelligence';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Which zones are at highest risk right now?',
  'How many open anomaly flags are there?',
  'What is the forecast accuracy for today?',
  'Are there any suspected tampering cases?',
];

export function OperatorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello. I am GridSense, your smart grid assistant. Ask me about zone risk levels, anomaly flags, or forecast data.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { mutate, isPending } = useAskOperator();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (question: string) => {
    if (!question.trim() || isPending) return;

    const userMsg: Message = { role: 'user', content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    mutate(question, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, timestamp: new Date() },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'I was unable to reach the AI service. Please try again or check the dashboard directly.',
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{ background: 'var(--color-grid-panel)', border: '1px solid var(--color-border-subtle)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <Bot size={16} style={{ color: 'var(--color-cyan-electric)' }} />
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'Space Mono, monospace' }}
        >
          GridSense AI
        </span>
        <span
          className="text-xs ml-auto px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0,229,255,0.08)',
            color: 'var(--color-cyan-electric)',
            border: '1px solid rgba(0,229,255,0.2)',
          }}
        >
          Gemini
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <Bot size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--color-cyan-electric)' }} />
            )}
            <div
              className="max-w-xs rounded-lg px-3 py-2 text-sm leading-relaxed"
              style={{
                background: msg.role === 'assistant'
                  ? 'var(--color-grid-slate)'
                  : 'rgba(0,229,255,0.12)',
                color: 'var(--color-text-primary)',
                border: msg.role === 'assistant'
                  ? '1px solid var(--color-border-subtle)'
                  : '1px solid rgba(0,229,255,0.25)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <User size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-2 justify-start">
            <Bot size={16} className="mt-1" style={{ color: 'var(--color-cyan-electric)' }} />
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
              style={{ background: 'var(--color-grid-slate)', color: 'var(--color-text-muted)' }}
            >
              <Loader2 size={12} className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — shown only when empty */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1 rounded transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about zones, flags, forecasts…"
          disabled={isPending}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'DM Sans, sans-serif' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isPending || !input.trim()}
          style={{
            color: input.trim() ? 'var(--color-cyan-electric)' : 'var(--color-text-muted)',
            cursor: input.trim() && !isPending ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

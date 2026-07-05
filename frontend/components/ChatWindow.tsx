"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageSquare, AlertCircle } from 'lucide-react';
import { postChat, ChatResponse } from '../lib/api';
import AgentTraceView from './AgentTraceView';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  trace?: ChatResponse['agent_trace'];
  sources?: ChatResponse['sources'];
}

const SUGGESTIONS = [
  "Is the air quality safe in Patna today?",
  "What does a BP of 140/90 mean?",
  "Is dengue risk rising in Ward 3?",
  "Should I let my child play outdoors?",
];

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '14px 16px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--ok)',
            display: 'inline-block',
            animation: `pulse-ok 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 8, letterSpacing: '0.06em' }}>
        AGENTS PROCESSING
      </span>
    </div>
  );
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello, I am Sarthi's Chief Decision Intelligence Agent. Ask me anything about personal health readings, community disease outbreaks, air quality thresholds, or local environment parameters.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await postChat(text);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        trace: res.agent_trace,
        sources: res.sources,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Failed to reach Sarthi agents. Check that the backend is running.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 680,
        background: 'var(--z2)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--z1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34, height: 34,
              background: 'var(--z3)',
              border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            <Bot size={16} style={{ color: 'var(--ok)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>
              Sarthi Decision Intelligence
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok)', animation: 'pulse-ok 2.5s ease-in-out infinite', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ok)', letterSpacing: '0.1em' }}>
                MULTI-AGENT SYSTEM ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Model chain indicator */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['Chief', 'Health', 'Env'].map(a => (
            <span
              key={a}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9, letterSpacing: '0.06em',
                color: 'var(--ink-3)',
                border: '1px solid var(--border-subtle)',
                padding: '2px 6px', borderRadius: 3,
              }}
            >
              {a.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              animation: 'slideUp 150ms ease-out both',
            }}
          >
            {msg.sender === 'assistant' && (
              <div
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: 'var(--z3)', border: '1px solid var(--border-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, marginTop: 2,
                }}
              >
                <Bot size={13} style={{ color: 'var(--ok)' }} />
              </div>
            )}

            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
              <div
                style={{
                  padding: '11px 15px',
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: msg.sender === 'user' ? '#070C09' : 'var(--ink-1)',
                  background: msg.sender === 'user' ? 'var(--ok)' : 'var(--z3)',
                  border: msg.sender === 'assistant' ? '1px solid var(--border-default)' : 'none',
                  borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontWeight: msg.sender === 'user' ? 500 : 400,
                }}
              >
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>

              {msg.sender === 'assistant' && msg.trace && msg.trace.length > 0 && (
                <details style={{ width: '100%' }}>
                  <summary
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10, letterSpacing: '0.08em',
                      color: 'var(--ink-3)',
                      cursor: 'pointer',
                      listStyle: 'none',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    className="hover:text-[var(--ok)]"
                  >
                    <span style={{ fontSize: 8 }}>▶</span> VIEW REASONING CHAIN
                  </summary>
                  <AgentTraceView trace={msg.trace} sources={msg.sources || []} />
                </details>
              )}
            </div>

            {msg.sender === 'user' && (
              <div
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: 'var(--z4)', border: '1px solid var(--border-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, marginTop: 2,
                }}
              >
                <User size={13} style={{ color: 'var(--ink-2)' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
            <div
              style={{
                width: 28, height: 28, flexShrink: 0,
                background: 'var(--z3)', border: '1px solid var(--border-active)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, marginTop: 2,
              }}
            >
              <Bot size={13} style={{ color: 'var(--ok)' }} />
            </div>
            <div style={{ background: 'var(--z3)', border: '1px solid var(--border-default)', borderRadius: '12px 12px 12px 2px' }}>
              <ThinkingDots />
            </div>
          </div>
        )}

        {error && (
          <div style={{ borderLeft: '3px solid var(--alert)', background: 'var(--z2)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--alert)', borderRadius: 4 }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only on first load */}
      {messages.length === 1 && !loading && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            SUGGESTED
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  background: 'var(--z3)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 20,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 120ms, border-color 120ms, background 120ms',
                }}
                className="hover:text-[var(--ink-1)] hover:border-[var(--border-active)] hover:bg-[var(--z4)]"
              >
                <MessageSquare size={10} style={{ color: 'var(--ok)' }} />
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(input); }}
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--z1)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about health, air quality, disease risk, civic services..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--z2)',
            border: '1px solid var(--border-default)',
            color: 'var(--ink-1)',
            fontSize: 13,
            padding: '10px 14px',
            outline: 'none',
            borderRadius: 8,
            fontFamily: 'var(--font-sans)',
            transition: 'border-color 120ms',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 16px', borderRadius: 8, flexShrink: 0,
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

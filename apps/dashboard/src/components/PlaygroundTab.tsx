import React, { useState } from 'react';
import { Send, Bot, User, Cpu, Database, Wrench, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import { FormattedMessage } from './FormattedMessage';

interface PlaygroundProps {
  apiKey: string;
}

export const PlaygroundTab: React.FC<PlaygroundProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'Hello! I am your AI Agent. Ask me anything or test an operation.' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastDebugInfo, setLastDebugInfo] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userText = inputMessage;
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setSending(true);

    try {
      const res = await axios.post(
        '/api/v1/playground/chat',
        { message: userText },
        { headers: { 'x-api-key': apiKey } },
      );

      const data = res.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      setLastDebugInfo(data);
    } catch (err: any) {
      const fallbackReply = err.response?.data?.message || err.message;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[Error]: ${fallbackReply}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>AI Playground</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Test your AI Agent live with instant prompt, RAG, tool call, and token usage inspection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', height: '650px' }}>
        {/* Chat Window */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={20} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700 }}>Interactive Chat Debugger</span>
            <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Live Agent</span>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="#fff" />
                  </div>
                )}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                    color: '#ffffff',
                    boxShadow: msg.role === 'user' ? 'var(--glow-primary)' : 'none',
                  }}
                >
                  <FormattedMessage content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="#fff" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} className="animate-spin" /> Thinking & executing decision flow...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Ask a question or request a business operation..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={sending}>
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Debug Inspection Panel */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--accent-cyan)" /> Agent Execution Diagnostics
          </h3>

          {!lastDebugInfo ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Send a message in the playground to view execution details.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <Clock size={16} color="var(--accent-cyan)" />
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{lastDebugInfo.responseTimeMs} ms</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latency</span>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <Database size={16} color="var(--accent-emerald)" />
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{lastDebugInfo.knowledgeSourcesUsed}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RAG Chunks</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={14} color="var(--accent-amber)" /> Executed Tools ({lastDebugInfo.toolCallsExecuted?.length || 0})
                </h4>
                {(!lastDebugInfo.toolCallsExecuted || lastDebugInfo.toolCallsExecuted.length === 0) ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No tools required for this query.</div>
                ) : (
                  <pre className="code-block" style={{ fontSize: '11px' }}>
                    {JSON.stringify(lastDebugInfo.toolCallsExecuted, null, 2)}
                  </pre>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Token Usage</h4>
                <pre className="code-block" style={{ fontSize: '11px' }}>
                  {JSON.stringify(lastDebugInfo.tokenUsage, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Download,
  Send,
  Phone,
  Terminal,
  Bot,
  User,
  UserCheck,
  CheckCircle2,
  SlidersHorizontal,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import axios from 'axios';
import { FormattedMessage } from './FormattedMessage';
import { Button } from './ui/Button';

interface ConversationsProps {
  apiKey: string;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  channelType?: string;
}

export interface ConversationItem {
  id: string;
  channelType: 'whatsapp' | 'api';
  channelUserId: string;
  messageCount: number;
  status: 'active' | 'handed_off' | 'closed';
  summary?: string;
  lastMessageAt: string;
  metadata?: Record<string, any>;
  limit?: number;
  limitExceeded?: boolean;
}

export interface QuickReplyItem {
  id: string;
  label: string;
  icon: string;
  text: string;
}

const QUICK_REPLIES: QuickReplyItem[] = [
  {
    id: 'auction',
    label: 'تتبع المزاد',
    icon: '🔨',
    text: 'أهلاً بك! يمكنك تتبع حالة المزاد ريماً من خلال تبويب المزادات المباشرة.',
  },
  {
    id: 'payment',
    label: 'تأكيد الشراء',
    icon: '🛒',
    text: 'تم التحقق من عملية الشراء وتأكيد التوكنات في حسابك الآن.',
  },
  {
    id: 'support',
    label: 'إسناد لدعم مركون',
    icon: '💬',
    text: 'نود إعلامك بأنه تم إسناد الطلب لدعم مركون المالي وسنتواصل معك فوراً.',
  },
  {
    id: 'webhook',
    label: 'Webhook Verified',
    icon: '⚡',
    text: 'Your API webhook settings have been verified and are active.',
  },
];

export const ConversationsTab: React.FC<ConversationsProps> = ({ apiKey }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'handed_off' | 'closed'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'api'>('all');
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const selectedConvIdRef = useRef<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, loadingDetail]);

  // Keep ref up to date with selected conversation ID
  useEffect(() => {
    selectedConvIdRef.current = selectedConv?.id || null;
  }, [selectedConv]);

  // Load detail and messages for a specific conversation ID
  const loadConversationDetail = async (convId: string, isExplicitSelection = false) => {
    try {
      if (isExplicitSelection) {
        setLoadingDetail(true);
      }
      const res = await axios.get(`/api/v1/conversations/${convId}`, {
        headers: { 'x-api-key': apiKey },
      });

      if (res.data?.conversation) {
        setSelectedConv(res.data.conversation);
      }
      if (res.data?.messages) {
        // Only update if messages actually changed to avoid unnecessary re-renders
        const fetchedMsgs: MessageItem[] = res.data.messages;
        setMessages((prevMsgs) => {
          if (prevMsgs.length === fetchedMsgs.length && prevMsgs.length > 0) {
            const lastPrev = prevMsgs[prevMsgs.length - 1];
            const lastFetched = fetchedMsgs[fetchedMsgs.length - 1];
            if (lastPrev.id === lastFetched.id && lastPrev.content === lastFetched.content) {
              return prevMsgs; // No change, keep same array reference!
            }
          }
          return fetchedMsgs;
        });
      }
    } catch (err) {
      console.error(`Failed to load details for conversation ${convId}`, err);
    } finally {
      if (isExplicitSelection) {
        setLoadingDetail(false);
      }
    }
  };

  // Fetch live conversations list (left sidebar)
  const fetchConversations = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);

        const res = await axios.get('/api/v1/conversations', {
          headers: { 'x-api-key': apiKey },
        });

        const liveList: ConversationItem[] = res.data?.data || [];
        setConversations(liveList);

        // Auto select first conversation ONLY on initial page load if none selected
        if (liveList.length > 0 && !selectedConvIdRef.current) {
          selectedConvIdRef.current = liveList[0].id;
          loadConversationDetail(liveList[0].id, true);
        } else if (selectedConvIdRef.current) {
          // Silent poll update for current active conversation without clearing UI or showing skeleton
          const currentActiveId = selectedConvIdRef.current;
          loadConversationDetail(currentActiveId, false);
        }
      } catch (err) {
        console.error('Failed to fetch live conversations from API', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiKey],
  );

  // Initial fetch and 10s background polling
  useEffect(() => {
    fetchConversations(false);
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [apiKey, fetchConversations]);

  // Filtered Conversations List
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      const matchesSearch =
        item.channelUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesChannel = channelFilter === 'all' || item.channelType === channelFilter;

      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [conversations, searchQuery, statusFilter, channelFilter]);

  // Statistics counters
  const counts = useMemo(() => {
    return {
      total: conversations.length,
      active: conversations.filter((c) => c.status === 'active').length,
      handedOff: conversations.filter((c) => c.status === 'handed_off').length,
      closed: conversations.filter((c) => c.status === 'closed').length,
    };
  }, [conversations]);

  // Handle sending human operator reply with instant optimistic UI update
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyInput.trim() || !selectedConv || sendingReply) return;

    const messageText = replyInput.trim();
    setReplyInput('');
    setSendingReply(true);

    // 1. Optimistic Update: Append message immediately to UI without reloading or fetching
    const tempMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      role: 'assistant',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    // Update message count in selected conversation locally
    setSelectedConv((prev) =>
      prev ? { ...prev, messageCount: prev.messageCount + 1 } : null,
    );

    setTimeout(() => {
      scrollToBottom('smooth');
      replyInputRef.current?.focus();
    }, 20);

    try {
      // 2. Post to backend in background
      await axios.post(
        `/api/v1/conversations/${selectedConv.id}/messages`,
        { role: 'assistant', content: messageText },
        { headers: { 'x-api-key': apiKey } },
      );

      // 3. Silently update thread list
      const resList = await axios.get('/api/v1/conversations', {
        headers: { 'x-api-key': apiKey },
      });
      if (resList.data?.data) {
        setConversations(resList.data.data);
      }
    } catch (err) {
      console.error('Error posting message to live API', err);
      // Remove temp message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      alert('Failed to send live reply. Please check connection and try again.');
    } finally {
      setSendingReply(false);
      replyInputRef.current?.focus();
    }
  };

  // Toggle conversation status (active, handed_off, closed) on live API
  const handleUpdateStatus = async (newStatus: 'active' | 'handed_off' | 'closed') => {
    if (!selectedConv) return;

    if (newStatus === 'active') {
      const maxL = selectedConv.metadata?.maxMessages ?? selectedConv.limit ?? 0;
      const isExceeded = selectedConv.limitExceeded || (maxL > 0 && selectedConv.messageCount >= maxL);
      if (isExceeded) {
        alert(
          `Cannot resume AI mode: Message limit reached (${selectedConv.messageCount}/${maxL}). Please increase the message limit first.`
        );
        return;
      }
    }

    try {
      await axios.patch(
        `/api/v1/conversations/${selectedConv.id}/status`,
        { status: newStatus },
        { headers: { 'x-api-key': apiKey } },
      );

      // Also append system status message in database
      const statusMsgText =
        newStatus === 'handed_off'
          ? '⚠️ تم إسناد المحادثة لممثل خدمة العملاء البشري (Human Agent Assigned)'
          : newStatus === 'closed'
            ? '✅ تم إغلاق التذكرة بنجاح'
            : '🔄 تم إعادة فتح المحادثة للذكاء الاصطناعي';

      await axios.post(
        `/api/v1/conversations/${selectedConv.id}/messages`,
        { role: 'system', content: statusMsgText },
        { headers: { 'x-api-key': apiKey } },
      );

      await loadConversationDetail(selectedConv.id);
      const resList = await axios.get('/api/v1/conversations', {
        headers: { 'x-api-key': apiKey },
      });
      if (resList.data?.data) {
        setConversations(resList.data.data);
      }
    } catch (err) {
      console.error('Error updating conversation status on live API', err);
    }
  };

  // Update per-conversation message limit via backend API
  const handleUpdateLimit = async (newLimit: number) => {
    if (!selectedConv) return;
    try {
      const res = await axios.patch(
        `/api/v1/conversations/${selectedConv.id}/limit`,
        { maxMessages: newLimit },
        { headers: { 'x-api-key': apiKey } },
      );

      const updatedMetadata = {
        ...(selectedConv.metadata || {}),
        maxMessages: newLimit,
      };

      const newStatus = res.data?.status || selectedConv.status;

      const updatedConv: ConversationItem = {
        ...selectedConv,
        metadata: updatedMetadata,
        status: newStatus,
        limit: newLimit,
        limitExceeded: newLimit > 0 && selectedConv.messageCount >= newLimit,
      };

      setSelectedConv(updatedConv);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, metadata: updatedMetadata, status: newStatus, limit: newLimit }
            : c,
        ),
      );

      await loadConversationDetail(selectedConv.id);
    } catch (err) {
      console.error('Error updating conversation limit on live API', err);
    }
  };

  // Export transcript as text file
  const handleExportTranscript = () => {
    if (!selectedConv) return;

    let transcript = `Kaizech Brain — Live Conversation Transcript\n`;
    transcript += `Thread ID: ${selectedConv.id}\n`;
    transcript += `User: ${selectedConv.channelUserId}\n`;
    transcript += `Channel: ${selectedConv.channelType.toUpperCase()}\n`;
    transcript += `Status: ${selectedConv.status}\n`;
    transcript += `--------------------------------------------------\n\n`;

    messages.forEach((m) => {
      const time = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
      transcript += `[${time}] ${m.role.toUpperCase()}:\n${m.content}\n\n`;
    });

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-transcript-${selectedConv.channelUserId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Page Title & Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Conversations & Support Tickets</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            Live customer support management connected to PostgreSQL & WhatsApp API.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={() => fetchConversations(true)}
            loading={refreshing}
            loadingText="Refreshing..."
            style={{ fontSize: '13px', padding: '7px 14px', gap: '6px' }}
            icon={!refreshing && <RefreshCw size={14} />}
          >
            Refresh Live Data
          </Button>
        </div>
      </div>

      {/* ── Stat Badges ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div
          onClick={() => setStatusFilter('all')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            borderLeft: '3px solid var(--accent-primary)',
            background: statusFilter === 'all' ? 'var(--bg-surface-elevated)' : undefined,
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Threads</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
            {counts.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('active')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            borderLeft: '3px solid var(--accent-emerald)',
            background: statusFilter === 'active' ? 'var(--bg-surface-elevated)' : undefined,
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Threads</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {counts.active}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('handed_off')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            borderLeft: '3px solid var(--accent-amber)',
            background: statusFilter === 'handed_off' ? 'var(--bg-surface-elevated)' : undefined,
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Human Handoffs</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
            {counts.handedOff}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('closed')}
          className="glass-card"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            borderLeft: '3px solid #94a3b8',
            background: statusFilter === 'closed' ? 'var(--bg-surface-elevated)' : undefined,
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Closed Tickets</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#94a3b8', marginTop: '4px' }}>
            {counts.closed}
          </div>
        </div>
      </div>

      {/* ── Main Layout: Split view (Threads List + Message Detail) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', height: '660px' }}>
        {/* Left Column: Active Threads List */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          {/* Search & Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search user, phone or message..."
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', 'active', 'handed_off', 'closed'] as const).map((st) => (
                <Button
                  key={st}
                  variant={statusFilter === st ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {st === 'handed_off' ? 'Handoff' : st}
                </Button>
              ))}

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as any)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-glass)',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                <option value="all">All Channels</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="api">API</option>
              </select>
            </div>
          </div>

          {/* Threads List Items */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '70px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No live conversation threads found in database matching criteria.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const dateStr = c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      selectedConvIdRef.current = c.id;
                      loadConversationDetail(c.id, true);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'var(--glow-primary)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                        {c.channelType === 'whatsapp' ? (
                          <Phone size={13} color="var(--accent-emerald)" />
                        ) : (
                          <Terminal size={13} color="var(--accent-primary)" />
                        )}
                        <span>{c.channelUserId}</span>
                      </div>

                      <span
                        className="badge"
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          background:
                            c.status === 'active'
                              ? 'rgba(16,185,129,0.15)'
                              : c.status === 'handed_off'
                                ? 'rgba(245,158,11,0.15)'
                                : 'rgba(148,163,184,0.15)',
                          color:
                            c.status === 'active'
                              ? 'var(--accent-emerald)'
                              : c.status === 'handed_off'
                                ? 'var(--accent-amber)'
                                : '#94a3b8',
                          border: `1px solid ${
                            c.status === 'active'
                              ? 'rgba(16,185,129,0.3)'
                              : c.status === 'handed_off'
                                ? 'rgba(245,158,11,0.3)'
                                : 'rgba(148,163,184,0.3)'
                          }`,
                        }}
                      >
                        {c.status === 'handed_off' ? 'Handoff' : c.status}
                      </span>
                    </div>

                    {c.summary && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.summary}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
                      <span>{c.messageCount} messages</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Thread Details & Message Thread */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedConv ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Select a conversation from the list to view history</p>
            </div>
          ) : (() => {
            const maxLimit = selectedConv.metadata?.maxMessages ?? selectedConv.limit ?? 0;
            const isLimitExceeded = Boolean(
              selectedConv.limitExceeded || (maxLimit > 0 && selectedConv.messageCount >= maxLimit)
            );

            return (
              <>
                {/* Header & Options Toolbar */}
                <div
                  style={{
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Top Bar: User Info & Status Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{selectedConv.channelUserId}</h4>
                        <span className="badge badge-purple" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                          {selectedConv.channelType}
                        </span>

                        {selectedConv.status === 'handed_off' && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '11px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--accent-amber)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                            }}
                          >
                            ✋ Hands-Off (Human Agent)
                          </span>
                        )}

                        {selectedConv.status === 'active' && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '11px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--accent-emerald)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                            }}
                          >
                            🤖 AI Active
                          </span>
                        )}

                        {selectedConv.status === 'closed' && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '11px',
                              background: 'rgba(148, 163, 184, 0.15)',
                              color: '#94a3b8',
                              border: '1px solid rgba(148, 163, 184, 0.3)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                            }}
                          >
                            ✅ Ticket Closed
                          </span>
                        )}

                        {isLimitExceeded && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '11px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Message limit reached! AI control is disabled until limit is increased."
                          >
                            <AlertTriangle size={12} /> Limit Exceeded ({selectedConv.messageCount}/{maxLimit})
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Messages: <strong style={{ color: isLimitExceeded ? '#ef4444' : 'var(--text-primary)' }}>{selectedConv.messageCount}</strong>
                          {maxLimit > 0 ? (
                            <> / <strong style={{ color: 'var(--accent-primary)' }}>{maxLimit}</strong> msgs limit</>
                          ) : (
                            <> (Unlimited)</>
                          )}
                        </span>
                      </div>
                      {selectedConv.summary && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedConv.summary}</p>
                      )}
                    </div>

                    {/* Options Toolbar: Grouped & Arranged Controls */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      {/* Limit control dropdown */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isLimitExceeded ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface-elevated)',
                          border: isLimitExceeded ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <SlidersHorizontal size={13} style={{ color: isLimitExceeded ? '#ef4444' : 'var(--text-muted)' }} />
                        <span style={{ color: isLimitExceeded ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>Limit:</span>
                        <select
                          value={maxLimit}
                          onChange={(e) => handleUpdateLimit(parseInt(e.target.value, 10))}
                          style={{
                            background: 'transparent',
                            color: isLimitExceeded ? '#ef4444' : 'var(--text-primary)',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                          title="Set max conversation message limit before human handoff"
                        >
                          <option value={0} style={{ background: '#1e293b', color: '#fff' }}>Unlimited (0)</option>
                          <option value={3} style={{ background: '#1e293b', color: '#fff' }}>3 msgs</option>
                          <option value={5} style={{ background: '#1e293b', color: '#fff' }}>5 msgs</option>
                          <option value={10} style={{ background: '#1e293b', color: '#fff' }}>10 msgs</option>
                          <option value={15} style={{ background: '#1e293b', color: '#fff' }}>15 msgs</option>
                          <option value={20} style={{ background: '#1e293b', color: '#fff' }}>20 msgs</option>
                          <option value={50} style={{ background: '#1e293b', color: '#fff' }}>50 msgs</option>
                        </select>
                      </div>

                      {/* Resume AI / Handoff Action */}
                      {selectedConv.status === 'handed_off' ? (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus('active')}
                          disabled={isLimitExceeded}
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            gap: '4px',
                            borderRadius: '8px',
                            cursor: isLimitExceeded ? 'not-allowed' : 'pointer',
                            opacity: isLimitExceeded ? 0.45 : 1,
                            borderColor: isLimitExceeded ? 'rgba(239, 68, 68, 0.4)' : 'var(--accent-emerald)',
                            color: isLimitExceeded ? 'rgba(239, 68, 68, 0.8)' : 'var(--accent-emerald)',
                            background: isLimitExceeded ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.1)',
                          }}
                          title={
                            isLimitExceeded
                              ? 'Cannot resume AI: Message limit reached. Increase limit first.'
                              : 'Return thread control to AI Agent'
                          }
                        >
                          <Bot size={13} /> {isLimitExceeded ? 'Resume AI (Limit Exceeded)' : 'Resume AI'}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus('handed_off')}
                          style={{ padding: '5px 10px', fontSize: '12px', gap: '4px', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                          title="Assign Human Support Agent"
                        >
                          <UserCheck size={13} /> Handoff
                        </Button>
                      )}

                      {/* Close / Reopen Ticket */}
                      {selectedConv.status !== 'closed' ? (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus('closed')}
                          style={{ padding: '5px 10px', fontSize: '12px', gap: '4px', color: '#94a3b8' }}
                          title="Mark Ticket Closed"
                        >
                          <CheckCircle2 size={13} /> Close Ticket
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus('active')}
                          disabled={isLimitExceeded}
                          style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            gap: '4px',
                            cursor: isLimitExceeded ? 'not-allowed' : 'pointer',
                            opacity: isLimitExceeded ? 0.45 : 1,
                            color: isLimitExceeded ? '#ef4444' : 'var(--accent-emerald)',
                          }}
                          title={isLimitExceeded ? 'Cannot reopen in AI mode: limit reached' : 'Re-open thread control'}
                        >
                          <RotateCcw size={13} /> Re-open Thread
                        </Button>
                      )}

                      {/* Export Transcript */}
                      <Button
                        variant="secondary"
                        onClick={handleExportTranscript}
                        style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}
                        title="Export conversation history"
                      >
                        <Download size={13} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages History List */}
                <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {loadingDetail ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
                      <div style={{ height: '40px', width: '60%', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', alignSelf: 'flex-start' }} />
                      <div style={{ height: '50px', width: '70%', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', alignSelf: 'flex-end' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                      No messages in this conversation thread yet.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      const isSystem = msg.role === 'system';

                      if (isSystem) {
                        return (
                          <div
                            key={msg.id}
                            style={{
                              alignSelf: 'center',
                              background: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              color: 'var(--accent-amber)',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              margin: '8px 0',
                            }}
                          >
                            {msg.content}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '82%',
                          }}
                        >
                          {!isUser && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--gradient-brand)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              <Bot size={16} color="#fff" />
                            </div>
                          )}

                          <div>
                            <div
                              style={{
                                padding: '12px 16px',
                                borderRadius: '14px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                background: isUser ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                                color: '#ffffff',
                                border: isUser ? 'none' : '1px solid var(--border-glass)',
                                boxShadow: isUser ? 'var(--glow-primary)' : 'none',
                              }}
                            >
                              <FormattedMessage content={msg.content} />
                            </div>
                            {msg.createdAt && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--text-dim)',
                                  marginTop: '4px',
                                  textAlign: isUser ? 'right' : 'left',
                                }}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>

                          {isUser && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--accent-cyan)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              <User size={16} color="#fff" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Structured Quick Reply Options Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} style={{ color: 'var(--accent-amber)' }} /> Quick Replies:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                    {QUICK_REPLIES.map((reply) => (
                      <Button
                        key={reply.id}
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setReplyInput(reply.text);
                          replyInputRef.current?.focus();
                        }}
                        title={reply.text}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          gap: '5px',
                        }}
                      >
                        <span>{reply.icon}</span>
                        <span>{reply.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Live Reply Form */}
                <form onSubmit={handleSendReply} style={{ paddingTop: '10px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '10px' }}>
                  <input
                    ref={replyInputRef}
                    type="text"
                    className="input-field"
                    placeholder="Type a live reply to post directly to database..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    loading={sendingReply}
                    loadingText="Sending..."
                    disabled={!replyInput.trim()}
                    style={{ gap: '6px' }}
                  >
                    <Send size={15} /> Send Live Reply
                  </Button>
                </form>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Plus, Search, HelpCircle, ArrowLeft } from 'lucide-react';
import { getStudentMessages, sendStudentMessage } from '../../edops-api';
import { CommunicationChat } from '../../components/communication-chat';

const T = {
  navy: '#0c1e33',
  slate: '#495d72',
  muted: '#a6abb5',
  faint: '#b3b3b3',
  pageBg: '#f4f6f7',
  white: '#ffffff',
  border: '#e4e6e9',
  line: '#ced8e5',
  chip: '#f5f6f8',
  blue: '#17a1fa',
  track: '#eceef3',
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDark: '#1a5c0a',
};

interface CommunicationPaneProps {
  organizationId: string;
  onOpenSupportModal?: () => void;
}

export const CommunicationPane: React.FC<CommunicationPaneProps> = ({
  organizationId,
  onOpenSupportModal,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatList, setShowNewChatList] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [organizationId]);

  const loadMessages = async (preserveActiveId?: string) => {
    try {
      const res = await getStudentMessages(organizationId);
      setData(res);

      const msgs = res?.messages || [];
      const teachers = res?.teachersList || [];

      if (preserveActiveId) {
        setActiveContactId(preserveActiveId);
      } else if (!activeContactId) {
        if (msgs.length > 0) {
          setActiveContactId(msgs[0].otherPartyId || msgs[0].recipientId || teachers[0]?.id || '');
        } else if (teachers.length > 0) {
          setActiveContactId(teachers[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const rawMessages: any[] = data?.messages || [];
  const teachersList: any[] = data?.teachersList || [];

  return <CommunicationChat organizationId={organizationId} title="Direct Messages" />;

  const threadsMap: Record<
    string,
    {
      contactId: string;
      contactName: string;
      contactRole: string;
      messages: any[];
      lastMessage: any;
      unreadCount: number;
    }
  > = {};

  for (const t of teachersList) {
    threadsMap[t.id] = {
      contactId: t.id,
      contactName: t.name,
      contactRole: t.subject ? `${t.subject} Faculty` : 'Instructor',
      messages: [],
      lastMessage: null,
      unreadCount: 0,
    };
  }

  for (const m of rawMessages) {
    const contactId = m.otherPartyId || (m.senderRole === 'student' ? m.recipientId : m.senderId);
    if (!contactId) continue;
    if (!threadsMap[contactId]) {
      threadsMap[contactId] = {
        contactId,
        contactName: m.otherPartyName || 'Teacher',
        contactRole: 'Subject Faculty',
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      };
    }
    threadsMap[contactId].messages.push(m);
    threadsMap[contactId].lastMessage = m;
    if (!m.isRead && m.senderRole !== 'student') {
      threadsMap[contactId].unreadCount++;
    }
  }

  const allThreads = Object.values(threadsMap);
  const filteredThreads = allThreads.filter((t) =>
    t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.contactRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeThread = activeContactId ? threadsMap[activeContactId] : null;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeThread?.messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeContactId) return;

    setSending(true);
    try {
      await sendStudentMessage(organizationId, {
        recipientId: activeContactId,
        content: chatInput.trim(),
      });
      setChatInput('');
      await loadMessages(activeContactId);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <p style={{ fontSize: '13px', fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading communication inbox...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: T.slate,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Direct Faculty Communication
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: T.navy,
              letterSpacing: '-0.01em',
            }}
          >
            Academic Inbox & Direct Messaging
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Communicate with subject teachers, review doubt clarifications, and track notices.
          </p>
        </div>

        {onOpenSupportModal && (
          <button
            type="button"
            onClick={onOpenSupportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              border: `1px solid ${T.navy}`,
              borderRadius: '6px',
              background: T.navy,
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#132840')}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.navy)}
          >
            <HelpCircle size={15} />
            <span>Ask for Guidance & Doubts</span>
          </button>
        )}
      </div>

      {/* 2. Chat Layout Card - 10px radius, 1px border, zero shadows */}
      <div className="chat-layout-card">
        {/* Left Side: Thread Directory */}
        <div
          className={`chat-sidebar-pane ${activeContactId ? 'chat-pane-hidden' : ''}`}
          style={{
            borderRight: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            background: T.white,
            minWidth: 0,
            height: '100%',
          }}
        >
          {/* Thread Search Box */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: T.chip,
                border: '1px solid #ebedf2',
                borderRadius: '6px',
              }}
            >
              <Search size={14} color={T.slate} />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  color: T.navy,
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Threads List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {filteredThreads.map((t) => {
              const active = t.contactId === activeContactId;
              return (
                <div
                  key={t.contactId}
                  onClick={() => setActiveContactId(t.contactId)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${T.border}`,
                    cursor: 'pointer',
                    background: active ? '#f0f4f8' : T.white,
                    borderLeft: active ? `3px solid ${T.navy}` : '3px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = '#FAF8F5';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = T.white;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: active ? 700 : 600, color: T.navy }}>
                      {t.contactName}
                    </span>
                    {t.unreadCount > 0 && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '100px',
                          background: T.navy,
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: T.slate }}>
                    {t.contactRole}
                  </span>
                  {t.lastMessage && (
                    <p style={{ margin: 0, fontSize: '11px', color: T.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.lastMessage.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Message Thread Area */}
        <div
          className={`chat-main-pane ${!activeContactId ? 'chat-pane-hidden' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', background: T.white, minWidth: 0, height: '100%' }}
        >
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: T.pageBg,
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setActiveContactId('')}
                    className="chat-back-btn"
                    aria-label="Back to teacher list"
                    style={{
                      all: 'unset',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      color: T.navy,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Teachers</span>
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeThread.contactName}
                    </h4>
                    <span style={{ fontSize: '12px', color: T.slate, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeThread.contactRole}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '100px',
                    background: T.greenBg,
                    color: T.greenDark,
                    fontSize: '10px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Active Conversation
                </span>
              </div>

              {/* Message Stream */}
              <div
                ref={chatContainerRef}
                style={{
                  flex: 1,
                  padding: '20px 24px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: T.white,
                }}
              >
                {activeThread.messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: T.slate, fontSize: '13px' }}>
                    No messages yet with {activeThread.contactName}. Type below to send an academic question.
                  </div>
                ) : (
                  activeThread.messages.map((m: any, idx: number) => {
                    const isSelf = m.senderRole === 'student';
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            background: isSelf ? T.navy : T.pageBg,
                            color: isSelf ? '#ffffff' : T.navy,
                            border: isSelf ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                            fontSize: '13px',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.content}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            color: T.faint,
                            alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {m.timestamp || m.sentAt || 'Just now'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '12px clamp(12px, 3vw, 20px)',
                  borderTop: `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: T.pageBg,
                }}
              >
                <input
                  type="text"
                  placeholder={`Write your message to ${activeThread.contactName}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${T.line}`,
                    background: T.white,
                    fontSize: '13px',
                    color: T.navy,
                    outline: 'none',
                    fontFamily: "'Poppins', sans-serif",
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !chatInput.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    border: `1px solid ${T.navy}`,
                    borderRadius: '6px',
                    background: T.navy,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: sending || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: sending || !chatInput.trim() ? 0.6 : 1,
                    fontFamily: "'Poppins', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: T.slate, fontSize: '13px', padding: '24px' }}>
              Select a teacher from the left directory to view the conversation.
            </div>
          )}
        </div>
      </div>
      <CommunicationChat organizationId={organizationId} title="Direct Messages" />
    </div>
  );
};

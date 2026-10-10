'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Plus, Search, ArrowLeft } from 'lucide-react';
import { getStudentMessages, sendStudentMessage } from '../../edops-api';

interface CommunicationPaneProps {
  organizationId: string;
  onOpenSupportModal?: () => void;
}

export const CommunicationPane: React.FC<CommunicationPaneProps> = ({
  organizationId,
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

      // Auto-select active chat
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

  // Group messages by contact (conversation thread)
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

  // First seed known teachers so they appear in chat list
  for (const t of teachersList) {
    threadsMap[t.id] = {
      contactId: t.id,
      contactName: t.name,
      contactRole: t.subject || 'Faculty',
      messages: [],
      lastMessage: null,
      unreadCount: 0,
    };
  }

  // Then add all real message history
  for (const m of rawMessages) {
    const key = m.otherPartyId || m.recipientId;
    if (!key) continue;

    if (!threadsMap[key]) {
      threadsMap[key] = {
        contactId: key,
        contactName: m.otherPartyName || m.senderName || 'Teacher',
        contactRole: 'Faculty',
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      };
    }

    threadsMap[key].messages.push(m);
    // Keep most recent message for preview
    if (
      !threadsMap[key].lastMessage ||
      new Date(m.createdAt || m.date) > new Date(threadsMap[key].lastMessage.createdAt || threadsMap[key].lastMessage.date)
    ) {
      threadsMap[key].lastMessage = m;
    }
    if (!m.isRead && !m.isOutgoing) {
      threadsMap[key].unreadCount += 1;
    }
  }

  // Sort threads: threads with messages first (newest first), then empty teacher contacts
  const threads = Object.values(threadsMap).sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return (
        new Date(b.lastMessage.createdAt || b.lastMessage.date).getTime() -
        new Date(a.lastMessage.createdAt || a.lastMessage.date).getTime()
      );
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return a.contactName.localeCompare(b.contactName);
  });

  const activeThread = threadsMap[activeContactId] || threads[0];

  // Auto-scroll chat to bottom when activeThread messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeContactId, activeThread?.messages?.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeThread || sending) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setSending(true);

    try {
      await sendStudentMessage(organizationId, {
        recipientId: activeThread.contactId,
        subjectLine: activeThread.messages.length > 0 ? `Re: ${activeThread.messages[0].subjectLine}` : 'Academic Query',
        body: messageText,
        priority: 'normal',
      });

      await loadMessages(activeThread.contactId);
    } catch (err) {
      console.error(err);
      setChatInput(messageText);
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = threads.filter((t) =>
    t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.contactRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse text-xs">Loading academic chat desk...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Academic Chat & Teacher Messages
          </h2>
          <p className="text-xs text-slate-500">
            Real-time conversational message thread with your teachers and academic mentors
          </p>
        </div>
      </div>

      {/* WhatsApp-Style Split Chat Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[620px] max-h-[620px]">
        {/* Left Column: Conversations List */}
        <div className="border-r border-slate-100 flex flex-col h-full min-h-0 bg-slate-50/50 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-white space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No teachers found.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.contactId === thread.contactId;
                const hasMsgs = thread.messages.length > 0;
                return (
                  <div
                    key={thread.contactId}
                    onClick={() => setActiveContactId(thread.contactId)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {(thread.contactName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {thread.contactName}
                        </span>
                        {thread.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {thread.lastMessage.timestamp || thread.lastMessage.date}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-indigo-600 font-medium truncate">
                        {thread.contactRole}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {thread.lastMessage ? thread.lastMessage.body : 'Click to start conversation...'}
                      </p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 self-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation Stream & Input */}
        <div className="md:col-span-2 flex flex-col h-full min-h-0 bg-slate-50/30 overflow-hidden">
          {activeThread ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {(activeThread.contactName || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {activeThread.contactName}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {activeThread.contactRole} · Active Academic Session
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Stream (Oldest to Newest) */}
              <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {activeThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-xs">
                      No messages with {activeThread.contactName} yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Type your message below to start this conversation!
                    </p>
                  </div>
                ) : (
                  activeThread.messages
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.createdAt || a.date).getTime() -
                        new Date(b.createdAt || b.date).getTime()
                    )
                    .map((msg: any) => {
                      const isMe = msg.isOutgoing;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-xs'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                            }`}
                          >
                            {msg.subjectLine && !msg.subjectLine.startsWith('Re:') && (
                              <div
                                className={`text-[10px] font-bold mb-1 pb-1 border-b ${
                                  isMe
                                    ? 'border-indigo-500/60 text-indigo-100'
                                    : 'border-slate-100 text-indigo-600'
                                }`}
                              >
                                {msg.subjectLine}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 px-1">
                            {msg.timestamp || msg.date}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Chat Message Input Bar (WhatsApp-style) */}
              <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Message ${activeThread.contactName}... (Press Enter to send)`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !chatInput.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-40 transition shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select a teacher conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCommunicationConversation,
  getCommunicationConversations,
  getCommunicationRecipients,
  markCommunicationRead,
  openCommunicationStream,
  sendCommunicationMessage,
} from "../edops-api";

type Conversation = {
  conversationId: string;
  participantId: string;
  participantName?: string;
  participantEmail?: string;
  participantRole?: string;
  subject?: string;
  preview?: string;
  unreadCount?: number;
  lastMessageAt?: string;
};

type Recipient = { id: string; name?: string; email?: string; role?: string };
type Message = { id: string; senderId: string; senderName?: string; body: string; createdAt?: string };

const filters = ["all", "student", "parent", "principal", "teacher", "staff"];
const labels: Record<string, string> = { all: "All", student: "Students", parent: "Parents", principal: "Principal", teacher: "Teachers", staff: "Staff" };
const initials = (name?: string) => (name || "S").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const shortTime = (value?: string) => value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export function CommunicationChat({ organizationId, title = "Messages", onComposeBroadcast }: { organizationId: string; title?: string; onComposeBroadcast?: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [people, setPeople] = useState<Recipient[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [body, setBody] = useState("");
  const [draftRecipient, setDraftRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const peopleRequest = useRef(0);
  const selectedIdRef = useRef("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const followMessages = useRef(true);
  const lastConversation = useRef("");
  const selected = useMemo(() => conversations.find((item) => item.conversationId === selectedId), [conversations, selectedId]);
  const activeRecipient: any = selected || draftRecipient;
  const loadConversations = useCallback(async () => {
    const rows = await getCommunicationConversations(organizationId);
    setConversations(Array.isArray(rows) ? rows : []);
    setSelectedId((current) => current || rows?.[0]?.conversationId || "");
    return Array.isArray(rows) ? rows : [];
  }, [organizationId]);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    if (!conversationSearch.trim()) return;
    const requestId = ++peopleRequest.current;
    const timer = setTimeout(() => {
      setPeopleLoading(true);
      void getCommunicationRecipients(organizationId, filter === "all" ? undefined : filter, conversationSearch)
        .then((data) => { if (requestId === peopleRequest.current) setPeople(Array.isArray(data) ? data : []); })
        .catch(() => { if (requestId === peopleRequest.current) setPeople([]); })
        .finally(() => { if (requestId === peopleRequest.current) setPeopleLoading(false); });
    }, 250);
    return () => clearTimeout(timer);
  }, [organizationId, conversationSearch, filter]);

  useEffect(() => {
    // Initial remote data load; subsequent state updates happen after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations().catch(() => setConversations([])).finally(() => setLoading(false));
    const dispose = openCommunicationStream(organizationId, (event) => {
      void loadConversations();
      if (event.conversationId && event.conversationId === selectedIdRef.current) {
        void getCommunicationConversation(organizationId, event.conversationId).then(setMessages).catch(() => undefined);
      }
    });
    return dispose;
  }, [organizationId, loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    getCommunicationConversation(organizationId, selectedId).then(setMessages).catch(() => setMessages([]));
    void markCommunicationRead(organizationId, selectedId);
  }, [organizationId, selectedId]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    const frame = requestAnimationFrame(() => {
      const conversationChanged = lastConversation.current !== selectedId;
      lastConversation.current = selectedId;
      if (conversationChanged || followMessages.current) {
        list.scrollTo({ top: list.scrollHeight });
        setHasNewMessages(false);
      } else if (messages.length) setHasNewMessages(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, messages]);

  const reply = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeRecipient || !body.trim() || sending) return;
    const recipientId = selected?.participantId || draftRecipient?.id || "";
    const conversationId = selected?.conversationId;
    setSending(true);
    followMessages.current = true;
    try {
      await sendCommunicationMessage(organizationId, { recipientId, recipientRole: selected?.participantRole || draftRecipient?.role || "parent", subject: selected?.subject || "Direct message", body: body.trim(), ...(conversationId ? { conversationId } : {}) });
      setBody("");
      if (conversationId) setMessages(await getCommunicationConversation(organizationId, conversationId));
      else {
        const rows = await loadConversations();
        const created = rows.find((item: Conversation) => item.participantId === recipientId);
        setDraftRecipient(null);
        if (created) setSelectedId(created.conversationId);
      }
    } catch { /* the shared API error banner handles the failure */ }
    finally { setSending(false); }
  };

  const openPerson = (person: Recipient) => {
    const existing = conversations.find((item) => item.participantId === person.id);
    if (existing) {
      setDraftRecipient(null);
      setSelectedId(existing.conversationId);
    } else {
      setSelectedId("");
      setDraftRecipient(person);
    }
    setConversationSearch("");
  };

  return (
    <section className={`edops-chat-shell${activeRecipient ? " has-selection" : ""}`}>
      <style>{`
        .edops-chat-shell{display:grid;grid-template-columns:340px minmax(0,1fr);height:calc(100dvh - 140px);min-height:520px;max-height:900px;min-width:0;overflow:hidden;border:1px solid #e1e7ee;border-radius:14px;background:#fff;box-shadow:0 2px 8px rgba(12,30,51,.04)}
        .edops-chat-sidebar{min-width:0;min-height:0;height:100%;border-right:1px solid #e1e7ee;display:flex;flex-direction:column}
        .edops-chat-main{position:relative;min-width:0;min-height:0;height:100%;display:flex;flex-direction:column;background:#f7f9fb}
        .edops-chat-composer{flex-shrink:0}
        .edops-chat-mobile-back{display:none}
        .edops-chat-filters{display:flex;gap:6px;overflow-x:auto;padding:0 20px 12px 14px;scrollbar-width:thin;overscroll-behavior-x:contain}
        .edops-chat-filters::-webkit-scrollbar{height:5px}
        .edops-chat-filters::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
        .edops-chat-filter{white-space:nowrap;border:0;border-radius:16px;padding:7px 11px;background:#f1f4f8;color:#5d7087;font-weight:700;font-size:12px;cursor:pointer}
        .edops-chat-filter.active{background:#0c1e33;color:#fff}
        @media(max-width:900px){.edops-chat-shell{grid-template-columns:290px minmax(0,1fr)}}
        .edops-chat-new-messages{position:absolute;z-index:1;left:50%;bottom:72px;transform:translateX(-50%);border:0;border-radius:18px;padding:8px 13px;background:#0c1e33;color:#fff;font-weight:700;box-shadow:0 3px 10px rgba(12,30,51,.2);cursor:pointer}
        @media(max-width:640px){.edops-chat-shell{display:block;height:calc(100dvh - 110px);min-height:420px;max-height:none}.edops-chat-main{display:none}.edops-chat-shell.has-selection .edops-chat-sidebar{display:none}.edops-chat-shell.has-selection .edops-chat-main{display:flex;height:100%}.edops-chat-mobile-back{display:inline-flex!important}.edops-chat-composer{padding:10px!important}.edops-chat-composer button{padding:0 12px!important}}
      `}</style>
      <aside className="edops-chat-sidebar">
        <header style={{ padding: "16px", borderBottom: "1px solid #e1e7ee" }}><h2 style={{ margin: 0, color: "#0c1e33", fontSize: 19 }}>{title}</h2><small style={{ color: "#71839a" }}>{conversations.length} conversation{conversations.length === 1 ? "" : "s"}</small></header>
        <div style={{ padding: 12 }}><input name="communication-people-search" type="search" autoComplete="off" aria-label="Search people" value={conversationSearch} onChange={(event) => { const value = event.target.value; setConversationSearch(value); if (!value.trim()) { peopleRequest.current += 1; setPeople([]); setPeopleLoading(false); } }} placeholder="Search people by name or email…" style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #d4dee9", borderRadius: 9 }} /></div>
        <div className="edops-chat-filters" aria-label="Filter people by role">{filters.map((item) => <button key={item} type="button" className={`edops-chat-filter${filter === item ? " active" : ""}`} onClick={() => setFilter(item)}>{labels[item]}</button>)}</div>
        <div style={{ overflowY: "auto", flex: 1 }}>{conversationSearch.trim() ? (peopleLoading ? <p style={{ padding: 16, color: "#71839a" }}>Searching people…</p> : people.length ? people.map((person) => <button key={person.id} type="button" onClick={() => openPerson(person)} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderTop: "1px solid #eef2f6", background: "#fff", padding: "12px 16px", cursor: "pointer" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ display: "grid", placeItems: "center", flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: "#dcecff", color: "#0c1e33", fontSize: 12, fontWeight: 800 }}>{initials(person.name || person.email)}</span><span><strong style={{ color: "#0c1e33" }}>{person.name || person.email}</strong><small style={{ display: "block", marginTop: 3, color: "#71839a" }}>{person.email} · {(labels as any)[(person as any).role] || (person as any).role}</small></span></div></button>) : <p style={{ padding: 22, textAlign: "center", color: "#71839a", fontSize: 13 }}>No people found.</p>) : loading ? <p style={{ padding: 16, color: "#71839a" }}>Loading conversations…</p> : conversations.length ? conversations.map((item) => <button key={item.conversationId} type="button" onClick={() => setSelectedId(item.conversationId)} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderTop: "1px solid #eef2f6", background: item.conversationId === selectedId ? "#eef4fa" : "#fff", padding: "12px 16px", cursor: "pointer" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ display: "grid", placeItems: "center", flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: item.conversationId === selectedId ? "#c9def4" : "#edf2f7", color: "#0c1e33", fontSize: 12, fontWeight: 800 }}>{initials(item.participantName || item.participantEmail)}</span><span style={{ minWidth: 0, flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#0c1e33", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.participantName || item.participantEmail || "School member"}</strong><small style={{ color: "#71839a", flexShrink: 0 }}>{shortTime(item.lastMessageAt)}</small></div><small style={{ display: "block", marginTop: 4, color: "#71839a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.preview || item.subject || "Direct message"}</small></span>{item.unreadCount ? <span style={{ minWidth: 20, textAlign: "center", borderRadius: 10, background: "#0c1e33", color: "#fff", fontSize: 11 }}>{item.unreadCount}</span> : null}</div></button>) : <p style={{ padding: 22, textAlign: "center", color: "#71839a", fontSize: 13 }}>No conversations yet.</p>}</div>
      </aside>
      <main className="edops-chat-main">
        <header style={{ minHeight: 72, boxSizing: "border-box", padding: "14px 18px", borderBottom: "1px solid #e1e7ee", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}><button className="edops-chat-mobile-back" type="button" onClick={() => { setSelectedId(""); setDraftRecipient(null); }} style={{ border: "1px solid #d4dee9", borderRadius: 8, background: "#fff", padding: "7px 10px" }}>Back</button>{activeRecipient && <span style={{ display: "grid", placeItems: "center", flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: "#dcecff", color: "#0c1e33", fontWeight: 800 }}>{initials(activeRecipient.participantName || activeRecipient.name || activeRecipient.participantEmail || activeRecipient.email)}</span>}<div style={{ minWidth: 0 }}><strong style={{ display: "block", color: "#0c1e33", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeRecipient?.participantName || activeRecipient?.name || "Select a conversation"}</strong>{activeRecipient && <small style={{ color: "#71839a" }}>{activeRecipient.participantRole || activeRecipient.role || "School member"} · {selected ? "Active conversation" : "New conversation"}</small>}</div></div>{onComposeBroadcast && <button type="button" onClick={onComposeBroadcast} style={{ flexShrink: 0, border: 0, borderRadius: 8, background: "#0c1e33", color: "#fff", padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>Compose Broadcast</button>}</header>
        <div ref={messageListRef} role="log" aria-live="polite" aria-relevant="additions" onScroll={(event) => { const list = event.currentTarget; followMessages.current = list.scrollHeight - list.scrollTop - list.clientHeight < 100; if (followMessages.current) setHasNewMessages(false); }} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10, background: "#f4f7fa" }}>{!activeRecipient ? <div style={{ margin: "auto", textAlign: "center", color: "#71839a" }}><div style={{ fontSize: 34, marginBottom: 8 }}>💬</div><strong style={{ color: "#52657b" }}>Select a person from the left</strong><p style={{ margin: "6px 0 0", fontSize: 13 }}>Search people or choose a conversation to start chatting.</p></div> : selected && messages.length ? messages.map((message) => { const outgoing = message.senderId !== selected.participantId; return <div key={message.id} style={{ alignSelf: outgoing ? "flex-end" : "flex-start", maxWidth: "min(72%, 560px)", padding: "10px 13px", borderRadius: outgoing ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: outgoing ? "#dcecff" : "#fff", color: "#0c1e33", border: "1px solid #e1e7ee" }}><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{message.body}</div><small style={{ display: "block", marginTop: 5, color: "#71839a", fontSize: 10 }}>{message.senderName || ""}{message.createdAt ? ` · ${shortTime(message.createdAt)}` : ""}</small></div>; }) : <p style={{ margin: "auto", color: "#71839a" }}>Start a new conversation with {activeRecipient.participantName || activeRecipient.name || activeRecipient.participantEmail || activeRecipient.email}.</p>}</div>
        {hasNewMessages && <button className="edops-chat-new-messages" type="button" onClick={() => { const list = messageListRef.current; followMessages.current = true; if (list) list.scrollTo({ top: list.scrollHeight }); setHasNewMessages(false); }}>New messages ↓</button>}
        <form className="edops-chat-composer" onSubmit={reply} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e1e7ee", background: "#fff" }}><input disabled={!activeRecipient || sending} aria-label="Message" value={body} onChange={(event) => setBody(event.target.value)} placeholder={activeRecipient ? "Write a message…" : "Select a person first"} style={{ minWidth: 0, flex: 1, padding: "11px 12px", border: "1px solid #d4dee9", borderRadius: 9 }} /><button disabled={!activeRecipient || !body.trim() || sending} type="submit" style={{ border: 0, borderRadius: 9, background: "#0c1e33", color: "#fff", padding: "0 18px", fontWeight: 700, cursor: activeRecipient && !sending ? "pointer" : "not-allowed", opacity: activeRecipient && body.trim() && !sending ? 1 : .55 }}>{sending ? "Sending…" : "Send"}</button></form>
      </main>
    </section>
  );
}

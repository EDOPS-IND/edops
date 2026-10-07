"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Check
} from "lucide-react";
import { getTeacherMessages, sendTeacherMessage } from "../../edops-api";

interface CommunicationPaneProps {
  organizationId: string;
}

export function CommunicationPane({ organizationId }: CommunicationPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "parents" | "students" | "principal" | "school_admin">("all");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Send message composer
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [organizationId]);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await getTeacherMessages(organizationId);
      setData(res);
      if (res?.messages?.length > 0) {
        setSelectedMessage(res.messages[0]);
      }
    } catch {
      setData({ messages: [], announcements: [] });
      setSelectedMessage(null);
    } finally {
      setLoading(false);
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    setSending(true);
    try {
      await sendTeacherMessage(organizationId, {
        recipientId: selectedMessage.recipientId || "user-target",
        recipientRole: selectedMessage.senderRole,
        subjectLine: `Re: ${selectedMessage.subjectLine}`,
        body: replyText,
      });
      setReplyText("");
      await loadMessages();
    } catch {
      setReplyText("");
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = (data?.messages || []).filter((m: any) => {
    if (activeTab === "all") return true;
    return m.category === activeTab || m.senderRole === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-600 " />
          Academic Communication & In-App Messaging Desk
        </h2>
        <p className="text-xs text-gray-500  mt-0.5">
          Authorized channels for parents of assigned students, enrolled learners, principal and admin office
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200  gap-4 text-xs font-bold">
        {[
          { id: "all", label: "All Messages" },
          { id: "parents", label: "Parents" },
          { id: "students", label: "Students" },
          { id: "principal", label: "Principal Directives" },
          { id: "school_admin", label: "School Admin" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2.5 border-b-2 transition ${
              activeTab === t.id
                ? "border-indigo-600 text-indigo-600 "
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Split Inbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white  rounded-xl border border-gray-200  overflow-hidden min-h-[500px]">
        {/* Messages List (Left Col) */}
        <div className="border-r border-gray-200  divide-y divide-gray-100  overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No messages found in this category. Messages will appear here as they arrive.
            </div>
          ) : (
            filteredMessages.map((msg: any) => {
            const isSelected = selectedMessage?.id === msg.id;
            return (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 cursor-pointer transition text-xs space-y-1 ${
                  isSelected
                    ? "bg-indigo-50/80  border-l-4 border-indigo-600"
                    : "hover:bg-gray-50 :bg-gray-750/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900  truncate">
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">{msg.timestamp}</span>
                </div>
                <div className="font-semibold text-indigo-600  truncate">
                  {msg.subjectLine}
                </div>
                <p className="text-gray-500 line-clamp-2 text-[11px]">{msg.body}</p>
              </div>
            );
          }))}
        </div>

        {/* Message View & Reply Composer (Right 2 Cols) */}
        <div className="lg:col-span-2 p-6 flex flex-col justify-between space-y-6">
          {selectedMessage ? (
            <>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100 ">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800  ">
                      {selectedMessage.senderRole}
                    </span>
                    <span className="text-xs text-gray-400">{selectedMessage.timestamp}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900  mt-1">
                    {selectedMessage.subjectLine}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    From: <strong>{selectedMessage.senderName}</strong>
                  </div>
                </div>

                <div className="p-4 bg-gray-50  rounded-xl text-xs text-gray-800  leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Reply Box */}
              <div className="pt-4 border-t border-gray-100  space-y-2">
                <label className="text-xs font-bold text-gray-700  block">
                  Compose In-App Academic Reply
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    placeholder="Type your official academic response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 p-3 text-xs bg-gray-50  border border-gray-300  rounded-xl text-gray-900 "
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2 font-semibold text-xs rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 self-end shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-gray-400 text-xs">
              Select a message conversation to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

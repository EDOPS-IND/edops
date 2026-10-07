'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, User, Megaphone, Plus } from 'lucide-react';
import { getStudentMessages, sendStudentMessage } from '../../edops-api';

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
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [recipientId, setRecipientId] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [organizationId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await getStudentMessages(organizationId);
      setData(res);
      if (res?.teachersList?.length > 0) {
        setRecipientId(res.teachersList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendStudentMessage(organizationId, {
        recipientId,
        subjectLine,
        body,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubjectLine('');
        setBody('');
        setActiveTab('inbox');
        loadMessages();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading academic communication inbox...</div>;
  }

  const messages = data?.messages || [];
  const teachersList = data?.teachersList || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Inbox & Teacher Communication</h2>
          <p className="text-sm text-slate-500">Privately message your subject teachers, class teacher, and receive official circulars.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ask Teacher a Question</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'inbox'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inbox Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'compose'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          New Message to Teacher
        </button>
      </div>

      {activeTab === 'inbox' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`p-5 space-y-2 hover:bg-slate-50 transition-colors ${
                  !msg.isRead ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {msg.senderName.charAt(0)}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{msg.senderName}</h4>
                    {!msg.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{msg.date}</span>
                </div>
                <h5 className="text-xs font-semibold text-slate-800">{msg.subjectLine}</h5>
                <p className="text-xs text-slate-600">{msg.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-xl">
          {success ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Message Dispatched!</h4>
              <p className="text-xs text-slate-500">Your query has been routed to your teacher&apos;s academic inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Faculty</label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {teachersList.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Question Summary</label>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  placeholder="E.g. Doubt regarding Question 4 from today's assignment"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your academic query or clarification respectfully..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Send Query'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, MessageSquare, ChevronDown, User } from 'lucide-react';
import { createStudentSupportRequest, getStudentSubjects } from '../../edops-api';

/**
 * Design tokens strictly adhering to DESIGN.md
 * Source: Figma file `Student-Portal--Community-`, node `2005:1679` ("edops · Student dashboard")
 *
 * Rules:
 * - Shadows: NONE. Depth comes from borders and fills only.
 * - Font: Poppins for all UI text.
 * - Card radius: 10 px.
 * - Buttons, inputs, search, clear box radius: 6 px.
 * - Header icon buttons: 36 px, radius 8 px, bg chip (#f5f6f8).
 * - Pills: 100 px fully rounded.
 */
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
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDark: '#1a5c0a',
};

interface SupportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess?: () => void;
}

export const SupportRequestModal: React.FC<SupportRequestModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}) => {
  const [category, setCategory] = useState<'doubt' | 'academic' | 'counselling' | 'subject_help'>('doubt');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getStudentSubjects(organizationId)
        .then((res) => setSubjects(res.subjects || []))
        .catch(() => setSubjects([]));
    }
  }, [isOpen, organizationId]);

  if (!isOpen) return null;

  const selectedSubjectObj = subjects.find((s) => s.id === subject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe your question or where you are stuck.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createStudentSupportRequest(organizationId, {
        category,
        subjectId: subject || undefined,
        description: description.trim(),
        urgency,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        setSubject('');
        setCategory('doubt');
        setUrgency('normal');
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit doubt request to teacher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(12, 30, 51, 0.45)',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Card: White, 1px border, radius 10px, NO SHADOW per Section 2.5 */}
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Header - 1px bottom border (#e4e6e9), padding 20px 24px */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '20px 24px',
            background: T.white,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Card Eyebrow per Section 2.2: 10 px / 600 uppercase */}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: T.slate,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Academic Doubts & Guidance
            </span>
            <h2
              id="support-modal-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: T.navy,
                letterSpacing: '-0.01em',
              }}
            >
              Ask for Academic Guidance & Doubts
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: T.slate,
                lineHeight: 1.5,
              }}
            >
              Privately message your subject or class teacher
            </p>
          </div>

          {/* Close button per Section 2.4 & 3.2: 36 px icon button, radius 8, bg chip (#f5f6f8) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              all: 'unset',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: T.chip,
              color: T.slate,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxSizing: 'border-box',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e4e6e9';
              e.currentTarget.style.color = T.navy;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.chip;
              e.currentTarget.style.color = T.slate;
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          /* Clear message box per Section 3.3 Attention Required clear message box:
             bg #d9eed1, padding 20, radius 6, gap 15; 26 px check icon; title 14/600; subtext 12 / 1.5; text #1a5c0a */
          <div style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                borderRadius: '6px',
                background: T.greenBg,
                color: T.greenDark,
              }}
            >
              <CheckCircle2 size={26} color={T.green} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.greenDark }}>
                  Doubt request submitted.
                </p>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: T.greenDark }}>
                  Your question has been sent privately. Your teacher will reply directly in your Academic Inbox.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxHeight: 'calc(85vh - 160px)',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    background: '#ffd6d6',
                    border: '1px solid #ffd6d6',
                    color: '#7a1a1a',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Grid: Category & Subject */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                {/* Category */}
                <div>
                  <label
                    htmlFor="support-category"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: T.navy,
                      marginBottom: '6px',
                    }}
                  >
                    Category
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="support-category"
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 32px 10px 14px',
                        fontSize: '13px',
                        color: T.navy,
                        background: T.white,
                        border: `1px solid ${T.line}`,
                        borderRadius: '6px',
                        outline: 'none',
                        fontFamily: "'Poppins', sans-serif",
                        appearance: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="doubt">Subject Doubt / Question</option>
                      <option value="academic">Academic Concept Revision</option>
                      <option value="counselling">Academic Guidance / Stress</option>
                      <option value="subject_help">Remedial Help Request</option>
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: T.slate,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="support-subject"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: T.navy,
                      marginBottom: '6px',
                    }}
                  >
                    Subject
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="support-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 32px 10px 14px',
                        fontSize: '13px',
                        color: T.navy,
                        background: T.white,
                        border: `1px solid ${T.line}`,
                        borderRadius: '6px',
                        outline: 'none',
                        fontFamily: "'Poppins', sans-serif",
                        appearance: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">General support</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.teacher ? ` (${s.teacher})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: T.slate,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Faculty note if selected subject has a teacher */}
              {selectedSubjectObj?.teacher && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: T.pageBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: T.slate,
                    lineHeight: 1.5,
                  }}
                >
                  <User size={15} color={T.navy} />
                  <span>
                    Direct recipient:{' '}
                    <strong style={{ color: T.navy, fontWeight: 600 }}>{selectedSubjectObj.teacher}</strong>
                  </span>
                </div>
              )}

              {/* Describe your question or where you are stuck * */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    htmlFor="support-description"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: T.navy,
                    }}
                  >
                    Describe your question or where you are stuck *
                  </label>
                  <span style={{ fontSize: '11px', color: T.faint }}>Be specific</span>
                </div>
                <textarea
                  id="support-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g. Sir, I am having trouble understanding how to find the roots when the discriminant is negative..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: T.navy,
                    background: T.white,
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    outline: 'none',
                    fontFamily: "'Poppins', sans-serif",
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    minHeight: '110px',
                  }}
                />
              </div>

              {/* Urgency - Section 4: Pill neutral (#f5f6f8), radius 100px */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: T.navy,
                    marginBottom: '8px',
                  }}
                >
                  Urgency
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[
                    { id: 'normal', label: 'Normal Priority' },
                    { id: 'urgent', label: 'Urgent (Upcoming Test / Exam)' },
                  ].map((u) => {
                    const active = urgency === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUrgency(u.id as any)}
                        style={{
                          all: 'unset',
                          boxSizing: 'border-box',
                          padding: '6px 14px',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: active ? 600 : 500,
                          cursor: 'pointer',
                          background: active ? T.navy : T.chip,
                          color: active ? '#ffffff' : T.slate,
                          border: active ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer - 1px top border (#e4e6e9), padding 16px 24px */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '16px 24px',
                background: T.pageBg,
                borderTop: `1px solid ${T.border}`,
              }}
            >
              {/* Cancel Button - Section 3.3 Outline button: padding 10 × 16, gap 8, 1 px line border, radius 6, 13/600 */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  background: T.white,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: T.navy,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#98A2B3';
                  e.currentTarget.style.background = '#FAF8F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.line;
                  e.currentTarget.style.background = T.white;
                }}
              >
                Cancel
              </button>

              {/* Send to Teacher - Section 3.3 Ask Teacher button: padding 10 × 16, border 1px navy, radius 6, filled navy, white text 13/600 */}
              <button
                type="submit"
                disabled={submitting}
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
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.background = '#132840';
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.background = T.navy;
                }}
              >
                <MessageSquare size={16} />
                <span>{submitting ? 'Sending...' : 'Send to Teacher'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

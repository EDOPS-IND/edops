'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, FileText, AlertCircle, ArrowRight, Calendar, Award } from 'lucide-react';
import { submitStudentAssignment } from '../../edops-api';

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

interface AssignmentSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  assignment: any;
  onSuccess?: () => void;
}

export const AssignmentSubmitModal: React.FC<AssignmentSubmitModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  assignment,
  onSuccess,
}) => {
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide text explanation or solution description.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitStudentAssignment(organizationId, assignment.id, {
        content: content.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setContent('');
        setAttachmentUrl('');
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
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
        {/* Header */}
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
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: T.slate,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Coursework Submission
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
              Submit Homework
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: T.slate,
                lineHeight: 1.5,
              }}
            >
              {assignment.title} · <strong style={{ color: T.navy, fontWeight: 600 }}>{assignment.subject}</strong>
            </p>
          </div>

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

        {/* Content Body */}
        {success ? (
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
                  Submission Recorded!
                </p>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: T.greenDark }}>
                  Your solution has been submitted to {assignment.teacher || 'your instructor'}. The submission receipt has been logged.
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
                gap: '18px',
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

              {/* Assignment Meta Card */}
              <div
                style={{
                  background: T.pageBg,
                  padding: '14px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${T.border}`,
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: T.navy }}>
                    Max Marks: {assignment.maxMarks ?? 100}
                  </span>
                  <span
                    style={{
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: T.navy,
                    }}
                  >
                    Due: {assignment.dueDate || 'Today'}
                  </span>
                </div>
                {assignment.instructions && (
                  <p style={{ margin: 0, color: T.slate, lineHeight: 1.5 }}>
                    {assignment.instructions}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="submit-content"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: T.navy,
                    marginBottom: '6px',
                  }}
                >
                  Solution Text / Mathematical Derivation *
                </label>
                <textarea
                  id="submit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your answer, derivations, or problem breakdown steps here..."
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

              <div>
                <label
                  htmlFor="submit-url"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: T.navy,
                    marginBottom: '6px',
                  }}
                >
                  Attachment URL (PDF, Google Drive, or Image)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="submit-url"
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or cloud document link"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      color: T.navy,
                      background: T.white,
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      outline: 'none',
                      fontFamily: "'Poppins', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
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
                <Upload size={16} />
                <span>{submitting ? 'Submitting...' : 'Confirm Submission'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

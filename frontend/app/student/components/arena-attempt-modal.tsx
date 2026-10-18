'use client';

import React, { useEffect, useState } from 'react';
import { X, Trophy, CheckCircle2, XCircle, ArrowRight, AlertCircle, Award, Check } from 'lucide-react';
import { submitStudentArenaAttempt } from '../../edops-api';

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

interface ArenaAttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  activity: any;
  onSuccess?: () => void;
}

export function ArenaAttemptModal({
  isOpen,
  onClose,
  organizationId,
  activity,
  onSuccess,
}: ArenaAttemptModalProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setIndex(0);
    setSelected([]);
    setResult(null);
    setError('');
    setScore(0);
    setFinished(false);
  }, [isOpen, activity?.id]);

  if (!isOpen || !activity) return null;

  const questions = activity.questions || [];
  const question = questions[index];

  const toggleOption = (i: number) => {
    if (result || busy) return;
    if (question?.type === 'multiple_choice') {
      setSelected(prev => (prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i]));
    } else {
      setSelected([i]);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected.length) return;
    setBusy(true);
    setError('');
    try {
      const saved = await submitStudentArenaAttempt(organizationId, question.id, {
        submittedAnswer: selected,
      });
      setResult(saved);
      setScore(s => s + (saved.score || 0));
      onSuccess?.();
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Attempt could not be saved');
    } finally {
      setBusy(false);
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex(prev => prev + 1);
      setSelected([]);
      setResult(null);
      setError('');
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
          maxWidth: '640px',
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
              Interactive Problem Solving
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
              {activity.title}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: T.slate }}>
              {activity.subject || 'Academics'} · Score: <strong style={{ color: T.navy }}>{score} pts</strong>
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
        <div style={{ padding: '24px', boxSizing: 'border-box' }}>
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
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {finished ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '20px',
                  borderRadius: '6px',
                  background: T.greenBg,
                  color: T.greenDark,
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 size={26} color={T.green} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.greenDark }}>
                    Arena Challenge Completed!
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: T.greenDark }}>
                    You earned {score} points across {questions.length} questions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${T.navy}`,
                  borderRadius: '6px',
                  background: T.navy,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Return to Dashboard
              </button>
            </div>
          ) : !question ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: T.slate, fontSize: '13px' }}>
              No published practice questions available for this module.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Question Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: T.navy }}>
                  Question {index + 1} of {questions.length}
                </span>
                <span style={{ color: T.slate }}>
                  {question.type === 'multiple_choice' ? 'Multiple choice' : 'Single choice'}
                </span>
              </div>

              {/* Progress Track */}
              <div style={{ width: '100%', height: '6px', background: T.chip, borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: T.navy,
                    width: `${((index + 1) / questions.length) * 100}%`,
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>

              {/* Question prompt card */}
              <div
                style={{
                  padding: '16px',
                  background: T.pageBg,
                  borderRadius: '6px',
                  border: `1px solid ${T.border}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: T.navy,
                  lineHeight: 1.5,
                }}
              >
                {question.question}
              </div>

              {/* Options */}
              <form onSubmit={handleAnswerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {question.options.map((option: string, i: number) => {
                  const isChecked = selected.includes(i);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleOption(i)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: isChecked ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                        background: isChecked ? '#f0f4f8' : T.white,
                        color: T.navy,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: question.type === 'multiple_choice' ? '4px' : '50%',
                          border: isChecked ? `1px solid ${T.navy}` : `1px solid ${T.line}`,
                          background: isChecked ? T.navy : T.white,
                          display: 'grid',
                          placeItems: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span>{option}</span>
                    </div>
                  );
                })}

                {/* Result Feedback */}
                {result && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '6px',
                      background: result.isCorrect ? T.greenBg : '#ffd6d6',
                      color: result.isCorrect ? T.greenDark : '#7a1a1a',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{result.isCorrect ? 'Correct Solution!' : 'Incorrect'}</span>
                      <span>+{result.score ?? (result.isCorrect ? 10 : 0)} pts</span>
                    </div>
                    {result.explanation && <p style={{ margin: 0 }}>{result.explanation}</p>}
                  </div>
                )}

                {/* Footer Submit / Next */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                  {!result ? (
                    <button
                      type="submit"
                      disabled={busy || !selected.length}
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
                        cursor: busy || !selected.length ? 'not-allowed' : 'pointer',
                        opacity: busy || !selected.length ? 0.6 : 1,
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      <span>{busy ? 'Evaluating...' : 'Submit Answer'}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
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
                      }}
                    >
                      <span>{index + 1 >= questions.length ? 'Finish Practice' : 'Next Question'}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

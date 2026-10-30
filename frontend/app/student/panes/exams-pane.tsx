'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Award, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getStudentExams } from '../../edops-api';

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

interface ExamsPaneProps {
  organizationId: string;
}

export function ExamsPane({ organizationId }: ExamsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStudentExams(organizationId);
      setData(res);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Unable to load examination records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [organizationId]);

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
          Loading examination schedules & scorecards...
        </p>
      </div>
    );
  }

  const upcomingExams = data?.upcomingExams || [];
  const scorecards = data?.scorecards || [];

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
            Examinations & Results
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
            Term Examinations & Published Results
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Central CBSE examination schedules, datesheets, and published grade transcripts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
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
            fontFamily: "'Poppins', sans-serif",
            transition: 'all 0.15s ease',
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
          <Printer size={15} />
          <span>Print Transcripts</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '14px 16px',
            borderRadius: '6px',
            background: '#ffd6d6',
            border: '1px solid #ffd6d6',
            color: '#7a1a1a',
            fontSize: '13px',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadExams}
            style={{
              all: 'unset',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Upcoming Exam Schedules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {upcomingExams.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '10px',
              fontSize: '13px',
              color: T.slate,
            }}
          >
            No upcoming examination timetables scheduled.
          </div>
        ) : (
          upcomingExams.map((exam: any) => (
            <div
              key={exam.id}
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: '10px',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color={T.navy} />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
                    {exam.name}
                  </h3>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '100px',
                    background: T.chip,
                    fontSize: '10px',
                    fontWeight: 600,
                    color: T.slate,
                  }}
                >
                  Datesheet Published
                </span>
              </div>

              {/* Table of Schedules */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(exam.schedule || []).map((row: any, rIdx: number) => (
                  <div
                    key={rIdx}
                    style={{
                      padding: '14px 24px',
                      borderBottom: rIdx === exam.schedule.length - 1 ? 'none' : `1px solid ${T.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      background: rIdx % 2 === 0 ? T.white : '#fcfdfe',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: T.slate, minWidth: '90px' }}>
                        {row.date}
                      </span>
                      <strong style={{ color: T.navy }}>{row.subject}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: T.slate, fontSize: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {row.time}
                      </span>
                      <span style={{ fontWeight: 600, color: T.navy }}>
                        Max Marks: {row.maxMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Published Scorecards & Transcripts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {scorecards.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '10px',
              fontSize: '13px',
              color: T.slate,
            }}
          >
            No formal term scorecards published yet.
          </div>
        ) : (
          scorecards.map((card: any) => (
            <div
              key={card.id}
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: '10px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: T.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    CBSE Formal Grade Transcript
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 600, color: T.navy }}>
                    {card.examName} · {card.term}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: T.navy, lineHeight: 1 }}>
                      {card.percentage}%
                    </div>
                    <span style={{ fontSize: '11px', color: T.slate }}>
                      Total: {card.totalMarks} / {card.maxTotal} marks
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${T.border}`,
                      background: T.white,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: T.navy,
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={13} /> Print / Save
                  </button>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '10px 16px',
                    background: T.pageBg,
                    borderBottom: `1px solid ${T.border}`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: T.slate,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>Subject</span>
                  <span style={{ textAlign: 'center' }}>Marks Obtained</span>
                  <span style={{ textAlign: 'center' }}>Maximum Marks</span>
                  <span style={{ textAlign: 'right' }}>Grade</span>
                </div>

                {(card.subjects || []).map((sub: any, sIdx: number) => (
                  <div
                    key={sIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      padding: '12px 16px',
                      borderBottom: `1px solid ${T.border}`,
                      fontSize: '13px',
                      alignItems: 'center',
                      background: sIdx % 2 === 0 ? T.white : '#fcfdfe',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: T.navy }}>{sub.subject}</span>
                    <span style={{ textAlign: 'center', fontWeight: 600, color: T.navy }}>{sub.marks}</span>
                    <span style={{ textAlign: 'center', color: T.slate }}>{sub.max}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '100px',
                          background: T.greenBg,
                          color: T.greenDark,
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {sub.grade || 'A1'}
                      </span>
                    </span>
                  </div>
                ))}

                {/* Final Row - Total & Overall Result */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 700,
                    alignItems: 'center',
                    borderTop: `2px solid ${T.border}`,
                  }}
                >
                  <span style={{ color: T.navy }}>TOTAL SCORE / RESULT</span>
                  <span style={{ textAlign: 'center', color: T.navy }}>{card.totalMarks}</span>
                  <span style={{ textAlign: 'center', color: T.slate }}>{card.maxTotal}</span>
                  <span style={{ textAlign: 'right', color: card.percentage >= 33 ? '#15803d' : '#dc2626' }}>
                    {card.percentage >= 33 ? 'PASS' : 'NEEDS SUPPORT'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

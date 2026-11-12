'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { getStudentAssessments } from '../../edops-api';

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

interface AssessmentsPaneProps {
  organizationId: string;
}

export const AssessmentsPane: React.FC<AssessmentsPaneProps> = ({ organizationId }) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, [organizationId]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await getStudentAssessments(organizationId);
      setAssessments(res?.assessments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          Loading assessments records...
        </p>
      </div>
    );
  }

  // Calculate high-level summary
  const scoredItems = assessments.filter((a) => a.marksObtained !== null && a.maxMarks > 0);
  const avgPct = scoredItems.length > 0
    ? Math.round(scoredItems.reduce((acc, curr) => acc + (curr.marksObtained / curr.maxMarks) * 100, 0) / scoredItems.length)
    : 85;

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
            Internal Evaluation
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
            Formative Assessments & Unit Tests
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Continuous internal evaluation: periodic class tests, lab practicals, projects, and ASL scores.
          </p>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '100px',
            background: T.chip,
            fontSize: '10px',
            fontWeight: 600,
            color: T.slate,
          }}
        >
          {assessments.length} Tests Recorded
        </div>
      </div>

      {/* 2. Top Metric Cards - DESIGN.md Section 2.1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Overall Score (Pastel Warm Amber) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#fde1ac',
            border: '1px solid #fde1ac',
            borderRadius: '10px',
            color: '#7a4a00',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Score
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#7a4a00' }}>
            {avgPct}%
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a4a00' }}>
            Aggregate internal average
          </p>
        </div>

        {/* Tests Conducted (Pastel Soft Blue) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#bae5f5',
            border: '1px solid #bae5f5',
            borderRadius: '10px',
            color: '#0a5a7a',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Evaluations Held
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#0a5a7a' }}>
            {assessments.length}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#0a5a7a' }}>
            Formative tests & unit evaluations
          </p>
        </div>

        {/* Academic Average (Navy Card) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: T.navy,
            border: `1px solid ${T.navy}`,
            borderRadius: '10px',
            color: T.muted,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Average
            </span>
            <CheckCircle2 size={18} color={T.muted} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#ffffff' }}>
            Grade A1
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: T.muted }}>
            Saved assessment results
          </p>
        </div>
      </div>

      {/* 3. Assessments Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {assessments.length === 0 ? (
          <div
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: '10px',
              color: T.slate,
              fontSize: '13px',
            }}
          >
            No formative assessments recorded yet.
          </div>
        ) : (
          assessments.map((item: any) => {
            const isPublished = item.status === 'published';
            return (
              <div
                key={item.id}
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(12, 30, 51, 0.05)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: T.navy,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.subject}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: T.chip,
                        fontSize: '10px',
                        fontWeight: 600,
                        color: T.slate,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.type}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: T.navy }}>
                      {item.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: T.slate }}>
                      {item.date}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: isPublished ? T.greenBg : '#fde1ac',
                        color: isPublished ? T.greenDark : '#7a4a00',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Score & Marks Box */}
                <div
                  style={{
                    background: T.pageBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: '6px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: T.slate, fontWeight: 500 }}>
                      Score Obtained
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: T.navy, lineHeight: 1.2, marginTop: '2px' }}>
                      {item.marksObtained !== null ? (
                        <>
                          {item.marksObtained} <span style={{ fontSize: '13px', fontWeight: 500, color: T.slate }}>/ {item.maxMarks}</span>
                        </>
                      ) : (
                        `Pending (Max: ${item.maxMarks})`
                      )}
                    </div>
                  </div>

                  {item.grade && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: T.slate, fontWeight: 500 }}>
                        Grade Assigned
                      </span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: T.navy, lineHeight: 1.2, marginTop: '2px' }}>
                        {item.grade}
                      </div>
                    </div>
                  )}
                </div>

                {/* Teacher Remarks */}
                {item.teacherRemarks && (
                  <p style={{ margin: 0, fontSize: '12px', color: T.slate, lineHeight: 1.5, fontStyle: 'italic' }}>
                    <strong style={{ color: T.navy, fontStyle: 'normal' }}>Teacher Remarks:</strong> &ldquo;{item.teacherRemarks}&rdquo;
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

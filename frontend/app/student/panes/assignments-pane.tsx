'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, Upload, MessageSquare, ArrowRight, Award } from 'lucide-react';
import { getStudentAssignments } from '../../edops-api';

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

interface AssignmentsPaneProps {
  organizationId: string;
  onSubmitAssignment: (assignment: any) => void;
  initialStatus?: string;
  onStatusChange?: (status: string) => void;
}

export const AssignmentsPane: React.FC<AssignmentsPaneProps> = ({
  organizationId,
  onSubmitAssignment,
  initialStatus,
  onStatusChange,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(
    initialStatus && ['all', 'pending', 'submitted', 'evaluated'].includes(initialStatus)
      ? initialStatus
      : 'all'
  );

  useEffect(() => {
    if (initialStatus && ['all', 'pending', 'submitted', 'evaluated'].includes(initialStatus)) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    loadAssignments();
  }, [organizationId, statusFilter]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await getStudentAssignments(organizationId, statusFilter);
      setData(res);
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
          Loading homework assignments...
        </p>
      </div>
    );
  }

  const assignments = data?.assignments || [];
  const summary = data?.summary || { totalAssigned: 0, submitted: 0, pending: 0, late: 0, completionPct: 0 };
  const evaluatedCount = assignments.filter((a: any) => a.status === 'evaluated' || a.status === 'graded').length;

  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Pending / Due Soon' },
    { id: 'submitted', label: 'Submitted (Awaiting Grade)' },
    { id: 'evaluated', label: 'Evaluated & Graded' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
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
            Coursework & Homework
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
            Assignments & Coursework Hub
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Track homework, upload solutions before deadline, and inspect teacher evaluation rubrics.
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
          {summary.totalAssigned} Total Assigned
        </div>
      </div>

      {/* 2. Top Metric Cards (Section 2.1) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Completion Rate (Pastel Mint) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#ccefbf',
            border: '1px solid #ccefbf',
            borderRadius: '10px',
            color: '#1a5c0a',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completion Rate
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#1a5c0a' }}>
            {summary.completionPct}%
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#1a5c0a' }}>
            {summary.submitted} of {summary.totalAssigned} submitted
          </p>
        </div>

        {/* Pending Review (Pastel Warm Amber) */}
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
              Pending Tasks
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#7a4a00' }}>
            {summary.pending}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a4a00' }}>
            Action needed before due date
          </p>
        </div>

        {/* Late / Overdue (Pastel Rose) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#ffd6d6',
            border: '1px solid #ffd6d6',
            borderRadius: '10px',
            color: '#7a1a1a',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overdue Tasks
            </span>
            <AlertCircle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#7a1a1a' }}>
            {summary.late}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a1a1a' }}>
            Past deadline submissions
          </p>
        </div>

        {/* Graded Work (Academic Navy) */}
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
              Graded Work
            </span>
            <Award size={18} color={T.muted} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#ffffff' }}>
            {evaluatedCount}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: T.muted }}>
            Teacher marks & rubrics saved
          </p>
        </div>
      </div>

      {/* 3. Filter Navigation Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map((t) => {
          const active = statusFilter === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setStatusFilter(t.id);
                onStatusChange?.(t.id);
              }}
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: active ? T.navy : T.chip,
                color: active ? '#ffffff' : T.slate,
                border: active ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 4. Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {assignments.length === 0 ? (
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
            No assignments found in this view.
          </div>
        ) : (
          assignments.map((item: any) => {
            const isEvaluated = item.status === 'evaluated' || item.status === 'graded';
            const isSubmitted = item.status === 'submitted';
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
                {/* Row 1: Subject, Title & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(12, 30, 51, 0.05)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: T.navy,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.subject}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: T.navy }}>
                      {item.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: isEvaluated ? T.greenBg : isSubmitted ? '#bae5f5' : '#fde1ac',
                        color: isEvaluated ? T.greenDark : isSubmitted ? '#0a5a7a' : '#7a4a00',
                      }}
                    >
                      {item.status}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: T.slate }}>
                      Max: {item.maxMarks} marks
                    </span>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}

                {/* Meta Strip */}
                <div
                  style={{
                    background: T.pageBg,
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${T.border}`,
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span>
                      Faculty: <strong style={{ color: T.navy, fontWeight: 600 }}>{item.teacher || 'Assigned Instructor'}</strong>
                    </span>
                    <span style={{ color: '#7a1a1a', fontWeight: 600 }}>
                      Due Date: {item.dueDate || 'Today'}
                    </span>
                  </div>
                  {item.learningOutcome && (
                    <div style={{ fontSize: '11px', color: T.slate, lineHeight: 1.5 }}>
                      <strong style={{ color: T.navy }}>Learning Outcome:</strong> {item.learningOutcome}
                    </div>
                  )}
                </div>

                {/* Feedback Box if Evaluated */}
                {isEvaluated && (
                  <div
                    style={{
                      background: T.greenBg,
                      padding: '12px 16px',
                      borderRadius: '6px',
                      color: T.greenDark,
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Teacher Score: {item.score} / {item.maxMarks}</span>
                      <span>Graded & Verified</span>
                    </div>
                    {item.feedback && (
                      <p style={{ margin: 0, fontStyle: 'italic', fontSize: '11px', color: T.greenDark }}>
                        &ldquo;{item.feedback}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: T.faint }}>
                    {item.submittedAt ? `Submitted: ${item.submittedAt}` : 'Submission Window Open'}
                  </span>
                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onSubmitAssignment(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
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
                      <Upload size={15} />
                      <span>Submit Homework</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

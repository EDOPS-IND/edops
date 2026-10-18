'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, Check, ArrowRight } from 'lucide-react';
import { getStudentCurriculum } from '../../edops-api';

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

interface CurriculumPaneProps {
  organizationId: string;
}

export const CurriculumPane: React.FC<CurriculumPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  useEffect(() => {
    loadCurriculum();
  }, [organizationId]);

  const loadCurriculum = async () => {
    setLoading(true);
    try {
      const res = await getStudentCurriculum(organizationId);
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
          Loading curriculum syllabus tracker...
        </p>
      </div>
    );
  }

  const overallProgress = data?.overallProgress || 0;
  const subjects = data?.subjects || [];
  const currentSub = subjects.find((s: any) => s.subject === selectedSubject) || subjects[0] || { chapters: [] };

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
            Syllabus & Coverage
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
            Curriculum & Syllabus Completion Tracker
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Track NCERT prescribed chapter completion, covered concepts, and upcoming unit topics.
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
          {subjects.length} Prescribed Subjects
        </div>
      </div>

      {/* 2. Overview Banner - Metric card palette: Curriculum Pacing (#ccefbf / #1a5c0a) */}
      <div
        style={{
          background: '#ccefbf',
          border: '1px solid #ccefbf',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#1a5c0a',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Overall School Curriculum Pacing
            </span>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>
              {overallProgress}% Covered
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={24} />
          </div>
        </div>

        {/* Progress Bar: 6 px track, radius 12 px */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(26, 92, 10, 0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: '#1a5c0a',
              width: `${overallProgress}%`,
              borderRadius: '12px',
            }}
          />
        </div>

        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5 }}>
          Saved curriculum progress recorded across all academic terms.
        </p>
      </div>

      {/* 3. Subject Selector Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {subjects.map((sub: any) => {
          const active = selectedSubject === sub.subject;
          return (
            <button
              key={sub.subject}
              type="button"
              onClick={() => setSelectedSubject(sub.subject)}
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
              {sub.subject} ({sub.progress}%)
            </button>
          );
        })}
      </div>

      {/* 4. Chapters Breakdown Table Card */}
      <div
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
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
            {currentSub.subject} Chapters & Units
          </h3>
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
            {currentSub.chapters.length} Total Units
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {currentSub.chapters.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No chapters published yet for this subject.
            </div>
          ) : (
            currentSub.chapters.map((ch: any, idx: number) => {
              const isCompleted = ch.status === 'Completed' || ch.progress === 100;
              const isInProgress = ch.status === 'In Progress' || (ch.progress > 0 && ch.progress < 100);
              return (
                <div
                  key={ch.number || idx}
                  style={{
                    padding: '16px 24px',
                    borderBottom: idx === currentSub.chapters.length - 1 ? 'none' : `1px solid ${T.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: idx % 2 === 0 ? T.white : '#fcfdfe',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: T.pageBg,
                          border: `1px solid ${T.border}`,
                          fontSize: '12px',
                          fontWeight: 600,
                          color: T.navy,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {ch.number}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.navy }}>
                          {ch.title}
                        </h4>
                        {ch.remainingTopics && (
                          <p style={{ margin: 0, fontSize: '11px', color: T.slate, lineHeight: 1.5 }}>
                            <strong style={{ color: T.navy, fontWeight: 500 }}>Remaining:</strong> {ch.remainingTopics}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '100px',
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: isCompleted ? T.greenBg : isInProgress ? '#bae5f5' : T.chip,
                          color: isCompleted ? T.greenDark : isInProgress ? '#0a5a7a' : T.slate,
                        }}
                      >
                        {ch.status}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: T.navy, minWidth: '40px', textAlign: 'right' }}>
                        {ch.progress}%
                      </span>
                    </div>
                  </div>

                  {/* 6 px track, radius 12 px */}
                  <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '12px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: isCompleted ? T.green : T.navy,
                        width: `${ch.progress}%`,
                        borderRadius: '12px',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

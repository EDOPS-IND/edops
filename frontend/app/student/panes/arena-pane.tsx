'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, Play, Flame, Award, ArrowRight } from 'lucide-react';
import { getStudentArena } from '../../edops-api';

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

interface ArenaPaneProps {
  organizationId: string;
  onStartArena: (activity: any) => void;
}

export const ArenaPane: React.FC<ArenaPaneProps> = ({ organizationId, onStartArena }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArena();
  }, [organizationId]);

  const loadArena = async () => {
    setLoading(true);
    try {
      const res = await getStudentArena(organizationId);
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
          Loading Arena activities...
        </p>
      </div>
    );
  }

  const activities = data?.activities || [];
  const performance = data?.performance || {
    attemptedCount: 0,
    completedCount: 0,
    averageScore: 0,
    bestScore: 0,
    topicMastery: [] as any[],
  };

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
            Practice & Diagnostic Drills
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
            Arena Objective Practice Bank
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Self-paced drills and timed diagnostic assessments with instant step-by-step explanations.
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
          {activities.length} Available Drills
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
        {/* Arena Practice card (Pastel Rose per Section 2.1) */}
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
              Arena Practice
            </span>
            <Trophy size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#7a1a1a' }}>
            {performance.completedCount}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a1a1a' }}>
            Questions answered & verified
          </p>
        </div>

        {/* Average Accuracy (Pastel Violet) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '148px',
            padding: '20px',
            background: '#e1d2ff',
            border: '1px solid #e1d2ff',
            borderRadius: '10px',
            color: '#4a0e8f',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Average Accuracy
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#4a0e8f' }}>
            {performance.averageScore}%
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#4a0e8f' }}>
            Across all STEM practice modules
          </p>
        </div>

        {/* Personal Best (Pastel Mint) */}
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
              Personal Best
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#1a5c0a' }}>
            {performance.bestScore}%
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#1a5c0a' }}>
            Top recorded drill score
          </p>
        </div>

        {/* Practice Streak (Navy Card) */}
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
              Practice Streak
            </span>
            <Flame size={18} color="#fde1ac" />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#ffffff' }}>
            {performance.completedCount > 0 ? `${performance.completedCount}d` : '—'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: T.muted }}>
            Consistent practice streak
          </p>
        </div>
      </div>

      {/* 3. Available Arena Quizzes & Sets Card */}
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
            Assigned Arena Quizzes & Practice Sets
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
            {activities.length} Drills Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {activities.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No practice quizzes currently active.
            </div>
          ) : (
            activities.map((act: any, idx: number) => {
              const isCompleted = act.status === 'completed';
              return (
                <div
                  key={act.id}
                  style={{
                    padding: '18px 24px',
                    borderBottom: idx === activities.length - 1 ? 'none' : `1px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    background: idx % 2 === 0 ? T.white : '#fcfdfe',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
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
                        {act.subject}
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
                        {act.mode === 'practice' ? 'Practice Drill' : 'Diagnostic'}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                        {act.title}
                      </h4>
                    </div>

                    <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>
                      {act.topic}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: T.faint }}>
                      <span>{act.questionCount} Questions</span>
                      <span>•</span>
                      <span>Duration: {act.durationMinutes} mins</span>
                      {act.availableUntil && (
                        <>
                          <span>•</span>
                          <span>Available until: {act.availableUntil}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isCompleted ? (
                      <span
                        style={{
                          padding: '6px 14px',
                          borderRadius: '100px',
                          background: T.greenBg,
                          color: T.greenDark,
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={15} color={T.green} />
                        Scored {act.bestScore}%
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStartArena(act)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '9px 18px',
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
                        <Play size={14} fill="#ffffff" />
                        <span>Start Arena Drill</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Topic Mastery Insights Card */}
      {performance.topicMastery && performance.topicMastery.length > 0 && (
        <div
          style={{
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: '10px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Topic Mastery Insights
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
              Competency accuracy breakdown derived from your Arena attempts.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {performance.topicMastery.map((tm: any, idx: number) => {
              const isHigh = tm.mastery >= 75;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${T.border}`,
                    background: T.pageBg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>
                      {tm.topic}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isHigh ? T.greenDark : T.navy }}>
                      {tm.mastery}%
                    </span>
                  </div>

                  {/* 6 px track, radius 12 px */}
                  <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '12px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: isHigh ? T.green : T.navy,
                        width: `${tm.mastery}%`,
                        borderRadius: '12px',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '11px', color: T.slate }}>
                    Status: <strong style={{ color: T.navy }}>{tm.status || (isHigh ? 'Mastered' : 'Needs Practice')}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

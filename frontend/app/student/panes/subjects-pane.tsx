'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, TrendingUp, Layers, ChevronRight, User, Award, Video } from 'lucide-react';
import { getStudentSubjects } from '../../edops-api';
import { StudentTab } from '../types';

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

interface SubjectsPaneProps {
  organizationId: string;
  onNavigateTab: (tab: StudentTab) => void;
}

export const SubjectsPane: React.FC<SubjectsPaneProps> = ({ organizationId, onNavigateTab }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  useEffect(() => {
    loadSubjects();
  }, [organizationId]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await getStudentSubjects(organizationId);
      const list = res?.subjects || [];
      setSubjects(list);
      if (list.length > 0) setSelectedSubject(list[0]);
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
          Loading prescribed subjects...
        </p>
      </div>
    );
  }

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
            Academic Portfolio
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
            My Prescribed Subjects
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Connected learning journey: notes, recordings, coursework, and evaluations per subject.
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
          {subjects.length} Enrolled Subjects
        </div>
      </div>

      {/* 2. Grid of Subject Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
        }}
      >
        {subjects.map((sub) => {
          const isSelected = selectedSubject?.id === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              style={{
                background: T.white,
                padding: '20px',
                borderRadius: '10px',
                border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(12, 30, 51, 0.05)',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: T.navy,
                      textTransform: 'uppercase',
                      width: 'fit-content',
                    }}
                  >
                    {sub.code}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: T.navy }}>
                    {sub.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: T.slate, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} color={T.slate} /> {sub.teacher}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: T.navy }}>
                    {sub.assessmentAverage}%
                  </div>
                  <span style={{ fontSize: '10px', color: T.faint }}>Avg Score</span>
                </div>
              </div>

              {/* Progress metrics row */}
              <div
                style={{
                  paddingTop: '12px',
                  borderTop: `1px solid ${T.border}`,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>{sub.attendance}%</div>
                  <div style={{ fontSize: '10px', color: T.slate }}>Attendance</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>{sub.assignmentsCompleted}%</div>
                  <div style={{ fontSize: '10px', color: T.slate }}>Homework</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.navy }}>{sub.curriculumProgress}%</div>
                  <div style={{ fontSize: '10px', color: T.slate }}>Curriculum</div>
                </div>
              </div>

              {/* Current Topic Strip */}
              <div
                style={{
                  background: T.pageBg,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: T.slate,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <strong style={{ color: T.navy }}>Topic:</strong> {sub.currentTopic || 'Instruction in progress'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Selected Subject Detail Card */}
      {selectedSubject && (
        <div
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: T.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active Learning Track
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: T.navy }}>
                {selectedSubject.name} ({selectedSubject.code})
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: T.slate }}>
                Faculty: <strong style={{ color: T.navy }}>{selectedSubject.teacher}</strong> {selectedSubject.teacherEmail ? `• ${selectedSubject.teacherEmail}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('resources')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  background: T.white,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: T.navy,
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Study Material
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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
                Subject Homework
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '16px',
                background: T.pageBg,
                border: `1px solid ${T.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: T.slate }}>
                Current Chapter
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                {selectedSubject.currentTopic || 'NCERT Curriculum Module'}
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>Instruction in session</p>
            </div>

            <div
              style={{
                padding: '16px',
                background: T.pageBg,
                border: `1px solid ${T.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: T.slate }}>
                Learning Outcomes
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                {selectedSubject.learningOutcomesAchieved || 12} of {selectedSubject.totalLearningOutcomes || 16} LOs
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>Verified through assessments</p>
            </div>

            <div
              style={{
                padding: '16px',
                background: T.pageBg,
                border: `1px solid ${T.border}`,
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: T.slate }}>
                Classroom Pacing
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.greenDark }}>
                On Schedule (NCERT)
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>Academic Year 2026–2027</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

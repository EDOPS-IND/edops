'use client';

import React, { useState, useEffect } from 'react';
import { Users, Megaphone, User, ShieldCheck, School, DoorOpen } from 'lucide-react';
import { getStudentClass } from '../../edops-api';

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

interface ClassPaneProps {
  organizationId: string;
}

export const ClassPane: React.FC<ClassPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClass();
  }, [organizationId]);

  const loadClass = async () => {
    setLoading(true);
    try {
      const res = await getStudentClass(organizationId);
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
          Loading class information...
        </p>
      </div>
    );
  }

  const classInfo = data?.classInfo || {
    className: '',
    academicYear: '',
    classTeacher: '',
    roomNumber: '',
    studentCount: 0,
    subjectsCount: 0,
  };

  const classmates = data?.classmates || [];
  const announcements = data?.announcements || [];

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
            Cohort Registration
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
            My Class Hub
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Official cohort registration, class leadership, and peer directory.
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
          {classInfo.className} · AY {classInfo.academicYear}
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
        {/* Enrolled Section (Pastel Violet) */}
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
              Enrolled Section
            </span>
            <School size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#4a0e8f' }}>
            {classInfo.className || '10-A'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#4a0e8f' }}>
            Academic Year {classInfo.academicYear}
          </p>
        </div>

        {/* Class Teacher (Pastel Warm Amber) */}
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
              Class Teacher
            </span>
            <User size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#7a4a00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {classInfo.classTeacher || 'Senior Faculty'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a4a00' }}>
            Class Counselor & Academic Mentor
          </p>
        </div>

        {/* Home Classroom (Pastel Mint) */}
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
              Home Classroom
            </span>
            <DoorOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#1a5c0a' }}>
            {classInfo.roomNumber ? `Room ${classInfo.roomNumber}` : 'Room 302'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#1a5c0a' }}>
            Main Academic Building Wing
          </p>
        </div>

        {/* Cohort Size (Academic Navy) */}
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
              Cohort Size
            </span>
            <Users size={18} color={T.muted} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#ffffff' }}>
            {classInfo.studentCount}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: T.muted }}>
            Students registered in Section
          </p>
        </div>
      </div>

      {/* 3. Official Class Notices Card */}
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
            gap: '8px',
          }}
        >
          <Megaphone size={18} color={T.navy} />
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
            Official Class Notices & Bulletins
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {announcements.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No current class notices posted.
            </div>
          ) : (
            announcements.map((ann: any, idx: number) => (
              <div
                key={ann.id || idx}
                style={{
                  padding: '16px 24px',
                  borderBottom: idx === announcements.length - 1 ? 'none' : `1px solid ${T.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: idx % 2 === 0 ? T.white : '#fcfdfe',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: T.navy }}>
                    {ann.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: T.faint }}>{ann.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
                  {ann.content}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: T.faint, paddingTop: '4px' }}>
                  Posted by: {ann.author || 'Class Administration'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Classmate Roster Card */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color={T.navy} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Classmate Roster
            </h3>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '100px',
              background: T.greenBg,
              color: T.greenDark,
              fontSize: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={12} />
            Privacy Guard Active
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}
        >
          {classmates.map((mate: any, idx: number) => {
            const isSelf = !!mate.isSelf;
            return (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: isSelf ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                  background: isSelf ? '#f0f4f8' : T.pageBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isSelf ? T.navy : T.chip,
                    color: isSelf ? '#ffffff' : T.navy,
                    border: `1px solid ${T.border}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {mate.rollNumber}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: isSelf ? 700 : 500, color: T.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mate.name} {isSelf && '(You)'}
                  </div>
                  <div style={{ fontSize: '11px', color: T.slate }}>
                    Roll No. {mate.rollNumber}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

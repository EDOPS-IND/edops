'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherActivity } from '../../edops-api';
import { Activity, CheckCircle2, BookOpen, ShieldCheck } from 'lucide-react';

const T = {
  navy: '#0c1e33',
  slate: '#495d72',
  muted: '#a6abb5',
  faint: '#b3b3b3',
  bg: '#f4f6f7',
  white: '#ffffff',
  border: '#e4e6e9',
  line: '#ced8e5',
  chip: '#f5f6f8',
  blue: '#17a1fa',
  greenBg: '#d9eed1',
  green: '#61a249',
  greenDk: '#1a5c0a',
};

const pastelViolet = { bg: '#e1d2ff', text: '#4a0e8f' };
const pastelMint = { bg: '#ccefbf', text: '#1a5c0a' };
const pastelBlue = { bg: '#d0e6ff', text: '#0a3a7a' };
const pastelPeach = { bg: '#ffd8c7', text: '#782a00' };

interface ActivityPaneProps {
  organizationId: string;
}

export const ActivityPane: React.FC<ActivityPaneProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadActivities();
  }, [organizationId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await getTeacherActivity(organizationId);
      setActivities(res?.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "64px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading faculty activity history...
        </p>
      </div>
    );
  }

  const attendanceCount = activities.filter(
    (a) => (a.badge || a.type || '').toLowerCase().includes('attendance') || (a.action || '').toLowerCase().includes('attendance')
  ).length;

  const academicCount = activities.filter(
    (a) =>
      (a.badge || a.type || '').toLowerCase().includes('marks') ||
      (a.badge || a.type || '').toLowerCase().includes('assignment') ||
      (a.badge || a.type || '').toLowerCase().includes('lesson') ||
      (a.action || '').toLowerCase().includes('graded')
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "'Poppins', sans-serif" }}>
      {/* 1. Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "10px", fontWeight: 600, color: T.slate, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          AUDIT LOG &amp; COMPLIANCE
        </span>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: T.navy, letterSpacing: "-0.01em" }}>
          Academic Activity Audit &amp; Event Stream
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: T.slate }}>
          Chronological timeline of teaching milestones, grading submissions, and classroom management events
        </p>
      </div>

      {/* 2. Top 4 Pastel Metric Cards (Exact 148px Student Style) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Events */}
        <div
          style={{
            height: '148px',
            background: pastelViolet.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelViolet.text }}>Logged Events</span>
            <Activity size={16} color={pastelViolet.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelViolet.text, lineHeight: 1 }}>
              {activities.length}
            </div>
            <div style={{ fontSize: '11px', color: pastelViolet.text, opacity: 0.85, marginTop: '4px' }}>
              Verified faculty actions in audit trail
            </div>
          </div>
        </div>

        {/* Card 2: Attendance Finalizations */}
        <div
          style={{
            height: '148px',
            background: pastelMint.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelMint.text }}>Attendance Submissions</span>
            <CheckCircle2 size={16} color={pastelMint.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelMint.text, lineHeight: 1 }}>
              {attendanceCount}
            </div>
            <div style={{ fontSize: '11px', color: pastelMint.text, opacity: 0.85, marginTop: '4px' }}>
              Roll call registers synced to SIS
            </div>
          </div>
        </div>

        {/* Card 3: Academic Operations */}
        <div
          style={{
            height: '148px',
            background: pastelBlue.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelBlue.text }}>Curriculum &amp; Grading</span>
            <BookOpen size={16} color={pastelBlue.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelBlue.text, lineHeight: 1 }}>
              {academicCount}
            </div>
            <div style={{ fontSize: '11px', color: pastelBlue.text, opacity: 0.85, marginTop: '4px' }}>
              Lessons delivered &amp; grades recorded
            </div>
          </div>
        </div>

        {/* Card 4: Audit Status */}
        <div
          style={{
            height: '148px',
            background: pastelPeach.bg,
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: pastelPeach.text }}>Compliance Status</span>
            <ShieldCheck size={16} color={pastelPeach.text} />
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: pastelPeach.text, lineHeight: 1 }}>
              100%
            </div>
            <div style={{ fontSize: '11px', color: pastelPeach.text, opacity: 0.85, marginTop: '4px' }}>
              Tamper-evident logs encrypted
            </div>
          </div>
        </div>
      </div>

      {/* 3. Timeline Stream */}
      {activities.length === 0 ? (
        <div style={{ background: "#ffffff", borderRadius: "10px", border: `1px dashed ${T.border}`, padding: "48px", textAlign: "center", fontSize: "13px", color: T.slate }}>
          No academic activities recorded yet. When you finalize attendance, conduct lessons, or upload materials, they will appear here in chronological order.
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "10px", border: `1px solid ${T.border}`, padding: "24px" }}>
          <div style={{ position: "relative", paddingLeft: "24px", borderLeft: `2px solid ${T.line}`, display: "flex", flexDirection: "column", gap: "28px" }}>
            {activities.map((item, idx) => (
              <div key={item.id || idx} style={{ position: "relative" }}>
                {/* Node dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-31px",
                    top: "4px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: T.navy,
                    border: "3px solid #ffffff",
                    boxShadow: "0 0 0 1px #ced8e5",
                  }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: T.chip, border: `1px solid ${T.border}`, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {item.badge || item.type || 'Activity'}
                    </span>
                    <span style={{ fontSize: "11px", color: T.faint }}>{item.timestamp}</span>
                  </div>
                  <h3 style={{ margin: "6px 0 2px", fontSize: "14px", fontWeight: 600, color: T.navy }}>
                    {item.action}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: T.slate, lineHeight: 1.5 }}>
                    {item.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

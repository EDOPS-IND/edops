'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, Check, ArrowRight } from 'lucide-react';
import { getStudentAttendance } from '../../edops-api';

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

interface AttendancePaneProps {
  organizationId: string;
}

export const AttendancePane: React.FC<AttendancePaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [organizationId]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await getStudentAttendance(organizationId);
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
          Loading attendance records...
        </p>
      </div>
    );
  }

  const summary = data?.summary || {
    overallPercentage: 0,
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    thresholdPercentage: 75,
  };

  const subjectWise = data?.subjectWise || [];
  const calendarDays = data?.calendarDays || [];

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
            Statutory Monitoring
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
            Attendance Monitoring & History
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Track daily registers, subject-wise attendance %, and CBSE minimum 75% statutory requirement.
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
            whiteSpace: 'nowrap',
          }}
        >
          Min Requirement: 75%
        </div>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Attendance Rate (Pastel Violet) */}
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
              Attendance Rate
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#4a0e8f' }}>
            {summary.overallPercentage}%
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#4a0e8f' }}>
            {summary.overallPercentage < 75 ? 'Below 75% threshold' : '≥ 75% CBSE requirement met'}
          </p>
        </div>

        {/* Days Present (Pastel Mint) */}
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
              Days Present
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#1a5c0a' }}>
            {summary.presentDays}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#1a5c0a' }}>
            Out of {summary.totalWorkingDays} working days
          </p>
        </div>

        {/* Days Absent (Pastel Rose) */}
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
              Days Absent
            </span>
            <AlertCircle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#7a1a1a' }}>
            {summary.absentDays}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a1a1a' }}>
            {summary.leaveDays} approved leaves recorded
          </p>
        </div>

        {/* Tardy / Late Marks (Pastel Warm Amber) */}
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
              Late Arrival
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, lineHeight: 1, color: '#7a4a00' }}>
            {summary.lateDays}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#7a4a00' }}>
            Recorded assembly late marks
          </p>
        </div>
      </div>

      {/* 3. Subject-Wise Attendance Breakdown Card */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Subject-Wise Attendance Quota
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
              Required by CBSE to be eligible for Term Examinations.
            </p>
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
            {subjectWise.length} Subjects Tracked
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {subjectWise.map((item: any, idx: number) => {
            const isPassing = item.percentage >= 75;
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
                    {item.subject}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isPassing ? T.navy : '#7a1a1a',
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar per Section 2.4: 6 px track, radius 12 px */}
                <div style={{ width: '100%', height: '6px', background: T.track, borderRadius: '12px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: isPassing ? T.navy : '#7a1a1a',
                      width: `${item.percentage}%`,
                      borderRadius: '12px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: T.slate }}>
                  <span>{item.attended} of {item.total} lectures</span>
                  <span style={{ fontWeight: 600, color: isPassing ? T.greenDark : '#7a1a1a' }}>
                    {item.status || (isPassing ? 'Eligible' : 'Attendance Shortage')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Monthly Register Log Table Card */}
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
            padding: '16px 24px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color={T.navy} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Recent Daily Register Log
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: T.slate }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.green }} /> Present
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7a1a1a' }} /> Absent
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.blue }} /> Holiday
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {calendarDays.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No register entries found for this calendar month.
            </div>
          ) : (
            calendarDays.map((cd: any, idx: number) => {
              const isPresent = cd.status === 'present';
              const isAbsent = cd.status === 'absent';
              return (
                <div
                  key={idx}
                  style={{
                    padding: '14px 24px',
                    borderBottom: idx === calendarDays.length - 1 ? 'none' : `1px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    background: idx % 2 === 0 ? T.white : '#fcfdfe',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: T.slate, minWidth: '90px' }}>
                      {cd.date}
                    </span>
                    <span style={{ fontWeight: 500, color: T.navy }}>
                      {cd.remarks || 'Regular Instructional Period'}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: isPresent ? T.greenBg : isAbsent ? '#ffd6d6' : T.chip,
                      color: isPresent ? T.greenDark : isAbsent ? '#7a1a1a' : T.slate,
                    }}
                  >
                    {cd.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

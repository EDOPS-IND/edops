'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, Video, User, MapPin } from 'lucide-react';
import { getStudentTimetable } from '../../edops-api';

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

interface TimetablePaneProps {
  organizationId: string;
}

export const TimetablePane: React.FC<TimetablePaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('monday');

  useEffect(() => {
    loadTimetable();
  }, [organizationId]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const res = await getStudentTimetable(organizationId);
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
          Loading class timetable...
        </p>
      </div>
    );
  }

  const weeklySchedule = data?.weeklySchedule || {};
  const previousClasses = data?.previousClasses || [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = weeklySchedule[selectedDay] || [];

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
            Daily Academic Schedule
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
            Academic Timetable & Class History
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            6-day timetable schedule, classroom allocations, and past lecture records.
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
          {daySchedule.length} Periods Today
        </div>
      </div>

      {/* 2. Day Selector Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {days.map((day) => {
          const active = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                padding: '6px 16px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
                background: active ? T.navy : T.chip,
                color: active ? '#ffffff' : T.slate,
                border: active ? `1px solid ${T.navy}` : `1px solid ${T.border}`,
                transition: 'all 0.15s ease',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* 3. Daily Periods Card */}
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
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy, textTransform: 'capitalize' }}>
            {selectedDay} Schedule
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
            {daySchedule.length} Teaching Periods
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {daySchedule.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No periods scheduled for {selectedDay}.
            </div>
          ) : (
            daySchedule.map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '16px 24px',
                  borderBottom: idx === daySchedule.length - 1 ? 'none' : `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: idx % 2 === 0 ? T.white : '#fcfdfe',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      background: T.pageBg,
                      border: `1px solid ${T.border}`,
                      fontSize: '12px',
                      fontWeight: 700,
                      color: T.navy,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    P{item.period}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                      {item.subject}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: T.slate, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color={T.slate} /> {item.time}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color={T.slate} /> Room {item.room}
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: T.navy, display: 'block' }}>
                    {item.teacher}
                  </span>
                  <span style={{ fontSize: '11px', color: T.faint }}>
                    Instructional Faculty
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Previous Classes Log Card */}
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
          }}
        >
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
            Previous Classes Log
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
            Recent completed sessions with attendance records and homework assignments.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {previousClasses.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No prior classes recorded.
            </div>
          ) : (
            previousClasses.map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '16px 24px',
                  borderBottom: idx === previousClasses.length - 1 ? 'none' : `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: idx % 2 === 0 ? T.white : '#fcfdfe',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: T.navy }}>
                      {item.subject}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '100px',
                        background: T.greenBg,
                        color: T.greenDark,
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.attendance}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: T.slate }}>
                    {item.topic}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: T.faint }}>
                    {item.date} • Period {item.period} • {item.teacher}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: T.chip,
                      border: `1px solid ${T.border}`,
                      fontSize: '11px',
                      fontWeight: 600,
                      color: T.navy,
                    }}
                  >
                    HW: {item.homeworkStatus}
                  </span>
                  {item.hasRecording && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#e1d2ff',
                        color: '#4a0e8f',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Video size={13} /> Recorded
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

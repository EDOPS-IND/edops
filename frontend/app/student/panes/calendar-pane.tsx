'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../edops-api';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

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

interface CalendarPaneProps {
  organizationId: string;
}

export const CalendarPane: React.FC<CalendarPaneProps> = ({ organizationId }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setAllEvents([]);
    api<any>(`/organizations/${organizationId}/student/calendar`)
      .then((data) => setAllEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [organizationId]);

  const events = allEvents.filter((e) => String(e.date).slice(0, 7) === selectedMonth);

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
            Institutional Calendar
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
            Academic Deadlines & Events Calendar
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>
            Upcoming exam dates, assignment cut-offs, PTM sessions, and gazetted school holidays.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            aria-label="Calendar month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${T.line}`,
              background: T.white,
              fontSize: '13px',
              fontWeight: 600,
              color: T.navy,
              fontFamily: "'Poppins', sans-serif",
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* 2. Events Card */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color={T.navy} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: T.navy }}>
              Key Dates ({selectedMonth})
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
            {events.length} Scheduled Milestones
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              Loading calendar events...
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: T.slate }}>
              No scheduled academic events found for {selectedMonth}.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  padding: '18px 24px',
                  borderBottom: idx === events.length - 1 ? 'none' : `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: idx % 2 === 0 ? T.white : '#fcfdfe',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      padding: '8px 0',
                      textAlign: 'center',
                      background: T.pageBg,
                      border: `1px solid ${T.border}`,
                      borderRadius: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 600, color: T.slate, textTransform: 'uppercase' }}>
                      {String(evt.date).slice(5, 7)}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: T.navy, lineHeight: 1.1, marginTop: '2px' }}>
                      {String(evt.date).slice(8, 10)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '100px',
                          background: T.chip,
                          fontSize: '10px',
                          fontWeight: 600,
                          color: T.navy,
                          textTransform: 'uppercase',
                        }}
                      >
                        {evt.type || 'Academic Event'}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: T.navy }}>
                        {evt.title}
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: T.slate, lineHeight: 1.5 }}>
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: T.navy, display: 'block' }}>
                    {evt.time || 'All Day'}
                  </span>
                  <span style={{ fontSize: '11px', color: T.faint }}>
                    Official School Calendar
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

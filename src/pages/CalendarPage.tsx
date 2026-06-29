import { useCallback, useEffect, useMemo, useState } from 'react';

import { DiaryEditor } from '../components/DiaryEditor';
import {
  getEntryByDate,
  getMarkedDates,
  todayDateString,
  upsertEntry,
} from '../db/database';
import type { DiaryFormData } from '../types/diary';
import { formatMonthYear, getCalendarDays, toDateString } from '../utils/date';
import './CalendarPage.css';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [editorOpen, setEditorOpen] = useState(false);
  const [initial, setInitial] = useState<Partial<DiaryFormData>>({});
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const refreshMarks = useCallback(async () => {
    setMarked(await getMarkedDates());
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshMarks();
  }, [refreshMarks]);

  const openEditor = async (date: string) => {
    setOpening(true);
    try {
      setSelectedDate(date);
      const existing = await getEntryByDate(date);
      setInitial(
        existing
          ? {
              weather: existing.weather ?? '晴',
              mood: existing.mood ?? '😊',
              content: existing.content,
              review: existing.review,
            }
          : {},
      );
      setEditorOpen(true);
    } finally {
      setOpening(false);
    }
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  if (loading) {
    return (
      <div className="page-loading">
        <div className="boot-spinner" />
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h1>日记</h1>
        <p className="subtitle">完全离线 · IndexedDB 本地存储</p>
      </header>

      <div className="calendar-nav">
        <button type="button" onClick={prevMonth} aria-label="上个月">
          ‹
        </button>
        <span>{formatMonthYear(viewDate)}</span>
        <button type="button" onClick={nextMonth} aria-label="下个月">
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="weekday">
            {w}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="day empty" />;
          const dateStr = toDateString(year, month, day);
          const isToday = dateStr === todayDateString();
          const isSelected = dateStr === selectedDate;
          const hasEntry = marked.has(dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              disabled={opening}
              className={[
                'day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                hasEntry ? 'marked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => openEditor(dateStr)}
            >
              {day}
              {hasEntry && <span className="dot" />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="fab"
        disabled={opening}
        onClick={() => openEditor(todayDateString())}
      >
        +
      </button>

      {editorOpen && (
        <DiaryEditor
          date={selectedDate}
          initial={initial}
          onClose={() => setEditorOpen(false)}
          onSave={async (data) => {
            const ok = await upsertEntry(selectedDate, data);
            if (ok) await refreshMarks();
            return ok;
          }}
        />
      )}
    </div>
  );
}

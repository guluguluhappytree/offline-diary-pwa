import { useCallback, useEffect, useMemo, useState } from 'react';

import { DiaryPanel } from '../components/DiaryPanel';
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

const EMPTY_FORM: DiaryFormData = {
  weather: '晴',
  mood: '😊',
  content: '',
  review: '',
};

export function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [formInitial, setFormInitial] = useState<Partial<DiaryFormData>>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const refreshMarks = useCallback(async () => {
    setMarked(await getMarkedDates());
    setLoading(false);
  }, []);

  const loadEntry = useCallback(async (date: string) => {
    const existing = await getEntryByDate(date);
    setFormInitial(
      existing
        ? {
            weather: existing.weather ?? '晴',
            mood: existing.mood ?? '😊',
            content: existing.content,
            review: existing.review,
          }
        : { ...EMPTY_FORM },
    );
  }, []);

  useEffect(() => {
    refreshMarks();
  }, [refreshMarks]);

  useEffect(() => {
    loadEntry(selectedDate);
  }, [selectedDate, loadEntry]);

  const selectDate = (date: string) => {
    setSelectedDate(date);
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
      <section className="calendar-top">
        <header className="page-header compact">
          <h1>日记</h1>
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
                className={[
                  'day',
                  isToday ? 'today' : '',
                  isSelected ? 'selected' : '',
                  hasEntry ? 'marked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectDate(dateStr)}
              >
                {day}
                {hasEntry && <span className="dot" />}
              </button>
            );
          })}
        </div>
      </section>

      <DiaryPanel
        initial={formInitial}
        onSave={async (data) => {
          const ok = await upsertEntry(selectedDate, data);
          if (ok) await refreshMarks();
          return ok;
        }}
      />
    </div>
  );
}

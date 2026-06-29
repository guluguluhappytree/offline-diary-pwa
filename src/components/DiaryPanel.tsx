import { useEffect, useMemo, useState } from 'react';

import type { DiaryFormData } from '../types/diary';
import {
  DIARY_QUESTION,
  MOOD_OPTIONS,
  REVIEW_QUESTIONS,
  WEATHER_OPTIONS,
} from '../types/diary';
import './DiaryPanel.css';

interface Props {
  initial?: Partial<DiaryFormData>;
  onSave: (data: DiaryFormData) => Promise<boolean>;
}

const EMPTY: DiaryFormData = {
  weather: '晴',
  mood: '😊',
  content: '',
  review: '',
};

function parseReviewAnswers(review: string): string[] {
  if (!review.trim()) return ['', '', ''];
  const parts = review.split('\n\n---\n\n');
  if (parts.length >= 2) {
    return [parts[0] ?? '', parts[1] ?? '', parts[2] ?? ''];
  }
  return [review, '', ''];
}

function serializeReviewAnswers(answers: string[]): string {
  const trimmed = answers.map((a) => a.trim());
  if (!trimmed.some(Boolean)) return '';
  return trimmed.join('\n\n---\n\n');
}

export function DiaryPanel({ initial, onSave }: Props) {
  const [form, setForm] = useState<DiaryFormData>(EMPTY);
  const [reviewAnswers, setReviewAnswers] = useState(['', '', '']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const review = initial?.review ?? '';
    setForm({ ...EMPTY, ...initial, review: '' });
    setReviewAnswers(parseReviewAnswers(review));
    setSaved(false);
  }, [initial]);

  const hasWritten = useMemo(() => {
    const hasReview = reviewAnswers.some((a) => a.trim().length > 0);
    return form.content.trim().length > 0 || hasReview;
  }, [form.content, reviewAnswers]);

  const handleSave = async () => {
    if (!hasWritten) return;
    setSaving(true);
    try {
      const payload: DiaryFormData = {
        ...form,
        review: serializeReviewAnswers(reviewAnswers),
      };
      const ok = await onSave(payload);
      if (ok) {
        setForm(payload);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="diary-panel">
      <div className="diary-panel-scroll">
        <label>天气</label>
        <div className="chips">
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w.value}
              type="button"
              className={form.weather === w.value ? 'chip weather active' : 'chip weather'}
              aria-label={w.value}
              title={w.value}
              onClick={() => {
                setForm((f) => ({ ...f, weather: w.value }));
                setSaved(false);
              }}
            >
              {w.icon}
            </button>
          ))}
        </div>

        <label>心情</label>
        <div className="chips">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              className={form.mood === m ? 'chip mood active' : 'chip mood'}
              onClick={() => {
                setForm((f) => ({ ...f, mood: m }));
                setSaved(false);
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <label>日记</label>
        <div className="qa-block">
          <p className="qa-question">{DIARY_QUESTION}</p>
          <textarea
            className="qa-answer"
            placeholder="写下你的回答…"
            rows={2}
            value={form.content}
            onChange={(e) => {
              setForm((f) => ({ ...f, content: e.target.value }));
              setSaved(false);
            }}
          />
        </div>

        <label>复盘</label>
        {REVIEW_QUESTIONS.map((question, index) => (
          <div key={question} className="qa-block review-block">
            <p className="qa-question">{question}</p>
            <textarea
              className="qa-answer"
              placeholder="写下你的回答…"
              rows={2}
              value={reviewAnswers[index] ?? ''}
              onChange={(e) => {
                setReviewAnswers((prev) => {
                  const next = [...prev];
                  next[index] = e.target.value;
                  return next;
                });
                setSaved(false);
              }}
            />
          </div>
        ))}

        {hasWritten && (
          <div className="save-area">
            <button
              type="button"
              className="btn-primary save-btn"
              disabled={saving || saved}
              onClick={handleSave}
            >
              {saving ? '保存中…' : saved ? '已保存' : '保存'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

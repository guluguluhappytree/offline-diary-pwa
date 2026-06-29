import { useEffect, useState } from 'react';

import type { DiaryFormData } from '../types/diary';
import { MOOD_OPTIONS, WEATHER_OPTIONS } from '../types/diary';
import './DiaryPanel.css';

interface Props {
  date: string;
  initial?: Partial<DiaryFormData>;
  onSave: (data: DiaryFormData) => Promise<boolean>;
}

const EMPTY: DiaryFormData = {
  weather: '晴',
  mood: '😊',
  content: '',
  review: '',
};

export function DiaryPanel({ date, initial, onSave }: Props) {
  const [form, setForm] = useState<DiaryFormData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY, ...initial });
  }, [date, initial]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="diary-panel">
      <div className="diary-panel-header">
        <h2>{date}</h2>
        <button type="button" className="btn-primary save-btn" disabled={saving} onClick={handleSave}>
          {saving ? '保存中' : '保存'}
        </button>
      </div>

      <div className="diary-panel-scroll">
        <label>天气</label>
        <div className="chips">
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w}
              type="button"
              className={form.weather === w ? 'chip active' : 'chip'}
              onClick={() => setForm((f) => ({ ...f, weather: w }))}
            >
              {w}
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
              onClick={() => setForm((f) => ({ ...f, mood: m }))}
            >
              {m}
            </button>
          ))}
        </div>

        <label>文字日记</label>
        <textarea
          className="diary-textarea"
          placeholder="记录今天..."
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        />

        <label>复盘</label>
        <textarea
          className="diary-textarea review"
          placeholder="今天学到了什么？"
          value={form.review}
          onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
        />
      </div>
    </section>
  );
}

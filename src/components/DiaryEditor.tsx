import { useEffect, useState } from 'react';

import type { DiaryFormData } from '../types/diary';
import { MOOD_OPTIONS, WEATHER_OPTIONS } from '../types/diary';
import './DiaryEditor.css';

interface Props {
  date: string;
  initial?: Partial<DiaryFormData>;
  onClose: () => void;
  onSave: (data: DiaryFormData) => Promise<boolean>;
}

const EMPTY: DiaryFormData = {
  weather: '晴',
  mood: '😊',
  content: '',
  notes: '',
  review: '',
};

export function DiaryEditor({ date, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<DiaryFormData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY, ...initial });
  }, [date, initial]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await onSave(form);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{date} 日记</h2>

        <label>天气</label>
        <div className="chips">
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w.value}
              type="button"
              className={form.weather === w.value ? 'chip active' : 'chip'}
              aria-label={w.value}
              onClick={() => setForm((f) => ({ ...f, weather: w.value }))}
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
              onClick={() => setForm((f) => ({ ...f, mood: m }))}
            >
              {m}
            </button>
          ))}
        </div>

        <label>文字日记</label>
        <textarea
          rows={4}
          placeholder="记录今天..."
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        />

        <label>复盘</label>
        <textarea
          rows={3}
          placeholder="今天学到了什么？"
          value={form.review}
          onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
        />

        <div className="editor-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

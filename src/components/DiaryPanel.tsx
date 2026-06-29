import { useEffect, useMemo, useState } from 'react';

import type { DiaryFormData } from '../types/diary';
import { MOOD_OPTIONS, WEATHER_OPTIONS } from '../types/diary';
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

const CONTENT_PLACEHOLDER =
  '今天发生了什么重要进展？它带给你怎样的真实感受？';

const REVIEW_PLACEHOLDER = `今天什么事超出了预期？核心原因是什么？
你提炼出了什么新规则？
明天具体调整哪个行动？`;

export function DiaryPanel({ initial, onSave }: Props) {
  const [form, setForm] = useState<DiaryFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY, ...initial });
    setSaved(false);
  }, [initial]);

  const hasWritten = useMemo(
    () => form.content.trim().length > 0 || form.review.trim().length > 0,
    [form.content, form.review],
  );

  const handleSave = async () => {
    if (!hasWritten) return;
    setSaving(true);
    try {
      const ok = await onSave(form);
      if (ok) setSaved(true);
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
              key={w}
              type="button"
              className={form.weather === w ? 'chip active' : 'chip'}
              onClick={() => {
                setForm((f) => ({ ...f, weather: w }));
                setSaved(false);
              }}
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
        <textarea
          className="diary-textarea"
          placeholder={CONTENT_PLACEHOLDER}
          value={form.content}
          onChange={(e) => {
            setForm((f) => ({ ...f, content: e.target.value }));
            setSaved(false);
          }}
        />

        <label>复盘</label>
        <textarea
          className="diary-textarea review"
          placeholder={REVIEW_PLACEHOLDER}
          value={form.review}
          onChange={(e) => {
            setForm((f) => ({ ...f, review: e.target.value }));
            setSaved(false);
          }}
        />

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

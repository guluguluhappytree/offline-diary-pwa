export type SyncStatus = 0 | 1;
export type MediaType = 'photo' | 'video';

export interface DiaryEntry {
  id?: number;
  date: string;
  weather: string | null;
  mood: string | null;
  content: string;
  review: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id?: number;
  diary_date: string;
  blob: Blob;
  media_type: MediaType;
  caption: string;
  sync_status: SyncStatus;
  created_at: string;
}

export interface DiaryFormData {
  weather: string;
  mood: string;
  content: string;
  review: string;
}

export const WEATHER_OPTIONS = [
  { value: '晴', icon: '☀️' },
  { value: '多云', icon: '⛅' },
  { value: '阴', icon: '☁️' },
  { value: '雨', icon: '🌧️' },
  { value: '雪', icon: '❄️' },
  { value: '风', icon: '💨' },
] as const;

export const MOOD_OPTIONS = ['😊', '😐', '😔', '😤', '🥰', '😴'] as const;

export const DIARY_QUESTION = '今天发生了什么重要进展？它带给你怎样的真实感受？';

export const REVIEW_QUESTIONS = [
  '今天什么事超出了预期？核心原因是什么？',
  '你提炼出了什么新规则？',
  '明天具体调整哪个行动？',
] as const;

export function weatherIcon(weather: string | null | undefined): string {
  return WEATHER_OPTIONS.find((w) => w.value === weather)?.icon ?? '☀️';
}

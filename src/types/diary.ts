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

export const WEATHER_OPTIONS = ['晴', '多云', '阴', '雨', '雪', '风'] as const;
export const MOOD_OPTIONS = ['😊', '😐', '😔', '😤', '🥰', '😴'] as const;

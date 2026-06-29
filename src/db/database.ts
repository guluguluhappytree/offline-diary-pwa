import Dexie, { type EntityTable } from 'dexie';

import type { DiaryEntry, MediaItem } from '../types/diary';

class DiaryDatabase extends Dexie {
  diary_entries!: EntityTable<DiaryEntry, 'id'>;
  media_items!: EntityTable<MediaItem, 'id'>;

  constructor() {
    super('offline_diary_pwa');
    this.version(1).stores({
      diary_entries: '++id, &date, sync_status, updated_at',
      media_items: '++id, diary_date, sync_status, created_at',
    });
  }
}

export const db = new DiaryDatabase();

let initPromise: Promise<void> | null = null;

/**
 * 启动时唯一允许的 I/O：打开 IndexedDB。
 * 禁止在此函数内发起任何网络请求。
 */
export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = db
      .open()
      .then(() => undefined)
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export function isDatabaseReady(): boolean {
  return db.isOpen();
}

/** 统一包装 DB 操作，异常不向上传播导致 UI 卡死 */
export async function withDb<T>(
  operation: () => Promise<T>,
  fallback: T,
  label = 'db',
): Promise<T> {
  try {
    if (!db.isOpen()) await initDatabase();
    return await operation();
  } catch (err) {
    console.error(`[${label}]`, err);
    return fallback;
  }
}

export async function getMarkedDates(): Promise<Set<string>> {
  return withDb(async () => {
    const rows = await db.diary_entries.orderBy('date').reverse().toArray();
    return new Set(rows.map((r) => r.date));
  }, new Set());
}

export async function getEntryByDate(date: string): Promise<DiaryEntry | undefined> {
  return withDb(() => db.diary_entries.where('date').equals(date).first(), undefined);
}

export async function upsertEntry(
  date: string,
  data: Pick<DiaryEntry, 'weather' | 'mood' | 'content' | 'review'>,
): Promise<boolean> {
  return withDb(async () => {
    const now = new Date().toISOString();
    const existing = await db.diary_entries.where('date').equals(date).first();
    if (existing?.id) {
      await db.diary_entries.update(existing.id, {
        ...data,
        sync_status: 0,
        updated_at: now,
      });
    } else {
      await db.diary_entries.add({
        date,
        ...data,
        sync_status: 0,
        created_at: now,
        updated_at: now,
      });
    }
    return true;
  }, false);
}

export async function getAllEntriesDesc(): Promise<DiaryEntry[]> {
  return withDb(() => db.diary_entries.orderBy('date').reverse().toArray(), []);
}

export async function addMediaItem(
  diaryDate: string,
  blob: Blob,
  mediaType: MediaItem['media_type'],
  caption = '',
): Promise<boolean> {
  return withDb(async () => {
    await db.media_items.add({
      diary_date: diaryDate,
      blob,
      media_type: mediaType,
      caption,
      sync_status: 0,
      created_at: new Date().toISOString(),
    });
    return true;
  }, false);
}

export async function getAllMediaDesc(): Promise<MediaItem[]> {
  return withDb(() => db.media_items.orderBy('created_at').reverse().toArray(), []);
}

export async function getUnsyncedEntries(): Promise<DiaryEntry[]> {
  return withDb(
    () => db.diary_entries.where('sync_status').equals(0).toArray(),
    [],
  );
}

export async function getUnsyncedMedia(): Promise<MediaItem[]> {
  return withDb(() => db.media_items.where('sync_status').equals(0).toArray(), []);
}

export async function markEntrySynced(id: number): Promise<void> {
  await withDb(async () => {
    await db.diary_entries.update(id, { sync_status: 1 });
  }, undefined);
}

export async function markMediaSynced(id: number): Promise<void> {
  await withDb(async () => {
    await db.media_items.update(id, { sync_status: 1 });
  }, undefined);
}

export async function countUnsynced(): Promise<{ entries: number; media: number }> {
  return withDb(
    async () => {
      const [entries, media] = await Promise.all([
        db.diary_entries.where('sync_status').equals(0).count(),
        db.media_items.where('sync_status').equals(0).count(),
      ]);
      return { entries, media };
    },
    { entries: 0, media: 0 },
  );
}

export async function replaceAllEntries(
  entries: Array<{
    date: string;
    weather?: string | null;
    mood?: string | null;
    content?: string;
    review?: string;
    created_at?: string;
    updated_at?: string;
  }>,
): Promise<number> {
  return withDb(async () => {
    const now = new Date().toISOString();
    await db.transaction('rw', db.diary_entries, async () => {
      await db.diary_entries.clear();
      for (const e of entries) {
        if (!e.date) continue;
        await db.diary_entries.add({
          date: e.date,
          weather: e.weather ?? null,
          mood: e.mood ?? null,
          content: e.content ?? '',
          review: e.review ?? '',
          sync_status: 1,
          created_at: e.created_at ?? now,
          updated_at: e.updated_at ?? now,
        });
      }
    });
    return entries.filter((e) => e.date).length;
  }, 0);
}

/** @deprecated 使用 replaceAllEntries 全量同步 */
export async function bulkImportEntries(
  entries: Array<{
    date: string;
    weather?: string | null;
    mood?: string | null;
    content?: string;
    review?: string;
    created_at?: string;
    updated_at?: string;
  }>,
): Promise<number> {
  return withDb(async () => {
    let count = 0;
    const now = new Date().toISOString();
    await db.transaction('rw', db.diary_entries, async () => {
      for (const e of entries) {
        if (!e.date) continue;
        const existing = await db.diary_entries.where('date').equals(e.date).first();
        const row = {
          date: e.date,
          weather: e.weather ?? null,
          mood: e.mood ?? null,
          content: e.content ?? '',
          review: e.review ?? '',
          sync_status: 1 as const,
          created_at: e.created_at ?? now,
          updated_at: e.updated_at ?? now,
        };
        if (existing?.id) {
          await db.diary_entries.update(existing.id, row);
        } else {
          await db.diary_entries.add(row);
        }
        count++;
      }
    });
    return count;
  }, 0);
}

export async function countAllEntries(): Promise<number> {
  return withDb(() => db.diary_entries.count(), 0);
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/** 将 File 复制为 Blob 存入 IndexedDB（本地路径即 blob 本身） */
export async function fileToStoredBlob(file: File): Promise<Blob> {
  return file.slice(0, file.size, file.type || 'application/octet-stream');
}

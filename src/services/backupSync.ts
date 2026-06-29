import {
  getUnsyncedEntries,
  getUnsyncedMedia,
  markEntrySynced,
  markMediaSynced,
} from '../db/database';
import type { DiaryEntry, MediaItem } from '../types/diary';
import {
  getBackupConfig,
  getLastSyncError,
  isBackupConfigured,
  setLastSyncAt,
  setLastSyncError,
} from './backupConfig';

export type SyncPhase = 'idle' | 'syncing' | 'success' | 'error';

type SyncListener = (phase: SyncPhase, detail?: string) => void;

let phase: SyncPhase = 'idle';
let syncing = false;
const listeners = new Set<SyncListener>();

function setPhase(next: SyncPhase, detail?: string) {
  phase = next;
  for (const fn of listeners) fn(next, detail);
}

export function getSyncPhase(): SyncPhase {
  return phase;
}

export function subscribeSync(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(phase);
  return () => listeners.delete(listener);
}

function headers(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Backup-Token': token,
  };
}

function mediaExtension(blob: Blob, mediaType: MediaItem['media_type']): string {
  if (blob.type.includes('png')) return 'png';
  if (blob.type.includes('webp')) return 'webp';
  if (blob.type.includes('gif')) return 'gif';
  if (blob.type.includes('mp4')) return 'mp4';
  if (blob.type.includes('quicktime')) return 'mov';
  if (blob.type.includes('jpeg') || blob.type.includes('jpg')) return 'jpg';
  return mediaType === 'video' ? 'mp4' : 'jpg';
}

async function uploadEntry(baseUrl: string, token: string, entry: DiaryEntry): Promise<boolean> {
  const response = await fetch(`${baseUrl}/api/entries`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(entry),
  });
  if (!response.ok) return false;
  if (entry.id != null) await markEntrySynced(entry.id);
  return true;
}

async function uploadMedia(baseUrl: string, token: string, item: MediaItem): Promise<boolean> {
  const form = new FormData();
  form.append('client_id', String(item.id));
  form.append('diary_date', item.diary_date);
  form.append('media_type', item.media_type);
  form.append('caption', item.caption);
  form.append('created_at', item.created_at);
  form.append(
    'file',
    item.blob,
    `media-${item.id}.${mediaExtension(item.blob, item.media_type)}`,
  );

  const response = await fetch(`${baseUrl}/api/media`, {
    method: 'POST',
    headers: { 'X-Backup-Token': token },
    body: form,
  });
  if (!response.ok) return false;
  if (item.id != null) await markMediaSynced(item.id);
  return true;
}

function connectionErrorMessage(serverUrl: string): string {
  const onHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const backupIsHttp = serverUrl.startsWith('http://');
  if (onHttps && backupIsHttp) {
    return '从 Vercel（https）无法直连家里 http。请用 Safari 打开电脑上的 http://192.168.x.x:3927，添加到主屏幕后从那里备份。';
  }
  if (serverUrl.includes('172.')) {
    return '地址不要用 172 开头，请改用电脑终端里 192.168 开头的地址。';
  }
  return '连接失败：确认电脑 start.bat 已开、手机和电脑同一 WiFi、地址和密钥正确。';
}

export async function testBackupConnection(): Promise<{ ok: boolean; message: string }> {
  const { serverUrl, token } = getBackupConfig();
  if (!serverUrl || !token) {
    return { ok: false, message: '请先填写备份地址和设备密钥' };
  }
  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      headers: { 'X-Backup-Token': token },
    });
    if (!response.ok) {
      return { ok: false, message: response.status === 401 ? '密钥不正确' : '无法连接备份服务' };
    }
    const data = (await response.json()) as { entries?: number; media?: number };
    return {
      ok: true,
      message: `已连接，电脑上有 ${data.entries ?? 0} 篇日记、${data.media ?? 0} 个媒体文件`,
    };
  } catch {
    return { ok: false, message: connectionErrorMessage(serverUrl) };
  }
}

export async function runIncrementalSync(): Promise<void> {
  if (syncing || !isBackupConfigured()) return;
  if (!navigator.onLine) return;

  const { serverUrl, token } = getBackupConfig();
  syncing = true;
  setPhase('syncing');

  try {
    const health = await fetch(`${serverUrl}/api/health`, {
      headers: { 'X-Backup-Token': token },
    });
    if (!health.ok) {
      setLastSyncError(health.status === 401 ? '密钥不正确' : '备份服务不可用');
      setPhase('error', getLastSyncError() ?? undefined);
      return;
    }

    const [entries, media] = await Promise.all([getUnsyncedEntries(), getUnsyncedMedia()]);
    if (entries.length === 0 && media.length === 0) {
      setLastSyncError(null);
      setPhase('idle');
      return;
    }

    for (const entry of entries) {
      const ok = await uploadEntry(serverUrl, token, entry);
      if (!ok) {
        setLastSyncError('部分日记上传失败');
        setPhase('error', '部分日记上传失败');
        return;
      }
    }

    for (const item of media) {
      const ok = await uploadMedia(serverUrl, token, item);
      if (!ok) {
        setLastSyncError('部分照片上传失败');
        setPhase('error', '部分照片上传失败');
        return;
      }
    }

    setLastSyncAt(new Date().toISOString());
    setLastSyncError(null);
    setPhase('success');
    window.setTimeout(() => setPhase('idle'), 2000);
  } catch {
    setLastSyncError(connectionErrorMessage(serverUrl));
    setPhase('error', '备份失败');
  } finally {
    syncing = false;
  }
}

let started = false;

export function startBackupSync(): void {
  if (started) return;
  started = true;

  const trigger = () => {
    if (!isBackupConfigured()) return;
    runIncrementalSync().catch(() => {
      /* 静默 */
    });
  };

  window.addEventListener('online', trigger);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trigger();
  });

  window.setInterval(trigger, 5 * 60 * 1000);
  window.setTimeout(trigger, 3000);
}

export interface BackupConfig {
  serverUrl: string;
  token: string;
}

const STORAGE_KEY = 'diary_backup_config';
const LAST_SYNC_KEY = 'diary_backup_last_sync';
const LAST_ERROR_KEY = 'diary_backup_last_error';

export function getBackupConfig(): BackupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { serverUrl: '', token: '' };
    const parsed = JSON.parse(raw) as BackupConfig;
    return {
      serverUrl: (parsed.serverUrl ?? '').trim().replace(/\/$/, ''),
      token: (parsed.token ?? '').trim(),
    };
  } catch {
    return { serverUrl: '', token: '' };
  }
}

export function saveBackupConfig(config: BackupConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      serverUrl: config.serverUrl.trim().replace(/\/$/, ''),
      token: config.token.trim(),
    }),
  );
}

export function isBackupConfigured(): boolean {
  const { serverUrl, token } = getBackupConfig();
  return Boolean(serverUrl && token);
}

export function getLastSyncAt(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSyncAt(iso: string): void {
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

export function getLastSyncError(): string | null {
  return localStorage.getItem(LAST_ERROR_KEY);
}

export function setLastSyncError(message: string | null): void {
  if (message) localStorage.setItem(LAST_ERROR_KEY, message);
  else localStorage.removeItem(LAST_ERROR_KEY);
}

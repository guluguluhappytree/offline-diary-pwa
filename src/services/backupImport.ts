import { bulkImportEntries, countAllEntries } from '../db/database';
import { getBackupConfig, isBackupConfigured } from './backupConfig';

export async function importEntriesFromServer(): Promise<{ ok: boolean; message: string }> {
  if (!isBackupConfigured()) {
    return { ok: false, message: '请先配置备份地址和密钥' };
  }

  const { serverUrl, token } = getBackupConfig();
  try {
    const response = await fetch(`${serverUrl}/api/export/entries`, {
      headers: { 'X-Backup-Token': token },
    });
    if (!response.ok) {
      return {
        ok: false,
        message: response.status === 401 ? '密钥不正确' : '无法从电脑拉取日记',
      };
    }

    const data = (await response.json()) as {
      entries?: Array<{
        date: string;
        weather?: string | null;
        mood?: string | null;
        content?: string;
        review?: string;
        created_at?: string;
        updated_at?: string;
      }>;
    };

    const entries = data.entries ?? [];
    if (entries.length === 0) {
      return { ok: false, message: '电脑上没有可导入的日记' };
    }

    const imported = await bulkImportEntries(entries);
    const total = await countAllEntries();
    return {
      ok: true,
      message: `已导入 ${imported} 篇，手机本地共 ${total} 篇日记`,
    };
  } catch {
    const onHttps = window.location.protocol === 'https:';
    if (onHttps && serverUrl.startsWith('http://')) {
      return {
        ok: false,
        message: '请用家里 http://192.168.x.x:3927 打开 App 后再导入',
      };
    }
    return { ok: false, message: '导入失败，请确认备份服务已启动且在同一 WiFi' };
  }
}

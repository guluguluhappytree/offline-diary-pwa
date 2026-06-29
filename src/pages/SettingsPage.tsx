import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { countUnsynced, countAllEntries } from '../db/database';
import {
  getBackupConfig,
  getDefaultServerUrl,
  getLastSyncAt,
  getLastSyncError,
  isBackupConfigured,
  saveBackupConfig,
} from '../services/backupConfig';
import { importEntriesFromServer } from '../services/backupImport';
import {
  getSyncPhase,
  runIncrementalSync,
  subscribeSync,
  testBackupConnection,
} from '../services/backupSync';
import './SettingsPage.css';

function formatTime(iso: string | null): string {
  if (!iso) return '从未';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '从未';
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SettingsPage() {
  const initial = getBackupConfig();
  const [serverUrl, setServerUrl] = useState(initial.serverUrl || getDefaultServerUrl());
  const [token, setToken] = useState(initial.token);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState({ entries: 0, media: 0 });
  const [phase, setPhase] = useState(getSyncPhase());
  const [lastSyncAt, setLastSyncAt] = useState(getLastSyncAt());
  const [lastError, setLastError] = useState(getLastSyncError());
  const [localTotal, setLocalTotal] = useState(0);

  const refreshMeta = useCallback(async () => {
    setPending(await countUnsynced());
    setLocalTotal(await countAllEntries());
    setLastSyncAt(getLastSyncAt());
    setLastError(getLastSyncError());
  }, []);

  useEffect(() => {
    refreshMeta();
    const suggested = getDefaultServerUrl();
    if (!initial.serverUrl && suggested) {
      setServerUrl(suggested);
    }
    return subscribeSync((next) => {
      setPhase(next);
      if (next === 'success' || next === 'idle') refreshMeta();
    });
  }, [refreshMeta]);

  const handleSave = () => {
    saveBackupConfig({ serverUrl, token });
    setMessage('已保存');
    refreshMeta();
  };

  const handleTest = async () => {
    saveBackupConfig({ serverUrl, token });
    setMessage('正在测试连接…');
    const result = await testBackupConnection();
    setMessage(result.message);
  };

  const handleSyncNow = async () => {
    saveBackupConfig({ serverUrl, token });
    setMessage('正在备份…');
    await runIncrementalSync();
    await refreshMeta();
    setMessage(getLastSyncError() ?? '备份完成');
  };

  const handleImport = async () => {
    saveBackupConfig({ serverUrl, token });
    setMessage('正在从电脑导入历史日记…');
    const result = await importEntriesFromServer();
    setMessage(result.message);
    await refreshMeta();
  };

  const configured = isBackupConfigured() || (serverUrl.trim() && token.trim());
  const pendingTotal = pending.entries + pending.media;

  return (
    <div className="settings-page">
      <header className="page-header settings-header">
        <Link to="/history" className="back-link">
          ← 历史
        </Link>
        <h1>备份设置</h1>
        <p className="subtitle">离线照常写日记；连上家里 WiFi 后自动备份到电脑</p>
      </header>

      <section className="settings-card">
        <label>
          <span>电脑备份地址</span>
          <input
            type="url"
            inputMode="url"
            placeholder="http://192.168.1.5:3927"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
        </label>
        <label>
          <span>设备密钥</span>
          <input
            type="text"
            placeholder="启动备份服务后终端里显示的密钥"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="settings-actions">
          <button type="button" className="btn-primary" onClick={handleSave}>
            保存
          </button>
          <button type="button" className="btn-ghost" onClick={handleTest}>
            测试连接
          </button>
        </div>
        {message && <p className="settings-message">{message}</p>}
      </section>

      <section className="settings-card">
        <h2>同步状态</h2>
        <dl className="status-list">
          <div>
            <dt>配置</dt>
            <dd>{configured ? '已配置' : '未配置'}</dd>
          </div>
          <div>
            <dt>手机本地</dt>
            <dd>{localTotal} 篇</dd>
          </div>
          <div>
            <dt>待备份</dt>
            <dd>
              {pendingTotal === 0
                ? '无'
                : `${pending.entries} 篇日记，${pending.media} 个媒体`}
            </dd>
          </div>
          <div>
            <dt>上次备份</dt>
            <dd>{formatTime(lastSyncAt)}</dd>
          </div>
          <div>
            <dt>当前</dt>
            <dd>
              {phase === 'syncing'
                ? '备份中…'
                : lastError
                  ? lastError
                  : phase === 'success'
                    ? '刚刚完成'
                    : '空闲'}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          className="btn-primary settings-sync-btn"
          onClick={handleSyncNow}
          disabled={phase === 'syncing'}
        >
          立即备份
        </button>
        <button
          type="button"
          className="btn-primary settings-sync-btn secondary"
          onClick={handleImport}
          disabled={phase === 'syncing'}
        >
          从电脑导入历史日记
        </button>
      </section>

      <section className="settings-hint">
        <h2>连不上？按这个做</h2>
        <ol>
          <li>电脑双击运行 <code>diary-backup-server\start.bat</code>，窗口不要关</li>
          <li>地址填 <code>192.168</code> 开头的，<strong>不要填 172 开头</strong></li>
          <li>
            若从 Vercel 主屏幕图标打开：请改用 Safari 访问电脑上的{' '}
            <code>http://192.168.x.x:3927</code>，重新「添加到主屏幕」
          </li>
          <li>密钥复制终端里「设备密钥」整行，保存后点测试连接</li>
        </ol>
      </section>
    </div>
  );
}

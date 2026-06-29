import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { initDatabase } from './database';
import { startBackupSync } from '../services/backupSync';

type DbStatus = 'loading' | 'ready' | 'error';

const DbContext = createContext<DbStatus>('loading');

export function DbProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DbStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initDatabase()
      .then(() => {
        setStatus('ready');
        startBackupSync();
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : '本地数据库打开失败');
        setStatus('error');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" />
        <p>正在加载本地数据…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="boot-screen boot-error">
        <p>本地数据库异常</p>
        <small>{errorMsg}</small>
      </div>
    );
  }

  return <DbContext.Provider value={status}>{children}</DbContext.Provider>;
}

export function useDbReady(): boolean {
  return useContext(DbContext) === 'ready';
}

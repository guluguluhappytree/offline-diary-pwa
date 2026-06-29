import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { blobToObjectUrl, getAllEntriesDesc, getAllMediaDesc, countUnsynced } from '../db/database';
import { isBackupConfigured } from '../services/backupConfig';
import type { DiaryEntry, MediaItem } from '../types/diary';
import './HistoryPage.css';

type ViewMode = 'text' | 'media';

function EntryCard({ entry }: { entry: DiaryEntry }) {
  return (
    <article className="entry-card">
      <header>
        <strong>{entry.date}</strong>
        <span>
          {entry.weather} {entry.mood}
        </span>
      </header>
      {entry.content && <p>{entry.content}</p>}
      {entry.review && (
        <div className="review">
          <small>复盘</small>
          <p>{entry.review}</p>
        </div>
      )}
    </article>
  );
}

function HistoryMediaCard({ item }: { item: MediaItem }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = blobToObjectUrl(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);

  return (
    <article className="entry-card">
      <strong>{item.diary_date}</strong>
      {item.media_type === 'photo' ? (
        <img src={url} alt="" className="history-img" />
      ) : (
        <video src={url} controls playsInline className="history-img" />
      )}
    </article>
  );
}

export function HistoryPage() {
  const [mode, setMode] = useState<ViewMode>('text');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    const [e, m, unsynced] = await Promise.all([
      getAllEntriesDesc(),
      getAllMediaDesc(),
      countUnsynced(),
    ]);
    setEntries(e);
    setMedia(m);
    setPending(unsynced.entries + unsynced.media);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="history-page">
      <header className="page-header history-header">
        <div className="history-title-row">
          <h1>历史汇总</h1>
          <Link to="/settings" className="backup-link">
            备份{isBackupConfigured() && pending > 0 ? ` · ${pending}` : ''}
          </Link>
        </div>
        <div className="toggle">
          <button
            type="button"
            className={mode === 'text' ? 'active' : ''}
            onClick={() => setMode('text')}
          >
            文字版
          </button>
          <button
            type="button"
            className={mode === 'media' ? 'active' : ''}
            onClick={() => setMode('media')}
          >
            多媒体版
          </button>
        </div>
      </header>

      <div className="timeline">
        {mode === 'text' ? (
          entries.length === 0 ? (
            <p className="empty">还没有文字日记</p>
          ) : (
            entries.map((e) => <EntryCard key={e.id} entry={e} />)
          )
        ) : media.length === 0 ? (
          <p className="empty">暂无照片日记</p>
        ) : (
          media.map((m) => <HistoryMediaCard key={m.id} item={m} />)
        )}
      </div>
    </div>
  );
}

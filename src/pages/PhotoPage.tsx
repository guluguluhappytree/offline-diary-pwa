import { useCallback, useEffect, useRef, useState } from 'react';

import {
  addMediaItem,
  blobToObjectUrl,
  fileToStoredBlob,
  getAllMediaDesc,
  todayDateString,
} from '../db/database';
import type { MediaItem } from '../types/diary';
import { runIncrementalSync } from '../services/backupSync';
import './PhotoPage.css';

function MediaCard({ item }: { item: MediaItem }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = blobToObjectUrl(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);

  if (!url) return null;

  return (
    <article className="media-card">
      <time>{item.diary_date}</time>
      {item.media_type === 'photo' ? (
        <img src={url} alt={item.caption || '照片日记'} loading="lazy" />
      ) : (
        <video src={url} controls playsInline preload="metadata" />
      )}
      {item.caption && <p>{item.caption}</p>}
    </article>
  );
}

export function PhotoPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const targetDate = todayDateString();

  const refresh = useCallback(async () => {
    setItems(await getAllMediaDesc());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || saving) return;
    setSaving(true);
    try {
      for (const file of Array.from(files)) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
        const blob = await fileToStoredBlob(file);
        await addMediaItem(targetDate, blob, mediaType);
      }
      await refresh();
      runIncrementalSync().catch(() => {});
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="boot-spinner" />
      </div>
    );
  }

  return (
    <div className="photo-page">
      <header className="page-header">
        <h1>照片日记</h1>
        <p className="subtitle">Blob 存入 IndexedDB，离线可看</p>
      </header>

      <button
        type="button"
        className="btn-primary add-btn"
        disabled={saving}
        onClick={() => inputRef.current?.click()}
      >
        {saving ? '保存中…' : '+ 添加照片/视频'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="media-list">
        {items.length === 0 ? (
          <p className="empty">暂无照片日记</p>
        ) : (
          items.map((item) => <MediaCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

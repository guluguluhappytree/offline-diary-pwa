export function TabIconDiary({ active }: { active?: boolean }) {
  return (
    <span className={`tab-glyph ${active ? 'active' : ''}`} aria-hidden>
      日
    </span>
  );
}

export function TabIconPhoto({ active }: { active?: boolean }) {
  return (
    <svg className={`tab-svg ${active ? 'active' : ''}`} viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6l1.5-2h5L16 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function TabIconHistory({ active }: { active?: boolean }) {
  return (
    <svg className={`tab-svg ${active ? 'active' : ''}`} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

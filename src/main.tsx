import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service Worker 在 UI 渲染后异步注册，避免阻塞首屏
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onOfflineReady() {
            console.info('[PWA] 离线缓存就绪');
          },
        });
      })
      .catch((err) => console.warn('[PWA] SW 注册跳过', err));
  });
}

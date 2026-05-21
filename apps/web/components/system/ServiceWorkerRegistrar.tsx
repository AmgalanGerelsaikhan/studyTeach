'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const url = '/sw.js';
    navigator.serviceWorker.register(url, { scope: '/' }).catch((err) => {
      console.warn('[st-pwa] sw register failed', err);
    });
  }, []);
  return null;
}

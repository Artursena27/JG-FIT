'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // silent: registration failure should not break the app
        });
      } catch {
        // silent
      }
    }
  }, []);

  return null;
}

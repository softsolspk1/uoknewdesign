'use client';

import { useEffect } from 'react';

export default function PageViewBeacon({ path }: { path: string }) {
  useEffect(() => {
    const body = JSON.stringify({ path });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return null;
}

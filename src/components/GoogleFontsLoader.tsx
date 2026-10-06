'use client';

import { useEffect } from 'react';
import { GOOGLE_FONTS_HREF } from '@/lib/fonts';

// Injects the Google Fonts stylesheet after mount instead of via a
// render-blocking <link> in <head>. fonts.googleapis.com can be slow or
// unreachable on some networks; a blocking link there stalls the whole page
// behind it. Deferring to an effect means the page is already visible and
// interactive by the time this request resolves (or fails).
export default function GoogleFontsLoader() {
  useEffect(() => {
    if (document.querySelector(`link[href="${GOOGLE_FONTS_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_HREF;
    document.head.appendChild(link);
  }, []);

  return null;
}

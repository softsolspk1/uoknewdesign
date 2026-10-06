import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import { GOOGLE_FONTS_HREF } from "@/lib/fonts";
import { getMenuTree } from "@/lib/menu";

export const metadata: Metadata = {
  title: "University of Karachi — Official Website | Est. 1951",
  description:
    "Official website of the University of Karachi (UoK) — a leading public research university established in 1951, with nine faculties, 53 departments and 27 research institutes serving over 41,000 students.",
};

// Header/footer nav is stored in the DB (MenuItem) so admins can edit it
// from /admin/menus; this stays a server component so the query happens
// once per render instead of a client-side fetch waterfall on every page.
export const revalidate = 300;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerMenu = await getMenuTree("header");

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/favicons/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicons/favicon-32x32.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Font Awesome's solid glyph set is used above the fold on every
            page (header/nav/footer icons); preload it so the browser fetches
            it in parallel with CSS instead of discovering it only after the
            stylesheet is parsed. */}
        <link
          rel="preload"
          href="/assets/fonts/fontawesome/fa-solid-900.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Google Fonts stylesheet is injected client-side by
            GoogleFontsLoader below instead of a blocking <link> here:
            fonts.googleapis.com can be slow or unreachable on some
            networks, and a render-blocking link there would stall the
            whole page behind it. noscript covers JS-disabled clients. */}
        <noscript>
          <link href={GOOGLE_FONTS_HREF} rel="stylesheet" />
        </noscript>
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/fontawesome.min.css" />
        <link rel="stylesheet" href="/assets/css/magnific-popup.min.css" />
        <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/custom.css?v=9" />
      </head>
      <body suppressHydrationWarning>
        <GoogleFontsLoader />
        <SiteChrome headerMenu={headerMenu}>{children}</SiteChrome>

        {/* Google Analytics (GA4) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-RH99XV0606" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RH99XV0606');`}
        </Script>

        {/* Global UI & Slider Scripts — main.js (and wow.min.js inside it)
            wire up scroll-reveal via `window.addEventListener('load', ...)`.
            Next's "lazyOnload" strategy defers script injection until AFTER
            the window `load` event already fired, so that listener never
            runs and every `.wow` / `data-ani` element (used across nearly
            every page — hero text, cards, department photos) is stuck
            invisible/blurred forever. "afterInteractive" injects scripts
            right after hydration instead, while the real `load` event is
            still in the future, so the listener actually fires. main.js
            wires up all of these plugins unconditionally in one chained init
            block, so they must stay together in the same strategy (Next
            preserves execution order within a strategy) — splitting them
            across strategies would let main.js call a plugin method before
            that plugin's script has registered it, throwing and aborting the
            rest of main.js's init (including menu/sticky-header setup). */}
        <Script src="/assets/js/vendor/jquery-3.7.1.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/swiper-bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/bootstrap.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.magnific-popup.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.counterup.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery-ui.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/imagesloaded.pkgd.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/isotope.pkgd.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/wow.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/gsap.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/ScrollTrigger.min.js" strategy="afterInteractive" />
        {/* main.js calls gsap.registerPlugin(ScrollTrigger) too late — several
            scrollTrigger-using calls run earlier in the same file — which
            throws "Missing plugin?" warnings and silently drops those
            animations. Registering it here, right after ScrollTrigger loads
            and before main.js runs, closes that gap without touching the
            vendored file. */}
        <Script id="gsap-register-scrolltrigger" strategy="afterInteractive">
          {`if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') { gsap.registerPlugin(ScrollTrigger); }`}
        </Script>
        <Script src="/assets/js/SplitText.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/lenis.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
        <Script src="/assets/js/uok-fixes.js" strategy="afterInteractive" />
        <Script src="/assets/js/uok-contact-form.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

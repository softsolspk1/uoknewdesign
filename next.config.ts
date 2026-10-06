import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/*': ['legacy_html/**/*', 'src/content/**/*'],
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/pg-admissions-downloads',
        destination: '/pg-admissions',
        permanent: true,
      },
      {
        source: '/:slug([a-zA-Z0-9_-]+).html',
        destination: '/:slug',
        permanent: true,
      },
      // Old-site research institute URLs (e.g. /research_institutes/sympdc/index.php)
      {
        source: '/research_institutes/mrcrc/:page*',
        destination: '/institute-mrcc',
        permanent: true,
      },
      {
        source: '/research_institutes/:code([a-z]+)/:page*',
        destination: '/institute-:code',
        permanent: true,
      },
      {
        source: '/research_institutes/:page*',
        destination: '/research',
        permanent: true,
      },
      {
        source: '/faculties/computerscience/ubit:ext(.php)?',
        destination: '/department-computerscience',
        permanent: true,
      },
      {
        source: '/faculties/:dept/courses:ext(.php)?',
        destination: '/department-:dept#courses',
        permanent: false,
      },
      {
        source: '/faculties/:dept/faculty:ext(.php)?',
        destination: '/department-:dept#faculty',
        permanent: false,
      },
      {
        source: '/faculties/:dept/objectives:ext(.php)?',
        destination: '/department-:dept#objectives',
        permanent: false,
      },
      {
        source: '/faculties/:dept/programs:ext(.php)?',
        destination: '/department-:dept#programs',
        permanent: false,
      },
      {
        source: '/faculties/:dept/facilities:ext(.php)?',
        destination: '/department-:dept#facilities',
        permanent: false,
      },
      {
        source: '/faculties/:dept/research:ext(.php)?',
        destination: '/department-:dept#research',
        permanent: false,
      },
      {
        source: '/faculties/:dept/contact:ext(.php)?',
        destination: '/department-:dept#contact',
        permanent: false,
      },
      {
        source: '/faculties/:dept/index:ext(.php)?',
        destination: '/department-:dept',
        permanent: false,
      },
      {
        source: '/faculties/:dept',
        destination: '/department-:dept',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  summary: {
    total: number;
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    uniqueVisitorsTotal: number;
    uniqueVisitorsToday: number;
  };
  dailyTrend: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
  devices: { mobile: number; tablet: number; desktop: number };
  browsers: { name: string; views: number }[];
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="col-xl-3 col-sm-6">
      <div style={{ ...cardStyle, borderLeft: `5px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#212529', margin: '8px 0 4px 0' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h2>
            {sub && <span style={{ fontSize: '12px', color: '#6c757d' }}>{sub}</span>}
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: `${color}1a`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            <i className={icon}></i>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px', paddingTop: '8px' }}>
      {data.map((d) => {
        const heightPct = (d.views / max) * 100;
        const label = new Date(d.date + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return (
          <div
            key={d.date}
            title={`${label}: ${d.views} views`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', cursor: 'default' }}
          >
            <div
              style={{
                width: '100%',
                height: `${Math.max(heightPct, d.views > 0 ? 3 : 0)}%`,
                backgroundColor: '#006633',
                borderRadius: '3px 3px 0 0',
                opacity: 0.85,
                minHeight: d.views > 0 ? '3px' : 0,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
            />
          </div>
        );
      })}
    </div>
  );
}

function BreakdownBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
        <span style={{ fontWeight: 600, color: '#212529' }}>{label}</span>
        <span style={{ color: '#6c757d' }}>{value.toLocaleString()} ({pct}%)</span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#eef1f4', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/admin/analytics')
        .then((res) => res.json())
        .then((json) => {
          if (json.error) setError(json.error);
          else setData(json);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load analytics.');
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#dc3545', margin: 0 }}>{error || 'No analytics data available.'}</p>
      </div>
    );
  }

  const { summary, dailyTrend, topPages, topReferrers, devices, browsers } = data;
  const deviceTotal = devices.mobile + devices.tablet + devices.desktop;
  const browserTotal = browsers.reduce((sum, b) => sum + b.views, 0);

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>Site Analytics</h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Traffic recorded directly by this site (not Google Analytics) — every real visit to a public page is logged here.
          </p>
        </div>
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '13px',
            color: '#006633',
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #006633',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <i className="fa-brands fa-google"></i> Open Google Analytics
        </a>
      </div>

      <div className="row g-4 mb-4">
        <StatCard label="Total Page Views" value={summary.total} sub="All-time" color="#0d6efd" icon="fa-solid fa-chart-line" />
        <StatCard
          label="Today"
          value={summary.today}
          sub={`${summary.yesterday} yesterday`}
          color="#006633"
          icon="fa-solid fa-calendar-day"
        />
        <StatCard label="Last 7 Days" value={summary.last7Days} sub={`${summary.last30Days} in last 30 days`} color="#ffc107" icon="fa-solid fa-calendar-week" />
        <StatCard
          label="Unique Visitors"
          value={summary.uniqueVisitorsTotal}
          sub={`${summary.uniqueVisitorsToday} today (by IP)`}
          color="#6f42c1"
          icon="fa-solid fa-users"
        />
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div style={{ ...cardStyle, height: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a3a2a', margin: '0 0 12px 0' }}>
              <i className="fa-solid fa-chart-column me-2 text-success"></i> Daily Traffic — Last 30 Days
            </h3>
            <TrendChart data={dailyTrend} />
          </div>
        </div>
        <div className="col-lg-4">
          <div style={{ ...cardStyle, height: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a3a2a', margin: '0 0 16px 0' }}>
              <i className="fa-solid fa-mobile-screen me-2 text-primary"></i> Devices (30d)
            </h3>
            <BreakdownBar label="Mobile" value={devices.mobile} total={deviceTotal} color="#0d6efd" />
            <BreakdownBar label="Desktop" value={devices.desktop} total={deviceTotal} color="#006633" />
            <BreakdownBar label="Tablet" value={devices.tablet} total={deviceTotal} color="#ffc107" />
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div style={{ ...cardStyle, height: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a3a2a', margin: '0 0 16px 0' }}>
              <i className="fa-solid fa-arrow-trend-up me-2 text-success"></i> Top Pages (All-Time)
            </h3>
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Page / Route</th>
                  <th className="text-end">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPages.length > 0 ? (
                  topPages.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{p.path}</td>
                      <td className="text-end">
                        <span className="badge bg-light text-dark border px-2 py-1">{p.views.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-muted">No page views recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-6">
          <div style={{ ...cardStyle, height: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a3a2a', margin: '0 0 16px 0' }}>
              <i className="fa-solid fa-link me-2 text-warning"></i> Top Referrers (30d)
            </h3>
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Source</th>
                  <th className="text-end">Views</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.length > 0 ? (
                  topReferrers.map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{r.referrer}</td>
                      <td className="text-end">
                        <span className="badge bg-light text-dark border px-2 py-1">{r.views.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-muted">No referrer data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a3a2a', margin: '0 0 16px 0' }}>
          <i className="fa-solid fa-globe me-2 text-primary"></i> Browsers (30d)
        </h3>
        {browsers.length > 0 ? (
          browsers.map((b) => (
            <BreakdownBar key={b.name} label={b.name} value={b.views} total={browserTotal} color="#006633" />
          ))
        ) : (
          <p className="text-muted text-center py-3 mb-0">No browser data yet.</p>
        )}
      </div>
    </div>
  );
}

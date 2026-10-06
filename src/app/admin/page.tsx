'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/admin/stats')
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '12px', color: '#666', fontWeight: 500 }}>Loading Dashboard Analytics...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;
  const role = user?.role || 'admin';

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>
            Welcome back, {user?.name || 'Administrator'}!
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            {role === 'admin'
              ? 'Here is your University of Karachi portal analytics, pages overview, and recent contact inquiries.'
              : `Sub-Admin Portal: Managing ${user?.assignedDepartments || 'Assigned Departments'}.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {role === 'admin' && (
            <Link
              href="/admin/pages"
              style={{
                backgroundColor: '#006633',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0,102,51,0.2)',
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create Page</span>
            </Link>
          )}

          <Link
            href="/admin/contacts"
            style={{
              backgroundColor: '#1b2a21',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-inbox"></i>
            <span>View Inquiries ({stats?.contacts?.unread || 0})</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="row g-4 mb-4">
        {/* Card 1: Traffic Stats */}
        <div className="col-xl-3 col-sm-6">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderLeft: '5px solid #0d6efd',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Traffic
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#212529', margin: '8px 0 4px 0' }}>
                  {(stats?.traffic?.total ?? 0).toLocaleString()}
                </h2>
                <span style={{ fontSize: '12px', color: '#198754', fontWeight: 500 }}>
                  <i className="fa-solid fa-arrow-trend-up"></i> {stats?.traffic?.today ?? 0} today &middot; {stats?.traffic?.thisWeek ?? 0} this week
                </span>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#e7f1ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0d6efd',
                  fontSize: '20px',
                }}
              >
                <i className="fa-solid fa-chart-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pages */}
        <div className="col-xl-3 col-sm-6">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderLeft: '5px solid #006633',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                  Active Pages
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#212529', margin: '8px 0 4px 0' }}>
                  {stats?.pages?.total ?? 0}
                </h2>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                  {stats?.pages?.departments ?? 0} depts • {stats?.pages?.institutes ?? 0} institutes
                </span>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#006633',
                  fontSize: '20px',
                }}
              >
                <i className="fa-solid fa-file-lines"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Contact Inquiries */}
        <div className="col-xl-3 col-sm-6">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderLeft: '5px solid #ffc107',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                  Contact Forms
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#212529', margin: '8px 0 4px 0' }}>
                  {stats?.contacts?.total || 0}
                </h2>
                <span
                  style={{
                    fontSize: '12px',
                    color: stats?.contacts?.unread > 0 ? '#dc3545' : '#198754',
                    fontWeight: 600,
                  }}
                >
                  <i className="fa-solid fa-bell"></i> {stats?.contacts?.unread || 0} unread inquiries
                </span>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#fff8e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffc107',
                  fontSize: '20px',
                }}
              >
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Sub-Admins & Staff */}
        <div className="col-xl-3 col-sm-6">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderLeft: '5px solid #6f42c1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                  Admin Users
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#212529', margin: '8px 0 4px 0' }}>
                  {stats?.users?.total ?? 0}
                </h2>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                  RBAC & Sub-Admin Accounts
                </span>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#f3ebff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6f42c1',
                  fontSize: '20px',
                }}
              >
                <i className="fa-solid fa-users-gear"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Traffic & Recent Contact Inquiries */}
      <div className="row g-4 mb-4">
        {/* Top Visited Pages */}
        <div className="col-lg-6">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1a3a2a', margin: 0 }}>
                <i className="fa-solid fa-arrow-trend-up me-2 text-success"></i> Top Visited Pages
              </h3>
              <Link href="/admin/pages" style={{ fontSize: '13px', color: '#006633', textDecoration: 'none', fontWeight: 600 }}>
                Manage All
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Page / Route</th>
                    <th className="text-end">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.traffic?.topPages && stats.traffic.topPages.length > 0 ? (
                    stats.traffic.topPages.map((tp: any, idx: number) => (
                      <tr key={idx}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#212529' }}>{tp.path}</span>
                        </td>
                        <td className="text-end">
                          <span className="badge bg-light text-dark border px-2 py-1">{tp.views} views</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center py-4 text-muted">
                        No page views recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Contact Inquiries */}
        <div className="col-lg-6">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1a3a2a', margin: 0 }}>
                <i className="fa-solid fa-inbox me-2 text-warning"></i> Recent Contact Inquiries
              </h3>
              <Link href="/admin/contacts" style={{ fontSize: '13px', color: '#006633', textDecoration: 'none', fontWeight: 600 }}>
                View All
              </Link>
            </div>

            {stats?.contacts?.recent && stats.contacts.recent.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.contacts.recent.map((inq: any) => (
                  <div
                    key={inq.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: inq.status === 'unread' ? '#fff9e6' : '#f8f9fa',
                      border: inq.status === 'unread' ? '1px solid #ffeeba' : '1px solid #e9ecef',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#212529' }}>
                        {inq.name} <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 400 }}>({inq.email})</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#495057', marginTop: '2px' }}>
                        <strong>{inq.subject}:</strong> {inq.message.length > 50 ? inq.message.substring(0, 50) + '...' : inq.message}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        backgroundColor: inq.status === 'unread' ? '#ffc107' : inq.status === 'replied' ? '#198754' : '#0d6efd',
                        color: inq.status === 'unread' ? '#000' : '#fff',
                        textTransform: 'capitalize',
                      }}
                    >
                      {inq.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6c757d' }}>
                <i className="fa-solid fa-envelope-open" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}></i>
                <p style={{ margin: 0, fontSize: '14px' }}>No contact inquiries received yet.</p>
                <span style={{ fontSize: '12px' }}>Inquiries submitted through the Contact Us form will appear here.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Pages Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1a3a2a', margin: 0 }}>
            <i className="fa-solid fa-file-pen me-2 text-primary"></i> Recently Managed Pages
          </h3>
          <Link href="/admin/pages" className="btn btn-sm btn-outline-success" style={{ fontWeight: 600 }}>
            View All Pages
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.pages?.recent && stats.pages.recent.length > 0 ? (
                stats.pages.recent.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ color: '#006633' }}>{p.title}</strong>
                    </td>
                    <td>
                      <code>/{p.slug}</code>
                    </td>
                    <td>
                      <span className="badge bg-secondary text-capitalize">{p.category}</span>
                    </td>
                    <td>
                      <span className="badge bg-success">Published</span>
                    </td>
                    <td style={{ color: '#6c757d' }}>
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <Link href={`/${p.slug}.html`} target="_blank" className="btn btn-sm btn-light me-1" title="View Page">
                        <i className="fa-solid fa-eye"></i>
                      </Link>
                      <Link href={`/admin/pages?edit=${p.slug}`} className="btn btn-sm btn-success" title="Edit Page">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No pages loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

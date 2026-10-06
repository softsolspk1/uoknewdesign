'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // If on login page, render children without admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const user = session?.user as any;
  const role = user?.role || 'admin';
  const assignedDepts = user?.assignedDepartments;

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: 'fa-solid fa-chart-pie' },
    { label: 'Analytics', href: '/admin/analytics', icon: 'fa-solid fa-chart-column' },
    { label: 'Pages Manager', href: '/admin/pages', icon: 'fa-solid fa-file-lines' },
    { label: 'Homepage Slider', href: '/admin/slides', icon: 'fa-solid fa-images' },
    { label: 'News & Announcements', href: '/admin/news', icon: 'fa-solid fa-newspaper' },
    { label: 'FAQs', href: '/admin/faqs', icon: 'fa-solid fa-circle-question' },
    { label: 'Contact Inquiries', href: '/admin/contacts', icon: 'fa-solid fa-envelope' },
    { label: 'Info Submissions', href: '/admin/info-submissions', icon: 'fa-solid fa-building-columns' },
    ...(role === 'admin'
      ? [
          { label: 'Menus Manager', href: '/admin/menus', icon: 'fa-solid fa-bars' },
          { label: 'Users & Sub-Admins', href: '/admin/users', icon: 'fa-solid fa-users-gear' },
          { label: 'Backup & Restore', href: '/admin/backup', icon: 'fa-solid fa-database' },
        ]
      : []),
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .uok-admin-hamburger { display: none; }
        .uok-admin-sidebar-backdrop { display: none; }
        @media (max-width: 991px) {
          .uok-admin-hamburger { display: inline-flex !important; }
          .uok-admin-brand-text { display: none; }
          .uok-admin-user-name { display: none; }
          .uok-admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1100;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .uok-admin-sidebar.is-open {
            transform: translateX(0);
          }
          .uok-admin-sidebar-backdrop.is-open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1099;
          }
          .uok-admin-main {
            padding: 16px !important;
          }
          .uok-visual-editor-shell {
            margin: -16px !important;
            height: calc(100vh - 60px) !important;
          }
        }
      `}</style>

      {/* Top Admin Header */}
      <header
        style={{
          backgroundColor: '#0a3622',
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button
            type="button"
            className="uok-admin-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', minWidth: 0 }}>
            <img
              src="/uok101.jpg"
              alt="UOK Diamond Jubilee"
              style={{ height: '36px', width: 'auto', borderRadius: '4px', backgroundColor: '#fff', padding: '2px', flexShrink: 0 }}
            />
            <div className="uok-admin-brand-text" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                UNIVERSITY OF KARACHI
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, color: '#e0c068', whiteSpace: 'nowrap' }}>
                ADMINISTRATION PORTAL • 75TH ANNIVERSARY
              </div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#d4edda',
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '6px 10px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span className="uok-admin-brand-text">View Live Site</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="uok-admin-user-name" style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>{user?.name || user?.email || 'Administrator'}</div>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: role === 'admin' ? '#d4a017' : '#17a2b8',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {role === 'admin' ? 'Super Admin' : 'Sub-Admin'}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              style={{
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
              title="Sign Out"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Mobile backdrop */}
        <div
          className={`uok-admin-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar Navigation */}
        <aside
          className={`uok-admin-sidebar${sidebarOpen ? ' is-open' : ''}`}
          style={{
            width: '240px',
            backgroundColor: '#1b2a21',
            color: '#fff',
            padding: '24px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ padding: '0 12px 12px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#8898aa', fontWeight: 700 }}>
            Core Modules
          </div>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : '#c2c7d0',
                  backgroundColor: active ? '#006633' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className={item.icon} style={{ width: '18px', textAlign: 'center', color: active ? '#ffd700' : 'inherit' }}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {role === 'subadmin' && assignedDepts && (
            <div style={{ marginTop: 'auto', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ color: '#ffd700', fontWeight: 600, marginBottom: '4px' }}>
                <i className="fa-solid fa-shield-halved"></i> Department Scope
              </div>
              <div style={{ color: '#bbb', fontSize: '11px', wordBreak: 'break-word' }}>
                {assignedDepts}
              </div>
            </div>
          )}
        </aside>

        {/* Dynamic Content Body */}
        <main className="uok-admin-main" style={{ flex: 1, padding: '28px', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}

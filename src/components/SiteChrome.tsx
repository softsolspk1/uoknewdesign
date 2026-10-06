'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import HomeHeader from './home/HomeHeader';
import HomeFooter from './home/HomeFooter';
import type { MenuNode } from '@/lib/menu';
import '@/app/home-v2.css';
import '@/app/inner-v2.css';

export default function SiteChrome({
  children,
  headerMenu,
}: {
  children: React.ReactNode;
  headerMenu: MenuNode[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname?.startsWith('/admin/');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <HomeHeader menu={headerMenu} />
      {children}
      <HomeFooter />
    </>
  );
}

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import HomeHeader from './home/HomeHeader';
import HomeFooter from './home/HomeFooter';
import type { MenuNode } from '@/lib/menu';
import '@/app/home-v2.css';

export default function SiteChrome({
  children,
  headerMenu,
  footerMenu,
}: {
  children: React.ReactNode;
  headerMenu: MenuNode[];
  footerMenu: MenuNode[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname?.startsWith('/admin/');

  if (isAdmin) {
    return <>{children}</>;
  }

  // The homepage uses the redesigned header/footer; inner pages keep the
  // legacy theme chrome until they are redesigned too.
  if (pathname === '/') {
    return (
      <>
        <HomeHeader menu={headerMenu} />
        {children}
        <HomeFooter />
      </>
    );
  }

  return (
    <>
      <Header menu={headerMenu} />
      {children}
      <Footer menu={footerMenu} />
    </>
  );
}

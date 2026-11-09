import type { ReactNode } from 'react';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata = { title: 'Eval Platform' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}

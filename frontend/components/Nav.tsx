'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken, getToken } from '@/lib/api';

const links = [
  ['/upload', 'Upload'],
  ['/responses', 'Responses'],
  ['/rubrics', 'Rubrics'],
  ['/dashboard', 'Dashboard'],
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(!!getToken()), [path]);

  function logout() {
    clearToken();
    setSignedIn(false);
    router.push('/login');
  }

  return (
    <nav>
      <strong>Eval Platform</strong>
      {signedIn ? (
        <>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={path.startsWith(href) ? 'active' : ''}>{label}</Link>
          ))}
          <button className="link" onClick={logout}>Log out</button>
        </>
      ) : (
        <>
          <Link href="/login">Log in</Link>
          <Link href="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

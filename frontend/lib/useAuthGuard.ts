'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from './api';

// Redirects to /login when there is no token; returns true once the page may render.
export function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getToken()) router.replace('/login');
    else setReady(true);
  }, [router]);
  return ready;
}

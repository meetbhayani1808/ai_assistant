'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';
import { ErrorBox } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(accessToken);
      router.push('/responses');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth">
      <h1>Log in</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <ErrorBox error={error} />
        <button disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</button>
      </form>
      <p className="muted">Demo: demo@example.com / Demo@1234</p>
    </div>
  );
}

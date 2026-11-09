'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ErrorBox } from '@/components/ui';

export default function RegisterPage() {
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
      await api('/auth/register', { method: 'POST', body: { email, password } });
      router.push('/login');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth">
      <h1>Register</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password (min 8 characters)<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <ErrorBox error={error} />
        <button disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
      </form>
    </div>
  );
}

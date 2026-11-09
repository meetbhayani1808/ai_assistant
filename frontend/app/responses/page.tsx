'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { ErrorBox, Loading } from '@/components/ui';

interface Item { _id: string; prompt: string; response: string; type?: string; evaluated: boolean; sourceFile?: string }
interface Page { items: Item[]; total: number; page: number; limit: number }

export default function ResponsesPage() {
  const ready = useAuthGuard();
  const [data, setData] = useState<Page | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '10' });
      if (filter) q.set('evaluated', filter);
      setData(await api<Page>(`/responses?${q}`));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  async function remove(id: string) {
    if (!confirm('Delete this response and its evaluations?')) return;
    try {
      await api(`/responses/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err);
    }
  }

  if (!ready) return null;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  return (
    <>
      <h1>Responses</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <label>Status
          <select value={filter} onChange={(e) => { setPage(1); setFilter(e.target.value); }}>
            <option value="">All</option>
            <option value="false">Not evaluated</option>
            <option value="true">Evaluated</option>
          </select>
        </label>
        {data && <span className="muted">{data.total} total</span>}
      </div>
      <ErrorBox error={error} />
      {loading && <Loading />}
      {data && !loading && (
        data.items.length === 0 ? (
          <p className="muted">No responses yet. <Link href="/upload">Upload some</Link>.</p>
        ) : (
          <div className="card">
            <table>
              <thead><tr><th>Prompt</th><th>Response</th><th>Type</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r._id}>
                    <td>{r.prompt.slice(0, 80)}</td>
                    <td className="muted">{r.response.slice(0, 80)}</td>
                    <td>{r.type && <span className="badge">{r.type}</span>}</td>
                    <td><span className={`badge ${r.evaluated ? 'done' : ''}`}>{r.evaluated ? 'Evaluated' : 'Pending'}</span></td>
                    <td className="row">
                      <Link href={`/evaluate/${r._id}`}>Evaluate</Link>
                      <button className="link" style={{ color: '#dc2626', margin: 0 }} onClick={() => remove(r._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span>Page {page} of {pages}</span>
              <button className="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )
      )}
    </>
  );
}

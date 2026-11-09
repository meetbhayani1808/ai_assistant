'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { ErrorBox, Loading } from '@/components/ui';
import RubricForm, { Rubric } from '@/components/RubricForm';

export default function RubricsPage() {
  const ready = useAuthGuard();
  const [rubrics, setRubrics] = useState<Rubric[] | null>(null);
  const [editing, setEditing] = useState<Rubric | 'new' | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRubrics(await api<Rubric[]>('/rubrics'));
    } catch (err) {
      setError(err);
    }
  }, []);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  async function remove(r: Rubric) {
    if (!confirm(`Delete rubric "${r.name}"? Past evaluations keep their criterion names.`)) return;
    try {
      await api(`/rubrics/${r._id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err);
    }
  }

  if (!ready) return null;
  return (
    <>
      <h1>Rubrics</h1>
      <ErrorBox error={error} />
      {editing ? (
        <RubricForm
          rubric={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      ) : (
        <p><button onClick={() => setEditing('new')}>+ New rubric</button></p>
      )}
      {!rubrics && !error && <Loading />}
      {rubrics?.length === 0 && <p className="muted">No rubrics yet.</p>}
      {rubrics?.map((r) => (
        <div className="card" key={r._id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><strong>{r.name}</strong> <span className="muted">{r.description}</span></div>
            <div className="row">
              <button className="secondary" onClick={() => setEditing(r)}>Edit</button>
              <button className="danger" onClick={() => remove(r)}>Delete</button>
            </div>
          </div>
          <ul>
            {r.criteria.map((c) => (
              <li key={c._id}><strong>{c.name}</strong> ({c.minScore}–{c.maxScore}) <span className="muted">{c.description}</span></li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

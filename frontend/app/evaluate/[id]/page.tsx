'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { ErrorBox, Loading } from '@/components/ui';
import type { Rubric } from '@/components/RubricForm';

interface Evaluation { rubricId: string; scores: { criterionId: string; score: number; feedback?: string }[] }
type Entry = { score: string; feedback: string };

export default function EvaluatePage() {
  const ready = useAuthGuard();
  const { id } = useParams<{ id: string }>();
  const [response, setResponse] = useState<{ prompt: string; response: string; type?: string } | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [rubricId, setRubricId] = useState('');
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!ready) return;
    Promise.all([
      api(`/responses/${id}`),
      api<Rubric[]>('/rubrics'),
      api<Evaluation[]>(`/evaluations?responseId=${id}`),
    ])
      .then(([resp, rubs, evs]) => {
        setResponse(resp);
        setRubrics(rubs);
        setEvals(evs);
        if (rubs.length) setRubricId(evs[0]?.rubricId ?? rubs[0]._id);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [ready, id]);

  // Prefill the form with an existing evaluation for the selected rubric
  const rubric = rubrics.find((r) => r._id === rubricId);
  useEffect(() => {
    if (!rubric) return;
    const existing = evals.find((e) => e.rubricId === rubricId);
    const next: Record<string, Entry> = {};
    for (const c of rubric.criteria) {
      const s = existing?.scores.find((x) => x.criterionId === c._id);
      next[c._id!] = { score: s ? String(s.score) : '', feedback: s?.feedback ?? '' };
    }
    setEntries(next);
  }, [rubric, rubricId, evals]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rubric) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const scores = rubric.criteria.map((c) => ({
        criterionId: c._id,
        score: Number(entries[c._id!].score),
        ...(entries[c._id!].feedback ? { feedback: entries[c._id!].feedback } : {}),
      }));
      const saved = await api<Evaluation>('/evaluations', { method: 'POST', body: { responseId: id, rubricId, scores } });
      setEvals([...evals.filter((x) => x.rubricId !== rubricId), saved]);
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading) return <Loading />;
  if (!response) return <ErrorBox error={error ?? new Error('Response not found')} />;
  return (
    <>
      <p><Link href="/responses">← Back to responses</Link></p>
      <h1>Evaluate response</h1>
      <div className="grid2">
        <div className="card"><h3>Prompt</h3><pre className="text">{response.prompt}</pre></div>
        <div className="card"><h3>Response</h3><pre className="text">{response.response}</pre></div>
      </div>

      {rubrics.length === 0 ? (
        <p className="muted">Create a rubric first: <Link href="/rubrics">Rubrics</Link>.</p>
      ) : (
        <form className="card" onSubmit={submit}>
          <label style={{ maxWidth: 300 }}>Rubric
            <select value={rubricId} onChange={(e) => { setRubricId(e.target.value); setSaved(false); }}>
              {rubrics.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </label>
          {rubric?.criteria.map((c) => (
            <div key={c._id} style={{ marginTop: 16 }}>
              <strong>{c.name}</strong> <span className="muted">{c.description}</span>
              <div className="row" style={{ marginTop: 6 }}>
                <label>Score ({c.minScore}–{c.maxScore})
                  <input
                    type="number" required min={c.minScore} max={c.maxScore} style={{ width: 90 }}
                    value={entries[c._id!]?.score ?? ''}
                    onChange={(e) => setEntries({ ...entries, [c._id!]: { ...entries[c._id!], score: e.target.value } })}
                  />
                </label>
                <label style={{ flex: 1 }}>Feedback (optional)
                  <input
                    value={entries[c._id!]?.feedback ?? ''}
                    onChange={(e) => setEntries({ ...entries, [c._id!]: { ...entries[c._id!], feedback: e.target.value } })}
                  />
                </label>
              </div>
            </div>
          ))}
          <ErrorBox error={error} />
          {saved && <div className="success">Evaluation saved.</div>}
          <p><button disabled={saving}>{saving ? 'Saving…' : evals.some((e) => e.rubricId === rubricId) ? 'Update evaluation' : 'Save evaluation'}</button></p>
        </form>
      )}
    </>
  );
}

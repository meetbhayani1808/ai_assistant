'use client';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { ErrorBox } from './ui';

export interface Criterion { _id?: string; name: string; description: string; minScore: number; maxScore: number }
export interface Rubric { _id: string; name: string; description: string; criteria: Criterion[] }

const blank = (): Criterion => ({ name: '', description: '', minScore: 1, maxScore: 5 });

export default function RubricForm({ rubric, onSaved, onCancel }: { rubric?: Rubric; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(rubric?.name ?? '');
  const [description, setDescription] = useState(rubric?.description ?? '');
  const [criteria, setCriteria] = useState<Criterion[]>(rubric?.criteria ?? [blank()]);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<Criterion>) =>
    setCriteria(criteria.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { name, description, criteria: criteria.map(({ _id, ...c }) => (_id ? { _id, ...c } : c)) };
      await api(rubric ? `/rubrics/${rubric._id}` : '/rubrics', { method: rubric ? 'PATCH' : 'POST', body });
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>{rubric ? 'Edit rubric' : 'New rubric'}</h3>
      <div className="row">
        <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label style={{ flex: 1 }}>Description<input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      </div>
      <h4>Criteria</h4>
      {criteria.map((c, i) => (
        <div className="row" key={c._id ?? i} style={{ marginBottom: 8 }}>
          <label>Name<input required value={c.name} onChange={(e) => update(i, { name: e.target.value })} /></label>
          <label style={{ flex: 1 }}>Description<input value={c.description} onChange={(e) => update(i, { description: e.target.value })} /></label>
          <label>Min<input type="number" style={{ width: 70 }} value={c.minScore} onChange={(e) => update(i, { minScore: Number(e.target.value) })} /></label>
          <label>Max<input type="number" style={{ width: 70 }} value={c.maxScore} onChange={(e) => update(i, { maxScore: Number(e.target.value) })} /></label>
          <button type="button" className="danger" disabled={criteria.length === 1} onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}>Remove</button>
        </div>
      ))}
      <button type="button" className="secondary" onClick={() => setCriteria([...criteria, blank()])}>+ Add criterion</button>
      <ErrorBox error={error} />
      <div className="row" style={{ marginTop: 12 }}>
        <button disabled={saving}>{saving ? 'Saving…' : 'Save rubric'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

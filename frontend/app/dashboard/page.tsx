'use client';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { ErrorBox, Loading } from '@/components/ui';
import type { Rubric } from '@/components/RubricForm';

interface Analytics {
  evaluatedCount: number;
  averageByCriterion: { criterion: string; average: number; count: number }[];
  distribution: { criterion: string; scores: Record<string, number> }[];
  trend: { date: string; average: number; count: number }[];
}

const COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#2563eb'];

export default function DashboardPage() {
  const ready = useAuthGuard();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [rubricId, setRubricId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (ready) api<Rubric[]>('/rubrics').then(setRubrics).catch(setError);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    if (rubricId) q.set('rubricId', rubricId);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    setLoading(true);
    setError(null);
    api<Analytics>(`/analytics?${q}`).then(setData).catch(setError).finally(() => setLoading(false));
  }, [ready, rubricId, from, to]);

  if (!ready) return null;

  const scoreKeys = data?.distribution[0] ? Object.keys(data.distribution[0].scores) : [];
  const distRows = data?.distribution.map((d) => ({ criterion: d.criterion, ...d.scores })) ?? [];

  return (
    <>
      <h1>Analytics dashboard</h1>
      <div className="card row">
        <label>Rubric
          <select value={rubricId} onChange={(e) => setRubricId(e.target.value)}>
            <option value="">All rubrics</option>
            {rubrics.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </label>
        <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="secondary" onClick={() => { setRubricId(''); setFrom(''); setTo(''); }}>Reset</button>
      </div>
      <ErrorBox error={error} />
      {loading && <Loading />}
      {data && !loading && (
        data.evaluatedCount === 0 ? (
          <p className="muted">No evaluations match these filters.</p>
        ) : (
          <>
            <div className="card">
              <div className="muted">Evaluated responses</div>
              <div className="stat">{data.evaluatedCount}</div>
            </div>
            <div className="grid2">
              <div className="card">
                <h3>Average score per criterion</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.averageByCriterion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="criterion" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3>Score distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="criterion" interval={0} angle={-35} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {scoreKeys.map((k, i) => (
                      <Bar key={k} dataKey={k} name={`Score ${k}`} stackId="s" fill={COLORS[i % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h3>Average score trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )
      )}
    </>
  );
}

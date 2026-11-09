'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { uploadFile } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { ErrorBox } from '@/components/ui';

type Summary = Awaited<ReturnType<typeof uploadFile>>;

export default function UploadPage() {
  const ready = useAuthGuard();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setSummary(null);
    setProgress(0);
    setUploading(true);
    try {
      setSummary(await uploadFile(file, setProgress));
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
    }
  }

  if (!ready) return null;
  return (
    <>
      <h1>Upload transcripts</h1>
      <div className="card">
        <p className="muted">
          CSV with columns <code>prompt,response,type</code> (type optional) or a JSON array of{' '}
          <code>{'{ prompt, response, type? }'}</code>. Max 1 MB.
        </p>
        <form onSubmit={submit} className="row">
          <input type="file" accept=".csv,.json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button disabled={!file || uploading}>{uploading ? 'Uploading…' : 'Upload'}</button>
        </form>
        {uploading && <div className="progress"><div style={{ width: `${progress}%` }} /></div>}
        <ErrorBox error={error} />
      </div>

      {summary && (
        <div className="card">
          <div className={summary.imported ? 'success' : 'error'}>
            Imported {summary.imported} row(s), skipped {summary.skipped}.
          </div>
          {summary.errors.length > 0 && (
            <table>
              <thead><tr><th>Row</th><th>Reason</th></tr></thead>
              <tbody>
                {summary.errors.map((er) => (
                  <tr key={er.row}><td>{er.row}</td><td>{er.reason}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {summary.imported > 0 && <p><Link href="/responses">View responses →</Link></p>}
        </div>
      )}
    </>
  );
}

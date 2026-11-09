import { ApiError } from '@/lib/api';

export const Loading = ({ text = 'Loading…' }: { text?: string }) => <p className="muted">{text}</p>;

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as ApiError;
  return (
    <div className="error" role="alert">
      {e.message ?? 'Something went wrong'}
      {e.details && (
        <ul>
          {e.details.map((d, i) => (
            <li key={i}>{d.path ? `${d.path}: ` : ''}{d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

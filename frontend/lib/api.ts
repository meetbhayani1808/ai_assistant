const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const TOKEN_KEY = 'token';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: { path?: string; criterionId?: string; message: string }[]) {
    super(message);
  }
}

export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY));
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function handle401(status: number, isAuthCall: boolean) {
  if (status === 401 && !isAuthCall) {
    clearToken();
    window.location.href = '/login';
  }
}

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }
  const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register');
  handle401(res.status, isAuthCall);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`, data?.details);
  return data as T;
}

// XMLHttpRequest instead of fetch so we can report upload progress
export function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ imported: number; skipped: number; errors: { row: number; reason: string }[] }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/uploads`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, 'Cannot reach the server. Is the backend running?'));
    xhr.onload = () => {
      handle401(xhr.status, false);
      let data: any = null;
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, data?.message ?? `Upload failed (${xhr.status})`, data?.details));
    };
    xhr.send(form);
  });
}

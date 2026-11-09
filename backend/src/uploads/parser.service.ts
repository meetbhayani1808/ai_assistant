import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { badRequest } from '../utils/httpError.js';

export const MAX_ROWS = 1000;

const rowSchema = z.object({
  prompt: z.string().trim().min(1, 'prompt is empty or missing').max(20000, 'prompt too long'),
  response: z.string().trim().min(1, 'response is empty or missing').max(20000, 'response too long'),
  type: z.string().trim().max(50, 'type too long').optional(),
});

export interface ParsedRow {
  prompt: string;
  response: string;
  type?: string;
}
export interface UploadSummary {
  valid: ParsedRow[];
  errors: { row: number; reason: string }[];
}

function parseCsv(text: string): unknown[] {
  try {
    return parse(text, {
      columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (e: any) {
    throw badRequest(`Could not parse CSV: ${e.message}`);
  }
}

function parseJson(text: string): unknown[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw badRequest('Could not parse JSON: file is not valid JSON');
  }
  if (!Array.isArray(data)) throw badRequest('JSON root must be an array of { prompt, response, type? }');
  return data;
}

// Row numbers are 1-based positions of the data rows (header excluded for CSV).
export function parseTranscripts(format: 'csv' | 'json', buffer: Buffer): UploadSummary {
  const text = buffer.toString('utf8');
  const rows = format === 'csv' ? parseCsv(text) : parseJson(text);
  if (rows.length === 0) throw badRequest('File contains no rows');
  if (rows.length > MAX_ROWS) throw badRequest(`Too many rows (max ${MAX_ROWS})`);

  const valid: ParsedRow[] = [];
  const errors: UploadSummary['errors'] = [];
  rows.forEach((raw, i) => {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push({ row: i + 1, reason: 'Row is not an object' });
      return;
    }
    const r = raw as Record<string, unknown>;
    const parsed = rowSchema.safeParse({
      prompt: r.prompt,
      response: r.response,
      type: r.type === '' || r.type == null ? undefined : r.type,
    });
    if (parsed.success) valid.push(parsed.data);
    else errors.push({ row: i + 1, reason: parsed.error.issues.map((x) => x.message).join('; ') });
  });
  return { valid, errors };
}

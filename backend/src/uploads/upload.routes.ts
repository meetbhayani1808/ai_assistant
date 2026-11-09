import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { ResponseModel } from '../responses/response.model.js';
import { badRequest } from '../utils/httpError.js';
import { parseTranscripts } from './parser.service.js';

const ALLOWED: Record<string, { format: 'csv' | 'json'; mimes: string[] }> = {
  '.csv': { format: 'csv', mimes: ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream'] },
  '.json': { format: 'json', mimes: ['application/json', 'text/json', 'text/plain', 'application/octet-stream'] },
};

// Memory storage: nothing is ever written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const rule = ALLOWED[path.extname(file.originalname).toLowerCase()];
    if (!rule) return cb(badRequest('Only .csv and .json files are allowed'));
    if (!rule.mimes.includes(file.mimetype)) return cb(badRequest(`Unexpected content type: ${file.mimetype}`));
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) throw badRequest('No file uploaded (use multipart field "file")');
  const ext = path.extname(req.file.originalname).toLowerCase();
  const { valid, errors } = parseTranscripts(ALLOWED[ext].format, req.file.buffer);

  // Strip any path components from the stored name
  const sourceFile = path.basename(req.file.originalname).slice(0, 200);
  if (valid.length) {
    await ResponseModel.insertMany(valid.map((r) => ({ ...r, userId: req.userId, sourceFile })));
  }
  res.status(valid.length ? 201 : 200).json({ imported: valid.length, skipped: errors.length, errors });
});

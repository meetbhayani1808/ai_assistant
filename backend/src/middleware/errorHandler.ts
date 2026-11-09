import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

// Central place that maps every error type to { statusCode, message, details? }
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof HttpError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 1 MB)' : err.message;
  } else if (err?.code === 11000) {
    status = 409;
    message = 'Duplicate value';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ statusCode: status, message, ...(details ? { details } : {}) });
}

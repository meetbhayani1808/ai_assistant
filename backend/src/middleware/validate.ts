import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { isValidObjectId } from 'mongoose';
import { badRequest } from '../utils/httpError.js';

// Validates and replaces req.body / req.query with the parsed (typed, stripped) value.
export const validate =
  (schema: ZodType, source: 'body' | 'query' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      throw badRequest(
        'Validation failed',
        result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      );
    }
    // req.query is a getter in Express 5, so store parsed data separately
    if (source === 'body') req.body = result.data;
    else req.parsedQuery = result.data;
    next();
  };

export const validateObjectId =
  (...params: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    for (const p of params) {
      if (!isValidObjectId(req.params[p])) throw badRequest(`Invalid id: ${p}`);
    }
    next();
  };

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { unauthorized } from '../utils/httpError.js';

// Verifies the Bearer token and exposes the user id as req.userId.
// This is the ONLY source of userId used by the rest of the API.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as jwt.JwtPayload;
    if (!payload.sub) throw new Error('no sub');
    req.userId = payload.sub;
    next();
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

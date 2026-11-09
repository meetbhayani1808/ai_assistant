import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../users/user.model.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { conflict, notFound, unauthorized } from '../utils/httpError.js';
import { credentialsSchema } from './auth.schemas.js';

// Public router: register + login (mounted WITHOUT requireAuth)
export const authPublicRouter = Router();
// Protected router: /auth/me
export const authProtectedRouter = Router();

authPublicRouter.post('/register', validate(credentialsSchema), async (req, res) => {
  const { email, password } = req.body;
  if (await User.exists({ email })) throw conflict('Email already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  res.status(201).json({ id: user.id, email: user.email });
});

authPublicRouter.post('/login', validate(credentialsSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  // Same message for unknown email and wrong password (no user enumeration)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized('Invalid email or password');
  }
  const accessToken = jwt.sign({ sub: user.id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
  res.json({ accessToken, user: { id: user.id, email: user.email } });
});

authProtectedRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('email createdAt');
  if (!user) throw notFound('User not found');
  res.json({ id: user.id, email: user.email, createdAt: user.createdAt });
});

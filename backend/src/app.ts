import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authProtectedRouter, authPublicRouter } from './auth/auth.routes.js';
import { uploadRouter } from './uploads/upload.routes.js';
import { responseRouter } from './responses/response.routes.js';
import { rubricRouter } from './rubrics/rubric.routes.js';
import { evaluationRouter } from './evaluations/evaluation.routes.js';
import { analyticsRouter } from './analytics/analytics.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '100kb' }));

// Public: register + login only
app.use('/api/auth', authPublicRouter);

// Everything below requires a valid JWT; userId comes from the token only
app.use('/api', requireAuth);
app.use('/api/auth', authProtectedRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/responses', responseRouter);
app.use('/api/rubrics', rubricRouter);
app.use('/api/evaluations', evaluationRouter);
app.use('/api/analytics', analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

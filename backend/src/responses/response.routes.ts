import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { ResponseModel } from './response.model.js';
import { Evaluation } from '../evaluations/evaluation.model.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { notFound } from '../utils/httpError.js';

export const responseRouter = Router();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  evaluated: z.enum(['true', 'false']).optional(),
  type: z.string().trim().max(50).optional(),
});

responseRouter.get('/', validate(listQuery, 'query'), async (req, res) => {
  const { page, limit, evaluated, type } = req.parsedQuery;
  const userId = new Types.ObjectId(req.userId);
  const filter: any = { userId };
  if (type) filter.type = type;

  if (evaluated) {
    const ids = await Evaluation.distinct('responseId', { userId });
    filter._id = evaluated === 'true' ? { $in: ids } : { $nin: ids };
  }

  const [items, total, evaluatedIds] = await Promise.all([
    ResponseModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ResponseModel.countDocuments(filter),
    Evaluation.distinct('responseId', { userId }),
  ]);
  const done = new Set(evaluatedIds.map(String));
  res.json({
    items: items.map((r) => ({ ...r, evaluated: done.has(String(r._id)) })),
    total,
    page,
    limit,
  });
});

responseRouter.get('/:id', validateObjectId('id'), async (req, res) => {
  const doc = await ResponseModel.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) throw notFound('Response not found');
  res.json(doc);
});

responseRouter.delete('/:id', validateObjectId('id'), async (req, res) => {
  const doc = await ResponseModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!doc) throw notFound('Response not found');
  await Evaluation.deleteMany({ responseId: doc._id, userId: req.userId });
  res.status(204).end();
});

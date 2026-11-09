import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Evaluation } from '../evaluations/evaluation.model.js';
import { ResponseModel } from '../responses/response.model.js';
import { validate } from '../middleware/validate.js';
import { dateRangeQuery } from '../utils/dateRange.js';

export const analyticsRouter = Router();

const query = z
  .object({
    rubricId: z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id').optional(),
    type: z.string().trim().max(50).optional(),
  })
  .merge(dateRangeQuery);

const round = (n: number) => Math.round(n * 100) / 100;

analyticsRouter.get('/', validate(query, 'query'), async (req, res) => {
  const { rubricId, type, from, to } = req.parsedQuery;
  const userId = new Types.ObjectId(req.userId);

  const match: any = { userId };
  if (rubricId) match.rubricId = new Types.ObjectId(rubricId);
  if (from || to) match.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (type) match.responseId = { $in: await ResponseModel.distinct('_id', { userId, type }) };

  const [result] = await Evaluation.aggregate([
    { $match: match },
    {
      $facet: {
        evaluatedCount: [{ $group: { _id: '$responseId' } }, { $count: 'n' }],
        averageByCriterion: [
          { $unwind: '$scores' },
          { $group: { _id: '$scores.criterionName', average: { $avg: '$scores.score' }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        distribution: [
          { $unwind: '$scores' },
          { $group: { _id: { c: '$scores.criterionName', s: '$scores.score' }, count: { $sum: 1 } } },
        ],
        trend: [
          { $addFields: { evalAvg: { $avg: '$scores.score' } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              average: { $avg: '$evalAvg' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  // Reshape distribution into { criterion, scores: { 1: n, ..., 5: n } }
  const maxSeen = Math.max(5, ...result.distribution.map((d: any) => d._id.s));
  const dist = new Map<string, Record<string, number>>();
  for (const d of result.distribution) {
    if (!dist.has(d._id.c)) {
      dist.set(d._id.c, Object.fromEntries(Array.from({ length: maxSeen }, (_, i) => [String(i + 1), 0])));
    }
    dist.get(d._id.c)![String(d._id.s)] = d.count;
  }

  res.json({
    evaluatedCount: result.evaluatedCount[0]?.n ?? 0,
    averageByCriterion: result.averageByCriterion.map((a: any) => ({
      criterion: a._id,
      average: round(a.average),
      count: a.count,
    })),
    distribution: [...dist.entries()].sort().map(([criterion, scores]) => ({ criterion, scores })),
    trend: result.trend.map((t: any) => ({ date: t._id, average: round(t.average), count: t.count })),
  });
});

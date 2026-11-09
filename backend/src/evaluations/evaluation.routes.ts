import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Evaluation } from './evaluation.model.js';
import { ResponseModel } from '../responses/response.model.js';
import { Rubric } from '../rubrics/rubric.model.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { dateRangeQuery } from '../utils/dateRange.js';

export const evaluationRouter = Router();

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id');

const createSchema = z
  .object({
    responseId: objectId,
    rubricId: objectId,
    scores: z
      .array(
        z
          .object({
            criterionId: objectId,
            score: z.number().int(),
            feedback: z.string().trim().max(1000).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

evaluationRouter.post('/', validate(createSchema), async (req, res) => {
  const { responseId, rubricId, scores } = req.body;
  const userId = req.userId;

  // Ownership checks: both must belong to the signed-in user
  const [response, rubric] = await Promise.all([
    ResponseModel.exists({ _id: responseId, userId }),
    Rubric.findOne({ _id: rubricId, userId }),
  ]);
  if (!response) throw notFound('Response not found');
  if (!rubric) throw notFound('Rubric not found');

  const byId = new Map(rubric.criteria.map((c) => [String(c._id), c]));
  const seen = new Set<string>();
  const errors: { criterionId: string; message: string }[] = [];
  const snapshot = scores.map((s: any) => {
    const c = byId.get(s.criterionId);
    if (!c) {
      errors.push({ criterionId: s.criterionId, message: 'Unknown criterion for this rubric' });
      return null;
    }
    if (seen.has(s.criterionId)) errors.push({ criterionId: s.criterionId, message: 'Criterion scored twice' });
    seen.add(s.criterionId);
    if (s.score < c.minScore! || s.score > c.maxScore!) {
      errors.push({ criterionId: s.criterionId, message: `Score for "${c.name}" must be between ${c.minScore} and ${c.maxScore}` });
    }
    return { criterionId: c._id, criterionName: c.name, score: s.score, feedback: s.feedback || undefined };
  });
  for (const [id, c] of byId) {
    if (!seen.has(id)) errors.push({ criterionId: id, message: `Criterion "${c.name}" is not scored` });
  }
  if (errors.length) throw badRequest('Invalid scores', errors);

  // Upsert: resubmitting for the same (user, response, rubric) updates the evaluation
  const evaluation = await Evaluation.findOneAndUpdate(
    { userId, responseId, rubricId },
    { $set: { scores: snapshot } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  res.status(200).json(evaluation);
});

const listQuery = z
  .object({
    rubricId: objectId.optional(),
    responseId: objectId.optional(),
  })
  .merge(dateRangeQuery);

evaluationRouter.get('/', validate(listQuery, 'query'), async (req, res) => {
  const { rubricId, responseId, from, to } = req.parsedQuery;
  const filter: any = { userId: new Types.ObjectId(req.userId) };
  if (rubricId) filter.rubricId = new Types.ObjectId(rubricId);
  if (responseId) filter.responseId = new Types.ObjectId(responseId);
  if (from || to) filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  res.json(await Evaluation.find(filter).sort({ createdAt: -1 }).limit(500));
});

evaluationRouter.get('/:id', validateObjectId('id'), async (req, res) => {
  const doc = await Evaluation.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) throw notFound('Evaluation not found');
  res.json(doc);
});

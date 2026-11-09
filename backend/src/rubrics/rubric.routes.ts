import { Router } from 'express';
import { Types } from 'mongoose';
import { Rubric } from './rubric.model.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createRubricSchema, updateRubricSchema } from './rubric.schemas.js';
import { notFound } from '../utils/httpError.js';

export const rubricRouter = Router();

// Existing criteria keep their _id (so past evaluations stay linked); new ones get a fresh id.
function withIds(criteria: any[]) {
  return criteria.map((c) => ({
    ...c,
    _id: c._id && Types.ObjectId.isValid(c._id) ? c._id : new Types.ObjectId(),
  }));
}

rubricRouter.post('/', validate(createRubricSchema), async (req, res) => {
  const rubric = await Rubric.create({
    ...req.body,
    criteria: withIds(req.body.criteria),
    userId: req.userId,
  });
  res.status(201).json(rubric);
});

rubricRouter.get('/', async (req, res) => {
  res.json(await Rubric.find({ userId: req.userId }).sort({ createdAt: -1 }));
});

rubricRouter.get('/:id', validateObjectId('id'), async (req, res) => {
  const rubric = await Rubric.findOne({ _id: req.params.id, userId: req.userId });
  if (!rubric) throw notFound('Rubric not found');
  res.json(rubric);
});

rubricRouter.patch('/:id', validateObjectId('id'), validate(updateRubricSchema), async (req, res) => {
  const update: any = { ...req.body };
  if (update.criteria) update.criteria = withIds(update.criteria);
  const rubric = await Rubric.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!rubric) throw notFound('Rubric not found');
  res.json(rubric);
});

rubricRouter.delete('/:id', validateObjectId('id'), async (req, res) => {
  const rubric = await Rubric.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!rubric) throw notFound('Rubric not found');
  res.status(204).end();
});

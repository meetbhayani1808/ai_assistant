import { Schema, model } from 'mongoose';

const criterionSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  minScore: { type: Number, default: 1 },
  maxScore: { type: Number, default: 5 },
});

const rubricSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    criteria: { type: [criterionSchema], default: [] },
  },
  { timestamps: true },
);

export const Rubric = model('Rubric', rubricSchema);

import { Schema, model } from 'mongoose';

const scoreSchema = new Schema(
  {
    criterionId: { type: Schema.Types.ObjectId, required: true },
    // Snapshot so analytics survive rubric edits/deletes
    criterionName: { type: String, required: true },
    score: { type: Number, required: true },
    feedback: { type: String },
  },
  { _id: false },
);

const evaluationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    responseId: { type: Schema.Types.ObjectId, ref: 'Response', required: true },
    rubricId: { type: Schema.Types.ObjectId, ref: 'Rubric', required: true },
    scores: { type: [scoreSchema], default: [] },
  },
  { timestamps: true },
);

// Re-submitting the same (user, response, rubric) updates instead of duplicating
evaluationSchema.index({ userId: 1, responseId: 1, rubricId: 1 }, { unique: true });
evaluationSchema.index({ userId: 1, rubricId: 1, createdAt: 1 });

export const Evaluation = model('Evaluation', evaluationSchema);

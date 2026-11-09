import { Schema, model } from 'mongoose';

const responseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  type: { type: String },
  sourceFile: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const ResponseModel = model('Response', responseSchema);

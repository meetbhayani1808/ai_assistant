import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config.js';
import { ensureDemoUser } from './seed/demo.js';

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  if (config.autoSeed) await ensureDemoUser();
  app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}/api`));
}

main().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});

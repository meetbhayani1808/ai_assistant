import mongoose from 'mongoose';
import { config } from '../config.js';
import { DEMO_EMAIL, DEMO_PASSWORD, seedDemoUser } from './demo.js';

async function main() {
  await mongoose.connect(config.mongoUri);
  const r = await seedDemoUser();
  console.log(`Seeded ${DEMO_EMAIL} / ${DEMO_PASSWORD}: ${r.responses} responses, ${r.rubrics} rubrics, ${r.evaluations} evaluations`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

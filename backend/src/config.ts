import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  autoSeed: process.env.AUTO_SEED !== 'false', // seed the demo user on first start
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
};

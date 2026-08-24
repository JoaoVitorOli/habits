import type { Config } from 'drizzle-kit';

export default {
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/data/schema.ts',
  out: './src/data/migrations',
} satisfies Config;

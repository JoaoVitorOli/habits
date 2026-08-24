import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from '@/data/schema';

const sqlite = openDatabaseSync('habits.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

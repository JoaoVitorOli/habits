import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Espelha o Postgres do Supabase 1:1. `updated_at` e `deleted_at` nascem aqui, na fatia 1,
 * mesmo que o sync so chegue na fatia 9: assim sync nao exige migration, so codigo novo.
 */
export const habits = sqliteTable(
  'habits',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    scheduleKind: text('schedule_kind').notNull(),
    scheduleDays: integer('schedule_days'),
    scheduleTimes: integer('schedule_times'),
    targetPerDay: integer('target_per_day').notNull().default(1),
    streakGoal: integer('streak_goal'),
    reminderTime: text('reminder_time'),
    position: integer('position').notNull(),
    archivedAt: text('archived_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [index('habits_updated_at_idx').on(table.updatedAt)],
);

export const completions = sqliteTable(
  'completions',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id').notNull(),
    day: text('day').notNull(),
    count: integer('count').notNull().default(0),
    completedAt: text('completed_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    uniqueIndex('completions_habit_day_idx').on(table.habitId, table.day),
    index('completions_updated_at_idx').on(table.updatedAt),
  ],
);

export const dayNotes = sqliteTable(
  'day_notes',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id').notNull(),
    day: text('day').notNull(),
    text: text('text').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [uniqueIndex('day_notes_habit_day_idx').on(table.habitId, table.day)],
);

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  dayStartHour: integer('day_start_hour').notNull().default(4),
  weekStartsOn: integer('week_starts_on').notNull().default(0),
  homeView: text('home_view').notNull().default('grid'),
  updatedAt: text('updated_at').notNull(),
});

/** Local, nunca sincroniza. */
export const syncState = sqliteTable('sync_state', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  lastPulledAt: text('last_pulled_at'),
  lastPushedAt: text('last_pushed_at'),
});

export type HabitRow = typeof habits.$inferSelect;
export type NewHabitRow = typeof habits.$inferInsert;

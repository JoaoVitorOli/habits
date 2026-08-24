CREATE TABLE `completions` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`day` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`completed_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `completions_habit_day_idx` ON `completions` (`habit_id`,`day`);--> statement-breakpoint
CREATE INDEX `completions_updated_at_idx` ON `completions` (`updated_at`);--> statement-breakpoint
CREATE TABLE `day_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`day` text NOT NULL,
	`text` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_notes_habit_day_idx` ON `day_notes` (`habit_id`,`day`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`description` text,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`schedule_kind` text NOT NULL,
	`schedule_days` integer,
	`schedule_times` integer,
	`target_per_day` integer DEFAULT 1 NOT NULL,
	`streak_goal` integer,
	`reminder_time` text,
	`position` integer NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `habits_updated_at_idx` ON `habits` (`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`day_start_hour` integer DEFAULT 4 NOT NULL,
	`week_starts_on` integer DEFAULT 0 NOT NULL,
	`home_view` text DEFAULT 'grid' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`last_pulled_at` text,
	`last_pushed_at` text
);

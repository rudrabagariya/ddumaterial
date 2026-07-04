CREATE TABLE `donations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`material_name` text NOT NULL,
	`drive_link` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `search_queries` (
	`id` text PRIMARY KEY NOT NULL,
	`query` text NOT NULL,
	`user_id` text,
	`timestamp` integer NOT NULL
);

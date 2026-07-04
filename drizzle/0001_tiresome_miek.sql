CREATE TABLE `starred_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`file_id` text NOT NULL,
	`starred_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

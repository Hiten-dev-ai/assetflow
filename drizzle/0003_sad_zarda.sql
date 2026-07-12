CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transfer_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`allocation_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`from_employee_id` integer NOT NULL,
	`to_employee_id` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'REQUESTED' NOT NULL,
	`requested_at` integer NOT NULL,
	`decided_at` integer,
	`decided_by` integer,
	FOREIGN KEY (`allocation_id`) REFERENCES `allocations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` integer NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `kind` text;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `title` text;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `description` text;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `target` text;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `severity` text;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD `status` text;--> statement-breakpoint
ALTER TABLE `allocations` ADD `requested_to_employee_id` integer REFERENCES employees(id);--> statement-breakpoint
ALTER TABLE `allocations` ADD `reason` text;--> statement-breakpoint
ALTER TABLE `allocations` ADD `condition_out` text;--> statement-breakpoint
ALTER TABLE `allocations` ADD `condition_in` text;--> statement-breakpoint
ALTER TABLE `allocations` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `asset_categories` ADD `code` text;--> statement-breakpoint
ALTER TABLE `asset_categories` ADD `description` text;--> statement-breakpoint
ALTER TABLE `asset_categories` ADD `useful_life` text;--> statement-breakpoint
ALTER TABLE `asset_categories` ADD `requires_serial` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `asset_categories` ADD `track_warranty` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `departments` ADD `code` text;--> statement-breakpoint
ALTER TABLE `departments` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `employee_id` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `job_title` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `location` text;--> statement-breakpoint
ALTER TABLE `maintenance_requests` ADD `attachment_name` text;
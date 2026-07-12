ALTER TABLE `maintenance_requests` ADD COLUMN `updated_at` integer;
--> statement-breakpoint
CREATE INDEX `maintenance_requests_status_idx` ON `maintenance_requests` (`status`);
--> statement-breakpoint
CREATE INDEX `maintenance_requests_asset_status_idx` ON `maintenance_requests` (`asset_id`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `maintenance_active_asset_unique` ON `maintenance_requests` (`asset_id`) WHERE `status` IN ('APPROVED','TECHNICIAN_ASSIGNED','IN_PROGRESS');
--> statement-breakpoint
CREATE TABLE `maintenance_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` integer NOT NULL,
	`technician_id` text NOT NULL,
	`technician_name` text NOT NULL,
	`assigned_by` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`estimated_completion_at` integer,
	FOREIGN KEY (`request_id`) REFERENCES `maintenance_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `maintenance_assignments_request_idx` ON `maintenance_assignments` (`request_id`);
--> statement-breakpoint
CREATE INDEX `maintenance_assignments_technician_idx` ON `maintenance_assignments` (`technician_id`);
--> statement-breakpoint
CREATE TABLE `maintenance_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` integer NOT NULL,
	`asset_id` integer NOT NULL,
	`actor_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`notes` text,
	`cost` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `maintenance_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `maintenance_logs_request_idx` ON `maintenance_logs` (`request_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `maintenance_logs_asset_idx` ON `maintenance_logs` (`asset_id`,`created_at`);

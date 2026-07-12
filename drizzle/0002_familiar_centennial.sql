CREATE TABLE `audit_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_cycle_id` text NOT NULL,
	`employee_id` text NOT NULL,
	FOREIGN KEY (`audit_cycle_id`) REFERENCES `audit_cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_assignments_cycle_idx` ON `audit_assignments` (`audit_cycle_id`);--> statement-breakpoint
CREATE TABLE `audit_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text,
	`location_id` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`started_at` integer NOT NULL,
	`closed_at` integer,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_cycles_scope_status_idx` ON `audit_cycles` (`department_id`,`location_id`,`status`);--> statement-breakpoint
CREATE TABLE `audit_items` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_cycle_id` text NOT NULL,
	`asset_id` integer NOT NULL,
	`expected_location` text NOT NULL,
	`verification_status` text DEFAULT 'PENDING' NOT NULL,
	`verified_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`audit_cycle_id`) REFERENCES `audit_cycles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_items_cycle_status_idx` ON `audit_items` (`audit_cycle_id`,`verification_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `audit_items_cycle_asset_unique` ON `audit_items` (`audit_cycle_id`,`asset_id`);--> statement-breakpoint
CREATE INDEX `asset_profiles_department_idx` ON `asset_profiles` (`department`);--> statement-breakpoint
CREATE INDEX `assets_location_idx` ON `assets` (`location`);
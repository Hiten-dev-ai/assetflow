ALTER TABLE `audit_cycles` ADD COLUMN `start_date` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `audit_cycles` ADD COLUMN `end_date` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `audit_cycles` SET `start_date` = `started_at`, `end_date` = `started_at` + 2592000000 WHERE `end_date` = 0;
--> statement-breakpoint
ALTER TABLE `audit_cycles` ADD COLUMN `extension_granted_at` integer;
--> statement-breakpoint
ALTER TABLE `audit_cycles` ADD COLUMN `extension_granted_by` text;
--> statement-breakpoint
CREATE TABLE `discrepancy_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`audit_cycle_id` text NOT NULL,
	`generated_by` text NOT NULL,
	`generated_at` integer NOT NULL,
	`missing_count` integer NOT NULL,
	`damaged_count` integer NOT NULL,
	`items_snapshot` text NOT NULL,
	`resolution_actions` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`audit_cycle_id`) REFERENCES `audit_cycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discrepancy_reports_cycle_unique` ON `discrepancy_reports` (`audit_cycle_id`);
--> statement-breakpoint
CREATE INDEX `discrepancy_reports_generated_idx` ON `discrepancy_reports` (`generated_at`);

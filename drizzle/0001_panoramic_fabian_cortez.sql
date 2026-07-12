CREATE TABLE `asset_profiles` (
	`asset_id` integer PRIMARY KEY NOT NULL,
	`department` text NOT NULL,
	`qr_code` text NOT NULL,
	`notes` text NOT NULL,
	`last_updated` text NOT NULL,
	`recent_activity` text NOT NULL,
	`allocation_history` text DEFAULT '[]' NOT NULL,
	`maintenance_history` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);

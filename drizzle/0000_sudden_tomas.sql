CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`image` text NOT NULL,
	`description` text NOT NULL,
	`rating` real DEFAULT 4.5 NOT NULL,
	`popular` integer DEFAULT false NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`image` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`extras_json` text DEFAULT '[]' NOT NULL,
	`line_total` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_user_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`total` integer NOT NULL,
	`payment` text NOT NULL,
	`pickup_time` text NOT NULL,
	`pickup_code` text NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`reject_reason` text,
	`ordered_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_user_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`staff` text NOT NULL,
	`order_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`program` text DEFAULT 'Bahria University Student' NOT NULL,
	`wallet_balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_customer_id_unique` ON `users` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE TABLE `adminSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`type` enum('info','warning','success') NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`startAt` timestamp,
	`endAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`avatar` text,
	`description` text,
	`systemPrompt` text,
	`model` varchar(64),
	`provider` varchar(64),
	`temperature` float DEFAULT 0.7,
	`maxTokens` int DEFAULT 2048,
	`tags` json,
	`isPublic` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`likeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`income` float,
	`tags` json,
	`likeCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assistantId` int,
	`title` varchar(256),
	`model` varchar(64),
	`provider` varchar(64),
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mcpServers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`endpoint` text,
	`transport` varchar(32) NOT NULL DEFAULT 'stdio',
	`enabled` boolean NOT NULL DEFAULT true,
	`status` enum('online','offline','error') NOT NULL DEFAULT 'offline',
	`toolsCount` int NOT NULL DEFAULT 0,
	`callsCount` int NOT NULL DEFAULT 0,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mcpServers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`tokensUsed` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modelProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerKey` varchar(64) NOT NULL,
	`providerName` varchar(128) NOT NULL,
	`isFree` boolean NOT NULL DEFAULT false,
	`enabled` boolean NOT NULL DEFAULT true,
	`apiKey` text,
	`baseUrl` text,
	`models` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modelProviders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentEscrow` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskOrderId` int NOT NULL,
	`payerId` int NOT NULL,
	`payeeId` int NOT NULL,
	`amount` float NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'CNY',
	`paymentMethod` varchar(64),
	`status` enum('pending','held','released','disputed','refunded') NOT NULL DEFAULT 'pending',
	`platformFeePercent` float DEFAULT 5,
	`platformFeeCents` int DEFAULT 0,
	`payeeAmountCents` int DEFAULT 0,
	`heldAt` timestamp,
	`releasedAt` timestamp,
	`disputeReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentEscrow_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`icon` text,
	`author` varchar(128),
	`isBuiltin` boolean NOT NULL DEFAULT false,
	`downloadCount` int NOT NULL DEFAULT 0,
	`rating` float DEFAULT 0,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publisherId` int NOT NULL,
	`takerId` int,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`budget` float,
	`currency` varchar(8) NOT NULL DEFAULT 'CNY',
	`deadline` timestamp,
	`status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`requiredSkills` json,
	`attachments` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userIncomePlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`strategy` json,
	`expectedIncome` float,
	`timeline` text,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userIncomePlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillId` int NOT NULL,
	`installedAt` timestamp NOT NULL DEFAULT (now()),
	`config` json,
	CONSTRAINT `userSkills_id` PRIMARY KEY(`id`)
);

CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentKey` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`role` varchar(128) NOT NULL,
	`layer` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`status` enum('online','busy','offline') NOT NULL DEFAULT 'online',
	`tasksCompleted` int NOT NULL DEFAULT 0,
	`skillsEnabled` json,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bugReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`category` varchar(64) NOT NULL,
	`file` text NOT NULL,
	`line` int,
	`description` text NOT NULL,
	`suggestion` text,
	`status` enum('open','fixing','fixed','dismissed') NOT NULL DEFAULT 'open',
	`fixProposalId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bugReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buildLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buildId` int NOT NULL,
	`level` enum('info','warn','error','step','success') NOT NULL DEFAULT 'info',
	`agentName` varchar(64),
	`message` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buildLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `builds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`status` enum('pending','running','success','failed','cancelled') NOT NULL DEFAULT 'pending',
	`agentsUsed` json,
	`outputFiles` json,
	`githubPrUrl` text,
	`durationMs` int,
	`tokensUsed` int,
	`costCents` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `builds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('subscription','compute_share','bazaar','referral','trading') NOT NULL,
	`amountCents` int NOT NULL,
	`description` text,
	`status` enum('pending','confirmed','withdrawn') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evolutionCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('idle','collecting','training','evaluating','ab_testing','deploying','completed','failed') NOT NULL DEFAULT 'idle',
	`feedbackCount` int NOT NULL DEFAULT 0,
	`qualitySamples` int NOT NULL DEFAULT 0,
	`loraVersion` varchar(64),
	`evalScore` float,
	`baselineScore` float,
	`abTestTraffic` int DEFAULT 10,
	`triggerThreshold` int NOT NULL DEFAULT 1000,
	`autoRollback` boolean NOT NULL DEFAULT true,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evolutionCycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fixProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bugReportId` int NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`diff` text,
	`branchName` varchar(128),
	`prUrl` text,
	`status` enum('pending','approved','merged','rejected') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moeConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`modelKey` varchar(64) NOT NULL,
	`modelName` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`taskTypes` json,
	`priority` int NOT NULL DEFAULT 0,
	`costPerMToken` float DEFAULT 0,
	`maxContextWindow` int DEFAULT 128000,
	`apiEndpoint` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moeConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`slug` varchar(128) NOT NULL,
	`status` enum('active','archived','building') NOT NULL DEFAULT 'active',
	`buildCount` int NOT NULL DEFAULT 0,
	`knowledgeBaseSize` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','pro','team','enterprise') NOT NULL DEFAULT 'free',
	`buildsUsed` int NOT NULL DEFAULT 0,
	`buildsLimit` int NOT NULL DEFAULT 2,
	`renewsAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','pro','team','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locale` varchar(8) DEFAULT 'zh' NOT NULL;
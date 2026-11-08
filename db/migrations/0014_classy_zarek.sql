ALTER TABLE "player_quests" ADD COLUMN "paid_coins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Ramen Yuzu's jobs paid once a day before: a job paid on the day this runs counts as paid its
-- first step, so that a replay that day only tops it up.
UPDATE "player_quests" SET "paid_coins" = 120 WHERE "quest_id" LIKE 'ramen-%' AND "completed_on" IS NOT NULL;

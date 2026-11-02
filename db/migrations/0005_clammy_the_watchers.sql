CREATE TABLE "player_quests" (
	"user_id" text NOT NULL,
	"quest_id" text NOT NULL,
	"started_at" timestamp with time zone,
	"completed_on" text,
	CONSTRAINT "player_quests_user_id_quest_id_pk" PRIMARY KEY("user_id","quest_id")
);
--> statement-breakpoint
ALTER TABLE "player_quests" ADD CONSTRAINT "player_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
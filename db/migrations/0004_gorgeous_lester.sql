CREATE TABLE "player_binders" (
	"user_id" text NOT NULL,
	"set_id" text NOT NULL,
	CONSTRAINT "player_binders_user_id_set_id_pk" PRIMARY KEY("user_id","set_id")
);
--> statement-breakpoint
ALTER TABLE "player_binders" ADD CONSTRAINT "player_binders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_binders" ADD CONSTRAINT "player_binders_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Players who already have cards or boosters of a set keep their access to it.
INSERT INTO "player_binders" ("user_id", "set_id")
SELECT "user_id", "set_id" FROM "player_boosters" WHERE "count" > 0
UNION
SELECT DISTINCT pc."user_id", c."set_id" FROM "player_cards" pc JOIN "cards" c ON c."id" = pc."card_id"
ON CONFLICT DO NOTHING;

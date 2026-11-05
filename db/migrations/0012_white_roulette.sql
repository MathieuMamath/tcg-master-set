CREATE TABLE "player_clocks" (
	"user_id" text PRIMARY KEY NOT NULL,
	"offset" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_clocks_offset_within_a_day" CHECK ("player_clocks"."offset" between 0 and 1439)
);
--> statement-breakpoint
ALTER TABLE "player_clocks" ADD CONSTRAINT "player_clocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
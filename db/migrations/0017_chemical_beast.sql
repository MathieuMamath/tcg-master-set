CREATE TABLE "player_avatars" (
	"user_id" text PRIMARY KEY NOT NULL,
	"species" text DEFAULT 'fox' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_avatars" ADD CONSTRAINT "player_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
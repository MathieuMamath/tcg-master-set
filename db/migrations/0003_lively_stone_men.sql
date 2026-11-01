CREATE TABLE "player_spots" (
	"user_id" text PRIMARY KEY NOT NULL,
	"place" text NOT NULL,
	"x" double precision NOT NULL,
	"z" double precision NOT NULL,
	"heading" double precision NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_spots" ADD CONSTRAINT "player_spots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
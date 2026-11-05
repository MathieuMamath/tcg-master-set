CREATE TABLE "player_roles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_roles_role_check" CHECK ("player_roles"."role" in ('admin'))
);
--> statement-breakpoint
ALTER TABLE "player_roles" ADD CONSTRAINT "player_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
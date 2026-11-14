CREATE TABLE "player_items" (
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"bought_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_items_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "player_avatars" ADD COLUMN "scarf" text DEFAULT 'blueStripes';--> statement-breakpoint
ALTER TABLE "player_avatars" ADD COLUMN "hat" text;--> statement-breakpoint
ALTER TABLE "player_avatars" ADD COLUMN "gear" text DEFAULT 'satchel';--> statement-breakpoint
ALTER TABLE "player_items" ADD CONSTRAINT "player_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
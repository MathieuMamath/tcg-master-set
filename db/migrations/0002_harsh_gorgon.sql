CREATE TABLE "player_boosters" (
	"user_id" text NOT NULL,
	"set_id" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "player_boosters_user_id_set_id_pk" PRIMARY KEY("user_id","set_id"),
	CONSTRAINT "player_boosters_count_not_negative" CHECK ("player_boosters"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "player_cards" (
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"variant" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "player_cards_user_id_card_id_variant_pk" PRIMARY KEY("user_id","card_id","variant"),
	CONSTRAINT "player_cards_count_positive" CHECK ("player_cards"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE "player_wallets" (
	"user_id" text PRIMARY KEY NOT NULL,
	"coins" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_wallets_coins_not_negative" CHECK ("player_wallets"."coins" >= 0)
);
--> statement-breakpoint
ALTER TABLE "player_boosters" ADD CONSTRAINT "player_boosters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_boosters" ADD CONSTRAINT "player_boosters_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_cards" ADD CONSTRAINT "player_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_wallets" ADD CONSTRAINT "player_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "card_set_translations" (
	"set_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	CONSTRAINT "card_set_translations_set_id_locale_pk" PRIMARY KEY("set_id","locale")
);
--> statement-breakpoint
CREATE TABLE "card_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"release_date" text NOT NULL,
	"official_card_count" integer NOT NULL,
	"total_card_count" integer NOT NULL,
	"symbol_url" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_translations" (
	"card_id" text NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"rarity" text,
	"image_url" text,
	CONSTRAINT "card_translations_card_id_locale_pk" PRIMARY KEY("card_id","locale")
);
--> statement-breakpoint
CREATE TABLE "card_variants" (
	"card_id" text NOT NULL,
	"variant" text NOT NULL,
	CONSTRAINT "card_variants_card_id_variant_pk" PRIMARY KEY("card_id","variant")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"local_id" text NOT NULL,
	"category" text NOT NULL,
	"rarity" text
);
--> statement-breakpoint
ALTER TABLE "card_set_translations" ADD CONSTRAINT "card_set_translations_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_translations" ADD CONSTRAINT "card_translations_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_variants" ADD CONSTRAINT "card_variants_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cards_set_id_idx" ON "cards" USING btree ("set_id");
CREATE TABLE "coupon_redemptions" (
	"coupon_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_redemptions_coupon_id_user_id_pk" PRIMARY KEY("coupon_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coupons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"booster_set_id" text,
	"boosters" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_coins_not_negative" CHECK ("coupons"."coins" >= 0),
	CONSTRAINT "coupons_boosters_not_negative" CHECK ("coupons"."boosters" >= 0),
	CONSTRAINT "coupons_give_something" CHECK ("coupons"."coins" > 0 or "coupons"."boosters" > 0),
	CONSTRAINT "coupons_boosters_have_a_set" CHECK (("coupons"."boosters" = 0) = ("coupons"."booster_set_id" is null))
);
--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");
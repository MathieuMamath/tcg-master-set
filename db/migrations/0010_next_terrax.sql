CREATE TABLE "game_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" text,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_events_occurred_at_idx" ON "game_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "game_events_type_occurred_at_idx" ON "game_events" USING btree ("type","occurred_at");--> statement-breakpoint
CREATE INDEX "game_events_user_id_idx" ON "game_events" USING btree ("user_id");
ALTER TABLE "league_settings" ADD COLUMN "league_id" uuid;--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "season_name" text;--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "points_win" integer DEFAULT 2;--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "points_loss" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "points_walkover" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "league_settings" ADD COLUMN "max_players_per_club" integer DEFAULT 15;--> statement-breakpoint
ALTER TABLE "league_settings" ADD CONSTRAINT "league_settings_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_settings" ADD CONSTRAINT "league_settings_league_id_unique" UNIQUE("league_id");
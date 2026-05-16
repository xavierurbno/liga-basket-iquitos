CREATE INDEX "idx_players_lookup" ON "players" USING btree ("league_id","document_number");--> statement-breakpoint
CREATE INDEX "idx_treasury_club" ON "treasury" USING btree ("club_id");
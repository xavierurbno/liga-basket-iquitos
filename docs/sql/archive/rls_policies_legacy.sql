-- ============================================================
-- ARCHIVO HISTÓRICO — NO EJECUTAR EN PIPELINE
-- ============================================================
-- Copia de referencia (Fase 3 diseño). Las políticas vigentes están en:
--   - supabase/migrations/0009_clubs_authenticated_select_rls.sql
--   - supabase/migrations/0012c_club_members_rls.sql
--   - supabase/migrations/0017_rls_operational_league.sql
--
-- Bootstrap: npm run db:bootstrap:dev (manifest en scripts/db-migration-manifest.mjs)
-- ============================================================

-- ============================================================
-- FASE 3: SEGURIDAD DE DATOS (ROW LEVEL SECURITY - RLS)
-- ============================================================
-- Este script activa RLS y define políticas de aislamiento 
-- multi-tenant basadas en league_id y club_id inyectados en 
-- el JWT (app_metadata) desde Supabase/Clerk.
-- ============================================================

-- 1. ACTIVACIÓN DE RLS EN TODAS LAS TABLAS CRÍTICAS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA LA TABLA 'leagues'
-- Lectura global, escritura solo para Super Admin.
CREATE POLICY "Leagues are visible to all authenticated" ON leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only Super Admins can manage leagues" ON leagues FOR ALL TO authenticated 
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN');

-- 3. POLÍTICAS PARA 'league_settings'
-- Lectura global, escritura para Admin de esa Liga o Super Admin.
CREATE POLICY "Settings are readable by all authenticated" ON league_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage their league settings" ON league_settings FOR ALL TO authenticated 
USING (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid)
WITH CHECK (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid);
CREATE POLICY "Club delegates view league settings" ON league_settings FOR SELECT TO authenticated
USING (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid);

-- 4. POLÍTICAS PARA LA TABLA 'clubs'
CREATE POLICY "League Admins can manage their clubs" ON clubs FOR ALL TO authenticated
USING (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid);
CREATE POLICY "Club Delegates can view their own club" ON clubs FOR SELECT TO authenticated
USING (id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid);

-- 5. POLÍTICAS PARA LA TABLA 'players'
CREATE POLICY "League Admins manage all players in league" ON players FOR ALL TO authenticated
USING (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid);
CREATE POLICY "Club Delegates manage their players" ON players FOR ALL TO authenticated
USING (club_id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid);

-- 6. POLÍTICAS PARA 'categories'
CREATE POLICY "Club Delegates manage their categories" ON categories FOR ALL TO authenticated
USING (club_id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid);
CREATE POLICY "League Admins view all categories in league" ON categories FOR SELECT TO authenticated
USING (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid);

-- 7. POLÍTICAS PARA 'gallery_photos'
CREATE POLICY "Gallery is visible to everyone" ON gallery_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own photo uploads" ON gallery_photos FOR ALL TO authenticated
USING (registered_by = auth.uid());

-- 8. POLÍTICAS PARA 'treasury' y 'player_documents'
CREATE POLICY "Club Delegates manage their treasury" ON treasury FOR ALL TO authenticated
USING (club_id = (auth.jwt() -> 'app_metadata' ->> 'club_id')::uuid);
CREATE POLICY "League Admins oversee treasury" ON treasury FOR ALL TO authenticated
USING (league_id = (auth.jwt() -> 'app_metadata' ->> 'league_id')::uuid);

-- 9. SUPER_ADMIN BYPASS TOTAL
-- Esta política permite al rol SUPER_ADMIN realizar cualquier operación en cualquier tabla.
CREATE POLICY "Super Admins bypass players" ON players FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN');
CREATE POLICY "Super Admins bypass clubs" ON clubs FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN');
CREATE POLICY "Super Admins manage all settings" ON league_settings FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN');
CREATE POLICY "Super Admins bypass categories" ON categories FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN');

-- ============================================================
-- FIN DEL SCRIPT RLS HARDENING
-- ============================================================

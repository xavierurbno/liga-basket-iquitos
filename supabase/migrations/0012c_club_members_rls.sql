-- Lectura de membresías: sin esto, el cliente Supabase (anon) no ve filas de club_members.
-- La app también valida membresía vía Drizzle (conexión DB); esta policy sirve para queries PostgREST.

CREATE POLICY "club_members_select_own"
  ON club_members FOR SELECT
  USING (user_id = auth.uid());

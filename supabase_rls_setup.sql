-- Habilitar RLS en las tablas
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para clubs
-- Un delegado puede ver, actualizar y borrar solo su club.
CREATE POLICY "Delegate access own club" ON public.clubs
  FOR ALL
  USING (auth.uid() = owner_id);

-- Opcionalmente, permitir que un admin/system_owner vea todos los clubs
-- CREATE POLICY "System Owner can view all clubs" ON public.clubs
--   FOR SELECT
--   USING (auth.jwt() ->> 'email' = 'zxrios9@gmail.com');

-- Políticas para players
-- Un delegado puede gestionar jugadores de su club
CREATE POLICY "Delegate manage own players" ON public.players
  FOR ALL
  USING (
    club_id IN (
      SELECT id FROM public.clubs WHERE owner_id = auth.uid()
    )
  );

-- Políticas para categories
-- Un delegado puede gestionar las categorías de su club
CREATE POLICY "Delegate manage own categories" ON public.categories
  FOR ALL
  USING (
    club_id IN (
      SELECT id FROM public.clubs WHERE owner_id = auth.uid()
    )
  );

-- Políticas para treasury
-- Un delegado puede gestionar la tesorería de su club
CREATE POLICY "Delegate manage own treasury" ON public.treasury
  FOR ALL
  USING (
    club_id IN (
      SELECT id FROM public.clubs WHERE owner_id = auth.uid()
    )
  );

-- Políticas para player_documents
-- Un delegado puede gestionar los documentos de sus jugadores
CREATE POLICY "Delegate manage own player documents" ON public.player_documents
  FOR ALL
  USING (
    club_id IN (
      SELECT id FROM public.clubs WHERE owner_id = auth.uid()
    )
  );

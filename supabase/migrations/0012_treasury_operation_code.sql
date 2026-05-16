-- Tablas antiguas o creadas fuera de la cadena de migraciones pueden carecer de columnas del esquema actual.
ALTER TABLE "public"."treasury" ADD COLUMN IF NOT EXISTS "operation_code" varchar(50);

-- Tesorería (liga): enum + tabla transactions (idempotente para BD ya poblada).
DO $$
BEGIN
  CREATE TYPE "public"."metodo_pago_tesoreria" AS ENUM ('EFECTIVO', 'PLIN', 'YAPE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" varchar(191),
  "club_id" uuid NOT NULL,
  "tipo" "public"."tipo_movimiento" NOT NULL,
  "monto" numeric(12, 2) NOT NULL,
  "concepto" varchar(200) NOT NULL,
  "metodo_pago" "public"."metodo_pago_tesoreria" DEFAULT 'EFECTIVO' NOT NULL,
  "fecha" timestamp DEFAULT now() NOT NULL,
  "descripcion" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "transactions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs" ("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "transactions_club_fecha_idx" ON "public"."transactions" USING btree ("club_id", "fecha");
CREATE INDEX IF NOT EXISTS "transactions_organization_idx" ON "public"."transactions" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "transactions_tipo_idx" ON "public"."transactions" USING btree ("tipo");

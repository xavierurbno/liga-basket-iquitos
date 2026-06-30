"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerFromCookies } from "@/lib/supabase/server";
import { categoryRepository } from "@/repositories/categoryRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { playerRepository } from "@/repositories/playerRepository";
import { ActionResult } from "@/lib/types/league";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { isSuperAdminDataScope } from "@/lib/auth/intranet-roles";
import { User } from "@supabase/supabase-js";
import { withOperationalWrite } from "@/lib/db/operational-db-access";
import { sql } from "drizzle-orm";
import {
  formatRegistroJugadorZodError,
  registroJugadorServerSchema,
} from "@/lib/validations/schemas";
import {
  calcularCategoria,
  generarNumeroFichaDesdeCategoriaClub,
} from "@/lib/utils/category";
import { resolveLeagueCarnetPrefix } from "@/lib/leagues/league-carnet-prefix";
import { leagueRepository } from "@/repositories/league.repository";
import {
  asText,
  buildRegistroJugadorRawData,
  formatActionError,
  resolveLeagueAndClubForPlayerAction,
} from "@/lib/actions/system-dashboard-helpers";
import { AUDIT_ACTIONS, recordAuditFromContext } from "@/lib/observability/record-audit";
import { logSecurityEvent } from "@/lib/observability/security-log";
import {
  uploadPlayerPhoto,
  uploadPlayerPhotoIfPresent,
} from "@/lib/storage/player-photo-url.server";
import { playersBucketName } from "@/lib/storage/player-photo-storage";
import { assertCanRegisterPlayer } from "@/lib/leagues/assert-league-plan-limit";

export const registrarJugadorAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    let uploadedPhotoKey: string | null = null;

    try {
      const tenant = await resolveLeagueAndClubForPlayerAction(formData, context);
      if ("error" in tenant) {
        return { success: false, error: tenant.error };
      }
      const { leagueId, clubId } = tenant;

      const planError = await assertCanRegisterPlayer(leagueId, context);
      if (planError) {
        return {
          success: false,
          error: planError.message,
          upgradePath: planError.upgradePath ?? undefined,
        };
      }

      const categoryId = asText(formData.get("categoryId"));
      if (!categoryId) {
        return { success: false, error: "Categoría no indicada." };
      }

      const rawData = buildRegistroJugadorRawData(formData);
      const validated = registroJugadorServerSchema.safeParse(rawData);
      if (!validated.success) {
        return {
          success: false,
          error: formatRegistroJugadorZodError(validated.error),
        };
      }

      const { data } = validated;

      const supabase = await createSupabaseServerFromCookies();

      let photoUrl: string | null = null;
      const fotoArchivo = formData.get("foto") ?? formData.get("foto_archivo");

      if (fotoArchivo instanceof File && fotoArchivo.size > 0) {
        uploadedPhotoKey = await uploadPlayerPhoto(supabase, leagueId, clubId, fotoArchivo);
        photoUrl = uploadedPhotoKey;
      }

      const leagueRow = await leagueRepository.findById(leagueId);
      const cityPrefix = resolveLeagueCarnetPrefix({
        slug: leagueRow?.slug,
        name: leagueRow?.name,
      });

      let createdPlayerId: string | undefined;

      await withOperationalWrite(user, context, async (tx) => {
        const catRow = await categoryRepository.findById(categoryId, tx);
        if (!catRow || catRow.clubId !== clubId) {
          throw new Error("Categoría no encontrada para este club.");
        }

        const seqResult = await tx.execute(sql`SELECT nextval('carnet_deportista_seq')`);
        const nextVal = Number(seqResult[0].nextval);
        const categoriaPorEdad = calcularCategoria(data.birthdate);
        const carnetNumber = generarNumeroFichaDesdeCategoriaClub(
          catRow.name,
          data.birthdate,
          nextVal,
          new Date().getFullYear(),
          cityPrefix,
        );

        const playerRow = await playerRepository.create(
          {
            leagueId,
            clubId,
            categoryId,
            name: data.name,
            lastname: data.lastname,
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            birthdate: data.birthdate,
            gender: data.gender,
            category: categoriaPorEdad,
            phone: data.phone || undefined,
            photoUrl,
            jerseyNumber: data.jerseyNumber,
            status: "ACTIVO",
            carnetNumber,
            tutorName: data.tutorName || undefined,
            tutorDocumentType: data.tutorDocumentType || "DNI",
            tutorDocumentNumber: data.tutorDocumentNumber || undefined,
            tutorPhone: data.tutorPhone || undefined,
          },
          tx,
        );
        createdPlayerId = playerRow?.id;
      });

      await recordAuditFromContext(context, {
        action: AUDIT_ACTIONS.playerCreate,
        entityType: "player",
        entityId: createdPlayerId,
        leagueId,
        clubId,
        payload: {
          playerId: createdPlayerId,
          categoryId,
        },
      });

      logSecurityEvent(
        {
          type: "player.create",
          message: "Jugador registrado",
          userId: context.userId,
          role: context.role,
          clubId,
          leagueId,
          meta: { categoryId },
        },
        { level: "info" },
      );

      revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as any);
      return { success: true };
    } catch (error: unknown) {
      console.error("Error en registrarJugadorAction:", error);

      if (uploadedPhotoKey) {
        const supabase = await createSupabaseServerFromCookies();
        await supabase.storage.from(playersBucketName()).remove([uploadedPhotoKey]);
      }

      return { success: false, error: formatActionError(error) };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);

export const editarDeportistaAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));
    const playerId = asText(formData.get("playerId"));
    const documentType = (formData.get("document_type") as "DNI" | "CE" | "PASAPORTE") ?? "DNI";
    const documentNumber = asText(formData.get("document_number"));
    const lastname = asText(formData.get("apellidos"));
    const name = asText(formData.get("nombres"));
    const birthdate = asText(formData.get("fecha_nacimiento"));
    const telefono = asText(formData.get("telefono"));
    const direccion = asText(formData.get("direccion"));
    const genero = (formData.get("genero") as "MASCULINO" | "FEMENINO" | "MIXTO" | null) ?? "MIXTO";
    const status = (formData.get("status") as string | null) ?? undefined;
    const fotoActual = asText(formData.get("fotoActual"));

    if (!clubId || !categoryId || !playerId || !documentNumber || !lastname || !name || !birthdate) {
      return { success: false, error: "Campos obligatorios incompletos." };
    }

    const clubPreview = await clubRepository.findById(clubId);
    const leagueIdForPhoto = clubPreview?.leagueId ?? context.leagueId ?? null;
    const supabase = await createSupabaseServerFromCookies();
    let fotoPath: string | null = null;
    if (leagueIdForPhoto) {
      fotoPath = await uploadPlayerPhotoIfPresent(
        supabase,
        leagueIdForPhoto,
        clubId,
        formData.get("foto_archivo"),
      );
    }

    await withOperationalWrite(user, context, async (tx) => {
      const club = await clubRepository.findById(clubId, tx);
      const leagueId = club?.leagueId ?? context.leagueId ?? null;

      await playerRepository.update(
        playerId,
        clubId,
        {
          documentType,
          documentNumber,
          lastname: lastname.slice(0, 80),
          name: name.slice(0, 80),
          birthdate: new Date(birthdate),
          phone: telefono || null,
          address: direccion || null,
          gender: genero,
          status: status as "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | undefined,
          photoUrl: fotoPath || fotoActual || null,
          tutorName: asText(formData.get("tutorName")) || null,
          tutorDocumentType: (formData.get("tutor_document_type") as "DNI" | "CE" | "PASAPORTE") || "DNI",
          tutorDocumentNumber: asText(formData.get("tutor_document_number")) || null,
          tutorPhone: asText(formData.get("tutorPhone")) || null,
        },
        tx,
        {
          bypassClubFilter: isSuperAdminDataScope(context.role),
          actingRole: context.role,
        },
      );

      await recordAuditFromContext(context, {
        action: AUDIT_ACTIONS.playerUpdate,
        entityType: "player",
        entityId: playerId,
        leagueId,
        clubId,
        payload: {
          playerId,
          categoryId,
          photoUpdated: Boolean(fotoPath),
        },
      });
    });

    revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);

export const eliminarDeportistaAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));
    const playerId = asText(formData.get("playerId"));

    if (!clubId || !categoryId || !playerId) {
      return { success: false, error: "Datos incompletos." };
    }

    await withOperationalWrite(user, context, async (tx) => {
      const club = await clubRepository.findById(clubId, tx);
      const leagueId = club?.leagueId ?? context.leagueId ?? null;

      await recordAuditFromContext(context, {
        action: AUDIT_ACTIONS.playerDelete,
        entityType: "player",
        entityId: playerId,
        leagueId,
        clubId,
        payload: {
          playerId,
          categoryId,
        },
      });

      await playerRepository.delete(playerId, clubId, tx, {
        bypassClubFilter: isSuperAdminDataScope(context.role),
        actingRole: context.role,
      });
    });

    revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);

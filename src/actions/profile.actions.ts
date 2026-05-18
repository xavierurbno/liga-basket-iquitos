"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { assertActorMayAssignRole } from "@/lib/auth/assignable-roles";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import { db } from "@/lib/db/client";
import { authUsers, clubMembers, userAssignments } from "@/lib/db/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin-server";
import { userAssignmentRepository } from "@/repositories/userAssignmentRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { leagueRepository } from "@/repositories/league.repository";

const ASSIGNABLE_ROLES = ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"] as const;

const createProfileSchema = z
  .object({
    fullName: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
    email: z
      .string()
      .trim()
      .email("Correo inválido")
      .refine((e) => /@gmail\.com$/i.test(e), {
        message: "Debe ser Gmail (@gmail.com) para compatibilidad con Google OAuth.",
      }),
    role: z.enum(ASSIGNABLE_ROLES),
    clubId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "CLUB_DELEGATE" && !data.clubId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un club para el delegado.",
        path: ["clubId"],
      });
    }
  });

export type CreateProfileAssignmentState = {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

export type DeleteProfileAssignmentResult = {
  success: boolean;
  message?: string;
  error?: string;
};

function randomPassword(): string {
  return randomBytes(24).toString("base64url") + "Aa1!";
}

type AppMeta = Record<string, unknown>;

function stripTenantKeys(meta: AppMeta): AppMeta {
  const next = { ...meta };
  delete next.club_id;
  delete next.club_slug;
  delete next.clubId;
  delete next.clubSlug;
  return next;
}

/**
 * `app_metadata` en Supabase Auth: `club_id` / `club_slug` / `league_id` alineados con `withAuth` y `proxy.ts`.
 */
function resolveTargetLeagueIdForAssignment(
  role: (typeof ASSIGNABLE_ROLES)[number],
  formData: FormData,
  context: AuthContext,
): string | null {
  if (role !== "LEAGUE_ADMIN") return null;
  const fromForm = formData.get("leagueId");
  const formLeague =
    typeof fromForm === "string" && fromForm.trim() ? fromForm.trim() : null;
  const actorLeague = context.leagueId?.trim() || null;
  if (context.role === "LEAGUE_ADMIN") return actorLeague;
  if (context.role === "SUPER_ADMIN") return formLeague ?? actorLeague;
  return null;
}

function buildAppMetadataForAssignment(
  role: (typeof ASSIGNABLE_ROLES)[number],
  opts: {
    clubId?: string;
    clubSlug?: string;
    clubLeagueId?: string | null;
    actorLeagueId?: string | null;
  },
): AppMeta {
  if (role === "CLUB_DELEGATE") {
    const cid = opts.clubId;
    const slug = opts.clubSlug;
    if (!cid || !slug) {
      throw new Error("clubId y clubSlug son obligatorios para delegados.");
    }
    const m: AppMeta = {
      role: "CLUB_DELEGATE",
      club_id: cid,
      club_slug: slug,
    };
    if (opts.clubLeagueId) {
      m.league_id = opts.clubLeagueId;
    }
    return m;
  }
  const m: AppMeta = { role };
  if (role === "LEAGUE_ADMIN" && opts.actorLeagueId) {
    m.league_id = opts.actorLeagueId;
  }
  return m;
}

export const createProfileAssignmentAction = withAuth(
  async (
    _prevState: CreateProfileAssignmentState,
    formData: FormData,
    _actor: User,
    context: AuthContext,
  ): Promise<CreateProfileAssignmentState> => {
    const clubEntry = formData.get("clubId");
    const clubIdRaw = typeof clubEntry === "string" ? clubEntry.trim() : "";
    const parsed = createProfileSchema.safeParse({
      fullName: typeof formData.get("fullName") === "string" ? formData.get("fullName") : "",
      email: typeof formData.get("email") === "string" ? formData.get("email") : "",
      role: typeof formData.get("role") === "string" ? formData.get("role") : "",
      clubId: clubIdRaw || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "Error de validación",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { fullName, email, role } = parsed.data;
    const roleGuard = assertActorMayAssignRole(context.role, role);
    if (roleGuard) {
      return { success: false, message: roleGuard };
    }
    const emailNorm = email.trim().toLowerCase();
    const admin = getSupabaseAdmin();

    let targetLeagueId: string | null = null;
    if (role === "LEAGUE_ADMIN") {
      targetLeagueId = resolveTargetLeagueIdForAssignment(role, formData, context);
      if (!targetLeagueId) {
        return {
          success: false,
          message:
            context.role === "SUPER_ADMIN"
              ? "Selecciona una liga activa antes de crear un administrador de liga."
              : "Tu cuenta no tiene liga asignada.",
        };
      }
      const leagueRow = await leagueRepository.findById(targetLeagueId);
      if (!leagueRow) {
        return { success: false, message: "La liga indicada no existe." };
      }
    }

    let clubRow: { id: string; slug: string; leagueId: string | null } | null = null;
    if (role === "CLUB_DELEGATE") {
      const cid = parsed.data.clubId!;
      clubRow = await clubRepository.findById(cid);
      if (!clubRow) {
        return { success: false, message: "El club seleccionado no existe." };
      }
      if (context.role === "LEAGUE_ADMIN") {
        const actorLeague = context.leagueId?.trim();
        if (!actorLeague) {
          return {
            success: false,
            message: "Tu cuenta no tiene liga asignada; no puedes vincular delegados a clubes.",
          };
        }
        if (clubRow.leagueId !== actorLeague) {
          return {
            success: false,
            message: "Solo puedes asignar delegados a clubes de tu liga.",
          };
        }
      }
    }

    try {
      const existingRows = await db
        .select({ id: authUsers.id })
        .from(authUsers)
        .where(eq(authUsers.email, emailNorm))
        .limit(1);

      const metaPayload = buildAppMetadataForAssignment(role, {
        clubId: clubRow?.id,
        clubSlug: clubRow?.slug,
        clubLeagueId: clubRow?.leagueId ?? null,
        actorLeagueId: targetLeagueId ?? context.leagueId ?? null,
      });

      if (existingRows[0]?.id) {
        const targetUserId = existingRows[0].id;

        const [alreadyDelegate] = await db
          .select({ userId: userAssignments.userId })
          .from(userAssignments)
          .where(and(eq(userAssignments.userId, targetUserId), eq(userAssignments.role, "CLUB_DELEGATE")))
          .limit(1);

        if (role === "CLUB_DELEGATE" && alreadyDelegate) {
          return {
            success: false,
            message:
              "Este usuario ya está registrado como delegado de un club. Revoca la asignación antes de reasignar.",
          };
        }

        if (role === "CLUB_DELEGATE" && clubRow) {
          await db.insert(userAssignments).values({
            userId: targetUserId,
            leagueId: clubRow.leagueId ?? null,
            clubId: clubRow.id,
            role: "CLUB_DELEGATE",
          });

          await db
            .insert(clubMembers)
            .values({
              userId: targetUserId,
              clubId: clubRow.id,
              role: "ADMIN",
              active: true,
            })
            .onConflictDoNothing({ target: [clubMembers.userId, clubMembers.clubId] });
        } else {
          const existingNullAssignment = await db
            .select({ userId: userAssignments.userId })
            .from(userAssignments)
            .where(
              and(
                eq(userAssignments.userId, targetUserId),
                isNull(userAssignments.leagueId),
                isNull(userAssignments.clubId),
              ),
            )
            .limit(1);

          if (existingNullAssignment[0]) {
            return {
              success: false,
              message:
                "Este usuario ya tiene una asignación global (sin club/liga). Elimínala antes de crear otra.",
            };
          }

          await db.insert(userAssignments).values({
            userId: targetUserId,
            leagueId: role === "LEAGUE_ADMIN" ? targetLeagueId : null,
            clubId: null,
            role,
          });
        }

        const { data: userRow, error: getErr } = await admin.auth.admin.getUserById(targetUserId);
        if (getErr || !userRow?.user) {
          return {
            success: false,
            message: getErr?.message ?? "No se pudo leer el usuario en Auth.",
          };
        }
        const prevUserMeta =
          (userRow.user.user_metadata as Record<string, unknown> | undefined) ?? {};
        const prevApp = (userRow.user.app_metadata as AppMeta | undefined) ?? {};
        const nextApp = {
          ...stripTenantKeys(prevApp),
          ...metaPayload,
        };
        const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            ...prevUserMeta,
            full_name: fullName,
          },
          app_metadata: nextApp,
        });
        if (updErr) {
          return {
            success: false,
            message: updErr.message ?? "No se pudo actualizar el usuario en Auth.",
          };
        }
      } else {
        const pwd = randomPassword();
        const { data: created, error: crErr } = await admin.auth.admin.createUser({
          email: emailNorm,
          password: pwd,
          email_confirm: true,
          user_metadata: { full_name: fullName },
          app_metadata: metaPayload,
        });
        if (crErr || !created?.user) {
          const msg = crErr?.message ?? "No se pudo crear el usuario.";
          if (/already|registered|exist/i.test(msg)) {
            return {
              success: false,
              message:
                "Este correo ya está registrado; si no aparece en la tabla, revisa la sincronización entre Auth y Postgres.",
            };
          }
          return { success: false, message: msg };
        }
        const targetUserId = created.user.id;

        if (role === "CLUB_DELEGATE" && clubRow) {
          await db.insert(userAssignments).values({
            userId: targetUserId,
            leagueId: clubRow.leagueId ?? null,
            clubId: clubRow.id,
            role: "CLUB_DELEGATE",
          });

          await db
            .insert(clubMembers)
            .values({
              userId: targetUserId,
              clubId: clubRow.id,
              role: "ADMIN",
              active: true,
            })
            .onConflictDoNothing({ target: [clubMembers.userId, clubMembers.clubId] });
        } else {
          await db.insert(userAssignments).values({
            userId: targetUserId,
            leagueId: role === "LEAGUE_ADMIN" ? targetLeagueId : null,
            clubId: null,
            role,
          });
        }
      }

      revalidatePath("/liga/perfiles/");
      return {
        success: true,
        message:
          role === "CLUB_DELEGATE"
            ? "Delegado creado y vinculado al club. Ya puede iniciar sesión en la intranet del club."
            : "Personal añadido correctamente.",
      };
    } catch (e: unknown) {
      console.error("[createProfileAssignmentAction]", e);
      const msg =
        e instanceof Error ? e.message : "Error inesperado al crear la asignación.";
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        String((e as { code?: unknown }).code) === "23505"
      ) {
        return {
          success: false,
          message: "Conflicto de unicidad en la base de datos.",
        };
      }
      return { success: false, message: msg };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

function uuidOrNullFromForm(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}

const updateProfileAssignmentSchema = z
  .object({
    userId: z.string().uuid(),
    oldLeagueId: z.union([z.string().uuid(), z.null()]),
    oldClubId: z.union([z.string().uuid(), z.null()]),
    fullName: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
    role: z.enum(ASSIGNABLE_ROLES),
    clubId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "CLUB_DELEGATE" && !data.clubId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un club para el delegado.",
        path: ["clubId"],
      });
    }
  });

export const updateProfileAssignmentAction = withAuth(
  async (
    _prevState: CreateProfileAssignmentState,
    formData: FormData,
    _actor: User,
    context: AuthContext,
  ): Promise<CreateProfileAssignmentState> => {
    const clubEntry = formData.get("clubId");
    const clubIdRaw =
      typeof clubEntry === "string" && clubEntry.trim() !== "" ? clubEntry.trim() : undefined;

    const parsed = updateProfileAssignmentSchema.safeParse({
      userId: typeof formData.get("userId") === "string" ? formData.get("userId") : "",
      oldLeagueId: uuidOrNullFromForm(formData, "oldLeagueId"),
      oldClubId: uuidOrNullFromForm(formData, "oldClubId"),
      fullName: typeof formData.get("fullName") === "string" ? formData.get("fullName") : "",
      role: typeof formData.get("role") === "string" ? formData.get("role") : "",
      clubId: clubIdRaw,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "Error de validación",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { userId, oldLeagueId, oldClubId, fullName, role: newRole } = parsed.data;
    const roleGuard = assertActorMayAssignRole(context.role, newRole);
    if (roleGuard) {
      return { success: false, message: roleGuard };
    }
    const admin = getSupabaseAdmin();

    const whereOld = and(
      eq(userAssignments.userId, userId),
      oldLeagueId === null ? isNull(userAssignments.leagueId) : eq(userAssignments.leagueId, oldLeagueId),
      oldClubId === null ? isNull(userAssignments.clubId) : eq(userAssignments.clubId, oldClubId),
    );

    const [assignmentRow] = await db.select().from(userAssignments).where(whereOld).limit(1);

    if (!assignmentRow) {
      return { success: false, message: "La asignación ya no existe. Recarga la página." };
    }

    if (context.role === "LEAGUE_ADMIN") {
      const actorLeague = context.leagueId?.trim();
      if (!actorLeague) {
        return {
          success: false,
          message: "Tu cuenta no tiene liga asignada; no puedes editar perfiles.",
        };
      }
      if (
        assignmentRow.role === "SUPER_ADMIN" ||
        assignmentRow.role === "LEAGUE_ADMIN"
      ) {
        return {
          success: false,
          message: "No tienes permiso para editar este perfil.",
        };
      }
      if (assignmentRow.role === "CLUB_DELEGATE") {
        if (!assignmentRow.clubId) {
          return { success: false, message: "Asignación de delegado inválida (sin club)." };
        }
        const oldClub = await clubRepository.findById(assignmentRow.clubId);
        if (!oldClub?.leagueId || oldClub.leagueId !== actorLeague) {
          return { success: false, message: "No puedes editar delegados fuera de tu liga." };
        }
      }
    }

    let newClubRow: { id: string; slug: string; leagueId: string | null } | null = null;
    if (newRole === "CLUB_DELEGATE") {
      const cid = parsed.data.clubId!;
      newClubRow = await clubRepository.findById(cid);
      if (!newClubRow) {
        return { success: false, message: "El club seleccionado no existe." };
      }
      if (context.role === "LEAGUE_ADMIN") {
        const actorLeague = context.leagueId?.trim();
        if (!actorLeague || newClubRow.leagueId !== actorLeague) {
          return {
            success: false,
            message: "Solo puedes asignar delegados a clubes de tu liga.",
          };
        }
      }
    }

    const metaPayload = buildAppMetadataForAssignment(newRole, {
      clubId: newClubRow?.id,
      clubSlug: newClubRow?.slug,
      clubLeagueId: newClubRow?.leagueId ?? null,
      actorLeagueId: context.leagueId ?? null,
    });

    try {
      await db.transaction(async (tx) => {
        await tx.delete(userAssignments).where(whereOld);

        const hadDelegateClub =
          assignmentRow.role === "CLUB_DELEGATE" &&
          assignmentRow.clubId !== null;

        if (hadDelegateClub) {
          await tx
            .delete(clubMembers)
            .where(
              and(eq(clubMembers.userId, userId), eq(clubMembers.clubId, assignmentRow.clubId!)),
            );
        }

        if (newRole === "CLUB_DELEGATE" && newClubRow) {
          await tx.insert(userAssignments).values({
            userId,
            leagueId: newClubRow.leagueId ?? null,
            clubId: newClubRow.id,
            role: "CLUB_DELEGATE",
          });

          await tx
            .insert(clubMembers)
            .values({
              userId,
              clubId: newClubRow.id,
              role: "ADMIN",
              active: true,
            })
            .onConflictDoNothing({ target: [clubMembers.userId, clubMembers.clubId] });
        } else {
          await tx.insert(userAssignments).values({
            userId,
            leagueId: null,
            clubId: null,
            role: newRole,
          });
        }
      });

      const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(userId);
      if (getErr || !authUser?.user) {
        return {
          success: false,
          message: getErr?.message ?? "No se pudo leer el usuario en Auth.",
        };
      }

      const prevUserMeta =
        (authUser.user.user_metadata as Record<string, unknown> | undefined) ?? {};
      const prevApp = (authUser.user.app_metadata as AppMeta | undefined) ?? {};
      const nextApp = {
        ...stripTenantKeys(prevApp),
        ...metaPayload,
      };

      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...prevUserMeta,
          full_name: fullName,
        },
        app_metadata: nextApp,
      });

      if (updErr) {
        return {
          success: false,
          message: updErr.message ?? "No se pudo actualizar el usuario en Auth.",
        };
      }

      revalidatePath("/liga/perfiles/");
      return {
        success: true,
        message: "Perfil actualizado correctamente.",
      };
    } catch (e: unknown) {
      console.error("[updateProfileAssignmentAction]", e);
      const msg =
        e instanceof Error ? e.message : "Error inesperado al actualizar la asignación.";
      return { success: false, message: msg };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

const deleteAssignmentPayloadSchema = z.object({
  userId: z.string().uuid(),
  leagueId: z.string().uuid().nullable(),
  clubId: z.string().uuid().nullable(),
});

export const deleteProfileAssignmentAction = withAuth(
  async (
    payload: unknown,
    _actor: User,
    _context: AuthContext,
  ): Promise<DeleteProfileAssignmentResult> => {
    const parsed = deleteAssignmentPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, message: "Datos de asignación inválidos." };
    }

    const { userId, leagueId, clubId } = parsed.data;

    const row = await userAssignmentRepository.findOneByComposite({
      userId,
      leagueId,
      clubId,
    });
    if (!row) {
      return { success: false, message: "La asignación ya no existe." };
    }

    const admin = getSupabaseAdmin();

    try {
      await userAssignmentRepository.deleteByComposite({
        userId,
        leagueId,
        clubId,
      });

      const { error: delAuthErr } = await admin.auth.admin.deleteUser(userId);
      if (delAuthErr) {
        console.error("[deleteProfileAssignmentAction] Auth delete:", delAuthErr);
        return {
          success: false,
          message:
            delAuthErr.message ??
            "Se eliminó la fila en base de datos pero falló la baja en Auth; revisa manualmente.",
        };
      }

      revalidatePath("/liga/perfiles/");
      return { success: true, message: "Usuario revocado y eliminado de Auth." };
    } catch (e: unknown) {
      console.error("[deleteProfileAssignmentAction]", e);
      return {
        success: false,
        message: e instanceof Error ? e.message : "Error al eliminar la asignación.",
      };
    }
  },
  "SUPER_ADMIN",
);

import { db } from "@/lib/db/client";
import { authUsers, clubs, userAssignments, type UserRole } from "@/lib/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";

export type AssignmentWithEmail = {
  userId: string;
  leagueId: string | null;
  clubId: string | null;
  role: UserRole;
  email: string | null;
  rawUserMetaData: unknown;
};

function matchLeagueIdColumn(leagueId: string | null) {
  return leagueId === null ? isNull(userAssignments.leagueId) : eq(userAssignments.leagueId, leagueId);
}

function matchClubIdColumn(clubId: string | null) {
  return clubId === null ? isNull(userAssignments.clubId) : eq(userAssignments.clubId, clubId);
}

const assignmentWithEmailSelect = {
  userId: userAssignments.userId,
  leagueId: userAssignments.leagueId,
  clubId: userAssignments.clubId,
  role: userAssignments.role,
  email: authUsers.email,
  rawUserMetaData: authUsers.rawUserMetaData,
} as const;

export class UserAssignmentRepository {
  /** Asignaciones visibles al filtrar por una liga operativa (sin huérfanas). */
  async findForOperationalLeague(leagueId: string): Promise<AssignmentWithEmail[]> {
    return await db
      .select(assignmentWithEmailSelect)
      .from(userAssignments)
      .innerJoin(authUsers, eq(userAssignments.userId, authUsers.id))
      .leftJoin(clubs, eq(userAssignments.clubId, clubs.id))
      .where(
        or(
          eq(userAssignments.role, "SUPER_ADMIN"),
          and(eq(userAssignments.role, "LEAGUE_ADMIN"), eq(userAssignments.leagueId, leagueId)),
          and(eq(userAssignments.role, "CLUB_DELEGATE"), eq(clubs.leagueId, leagueId)),
        ),
      )
      .orderBy(desc(userAssignments.createdAt));
  }

  /** Asignaciones sin liga/club válidos (tabla de corrección para super admin). */
  async findOrphansWithEmail(): Promise<AssignmentWithEmail[]> {
    return await db
      .select(assignmentWithEmailSelect)
      .from(userAssignments)
      .innerJoin(authUsers, eq(userAssignments.userId, authUsers.id))
      .leftJoin(clubs, eq(userAssignments.clubId, clubs.id))
      .where(
        or(
          and(eq(userAssignments.role, "LEAGUE_ADMIN"), isNull(userAssignments.leagueId)),
          and(eq(userAssignments.role, "CLUB_DELEGATE"), isNull(userAssignments.clubId)),
          and(eq(userAssignments.role, "CLUB_DELEGATE"), isNull(clubs.leagueId)),
        ),
      )
      .orderBy(desc(userAssignments.createdAt));
  }

  async findAllWithEmail(): Promise<AssignmentWithEmail[]> {
    const rows = await db
      .select(assignmentWithEmailSelect)
      .from(userAssignments)
      .innerJoin(authUsers, eq(userAssignments.userId, authUsers.id))
      .orderBy(desc(userAssignments.createdAt));

    return rows;
  }

  /** Fila con `league_id` y `club_id` nulos (p. ej. admin de liga mal migrado). */
  async findGlobalByUserId(userId: string): Promise<AssignmentWithEmail | null> {
    const [row] = await db
      .select(assignmentWithEmailSelect)
      .from(userAssignments)
      .innerJoin(authUsers, eq(userAssignments.userId, authUsers.id))
      .where(
        and(
          eq(userAssignments.userId, userId),
          isNull(userAssignments.leagueId),
          isNull(userAssignments.clubId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findLeagueAdminForLeague(
    userId: string,
    leagueId: string,
  ): Promise<{ userId: string } | null> {
    const [row] = await db
      .select({ userId: userAssignments.userId })
      .from(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, userId),
          eq(userAssignments.leagueId, leagueId),
          eq(userAssignments.role, "LEAGUE_ADMIN"),
          isNull(userAssignments.clubId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findOneByComposite(params: {
    userId: string;
    leagueId: string | null;
    clubId: string | null;
  }): Promise<{ userId: string } | null> {
    const [row] = await db
      .select({ userId: userAssignments.userId })
      .from(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, params.userId),
          matchLeagueIdColumn(params.leagueId),
          matchClubIdColumn(params.clubId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findLeagueAdmins(leagueId: string): Promise<AssignmentWithEmail[]> {
    const rows = await db
      .select(assignmentWithEmailSelect)
      .from(userAssignments)
      .innerJoin(authUsers, eq(userAssignments.userId, authUsers.id))
      .where(
        and(eq(userAssignments.leagueId, leagueId), eq(userAssignments.role, "LEAGUE_ADMIN")),
      )
      .orderBy(desc(userAssignments.createdAt));
    return rows;
  }

  async countLeagueAdmins(leagueId: string): Promise<number> {
    const rows = await this.findLeagueAdmins(leagueId);
    return rows.length;
  }

  async deleteByComposite(params: {
    userId: string;
    leagueId: string | null;
    clubId: string | null;
  }) {
    return await db
      .delete(userAssignments)
      .where(
        and(
          eq(userAssignments.userId, params.userId),
          matchLeagueIdColumn(params.leagueId),
          matchClubIdColumn(params.clubId),
        ),
      );
  }
}

export const userAssignmentRepository = new UserAssignmentRepository();

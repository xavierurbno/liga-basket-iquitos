import { db } from "@/lib/db/client";
import { authUsers, userAssignments, type UserRole } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export type AssignmentWithEmail = {
  userId: string;
  leagueId: string | null;
  clubId: string | null;
  role: UserRole;
  email: string | null;
};

function matchLeagueIdColumn(leagueId: string | null) {
  return leagueId === null ? isNull(userAssignments.leagueId) : eq(userAssignments.leagueId, leagueId);
}

function matchClubIdColumn(clubId: string | null) {
  return clubId === null ? isNull(userAssignments.clubId) : eq(userAssignments.clubId, clubId);
}

export class UserAssignmentRepository {
  async findAllWithEmail(): Promise<AssignmentWithEmail[]> {
    const rows = await db
      .select({
        userId: userAssignments.userId,
        leagueId: userAssignments.leagueId,
        clubId: userAssignments.clubId,
        role: userAssignments.role,
        email: authUsers.email,
      })
      .from(userAssignments)
      .innerJoin(authUsers, eq(userAssignments.userId, authUsers.id))
      .orderBy(desc(userAssignments.createdAt));

    return rows;
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

import {
  operationalReadDb,
  operationalWriteDb,
  type OperationalDb,
  type OperationalTx,
} from "@/lib/db/operational-db-access";
import { leagueSettings, type LeagueSettings as LeagueSettingsModel, type NewLeagueSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type DB = OperationalDb;
type Transaction = OperationalTx;

export class SettingsRepository {
  /**
   * Obtiene la configuración específica de una liga.
   */
  async getLeagueSettings(leagueId: string, tx: DB | Transaction = operationalReadDb()) {
    const [row] = await tx
      .select()
      .from(leagueSettings)
      .where(eq(leagueSettings.leagueId, leagueId))
      .limit(1);
    return row || null;
  }

  /**
   * Actualiza o crea la configuración para una liga específica.
   */
  async updateLeagueSettings(
    leagueId: string,
    data: Partial<LeagueSettingsModel>,
    tx: DB | Transaction = operationalWriteDb()
  ) {
    const existing = await this.getLeagueSettings(leagueId, tx);
    
    if (existing) {
      const [updated] = await tx
        .update(leagueSettings)
        .set({ 
          ...data, 
          updatedAt: new Date() 
        })
        .where(eq(leagueSettings.leagueId, leagueId))
        .returning();
      return updated;
    } else {
      const [inserted] = await tx
        .insert(leagueSettings)
        .values({
          ...data as NewLeagueSettings,
          leagueId,
          updatedAt: new Date(),
        })
        .returning();
      return inserted;
    }
  }

  /**
   * Alias para compatibilidad o uso genérico (si solo hay una liga por ahora)
   * @deprecated Usar getLeagueSettings
   */
  async getSettings(tx: DB | Transaction = operationalReadDb()) {
    const [row] = await tx.select().from(leagueSettings).limit(1);
    return row || null;
  }

  /**
   * @deprecated Usar updateLeagueSettings
   */
  async upsert(data: Partial<LeagueSettingsModel>, tx: DB | Transaction = operationalWriteDb()) {
    const existing = await this.getSettings(tx);
    if (existing) {
      const [updated] = await tx
        .update(leagueSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(leagueSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await tx
        .insert(leagueSettings)
        .values({
          ...data as NewLeagueSettings,
          updatedAt: new Date(),
        })
        .returning();
      return inserted;
    }
  }

  /**
   * @deprecated Usar updateLeagueSettings
   */
  async toggleOverride(newState: boolean, tx: DB | Transaction = operationalWriteDb()) {
    const existing = await this.getSettings(tx);
    if (existing) {
      await tx
        .update(leagueSettings)
        .set({ isManualOverride: newState, updatedAt: new Date() })
        .where(eq(leagueSettings.id, existing.id));
    } else {
      await tx.insert(leagueSettings).values({
        isManualOverride: newState,
        updatedAt: new Date(),
      });
    }
  }
}

export const settingsRepository = new SettingsRepository();

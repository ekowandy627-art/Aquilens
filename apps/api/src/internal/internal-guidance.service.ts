import { HttpException, Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { guidanceDemoStore } from "../standards/guidance-demo.store";
import type { GuidancePackRecord } from "../standards/guidance.types";

export type GuidancePackSummary = {
  id: string;
  slug: string;
  name: string;
  packType: string;
  sector: string[];
  jurisdiction: string[];
  versionLabel: string;
  effectiveDate: string;
  summary: string;
  isActive: boolean;
};

@Injectable()
export class InternalGuidanceService {
  listPacks(): GuidancePackSummary[] {
    return guidanceDemoStore.listAllPacks().map((pack) => this.toSummary(pack));
  }

  async listPacksAsync(): Promise<GuidancePackSummary[]> {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return this.listPacks();
    }

    const { data, error } = await supabase
      .from("guidance_packs")
      .select(
        "id, slug, name, pack_type, sector, jurisdiction, version_label, effective_date, summary, is_active",
      )
      .order("name");

    if (error) {
      throw new HttpException(error.message, 500);
    }

    if ((data ?? []).length > 0) {
      return (data ?? []).map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        name: row.name as string,
        packType: row.pack_type as string,
        sector: (row.sector as string[]) ?? [],
        jurisdiction: (row.jurisdiction as string[]) ?? [],
        versionLabel: row.version_label as string,
        effectiveDate: row.effective_date as string,
        summary: (row.summary as string) ?? "",
        isActive: Boolean(row.is_active),
      }));
    }

    return this.listPacks();
  }

  async setPackActive(packId: string, isActive: boolean) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      const updated = guidanceDemoStore.setPackActive(packId, isActive);
      if (!updated) {
        throw new HttpException("Guidance pack not found", 404);
      }
      return this.toSummary(updated);
    }

    const { data, error } = await supabase
      .from("guidance_packs")
      .update({ is_active: isActive })
      .eq("id", packId)
      .select(
        "id, slug, name, pack_type, sector, jurisdiction, version_label, effective_date, summary, is_active",
      )
      .maybeSingle();

    if (error || !data) {
      throw new HttpException(error?.message ?? "Guidance pack not found", 404);
    }

    guidanceDemoStore.setPackActive(packId, isActive);

    return {
      id: data.id as string,
      slug: data.slug as string,
      name: data.name as string,
      packType: data.pack_type as string,
      sector: (data.sector as string[]) ?? [],
      jurisdiction: (data.jurisdiction as string[]) ?? [],
      versionLabel: data.version_label as string,
      effectiveDate: data.effective_date as string,
      summary: (data.summary as string) ?? "",
      isActive: Boolean(data.is_active),
    };
  }

  private toSummary(pack: GuidancePackRecord): GuidancePackSummary {
    return {
      id: pack.id,
      slug: pack.slug,
      name: pack.name,
      packType: pack.packType,
      sector: pack.sector,
      jurisdiction: pack.jurisdiction,
      versionLabel: pack.versionLabel,
      effectiveDate: pack.effectiveDate,
      summary: pack.summary,
      isActive: pack.isActive,
    };
  }
}

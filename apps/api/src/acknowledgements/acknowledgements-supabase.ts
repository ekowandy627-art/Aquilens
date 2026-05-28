import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUser } from "../auth/auth.types";
import { computeAssignmentStatus } from "./acknowledgement-status";

export type SupabaseCampaignRow = {
  id: string;
  tenant_id: string;
  process_id: string;
  process_version_id: string;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
};

export type SupabaseAssignmentRow = {
  id: string;
  tenant_id: string;
  campaign_id: string;
  user_id: string;
  status: string;
  due_date: string | null;
};

export async function insertCampaign(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    processId: string;
    processVersionId: string;
    userIds: string[];
    dueDate?: string;
    createdBy?: string;
  },
) {
  const { data: campaign, error: campaignError } = await supabase
    .from("sop_acknowledgement_campaigns")
    .insert({
      tenant_id: input.tenantId,
      process_id: input.processId,
      process_version_id: input.processVersionId,
      due_date: input.dueDate ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (campaignError || !campaign) {
    throw new Error(campaignError?.message ?? "Failed to create acknowledgement campaign.");
  }

  const assignmentRows = input.userIds.map((userId) => ({
    tenant_id: input.tenantId,
    campaign_id: campaign.id,
    user_id: userId,
    status: "pending",
    due_date: input.dueDate ?? null,
  }));

  const { data: assignments, error: assignmentError } = await supabase
    .from("sop_acknowledgement_assignments")
    .insert(assignmentRows)
    .select("*");

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  for (const userId of input.userIds) {
    const { data: existing } = await supabase
      .from("process_version_people")
      .select("id")
      .eq("process_version_id", input.processVersionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("process_version_people").insert({
        process_version_id: input.processVersionId,
        user_id: userId,
        role: "viewer",
      });
    }
  }

  return { campaign: campaign as SupabaseCampaignRow, assignments: (assignments ?? []) as SupabaseAssignmentRow[] };
}

export async function listAssignmentsForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("sop_acknowledgement_assignments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SupabaseAssignmentRow[];
}

export async function getAssignment(
  supabase: SupabaseClient,
  tenantId: string,
  assignmentId: string,
) {
  const { data, error } = await supabase
    .from("sop_acknowledgement_assignments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SupabaseAssignmentRow | null) ?? null;
}

export async function getCampaign(
  supabase: SupabaseClient,
  campaignId: string,
) {
  const { data, error } = await supabase
    .from("sop_acknowledgement_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SupabaseCampaignRow | null) ?? null;
}

export async function listCampaignsForProcess(
  supabase: SupabaseClient,
  tenantId: string,
  processId: string,
) {
  const { data, error } = await supabase
    .from("sop_acknowledgement_campaigns")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("process_id", processId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SupabaseCampaignRow[];
}

export async function listAssignmentsForCampaign(
  supabase: SupabaseClient,
  campaignId: string,
) {
  const { data, error } = await supabase
    .from("sop_acknowledgement_assignments")
    .select("*")
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SupabaseAssignmentRow[];
}

export async function confirmAssignment(
  supabase: SupabaseClient,
  user: AuthUser,
  assignment: SupabaseAssignmentRow,
  input: { userAgent?: string; processVersionId?: string },
) {
  const campaign = await getCampaign(supabase, assignment.campaign_id);
  if (!campaign) {
    return { error: "NOT_FOUND" as const };
  }

  if (
    input.processVersionId &&
    input.processVersionId !== campaign.process_version_id
  ) {
    return { error: "VERSION_MISMATCH" as const };
  }

  const { data: existing } = await supabase
    .from("sop_acknowledgements")
    .select("*")
    .eq("assignment_id", assignment.id)
    .maybeSingle();

  if (existing) {
    return { acknowledgement: existing, assignment };
  }

  const acknowledgedAt = new Date().toISOString();
  const { data: acknowledgement, error: ackError } = await supabase
    .from("sop_acknowledgements")
    .insert({
      tenant_id: user.tenantId,
      assignment_id: assignment.id,
      process_version_id: campaign.process_version_id,
      user_id: user.id,
      acknowledged_at: acknowledgedAt,
      user_agent: input.userAgent ?? null,
    })
    .select("*")
    .single();

  if (ackError || !acknowledgement) {
    throw new Error(ackError?.message ?? "Failed to record acknowledgement.");
  }

  await supabase
    .from("sop_acknowledgement_assignments")
    .update({ status: "completed" })
    .eq("id", assignment.id);

  return {
    acknowledgement,
    assignment: { ...assignment, status: "completed" },
    campaign,
  };
}

export function resolveAssignmentStatus(
  row: SupabaseAssignmentRow,
  campaignDueDate?: string | null,
) {
  return computeAssignmentStatus(
    row.status as "pending" | "completed",
    row.due_date ?? campaignDueDate,
  );
}

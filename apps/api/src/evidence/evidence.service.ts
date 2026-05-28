import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { evidenceDemoStore } from "./evidence-demo.store";
import { EvidenceError } from "./evidence.errors";
import { workflowDemoStore } from "../workflows/workflow-demo.store";

const SIGNED_URL_TTL_MS = 15 * 60 * 1000;
const DEMO_STORAGE_BASE = "https://demo.storage.aquilens.local";

export type EvidenceRecord = {
  id: string;
  workflowInstanceId: string;
  workflowTaskId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
};

export type UploadEvidenceInput = {
  filename: string;
  fileType: string;
  buffer: Buffer;
  notes?: string;
};

@Injectable()
export class EvidenceService {
  computeChecksum(buffer: Buffer) {
    return createHash("sha256").update(buffer).digest("hex");
  }

  buildStoragePath(tenantId: string, taskId: string, filename: string) {
    return `${tenantId}/evidence/${taskId}/${filename}`;
  }

  async listForTask(user: AuthUser, workflowId: string, taskId: string) {
    await this.assertTaskAccess(user, workflowId, taskId);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return evidenceDemoStore
        .listForTask(taskId)
        .map((row) => this.toEvidenceRecord(row));
    }

    const { data, error } = await supabase
      .from("workflow_task_evidence")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("workflow_instance_id", workflowId)
      .eq("workflow_task_id", taskId)
      .order("uploaded_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toEvidenceRecordFromRow(row));
  }

  async upload(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    input: UploadEvidenceInput,
  ) {
    const task = await this.assertTaskAccess(user, workflowId, taskId);
    if (!input.filename?.trim()) {
      throw new EvidenceError("INVALID_UPLOAD", "Filename is required.");
    }
    if (!input.buffer.length) {
      throw new EvidenceError("INVALID_UPLOAD", "File content is required.");
    }

    const checksum = this.computeChecksum(input.buffer);
    const storagePath = this.buildStoragePath(
      user.tenantId,
      taskId,
      input.filename.trim(),
    );
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      const row = evidenceDemoStore.create({
        tenantId: user.tenantId,
        workflowInstanceId: workflowId,
        workflowTaskId: taskId,
        filename: input.filename.trim(),
        fileType: input.fileType || "application/octet-stream",
        fileSize: input.buffer.length,
        storagePath,
        checksum,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
        notes: input.notes?.trim() || undefined,
      });
      return this.toEvidenceRecord(row);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("workflow_task_evidence")
      .insert({
        id,
        tenant_id: user.tenantId,
        workflow_instance_id: workflowId,
        workflow_task_id: taskId,
        filename: input.filename.trim(),
        file_type: input.fileType || "application/octet-stream",
        file_size: input.buffer.length,
        storage_path: storagePath,
        checksum,
        uploaded_by: user.id,
        uploaded_at: now,
        notes: input.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.toEvidenceRecordFromRow(data);
  }

  async getDownloadUrl(user: AuthUser, evidenceId: string) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      const row = evidenceDemoStore.get(evidenceId);
      if (!row || row.tenantId !== user.tenantId) {
        throw new EvidenceError("NOT_FOUND", "Evidence not found.");
      }
      return this.buildDemoSignedUrl(row.storagePath);
    }

    const { data, error } = await supabase
      .from("workflow_task_evidence")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", evidenceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new EvidenceError("NOT_FOUND", "Evidence not found.");
    }

    const storage = supabase.storage.from("aquilens-evidence");
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_MS).toISOString();
    const { data: signed, error: signError } = await storage.createSignedUrl(
      data.storage_path as string,
      SIGNED_URL_TTL_MS / 1000,
    );

    if (signError || !signed?.signedUrl) {
      return this.buildDemoSignedUrl(data.storage_path as string);
    }

    return { signedUrl: signed.signedUrl, expiresAt };
  }

  async assertEvidencePresentIfRequired(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    evidenceRequired: boolean,
  ) {
    if (!evidenceRequired) {
      return;
    }

    const count = await this.countForTask(user, workflowId, taskId);
    if (count < 1) {
      throw new EvidenceError(
        "EVIDENCE_REQUIRED",
        "Evidence is required before this task can be completed.",
      );
    }
  }

  async countForTask(user: AuthUser, workflowId: string, taskId: string) {
    await this.assertTaskAccess(user, workflowId, taskId);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return evidenceDemoStore.countForTask(taskId);
    }

    const { count, error } = await supabase
      .from("workflow_task_evidence")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.tenantId)
      .eq("workflow_instance_id", workflowId)
      .eq("workflow_task_id", taskId);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  private async assertTaskAccess(
    user: AuthUser,
    workflowId: string,
    taskId: string,
  ) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      const instance = workflowDemoStore.getInstance(user.tenantId, workflowId);
      if (!instance) {
        throw new EvidenceError("NOT_FOUND", "Workflow not found.");
      }
      const task = workflowDemoStore.getTask(user.tenantId, workflowId, taskId);
      if (!task) {
        throw new EvidenceError("NOT_FOUND", "Task not found.");
      }
      return task;
    }

    const { data: instance } = await supabase
      .from("workflow_instances")
      .select("id")
      .eq("tenant_id", user.tenantId)
      .eq("id", workflowId)
      .maybeSingle();

    if (!instance) {
      throw new EvidenceError("NOT_FOUND", "Workflow not found.");
    }

    const { data: task } = await supabase
      .from("workflow_tasks")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("workflow_instance_id", workflowId)
      .eq("id", taskId)
      .maybeSingle();

    if (!task) {
      throw new EvidenceError("NOT_FOUND", "Task not found.");
    }

    return task;
  }

  private buildDemoSignedUrl(storagePath: string) {
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_MS).toISOString();
    const token = createHash("sha256")
      .update(`${storagePath}:${expiresAt}`)
      .digest("hex")
      .slice(0, 16);
    return {
      signedUrl: `${DEMO_STORAGE_BASE}/${storagePath}?token=${token}`,
      expiresAt,
    };
  }

  private toEvidenceRecord(row: {
    id: string;
    workflowInstanceId: string;
    workflowTaskId: string;
    filename: string;
    fileType: string;
    fileSize: number;
    checksum: string;
    uploadedBy: string;
    uploadedAt: string;
    notes?: string;
  }): EvidenceRecord {
    return {
      id: row.id,
      workflowInstanceId: row.workflowInstanceId,
      workflowTaskId: row.workflowTaskId,
      filename: row.filename,
      fileType: row.fileType,
      fileSize: row.fileSize,
      checksum: row.checksum,
      uploadedBy: row.uploadedBy,
      uploadedAt: row.uploadedAt,
      notes: row.notes,
    };
  }

  private toEvidenceRecordFromRow(row: Record<string, unknown>): EvidenceRecord {
    return {
      id: row.id as string,
      workflowInstanceId: row.workflow_instance_id as string,
      workflowTaskId: row.workflow_task_id as string,
      filename: row.filename as string,
      fileType: row.file_type as string,
      fileSize: row.file_size as number,
      checksum: row.checksum as string,
      uploadedBy: (row.uploaded_by as string) ?? "",
      uploadedAt: row.uploaded_at as string,
      notes: (row.notes as string) ?? undefined,
    };
  }
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProcessPersonRole } from "@/lib/execution-schedule";

export type TenantUserOption = {
  id: string;
  full_name: string;
  email: string;
};

export type PeopleAssignment = {
  userId: string;
  role: ProcessPersonRole;
};

type ProcessPeoplePanelProps = {
  users: TenantUserOption[];
  ownerUserId: string;
  editors: string[];
  viewers: string[];
  readOnly?: boolean;
  onOwnerChange: (userId: string) => void;
  onEditorsChange: (userIds: string[]) => void;
  onViewersChange: (userIds: string[]) => void;
};

export function buildPeoplePayload(
  ownerUserId: string,
  editors: string[],
  viewers: string[],
): PeopleAssignment[] {
  const people: PeopleAssignment[] = [];

  if (ownerUserId) {
    people.push({ userId: ownerUserId, role: "owner" });
  }

  for (const userId of editors) {
    if (userId && userId !== ownerUserId) {
      people.push({ userId, role: "editor" });
    }
  }

  for (const userId of viewers) {
    if (userId && userId !== ownerUserId && !editors.includes(userId)) {
      people.push({ userId, role: "viewer" });
    }
  }

  return people;
}

export function ProcessPeoplePanel({
  users,
  ownerUserId,
  editors,
  viewers,
  readOnly = false,
  onOwnerChange,
  onEditorsChange,
  onViewersChange,
}: ProcessPeoplePanelProps) {
  return (
    <div className="grid gap-6">
      <div className="rounded-md border border-border bg-surface-bg/40 p-4 text-sm text-text-muted">
        Process owners can assign editors and viewers for this SOP only. Editors
        can change the draft. Viewers can read it. Tenant user invites remain a
        Super Admin task.
      </div>

      <Field label="Process owner">
        {readOnly ? (
          <div>{labelForUser(users, ownerUserId)}</div>
        ) : (
          <select
            value={ownerUserId}
            onChange={(event) => onOwnerChange(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
          >
            <option value="">Select owner…</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
        )}
      </Field>

      <AssignmentList
        label="Editors"
        emptyLabel="No editors assigned"
        users={users}
        selected={editors}
        readOnly={readOnly}
        exclude={[ownerUserId, ...viewers]}
        onChange={onEditorsChange}
      />

      <AssignmentList
        label="Viewers"
        emptyLabel="No viewers assigned"
        users={users}
        selected={viewers}
        readOnly={readOnly}
        exclude={[ownerUserId, ...editors]}
        onChange={onViewersChange}
      />
    </div>
  );
}

function AssignmentList({
  label,
  emptyLabel,
  users,
  selected,
  readOnly,
  exclude,
  onChange,
}: {
  label: string;
  emptyLabel: string;
  users: TenantUserOption[];
  selected: string[];
  readOnly?: boolean;
  exclude: string[];
  onChange: (userIds: string[]) => void;
}) {
  const available = users.filter((user) => !exclude.includes(user.id));

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium text-slate-950">{label}</div>
      {selected.length === 0 ? (
        <div className="text-sm text-text-muted">{emptyLabel}</div>
      ) : (
        <div className="space-y-2">
          {selected.map((userId) => (
            <div
              key={userId}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>{labelForUser(users, userId)}</span>
              {!readOnly ? (
                <button
                  type="button"
                  className="rounded-md p-1 text-text-muted hover:bg-red-50 hover:text-red-600"
                  onClick={() => onChange(selected.filter((id) => id !== userId))}
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!readOnly ? (
        <div className="flex gap-2">
          <select
            id={`${label}-picker`}
            defaultValue=""
            className="h-10 flex-1 rounded-md border border-border bg-white px-3 text-sm"
            onChange={(event) => {
              const value = event.target.value;
              if (value && !selected.includes(value)) {
                onChange([...selected, value]);
              }
              event.currentTarget.value = "";
            }}
          >
            <option value="">Add {label.toLowerCase()}…</option>
            {available.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
          <div className="grid size-10 place-items-center rounded-md border border-dashed border-border text-text-muted">
            <Plus className="size-4" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function labelForUser(users: TenantUserOption[], userId: string) {
  const user = users.find((candidate) => candidate.id === userId);
  return user ? `${user.full_name} (${user.email})` : userId || "Unassigned";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-950">{label}</span>
      {children}
    </label>
  );
}

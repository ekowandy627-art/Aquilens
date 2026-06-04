"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";

type TrainingAssignment = {
  id: string;
  title: string;
  mode: "acknowledge_only" | "assessed";
  status: string;
  dueDate?: string;
};

export default function MyTrainingPage() {
  const [items, setItems] = useState<TrainingAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<TrainingAssignment[]>("/training/my");
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load training",
          );
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function acknowledge(id: string) {
    await apiFetch(`/training/assignments/${id}/acknowledge`, { method: "POST" });
    const data = await apiFetch<TrainingAssignment[]>("/training/my");
    setItems(data);
  }

  return (
    <>
      <PageHeader
        title="My Training"
        description="Complete assigned training modules — acknowledge-only or assessed quizzes."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.mode === "assessed" ? "Assessed quiz" : "Acknowledge only"} · {item.status}
                </p>
              </div>
              {item.status === "pending" && item.mode === "acknowledge_only" ? (
                <PrimaryButton onClick={() => void acknowledge(item.id)}>
                  Acknowledge
                </PrimaryButton>
              ) : item.status === "pending" && item.mode === "assessed" ? (
                <Link href={`/my-training/${item.id}`}>
                  <PrimaryButton>Start quiz</PrimaryButton>
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

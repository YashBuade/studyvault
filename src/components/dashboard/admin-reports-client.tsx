"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Select } from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/toast-provider";

type Report = {
  id: number;
  reason: string;
  details?: string | null;
  status: "PENDING" | "REVIEWED" | "REJECTED";
  createdAt: string;
  note: { id: number; title: string; isPublic: boolean; slug?: string | null };
  reporter: { name: string; email: string };
};

type ApiResponse<T> = { ok: boolean; data?: T };

export function AdminReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/reports");
      const payload = (await response.json()) as ApiResponse<Report[]>;
      if (response.ok && payload.ok && payload.data) {
        setReports(payload.data);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function updateReport(id: number, status: Report["status"], action: "HIDE_NOTE" | "DELETE_NOTE" | "NONE") {
    const response = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, action }),
    });
    if (response.ok) {
      setReports((prev) => prev.map((report) => (report.id === id ? { ...report, status } : report)));
      pushToast("Report updated", "success");
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Reports queue</p>
          <p className="text-xs text-[var(--muted)]">Review abuse reports and take action.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No reports pending.</p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{report.note.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Reported by {report.reporter.name} ({report.reporter.email})
                  </p>
                  <p className="text-xs text-[var(--muted)]">Reason: {report.reason}</p>
                  {report.details ? <p className="text-xs text-[var(--muted)]">Details: {report.details}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    label="Status"
                    value={report.status}
                    onChange={(event) => updateReport(report.id, event.target.value as Report["status"], "NONE")}
                    options={[
                      { label: "Pending", value: "PENDING" },
                      { label: "Reviewed", value: "REVIEWED" },
                      { label: "Rejected", value: "REJECTED" },
                    ]}
                  />
                  <Button variant="secondary" onClick={() => updateReport(report.id, "REVIEWED", "HIDE_NOTE")}>
                    Hide note
                  </Button>
                  <Button variant="danger" onClick={() => updateReport(report.id, "REVIEWED", "DELETE_NOTE")}>
                    Delete note
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

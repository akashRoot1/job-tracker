"use client";

import type { ApplicationStatus } from "@prisma/client";
import { CalendarClock, RotateCcw, Trash2, XCircle } from "lucide-react";

export function ApplicationActions({ id }: { id: string }) {
  async function mark(status: ApplicationStatus) {
    await fetch(`/api/applications/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    window.location.reload();
  }

  async function rescan() {
    await fetch(`/api/applications/${id}/rescan`, { method: "POST" });
    window.location.reload();
  }

  async function remove() {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    window.location.href = "/applications";
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-secondary" onClick={() => mark("REJECTED")}><XCircle className="h-4 w-4" /> Mark rejected</button>
      <button className="btn-secondary" onClick={() => mark("INTERVIEW_SCHEDULED")}><CalendarClock className="h-4 w-4" /> Mark interview</button>
      <button className="btn-secondary" onClick={rescan}><RotateCcw className="h-4 w-4" /> Rescan thread</button>
      <button className="btn-danger" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</button>
    </div>
  );
}

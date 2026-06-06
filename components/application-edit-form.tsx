"use client";

import { useState } from "react";

type EditableApplication = {
  id: string;
  company: string;
  position: string;
  notes: string | null;
  rejectionReason: string | null;
  interviewDate: Date | null;
};

export function ApplicationEditForm({ application }: { application: EditableApplication }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: String(form.get("company")),
        position: String(form.get("position")),
        notes: String(form.get("notes") ?? ""),
        rejectionReason: String(form.get("rejectionReason") ?? "") || null,
        interviewDate: String(form.get("interviewDate") ?? "") || null
      })
    });
    window.location.reload();
  }

  if (!open) {
    return <button className="btn-secondary" onClick={() => setOpen(true)}>Edit manually</button>;
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4">
      <h2 className="text-lg font-bold">Edit application</h2>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <label className="grid gap-1 text-sm font-semibold">Company<input className="input" name="company" defaultValue={application.company} required /></label>
        <label className="grid gap-1 text-sm font-semibold">Position<input className="input" name="position" defaultValue={application.position} required /></label>
        <label className="grid gap-1 text-sm font-semibold">Rejection reason<input className="input" name="rejectionReason" defaultValue={application.rejectionReason ?? ""} /></label>
        <label className="grid gap-1 text-sm font-semibold">Interview date<input className="input" name="interviewDate" type="datetime-local" defaultValue={formatDateInput(application.interviewDate)} /></label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">Notes<textarea className="input min-h-24" name="notes" defaultValue={application.notes ?? ""} /></label>
      <div className="flex gap-2">
        <button className="btn" disabled={saving}>{saving ? "Saving" : "Save changes"}</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

function formatDateInput(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

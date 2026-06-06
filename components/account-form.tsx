"use client";

import { EmailProvider } from "@prisma/client";
import { useState } from "react";

export function AccountForm() {
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState<EmailProvider>("MOCK");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, provider })
    });
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-4">
      <h2 className="text-lg font-bold">Add local/mock account</h2>
      <div className="grid grid-cols-[1fr_180px_auto] gap-3 max-md:grid-cols-1">
        <input className="input" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" />
        <select className="input" value={provider} onChange={event => setProvider(event.target.value as EmailProvider)}>
          <option value="MOCK">Mock / Demo</option>
          <option value="GMAIL">Gmail record</option>
          <option value="OUTLOOK">Outlook record</option>
          <option value="IMAP">IMAP record</option>
        </select>
        <button className="btn" disabled={saving}>{saving ? "Adding" : "Add Account"}</button>
      </div>
    </form>
  );
}

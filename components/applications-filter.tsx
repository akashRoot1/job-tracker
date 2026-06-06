"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ApplicationsFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "ALL");

  function apply(event: React.FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status !== "ALL") next.set("status", status);
    router.push(`/applications?${next.toString()}`);
  }

  return (
    <form onSubmit={apply} className="card flex gap-3 p-3 max-md:flex-col">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input className="input w-full pl-9" value={q} onChange={event => setQ(event.target.value)} placeholder="Search company, position, recruiter, source" />
      </div>
      <select className="input w-64 max-md:w-full" value={status} onChange={event => setStatus(event.target.value)}>
        <option value="ALL">All statuses</option>
        <option value="APPLIED">Applied</option>
        <option value="APPLICATION_RECEIVED">Application Received</option>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="RECRUITER_CALL">Recruiter Call</option>
        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
        <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
        <option value="HR_INTERVIEW">HR Interview</option>
        <option value="ASSESSMENT_TEST">Assessment / Test</option>
        <option value="OFFER">Offer</option>
        <option value="REJECTED">Rejected</option>
        <option value="NEEDS_REVIEW">Needs Review</option>
      </select>
      <button className="btn">Apply</button>
    </form>
  );
}

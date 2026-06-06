import type { ApplicationStatus } from "@prisma/client";

const styles: Record<ApplicationStatus, string> = {
  APPLIED: "bg-teal-50 text-teal-800",
  APPLICATION_RECEIVED: "bg-teal-50 text-teal-800",
  UNDER_REVIEW: "bg-blue-50 text-blue-800",
  RECRUITER_CALL: "bg-indigo-50 text-indigo-800",
  INTERVIEW_SCHEDULED: "bg-indigo-50 text-indigo-800",
  TECHNICAL_INTERVIEW: "bg-violet-50 text-violet-800",
  HR_INTERVIEW: "bg-purple-50 text-purple-800",
  ASSESSMENT_TEST: "bg-amber-50 text-amber-800",
  OFFER: "bg-green-50 text-green-800",
  REJECTED: "bg-red-50 text-red-800",
  WITHDRAWN: "bg-slate-100 text-slate-700",
  NEEDS_REVIEW: "bg-orange-50 text-orange-800"
};

export function statusLabel(status: ApplicationStatus) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`badge ${styles[status]}`}>{statusLabel(status)}</span>;
}

import Link from "next/link";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationsFilter } from "@/components/applications-filter";
import { StatusBadge } from "@/components/status-badge";

export default async function ApplicationsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getDemoUser();
  const params = await searchParams;
  const q = params.q?.trim();
  const status = params.status;
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: user.id,
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { company: { contains: q, mode: "insensitive" } },
              { position: { contains: q, mode: "insensitive" } },
              { recruiterEmail: { contains: q, mode: "insensitive" } },
              { source: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: { account: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-3xl font-black">Applications</h1>
        <p className="mt-2 text-muted">Search and filter every company, position, status, recruiter, source, and account update.</p>
      </header>
      <ApplicationsFilter />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied From Email</th>
                <th className="px-4 py-3">Applied Date</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3">Rejection Reason</th>
                <th className="px-4 py-3">Interview Date</th>
                <th className="px-4 py-3">Recruiter / Sender</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applications.map(app => (
                <tr key={app.id} className="align-top">
                  <td className="px-4 py-3 font-bold">{app.company}</td>
                  <td className="px-4 py-3">{app.position}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3">{app.account?.email ?? "-"}</td>
                  <td className="px-4 py-3">{app.appliedDate?.toLocaleDateString() ?? "-"}</td>
                  <td className="px-4 py-3">{app.lastEmailDate?.toLocaleDateString() ?? app.updatedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">{app.rejectionReason ?? "-"}</td>
                  <td className="px-4 py-3">{app.interviewDate?.toLocaleString() ?? "-"}</td>
                  <td className="px-4 py-3">{app.recruiterEmail ?? app.senderEmail ?? "-"}</td>
                  <td className="px-4 py-3">{app.source ?? "-"}</td>
                  <td className="max-w-xs px-4 py-3 text-muted">{app.notes ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/applications/${app.id}`} className="btn-secondary">View details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 ? <div className="p-6 text-center text-muted">No applications found.</div> : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

export default async function ManualReviewPage() {
  const user = await getDemoUser();
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: user.id,
      OR: [{ needsReview: true }, { status: "NEEDS_REVIEW" }]
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-3xl font-black">Manual Review</h1>
        <p className="mt-2 text-muted">Low-confidence or ambiguous emails land here so you can correct company, position, and status without losing the email history.</p>
      </header>

      <section className="grid gap-3">
        {applications.map(app => (
          <Link key={app.id} href={`/applications/${app.id}`} className="card grid grid-cols-[1fr_auto] gap-3 p-4 hover:bg-slate-50 max-md:grid-cols-1">
            <div>
              <h2 className="text-lg font-bold">{app.company}</h2>
              <p className="text-muted">{app.position}</p>
              <p className="mt-2 text-sm text-muted">{app.notes}</p>
            </div>
            <div className="text-right max-md:text-left">
              <StatusBadge status={app.status} />
              <p className="mt-2 text-sm text-muted">Confidence {Math.round(app.confidence * 100)}%</p>
            </div>
          </Link>
        ))}
        {applications.length === 0 ? <div className="card p-6 text-center text-muted">Nothing needs review right now.</div> : null}
      </section>
    </div>
  );
}

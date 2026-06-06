import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationActions } from "@/components/application-actions";
import { ApplicationEditForm } from "@/components/application-edit-form";
import { StatusBadge } from "@/components/status-badge";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    include: {
      updates: {
        include: { emailMessage: true, account: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!application) notFound();

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-4 max-md:flex-col">
        <div>
          <Link href="/applications" className="text-sm font-bold text-ocean">Back to applications</Link>
          <h1 className="mt-2 text-3xl font-black">{application.company}</h1>
          <p className="text-lg text-muted">{application.position}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <ApplicationActions id={application.id} />
      <ApplicationEditForm application={application} />

      <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <div className="card p-4">
          <h2 className="font-bold">Application details</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Applied from" value={application.senderEmail ?? "-"} />
            <Row label="Applied date" value={application.appliedDate?.toLocaleString() ?? "-"} />
            <Row label="Last email date" value={application.lastEmailDate?.toLocaleString() ?? "-"} />
            <Row label="Source" value={application.source ?? "-"} />
            <Row label="Original subject" value={application.originalSubject ?? "-"} />
            <Row label="Confidence" value={`${Math.round(application.confidence * 100)}%`} />
          </dl>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">Rejection / interview</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Rejection reason" value={application.rejectionReason ?? "-"} />
            <Row label="Interview date" value={application.interviewDate?.toLocaleString() ?? "-"} />
            <Row label="Interview type" value={application.interviewType ?? "-"} />
            <Row label="Contact person" value={application.contactPerson ?? "-"} />
            <Row label="Meeting link" value={application.meetingLink ?? "-"} />
          </dl>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">Notes</h2>
          <p className="mt-3 text-sm text-muted">{application.notes ?? "No notes yet."}</p>
          {application.originalUrl ? <a className="mt-3 inline-block text-sm font-bold text-ocean" href={application.originalUrl}>Open original email</a> : null}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-lg font-bold">Update history</h2>
        <div className="grid gap-3">
          {application.updates.map(update => (
            <article key={update.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
                <StatusBadge status={update.status} />
                <span className="text-sm text-muted">{update.createdAt.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm">{update.summary}</p>
              <p className="mt-1 text-xs text-muted">
                {update.account?.email ?? "Manual"} {update.emailMessage?.subject ? `- ${update.emailMessage.subject}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="break-words font-semibold">{value}</dd>
    </div>
  );
}

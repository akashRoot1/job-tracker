import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, CheckCircle, Clock, Mail, PhoneCall, XCircle } from "lucide-react";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScanButton } from "@/components/scan-button";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const user = await getDemoUser();
  const [applications, accounts, recentUpdates] = await Promise.all([
    prisma.jobApplication.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.connectedEmailAccount.findMany({ where: { userId: user.id }, orderBy: { email: "asc" } }),
    prisma.applicationUpdate.findMany({
      where: { application: { userId: user.id } },
      include: { application: true, account: true },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const counts = {
    total: applications.length,
    applied: applications.filter(app => ["APPLIED", "APPLICATION_RECEIVED"].includes(app.status)).length,
    underReview: applications.filter(app => ["UNDER_REVIEW", "ASSESSMENT_TEST"].includes(app.status)).length,
    interviews: applications.filter(app => ["RECRUITER_CALL", "INTERVIEW_SCHEDULED", "TECHNICAL_INTERVIEW", "HR_INTERVIEW"].includes(app.status)).length,
    rejected: applications.filter(app => app.status === "REJECTED").length,
    offers: applications.filter(app => app.status === "OFFER").length,
    needsReview: applications.filter(app => app.needsReview || app.status === "NEEDS_REVIEW").length
  };

  const metrics = [
    { label: "Total applications", value: counts.total, icon: BriefcaseBusiness },
    { label: "Applied", value: counts.applied, icon: Mail },
    { label: "Under review", value: counts.underReview, icon: Clock },
    { label: "Interviews", value: counts.interviews, icon: PhoneCall },
    { label: "Rejections", value: counts.rejected, icon: XCircle },
    { label: "Offers", value: counts.offers, icon: CheckCircle },
    { label: "Needs review", value: counts.needsReview, icon: AlertTriangle }
  ];

  return (
    <div className="grid gap-6">
      <header className="flex items-start justify-between gap-4 max-md:flex-col">
        <div>
          <p className="text-sm font-bold uppercase text-ocean">Auto-updating job search command center</p>
          <h1 className="mt-1 text-3xl font-black">Application Dashboard</h1>
          <p className="mt-2 max-w-3xl text-muted">Scan Gmail, Outlook, recruiter, ATS, job board, and sent-application emails. Track QA, automation, performance testing, data analyst, and software testing roles without sharing passwords.</p>
        </div>
        <ScanButton />
      </header>

      <section className="grid grid-cols-7 gap-3 max-xl:grid-cols-4 max-md:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map(metric => (
          <div key={metric.label} className="card p-4">
            <metric.icon className="h-5 w-5 text-ocean" />
            <div className="mt-3 text-3xl font-black">{metric.value}</div>
            <div className="text-sm text-muted">{metric.label}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-[1.1fr_.9fr] gap-4 max-lg:grid-cols-1">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent updates</h2>
            <Link href="/applications" className="text-sm font-bold text-ocean">View all</Link>
          </div>
          <div className="grid gap-3">
            {recentUpdates.length === 0 ? <p className="text-sm text-muted">No updates yet. Add an account and run Scan Now.</p> : null}
            {recentUpdates.map(update => (
              <Link key={update.id} href={`/applications/${update.applicationId}`} className="rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <strong>{update.application.company}</strong>
                  <StatusBadge status={update.status} />
                </div>
                <p className="mt-1 text-sm text-muted">{update.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-lg font-bold">Applications by email account</h2>
          <div className="grid gap-3">
            {accounts.length === 0 ? <p className="text-sm text-muted">No email accounts connected.</p> : null}
            {accounts.map(account => (
              <div key={account.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="break-all">{account.email}</strong>
                  <span className="badge bg-slate-100 text-slate-700">{account.provider}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-muted">Last scan</dt><dd>{account.lastScanAt ? account.lastScanAt.toLocaleString() : "Never"}</dd></div>
                  <div><dt className="text-muted">Emails scanned</dt><dd>{account.lastScanEmails}</dd></div>
                  <div><dt className="text-muted">New apps</dt><dd>{account.lastScanNewApps}</dd></div>
                  <div><dt className="text-muted">Updates</dt><dd>{account.lastScanUpdates}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const byStatus = Object.fromEntries(Object.values(ApplicationStatus).map(status => [status, 0]));
  for (const app of applications) byStatus[app.status] += 1;

  return NextResponse.json({
    totals: {
      total: applications.length,
      applied: byStatus.APPLIED + byStatus.APPLICATION_RECEIVED,
      underReview: byStatus.UNDER_REVIEW + byStatus.ASSESSMENT_TEST,
      interviews: byStatus.RECRUITER_CALL + byStatus.INTERVIEW_SCHEDULED + byStatus.TECHNICAL_INTERVIEW + byStatus.HR_INTERVIEW,
      rejections: byStatus.REJECTED,
      offers: byStatus.OFFER,
      needsReview: applications.filter(app => app.needsReview || app.status === "NEEDS_REVIEW").length
    },
    byAccount: accounts.map(account => ({
      email: account.email,
      provider: account.provider,
      lastScanAt: account.lastScanAt,
      emailsScanned: account.lastScanEmails,
      newApplications: account.lastScanNewApps,
      updatesFound: account.lastScanUpdates,
      errors: account.lastScanErrors,
      count: applications.filter(app => app.accountId === account.id).length
    })),
    byCompany: Object.entries(
      applications.reduce<Record<string, number>>((acc, app) => {
        acc[app.company] = (acc[app.company] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count),
    recentUpdates
  });
}

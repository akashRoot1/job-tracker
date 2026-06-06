import fs from "node:fs";
import path from "node:path";
import { ApplicationStatus } from "@prisma/client";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function label(status: ApplicationStatus) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char] ?? char));
}

async function main() {
  const user = await getDemoUser();
  const [applications, accounts, scanLogs] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId: user.id },
      include: { account: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.connectedEmailAccount.findMany({
      where: { userId: user.id },
      orderBy: { email: "asc" }
    }),
    prisma.scanLog.findMany({
      where: { userId: user.id },
      include: { account: true },
      orderBy: { startedAt: "desc" },
      take: 8
    })
  ]);

  const counts = {
    total: applications.length,
    applied: applications.filter(app => ["APPLIED", "APPLICATION_RECEIVED"].includes(app.status)).length,
    underReview: applications.filter(app => ["UNDER_REVIEW", "ASSESSMENT_TEST"].includes(app.status)).length,
    interviews: applications.filter(app => ["RECRUITER_CALL", "INTERVIEW_SCHEDULED", "TECHNICAL_INTERVIEW", "HR_INTERVIEW"].includes(app.status)).length,
    offers: applications.filter(app => app.status === "OFFER").length,
    rejected: applications.filter(app => app.status === "REJECTED").length,
    needsReview: applications.filter(app => app.needsReview || app.status === "NEEDS_REVIEW").length
  };

  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const dashboardUrl = `${appBaseUrl.replace(/\/$/, "")}/`;
  const applicationsUrl = `${appBaseUrl.replace(/\/$/, "")}/applications`;
  const runDate = new Date().toISOString();
  const outputDir = path.resolve("actions-output");
  fs.mkdirSync(outputDir, { recursive: true });

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Job Tracker Actions Dashboard</title>
  <style>
    body{margin:0;background:#f5f7f9;color:#17202a;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,sans-serif}
    main{max-width:1180px;margin:0 auto;padding:28px}
    h1{margin:0;font-size:30px} p{color:#607080}.grid{display:grid;gap:12px}
    .metrics{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin:22px 0}
    .card{background:#fff;border:1px solid #d9e0e8;border-radius:8px;padding:16px;box-shadow:0 10px 28px rgba(23,32,42,.06)}
    .metric strong{font-size:30px;display:block}.metric span{color:#607080}
    table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #d9e0e8;border-radius:8px;overflow:hidden}
    th,td{text-align:left;padding:10px;border-bottom:1px solid #e5eaf0;font-size:14px;vertical-align:top}
    th{background:#eef2f6;color:#526171;text-transform:uppercase;font-size:12px}
    a{color:#0b7a75;font-weight:800;text-decoration:none}.links{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
  </style>
</head>
<body>
  <main>
    <h1>Job Tracker Actions Dashboard</h1>
    <p>Generated after the GitHub Actions run at ${escapeHtml(runDate)}.</p>
    <div class="links">
      <a href="${escapeHtml(dashboardUrl)}">Open live dashboard</a>
      <a href="${escapeHtml(applicationsUrl)}">Open applications table</a>
    </div>
    <section class="grid metrics">
      ${Object.entries(counts).map(([key, value]) => `<div class="card metric"><strong>${value}</strong><span>${escapeHtml(key)}</span></div>`).join("")}
    </section>
    <section class="card">
      <h2>Connected email accounts</h2>
      <table>
        <thead><tr><th>Email</th><th>Provider</th><th>Last scan</th><th>Emails scanned</th><th>New apps</th><th>Updates</th><th>Errors</th></tr></thead>
        <tbody>
          ${accounts.map(account => `<tr><td>${escapeHtml(account.email)}</td><td>${account.provider}</td><td>${escapeHtml(account.lastScanAt?.toISOString() ?? "Never")}</td><td>${account.lastScanEmails}</td><td>${account.lastScanNewApps}</td><td>${account.lastScanUpdates}</td><td>${account.lastScanErrors}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
    <section class="card" style="margin-top:16px">
      <h2>Latest applications</h2>
      <table>
        <thead><tr><th>Company</th><th>Position</th><th>Status</th><th>Applied From</th><th>Last Updated</th><th>Rejection Reason</th><th>Interview Date</th></tr></thead>
        <tbody>
          ${applications.slice(0, 50).map(app => `<tr><td>${escapeHtml(app.company)}</td><td>${escapeHtml(app.position)}</td><td>${label(app.status)}</td><td>${escapeHtml(app.account?.email ?? "-")}</td><td>${escapeHtml(app.updatedAt.toISOString())}</td><td>${escapeHtml(app.rejectionReason ?? "-")}</td><td>${escapeHtml(app.interviewDate?.toISOString() ?? "-")}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
    <section class="card" style="margin-top:16px">
      <h2>Recent scan logs</h2>
      <table>
        <thead><tr><th>Status</th><th>Account</th><th>Started</th><th>Scanned</th><th>New Apps</th><th>Updates</th><th>Errors</th></tr></thead>
        <tbody>
          ${scanLogs.map(log => `<tr><td>${log.status}</td><td>${escapeHtml(log.account?.email ?? "All")}</td><td>${escapeHtml(log.startedAt.toISOString())}</td><td>${log.emailsScanned}</td><td>${log.newApplications}</td><td>${log.updatesFound}</td><td>${log.errors}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, "dashboard-report.html"), html);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const summary = `# Job Tracker Dashboard

## Open dashboard

- [Open live dashboard](${dashboardUrl})
- [Open applications table](${applicationsUrl})

## Latest totals

| Metric | Count |
| --- | ---: |
| Total applications | ${counts.total} |
| Applied | ${counts.applied} |
| Under review | ${counts.underReview} |
| Interviews | ${counts.interviews} |
| Offers | ${counts.offers} |
| Rejected | ${counts.rejected} |
| Needs review | ${counts.needsReview} |

## Connected email accounts

| Email | Provider | Last scan | Emails scanned | New apps | Updates | Errors |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${accounts.map(account => `| ${account.email} | ${account.provider} | ${account.lastScanAt?.toISOString() ?? "Never"} | ${account.lastScanEmails} | ${account.lastScanNewApps} | ${account.lastScanUpdates} | ${account.lastScanErrors} |`).join("\n")}

Download the \`job-tracker-dashboard\` artifact from this run to view the generated HTML report.
`;
    fs.appendFileSync(summaryPath, summary);
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    void prisma.$disconnect();
    process.exit(1);
  });

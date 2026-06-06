import Link from "next/link";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "@/components/account-form";
import { ScanButton } from "@/components/scan-button";

export default async function AccountsPage() {
  const user = await getDemoUser();
  const accounts = await prisma.connectedEmailAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-3xl font-black">Connected Email Accounts</h1>
        <p className="mt-2 text-muted">Connect every email ID you use for applications. Real Gmail and Outlook use OAuth; local mock accounts are included for development.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link className="btn" href="/api/oauth/gmail/start">Connect Gmail</Link>
        <Link className="btn" href="/api/oauth/outlook/start">Connect Outlook / Hotmail</Link>
        <ScanButton />
      </div>

      <AccountForm />

      <section className="grid gap-3">
        {accounts.map(account => (
          <article key={account.id} className="card grid grid-cols-[1fr_auto] gap-4 p-4 max-md:grid-cols-1">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-all text-lg font-bold">{account.email}</h2>
                <span className="badge bg-slate-100 text-slate-700">{account.provider}</span>
                <span className={`badge ${account.syncEnabled ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  {account.syncEnabled ? "Sync enabled" : "Sync paused"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-4 gap-3 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
                <Metric label="Last scan" value={account.lastScanAt?.toLocaleString() ?? "Never"} />
                <Metric label="Emails scanned" value={String(account.lastScanEmails)} />
                <Metric label="New applications" value={String(account.lastScanNewApps)} />
                <Metric label="Updates found" value={String(account.lastScanUpdates)} />
                <Metric label="Errors" value={String(account.lastScanErrors)} />
              </dl>
            </div>
            <ScanButton accountId={account.id} />
          </article>
        ))}
        {accounts.length === 0 ? <div className="card p-6 text-center text-muted">No accounts connected yet.</div> : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

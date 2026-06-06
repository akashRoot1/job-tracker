import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Inbox, LayoutDashboard, ListChecks, SearchCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Application Email Tracker",
  description: "Track job applications automatically from Gmail, Outlook, and recruiter emails."
};

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/accounts", label: "Email Accounts", icon: Inbox },
  { href: "/manual-review", label: "Manual Review", icon: SearchCheck }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-lg:grid-cols-1">
          <aside className="bg-slate-950 p-5 text-white">
            <Link href="/" className="mb-8 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-400 font-black text-slate-950">JT</div>
              <div>
                <div className="font-bold">Job Tracker</div>
                <div className="text-xs text-slate-400">Ireland job search inbox</div>
              </div>
            </Link>
            <nav className="grid gap-2">
              {nav.map(item => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              OAuth only. No raw email passwords are requested or stored.
            </div>
          </aside>
          <main className="min-w-0 p-6 max-sm:p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}

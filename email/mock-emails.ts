import { EmailProvider } from "@prisma/client";
import type { RawEmail } from "@/email/types";

export const mockEmails: RawEmail[] = [
  {
    provider: "MOCK",
    providerMessageId: "mock-application-confirmation",
    providerThreadId: "thread-nova-qa",
    folder: "Inbox",
    subject: "Application received for QA Automation Engineer at NovaTech Dublin",
    senderEmail: "careers@novatech.ie",
    senderName: "NovaTech Careers",
    recipientEmails: ["jobseeker@example.com"],
    receivedAt: new Date("2026-06-01T09:00:00.000Z"),
    bodyText: "Thank you for applying for the QA Automation Engineer position at NovaTech Dublin. Your application is under review.",
    snippet: "Thank you for applying for the QA Automation Engineer position."
  },
  {
    provider: "MOCK",
    providerMessageId: "mock-rejection",
    providerThreadId: "thread-cpl-data",
    folder: "Inbox",
    subject: "Update on Data Analyst role with CPL",
    senderEmail: "recruitment@cpl.ie",
    senderName: "CPL Recruitment",
    recipientEmails: ["jobseeker@example.com"],
    receivedAt: new Date("2026-06-02T12:30:00.000Z"),
    bodyText: "Unfortunately you were not shortlisted for the Data Analyst role with CPL. The hiring manager selected more experienced candidates.",
    snippet: "Unfortunately you were not shortlisted."
  },
  {
    provider: "MOCK",
    providerMessageId: "mock-interview",
    providerThreadId: "thread-reperio-performance",
    folder: "Inbox",
    subject: "Technical interview for Performance Test Engineer - Reperio",
    senderEmail: "aoife@reperio.ie",
    senderName: "Aoife Byrne",
    recipientEmails: ["jobseeker@example.com"],
    receivedAt: new Date("2026-06-03T15:45:00.000Z"),
    bodyText: "We would like to invite you to a technical interview for the Performance Test Engineer role at Reperio on 12 June 2026 at 10:30 AM. You will meet with Aoife Byrne. Join: https://teams.microsoft.com/l/meetup-join/example",
    snippet: "Technical interview for Performance Test Engineer."
  },
  {
    provider: "MOCK",
    providerMessageId: "mock-call",
    providerThreadId: "thread-solas-test-analyst",
    folder: "Inbox",
    subject: "Recruiter call for Test Analyst at Solas IT",
    senderEmail: "talent@solasit.ie",
    senderName: "Solas IT Talent",
    recipientEmails: ["jobseeker@example.com"],
    receivedAt: new Date("2026-06-04T11:15:00.000Z"),
    bodyText: "Can we schedule a recruiter call for the Test Analyst role at Solas IT on 10 June 2026 at 2:00 PM? Book here: https://calendly.com/solasit/test-analyst-call",
    snippet: "Recruiter call for Test Analyst."
  },
  {
    provider: "MOCK",
    providerMessageId: "mock-offer",
    providerThreadId: "thread-mmk-software-testing",
    folder: "Inbox",
    subject: "Offer for Software Testing Consultant at Morgan McKinley",
    senderEmail: "jobs@morganmckinley.ie",
    senderName: "Morgan McKinley Jobs",
    recipientEmails: ["jobseeker@example.com"],
    receivedAt: new Date("2026-06-05T10:00:00.000Z"),
    bodyText: "We are pleased to offer you the Software Testing Consultant role at Morgan McKinley. Congratulations.",
    snippet: "We are pleased to offer you the role."
  },
  {
    provider: EmailProvider.MOCK,
    providerMessageId: "mock-generic",
    providerThreadId: "thread-generic",
    folder: "Inbox",
    subject: "Your electricity bill is ready",
    senderEmail: "billing@exampleutility.ie",
    senderName: "Utility Billing",
    recipientEmails: ["jobseeker@example.com"],
    receivedAt: new Date("2026-06-05T11:00:00.000Z"),
    bodyText: "Your monthly electricity bill is available in your account.",
    snippet: "Monthly electricity bill."
  }
];

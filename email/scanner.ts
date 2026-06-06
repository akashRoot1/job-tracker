import { ApplicationStatus, type ConnectedEmailAccount, type EmailMessage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyJobEmailWithAiFallback } from "@/email/classifier";
import { fetchAccountMessages } from "@/email/providers";
import type { RawEmail } from "@/email/types";

const STATUS_PRIORITY: Record<ApplicationStatus, number> = {
  NEEDS_REVIEW: 5,
  APPLIED: 10,
  APPLICATION_RECEIVED: 20,
  UNDER_REVIEW: 30,
  ASSESSMENT_TEST: 40,
  RECRUITER_CALL: 50,
  INTERVIEW_SCHEDULED: 60,
  TECHNICAL_INTERVIEW: 70,
  HR_INTERVIEW: 75,
  OFFER: 95,
  REJECTED: 100,
  WITHDRAWN: 100
};

export async function scanAllAccounts(userId: string) {
  const accounts = await prisma.connectedEmailAccount.findMany({
    where: { userId, syncEnabled: true }
  });

  const results = [];
  for (const account of accounts) {
    results.push(await scanAccount(account));
  }
  return results;
}

export async function scanAccount(account: ConnectedEmailAccount) {
  const scanLog = await prisma.scanLog.create({
    data: { userId: account.userId, accountId: account.id, status: "RUNNING" }
  });

  const metrics = { emailsScanned: 0, newApplications: 0, updatesFound: 0, errors: 0 };

  try {
    const messages = await fetchAccountMessages(account);
    for (const raw of messages) {
      metrics.emailsScanned += 1;
      const result = await processRawEmail(account, raw);
      if (result === "new") metrics.newApplications += 1;
      if (result === "update") metrics.updatesFound += 1;
    }

    await prisma.connectedEmailAccount.update({
      where: { id: account.id },
      data: {
        lastScanAt: new Date(),
        lastScanEmails: metrics.emailsScanned,
        lastScanNewApps: metrics.newApplications,
        lastScanUpdates: metrics.updatesFound,
        lastScanErrors: metrics.errors
      }
    });

    return prisma.scanLog.update({
      where: { id: scanLog.id },
      data: { ...metrics, status: "SUCCESS", finishedAt: new Date(), message: "Scan completed." }
    });
  } catch (error) {
    metrics.errors += 1;
    return prisma.scanLog.update({
      where: { id: scanLog.id },
      data: {
        ...metrics,
        status: "FAILED",
        finishedAt: new Date(),
        message: error instanceof Error ? error.message : "Unknown scan error"
      }
    });
  }
}

export async function processRawEmail(account: ConnectedEmailAccount, raw: RawEmail) {
  const alreadySeen = await prisma.emailMessage.findUnique({
    where: {
      accountId_providerMessageId: {
        accountId: account.id,
        providerMessageId: raw.providerMessageId
      }
    }
  });
  if (alreadySeen) return "ignored";

  const classification = await classifyJobEmailWithAiFallback(raw.bodyText, raw.subject, raw.senderEmail);

  const message = await prisma.emailMessage.upsert({
    where: {
      accountId_providerMessageId: {
        accountId: account.id,
        providerMessageId: raw.providerMessageId
      }
    },
    update: {
      subject: raw.subject,
      senderEmail: raw.senderEmail,
      senderName: raw.senderName,
      recipientEmails: raw.recipientEmails,
      receivedAt: raw.receivedAt,
      sentAt: raw.sentAt,
      snippet: raw.snippet,
      bodyText: raw.bodyText,
      originalUrl: raw.originalUrl,
      isJobRelated: classification.isJobRelated,
      classifierConfidence: classification.confidence
    },
    create: {
      userId: account.userId,
      accountId: account.id,
      providerMessageId: raw.providerMessageId,
      providerThreadId: raw.providerThreadId,
      internetMessageId: raw.internetMessageId,
      folder: raw.folder,
      subject: raw.subject,
      senderEmail: raw.senderEmail,
      senderName: raw.senderName,
      recipientEmails: raw.recipientEmails,
      receivedAt: raw.receivedAt,
      sentAt: raw.sentAt,
      snippet: raw.snippet,
      bodyText: raw.bodyText,
      originalUrl: raw.originalUrl,
      isJobRelated: classification.isJobRelated,
      classifierConfidence: classification.confidence
    }
  });

  if (!classification.isJobRelated) return "ignored";

  const company = classification.company ?? "Needs Review";
  const position = classification.position ?? "Needs Review";
  const normalizedCompany = normalize(company);
  const normalizedPosition = normalize(position);
  const existing = await findExistingApplication(account.userId, normalizedCompany, normalizedPosition, raw.providerThreadId);
  const status = chooseStatus(existing?.status, classification.status);
  const interviewDate = classification.interviewDate ? new Date(classification.interviewDate) : undefined;

  if (!existing) {
    const application = await prisma.jobApplication.create({
      data: {
        userId: account.userId,
        accountId: account.id,
        company,
        normalizedCompany,
        position,
        normalizedPosition,
        status,
        rejectionReason: classification.rejectionReason,
        interviewDate,
        interviewType: classification.interviewType,
        meetingLink: classification.meetingLink,
        contactPerson: classification.contactPerson,
        recruiterEmail: raw.senderEmail,
        senderEmail: raw.senderEmail,
        source: classification.source,
        appliedDate: inferAppliedDate(classification.status, raw.receivedAt),
        lastEmailDate: raw.receivedAt,
        notes: classification.summary,
        originalSubject: raw.subject,
        originalUrl: raw.originalUrl,
        providerThreadId: raw.providerThreadId,
        needsReview: classification.status === "NEEDS_REVIEW" || classification.confidence < 0.55,
        confidence: classification.confidence
      }
    });
    await createUpdate(application.id, account.id, message, classification, raw);
    return "new";
  }

  await prisma.jobApplication.update({
    where: { id: existing.id },
    data: {
      status,
      rejectionReason: classification.rejectionReason ?? existing.rejectionReason,
      interviewDate: interviewDate ?? existing.interviewDate,
      interviewType: classification.interviewType ?? existing.interviewType,
      meetingLink: classification.meetingLink ?? existing.meetingLink,
      contactPerson: classification.contactPerson ?? existing.contactPerson,
      recruiterEmail: raw.senderEmail,
      senderEmail: raw.senderEmail,
      source: classification.source ?? existing.source,
      lastEmailDate: raw.receivedAt > (existing.lastEmailDate ?? new Date(0)) ? raw.receivedAt : existing.lastEmailDate,
      notes: classification.summary,
      originalSubject: raw.subject,
      originalUrl: raw.originalUrl ?? existing.originalUrl,
      needsReview: existing.needsReview || classification.status === "NEEDS_REVIEW" || classification.confidence < 0.55,
      confidence: Math.max(existing.confidence, classification.confidence)
    }
  });
  await createUpdate(existing.id, account.id, message, classification, raw);
  return "update";
}

async function findExistingApplication(userId: string, company: string, position: string, threadId?: string) {
  return prisma.jobApplication.findFirst({
    where: {
      userId,
      OR: [
        { normalizedCompany: company, normalizedPosition: position, providerThreadId: threadId },
        { normalizedCompany: company, normalizedPosition: position }
      ]
    }
  });
}

async function createUpdate(
  applicationId: string,
  accountId: string,
  message: EmailMessage,
  classification: Awaited<ReturnType<typeof classifyJobEmailWithAiFallback>>,
  raw: RawEmail
) {
  await prisma.applicationUpdate.create({
    data: {
      applicationId,
      accountId,
      emailMessageId: message.id,
      status: classification.status,
      summary: classification.summary || raw.snippet || raw.subject,
      rejectionReason: classification.rejectionReason,
      interviewDate: classification.interviewDate ? new Date(classification.interviewDate) : undefined,
      interviewType: classification.interviewType,
      meetingLink: classification.meetingLink,
      contactPerson: classification.contactPerson,
      confidence: classification.confidence
    }
  });
}

function chooseStatus(current: ApplicationStatus | undefined, next: ApplicationStatus) {
  if (!current) return next;
  return STATUS_PRIORITY[next] >= STATUS_PRIORITY[current] ? next : current;
}

function inferAppliedDate(status: ApplicationStatus, receivedAt: Date) {
  return ["APPLIED", "APPLICATION_RECEIVED", "UNDER_REVIEW"].includes(status) ? receivedAt : undefined;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

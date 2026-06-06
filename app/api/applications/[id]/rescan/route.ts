import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processRawEmail } from "@/email/scanner";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    include: {
      updates: {
        include: { emailMessage: true, account: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
  const update = application?.updates[0];
  if (!application || !update?.emailMessage || !update.account) {
    return NextResponse.json({ error: "No source email found to rescan" }, { status: 400 });
  }

  const raw = {
    provider: update.account.provider,
    providerMessageId: update.emailMessage.providerMessageId,
    providerThreadId: update.emailMessage.providerThreadId ?? undefined,
    internetMessageId: update.emailMessage.internetMessageId ?? undefined,
    folder: update.emailMessage.folder ?? undefined,
    subject: update.emailMessage.subject,
    senderEmail: update.emailMessage.senderEmail,
    senderName: update.emailMessage.senderName ?? undefined,
    recipientEmails: update.emailMessage.recipientEmails,
    receivedAt: update.emailMessage.receivedAt,
    sentAt: update.emailMessage.sentAt ?? undefined,
    snippet: update.emailMessage.snippet ?? undefined,
    bodyText: update.emailMessage.bodyText ?? "",
    originalUrl: update.emailMessage.originalUrl ?? undefined
  };
  const result = await processRawEmail(update.account, raw);
  return NextResponse.json({ result });
}

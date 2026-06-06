import type { ApplicationStatus, EmailProvider } from "@prisma/client";

export type RawEmail = {
  provider: EmailProvider;
  providerMessageId: string;
  providerThreadId?: string;
  internetMessageId?: string;
  folder?: string;
  subject: string;
  senderEmail: string;
  senderName?: string;
  recipientEmails: string[];
  receivedAt: Date;
  sentAt?: Date;
  snippet?: string;
  bodyText: string;
  originalUrl?: string;
};

export type ClassificationResult = {
  isJobRelated: boolean;
  company: string | null;
  position: string | null;
  status: ApplicationStatus;
  rejectionReason: string | null;
  interviewDate: string | null;
  interviewType: string | null;
  meetingLink: string | null;
  contactPerson: string | null;
  confidence: number;
  summary: string;
  source: string | null;
};

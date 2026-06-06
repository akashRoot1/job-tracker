import { EmailProvider, type ConnectedEmailAccount } from "@prisma/client";
import { config } from "@/lib/config";
import { mockEmails } from "@/email/mock-emails";
import type { RawEmail } from "@/email/types";

export async function fetchAccountMessages(account: ConnectedEmailAccount): Promise<RawEmail[]> {
  if (config.emailProviderMode === "mock" || account.provider === "MOCK") {
    return mockEmails.map(email => ({
      ...email,
      provider: account.provider,
      recipientEmails: [account.email]
    }));
  }

  if (account.provider === EmailProvider.GMAIL) return fetchGmailMessages(account);
  if (account.provider === EmailProvider.OUTLOOK) return fetchOutlookMessages(account);
  throw new Error(`Provider ${account.provider} is not implemented.`);
}

async function fetchGmailMessages(_account: ConnectedEmailAccount): Promise<RawEmail[]> {
  // Production hook:
  // 1. Decrypt refresh token.
  // 2. Refresh access token.
  // 3. Query users.messages.list with inbox/sent and job-related search terms.
  // 4. Fetch users.messages.get(format=full), normalize headers/body, return RawEmail[].
  return [];
}

async function fetchOutlookMessages(_account: ConnectedEmailAccount): Promise<RawEmail[]> {
  // Production hook:
  // 1. Decrypt refresh token.
  // 2. Refresh access token.
  // 3. Use Microsoft Graph /me/messages and /me/mailFolders/SentItems/messages.
  // 4. Keep deltaLink for incremental sync, normalize to RawEmail[].
  return [];
}

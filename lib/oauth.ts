import { EmailProvider } from "@prisma/client";
import { config } from "@/lib/config";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
];

const OUTLOOK_SCOPES = ["offline_access", "User.Read", "Mail.Read"];

type OAuthAccountInput = {
  provider: EmailProvider;
  email: string;
  providerAccountId: string;
  refreshToken?: string;
  expiresAt?: Date;
};

export function gmailAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES.join(" ")
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function outlookAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.microsoft.clientId,
    redirect_uri: config.microsoft.redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: OUTLOOK_SCOPES.join(" ")
  });
  return `https://login.microsoftonline.com/${config.microsoft.tenantId}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeGmailCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    redirect_uri: config.google.redirectUri,
    grant_type: "authorization_code"
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  if (!tokenRes.ok) throw new Error(`Gmail token exchange failed: ${await tokenRes.text()}`);
  const token = await tokenRes.json();
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  if (!profileRes.ok) throw new Error(`Gmail profile fetch failed: ${await profileRes.text()}`);
  const profile = await profileRes.json();
  return {
    provider: EmailProvider.GMAIL,
    email: profile.email as string,
    providerAccountId: profile.id as string,
    refreshToken: token.refresh_token as string | undefined,
    expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : undefined
  };
}

export async function exchangeOutlookCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: config.microsoft.clientId,
    client_secret: config.microsoft.clientSecret,
    redirect_uri: config.microsoft.redirectUri,
    grant_type: "authorization_code"
  });
  const tokenUrl = `https://login.microsoftonline.com/${config.microsoft.tenantId}/oauth2/v2.0/token`;
  const tokenRes = await fetch(tokenUrl, { method: "POST", body });
  if (!tokenRes.ok) throw new Error(`Outlook token exchange failed: ${await tokenRes.text()}`);
  const token = await tokenRes.json();
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });
  if (!profileRes.ok) throw new Error(`Outlook profile fetch failed: ${await profileRes.text()}`);
  const profile = await profileRes.json();
  return {
    provider: EmailProvider.OUTLOOK,
    email: (profile.mail || profile.userPrincipalName) as string,
    providerAccountId: profile.id as string,
    refreshToken: token.refresh_token as string | undefined,
    expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : undefined
  };
}

export async function saveOAuthAccount(input: OAuthAccountInput, userId: string) {
  return prisma.connectedEmailAccount.upsert({
    where: {
      userId_provider_email: {
        userId,
        provider: input.provider,
        email: input.email
      }
    },
    update: {
      providerAccountId: input.providerAccountId,
      encryptedRefreshToken: input.refreshToken ? encryptSecret(input.refreshToken) : undefined,
      accessTokenExpiresAt: input.expiresAt,
      syncEnabled: true
    },
    create: {
      userId,
      provider: input.provider,
      email: input.email,
      providerAccountId: input.providerAccountId,
      encryptedRefreshToken: input.refreshToken ? encryptSecret(input.refreshToken) : undefined,
      accessTokenExpiresAt: input.expiresAt,
      syncEnabled: true
    }
  });
}

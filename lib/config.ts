export const config = {
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  defaultUserEmail: process.env.DEFAULT_USER_EMAIL ?? "jobseeker@example.com",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? "",
  emailProviderMode: process.env.EMAIL_PROVIDER_MODE ?? "mock",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/oauth/gmail/callback"
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    redirectUri: process.env.MICROSOFT_REDIRECT_URI ?? "http://localhost:3000/api/oauth/outlook/callback"
  }
};

import { EmailProvider } from "@prisma/client";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scanAllAccounts } from "@/email/scanner";

const trackedEmailIds = (
  process.env.TRACKED_EMAIL_IDS ??
  "akashvikram@outlook.com,akashvikram1@outlook.com,akashvikram98@outlook.com,akashvikram981@outlook.com"
)
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

async function main() {
  const user = await getDemoUser();
  await prisma.connectedEmailAccount.upsert({
    where: {
      userId_provider_email: {
        userId: user.id,
        provider: EmailProvider.MOCK,
        email: user.email
      }
    },
    update: { syncEnabled: true },
    create: {
      userId: user.id,
      provider: EmailProvider.MOCK,
      email: user.email,
      displayName: "Primary job search inbox"
    }
  });

  for (const email of trackedEmailIds) {
    await prisma.connectedEmailAccount.upsert({
      where: {
        userId_provider_email: {
          userId: user.id,
          provider: EmailProvider.OUTLOOK,
          email
        }
      },
      update: {
        syncEnabled: true,
        displayName: email
      },
      create: {
        userId: user.id,
        provider: EmailProvider.OUTLOOK,
        email,
        displayName: email,
        syncEnabled: true
      }
    });
  }

  await scanAllAccounts(user.id);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

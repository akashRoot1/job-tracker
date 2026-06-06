import { EmailProvider } from "@prisma/client";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scanAllAccounts } from "@/email/scanner";

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
  await scanAllAccounts(user.id);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

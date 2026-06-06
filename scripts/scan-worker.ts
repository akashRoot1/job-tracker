import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scanAllAccounts } from "@/email/scanner";

async function main() {
  const user = await getDemoUser();
  const results = await scanAllAccounts(user.id);
  console.log(JSON.stringify(results, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

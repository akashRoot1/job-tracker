import { setTimeout as sleep } from "node:timers/promises";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scanAllAccounts } from "@/email/scanner";

const ONE_HOUR = 60 * 60 * 1000;

async function runForever() {
  console.log("Hourly job application email scanner started.");
  while (true) {
    const user = await getDemoUser();
    await scanAllAccounts(user.id);
    console.log(`Scan finished at ${new Date().toISOString()}`);
    await sleep(ONE_HOUR);
  }
}

runForever().catch(async error => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

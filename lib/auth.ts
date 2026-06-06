import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

export async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: config.defaultUserEmail },
    update: {},
    create: {
      email: config.defaultUserEmail,
      name: "Ireland Job Seeker"
    }
  });
}

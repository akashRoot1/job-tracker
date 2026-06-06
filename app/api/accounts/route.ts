import { NextResponse } from "next/server";
import { EmailProvider } from "@prisma/client";
import { z } from "zod";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAccountSchema = z.object({
  email: z.string().email(),
  provider: z.nativeEnum(EmailProvider).default("MOCK")
});

export async function GET() {
  const user = await getDemoUser();
  const accounts = await prisma.connectedEmailAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(accounts.map(account => ({
    ...account,
    encryptedRefreshToken: account.encryptedRefreshToken ? "encrypted" : null
  })));
}

export async function POST(request: Request) {
  const user = await getDemoUser();
  const body = createAccountSchema.parse(await request.json());
  const account = await prisma.connectedEmailAccount.upsert({
    where: {
      userId_provider_email: {
        userId: user.id,
        provider: body.provider,
        email: body.email
      }
    },
    update: { syncEnabled: true },
    create: {
      userId: user.id,
      provider: body.provider,
      email: body.email,
      displayName: body.email
    }
  });
  return NextResponse.json({ ...account, encryptedRefreshToken: null });
}

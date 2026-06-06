import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/auth";
import { scanAllAccounts, scanAccount } from "@/email/scanner";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getDemoUser();
  const body = await request.json().catch(() => ({}));
  if (body.accountId) {
    const account = await prisma.connectedEmailAccount.findFirst({
      where: { id: body.accountId, userId: user.id }
    });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json(await scanAccount(account));
  }
  return NextResponse.json(await scanAllAccounts(user.id));
}

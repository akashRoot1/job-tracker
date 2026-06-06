import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { exchangeOutlookCode, saveOAuthAccount } from "@/lib/oauth";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing OAuth code" }, { status: 400 });
  const user = await getDemoUser();
  const account = await exchangeOutlookCode(code);
  await saveOAuthAccount(account, user.id);
  return NextResponse.redirect(`${config.appBaseUrl}/accounts`);
}

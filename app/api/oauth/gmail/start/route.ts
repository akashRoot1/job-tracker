import { NextResponse } from "next/server";
import { gmailAuthUrl } from "@/lib/oauth";

export async function GET() {
  return NextResponse.redirect(gmailAuthUrl());
}

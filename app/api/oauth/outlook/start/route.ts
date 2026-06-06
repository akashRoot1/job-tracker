import { NextResponse } from "next/server";
import { outlookAuthUrl } from "@/lib/oauth";

export async function GET() {
  return NextResponse.redirect(outlookAuthUrl());
}

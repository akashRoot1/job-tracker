import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getDemoUser();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: user.id,
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { company: { contains: q, mode: "insensitive" } },
              { position: { contains: q, mode: "insensitive" } },
              { recruiterEmail: { contains: q, mode: "insensitive" } },
              { source: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: { updates: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(applications);
}

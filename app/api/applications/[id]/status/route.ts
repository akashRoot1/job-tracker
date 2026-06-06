import { NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  note: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const body = schema.parse(await request.json());
  const application = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      status: body.status,
      needsReview: false,
      updates: {
        create: {
          status: body.status,
          summary: body.note ?? `Manually marked as ${body.status.replaceAll("_", " ").toLowerCase()}.`,
          confidence: 1
        }
      }
    }
  });
  return NextResponse.json(updated);
}

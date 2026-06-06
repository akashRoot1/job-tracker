import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  company: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  interviewDate: z.string().nullable().optional()
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: user.id },
    include: {
      updates: {
        include: { emailMessage: true, account: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const body = updateSchema.parse(await request.json());
  const normalizedCompany = body.company ? normalize(body.company) : undefined;
  const normalizedPosition = body.position ? normalize(body.position) : undefined;
  await prisma.jobApplication.updateMany({
    where: { id, userId: user.id },
    data: {
      ...body,
      normalizedCompany,
      normalizedPosition,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : body.interviewDate
    }
  });
  const application = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  await prisma.jobApplication.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

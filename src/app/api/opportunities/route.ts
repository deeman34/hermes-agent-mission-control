import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ?status=&ownerId= → list opportunities
export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: Record<string, unknown> = {};

  for (const key of ["status", "stage", "ownerId"]) {
    const val = url.searchParams.get(key);
    if (val) where[key] = val;
  }

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ opportunities });
}

// POST { businessId, contactId?, leadId?, status?, stage?, estimatedValue?, currency?, expectedClose?, ownerId?, notes? }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));

  if (!b.businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      businessId: String(b.businessId),
      contactId: b.contactId?.toString() ?? null,
      leadId: b.leadId?.toString() ?? null,
      status: b.status?.toString() ?? "open",
      stage: b.stage?.toString() ?? "outreach",
      estimatedValue: b.estimatedValue != null ? Number(b.estimatedValue) : null,
      currency: b.currency?.toString() ?? "USD",
      expectedClose: b.expectedClose ? new Date(b.expectedClose) : null,
      ownerId: b.ownerId?.toString() ?? null,
      notes: b.notes?.toString() ?? null,
    },
  });

  return NextResponse.json({ opportunity });
}

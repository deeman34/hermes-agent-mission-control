import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ?status=&source=&ownerId=&sort=score → list leads
export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: Record<string, unknown> = {};

  for (const key of ["status", "source", "ownerId"]) {
    const val = url.searchParams.get(key);
    if (val) where[key] = val;
  }

  const sort = url.searchParams.get("sort");
  const orderBy =
    sort === "score" ? { score: "desc" as const } : { createdAt: "desc" as const };

  const leads = await prisma.lead.findMany({
    where,
    orderBy,
    take: 200,
  });

  return NextResponse.json({ leads });
}

// POST { businessId?, contactId?, source, status?, notes?, ownerId?, estimatedValue? }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const source = (b.source || "").toString().trim();

  if (!source) {
    return NextResponse.json({ error: "source required" }, { status: 400 });
  }

  if (!b.businessId && !b.contactId) {
    return NextResponse.json(
      { error: "businessId or contactId required" },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.create({
    data: {
      businessId: b.businessId?.toString() ?? null,
      contactId: b.contactId?.toString() ?? null,
      source,
      status: b.status?.toString() ?? "new",
      notes: b.notes?.toString() ?? null,
      ownerId: b.ownerId?.toString() ?? null,
      estimatedValue: b.estimatedValue != null ? Number(b.estimatedValue) : null,
    },
  });

  return NextResponse.json({ lead });
}

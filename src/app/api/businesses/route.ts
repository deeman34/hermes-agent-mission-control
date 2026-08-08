import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ?name=&status=&industry= → list / filter businesses
export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: Record<string, unknown> = {};

  const status = url.searchParams.get("status");
  if (status) where.status = status;

  const industry = url.searchParams.get("industry");
  if (industry) where.industry = industry;

  const name = url.searchParams.get("name");
  if (name) where.name = { contains: name, mode: "insensitive" };

  const businesses = await prisma.business.findMany({
    where,
    orderBy: { name: "asc" },
    take: 200,
    include: {
      _count: {
        select: { leads: true, opportunities: true, revenues: true },
      },
    },
  });

  return NextResponse.json({ businesses });
}

// POST { name, domain?, website?, email?, industry?, size?, status?, notes? }
// Upserts by domain when provided.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = (b.name || "").toString().trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const domain = b.domain ? b.domain.toString().trim().toLowerCase() : null;

  let business;

  if (domain) {
    business = await prisma.business.upsert({
      where: { domain },
      update: {
        name,
        ...(b.website ? { website: String(b.website) } : {}),
        ...(b.email ? { email: String(b.email) } : {}),
        ...(b.industry ? { industry: String(b.industry) } : {}),
        ...(b.size ? { size: String(b.size) } : {}),
        ...(b.status ? { status: String(b.status) } : {}),
        ...(b.notes ? { notes: String(b.notes) } : {}),
      },
      create: {
        name,
        domain,
        ...(b.website ? { website: String(b.website) } : {}),
        ...(b.email ? { email: String(b.email) } : {}),
        ...(b.industry ? { industry: String(b.industry) } : {}),
        ...(b.size ? { size: String(b.size) } : {}),
        ...(b.status ? { status: String(b.status) } : {}),
        ...(b.notes ? { notes: String(b.notes) } : {}),
      },
    });
  } else {
    business = await prisma.business.create({
      data: {
        name,
        ...(b.website ? { website: String(b.website) } : {}),
        ...(b.email ? { email: String(b.email) } : {}),
        ...(b.industry ? { industry: String(b.industry) } : {}),
        ...(b.size ? { size: String(b.size) } : {}),
        ...(b.status ? { status: String(b.status) } : {}),
        ...(b.notes ? { notes: String(b.notes) } : {}),
      },
    });
  }

  return NextResponse.json({ business });
}

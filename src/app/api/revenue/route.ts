import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ?businessId=&opportunityId=&type=&from=&to= → list revenues with optional filters
export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: Record<string, unknown> = {};

  for (const key of ["businessId", "opportunityId", "type"]) {
    const val = url.searchParams.get(key);
    if (val) where[key] = val;
  }

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    where.recognizedAt = dateFilter;
  }

  const rows = await prisma.revenue.findMany({
    where,
    orderBy: { recognizedAt: "desc" },
    take: 500,
  });

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return NextResponse.json({ revenues: rows, total, count: rows.length });
}

// POST { amount, businessId, opportunityId?, currency?, type?, recognizedAt?, notes? }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));

  if (b.amount == null || !b.businessId) {
    return NextResponse.json(
      { error: "amount and businessId required" },
      { status: 400 },
    );
  }

  const revenue = await prisma.revenue.create({
    data: {
      businessId: String(b.businessId),
      opportunityId: b.opportunityId?.toString() ?? null,
      amount: Number(b.amount),
      currency: b.currency?.toString() ?? "USD",
      type: b.type?.toString() ?? "new",
      recognizedAt: b.recognizedAt ? new Date(b.recognizedAt) : new Date(),
      notes: b.notes?.toString() ?? null,
    },
  });

  return NextResponse.json({ revenue });
}

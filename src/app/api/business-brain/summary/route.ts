import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET pipeline + revenue roll-up summary
export async function GET() {
  const [
    leadStatuses,
    oppStatuses,
    oppStages,
    revenue,
    leadCount,
    businessCount,
  ] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.opportunity.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.opportunity.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.revenue.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.lead.count(),
    prisma.business.count(),
  ]);

  const byStatus: Record<string, number> = {};
  for (const r of leadStatuses) byStatus[r.status] = r._count._all;

  const byOppStatus: Record<string, number> = {};
  for (const r of oppStatuses) byOppStatus[r.status] = r._count._all;

  const byStage: Record<string, number> = {};
  for (const r of oppStages) byStage[r.stage] = r._count._all;

  return NextResponse.json({
    businesses: businessCount,
    leads: leadCount,
    byStatus,
    opportunities: byOppStatus,
    byStage,
    revenue: Number(revenue._sum.amount ?? 0),
    revenueCount: revenue._count,
  });
}

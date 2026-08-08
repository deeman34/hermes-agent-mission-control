import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST close an opportunity — won creates a Revenue row; lost sets closedAt only
// Body: { outcome: "won" | "lost", amount?, currency?, type?, recognizedAt?, notes? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const outcome = (b.outcome || "").toString();
  if (!["won", "lost"].includes(outcome)) {
    return NextResponse.json(
      { error: "outcome must be won or lost" },
      { status: 400 },
    );
  }

  const opp = await prisma.opportunity.findUnique({ where: { id } });
  if (!opp) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (opp.status !== "open") {
    return NextResponse.json({ error: "already closed" }, { status: 409 });
  }

  const now = new Date();
  let revenue = null;

  if (outcome === "won") {
    revenue = await prisma.revenue.create({
      data: {
        businessId: opp.businessId,
        opportunityId: opp.id,
        amount: b.amount != null ? Number(b.amount) : opp.estimatedValue ?? 0,
        currency: b.currency?.toString() ?? opp.currency,
        type: b.type?.toString() ?? "new",
        recognizedAt: b.recognizedAt ? new Date(b.recognizedAt) : now,
        notes: b.notes?.toString() ?? null,
      },
    });
  }

  const updated = await prisma.opportunity.update({
    where: { id },
    data: { status: outcome, stage: outcome, closedAt: now },
  });

  return NextResponse.json({ opportunity: updated, revenue });
}

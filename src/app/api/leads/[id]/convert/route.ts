import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST convert a qualified lead into an opportunity
// Guards: lead must exist, not already converted, must have businessId
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (lead.status === "converted") {
    return NextResponse.json({ error: "already converted" }, { status: 409 });
  }
  if (!lead.businessId) {
    return NextResponse.json(
      { error: "lead has no businessId" },
      { status: 400 },
    );
  }

  const [updatedLead, opportunity] = await prisma.$transaction([
    prisma.lead.update({
      where: { id },
      data: { status: "converted", convertedAt: new Date() },
    }),
    prisma.opportunity.create({
      data: {
        businessId: lead.businessId,
        contactId: lead.contactId ?? null,
        leadId: lead.id,
        status: "open",
        stage: b.stage?.toString() ?? "outreach",
        estimatedValue:
          b.estimatedValue != null ? Number(b.estimatedValue) : lead.estimatedValue ?? null,
        currency: b.currency?.toString() ?? "USD",
        expectedClose: b.expectedClose ? new Date(b.expectedClose) : null,
        ownerId: b.ownerId?.toString() ?? lead.ownerId ?? null,
        notes: b.notes?.toString() ?? lead.notes ?? null,
      },
    }),
  ]);

  return NextResponse.json({ lead: updatedLead, opportunity });
}

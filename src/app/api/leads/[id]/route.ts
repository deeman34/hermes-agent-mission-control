import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH update lead lifecycle fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  const stringFields = [
    "status",
    "source",
    "notes",
    "ownerId",
    "draftBody",
    "outreachChannel",
    "businessId",
    "contactId",
  ];

  for (const k of stringFields) {
    if (b[k] !== undefined) data[k] = b[k] === null ? null : String(b[k]);
  }

  if (b.score !== undefined) data.score = b.score === null ? null : Number(b.score);
  if (b.scoreFactors !== undefined) data.scoreFactors = b.scoreFactors;
  if (b.estimatedValue !== undefined) {
    data.estimatedValue =
      b.estimatedValue === null ? null : Number(b.estimatedValue);
  }
  if (b.qualifiedAt !== undefined) {
    data.qualifiedAt = b.qualifiedAt ? new Date(b.qualifiedAt) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.update({ where: { id }, data });
    return NextResponse.json({ lead });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    throw e;
  }
}

// DELETE lead
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    throw e;
  }
}

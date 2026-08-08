import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH update opportunity fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  for (const k of ["status", "stage", "ownerId", "notes"]) {
    if (b[k] !== undefined) data[k] = b[k] === null ? null : String(b[k]);
  }

  if (b.estimatedValue !== undefined) {
    data.estimatedValue =
      b.estimatedValue === null ? null : Number(b.estimatedValue);
  }
  if (b.expectedClose !== undefined) {
    data.expectedClose = b.expectedClose ? new Date(b.expectedClose) : null;
  }
  if (b.closedAt !== undefined) {
    data.closedAt = b.closedAt ? new Date(b.closedAt) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  try {
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data,
    });
    return NextResponse.json({ opportunity });
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

// DELETE opportunity
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.opportunity.delete({ where: { id } });
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

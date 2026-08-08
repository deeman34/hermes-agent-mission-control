import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/businesses/[id] → full business detail with related records
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      contacts: true,
      leads: { orderBy: { createdAt: "desc" } },
      opportunities: { orderBy: { createdAt: "desc" } },
      revenues: { orderBy: { recognizedAt: "desc" } },
      activities: { orderBy: { at: "desc" }, take: 100 },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ business });
}

// PATCH { name?, domain?, website?, email?, industry?, size?, status?, notes? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const allowed = [
    "name",
    "domain",
    "website",
    "email",
    "industry",
    "size",
    "status",
    "notes",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (b[k] !== undefined) data[k] = b[k] === null ? null : String(b[k]);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  try {
    const business = await prisma.business.update({ where: { id }, data });
    return NextResponse.json({ business });
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

// DELETE /api/businesses/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.business.delete({ where: { id } });
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

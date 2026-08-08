import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET timeline — by entityType+entityId or by businessId
export async function GET(req: Request) {
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const businessId = url.searchParams.get("businessId");

  const where: Record<string, unknown> = {};
  if (entityType && entityId) {
    where.entityType = entityType;
    where.entityId = entityId;
  }
  if (businessId) {
    where.businessId = businessId;
  }

  const activities = await prisma.businessActivity.findMany({
    where,
    orderBy: { at: "desc" },
    take: 200,
  });

  return NextResponse.json({ activities });
}

// POST log a business activity
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));

  const type = (b.type || "").toString().trim();
  const entityType = (b.entityType || "").toString().trim();
  const entityId = (b.entityId || "").toString().trim();
  const title = (b.title || "").toString().trim();

  if (!type || !entityType || !entityId || !title) {
    return NextResponse.json(
      { error: "type, entityType, entityId, and title are required" },
      { status: 400 },
    );
  }

  const activity = await prisma.businessActivity.create({
    data: {
      businessId: b.businessId?.toString() ?? null,
      entityType,
      entityId,
      type,
      title,
      detail: b.detail?.toString() ?? null,
      actor: b.actor?.toString() ?? null,
      linkHermesTaskId: b.linkHermesTaskId?.toString() ?? null,
      at: b.at ? new Date(b.at) : new Date(),
    },
  });

  return NextResponse.json({ activity });
}

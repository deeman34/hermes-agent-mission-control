import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET ?businessId= → list contacts, optionally scoped to a business
export async function GET(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");

  const contacts = await prisma.contact.findMany({
    where: businessId ? { businessId } : {},
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json({ contacts });
}

// POST { name, businessId?, email?, phone?, role?, source?, notes? }
// Upserts by email when provided.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = (b.name || "").toString().trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const email = b.email ? b.email.toString().trim().toLowerCase() : null;

  const createData: Prisma.ContactCreateInput = {
    name,
    ...(b.businessId ? { businessId: b.businessId.toString() } : {}),
    ...(email ? { email } : {}),
    ...(b.phone ? { phone: b.phone.toString() } : {}),
    ...(b.role ? { role: b.role.toString() } : {}),
    ...(b.source ? { source: b.source.toString() } : {}),
    ...(b.notes ? { notes: b.notes.toString() } : {}),
  };

  let contact;

  // Try to find an existing contact: scoped by businessId when supplied, then by email
  const existing = email
    ? await prisma.contact.findFirst({
        where: {
          email,
          ...(b.businessId ? { businessId: b.businessId.toString() } : {}),
        },
      })
    : null;

  if (existing) {
    const updateData: Record<string, unknown> = { name };
    if (b.phone) updateData.phone = b.phone.toString();
    if (b.role) updateData.role = b.role.toString();
    if (b.source) updateData.source = b.source.toString();
    if (b.notes) updateData.notes = b.notes.toString();

    contact = await prisma.contact.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    contact = await prisma.contact.create({ data: createData });
  }

  return NextResponse.json({ contact });
}

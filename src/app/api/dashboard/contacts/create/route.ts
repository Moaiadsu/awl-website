import { NextResponse } from "next/server";
import {
  createOdooContact,
  findOdooContactByNameOrPhone,
  type NewOdooContact,
} from "@/lib/odoo";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NewOdooContact;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    // Prevent duplicates — check Odoo before creating
    const existingId = await findOdooContactByNameOrPhone(body.name, body.phone);
    if (existingId) {
      return NextResponse.json({ id: existingId, alreadyExists: true });
    }

    const id = await createOdooContact(body);
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create contact";
    console.error("[odoo/contacts/create]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

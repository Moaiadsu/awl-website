import { NextResponse } from "next/server";
import { deleteOdooContact, findOdooContactByNameOrPhone } from "@/lib/odoo";

// Used when deleting a merchant from the app: the app only knows the store
// name/phone, so look the contact up in Odoo first, then remove it.
export async function POST(req: Request) {
  let body: { name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.name && !body.phone) {
    return NextResponse.json({ error: "الاسم أو الهاتف مطلوب" }, { status: 400 });
  }

  try {
    const id = await findOdooContactByNameOrPhone(body.name ?? "", body.phone);
    if (id === null) {
      // Not in Odoo (never synced) — nothing to remove there.
      return NextResponse.json({ ok: true, found: false });
    }
    const mode = await deleteOdooContact(id);
    return NextResponse.json({ ok: true, found: true, mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete contact";
    console.error("[odoo/contacts/delete-by-identity]", body, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

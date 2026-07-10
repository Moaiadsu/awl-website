import { NextResponse } from "next/server";
import { deleteOdooContact } from "@/lib/odoo";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  try {
    const mode = await deleteOdooContact(id);
    return NextResponse.json({ ok: true, mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete contact";
    console.error("[odoo/contacts/delete]", id, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

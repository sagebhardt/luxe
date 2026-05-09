import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { AuthError, assertOwnsDocument, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  /* Tenancy guard: only the owning ITD or an admin can fetch this
   * document's bytes. Without this, the download URL would be a flat
   * id-based oracle for any cross-tenant doc. */
  const viewer = await getCurrentUser();
  if (!viewer) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }
  try {
    await assertOwnsDocument(id, viewer);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
    columns: {
      fileName: true,
      mimeType: true,
      content: true,
    },
  });
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  /* The Buffer is already a Uint8Array; cast for the Web Response. */
  const body = new Uint8Array(doc.content);

  return new NextResponse(body, {
    headers: {
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}

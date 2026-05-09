import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
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

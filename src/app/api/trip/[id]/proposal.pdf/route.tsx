import { renderToStream } from "@react-pdf/renderer";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentLogMessages, bookings, trips } from "@/lib/db/schema";
import { ProposalPdf } from "@/lib/pdf/proposal-pdf";
import type { TripNarrative } from "@/lib/types/narrative";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      client: true,
      bookings: { orderBy: [asc(bookings.occursOn), asc(bookings.createdAt)] },
    },
  });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const narrative = (trip.clientNarrative ?? null) as TripNarrative | null;

  const stream = await renderToStream(
    <ProposalPdf
      trip={trip}
      client={trip.client}
      bookings={trip.bookings}
      narrative={narrative}
    />,
  );

  /* renderToStream returns a Node Readable; convert to Web Stream for
   * NextResponse compatibility. */
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  /* Suppress agent_log_messages unused import warning */
  void agentLogMessages;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug(trip.name)}-proposal.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

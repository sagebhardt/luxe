import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { ItdStatementPdf } from "@/lib/pdf/itd-statement-pdf";
import { registerProposalFonts } from "@/lib/pdf/proposal-pdf";
import { getItdStatement } from "@/lib/queries/itd-statement";
import { AuthError, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = Promise<{ itdUserId: string }>;

function periodFor(month: string | null) {
  /* `month` is a 'YYYY-MM' string. Default = current month. */
  const now = new Date();
  let year: number;
  let m: number;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, mm] = month.split("-").map(Number);
    year = y;
    m = mm - 1;
  } else {
    year = now.getUTCFullYear();
    m = now.getUTCMonth();
  }
  const monthStart = new Date(Date.UTC(year, m, 1));
  const nextMonthStart = new Date(Date.UTC(year, m + 1, 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const label = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    monthStart: iso(monthStart),
    nextMonthStart: iso(nextMonthStart),
    label,
  };
}

export async function GET(req: Request, { params }: { params: Params }) {
  const { itdUserId } = await params;
  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  /* Tenancy: any authed user can fetch their own statement. Admins
   * can fetch anyone's. */
  const viewer = await getCurrentUser();
  if (!viewer) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }
  if (viewer.id !== itdUserId && viewer.role !== "admin") {
    return NextResponse.json(
      { error: "Not your statement" },
      { status: 403 },
    );
  }

  const { monthStart, nextMonthStart, label } = periodFor(month);

  const data = await getItdStatement({
    itdUserId,
    monthStart,
    nextMonthStart,
  });
  if (!data) {
    return NextResponse.json({ error: "ITD not found" }, { status: 404 });
  }

  /* Bundled fonts via the proposal-pdf registration helper. */
  const origin = new URL(req.url).origin;
  registerProposalFonts(origin);

  const generatedOn = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const stream = await renderToStream(
    <ItdStatementPdf
      data={data}
      periodLabel={label}
      generatedOn={generatedOn}
    />,
  );

  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  const slug = (data.itd.name || data.itd.email || itdUserId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const fileName = `${slug}-statement-${monthStart.slice(0, 7)}.pdf`;

  /* Suppress AuthError unused warning (re-exported from auth.ts) */
  void AuthError;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

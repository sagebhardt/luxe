import type { bookings } from "@/lib/db/schema";
import { BookingFinancials } from "./BookingFinancials";

type Booking = typeof bookings.$inferSelect;

const CARD_CLASS: Record<Booking["status"], string> = {
  confirmed: "conf",
  pending: "pend",
  research: "research",
  cancelled: "",
};

const BADGE_CLASS: Record<Booking["status"], string> = {
  confirmed: "b-conf",
  pending: "b-pend",
  research: "b-research",
  cancelled: "",
};

const BADGE_LABEL: Record<Booking["status"], string> = {
  confirmed: "confirmed",
  pending: "awaiting approval",
  research: "researching",
  cancelled: "cancelled",
};

export function CommittedDecisions({
  bookings: rows,
  baseCurrency,
}: {
  bookings: Booking[];
  baseCurrency: string;
}) {
  return (
    <div className="cards-grid">
      {rows.map((b) => {
        const meta = (b.metadata ?? {}) as Record<string, unknown>;
        const subtitle = (meta.subtitle as string | undefined) ?? "";
        return (
          <div key={b.id} className={`det-card ${CARD_CLASS[b.status]}`}>
            <span className={`badge ${BADGE_CLASS[b.status]}`}>
              {BADGE_LABEL[b.status]}
            </span>
            <div className="det-type">{subtitle}</div>
            <div className="det-val">{b.title}</div>
            {b.detail ? (
              <div className="det-info">
                {b.detail.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < b.detail!.split("\n").length - 1 ? <br /> : null}
                  </span>
                ))}
              </div>
            ) : null}
            <BookingFinancials booking={b} baseCurrency={baseCurrency} />
          </div>
        );
      })}
    </div>
  );
}

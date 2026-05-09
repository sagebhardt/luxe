"use client";

import { useState, useTransition } from "react";
import {
  lockBookingCostAction,
  setBookingFinancialsAction,
  unlockBookingCostAction,
} from "@/app/(app)/trip/booking-actions";
import { formatAmount, SUPPORTED_CURRENCIES } from "@/lib/format";
import type { bookings } from "@/lib/db/schema";

type Booking = typeof bookings.$inferSelect;

/** Per-booking margin editor. Shown collapsed by default; click "Edit"
 * to expand the form. Once cost is locked, the lock badge replaces the
 * edit affordance and the values become read-only. */
export function BookingFinancials({
  booking,
  baseCurrency,
}: {
  booking: Booking;
  baseCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sell = booking.sellAmount;
  const sellCcy = booking.sellCurrency ?? baseCurrency;
  const cost = booking.costAmount;
  const costCcy = booking.costCurrency ?? baseCurrency;
  const locked = booking.costLocked;

  /* Margin preview when both numbers are present. Estimate-only when
   * unlocked: we use the booking's stored fx rate if locked, otherwise
   * just show the costCurrency value verbatim with no margin %. */
  let marginNote: string | null = null;
  if (sell && cost && locked && booking.costFxToBase) {
    const sellNum = Number(sell);
    const costInBase = Number(cost) * Number(booking.costFxToBase);
    if (sellNum > 0) {
      const pct = ((sellNum - costInBase) / sellNum) * 100;
      marginNote = `${pct.toFixed(0)}% margin`;
    }
  } else if (sell && cost && costCcy === baseCurrency) {
    const sellNum = Number(sell);
    const costNum = Number(cost);
    if (sellNum > 0) {
      const pct = ((sellNum - costNum) / sellNum) * 100;
      marginNote = `${pct.toFixed(0)}% est.`;
    }
  }

  if (!open) {
    return (
      <div className="bk-fin">
        <div className="bk-fin-row">
          <span className="bk-fin-label">Sell</span>
          <span className="bk-fin-val">
            {sell ? formatAmount(sell, sellCcy) : "—"}
          </span>
          <span className="bk-fin-sep">·</span>
          <span className="bk-fin-label">Cost</span>
          <span className="bk-fin-val">
            {cost ? formatAmount(cost, costCcy) : "—"}
          </span>
          {marginNote ? (
            <span className={`bk-fin-margin${locked ? " locked" : ""}`}>
              {marginNote}
              {locked ? null : <em> (unlocked)</em>}
            </span>
          ) : null}
        </div>
        <div className="bk-fin-actions">
          {locked ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => setOpen(true)}
            >
              🔒 unlock to edit
            </button>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={() => setOpen(true)}
            >
              edit margin
            </button>
          )}
        </div>
      </div>
    );
  }

  /* Edit form */
  return (
    <form
      className="bk-fin bk-fin-edit"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const sellAmount = String(fd.get("sellAmount") ?? "").trim();
        const sellCurrency = String(fd.get("sellCurrency") ?? "").trim();
        const costAmount = String(fd.get("costAmount") ?? "").trim();
        const costCurrency = String(fd.get("costCurrency") ?? "").trim();
        const action = String(fd.get("intent") ?? "save");
        setError(null);
        startTransition(async () => {
          if (locked && action !== "unlock") {
            setError("Unlock first to edit");
            return;
          }
          if (action === "unlock") {
            const r = await unlockBookingCostAction(booking.id);
            if (!r.ok) setError(r.error);
            return;
          }
          const r = await setBookingFinancialsAction(booking.id, {
            sellAmount: sellAmount || null,
            sellCurrency: sellCurrency || null,
            costAmount: costAmount || null,
            costCurrency: costCurrency || null,
          });
          if (!r.ok) {
            setError(r.error);
            return;
          }
          if (action === "lock") {
            const lr = await lockBookingCostAction(booking.id);
            if (!lr.ok) {
              setError(lr.error);
              return;
            }
          }
          setOpen(false);
        });
      }}
    >
      <div className="bk-fin-grid">
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Sell</span>
          <input
            type="text"
            name="sellAmount"
            inputMode="decimal"
            defaultValue={sell ?? ""}
            placeholder="0.00"
            disabled={pending}
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Sell ccy</span>
          <select
            name="sellCurrency"
            defaultValue={sellCcy}
            disabled={pending}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
                {c === baseCurrency ? " (base)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Cost</span>
          <input
            type="text"
            name="costAmount"
            inputMode="decimal"
            defaultValue={cost ?? ""}
            placeholder="0.00"
            disabled={pending || locked}
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Cost ccy</span>
          <select
            name="costCurrency"
            defaultValue={costCcy}
            disabled={pending || locked}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
                {c === baseCurrency ? " (base)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="bk-fin-actions">
        {locked ? (
          <button
            type="submit"
            name="intent"
            value="unlock"
            className="link-btn"
            disabled={pending}
          >
            unlock
          </button>
        ) : (
          <>
            <button
              type="submit"
              name="intent"
              value="save"
              className="link-btn"
              disabled={pending}
            >
              save
            </button>
            <button
              type="submit"
              name="intent"
              value="lock"
              className="link-btn link-btn-primary"
              disabled={pending}
            >
              save &amp; lock
            </button>
          </>
        )}
        <button
          type="button"
          className="link-btn link-btn-muted"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
        >
          cancel
        </button>
      </div>
      {error ? <div className="bk-fin-err">{error}</div> : null}
    </form>
  );
}

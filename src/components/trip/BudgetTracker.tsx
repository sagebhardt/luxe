import { formatMoney } from "@/lib/format";
import type { TripBudgetCategory } from "@/lib/queries/trips";

export function BudgetTracker({
  budget,
}: {
  budget: {
    budgetCents: number;
    categories: TripBudgetCategory[];
    remainingCents: number;
  };
}) {
  return (
    <div>
      {budget.categories.map((cat) => {
        const isRemaining = cat.key === "remaining";
        const isDining = cat.key === "dining" && cat.cents > 0;
        return (
          <div key={cat.key} className="bgt-row">
            <div
              className="bgt-dot"
              style={{ background: cat.color }}
            />
            <div
              className="bgt-cat"
              style={isRemaining ? { color: "var(--bark)" } : undefined}
            >
              {cat.label}
            </div>
            <div className="bgt-track">
              <div
                className="bgt-fill"
                style={{ width: `${cat.pctOfMax}%`, background: cat.color }}
              />
            </div>
            <div
              className="bgt-amt"
              style={
                isRemaining
                  ? { color: "var(--bark)", fontStyle: "italic" }
                  : undefined
              }
            >
              {formatMoney(cat.cents)}
              {isDining ? " est" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

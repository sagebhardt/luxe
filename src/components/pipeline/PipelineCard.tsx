"use client";

import Link from "next/link";
import { formatMoneyShort } from "@/lib/format";
import type { PipelineCard as Card } from "@/lib/pipeline";

const TAG_CLASS: Record<string, string> = {
  vip: "tag-vip",
  active: "tag-active",
  prospect: "tag-cold",
  dormant: "tag-cold",
};

export function PipelineCardView({ card }: { card: Card }) {
  return (
    <Link
      href={`/clients?id=${card.id}`}
      className="pipeline-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/clientId", card.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="pipeline-card-row">
        <div className={`client-av ${card.avatarColor ?? "av-3"}`} style={{ width: 32, height: 32, fontSize: 13 }}>
          {card.initial}
        </div>
        <div className="pipeline-card-body">
          <div className="pipeline-card-name">{card.name}</div>
          <span className={`client-tag ${TAG_CLASS[card.tag] ?? "tag-cold"}`}>
            {card.tag}
          </span>
        </div>
      </div>
      {card.currentDealName ? (
        <div className="pipeline-card-deal">
          <span className="pipeline-card-deal-name">{card.currentDealName}</span>
          {card.currentDealCents != null ? (
            <span className="pipeline-card-deal-amt">
              {formatMoneyShort(card.currentDealCents)}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="pipeline-card-deal pipeline-card-deal-empty">
          <span>LTV {formatMoneyShort(card.lifetimeValueCents)}</span>
        </div>
      )}
    </Link>
  );
}

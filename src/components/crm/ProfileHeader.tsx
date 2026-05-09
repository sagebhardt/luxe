import type { clients } from "@/lib/db/schema";

type Client = typeof clients.$inferSelect;

const TAG_CLASS: Record<Client["tag"], string> = {
  vip: "tag-vip",
  active: "tag-active",
  prospect: "tag-cold",
  dormant: "tag-cold",
};

const TAG_LABEL: Record<Client["tag"], string> = {
  vip: "VIP",
  active: "Active",
  prospect: "Prospect",
  dormant: "Dormant",
};

export function ProfileHeader({ client }: { client: Client }) {
  const initial = client.name.charAt(0);
  const colorClass = client.avatarColor ?? "av-3";
  const noteLine = client.notes ?? "";
  const [primary, ...rest] = noteLine.split(" · ").map((s) => s.trim());
  const meta = rest.join(" · ");

  return (
    <div className="profile-header">
      <div className={`profile-av-lg ${colorClass}`}>{initial}</div>
      <div>
        <div className="profile-name">{client.name}</div>
        <div className="profile-tags">
          <span className={`client-tag ${TAG_CLASS[client.tag]}`}>
            {TAG_LABEL[client.tag]}
          </span>
          {client.tag === "vip" || client.tag === "active" ? (
            <span className="client-tag tag-active">Active trip</span>
          ) : null}
        </div>
        <div className="profile-meta">
          {primary ? <strong>{primary}</strong> : null}
          {meta ? <> &nbsp;·&nbsp; {meta}</> : null}
          {client.email || client.phone ? (
            <>
              <br />
              {client.email}
              {client.email && client.phone ? " · " : ""}
              {client.phone}
            </>
          ) : null}
        </div>
      </div>
      <div className="profile-actions">
        <button className="btn btn-outline">Message</button>
        <button className="btn btn-forest">New Trip</button>
      </div>
    </div>
  );
}

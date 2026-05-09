import type { modelProviders } from "@/lib/db/schema";
import { ProviderRow } from "./ProviderRow";
import { ProviderCreate } from "./ProviderCreate";

type Provider = typeof modelProviders.$inferSelect;

export function ProvidersSection({ providers }: { providers: Provider[] }) {
  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Name</th>
            <th>Kind</th>
            <th>Config</th>
            <th>Credentials env</th>
            <th>Enabled</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {providers.length === 0 ? (
            <tr>
              <td colSpan={7} className="admin-empty">
                No providers yet — add one below.
              </td>
            </tr>
          ) : (
            providers.map((p) => <ProviderRow key={p.id} provider={p} />)
          )}
        </tbody>
      </table>
      <ProviderCreate />
    </div>
  );
}

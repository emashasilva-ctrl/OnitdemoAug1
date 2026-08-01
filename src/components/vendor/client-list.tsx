import { Phone, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VendorClient } from "@/lib/data/vendor-clients";

export function ClientList({ clients }: { clients: VendorClient[] }) {
  if (clients.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No clients yet — they&apos;ll show up here once bookings come in.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clients.map((client, index) => (
        <div
          key={client.phone}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-heading font-semibold text-foreground">{client.name}</p>
              {index < 3 && (
                <Badge variant="default" className="gap-1">
                  <Star className="size-3" />
                  Top client
                </Badge>
              )}
            </div>
            <a
              href={`tel:${client.phone.replace(/\s/g, "")}`}
              className="mt-0.5 flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Phone className="size-3.5" />
              {client.phone}
            </a>
            {client.favoriteService && (
              <p className="mt-1 text-xs text-muted-foreground">Usually books {client.favoriteService}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <p className="font-heading font-semibold text-foreground">
              LKR {client.totalSpend.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {client.visits} {client.visits === 1 ? "visit" : "visits"}
            </p>
            <p className="text-xs text-muted-foreground">Last visit {client.lastVisitDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

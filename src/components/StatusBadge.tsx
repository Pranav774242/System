import type { TenantStatus } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: TenantStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "Active"
          ? "bg-success/15 text-success"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "Active" ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {status}
    </span>
  );
}

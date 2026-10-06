import type { ReactNode } from "react";

export function UserDetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface-card animate-rise p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      <dl className="space-y-4">{children}</dl>
    </div>
  );
}

export function UserDetailRow({ label, value }: { label: string; value?: string | number | null }) {
  const displayValue = value === undefined || value === null || value === "" ? "—" : String(value);

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>

      <dd className="break-words text-sm font-medium">{displayValue}</dd>
    </div>
  );
}

export function UserBooleanRow({ label, value }: { label: string; value?: boolean }) {
  let displayValue = "—";

  if (typeof value === "boolean") {
    displayValue = value ? "Enabled" : "Disabled";
  }

  return <UserDetailRow label={label} value={displayValue} />;
}

export function UserStatusBadge({ status, active }: { status: string; active?: boolean }) {
  const isActive = active === true || status === "OPERATIVE" || status === "ACTIVE";

  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
          : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      <span
        className={
          isActive
            ? "size-1.5 rounded-full bg-success"
            : "size-1.5 rounded-full bg-muted-foreground"
        }
      />

      {status}
    </span>
  );
}

export function UserActivityItem({
  title,
  date,
  icon,
}: {
  title: string;
  date?: string;
  icon: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </span>

      <div>
        <p className="text-sm">{title}</p>

        {date && <p className="text-xs text-muted-foreground">{date}</p>}
      </div>
    </li>
  );
}

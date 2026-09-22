import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  CheckCircle2,
  Package,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  Activity,
  PowerOff,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ONBOARDING_TREND,
  PRODUCT_USAGE,
  formatRelative,
  tenantFullName,
  useAdminStore,
  type ActivityItem,
} from "@/lib/admin-store";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — System Administrator Panel" },
      {
        name: "description",
        content:
          "Platform overview for the Banking LOS admin: tenant counts, onboarding trends, product usage and recent activity.",
      },
      { property: "og:title", content: "Dashboard — System Administrator Panel" },
      {
        property: "og:description",
        content: "Tenant counts, onboarding trends, product usage and recent platform activity.",
      },
    ],
  }),
  component: DashboardPage,
});

function useLoaded(delay = 550) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loaded;
}

const activityIcon: Record<ActivityItem["kind"], typeof PlusCircle> = {
  created: PlusCircle,
  updated: RefreshCw,
  status: PowerOff,
  info: Activity,
};

const activityTone: Record<ActivityItem["kind"], string> = {
  created: "bg-success/15 text-success",
  updated: "bg-accent/15 text-accent",
  status: "bg-warning/20 text-warning",
  info: "bg-primary/10 text-primary",
};

function DashboardPage() {
  const { tenants, activity } = useAdminStore();
  const loaded = useLoaded();

  const active = tenants.filter((t) => t.status === "Active").length;
  const recent = [...tenants]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const stats = [
    { label: "Total Tenants", value: tenants.length, trend: "+12.5%", icon: Building2 },
    { label: "Active Tenants", value: active, trend: "+8.1%", icon: CheckCircle2 },
    { label: "Total Products", value: 5, trend: "+2 this quarter", icon: Package },
    { label: "Total Rules Configured", value: 8, trend: "+3 this month", icon: Sparkles },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Platform-wide overview of your lending network">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, trend, icon: Icon }, i) => (
            <div
              key={label}
              className="surface-card animate-rise p-5 transition-shadow hover:shadow-[var(--shadow-elevated)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </span>
              </div>
              {loaded ? (
                <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
              ) : (
                <Skeleton className="mt-3 h-9 w-16" />
              )}
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" /> {trend}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="surface-card animate-rise p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Tenants onboarded over time</h2>
                <p className="text-xs text-muted-foreground">Monthly onboarding, current year</p>
              </div>
            </div>
            {loaded ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ONBOARDING_TREND} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="tenantFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--color-card-foreground)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tenants"
                      stroke="var(--color-accent)"
                      strokeWidth={2.5}
                      fill="url(#tenantFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-[260px] w-full" />
            )}
          </div>

          <div className="surface-card animate-rise p-5 lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Products by tenant usage</h2>
              <p className="text-xs text-muted-foreground">Tenants offering each loan product</p>
            </div>
            {loaded ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PRODUCT_USAGE} margin={{ left: -24, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="product"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                      tickFormatter={(v: string) => v.replace(" Loan", "")}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--color-secondary)" }}
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--color-card-foreground)",
                      }}
                    />
                    <Bar dataKey="tenants" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-[260px] w-full" />
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="surface-card animate-rise p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recently Added Tenants</h2>
              <Link
                to="/tenants"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {loaded ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Organization</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-border/60 last:border-0 hover:bg-secondary/50"
                      >
                        <td className="py-3 font-medium">
                          <Link to="/tenants/$tenantId" params={{ tenantId: t.id }}>
                            {tenantFullName(t)}
                          </Link>
                        </td>
                        <td className="py-3 text-muted-foreground">{t.organization}</td>
                        <td className="py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatRelative(t.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
          </div>

          <div className="surface-card animate-rise p-5 lg:col-span-2">
            <h2 className="mb-4 text-base font-semibold">Recent Activity</h2>
            {loaded ? (
              <ul className="space-y-4">
                {activity.slice(0, 7).map((item) => {
                  const Icon = activityIcon[item.kind];
                  return (
                    <li key={item.id} className="flex gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${activityTone[item.kind]}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(item.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

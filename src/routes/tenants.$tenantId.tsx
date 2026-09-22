import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Power, PowerOff, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import {
  formatDate,
  formatRelative,
  initials,
  tenantFullName,
  useAdminStore,
} from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/tenants/$tenantId")({
  head: () => ({
    meta: [
      { title: "Tenant Detail — System Administrator Panel" },
      {
        name: "description",
        content:
          "Full tenant profile: personal details, organization, branch network, designation, status and activity log.",
      },
      { property: "og:title", content: "Tenant Detail — System Administrator Panel" },
      {
        property: "og:description",
        content: "Personal details, branch network, designation, status and activity log.",
      },
    ],
  }),
  component: TenantDetailPage,
});

function TenantDetailPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { tenants, updateTenant, toggleTenantStatus } = useAdminStore();
  const tenant = tenants.find((t) => t.id === tenantId);
  const [editOpen, setEditOpen] = useState(false);

  if (!tenant) {
    return (
      <AppShell title="Tenant not found">
        <div className="surface-card flex flex-col items-center gap-3 p-16 text-center">
          <p className="font-medium">This tenant no longer exists</p>
          <Button variant="outline" onClick={() => navigate({ to: "/tenants" })}>
            Back to Tenant Management
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={tenantFullName(tenant)} subtitle={tenant.organization}>
      <div className="space-y-6">
        <Link
          to="/tenants"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Tenant Management
        </Link>

        <div className="surface-card animate-rise flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
              {initials(tenant)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">{tenantFullName(tenant)}</h2>
                <StatusBadge status={tenant.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {tenant.designation} · {tenant.employeeId}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toggleTenantStatus(tenant.id);
                toast.success(
                  `Tenant ${tenant.status === "Active" ? "deactivated" : "activated"} successfully`,
                );
              }}
            >
              {tenant.status === "Active" ? (
                <>
                  <PowerOff className="size-4" /> Deactivate
                </>
              ) : (
                <>
                  <Power className="size-4" /> Activate
                </>
              )}
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card animate-rise p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal Details
            </h3>
            <dl className="space-y-4">
              <Row label="First Name" value={tenant.firstName} />
              <Row label="Middle Name" value={tenant.middleName || "—"} />
              <Row label="Last Name" value={tenant.lastName} />
              <Row label="Employee ID" value={tenant.employeeId} />
              <Row label="Office Email" value={tenant.email} />
              <Row label="Mobile Number" value={tenant.mobile} />
            </dl>
          </div>

          <div className="surface-card animate-rise p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Organization Details
            </h3>
            <dl className="space-y-4">
              <Row label="Organization Name" value={tenant.organization} />
              <Row label="Designation" value={tenant.designation} />
              <Row label="Status" value={tenant.status} />
              <Row label="Number of Branches" value={String(tenant.branches.length)} />
            </dl>
            <div className="mt-5 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Branches</p>
              {tenant.branches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm"
                >
                  <MapPin className="size-4 shrink-0 text-accent" />
                  {b.location}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface-card animate-rise p-6">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="meta">Record</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="pt-5">
              <ul className="space-y-4">
                {tenant.activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                      <Clock className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.at)} · {formatRelative(a.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="meta" className="pt-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Row label="Tenant ID" value={tenant.id} />
                <Row label="Created On" value={formatDate(tenant.createdAt)} />
              </dl>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <TenantFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={tenant}
        onSubmit={(input) => {
          updateTenant(tenant.id, input);
          toast.success("Tenant updated successfully");
        }}
      />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

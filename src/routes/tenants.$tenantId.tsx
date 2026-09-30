import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Calendar, Clock, MapPin, Pencil, Power, PowerOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { UserFormDrawer } from "@/components/UserFormDrawer";
import { UserActivityItem, UserDetailCard, UserDetailRow } from "@/components/UserDetailSections";
import { useAdminStore, getAccessToken, type Tenant } from "@/lib/admin-store";
import { mapOrganizationToTenant, type OrganizationApiResponse } from "@/lib/organization-mapper";
import { formatUserDate, formatUserDateTime } from "@/lib/users-api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tenants/$tenantId")({
  head: () => ({
    meta: [
      { title: "Bank Detail — System Administrator Panel" },
      {
        name: "description",
        content: "Complete bank / NBFC profile: institution details, contact and address, system details, status and activity.",
      },
      { property: "og:title", content: "Bank Detail — System Administrator Panel" },
      {
        property: "og:description",
        content: "Institution details, contact, address, status and activity.",
      },
    ],
  }),
  component: TenantDetailPage,
});

/*
 * Extra fields returned by the organizations API that the
 * shared mapper type does not include.
 */
type OrganizationDetail = OrganizationApiResponse & {
  legal_name?: string;
  short_name?: string;
  country?: string;
  state?: string;
  city?: string;
  pin_code?: string;
  registered_address?: string;
  corporate_address?: string;
  website?: string;
  updated_at?: string;
  db_name?: string;
  db_host?: string;
  db_port?: number;
};

function TenantDetailPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { tenants, updateTenant, toggleTenantStatus } = useAdminStore();

  const [apiTenant, setApiTenant] = useState<Tenant | undefined>();
  const [raw, setRaw] = useState<OrganizationDetail | undefined>();
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("https://los-backend-355v.onrender.com/api/v1/administration/organizations", {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`Failed (${response.status})`);

        const body = await response.json();
        const list: OrganizationDetail[] = Array.isArray(body?.data) ? body.data : [];
        const match = list.find((o) => o.id === tenantId || String(o.pkid) === tenantId);

        if (!cancelled && match) {
          setRaw(match);
          setApiTenant(mapOrganizationToTenant(match));
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load bank");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const tenant = apiTenant ?? tenants.find((t) => t.id === tenantId);

  if (loading && !tenant) {
    return (
      <AppShell title="Bank Details" subtitle="Loading bank information...">
        <div className="surface-card flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="font-medium">Loading bank...</p>
            <p className="mt-1 text-sm text-muted-foreground">Fetching bank information.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!tenant) {
    return (
      <AppShell title="Bank not found">
        <div className="surface-card flex flex-col items-center gap-3 p-16 text-center">
          <Building2 className="size-10 text-muted-foreground" />
          <p className="font-medium">This bank could not be found</p>
          <Button variant="outline" onClick={() => navigate({ to: "/tenants" })}>
            <ArrowLeft className="size-4" />
            Back to Bank Management
          </Button>
        </div>
      </AppShell>
    );
  }

  const bankInitials =
    (tenant.instituteName || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "B";

  const createdAt = raw?.created_at ?? tenant.createdAt;
  const updatedAt = raw?.updated_at;
  const branches = tenant.branches ?? [];

  return (
    <AppShell title={tenant.instituteName} subtitle={tenant.instituteType || "Bank Details"}>
      <div className="space-y-6">
        {/* Back */}
        <Link
          to="/tenants"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Bank Management
        </Link>

        {/* Header */}
        <div className="surface-card animate-rise flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
              {bankInitials}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">{tenant.instituteName}</h2>
                <StatusBadge status={tenant.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {tenant.instituteType || "Institution"}
                {tenant.registrationNumber && <> · {tenant.registrationNumber}</>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setUserDrawerOpen(true)}>
              Add User
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toggleTenantStatus(tenant.id);
                toast.success(`Tenant ${tenant.status === "Active" ? "deactivated" : "activated"} successfully`);
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

        {/* Information cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UserDetailCard title="Institution Details">
            <UserDetailRow label="Institute Name" value={tenant.instituteName || null} />
            <UserDetailRow label="Legal Name" value={raw?.legal_name ?? null} />
            {/* <UserDetailRow label="Short Name" value={raw?.short_name ?? null} /> */}
            <UserDetailRow label="Institute Type" value={tenant.instituteType || null} />
            <UserDetailRow label="Registration Number" value={tenant.registrationNumber || null} />
            <UserDetailRow label="Regulatory Authority ID" value={tenant.regulatoryAuthorityId || null} />
            <UserDetailRow label="CIN No" value={tenant.cin || null} />
            <UserDetailRow label="Regulatory Status" value={raw?.regulatory_status ?? null} />
            <UserDetailRow label="Status" value={tenant.status} />
          </UserDetailCard>

          <UserDetailCard title="Contact & Address">
            {/* <UserDetailRow label="Official Email" value={tenant.contactEmail || null} /> */}
            {/* <UserDetailRow label="Official Mobile Number" value={tenant.contactPhone || null} /> */}
            <UserDetailRow label="Website" value={raw?.website ?? null} />
            <UserDetailRow label="Country" value={raw?.country ?? null} />
            {/* <UserDetailRow label="State" value={raw?.state ?? null} />
            <UserDetailRow label="City" value={raw?.city ?? null} />
            <UserDetailRow label="PIN Code" value={raw?.pin_code ?? null} />
            <UserDetailRow
              label="Registered Address"
              value={raw?.registered_address ?? null}
            />
            <UserDetailRow
              label="Corporate Address"
              value={raw?.corporate_address ?? null}
            /> */}
          </UserDetailCard>

          {/* <UserDetailCard title="System Details">
            <UserDetailRow label="Database Name" value={raw?.db_name ?? null} />
            <UserDetailRow label="Database Host" value={raw?.db_host ?? null} />
            <UserDetailRow label="Database Port" value={raw?.db_port ?? null} />
          </UserDetailCard> */}

          <UserDetailCard title="Record Information">
            <UserDetailRow label="Bank ID (pkid)" value={tenant.pkid ?? null} />
            <UserDetailRow label="Bank ID" value={tenant.id} />
            <UserDetailRow label="Created Date" value={formatUserDateTime(createdAt)} />
            <UserDetailRow label="Modified Date" value={formatUserDateTime(updatedAt)} />
          </UserDetailCard>
        </div>

        {/* Branches (only when available) */}
        {branches.length > 0 && (
          <div className="surface-card animate-rise p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branches ({branches.length})</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm">
                  <MapPin className="size-4 shrink-0 text-accent" />
                  {b.location}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity log */}
        <div className="surface-card animate-rise p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold">Activity Log</h3>
              <p className="text-xs text-muted-foreground">Bank account activity</p>
            </div>
          </div>

          <ul className="space-y-4">
            <UserActivityItem title="Bank onboarded" date={createdAt || ""} icon={<Calendar className="size-4" />} />
            <UserActivityItem
              title={`Status is ${tenant.status}`}
              date={updatedAt || createdAt || ""}
              icon={<ShieldCheck className="size-4" />}
            />
            {tenant.activity?.map((a) => (
              <UserActivityItem key={a.id} title={a.text} date={a.at} icon={<Clock className="size-4" />} />
            ))}
          </ul>
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
      <UserFormDrawer open={userDrawerOpen} onOpenChange={setUserDrawerOpen} bank={tenant} />
    </AppShell>
  );
}

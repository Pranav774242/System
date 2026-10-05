import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Power,
  PowerOff,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { UserFormDrawer } from "@/components/UserFormDrawer";
import {
  UserActivityItem,
  UserDetailCard,
  UserDetailRow,
  UserStatusBadge,
} from "@/components/UserDetailSections";
import {
  useAdminStore,
  getAccessToken,
  type Tenant,
} from "@/lib/admin-store";
import {
  mapOrganizationToTenant,
  type OrganizationApiResponse,
} from "@/lib/organization-mapper";
import {
  formatUserDateTime,
  getUserName,
  getUserRole,
  getUserStatus,
  type ApiUser,
} from "@/lib/users-api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tenants/$tenantId")({
  head: () => ({
    meta: [
      { title: "Bank Detail — System Administrator Panel" },
      {
        name: "description",
        content:
          "Complete bank / NBFC profile: institution details, contact and address, system details, status and activity.",
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
  short_name?: string;
  registered_address?: string;
  corporate_address?: string;
  db_name?: string;
  db_host?: string;
  db_port?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function getResponseError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return "";

  try {
    const body: unknown = JSON.parse(text);
    if (isRecord(body)) {
      for (const key of ["message", "detail", "error"]) {
        const value = body[key];
        if (typeof value === "string" && value.trim()) {
          return value;
        }
      }
    }
  } catch {
    return text.trim();
  }

  return "";
}

function TenantDetailPage() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { tenants, updateTenant, toggleTenantStatus } = useAdminStore();

  const [apiTenant, setApiTenant] = useState<Tenant | undefined>();
  const [raw, setRaw] = useState<OrganizationDetail | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const cachedTenant = tenants.find(
    (item) => item.id === tenantId || String(item.pkid) === tenantId,
  );
  const routePkid = Number(tenantId);
  const pkid =
    cachedTenant?.pkid ??
    (Number.isSafeInteger(routePkid) && routePkid > 0
      ? routePkid
      : undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(undefined);

      if (pkid === undefined) {
        setLoadError("A valid bank ID is required to load bank details.");
        setLoading(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        const message = "Your session has expired. Please log in again.";
        setLoadError(message);
        setLoading(false);
        toast.error(message);
        return;
      }

      try {
        const response = await fetch(
          `https://los-backend-355v.onrender.com/api/v1/administration/organizations/${encodeURIComponent(String(pkid))}`,
          {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          const message = await getResponseError(response);
          throw new Error(
            message || `Failed to load bank details (${response.status}).`,
          );
        }

        const body: unknown = await response.json();
        const match =
          isRecord(body) && isRecord(body["data"])
            ? body["data"] as OrganizationDetail
            : undefined;

        if (!cancelled && match) {
          const detail = { ...match, pkid: match.pkid ?? pkid };
          setRaw(detail);
          setApiTenant(mapOrganizationToTenant(detail));
        } else if (!cancelled) {
          throw new Error("The bank details response did not include bank data.");
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load bank details.";
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pkid, retryCount]);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const bankPkid = apiTenant?.pkid;

  const loadUsers = useCallback(async () => {
    if (bankPkid == null) return;

    try {
      setUsersLoading(true);

      const response = await fetch(
        "https://los-backend-355v.onrender.com/api/v1/administration/user-management/users",
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) throw new Error(`Failed to load users (${response.status})`);

      const body = await response.json();
      const list: ApiUser[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.data?.items)
          ? body.data.items
          : [];

      setUsers(
        list.filter((u) => String(u.organization_id) === String(bankPkid)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [bankPkid]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const tenant = apiTenant ?? cachedTenant;

  if (loading) {
    return (
      <AppShell title="Bank Details" subtitle="Loading bank information...">
        <div className="surface-card flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="font-medium">Loading bank...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fetching bank information.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell title="Unable to load bank details">
        <div className="surface-card flex flex-col items-center gap-3 p-16 text-center">
          <Building2 className="size-10 text-muted-foreground" />
          <p className="font-medium">Bank details could not be loaded</p>
          <p className="max-w-xl text-sm text-muted-foreground">{loadError}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/tenants" })}>
              <ArrowLeft className="size-4" />
              Back to Bank Management
            </Button>
            <Button onClick={() => setRetryCount((count) => count + 1)}>
              Try again
            </Button>
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
  const updatedAt = raw?.updated_at ?? undefined;
  const branches = tenant.branches ?? [];

  return (
    <AppShell
      title={tenant.instituteName}
      subtitle={tenant.instituteType || "Bank Details"}
    >
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
                <h2 className="text-xl font-bold tracking-tight">
                  {tenant.instituteName}
                </h2>
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

        {/* Information cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UserDetailCard title="Institution Details">
            <UserDetailRow label="Institute Name" value={tenant.instituteName || null} />
            <UserDetailRow label="Bank Code" value={tenant.bankCode || null} />
            <UserDetailRow label="Legal Name" value={tenant.legalName || null} />
            {/* <UserDetailRow label="Short Name" value={raw?.short_name ?? null} /> */}
            <UserDetailRow label="Institute Type" value={tenant.instituteType || null} />
            <UserDetailRow
              label="License No."
              value={tenant.licenseNo  || null}
            />
            {/* <UserDetailRow
              label="Regulatory Authority ID"
              value={tenant.regulatoryAuthorityId || null}
            /> */}
            <UserDetailRow label="PAN No." value={tenant.panNo || null} />
            <UserDetailRow label="GST No." value={tenant.gstNo || null} />
            <UserDetailRow label="CIN No." value={tenant.cin || null} />
            <UserDetailRow label="Logo URL" value={tenant.logoUrl || null} />
            <UserDetailRow
              label="Regulatory Status"
              value={raw?.regulatory_status ?? raw?.status ?? null}
            />
            <UserDetailRow label="Status" value={tenant.status} />
          </UserDetailCard>

          <UserDetailCard title="Contact & Address">
            <UserDetailRow label="Email" value={tenant.contactEmail || null} />
            <UserDetailRow label="Phone" value={tenant.contactPhone || null} />
            <UserDetailRow label="Website" value={tenant.website || null} />
            <UserDetailRow label="Address Type" value={tenant.addressDetails.addressType || null} />
            <UserDetailRow
              label="Unit / Gala Name & No."
              value={tenant.addressDetails.unitGalaNameNo || null}
            />
            <UserDetailRow label="Street / Road" value={tenant.addressDetails.streetRoad || null} />
            <UserDetailRow label="Landmark" value={tenant.addressDetails.landMark || null} />
            <UserDetailRow label="City" value={tenant.addressDetails.city || null} />
            <UserDetailRow label="State" value={tenant.addressDetails.state || null} />
            <UserDetailRow label="PIN Code" value={tenant.addressDetails.pinCode || null} />
            <UserDetailRow label="Country" value={raw?.country ?? null} />
          </UserDetailCard>

          <UserDetailCard title="Banking Details">
            <UserDetailRow
              label="Number of Branches"
              value={tenant.regulatoryDetails.numberOfBranches || null}
            />
            <UserDetailRow
              label="IFSC Code"
              value={tenant.regulatoryDetails.ifscCode || null}
            />
            <UserDetailRow
              label="MICR Code"
              value={tenant.regulatoryDetails.micrCode || null}
            />
            <UserDetailRow
              label="MICR City Code"
              value={tenant.regulatoryDetails.micrCityCode || null}
            />
            <UserDetailRow
              label="MICR Branch Code"
              value={tenant.regulatoryDetails.micrBranchCode || null}
            />
          </UserDetailCard>

          <UserDetailCard title="Record Information">
            <UserDetailRow label="Bank ID (pkid)" value={tenant.pkid ?? null} />
            <UserDetailRow label="Bank ID" value={tenant.id} />
            <UserDetailRow
              label="Created Date"
              value={formatUserDateTime(createdAt)}
            />
            <UserDetailRow
              label="Modified Date"
              value={formatUserDateTime(updatedAt)}
            />
          </UserDetailCard>
        </div>

        {/* Branches (only when available) */}
        {branches.length > 0 && (
          <div className="surface-card animate-rise p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Branches ({branches.length})
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {branches.map((b) => (
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
        )}

                {/* Users */}
        <div className="surface-card animate-rise overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold">Users</h3>
              <p className="text-xs text-muted-foreground">
                {usersLoading ? "Loading users…" : `${users.length} user(s) in this bank`}
              </p>
            </div>
          </div>

          {usersLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No users have been added to this bank yet.
              </p>
              <Button variant="outline" onClick={() => setUserDrawerOpen(true)}>
                Add User
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {["Name", "Emp No", "Email", "Mobile", "Designation", "Role", "Status"].map(
                      (label) => (
                        <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const status = getUserStatus(u);
                    const active =
                      u.is_active === true || status === "ACTIVE" || status === "OPERATIVE";

                    return (
                      <tr
                        key={u.id ?? u.pkid}
                        onClick={() =>
                          navigate({
                            to: "/users/$userId",
                            params: { userId: String(u.id ?? u.pkid) },
                          })
                        }
                        className="cursor-pointer border-t border-border transition-colors hover:bg-secondary/60"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {getUserName(u) || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {u.emp_no || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {u.email || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {u.mobile || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {u.designation || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {getUserRole(u) || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <UserStatusBadge status={status} active={active} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity log */}
        {/* <div className="surface-card animate-rise p-6">
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
            <UserActivityItem
              title="Bank onboarded"
              date={createdAt || ""}
              icon={<Calendar className="size-4" />}
            />
            <UserActivityItem
              title={`Status is ${tenant.status}`}
              date={updatedAt || createdAt || ""}
              icon={<ShieldCheck className="size-4" />}
            />
            {tenant.activity?.map((a) => (
              <UserActivityItem
                key={a.id}
                title={a.text}
                date={a.at}
                icon={<Clock className="size-4" />}
              />
            ))}
          </ul>
        </div> */}
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
      <UserFormDrawer
        open={userDrawerOpen}
        onOpenChange={(open) => {
          setUserDrawerOpen(open);
          if (!open) loadUsers();
        }}
        bank={tenant}
      />
    </AppShell>
  );
}
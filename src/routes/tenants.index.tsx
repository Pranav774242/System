import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Pencil,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { mapOrganizationToTenant } from "@/lib/organization-mapper";

import {
  useAdminStore,
  getAccessToken,
  type Tenant,
} from "@/lib/admin-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/tenants/")({
  head: () => ({
    meta: [
      {
        title: "Tenant Management — System Administrator Panel",
      },
      {
        name: "description",
        content:
          "Create, search, sort and administer every bank and NBFC tenant on the Banking LOS platform.",
      },
      {
        property: "og:title",
        content: "Tenant Management — System Administrator Panel",
      },
      {
        property: "og:description",
        content:
          "Create, search and administer every bank and NBFC tenant on the platform.",
      },
    ],
  }),
  component: TenantsPage,
});

type SortKey =
  | "instituteName"
  | "instituteType"
  | "registrationNumber"
  | "regulatoryAuthorityId"
  | "cin"
  | "status";

const PAGE_SIZE = 10;

/*
 * Backend organization response
 */
type OrganizationApiResponse = {
  id?: string;
  pkid?: number;

  name?: string;
  type?: string;

  institution_name?: string;
  institution_type?: string;

  registration_number?: string;
  registration_id?: string;

  regulatory_authority?: string;
  regulatory_authority_id?: string;

  cin?: string;
  cin_no?: string;
  cin_number?: string;

  regulatory_status?: string;
  status?: string;

  country?: string;
  state?: string;
  city?: string;
  pin_code?: string;
  registered_address?: string;
  corporate_address?: string;

  contact_email?: string;
  contact_phone?: string;

  website?: string;
  legal_name?: string;
  short_name?: string;

  created_at?: string;
  updated_at?: string;

  db_name?: string;
  db_host?: string;
  db_port?: number;
};

function TenantsPage() {
  const { tenants, createTenant } = useAdminStore();

  const navigate = useNavigate();

  /*
   * This state contains the organizations received
   * from the GET API after mapping.
   */
  const [apiTenants, setApiTenants] = useState<Tenant[]>([]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const [sort, setSort] = useState<{
    key: SortKey;
    dir: "asc" | "desc";
  }>({
    key: "instituteName",
    dir: "asc",
  });

  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] =
    useState(false);

  /*
   * ============================================================
   * GET ORGANIZATIONS
   * ============================================================
   */
  useEffect(() => {
    let cancelled = false;

    const loadOrganizations = async () => {
      const token = getAccessToken();

      if (!token) {
        toast.error("Session expired. Please login again.");
        setLoadingOrganizations(false);
        return;
      }

      try {
        setLoadingOrganizations(true);

        const response = await fetch(
          "https://los-backend-355v.onrender.com/api/v1/administration/organizations",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const responseText = await response.text();

        let responseData: unknown = null;

        try {
          responseData = responseText
            ? JSON.parse(responseText)
            : null;
        } catch {
          responseData = null;
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Unauthorized / session expired",
            );
          }

          if (response.status === 403) {
            throw new Error(
              "You do not have permission to view organizations",
            );
          }

          throw new Error(
            `Failed to load organizations (${response.status})`,
          );
        }

        if (cancelled) return;

        /*
         * ========================================================
         * EXTRACT DATA FROM API RESPONSE
         * ========================================================
         *
         * Expected:
         *
         * {
         *   success: true,
         *   data: [...]
         * }
         *
         */
        const body = responseData as {
          data?: unknown;
        };

        const organizations: OrganizationApiResponse[] =
          Array.isArray(body?.data)
            ? (body.data as OrganizationApiResponse[])
            : [];

        console.log(
          "Organizations received from API:",
          organizations,
        );

        /*
         * ========================================================
         * MAP BACKEND RESPONSE -> FRONTEND TENANT
         * ========================================================
         */
const mappedTenants: Tenant[] = organizations.map(mapOrganizationToTenant);

        console.log(
          "Mapped tenants for table:",
          mappedTenants,
        );

        /*
         * ========================================================
         * MOST IMPORTANT LINE
         * ========================================================
         *
         * Store the mapped API records in React state.
         *
         * The table will use apiTenants.
         */
        setApiTenants(mappedTenants);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load organizations:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load organizations",
        );

        /*
         * If API fails, clear API list.
         */
        setApiTenants([]);
      } finally {
        if (!cancelled) {
          setLoadingOrganizations(false);
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Existing skeleton loading
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  /*
   * ============================================================
   * WHICH DATA SHOULD THE TABLE USE?
   * ============================================================
   *
   * If GET API has returned data -> use API data.
   *
   * Otherwise -> use existing store data.
   */
  const displayTenants =
    apiTenants.length > 0
      ? apiTenants
      : tenants;

  /*
   * Reset pagination when search/filter changes
   */
  useEffect(() => {
    setPage(1);
  }, [query, status]);

  /*
   * ============================================================
   * SEARCH + FILTER + SORT
   * ============================================================
   */
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const value = (
      tenant: Tenant,
      key: SortKey,
    ): string => {
      switch (key) {
        case "instituteName":
          return (
            tenant.instituteName ?? ""
          ).toLowerCase();

        case "instituteType":
          return (
            tenant.instituteType ?? ""
          ).toLowerCase();

        case "registrationNumber":
          return (
            tenant.registrationNumber ?? ""
          ).toLowerCase();

        case "regulatoryAuthorityId":
          return (
            tenant.regulatoryAuthorityId ?? ""
          ).toLowerCase();

        case "cin":
          return (
            tenant.cin ?? ""
          ).toLowerCase();

        case "status":
          return (
            tenant.status ?? ""
          ).toLowerCase();

        default:
          return "";
      }
    };

    return displayTenants
      .filter((tenant) => {
        if (status === "All") {
          return true;
        }

        return tenant.status === status;
      })
      .filter((tenant) => {
        if (!q) {
          return true;
        }

        return [
          tenant.instituteName,
          tenant.instituteType,
          tenant.registrationNumber,
          tenant.regulatoryAuthorityId,
          tenant.cin,
          tenant.contactEmail,
          tenant.contactPhone,
          tenant.organization,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const av = value(a, sort.key);
        const bv = value(b, sort.key);

        const comparison =
          av > bv
            ? 1
            : av < bv
              ? -1
              : 0;

        return sort.dir === "asc"
          ? comparison
          : -comparison;
      });
  }, [
    displayTenants,
    query,
    status,
    sort,
  ]);

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE),
  );

  const pageRows = rows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  /*
   * Sort
   */
  const toggleSort = (key: SortKey) => {
    setSort((previous) => ({
      key,
      dir:
        previous.key === key &&
        previous.dir === "asc"
          ? "desc"
          : "asc",
    }));
  };

  /*
   * ============================================================
   * TABLE COLUMNS
   * ============================================================
   */
  const columns: {
    key: SortKey | null;
    label: string;
  }[] = [
    {
      key: "instituteName",
      label: "Institute Name",
    },
    {
      key: "instituteType",
      label: "Institute Type",
    },
    {
      key: "registrationNumber",
      label: "Registration Number",
    },
    {
      key: "regulatoryAuthorityId",
      label: "Regulatory Authority ID",
    },
    {
      key: "cin",
      label: "CIN No",
    },
    {
      key: "status",
      label: "Status",
    },
    
    {
      key: null,
      label: "Action",
    },
  ];

  return (
    <AppShell
      title="Bank Management"
      subtitle={`${displayTenants.length} Banks onboarded on the platform`}
      actions={
        <Button
          onClick={() => setDrawerOpen(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="size-4" />
          Create Bank
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search and filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search by name, registration number, email…"
              className="pl-9"
            />
          </div>

          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">
                All statuses
              </SelectItem>

              <SelectItem value="Active">
                Active
              </SelectItem>

              <SelectItem value="Inactive">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="surface-card animate-rise overflow-hidden">
          {!loaded || loadingOrganizations ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-11 w-full"
                  />
                ),
              )}
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Building2 className="size-6" />
              </span>

              <p className="font-medium">
                No tenants match your filters
              </p>

              <p className="max-w-sm text-sm text-muted-foreground">
                Try a different search term or status
                filter, or onboard a new bank / NBFC
                tenant.
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  setDrawerOpen(true)
                }
              >
                <Plus className="size-4" />
                Create Bank
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {columns.map(
                      (column, index) => (
                        <th
                          key={index}
                          className="whitespace-nowrap px-4 py-3 font-medium"
                        >
                          {column.key ? (
                            <button
                              onClick={() =>
                                toggleSort(
                                  column.key!,
                                )
                              }
                              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                            >
                              {column.label}

                              <ArrowUpDown className="size-3" />
                            </button>
                          ) : (
                            column.label
                          )}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map(
                    (tenant: Tenant) => (
                      <tr
                        key={tenant.id}
                        onClick={() =>
                          navigate({
                            to: "/tenants/$tenantId",
                            params: {
                              tenantId:
                                tenant.id,
                            },
                          })
                        }
                        className="cursor-pointer border-t border-border transition-colors hover:bg-secondary/60"
                      >
                        {/* Institute Name */}
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {tenant.instituteName ||
                            "-"}
                        </td>

                        {/* Institute Type */}
                        <td className="whitespace-nowrap px-4 py-3">
                          {tenant.instituteType ||
                            "-"}
                        </td>

                        {/* Registration Number */}
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {tenant.registrationNumber ||
                            "-"}
                        </td>

                        {/* Regulatory Authority ID */}
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {tenant.regulatoryAuthorityId ||
                            "-"}
                        </td>

                        {/* CIN */}
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {tenant.cin || "-"}
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge
                            status={
                              tenant.status
                            }
                          />
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Row actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate({
                                    to: "/tenants/$tenantId",
                                    params: {
                                      tenantId:
                                        tenant.id,
                                    },
                                  })
                                }
                              >
                                <Eye className="mr-2 size-4" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  navigate({
                                    to: "/tenants/$tenantId",
                                    params: {
                                      tenantId:
                                        tenant.id,
                                    },
                                  })
                                }
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {loaded &&
            !loadingOrganizations &&
            pageRows.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  Showing{" "}
                  {(page - 1) *
                    PAGE_SIZE +
                    1}
                  –
                  {Math.min(
                    page * PAGE_SIZE,
                    rows.length,
                  )}{" "}
                  of {rows.length}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() =>
                      setPage(
                        (previous) =>
                          previous - 1,
                      )
                    }
                  >
                    Previous
                  </Button>

                  <span className="text-muted-foreground">
                    Page {page} of{" "}
                    {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      page >= totalPages
                    }
                    onClick={() =>
                      setPage(
                        (previous) =>
                          previous + 1,
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Create Bank Drawer */}
      <TenantFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSubmit={(input) => {
          createTenant(input);

          /*
           * After creating a new bank through the existing
           * frontend store, reload the page data from API
           * so the newly created backend record appears
           * in the list.
           */
          window.location.reload();
        }}
      />
    </AppShell>
  );
}
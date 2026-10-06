import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Pencil,
  Building2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { mapOrganizationToTenant } from "@/lib/organization-mapper";

import { useAdminStore, getAccessToken, type Tenant } from "@/lib/admin-store";

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

/* -------------------------------------------------------------------------- */
/* ROUTE                                                                      */
/* -------------------------------------------------------------------------- */

export const Route = createFileRoute("/tenants/")({
  head: () => ({
    meta: [
      { title: "Bank Management — System Administrator Panel" },
      {
        name: "description",
        content: "Create, search, sort and manage banks and NBFCs on the Allianza LOS platform.",
      },
      {
        property: "og:title",
        content: "Bank Management — System Administrator Panel",
      },
      {
        property: "og:description",
        content: "Create, search and manage banks and NBFCs on the Allianza LOS platform.",
      },
    ],
  }),

  component: TenantsPage,
});

/* -------------------------------------------------------------------------- */
/* BANK LIST TYPES                                                            */
/* -------------------------------------------------------------------------- */

type SortKey =
  | "bankCode"
  | "instituteName"
  | "instituteType"
  | "registrationNumber"
  | "gstNo"
  | "licenseNo"
  | "cin"
  | "status";

type BankTenant = Tenant & {
  pkid?: number;
  bankCode?: string;
  legalName?: string;
  panNo?: string;
  gstNo?: string;
  licenseNo?: string;
  logoUrl?: string;
};

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/* BACKEND ORGANIZATION RESPONSE                                              */
/* -------------------------------------------------------------------------- */

type OrganizationApiResponse = {
  id?: string;
  pkid?: number;

  bank_code?: string;
  bankCode?: string;

  bank_name?: string;
  bankName?: string;

  bank_type?: string;
  bankType?: string;

  name?: string;
  type?: string;

  institution_name?: string;
  institution_type?: string;

  license_no?: string;
  license_number?: string;
  licenseNo?: string;

  registration_number?: string;
  registration_id?: string;
  registrationId?: string;

  regulatory_authority?: string;
  regulatory_authority_id?: string;
  regulatoryAuthorityId?: string;

  direct_clg_member?: string;
  direct_member_iftas?: string;

  micr_code?: string;
  micr_number?: string;

  ifsc_code?: string;

  number_of_branches?: number;
  no_of_branches?: number;

  sponsor_bank_for_clg?: string;
  sponsor_bank_for_iftas?: string;

  pan_no?: string;
  pan_number?: string;
  pan?: string;

  gst_no?: string;
  gst_number?: string;
  gstNo?: string;
  gst?: string;

  cin?: string;
  CIN?: string;
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
  logo_url?: string;

  legal_name?: string;
  short_name?: string;

  address_type?: string;
  unit_gala_name_no?: string;
  street_road?: string;
  landmark?: string;

  created_at?: string;
  updated_at?: string;

  db_name?: string;
  db_host?: string;
  db_port?: number;

  branches?: unknown[];
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getBankCode(organization: OrganizationApiResponse): string {
  return organization.bank_code ?? organization.bankCode ?? "";
}

function getBankName(organization: OrganizationApiResponse): string {
  return (
    organization.bank_name ??
    organization.bankName ??
    organization.institution_name ??
    organization.name ??
    ""
  );
}

function getBankType(organization: OrganizationApiResponse): string {
  return (
    organization.bank_type ??
    organization.institution_type ??
    organization.bankType ??
    organization.type ??
    ""
  );
}

function getLicenseNumber(organization: OrganizationApiResponse): string {
  return organization.license_no ?? organization.license_number ?? organization.licenseNo ?? "";
}

function getRegistrationNumber(organization: OrganizationApiResponse): string {
  return (
    organization.registration_id ??
    organization.registrationId ??
    organization.registration_number ??
    ""
  );
}

function getPanNumber(organization: OrganizationApiResponse): string {
  return organization.pan_no ?? organization.pan_number ?? organization.pan ?? "";
}

function getGstNumber(organization: OrganizationApiResponse): string {
  return (
    organization.gst_no ?? organization.gstNo ?? organization.gst_number ?? organization.gst ?? ""
  );
}

function getCINNumber(organization: OrganizationApiResponse): string {
  return (
    organization.CIN ?? organization.cin_no ?? organization.cin_number ?? organization.cin ?? ""
  );
}

/* -------------------------------------------------------------------------- */
/* NORMALIZE BANK TENANT                                                       */
/* -------------------------------------------------------------------------- */

function normalizeBankTenant(organization: OrganizationApiResponse): BankTenant {
  const mapped = mapOrganizationToTenant(organization) as BankTenant;

  const bankCode = getBankCode(organization);
  const bankName = getBankName(organization);
  const bankType = getBankType(organization);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const registrationNumber = getRegistrationNumber(organization);
  const licenseNumber = getLicenseNumber(organization);
  const panNumber = getPanNumber(organization);
  const gstNumber = getGstNumber(organization);
  const cinNumber = getCINNumber(organization);

  return {
    ...mapped,

    /* Keep the backend primary key so "View Users" can pass it on. */
    pkid: organization.pkid ?? mapped.pkid,

    bankCode,

    instituteName: bankName || mapped.instituteName || "",

    instituteType: bankType.toUpperCase() === "NBFC" ? "NBFC" : "BANK",

    licenseNo: licenseNumber,
    panNo: panNumber,
    gstNo: gstNumber,
    cin: cinNumber || mapped.cin || "",

    legalName: organization.legal_name ?? "",

    organization: bankName || mapped.organization || "",
    firstName: bankName || mapped.firstName || "",
    employeeId: licenseNumber || mapped.employeeId || "",
    email: organization.contact_email ?? mapped.email ?? "",
    mobile: organization.contact_phone ?? mapped.mobile ?? "",
  };
}

/* -------------------------------------------------------------------------- */
/* BANK MANAGEMENT PAGE                                                       */
/* -------------------------------------------------------------------------- */

function TenantsPage() {
  const { tenants, createTenant } = useAdminStore();

  const navigate = useNavigate();

  const [apiTenants, setApiTenants] = useState<BankTenant[]>([]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "instituteName",
    dir: "asc",
  });

  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

  const organizationRequestId = useRef(0);

  /* ------------------------------------------------------------------------ */
  /* GET ORGANIZATIONS API                                                     */
  /* ------------------------------------------------------------------------ */

  const loadOrganizations = useCallback(async () => {
    const requestId = ++organizationRequestId.current;

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
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (error) {
        console.error("Invalid organizations API response:", error);

        throw new Error("Invalid organizations API response.", {
          cause: error,
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Your session has expired.");
        }

        if (response.status === 403) {
          throw new Error("You do not have permission to view banks.");
        }

        throw new Error(`Failed to load banks (${response.status}).`);
      }

      let organizations: OrganizationApiResponse[] = [];

      if (Array.isArray(responseData)) {
        organizations = responseData as OrganizationApiResponse[];
      } else if (responseData && typeof responseData === "object") {
        const body = responseData as {
          data?: unknown;
          organizations?: unknown;
        };

        if (Array.isArray(body.data)) {
          organizations = body.data as OrganizationApiResponse[];
        } else if (Array.isArray(body.organizations)) {
          organizations = body.organizations as OrganizationApiResponse[];
        }
      }

      console.log("Organizations received from API:", organizations);

      const mappedTenants = organizations.map(normalizeBankTenant);

      console.log("Banks mapped for table:", mappedTenants);

      if (requestId === organizationRequestId.current) {
        setApiTenants(mappedTenants);
      }

      return mappedTenants;
    } catch (error) {
      if (requestId !== organizationRequestId.current) {
        return undefined;
      }

      console.error("Failed to load organizations:", error);

      toast.error(error instanceof Error ? error.message : "Failed to load banks.");

      return undefined;
    } finally {
      if (requestId === organizationRequestId.current) {
        setLoadingOrganizations(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  const displayTenants: BankTenant[] =
    apiTenants.length > 0 ? apiTenants : (tenants as BankTenant[]);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  /* ------------------------------------------------------------------------ */
  /* SEARCH + FILTER + SORT                                                   */
  /* ------------------------------------------------------------------------ */

  const rows = useMemo<BankTenant[]>(() => {
    const q = query.trim().toLowerCase();

    const value = (tenant: BankTenant, key: SortKey): string => {
      switch (key) {
        case "bankCode":
          return (tenant.bankCode ?? "").toLowerCase();
        case "instituteName":
          return (tenant.instituteName ?? "").toLowerCase();
        case "instituteType":
          return (tenant.instituteType ?? "").toLowerCase();
        case "registrationNumber":
          return (tenant.registrationNumber ?? "").toLowerCase();
        case "gstNo":
          return (tenant.gstNo ?? "").toLowerCase();
        case "licenseNo":
          return (tenant.licenseNo ?? "").toLowerCase();
        case "cin":
          return (tenant.cin ?? "").toLowerCase();
        case "status":
          return (tenant.status ?? "").toLowerCase();
        default:
          return "";
      }
    };

    return displayTenants
      .filter((tenant) => (status === "All" ? true : tenant.status === status))
      .filter((tenant) => {
        if (!q) {
          return true;
        }

        return [
          tenant.bankCode,
          tenant.instituteName,
          tenant.instituteType,
          tenant.registrationNumber,
          tenant.gstNo,
          tenant.licenseNo,
          tenant.cin,
          tenant.contactEmail,
          tenant.contactPhone,
          tenant.organization,
          tenant.legalName,
          tenant.panNo,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const av = value(a, sort.key);
        const bv = value(b, sort.key);

        const comparison = av > bv ? 1 : av < bv ? -1 : 0;

        return sort.dir === "asc" ? comparison : -comparison;
      });
  }, [displayTenants, query, status, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setSort((previous) => ({
      key,
      dir: previous.key === key && previous.dir === "asc" ? "desc" : "asc",
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* VIEW USERS                                                               */
  /* ------------------------------------------------------------------------ */

  const openUsers = (tenant: BankTenant) => {
    const pkid = tenant.pkid;

    console.log("View Users clicked. Selected pkid:", pkid, tenant);

    if (pkid === undefined || pkid === null) {
      toast.error("Unable to open users: this bank has no pkid.");
      return;
    }

    navigate({
      to: "/bank-users",
      state: {
        organizationId: String(pkid),
        bankName: tenant.instituteName,
      } as never,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* TABLE COLUMNS                                                            */
  /* ------------------------------------------------------------------------ */

  const columns: { key: SortKey | null; label: string }[] = [
    { key: "bankCode", label: "Bank Code" },
    { key: "instituteName", label: "Bank Name" },
    { key: "instituteType", label: "Bank Type" },
    { key: "gstNo", label: "GST No." },
    { key: "licenseNo", label: "License No." },
    { key: "cin", label: "CIN No." },
    { key: "status", label: "Status" },
    { key: null, label: "Action" },
    { key: null, label: "View Users" },
  ];

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <AppShell
      title="Bank Management"
      subtitle={`${displayTenants.length} banks onboarded on the platform`}
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
        {/* SEARCH AND FILTER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by bank name, bank code, license number, GST number..."
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TABLE */}
        <div className="surface-card animate-rise overflow-hidden">
          {!loaded || loadingOrganizations ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Building2 className="size-6" />
              </span>

              <p className="font-medium">No banks match your filters</p>

              <p className="max-w-sm text-sm text-muted-foreground">
                Try a different search term or status filter, or create a new bank.
              </p>

              <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                <Plus className="size-4" />
                Create Bank
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {columns.map((column, index) => (
                      <th key={index} className="whitespace-nowrap px-4 py-3 font-medium">
                        {column.key ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key as SortKey)}
                            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          >
                            {column.label}
                            <ArrowUpDown className="size-3" />
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((tenant) => (
                    <tr
                      key={tenant.id}
                      onClick={() =>
                        navigate({
                          to: "/tenants/$tenantId",
                          params: {
                            tenantId: String(tenant.pkid ?? tenant.id),
                          },
                        })
                      }
                      className="cursor-pointer border-t border-border transition-colors hover:bg-secondary/60"
                    >
                      {/* Bank Code */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {tenant.bankCode || "-"}
                      </td>

                      {/* Bank Name */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {tenant.instituteName || "-"}
                      </td>

                      {/* Bank Type */}
                      <td className="whitespace-nowrap px-4 py-3">{tenant.instituteType || "-"}</td>

                      {/* GST No. */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {tenant.gstNo || "-"}
                      </td>

                      {/* License No. */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {tenant.licenseNo || "-"}
                      </td>

                      {/* CIN No. */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {tenant.cin || "-"}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={tenant.status} />
                      </td>

                      {/* Actions */}
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Row actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/tenants/$tenantId",
                                  params: {
                                    tenantId: String(tenant.pkid ?? tenant.id),
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
                                    tenantId: String(tenant.pkid ?? tenant.id),
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

                      {/* View Users */}
                      <td
                        className="whitespace-nowrap px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" onClick={() => openUsers(tenant)}>
                          <Users className="mr-1.5 size-4" />
                          View Users
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {loaded && !loadingOrganizations && pageRows.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of{" "}
                {rows.length}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((previous) => previous - 1)}
                >
                  Previous
                </Button>

                <span className="text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE BANK DRAWER */}
      <TenantFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSubmit={async (input) => {
          const createdTenant = createTenant(input);

          const refreshedBanks = await loadOrganizations();

          if (!refreshedBanks?.some((bank) => bank.bankCode === input.bankCode)) {
            setApiTenants((currentBanks) =>
              currentBanks.some((bank) => bank.bankCode === input.bankCode)
                ? currentBanks
                : [createdTenant as BankTenant, ...currentBanks],
            );
          }
        }}
      />
    </AppShell>
  );
}

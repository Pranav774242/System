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
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { useAdminStore, type Tenant } from "@/lib/admin-store";

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
        content:
          "Create, search, sort and manage banks and NBFCs on the Allianza LOS platform.",
      },
      {
        property: "og:title",
        content: "Bank Management — System Administrator Panel",
      },
      {
        property: "og:description",
        content:
          "Create, search and manage banks and NBFCs on the Allianza LOS platform.",
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

type BankTenant = Tenant;

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/* BANK MANAGEMENT PAGE                                                       */
/* -------------------------------------------------------------------------- */

function TenantsPage() {
  const { tenants, tenantsLoading, createTenant, refreshTenants } =
    useAdminStore();

  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "instituteName",
    dir: "asc",
  });

  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const displayTenants = tenants as BankTenant[];

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

    if (pkid === undefined || !Number.isSafeInteger(pkid) || pkid <= 0) {
      toast.error("Unable to open users: this bank has no valid ID.");
      return;
    }

    navigate({
      to: "/bank-users",
      state: {
        organizationId: String(pkid),
        bankName: tenant.instituteName,
        organizationCode: tenant.bankCode,
        branches: tenant.branches,
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
    // { key: "cin", label: "CIN No." },
    { key: "status", label: "Status" },
    // { key: null, label: "Action" },
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
          {tenantsLoading ? (
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
                Try a different search term or status filter, or create a new
                bank.
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
                      <th
                        key={index}
                        className="whitespace-nowrap px-4 py-3 font-medium"
                      >
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
                      <td className="whitespace-nowrap px-4 py-3">
                        {tenant.instituteType || "-"}
                      </td>

                      {/* GST No. */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {tenant.gstNo || "-"}
                      </td>

                      {/* License No. */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {tenant.licenseNo || "-"}
                      </td>

                      {/* CIN No. */}
                      {/* <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {tenant.cin || "-"}
                      </td> */}

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={tenant.status} />
                      </td>

                      {/* Actions */}
                      {/* <td
                        className="px-4 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
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
                      </td> */}

                      {/* View Users */}
                      <td
                        className="whitespace-nowrap px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUsers(tenant)}
                        >
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
          {!tenantsLoading && pageRows.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
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
        onSubmit={async (input, bankId) => {
          if (bankId !== undefined) {
            createTenant(input, bankId);
            return;
          }

          const refreshedBanks = await refreshTenants();
          if (!refreshedBanks) {
            throw new Error(
              "Bank was created, but the bank list could not be refreshed.",
            );
          }

          const createdBankIsListed = refreshedBanks.some(
            (bank) =>
              bank.bankCode.toUpperCase() === input.bankCode.toUpperCase() &&
              bank.bankName.toLowerCase() === input.bankName.toLowerCase(),
          );
          if (!createdBankIsListed) {
            throw new Error(
              "Bank was created, but it was not found in the refreshed bank list.",
            );
          }
        }}
      />
    </AppShell>
  );
}

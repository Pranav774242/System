import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Pencil,
  PowerOff,
  Power,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { tenantFullName, useAdminStore, type Tenant } from "@/lib/admin-store";
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
      { title: "Tenant Management — System Administrator Panel" },
      {
        name: "description",
        content:
          "Create, search, sort and administer every bank and NBFC tenant on the Banking LOS platform, with branches and designations.",
      },
      { property: "og:title", content: "Tenant Management — System Administrator Panel" },
      {
        property: "og:description",
        content: "Create, search and administer every bank and NBFC tenant on the platform.",
      },
    ],
  }),
  component: TenantsPage,
});

type SortKey = "name" | "employeeId" | "organization" | "branches" | "designation" | "status";

const PAGE_SIZE = 10;

function TenantsPage() {
  const { tenants, createTenant, toggleTenantStatus } = useAdminStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => setPage(1), [query, status]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const value = (t: Tenant, key: SortKey) => {
      switch (key) {
        case "name":
          return tenantFullName(t).toLowerCase();
        case "branches":
          return t.branches.length;
        default:
          return String(t[key]).toLowerCase();
      }
    };
    return tenants
      .filter((t) => (status === "All" ? true : t.status === status))
      .filter((t) =>
        !q
          ? true
          : [tenantFullName(t), t.employeeId, t.email, t.mobile, t.organization, t.designation]
              .join(" ")
              .toLowerCase()
              .includes(q),
      )
      .sort((a, b) => {
        const av = value(a, sort.key);
        const bv = value(b, sort.key);
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av) > String(bv) ? 1 : String(av) < String(bv) ? -1 : 0;
        return sort.dir === "asc" ? cmp : -cmp;
      });
  }, [tenants, query, status, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));

  const columns: { key: SortKey | null; label: string; className?: string }[] = [
    { key: "name", label: "Full Name" },
    { key: "employeeId", label: "Employee ID" },
    { key: null, label: "Office Email" },
    { key: null, label: "Mobile Number" },
    { key: "organization", label: "Organization" },
    { key: "branches", label: "Branches" },
    { key: "designation", label: "Designation" },
    { key: "status", label: "Status" },
    { key: null, label: "" },
  ];

  return (
    <AppShell
      title="Tenant Management"
      subtitle={`${tenants.length} tenants onboarded on the platform`}
      actions={
        <Button onClick={() => setDrawerOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="size-4" /> Create Tenant
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, organization…"
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

        <div className="surface-card animate-rise overflow-hidden">
          {!loaded ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Building2 className="size-6" />
              </span>
              <p className="font-medium">No tenants match your filters</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try a different search term or status filter, or onboard a new bank / NBFC tenant.
              </p>
              <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                <Plus className="size-4" /> Create Tenant
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {columns.map((c, i) => (
                      <th key={i} className="whitespace-nowrap px-4 py-3 font-medium">
                        {c.key ? (
                          <button
                            onClick={() => toggleSort(c.key!)}
                            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          >
                            {c.label}
                            <ArrowUpDown className="size-3" />
                          </button>
                        ) : (
                          c.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate({ to: "/tenants/$tenantId", params: { tenantId: t.id } })}
                      className="cursor-pointer border-t border-border transition-colors hover:bg-secondary/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{tenantFullName(t)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.employeeId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.mobile}</td>
                      <td className="whitespace-nowrap px-4 py-3">{t.organization}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.branches.length}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.designation}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Row actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({ to: "/tenants/$tenantId", params: { tenantId: t.id } })
                              }
                            >
                              <Eye className="mr-2 size-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate({
                                  to: "/tenants/$tenantId",
                                  params: { tenantId: t.id },
                                })
                              }
                            >
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                toggleTenantStatus(t.id);
                                toast.success(
                                  `${tenantFullName(t)} is now ${t.status === "Active" ? "Inactive" : "Active"}`,
                                );
                              }}
                            >
                              {t.status === "Active" ? (
                                <>
                                  <PowerOff className="mr-2 size-4" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 size-4" /> Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {loaded && pageRows.length > 0 && (
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
                  onClick={() => setPage((p) => p - 1)}
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
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TenantFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSubmit={(input) => {
          createTenant(input);
          toast.success("Tenant created successfully");
        }}
      />
    </AppShell>
  );
}

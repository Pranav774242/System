import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { getAccessToken } from "@/lib/admin-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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

export const Route = createFileRoute("/bank-users")({
  head: () => ({
    meta: [
      { title: "Bank Users — System Administrator Panel" },
      {
        name: "description",
        content: "View all users belonging to the selected bank or NBFC.",
      },
    ],
  }),

  component: BankUsersPage,
});

/*
 * The selected bank is passed through router state (not the URL).
 * sessionStorage keeps it available if the page is refreshed.
 */
const CONTEXT_KEY = "bank-users-context";

function useOrgContext(): { organizationId: string; bankName?: string } {
  const state = useLocation({ select: (l) => l.state }) as {
    organizationId?: string;
    bankName?: string;
  };

  return useMemo(() => {
    if (state?.organizationId) {
      const ctx = {
        organizationId: state.organizationId,
        bankName: state.bankName,
      };
      try {
        sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
      } catch {
        /* ignore */
      }
      return ctx;
    }

    try {
      const saved = sessionStorage.getItem(CONTEXT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }

    return { organizationId: "", bankName: undefined };
  }, [state?.organizationId, state?.bankName]);
}

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ApiRecord = Record<string, unknown>;

type BankUser = {
  key: string;
  name: string;
  role: string;
  branch: string;
  email: string;
  employeeId: string;
  status: "Active" | "Inactive";
};

const PAGE_SIZE = 10;

const USERS_API_BASE = "https://los-backend-355v.onrender.com/api/v1/administration/users";

/* -------------------------------------------------------------------------- */
/* HELPERS — tolerant mapping of the users API response                       */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

/* Reads a string from a plain value or from a nested object ({ name }). */
function pickText(record: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as ApiRecord;
      const nestedText = text(nested.name) || text(nested.title) || text(nested.role_name);
      if (nestedText) return nestedText;
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (first && typeof first === "object") {
        const nested = first as ApiRecord;
        const nestedText = text(nested.name) || text(nested.role_name);
        if (nestedText) return nestedText;
      } else if (text(first)) {
        return text(first);
      }
      continue;
    }

    const result = text(value);
    if (result) return result;
  }

  return "";
}

function resolveStatus(record: ApiRecord): "Active" | "Inactive" {
  const flag = record.is_active ?? record.isActive ?? record.active;

  if (typeof flag === "boolean") {
    return flag ? "Active" : "Inactive";
  }

  const raw = text(record.status).toLowerCase();

  if (raw) {
    return raw === "active" || raw === "enabled" || raw === "true" ? "Active" : "Inactive";
  }

  return "Active";
}

function normalizeUser(record: ApiRecord, index: number): BankUser {
  const fullName =
    pickText(record, ["full_name", "fullName", "name", "display_name"]) ||
    [text(record.first_name), text(record.last_name)].filter(Boolean).join(" ") ||
    pickText(record, ["username", "user_name"]);

  const email = pickText(record, ["email", "email_id", "contact_email"]);

  return {
    key:
      text(record.pkid) || text(record.id) || text(record.user_id) || `${email || "user"}-${index}`,
    name: fullName || email || "-",
    role: pickText(record, ["role_name", "role", "roles", "designation"]),
    branch: pickText(record, ["branch_name", "branch", "branch_code"]),
    email,
    employeeId: pickText(record, ["employee_id", "employeeId", "emp_id"]),
    status: resolveStatus(record),
  };
}

function extractUsers(data: unknown): ApiRecord[] {
  if (Array.isArray(data)) return data as ApiRecord[];

  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;

    for (const key of ["data", "users", "results", "items"]) {
      const candidate = body[key];

      if (Array.isArray(candidate)) return candidate as ApiRecord[];

      if (candidate && typeof candidate === "object") {
        const inner = candidate as Record<string, unknown>;
        for (const innerKey of ["users", "results", "items", "data"]) {
          if (Array.isArray(inner[innerKey])) {
            return inner[innerKey] as ApiRecord[];
          }
        }
      }
    }
  }

  return [];
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

function BankUsersPage() {
  /* Organization ID passed from the Bank list (selected record's pkid). */
  const { organizationId, bankName } = useOrgContext();

  const [users, setUsers] = useState<BankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [branch, setBranch] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const requestId = useRef(0);

  /* ------------------------------------------------------------------------ */
  /* GET USERS API                                                             */
  /* ------------------------------------------------------------------------ */

  const loadUsers = useCallback(async () => {
    const currentRequest = ++requestId.current;

    console.log("Selected pkid (router state):", organizationId);
    console.log("Organization ID being sent:", organizationId);

    if (!organizationId) {
      setError("No bank selected. Go back to Banks and choose View Users.");
      setLoading(false);
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError("Session expired. Please login again.");
      setLoading(false);
      toast.error("Session expired. Please login again.");
      return;
    }

    const url = `${USERS_API_BASE}?organizationId=${encodeURIComponent(organizationId)}`;

    console.log("Final API URL:", url);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();

      let responseData: unknown = null;

      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error("Invalid users API response:", parseError);
        throw new Error("Invalid users API response.", { cause: parseError });
      }

      console.log("API response:", responseData);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Your session has expired.");
        }
        if (response.status === 403) {
          throw new Error("You do not have permission to view users.");
        }
        if (response.status === 404) {
          throw new Error("Users endpoint or organization not found.");
        }
        throw new Error(`Failed to load users (${response.status}).`);
      }

      const mapped = extractUsers(responseData).map(normalizeUser);

      console.log("Users mapped for table:", mapped);

      if (currentRequest === requestId.current) {
        setUsers(mapped);
      }
    } catch (err) {
      if (currentRequest !== requestId.current) return;

      console.error("Failed to load users:", err);

      const message = err instanceof Error ? err.message : "Failed to load users.";

      setError(message);
      toast.error(message);
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [organizationId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [query, role, branch, status]);

  /* ------------------------------------------------------------------------ */
  /* DERIVED DATA                                                              */
  /* ------------------------------------------------------------------------ */

  const roleOptions = useMemo(
    () => Array.from(new Set(users.map((u) => u.role).filter(Boolean))).sort(),
    [users],
  );

  const branchOptions = useMemo(
    () => Array.from(new Set(users.map((u) => u.branch).filter(Boolean))).sort(),
    [users],
  );

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "Active").length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      branches: branchOptions.length,
    };
  }, [users, branchOptions]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((user) => {
      if (role !== "All" && user.role !== role) return false;
      if (branch !== "All" && user.branch !== branch) return false;
      if (status !== "All" && user.status !== status) return false;

      if (!q) return true;

      return [user.name, user.email, user.employeeId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, query, role, branch, status]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ------------------------------------------------------------------------ */
  /* EXPORT (CSV of the currently filtered rows)                               */
  /* ------------------------------------------------------------------------ */

  const exportUsers = () => {
    if (rows.length === 0) {
      toast.error("There are no users to export.");
      return;
    }

    const header = ["User", "Employee ID", "Role", "Branch", "Email", "Status"];

    const lines = rows.map((u) =>
      [u.name, u.employeeId, u.role, u.branch, u.email, u.status].map(csvCell).join(","),
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `users-${organizationId}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const displayName = bankName ?? `Organization ${organizationId}`;

  const statCards = [
    { label: "Total users", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Inactive", value: stats.inactive },
    { label: "Branches", value: stats.branches },
  ];

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <AppShell
      title={`${displayName} — users`}
      subtitle={
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Link
            to="/tenants"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Banks
          </Link>
          <span>/</span>
          <span>{displayName}</span>
          <span>/</span>
          <span className="font-medium text-foreground">Users</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="size-4" />
            Export
          </Button>

          <Button
            onClick={() => toast.info("Add user is not available yet.")}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="size-4" />
            Add user
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* STAT CARDS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="surface-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">
                {loading ? <Skeleton className="h-7 w-10" /> : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, employee ID"
              className="pl-9"
            />
          </div>

          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Role: All</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Branch: All</SelectItem>
              {branchOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="lg:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TABLE */}
        <div className="surface-card animate-rise overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <AlertCircle className="size-6" />
              </span>

              <p className="font-medium">Couldn't load users</p>

              <p className="max-w-sm text-sm text-muted-foreground">{error}</p>

              <Button variant="outline" onClick={() => void loadUsers()}>
                Try again
              </Button>
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Users className="size-6" />
              </span>

              <p className="font-medium">
                {users.length === 0
                  ? "No users found for this bank"
                  : "No users match your filters"}
              </p>

              <p className="max-w-sm text-sm text-muted-foreground">
                {users.length === 0
                  ? "Users added to this organization will appear here."
                  : "Try a different search term or clear the filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {["User", "Role", "Branch", "Email", "Status", "Actions"].map((label) => (
                      <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((user) => (
                    <tr
                      key={user.key}
                      className="border-t border-border transition-colors hover:bg-secondary/60"
                    >
                      {/* User */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded-full border border-border bg-secondary text-[10px] font-medium text-muted-foreground">
                            {initials(user.name)}
                          </span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="whitespace-nowrap px-4 py-3">{user.role || "-"}</td>

                      {/* Branch */}
                      <td className="whitespace-nowrap px-4 py-3">{user.branch || "-"}</td>

                      {/* Email */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.email || "-"}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View user"
                            onClick={() => toast.info("User details are not available yet.")}
                          >
                            <Eye className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit user"
                            onClick={() => toast.info("Editing users is not available yet.")}
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Manage access"
                            onClick={() => toast.info("Access management is not available yet.")}
                          >
                            <Lock className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!loading && !error && pageRows.length > 0 && (
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
    </AppShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Search, Users } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";

import { Input } from "@/components/ui/input";

import { getUsers, getUserName, getUserRole, getUserStatus, type ApiUser } from "@/lib/users-api";

export const Route = createFileRoute("/users/")({
  head: () => ({
    meta: [
      {
        title: "User Management — System Administrator Panel",
      },
      {
        name: "description",
        content: "View and manage users on the Banking LOS platform.",
      },
    ],
  }),

  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);

      setError(error instanceof Error ? error.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) =>
      [
        user.emp_no,
        user.id,
        user.organization_id,
        user.organization_code,
        user.organization_name,
        user.email,
        user.username,
        user.name,
        user.fullName,
        user.mobile,
        user.gender,
        user.designation,
        user.role,
        user.role_name,
        user.status,
        user.login_branch,
        user.login_branch_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [users, query]);

  console.log(users);

  return (
    <AppShell title="User Management" subtitle={`${users.length} users added to the platform`}>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative w-full max-w-xl">
          <Search
            className="
              pointer-events-none
              absolute left-3 top-1/2
              size-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            className="pl-9"
            placeholder="Search by employee number, name, email or role"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="
              rounded-lg
              border
              border-destructive/30
              bg-destructive/10
              px-4
              py-3
              text-sm
              text-destructive
            "
          >
            {error}
          </div>
        )}

        {/* Table */}
        <div className="surface-card animate-rise overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : rows.length === 0 ? (
            <EmptyState searching={Boolean(query)} />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1450px] text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="whitespace-nowrap px-4 py-3 font-medium">Employee Number</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Bank ID</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Email</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Name</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Date of Birth</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Mobile Number</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Gender</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Designation</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Role</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">Login Branch</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((user) => (
                 
<tr
  key={user.id}
  onClick={() => {
    console.log("Sending User ID:", user.id);
    console.log(
      "Sending Organization ID:",
      user.organization_id,
    );

    navigate({
      to: "/users/detail",
      state: {
        userId: user.id,
        organizationId: user.organization_id,
      },
    });
  }}
  className="
    cursor-pointer
    border-t
    border-border
    transition-colors
    hover:bg-secondary/60
  "
>

                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {user.emp_no || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">{user.organization_id || "—"}</td>

                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.email || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {getUserName(user)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.date_of_birth || user.dob || user.DOB || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.mobile || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">{user.gender || "—"}</td>

                      <td className="whitespace-nowrap px-4 py-3">{user.designation || "—"}</td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                          {getUserRole(user)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <UserStatusBadge
                          status={getUserStatus(user)}
                          active={user.is_active ?? false}
                        />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.login_branch_name || user.login_branch || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------- */
/* Loading                           */
/* -------------------------------- */

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <div
        className="
          size-8
          animate-spin
          rounded-full
          border-2
          border-muted
          border-t-primary
        "
      />

      <p className="font-medium">Loading users...</p>

      <p className="text-sm text-muted-foreground">Fetching users from the server.</p>
    </div>
  );
}

/* -------------------------------- */
/* Empty                             */
/* -------------------------------- */

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Users className="size-6" />
      </span>

      <p className="font-medium">No users found</p>

      <p className="text-sm text-muted-foreground">{searching ? "Try changing your search." : "No users are available."}</p>
    </div>
  );
}

/* -------------------------------- */
/* User Status                       */
/* -------------------------------- */

function UserStatusBadge({ status, active }: { status: string; active?: boolean }) {
  const isActive = active === true || status === "OPERATIVE" || status === "ACTIVE";

  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
          : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      <span className={isActive ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-muted-foreground"} />

      {status}
    </span>
  );
}

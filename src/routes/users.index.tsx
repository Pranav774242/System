import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";

import {
  getUsers,
  getUserName,
  getUserRole,
  getUserStatus,
  type ApiUser,
} from "@/lib/users-api";

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

/* ========================================================= */
/* USERS PAGE                                                 */
/* ========================================================= */

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
      console.log("Fetched users:", data);

      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);

      setError(error instanceof Error ? error.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------- */
  /* Filter users                                             */
  /* ------------------------------------------------------- */

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

  /* ------------------------------------------------------- */
  /* View user                                                */
  /* ------------------------------------------------------- */

  function handleViewUser(user: ApiUser) {
    console.log("=================================");
    console.log("VIEW USER");
    console.log("Sending User ID:", user.id);
    console.log("Sending Organization ID:", user.organization_id);
    console.log("=================================");

    navigate({
      to: "/users/detail",
      state: {
        userId: user.id,
        organizationId: user.organization_id,
      },
    });
  }

  /* ------------------------------------------------------- */
  /* Edit user                                                */
  /* ------------------------------------------------------- */

  function handleEditUser(user: ApiUser) {
    console.log("=================================");
    console.log("EDIT USER");
    console.log("Sending User ID:", user.id);
    console.log("Sending Organization ID:", user.organization_id);
    console.log("=================================");

    navigate({
      to: "/users/edit",
      state: {
        userId: user.id,
        organizationId: user.organization_id,
      },
    });
  }

  /* ------------------------------------------------------- */
  /* Delete user                                              */
  /* ------------------------------------------------------- */

  function handleDeleteUser(user: ApiUser) {
    console.log("=================================");
    console.log("DELETE USER");
    console.log("User ID:", user.id);
    console.log("Organization ID:", user.organization_id);
    console.log("=================================");

    const confirmed = window.confirm(
      `Are you sure you want to delete ${getUserName(user)}?`,
    );

    if (!confirmed) {
      return;
    }

    /*
     * Add your DELETE API here.
     *
     * Example:
     *
     * await deleteUser(user.id, user.organization_id);
     *
     * Then reload users:
     *
     * await loadUsers();
     */

    console.log("Delete confirmed for user:", user.id);
  }

  return (
    <AppShell
      title="User Management"
      subtitle={`${users.length} users added to the platform`}
    >
      <div className="space-y-4">
        {/* ================================================= */}
        {/* SEARCH                                            */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* ERROR                                             */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* TABLE                                             */}
        {/* ================================================= */}

        <div className="surface-card animate-rise overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : rows.length === 0 ? (
            <EmptyState searching={Boolean(query)} />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1550px] text-sm">
                {/* ========================================= */}
                {/* TABLE HEADER                               */}
                {/* ========================================= */}

                <thead className="bg-secondary/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Employee Number
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Bank ID
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Name
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Mobile Number
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Designation
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Role
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      Login Branch
                    </th>

                    {/* NEW */}
                    <th className="w-[90px] whitespace-nowrap px-4 py-3 text-center font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                {/* ========================================= */}
                {/* TABLE BODY                                 */}
                {/* ========================================= */}

                <tbody>
                  {rows.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleViewUser(user)}
                      className="
                        cursor-pointer
                        border-t
                        border-border
                        transition-colors
                        hover:bg-secondary/60
                      "
                    >
                      {/* Employee Number */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {user.emp_no || "—"}
                      </td>

                      {/* Bank ID */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {user.organization_id || "—"}
                      </td>

                      {/* Name */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {getUserName(user)}
                      </td>

                      {/* Mobile */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.mobile || "—"}
                      </td>

                      {/* Designation */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {user.designation || "—"}
                      </td>

                      {/* Role */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                          {getUserRole(user)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <UserStatusBadge
                          status={getUserStatus(user)}
                          active={user.is_active ?? false}
                        />
                      </td>

                      {/* Login Branch */}
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {user.login_branch_name || user.login_branch || "—"}
                      </td>

                      {/* ===================================== */}
                      {/* ACTION                                 */}
                      {/* ===================================== */}

                      <td
                        className="
                          relative
                          whitespace-nowrap
                          px-4
                          py-3
                          text-center
                        "
                        onClick={(event) => {
                          /*
                           * VERY IMPORTANT:
                           * Prevent clicking Action from
                           * triggering row View action.
                           */
                          event.stopPropagation();
                        }}
                      >
                        <UserActions
                          user={user}
                          onView={handleViewUser}
                          onEdit={handleEditUser}
                          onDelete={handleDeleteUser}
                        />
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

/* ========================================================= */
/* USER ACTIONS                                               */
/* ========================================================= */

type UserActionsProps = {
  user: ApiUser;
  onView: (user: ApiUser) => void;
  onEdit: (user: ApiUser) => void;
  onDelete: (user: ApiUser) => void;
};

function UserActions({ user, onView, onEdit, onDelete }: UserActionsProps) {
  return (
    <div
      className="inline-flex items-center gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      {/* View */}
      <button
        type="button"
        title="View User"
        onClick={() => onView(user)}
        className="
          inline-flex
          size-8
          items-center
          justify-center
          rounded-md
          text-muted-foreground
          transition-colors
          hover:bg-secondary
          hover:text-foreground
          focus:outline-none
          focus:ring-2
          focus:ring-ring
        "
      >
        <Eye className="size-4" />
      </button>

      {/* Edit */}
      <button
        type="button"
        title="Edit User"
        onClick={() => onEdit(user)}
        className="
          inline-flex
          size-8
          items-center
          justify-center
          rounded-md
          text-muted-foreground
          transition-colors
          hover:bg-secondary
          hover:text-foreground
          focus:outline-none
          focus:ring-2
          focus:ring-ring
        "
      >
        <Pencil className="size-4" />
      </button>

      {/* Delete */}
      <button
        type="button"
        title="Delete User"
        onClick={() => onDelete(user)}
        className="
          inline-flex
          size-8
          items-center
          justify-center
          rounded-md
          text-muted-foreground
          transition-colors
          hover:bg-destructive/10
          hover:text-destructive
          focus:outline-none
          focus:ring-2
          focus:ring-ring
        "
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/* ========================================================= */
/* LOADING STATE                                              */
/* ========================================================= */

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

      <p className="text-sm text-muted-foreground">
        Fetching users from the server.
      </p>
    </div>
  );
}

/* ========================================================= */
/* EMPTY STATE                                                */
/* ========================================================= */

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Users className="size-6" />
      </span>

      <p className="font-medium">No users found</p>

      <p className="text-sm text-muted-foreground">
        {searching ? "Try changing your search." : "No users are available."}
      </p>
    </div>
  );
}

/* ========================================================= */
/* USER STATUS                                                */
/* ========================================================= */

function UserStatusBadge({
  status,
  active,
}: {
  status: string;
  active?: boolean;
}) {
  const isActive =
    active === true || status === "OPERATIVE" || status === "ACTIVE";

  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
          : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      <span
        className={
          isActive
            ? "size-1.5 rounded-full bg-success"
            : "size-1.5 rounded-full bg-muted-foreground"
        }
      />

      {status}
    </span>
  );
}

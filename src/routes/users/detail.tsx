import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, Edit, Power, PowerOff, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import {
  UserBooleanRow,
  UserDetailCard,
  UserDetailRow,
  UserStatusBadge,
} from "@/components/UserDetailSections";
import { UserEditDialog } from "@/components/UserEditDialog";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/admin-store";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export const Route = createFileRoute("/users/detail")({
  head: () => ({
    meta: [
      { title: "User Detail — System Administrator Panel" },
      {
        name: "description",
        content:
          "View complete user information, access details, security settings and activity.",
      },
    ],
  }),
  component: UserDetailPage,
});

/* ========================================================= */
/* TYPES                                                      */
/* ========================================================= */

type UserRouteState = {
  userId?: number | string;
  organizationId?: number | string;
};

type DetailUser = {
  id: number;
  pkid?: number;
  emp_no?: string;
  organization_id?: number;
  organization_code?: string;
  organization_name?: string;
  email?: string;
  username?: string;
  name?: string;
  fullName?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mobile?: string;
  gender?: string;
  date_of_birth?: string;
  dob?: string;
  DOB?: string;
  designation?: string;
  role?: string;
  role_id?: number;
  role_name?: string;
  status?: string;
  is_active?: boolean;
  login_branch?: string;
  login_branch_id?: number;
  login_branch_name?: string;
  mbrAccess?: boolean;
  m_br_access?: boolean;
  multi_branch_access?: boolean;
  two_fa_enabled?: boolean;
  "2fA"?: boolean;
  holiday_login?: boolean;
  login_on_holidays?: boolean;
  inactive_session_timeout?: number;
  no_of_bad_logins?: number;
  lastlogindate?: string;
  last_login_date?: string;
  last_login_time?: string;
  created_by?: number;
  created_date?: string;
  created_at?: string;
  modified_date?: string;
  updated_at?: string;
};

/* ========================================================= */
/* API (single call, lives in this page)                      */
/* ========================================================= */

const API_BASE = API_ENDPOINTS.users;
const STORAGE_KEY = "user-detail-ids";
const inFlightUserDetails = new Map<string, Promise<DetailUser | null>>();

async function fetchUserDetail(
  userId: string,
  organizationId: string,
): Promise<DetailUser | null> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Unauthorized / session expired");
  }

  const requestKey = `${token}:${organizationId}:${userId}`;
  const pendingRequest = inFlightUserDetails.get(requestKey);
  if (pendingRequest) return pendingRequest;

  // GET /api/v1/administration/users/{userId}?organizationId={organizationId}
  const url = `${API_BASE}/${encodeURIComponent(userId)}?organizationId=${encodeURIComponent(
    organizationId,
  )}`;

  const request = (async () => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401)
      throw new Error("Unauthorized / session expired");
    if (response.status === 403)
      throw new Error("You do not have permission to view this user");
    if (response.status === 404) return null;

    if (!response.ok) {
      let message = "";
      try {
        const body = await response.json();
        if (typeof body?.message === "string") message = body.message;
      } catch {
        // ignore invalid JSON
      }
      throw new Error(message || `Unable to load user (${response.status})`);
    }

    const result = await response.json();

    if (result?.success === false) {
      throw new Error(result.message || "Unable to load user");
    }

    // Supports { data: {...} }, { data: [{...}] } or a plain user object
    const data = result?.data ?? result;

    if (Array.isArray(data)) return data[0] ?? null;

    return data ?? null;
  })();

  inFlightUserDetails.set(requestKey, request);
  try {
    return await request;
  } finally {
    if (inFlightUserDetails.get(requestKey) === request) {
      inFlightUserDetails.delete(requestKey);
    }
  }
}

/* ========================================================= */
/* HELPERS                                                    */
/* ========================================================= */

function getName(u: DetailUser) {
  return (
    u.fullName ||
    u.name ||
    [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ") ||
    "Unnamed User"
  );
}

function getRole(u: DetailUser) {
  return u.role_name || u.role || "—";
}

function getStatus(u: DetailUser) {
  return u.status || (u.is_active ? "OPERATIVE" : "INACTIVE");
}

function getBranch(u: DetailUser) {
  return u.login_branch_name || u.login_branch || "—";
}

function getDob(u: DetailUser) {
  return u.date_of_birth || u.dob || u.DOB || "—";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ========================================================= */
/* PAGE                                                       */
/* ========================================================= */

function UserDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // IDs sent from the Users page via router state
  const state = location.state as UserRouteState | undefined;

  let userId = state?.userId;
  let organizationId = state?.organizationId;

  // Router state is lost on hard refresh, so fall back to sessionStorage
  if (userId === undefined || organizationId === undefined) {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserRouteState;
        userId = userId ?? parsed.userId;
        organizationId = organizationId ?? parsed.organizationId;
      }
    } catch {
      // ignore storage errors
    }
  }

  const [user, setUser] = useState<DetailUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit popup state (must live INSIDE the component)
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        setError("");

        if (
          userId === undefined ||
          userId === null ||
          organizationId === undefined ||
          organizationId === null
        ) {
          setError(
            "User ID or Organization ID is missing. Please open the user from User Management.",
          );
          return;
        }

        try {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ userId, organizationId }),
          );
        } catch {
          // ignore storage errors
        }

        const data = await fetchUserDetail(
          String(userId),
          String(organizationId),
        );

        if (cancelled) return;

        if (!data) {
          setError("The requested user could not be found.");
          return;
        }

        setUser(data);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load user:", err);
        setError(err instanceof Error ? err.message : "Unable to load user.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [userId, organizationId, refreshKey]);

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <AppShell title="User Details" subtitle="Loading user information...">
        <div className="surface-card flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="font-medium">Loading user...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fetching user information.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ---------------- Error / Not found ---------------- */

  if (!user || error) {
    return (
      <AppShell title="User Details" subtitle="User not found">
        <div className="surface-card flex flex-col items-center gap-3 p-16 text-center">
          <UserRound className="size-10 text-muted-foreground" />
          <p className="font-medium">This user could not be found</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {error || "The requested user no longer exists."}
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/users" })}>
            <ArrowLeft className="size-4" />
            Back to User Management
          </Button>
        </div>
      </AppShell>
    );
  }

  /* ---------------- User data ---------------- */

  const name = getName(user);
  const role = getRole(user);
  const status = getStatus(user);
  const branch = getBranch(user);
  const isActive =
    user.is_active === true || status === "ACTIVE" || status === "OPERATIVE";

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <AppShell title={name} subtitle={user.designation || "User Details"}>
      <div className="space-y-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to User Management
        </Link>

        {/* Header */}
        <div className="surface-card animate-rise flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
              {initials}
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">{name}</h2>
                <UserStatusBadge status={status} active={isActive} />
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {user.designation || "User"}
                {user.emp_no && (
                  <>
                    {" · "}
                    {user.emp_no}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Edit button opens the popup */}
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="size-4" />
              Edit
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.info(
                  "Status action is ready to connect to the user status API.",
                )
              }
            >
              {isActive ? (
                <>
                  <PowerOff className="size-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="size-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UserDetailCard title="Personal Details">
            <UserDetailRow label="Full Name" value={name} />
            <UserDetailRow label="Date of Birth" value={getDob(user)} />
            <UserDetailRow label="Gender" value={user.gender ?? null} />
            <UserDetailRow
              label="Employee Number"
              value={user.emp_no ?? null}
            />
            <UserDetailRow label="Email" value={user.email ?? null} />
            <UserDetailRow label="Mobile Number" value={user.mobile ?? null} />
          </UserDetailCard>

          <UserDetailCard title="Organization Details">
            <UserDetailRow
              label="Organization Name"
              value={user.organization_name ?? null}
            />
            <UserDetailRow
              label="Organization Code"
              value={user.organization_code ?? null}
            />
            <UserDetailRow
              label="Designation"
              value={user.designation ?? null}
            />
            <UserDetailRow label="Role" value={role} />
            <UserDetailRow label="Status" value={status} />
            <UserDetailRow label="Login Branch" value={branch} />
            <UserDetailRow
              label="Login Branch ID"
              value={user.login_branch_id ?? null}
            />
          </UserDetailCard>

          <UserDetailCard title="Login & Access">
            <UserDetailRow label="Username" value={user.username ?? null} />
            <UserBooleanRow
              label="2FA Enabled"
              value={user.two_fa_enabled ?? user["2fA"] ?? false}
            />
            <UserBooleanRow
              label="Multi Branch Access"
              value={user.multi_branch_access ?? false}
            />
            <UserBooleanRow
              label="MBR Access"
              value={user.mbrAccess ?? user.m_br_access ?? false}
            />
            <UserBooleanRow
              label="Holiday Login"
              value={user.holiday_login ?? user.login_on_holidays ?? false}
            />
            <UserDetailRow
              label="Session Timeout"
              value={
                user.inactive_session_timeout
                  ? `${user.inactive_session_timeout} seconds`
                  : "—"
              }
            />
            <UserDetailRow
              label="Bad Login Attempts"
              value={user.no_of_bad_logins ?? null}
            />
          </UserDetailCard>

          <UserDetailCard title="Login Information">
            <UserDetailRow
              label="Last Login Date"
              value={formatDate(user.last_login_date || user.lastlogindate)}
            />
            <UserDetailRow
              label="Last Login Time"
              value={user.last_login_time ?? null}
            />
            <UserDetailRow
              label="Created Date"
              value={formatDateTime(user.created_date || user.created_at)}
            />
            <UserDetailRow label="Created By" value={user.created_by ?? null} />
            <UserDetailRow
              label="Modified Date"
              value={formatDateTime(user.modified_date || user.updated_at)}
            />
          </UserDetailCard>
        </div>
      </div>

      {/* Edit popup: rendered once, controlled by editOpen */}
      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        organizationId={organizationId}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
    </AppShell>
  );
}

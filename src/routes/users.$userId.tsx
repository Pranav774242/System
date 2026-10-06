// import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

// import {
//   ArrowLeft,
//   Calendar,
//   Clock,
//   Edit,
//   KeyRound,
//   Mail,
//   MapPin,
//   Phone,
//   Power,
//   PowerOff,
//   ShieldCheck,
//   UserRound,
// } from "lucide-react";

// import { useEffect, useState } from "react";
// import { toast } from "sonner";

// import { AppShell } from "@/components/AppShell";

// import {
//   UserActivityItem,
//   UserBooleanRow,
//   UserDetailCard,
//   UserDetailRow,
//   UserStatusBadge,
// } from "@/components/UserDetailSections";

// import { Button } from "@/components/ui/button";

// import {
//   formatUserDate,
//   formatUserDateTime,
//   getUserBranch,
//   getUserDateOfBirth,
//   getUserName,
//   getUserRole,
//   getUserStatus,
//   getUserById,
//   type ApiUser,
// } from "@/lib/users-api";

// export const Route = createFileRoute("/users/$userId")({
//   head: () => ({
//     meta: [
//       {
//         title: "User Detail — System Administrator Panel",
//       },
//       {
//         name: "description",
//         content: "View complete user information, access details, security settings and activity.",
//       },
//     ],
//   }),

//   component: UserDetailPage,
// });

// function UserDetailPage() {
//   const { userId } = Route.useParams();

//   const navigate = useNavigate();

//   const [user, setUser] = useState<ApiUser | null>(null);

//   const [loading, setLoading] = useState(true);

//   const [error, setError] = useState("");

//   useEffect(() => {
//     loadUser();
//   }, [userId]);

//   async function loadUser() {
//     try {
//       setLoading(true);
//       setError("");

//       console.log("Loading user with ID:", userId);
//       const data = await getUserById(userId);

//       if (!data) {
//         setError("The requested user could not be found.");

//         return;
//       }

//       setUser(data);
//     } catch (error) {
//       console.error("Failed to load user:", error);

//       setError(error instanceof Error ? error.message : "Unable to load user.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* ----------------------------- */
//   /* Loading                         */
//   /* ----------------------------- */

//   if (loading) {
//     return (
//       <AppShell title="User Details" subtitle="Loading user information...">
//         <div className="surface-card flex min-h-[400px] items-center justify-center">
//           <div className="text-center">
//             <div
//               className="
//                 mx-auto mb-3
//                 size-8
//                 animate-spin
//                 rounded-full
//                 border-2
//                 border-muted
//                 border-t-primary
//               "
//             />

//             <p className="font-medium">Loading user...</p>

//             <p className="mt-1 text-sm text-muted-foreground">Fetching user information.</p>
//           </div>
//         </div>
//       </AppShell>
//     );
//   }

//   /* ----------------------------- */
//   /* Not found                       */
//   /* ----------------------------- */

//   if (!user || error) {
//     return (
//       <AppShell title="User Details" subtitle="User not found">
//         <div className="surface-card flex flex-col items-center gap-3 p-16 text-center">
//           <UserRound className="size-10 text-muted-foreground" />

//           <p className="font-medium">This user could not be found</p>

//           <p className="max-w-md text-sm text-muted-foreground">
//             {error || "The requested user no longer exists."}
//           </p>

//           <Button
//             variant="outline"
//             onClick={() =>
//               navigate({
//                 to: "/users",
//               })
//             }
//           >
//             <ArrowLeft className="size-4" />
//             Back to User Management
//           </Button>
//         </div>
//       </AppShell>
//     );
//   }

//   /* ----------------------------- */
//   /* User data                      */
//   /* ----------------------------- */

//   const name = getUserName(user);

//   const role = getUserRole(user);

//   const status = getUserStatus(user);

//   const branch = getUserBranch(user);

//   const isActive = user.is_active === true || status === "ACTIVE" || status === "OPERATIVE";

//   const initials =
//     name
//       .split(" ")
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((part) => part.charAt(0).toUpperCase())
//       .join("") || "U";

//   return (
//     <AppShell title={name} subtitle={user.designation || "User Details"}>
//       <div className="space-y-6">
//         {/* Back */}
//         <Link
//           to="/users"
//           className="
//             inline-flex
//             items-center
//             gap-2
//             text-sm
//             font-medium
//             text-muted-foreground
//             transition-colors
//             hover:text-foreground
//           "
//         >
//           <ArrowLeft className="size-4" />
//           Back to User Management
//         </Link>

//         {/* -------------------------------- */}
//         {/* Header                            */}
//         {/* -------------------------------- */}

//         <div
//           className="
//             surface-card
//             animate-rise
//             flex
//             flex-col
//             gap-4
//             p-6
//             sm:flex-row
//             sm:items-center
//             sm:justify-between
//           "
//         >
//           <div className="flex items-center gap-4">
//             {/* Avatar */}
//             <span
//               className="
//                 grid
//                 size-14
//                 shrink-0
//                 place-items-center
//                 rounded-2xl
//                 bg-primary
//                 text-lg
//                 font-bold
//                 text-primary-foreground
//               "
//             >
//               {initials}
//             </span>

//             <div>
//               <div className="flex flex-wrap items-center gap-3">
//                 <h2 className="text-xl font-bold tracking-tight">{name}</h2>

//                 <UserStatusBadge status={status} active={isActive} />
//               </div>

//               <p className="mt-1 text-sm text-muted-foreground">
//                 {user.designation || "User"}

//                 {user.emp_no && (
//                   <>
//                     {" · "}
//                     {user.emp_no}
//                   </>
//                 )}
//               </p>
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex flex-wrap gap-2">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 toast.info("Edit User can be connected to your existing UserFormDrawer.");
//               }}
//             >
//               <Edit className="size-4" />
//               Edit
//             </Button>

//             <Button
//               variant="outline"
//               onClick={() => {
//                 toast.info("Status action is ready to connect to the user status API.");
//               }}
//             >
//               {isActive ? (
//                 <>
//                   <PowerOff className="size-4" />
//                   Deactivate
//                 </>
//               ) : (
//                 <>
//                   <Power className="size-4" />
//                   Activate
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>

//         {/* -------------------------------- */}
//         {/* Information Cards                */}
//         {/* -------------------------------- */}

//         <div className="grid gap-6 lg:grid-cols-2">
//           {/* Personal Details */}
//           <UserDetailCard title="Personal Details">
//             <UserDetailRow label="Full Name" value={name} />

//             <UserDetailRow label="First Name" value={user.first_name ?? null} />

//             <UserDetailRow label="Middle Name" value={user.middle_name ?? null} />

//             <UserDetailRow label="Last Name" value={user.last_name ?? null} />

//             <UserDetailRow label="Date of Birth" value={getUserDateOfBirth(user)} />

//             <UserDetailRow label="Gender" value={user.gender ?? null} />

//             <UserDetailRow label="Employee Number" value={user.emp_no ?? null} />

//             <UserDetailRow label="Email" value={user.email ?? null} />

//             <UserDetailRow label="Mobile Number" value={user.mobile ?? null} />
//           </UserDetailCard>

//           {/* Organization Details */}
//           <UserDetailCard title="Organization Details">
//             <UserDetailRow label="Organization Name" value={user.organization_name ?? null} />

//             <UserDetailRow label="Organization Code" value={user.organization_code ?? null} />

//             <UserDetailRow label="Bank ID" value={user.organization_id ?? null} />

//             <UserDetailRow label="Designation" value={user.designation ?? null} />

//             <UserDetailRow label="Role" value={role} />

//             <UserDetailRow label="Role ID" value={user.role_id ?? null} />

//             <UserDetailRow label="Status" value={status} />

//             <UserDetailRow label="Login Branch" value={branch} />

//             <UserDetailRow label="Login Branch ID" value={user.login_branch_id ?? null} />
//           </UserDetailCard>

//           {/* Login & Access */}
//           <UserDetailCard title="Login & Access">
//             <UserDetailRow label="Username" value={user.username ?? null} />

//             <UserBooleanRow
//               label="2FA Enabled"
//               value={user.two_fa_enabled ?? user["2fA"] ?? false}
//             />

//             <UserBooleanRow label="Multi Branch Access" value={user.multi_branch_access ?? false} />

//             <UserBooleanRow
//               label="MBR Access"
//               value={user.mbrAccess ?? user.m_br_access ?? false}
//             />

//             <UserBooleanRow
//               label="Holiday Login"
//               value={user.holiday_login ?? user.login_on_holidays ?? false}
//             />

//             <UserDetailRow
//               label="Session Timeout"
//               value={
//                 user.inactive_session_timeout ? `${user.inactive_session_timeout} seconds` : "—"
//               }
//             />

//             <UserDetailRow label="Bad Login Attempts" value={user.no_of_bad_logins ?? null} />
//           </UserDetailCard>

//           {/* Login Information */}
//           <UserDetailCard title="Login Information">
//             <UserDetailRow
//               label="Last Login Date"
//               value={formatUserDate(user.last_login_date || user.lastlogindate)}
//             />

//             <UserDetailRow label="Last Login Time" value={user.last_login_time ?? null} />

//             <UserDetailRow
//               label="Created Date"
//               value={formatUserDateTime(user.created_date || user.created_at)}
//             />

//             <UserDetailRow label="Created By" value={user.created_by ?? null} />

//             <UserDetailRow
//               label="Modified Date"
//               value={formatUserDateTime(user.modified_date || user.updated_at)}
//             />
//           </UserDetailCard>
//         </div>

//         {/* -------------------------------- */}
//         {/* Activity / Record                */}
//         {/* -------------------------------- */}

//         <div className="surface-card animate-rise p-6">
//           <div className="mb-5 flex items-center gap-2">
//             <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
//               <Clock className="size-4" />
//             </div>

//             <div>
//               <h3 className="font-semibold">Activity Log</h3>

//               <p className="text-xs text-muted-foreground">User account activity</p>
//             </div>
//           </div>

//           <ul className="space-y-4">
//             <UserActivityItem
//               title="User account created"
//               date={user.created_date || user.created_at || ""}
//               icon={<Calendar className="size-4" />}
//             />

//             <UserActivityItem
//               title={`Status is ${status}`}
//               date={user.modified_date || user.updated_at || ""}
//               icon={<ShieldCheck className="size-4" />}
//             />

//             {(user.last_login_date || user.lastlogindate) && (
//               <UserActivityItem
//                 title="Last login"
//                 date={`${formatUserDate(user.last_login_date || user.lastlogindate)} ${user.last_login_time || ""}`}
//                 icon={<KeyRound className="size-4" />}
//               />
//             )}
//           </ul>
//         </div>

//         {/* -------------------------------- */}
//         {/* Record Information                */}
//         {/* -------------------------------- */}

//         <div className="surface-card animate-rise p-6">
//           <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//             Record
//           </h3>

//           <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             <UserDetailRow label="User ID" value={user.id ?? null} />

//             <UserDetailRow label="Primary Key" value={user.pkid ?? null} />

//             <UserDetailRow label="Organization ID" value={user.organization_id ?? null} />

//             <UserDetailRow label="Role ID" value={user.role_id ?? null} />
//           </dl>
//         </div>
//       </div>
//     </AppShell>
//   );
// }
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  KeyRound,
  Power,
  PowerOff,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";

import {
  UserActivityItem,
  UserBooleanRow,
  UserDetailCard,
  UserDetailRow,
  UserStatusBadge,
} from "@/components/UserDetailSections";

import { Button } from "@/components/ui/button";

import { getAccessToken } from "@/lib/admin-store";

export const Route = createFileRoute("/users/$userId")({
  head: () => ({
    meta: [
      {
        title: "User Detail — System Administrator Panel",
      },
      {
        name: "description",
        content: "View complete user information, access details, security settings and activity.",
      },
    ],
  }),

  component: UserDetailPage,
});

type ApiUser = {
  id?: number | string;
  pkid?: number | string;

  organization_id?: number | string;
  organization_code?: string;
  organization_name?: string;

  emp_no?: string;

  first_name?: string;
  middle_name?: string;
  last_name?: string;

  username?: string;
  email?: string;
  mobile?: string;

  dob?: string;
  date_of_birth?: string;

  gender?: string;

  designation?: string;

  role?: string;
  role_name?: string;
  role_id?: number | string;

  status?: string;
  user_status?: string;
  is_active?: boolean;

  login_branch?: string;
  login_branch_name?: string;
  login_branch_id?: number | string;

  two_fa_enabled?: boolean;
  ["2fA"]?: boolean;

  multi_branch_access?: boolean;

  mbrAccess?: boolean;
  m_br_access?: boolean;

  holiday_login?: boolean;
  login_on_holidays?: boolean;

  inactive_session_timeout?: number | string;
  no_of_bad_logins?: number | string;

  last_login_date?: string;
  lastlogindate?: string;

  last_login_time?: string;

  created_date?: string;
  created_at?: string;

  created_by?: string;

  modified_date?: string;
  updated_at?: string;
};

const ORGANIZATION_ID = 10;

function getUserName(user: ApiUser) {
  const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ");

  return fullName || user.username || "User";
}

function getUserRole(user: ApiUser) {
  return user.role_name || user.role || "—";
}

function getUserStatus(user: ApiUser) {
  return user.status || user.user_status || "—";
}

function getUserBranch(user: ApiUser) {
  return user.login_branch_name || user.login_branch || "—";
}

function getUserDateOfBirth(user: ApiUser) {
  return user.dob || user.date_of_birth || "—";
}

function formatUserDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatUserDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractUser(data: unknown): ApiUser | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const response = data as Record<string, unknown>;

  /*
   * Supports common backend response formats:
   *
   * {
   *   data: {...}
   * }
   *
   * {
   *   user: {...}
   * }
   *
   * {
   *   result: {...}
   * }
   *
   * or directly:
   *
   * {...user fields}
   */

  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data as ApiUser;
  }

  if (response.user && typeof response.user === "object" && !Array.isArray(response.user)) {
    return response.user as ApiUser;
  }

  if (response.result && typeof response.result === "object" && !Array.isArray(response.result)) {
    return response.result as ApiUser;
  }

  return response as ApiUser;
}

async function getUserById(userId: string, organizationId: number): Promise<ApiUser | null> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  const url =
    `https://los-backend-355v.onrender.com` +
    `/api/v1/administration/users/${encodeURIComponent(userId)}` +
    `?organizationId=${organizationId}`;

  console.log("Fetching user:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const responseText = await response.text();

  let responseData: unknown = null;

  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    let message = `Failed to fetch user. Status: ${response.status}`;

    if (responseData && typeof responseData === "object" && "message" in responseData) {
      const apiMessage = (responseData as { message?: unknown }).message;

      if (typeof apiMessage === "string" && apiMessage) {
        message = apiMessage;
      }
    }

    throw new Error(message);
  }

  return extractUser(responseData);
}

function UserDetailPage() {
  const { userId } = Route.useParams();

  const navigate = useNavigate();

  const [user, setUser] = useState<ApiUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
  }, [userId]);

  async function loadUser() {
    try {
      setLoading(true);
      setError("");

      console.log("User ID from URL:", userId);

      // Organization ID is 10 for now.
      const organizationId = ORGANIZATION_ID;

      console.log("Organization ID:", organizationId);

      const data = await getUserById(userId, organizationId);

      if (!data) {
        setError("The requested user could not be found.");
        return;
      }

      setUser(data);
    } catch (error) {
      console.error("Failed to load user:", error);

      setError(error instanceof Error ? error.message : "Unable to load user.");
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- */
  /* Loading                         */
  /* ----------------------------- */

  if (loading) {
    return (
      <AppShell title="User Details" subtitle="Loading user information...">
        <div className="surface-card flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div
              className="
                mx-auto mb-3
                size-8
                animate-spin
                rounded-full
                border-2
                border-muted
                border-t-primary
              "
            />

            <p className="font-medium">Loading user...</p>

            <p className="mt-1 text-sm text-muted-foreground">Fetching user information.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ----------------------------- */
  /* Not found                       */
  /* ----------------------------- */

  if (!user || error) {
    return (
      <AppShell title="User Details" subtitle="User not found">
        <div className="surface-card flex flex-col items-center gap-3 p-16 text-center">
          <UserRound className="size-10 text-muted-foreground" />

          <p className="font-medium">This user could not be found</p>

          <p className="max-w-md text-sm text-muted-foreground">
            {error || "The requested user no longer exists."}
          </p>

          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: "/users",
              })
            }
          >
            <ArrowLeft className="size-4" />
            Back to User Management
          </Button>
        </div>
      </AppShell>
    );
  }

  /* ----------------------------- */
  /* User data                      */
  /* ----------------------------- */

  const name = getUserName(user);

  const role = getUserRole(user);

  const status = getUserStatus(user);

  const branch = getUserBranch(user);

  const isActive =
    user.is_active === true ||
    status.toUpperCase() === "ACTIVE" ||
    status.toUpperCase() === "OPERATIVE";

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
        {/* Back */}

        <Link
          to="/users"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-muted-foreground
            transition-colors
            hover:text-foreground
          "
        >
          <ArrowLeft className="size-4" />
          Back to User Management
        </Link>

        {/* -------------------------------- */}
        {/* Header                            */}
        {/* -------------------------------- */}

        <div
          className="
            surface-card
            animate-rise
            flex
            flex-col
            gap-4
            p-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}

            <span
              className="
                grid
                size-14
                shrink-0
                place-items-center
                rounded-2xl
                bg-primary
                text-lg
                font-bold
                text-primary-foreground
              "
            >
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

          {/* Actions */}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.info("Edit User can be connected to your existing UserFormDrawer.");
              }}
            >
              <Edit className="size-4" />
              Edit
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                toast.info("Status action is ready to connect to the user status API.");
              }}
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

        {/* -------------------------------- */}
        {/* Information Cards                */}
        {/* -------------------------------- */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Details */}

          <UserDetailCard title="Personal Details">
            <UserDetailRow label="Full Name" value={name} />

            <UserDetailRow label="First Name" value={user.first_name ?? null} />

            <UserDetailRow label="Middle Name" value={user.middle_name ?? null} />

            <UserDetailRow label="Last Name" value={user.last_name ?? null} />

            <UserDetailRow label="Date of Birth" value={getUserDateOfBirth(user)} />

            <UserDetailRow label="Gender" value={user.gender ?? null} />

            <UserDetailRow label="Employee Number" value={user.emp_no ?? null} />

            <UserDetailRow label="Email" value={user.email ?? null} />

            <UserDetailRow label="Mobile Number" value={user.mobile ?? null} />
          </UserDetailCard>

          {/* Organization Details */}

          <UserDetailCard title="Organization Details">
            <UserDetailRow label="Organization Name" value={user.organization_name ?? null} />

            <UserDetailRow label="Organization Code" value={user.organization_code ?? null} />

            <UserDetailRow label="Bank ID" value={user.organization_id ?? ORGANIZATION_ID} />

            <UserDetailRow label="Designation" value={user.designation ?? null} />

            <UserDetailRow label="Role" value={role} />

            <UserDetailRow label="Role ID" value={user.role_id ?? null} />

            <UserDetailRow label="Status" value={status} />

            <UserDetailRow label="Login Branch" value={branch} />

            <UserDetailRow label="Login Branch ID" value={user.login_branch_id ?? null} />
          </UserDetailCard>

          {/* Login & Access */}

          <UserDetailCard title="Login & Access">
            <UserDetailRow label="Username" value={user.username ?? null} />

            <UserBooleanRow
              label="2FA Enabled"
              value={user.two_fa_enabled ?? user["2fA"] ?? false}
            />

            <UserBooleanRow label="Multi Branch Access" value={user.multi_branch_access ?? false} />

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
                user.inactive_session_timeout ? `${user.inactive_session_timeout} seconds` : "—"
              }
            />

            <UserDetailRow label="Bad Login Attempts" value={user.no_of_bad_logins ?? null} />
          </UserDetailCard>

          {/* Login Information */}

          <UserDetailCard title="Login Information">
            <UserDetailRow
              label="Last Login Date"
              value={formatUserDate(user.last_login_date || user.lastlogindate)}
            />

            <UserDetailRow label="Last Login Time" value={user.last_login_time ?? null} />

            <UserDetailRow
              label="Created Date"
              value={formatUserDateTime(user.created_date || user.created_at)}
            />

            <UserDetailRow label="Created By" value={user.created_by ?? null} />

            <UserDetailRow
              label="Modified Date"
              value={formatUserDateTime(user.modified_date || user.updated_at)}
            />
          </UserDetailCard>
        </div>

        {/* -------------------------------- */}
        {/* Activity / Record                */}
        {/* -------------------------------- */}

        <div className="surface-card animate-rise p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
              <Clock className="size-4" />
            </div>

            <div>
              <h3 className="font-semibold">Activity Log</h3>

              <p className="text-xs text-muted-foreground">User account activity</p>
            </div>
          </div>

          <ul className="space-y-4">
            <UserActivityItem
              title="User account created"
              date={user.created_date || user.created_at || ""}
              icon={<Calendar className="size-4" />}
            />

            <UserActivityItem
              title={`Status is ${status}`}
              date={user.modified_date || user.updated_at || ""}
              icon={<ShieldCheck className="size-4" />}
            />

            {(user.last_login_date || user.lastlogindate) && (
              <UserActivityItem
                title="Last login"
                date={`${formatUserDate(user.last_login_date || user.lastlogindate)} ${
                  user.last_login_time || ""
                }`}
                icon={<KeyRound className="size-4" />}
              />
            )}
          </ul>
        </div>

        {/* -------------------------------- */}
        {/* Record Information               */}
        {/* -------------------------------- */}

        <div className="surface-card animate-rise p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Record
          </h3>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UserDetailRow label="User ID" value={user.id ?? null} />

            <UserDetailRow label="Primary Key" value={user.pkid ?? null} />

            <UserDetailRow
              label="Organization ID"
              value={user.organization_id ?? ORGANIZATION_ID}
            />

            <UserDetailRow label="Role ID" value={user.role_id ?? null} />
          </dl>
        </div>
      </div>
    </AppShell>
  );
}

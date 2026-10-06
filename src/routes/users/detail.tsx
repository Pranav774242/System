import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";

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

import {
    formatUserDate,
    formatUserDateTime,
    getUserBranch,
    getUserDateOfBirth,
    getUserName,
    getUserRole,
    getUserStatus,
    getUserById,
    type ApiUser,
} from "@/lib/users-api";

export const Route = createFileRoute("/users/detail")({
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

type UserRouteState = {
    userId?: number | string;
    organizationId?: number | string;
};

function UserDetailPage() {
    const location = useLocation();
    const navigate = useNavigate();

    /*
     * User ID and Organization ID are received
     * from the Users page through router state.
     *
     * Example:
     *
     * userId = 4
     * organizationId = 10
     */

    const state = location.state as UserRouteState | undefined;

    const userId = state?.userId;
    const organizationId = state?.organizationId;

    const [user, setUser] = useState<ApiUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadUser() {
            try {
                setLoading(true);
                setError("");

                console.log("=================================");
                console.log("User Detail Page");
                console.log("Received User ID:", userId);
                console.log("Received Organization ID:", organizationId);
                console.log("=================================");

                /*
                 * Both IDs are required for the API.
                 */
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

                /*
                 * API:
                 *
                 * GET
                 * /api/v1/administration/users/{userId}?organizationId={organizationId}
                 */
                const data = await getUserById(String(userId), String(organizationId));

                console.log("User API Response:", data);

                if (!data) {
                    setError("The requested user could not be found.");
                    return;
                }

                setUser(data);
            } catch (err) {
                console.error("Failed to load user:", err);

                setError(err instanceof Error ? err.message : "Unable to load user.");
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [userId, organizationId]);

    /* -------------------------------- */
    /* Loading                          */
    /* -------------------------------- */

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

    /* -------------------------------- */
    /* Error / Not Found                */
    /* -------------------------------- */

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

    /* -------------------------------- */
    /* User Data                        */
    /* -------------------------------- */

    const name = getUserName(user);

    const role = getUserRole(user);

    const status = getUserStatus(user);

    const branch = getUserBranch(user);

    const isActive = user.is_active === true || status === "ACTIVE" || status === "OPERATIVE";

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
                {/* -------------------------------- */}
                {/* Back                             */}
                {/* -------------------------------- */}

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
                {/* Header                           */}
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
                {/* Information Cards               */}
                {/* -------------------------------- */}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* -------------------------------- */}
                    {/* Personal Details                 */}
                    {/* -------------------------------- */}

                    <UserDetailCard title="Personal Details">
                        <UserDetailRow label="Full Name" value={name} />

                        {/* <UserDetailRow label="First Name" value={user.first_name ?? null} /> */}

                        {/* <UserDetailRow label="Middle Name" value={user.middle_name ?? null} /> */}

                        {/* <UserDetailRow label="Last Name" value={user.last_name ?? null} /> */}

                        <UserDetailRow label="Date of Birth" value={getUserDateOfBirth(user)} />

                        <UserDetailRow label="Gender" value={user.gender ?? null} />

                        <UserDetailRow label="Employee Number" value={user.emp_no ?? null} />

                        <UserDetailRow label="Email" value={user.email ?? null} />

                        <UserDetailRow label="Mobile Number" value={user.mobile ?? null} />
                    </UserDetailCard>

                    {/* -------------------------------- */}
                    {/* Organization Details             */}
                    {/* -------------------------------- */}

                    <UserDetailCard title="Organization Details">
                        <UserDetailRow label="Organization Name" value={user.organization_name ?? null} />

                        <UserDetailRow label="Organization Code" value={user.organization_code ?? null} />

                        {/* <UserDetailRow label="Bank ID" value={user.organization_id ?? organizationId ?? null} /> */}

                        <UserDetailRow label="Designation" value={user.designation ?? null} />

                        <UserDetailRow label="Role" value={role} />

                        {/* <UserDetailRow label="Role ID" value={user.role_id ?? null} /> */}

                        <UserDetailRow label="Status" value={status} />

                        <UserDetailRow label="Login Branch" value={branch} />

                        <UserDetailRow label="Login Branch ID" value={user.login_branch_id ?? null} />
                    </UserDetailCard>

                    {/* -------------------------------- */}
                    {/* Login & Access                   */}
                    {/* -------------------------------- */}

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

                    {/* -------------------------------- */}
                    {/* Login Information                */}
                    {/* -------------------------------- */}

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
            </div>
        </AppShell>
    );
}

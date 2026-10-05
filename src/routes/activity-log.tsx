import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Building2,
    Calendar,
    CheckCircle2,
    Clock3,
    Filter,
    Search,
    User,
    XCircle,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAdminStore } from "@/lib/admin-store";

export const Route = createFileRoute("/activity-log")({
    component: ActivityLogPage,
});

type ActivityFilter =
    | "All"
    | "Created"
    | "Updated"
    | "Status Changed";

function ActivityLogPage() {
    const { tenants } = useAdminStore();

    const [search, setSearch] = useState("");
    const [filter, setFilter] =
        useState<ActivityFilter>("All");

    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    /* --------------------------------------------------
       Activity Logs
    -------------------------------------------------- */

    const activityLogs = useMemo(() => {
        const logs = tenants.flatMap((tenant) =>
            tenant.activity.map((activity) => ({
                id: activity.id,

                bankName:
                    tenant.bankName ||
                    tenant.instituteName ||
                    tenant.organization ||
                    "Unknown Bank",

                bankCode: tenant.bankCode || "-",

                status: tenant.status,

                activity: activity.text,

                performedBy: "Admin",

                activityAt: activity.at,
            })),
        );

        return logs.sort(
            (a, b) =>
                new Date(b.activityAt).getTime() -
                new Date(a.activityAt).getTime(),
        );
    }, [tenants]);

    /* --------------------------------------------------
       Filter Activities
    -------------------------------------------------- */

    const filteredLogs = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return activityLogs.filter((log) => {
            const matchesSearch =
                !searchValue ||
                log.bankName
                    .toLowerCase()
                    .includes(searchValue) ||
                log.bankCode
                    .toLowerCase()
                    .includes(searchValue) ||
                log.activity
                    .toLowerCase()
                    .includes(searchValue) ||
                log.performedBy
                    .toLowerCase()
                    .includes(searchValue);

            if (!matchesSearch) {
                return false;
            }

            if (filter === "All") {
                return true;
            }

            if (filter === "Created") {
                return log.activity
                    .toLowerCase()
                    .includes("created");
            }

            if (filter === "Updated") {
                return log.activity
                    .toLowerCase()
                    .includes("updated");
            }

            if (filter === "Status Changed") {
                return log.activity
                    .toLowerCase()
                    .includes("status");
            }

            return true;
        });
    }, [activityLogs, search, filter]);

    /* --------------------------------------------------
       Pagination
    -------------------------------------------------- */

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredLogs.length / itemsPerPage,
        ),
    );

    const paginatedLogs = useMemo(() => {
        const startIndex =
            (currentPage - 1) * itemsPerPage;

        return filteredLogs.slice(
            startIndex,
            startIndex + itemsPerPage,
        );
    }, [filteredLogs, currentPage]);

    const startRecord =
        filteredLogs.length === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1;

    const endRecord = Math.min(
        currentPage * itemsPerPage,
        filteredLogs.length,
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    /* --------------------------------------------------
       Summary Data
    -------------------------------------------------- */

    const activeBanks = tenants.filter(
        (tenant) => tenant.status === "Active",
    ).length;

    return (
        <AppShell title="Activity Log">
            <div className="space-y-6 p-6">

                {/* --------------------------------------------------
                    Summary Cards
                -------------------------------------------------- */}

                <div className="grid gap-4 md:grid-cols-3">

                    {/* Total Banks */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Banks
                                </p>

                                <p className="mt-5 text-3xl font-semibold tracking-tight">
                                    {tenants.length}
                                </p>

                                <p className="mt-3 text-xs font-medium text-green-600">
                                    ↗ All registered banks
                                </p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                <Building2 className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    {/* Active Banks */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Active Banks
                                </p>

                                <p className="mt-5 text-3xl font-semibold tracking-tight">
                                    {activeBanks}
                                </p>

                                <p className="mt-3 text-xs font-medium text-green-600">
                                    ↗ Currently active
                                </p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    {/* Total Activities */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Activities
                                </p>

                                <p className="mt-5 text-3xl font-semibold tracking-tight">
                                    {activityLogs.length}
                                </p>

                                <p className="mt-3 text-xs font-medium text-green-600">
                                    ↗ All recorded activities
                                </p>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* --------------------------------------------------
                    Filters
                -------------------------------------------------- */}

                <div className="rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* Search */}
                        <div className="relative w-full lg:max-w-6xl">
                            <Search
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Search bank, bank code, user or activity..."
                                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Activity Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />

                            <select
                                value={filter}
                                onChange={(event) =>
                                    setFilter(
                                        event.target.value as ActivityFilter,
                                    )
                                }
                                className="h-10 rounded-md border bg-background px-3 text-sm outline-none"
                            >
                                <option value="All">
                                    All Activities
                                </option>

                                <option value="Created">
                                    Created
                                </option>

                                <option value="Updated">
                                    Updated
                                </option>

                                <option value="Status Changed">
                                    Status Changed
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --------------------------------------------------
                    Activity Table
                -------------------------------------------------- */}

                <div className="overflow-hidden rounded-lg border bg-card">

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">

                            <thead className="border-b bg-muted/40">
                                <tr>

                                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                        Activity
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                        Performed By
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                        Bank
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                        Bank Code
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                        Status
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                        Date & Time
                                    </th>

                                </tr>
                            </thead>

                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center"
                                        >
                                            <Activity className="mx-auto h-8 w-8 text-muted-foreground" />

                                            <p className="mt-3 font-medium">
                                                No activity found
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                There are no activities matching
                                                your search or filter.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLogs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b last:border-b-0"
                                        >

                                            {/* Activity */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getActivityIcon(
                                                        log.activity,
                                                    )}

                                                    <span className="font-medium">
                                                        {log.activity}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Performed By */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />

                                                    <span>
                                                        {log.performedBy}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Bank */}
                                            <td className="px-4 py-4">
                                                {log.bankName}
                                            </td>

                                            {/* Bank Code */}
                                            <td className="px-4 py-4">
                                                {log.bankCode}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4">
                                                <span
                                                    className={
                                                        log.status ===
                                                        "Active"
                                                            ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                                                            : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                                    }
                                                >
                                                    {log.status}
                                                </span>
                                            </td>

                                            {/* Date & Time */}
                                            <td className="px-4 py-4 text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />

                                                    {formatDate(
                                                        log.activityAt,
                                                    )}
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>

                        </table>
                    </div>

                    {/* --------------------------------------------------
                        Pagination
                    -------------------------------------------------- */}

                    {filteredLogs.length > 0 && (
                        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

                            {/* Record Information */}
                            <p className="text-sm text-muted-foreground">
                                Showing{" "}
                                <span className="font-medium text-foreground">
                                    {startRecord}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-foreground">
                                    {endRecord}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-foreground">
                                    {filteredLogs.length}
                                </span>{" "}
                                activities
                            </p>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-1">

                                {/* Previous */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.max(
                                                    1,
                                                    page - 1,
                                                ),
                                        )
                                    }
                                    disabled={
                                        currentPage === 1
                                    }
                                    className="rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                {Array.from(
                                    {
                                        length: totalPages,
                                    },
                                    (_, index) =>
                                        index + 1,
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage(
                                                page,
                                            )
                                        }
                                        className={
                                            currentPage ===
                                            page
                                                ? "rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                                                : "rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                                        }
                                    >
                                        {page}
                                    </button>
                                ))}

                                {/* Next */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.min(
                                                    totalPages,
                                                    page + 1,
                                                ),
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    className="rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>

                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppShell>
    );
}

/* --------------------------------------------------
   Date Formatter
-------------------------------------------------- */

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* --------------------------------------------------
   Activity Icon
-------------------------------------------------- */

function getActivityIcon(activity: string) {
    const value = activity.toLowerCase();

    if (value.includes("created")) {
        return (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
        );
    }

    if (value.includes("updated")) {
        return (
            <Activity className="h-4 w-4 text-blue-600" />
        );
    }

    if (value.includes("status")) {
        return (
            <Clock3 className="h-4 w-4 text-orange-600" />
        );
    }

    if (value.includes("deleted")) {
        return (
            <XCircle className="h-4 w-4 text-red-600" />
        );
    }

    return (
        <Activity className="h-4 w-4 text-muted-foreground" />
    );
}
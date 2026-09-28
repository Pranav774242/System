import { createFileRoute } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { useAdminStore, type User } from "@/lib/admin-store";

export const Route = createFileRoute("/users/")({
  head: () => ({ meta: [{ title: "User Management — System Administrator Panel" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { users } = useAdminStore();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const value = query.trim().toLowerCase();
    return users.filter((user) => !value || [fullName(user), user.employeeId, user.officialEmail, user.mobileNumber, user.organization, user.designation].join(" ").toLowerCase().includes(value));
  }, [users, query]);

  return (
    <AppShell title="User Management" subtitle={`${users.length} users added to the platform`}>
      <div className="space-y-4">
        <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search users by name, email or employee ID" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="surface-card animate-rise overflow-hidden">
          {rows.length === 0 ? <div className="flex flex-col items-center gap-3 px-6 py-20 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Users className="size-6" /></span><p className="font-medium">No users found</p><p className="text-sm text-muted-foreground">Users created from Bank Management will appear here.</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-secondary/50"><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="whitespace-nowrap px-4 py-3 font-medium">Full Name</th><th className="whitespace-nowrap px-4 py-3 font-medium">Employee ID</th><th className="whitespace-nowrap px-4 py-3 font-medium">Official Email</th><th className="whitespace-nowrap px-4 py-3 font-medium">Mobile Number</th><th className="whitespace-nowrap px-4 py-3 font-medium">Organization</th><th className="whitespace-nowrap px-4 py-3 font-medium">Designation</th></tr></thead><tbody>{rows.map((user) => <tr key={user.id} className="border-t border-border"><td className="whitespace-nowrap px-4 py-3 font-medium">{fullName(user)}</td><td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{user.employeeId}</td><td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{user.officialEmail}</td><td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{user.mobileNumber}</td><td className="whitespace-nowrap px-4 py-3">{user.organization}</td><td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{user.designation}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </AppShell>
  );
}

function fullName(user: User) {
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");
}

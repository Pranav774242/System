import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Activity } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
  BookOpen,
} from "lucide-react";

import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Bank Management", to: "/tenants", icon: Building2 },
  { label: "User Management", to: "/users", icon: Users },
  { label: "Activity Log", to: "/activity-log", icon: Activity },
  { label: "Lookup Management", to: "/lookup-management", icon: BookOpen },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { authed, adminName, logout, theme, toggleTheme } = useAdminStore();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    if (!authed) {
      navigate({ to: "/", replace: true });
    }
  }, [authed, navigate]);

  if (!authed) {
    return null;
  }

  const adminInitials = adminName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavigation = () => {
    setMobileMenuOpen(false);
    const navigation = [
  // existing items...

  {
    label: "Activity Log",
    href: "/activity-log",
    icon: Activity,
  },
];
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Allianza LOS</p>

              <p className="truncate text-xs text-sidebar-foreground/60">System Administrator</p>
              {/* <p className="truncate text-sm font-semibold">Banking LOS</p> */}
              {/* <p className="truncate text-xs text-sidebar-foreground/60">System Administrator</p> */}
            </div>
          )}
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ label, to, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);

            return (
              <Link
                key={to}
                to={to}
                title={label}
                onClick={handleNavigation}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active && "text-sidebar-primary")}
                  strokeWidth={2}
                />

                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3">
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <>
                <PanelLeftClose className="size-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-sidebar-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Allianza LOS</p>

              <p className="truncate text-xs text-sidebar-foreground/60">System Administrator</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ label, to, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);

            return (
              <Link
                key={to}
                to={to}
                onClick={handleNavigation}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active && "text-sidebar-primary")}
                  strokeWidth={2}
                />

                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4 md:gap-4 md:px-8">
          {/* Mobile Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            title="Open menu"
            className="shrink-0 md:hidden"
          >
            <Menu className="size-5" />
          </Button>

          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            aria-label="Go back"
            title="Go back"
            className="shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>

          {/* Page Title */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>

            {subtitle && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {actions}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-border p-1 pr-2 transition-colors hover:bg-secondary sm:pr-3"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {adminInitials}
                  </span>

                  <span className="hidden text-sm font-medium sm:inline">{adminName}</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{adminName}</p>

                  <p className="text-xs font-normal text-muted-foreground">System Administrator</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate({
                      to: "/",
                      replace: true,
                    });
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";

import {
  DESIGNATIONS,
  type Tenant,
  type TenantInput,
  type TenantStatus,
} from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant;
  onSubmit: (input: TenantInput) => void;
};

const emptyState = {
  firstName: "",
  middleName: "",
  lastName: "",
  employeeId: "",
  email: "",
  mobile: "",
  organization: "",
  designation: "Relationship Manager",
  status: "Active" as TenantStatus,
};

export function TenantFormDrawer({ open, onOpenChange, tenant, onSubmit }: Props) {
  const [form, setForm] = useState(emptyState);
  const [branches, setBranches] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tenant) {
      setForm({
        firstName: tenant.firstName,
        middleName: tenant.middleName ?? "",
        lastName: tenant.lastName,
        employeeId: tenant.employeeId,
        email: tenant.email,
        mobile: tenant.mobile,
        organization: tenant.organization,
        designation: tenant.designation,
        status: tenant.status,
      });
      setBranches(tenant.branches.map((b) => b.location));
    } else {
      setForm(emptyState);
      setBranches([""]);
    }
  }, [open, tenant]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const mobileValid = form.mobile.replace(/\D/g, "").length >= 10;
  const filledBranches = branches.map((b) => b.trim()).filter(Boolean);

  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.employeeId.trim() &&
    emailValid &&
    mobileValid &&
    form.organization.trim() &&
    filledBranches.length > 0 &&
    form.designation;

  const submit = () => {
    if (!valid) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onSubmit({
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        employeeId: form.employeeId.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        organization: form.organization.trim(),
        branches: filledBranches,
        designation: form.designation,
        status: form.status,
      });
      onOpenChange(false);
    }, 500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-lg">{tenant ? "Edit Tenant" : "Create Tenant"}</SheetTitle>
          <SheetDescription>
            {tenant
              ? "Update the tenant's personal and organization details."
              : "Onboard a new bank or NBFC administrator onto the platform."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 px-6 py-6">
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="First Name" required>
                <Input
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Aarav"
                />
              </Field>
              <Field label="Middle Name">
                <Input
                  value={form.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Last Name" required>
                <Input
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Mehta"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee ID" required>
                <Input
                  value={form.employeeId}
                  onChange={(e) => set("employeeId", e.target.value)}
                  placeholder="EMP-10241"
                />
              </Field>
              <Field
                label="Office Email ID"
                required
                error={form.email && !emailValid ? "Enter a valid email address" : undefined}
              >
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@organization.com"
                />
              </Field>
            </div>
            <Field
              label="Mobile Number"
              required
              error={form.mobile && !mobileValid ? "Enter at least 10 digits" : undefined}
            >
              <Input
                type="tel"
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                placeholder="+91 98200 41253"
              />
            </Field>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Organization Details
            </h3>
            <Field label="Bank / NBFC Organization Name" required>
              <Input
                value={form.organization}
                onChange={(e) => set("organization", e.target.value)}
                placeholder="ABC Finance Ltd"
              />
            </Field>

            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm">Branches</Label>
                <span className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Number of Branches: {filledBranches.length}
                </span>
              </div>
              <div className="space-y-2">
                {branches.map((branch, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={branch}
                      onChange={(e) =>
                        setBranches((prev) => prev.map((b, idx) => (idx === i ? e.target.value : b)))
                      }
                      placeholder="Branch Location, e.g. Mumbai — Andheri East"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={branches.length === 1}
                      onClick={() => setBranches((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove branch"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 text-accent hover:text-accent"
                onClick={() => setBranches((prev) => [...prev, ""])}
              >
                <Plus className="size-4" /> Add another branch
              </Button>
            </div>

            <Field label="Designation" required>
              <Select value={form.designation} onValueChange={(v) => set("designation", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  {form.status === "Active"
                    ? "Tenant can access the platform"
                    : "Tenant access is suspended"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{form.status}</span>
                <Switch
                  checked={form.status === "Active"}
                  onCheckedChange={(c) => set("status", c ? "Active" : "Inactive")}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {tenant ? "Save Changes" : "Create Tenant"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

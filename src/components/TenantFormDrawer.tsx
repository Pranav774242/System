import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Upload, X } from "lucide-react";

import {
  DESIGNATIONS,
  type Tenant,
  type TenantInput,
  type TenantStatus,
} from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

/**
 * NOTE ON TYPES
 * -------------
 * This form now captures many more fields than the current `Tenant` /
 * `TenantInput` types in "@/lib/admin-store" likely define (institute
 * details, registered/corporate addresses, contact details, and a richer
 * branch shape). Extend those types to match `InstituteFormValues` /
 * `BranchInput` below, then remove the local fallback types + `as any`
 * cast on `onSubmit(...)` at the bottom of this file. Everything else
 * will typecheck as-is.
 */

export type BranchInput = {
  ifscCode: string;
  branchName: string;
  branchCode: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
};

const INSTITUTE_TYPES = [
  "Scheduled Commercial Bank",
  "Small Finance Bank",
  "Payments Bank",
  "Regional Rural Bank",
  "Cooperative Bank",
  "NBFC",
  "Housing Finance Company",
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant;
  onSubmit: (input: TenantInput) => void;
};

const emptyBranch: BranchInput = {
  ifscCode: "",
  branchName: "",
  branchCode: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
};

const emptyState = {
  // Administrator details
  firstName: "",
  middleName: "",
  lastName: "",
  employeeId: "",
  email: "",
  mobile: "",

  // Institute details
  instituteName: "",
  instituteType: "" as (typeof INSTITUTE_TYPES)[number] | "",
  legalName: "",
  shortName: "",
  registrationNumber: "",
  regulatoryAuthority: "",
  website: "",

  // Registered / location details
  country: "India",
  state: "",
  city: "",
  pinCode: "",
  registeredAddress: "",
  corporateAddress: "",
  sameAsRegistered: false,

  // Contact details
  contactEmail: "",
  contactPhone: "",

  // Designation & status
  designation: "Relationship Manager",
  status: "Active" as TenantStatus,
};

export function TenantFormDrawer({ open, onOpenChange, tenant, onSubmit }: Props) {
  const [form, setForm] = useState(emptyState);
  const [branches, setBranches] = useState<BranchInput[]>([emptyBranch]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tenant) {
      const t = tenant as unknown as Partial<typeof emptyState> & Partial<Tenant>;
      setForm({
        ...emptyState,
        ...t,
        organization: undefined as never,
      } as typeof emptyState);
      setBranches(
        // Falls back to a single blank branch if the existing tenant only
        // has the older `{ location: string }` branch shape.
        (tenant.branches as unknown as Partial<BranchInput>[])?.length
          ? (tenant.branches as unknown as BranchInput[])
          : [emptyBranch]
      );
      setLogoFile(null);
      setLogoPreview((tenant as unknown as { logoUrl?: string }).logoUrl ?? null);
    } else {
      setForm(emptyState);
      setBranches([emptyBranch]);
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [open, tenant]);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setBranchField = (index: number, key: keyof BranchInput, value: string) =>
    setBranches((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [key]: key === "ifscCode" ? value.toUpperCase() : value } : b))
    );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const toggleSameAsRegistered = (checked: boolean) => {
    set("sameAsRegistered", checked);
    if (checked) set("corporateAddress", form.registeredAddress);
  };

  // ---- validation -----------------------------------------------------
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const mobileValid = form.mobile.replace(/\D/g, "").length >= 10;
  const contactEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail);
  const contactPhoneValid = form.contactPhone.replace(/\D/g, "").length >= 10;
  const pinCodeValid = /^\d{6}$/.test(form.pinCode);
  const websiteValid = form.website.trim() === "" || /^https?:\/\/.+\..+/.test(form.website.trim());

  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const branchValid = (b: BranchInput) =>
    ifscPattern.test(b.ifscCode.trim()) &&
    b.branchName.trim() &&
    b.address.trim() &&
    b.city.trim() &&
    b.state.trim() &&
    /^\d{6}$/.test(b.pinCode.trim());

  const validBranches = branches.filter(branchValid);

  const valid =
    Boolean(
      form.firstName.trim() &&
        form.lastName.trim() &&
        form.employeeId.trim() &&
        emailValid &&
        mobileValid &&
        form.instituteName.trim() &&
        form.instituteType &&
        form.legalName.trim() &&
        form.registrationNumber.trim() &&
        websiteValid &&
        form.country.trim() &&
        form.state.trim() &&
        form.city.trim() &&
        pinCodeValid &&
        form.registeredAddress.trim() &&
        form.corporateAddress.trim() &&
        contactEmailValid &&
        contactPhoneValid &&
        form.designation
    ) && validBranches.length === branches.length && branches.length > 0;

  const submit = () => {
    if (!valid) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const middleName = form.middleName.trim();
      const payload = {
        // Administrator
        firstName: form.firstName.trim(),
        ...(middleName ? { middleName } : {}),
        lastName: form.lastName.trim(),
        employeeId: form.employeeId.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),

        // Institute
        instituteName: form.instituteName.trim(),
        instituteType: form.instituteType,
        legalName: form.legalName.trim(),
        shortName: form.shortName.trim(),
        registrationNumber: form.registrationNumber.trim(),
        regulatoryAuthority: form.regulatoryAuthority.trim(),
        website: form.website.trim(),
        logoFile,

        // Registered / location
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        pinCode: form.pinCode.trim(),
        registeredAddress: form.registeredAddress.trim(),
        corporateAddress: form.corporateAddress.trim(),

        // Contact
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),

        // Branches, designation, status
        branches,
        designation: form.designation,
        status: form.status,
      };
      onSubmit(payload as unknown as TenantInput);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-lg">{tenant ? "Edit Bank" : "Create Bank"}</SheetTitle>
          <SheetDescription>
            {tenant
              ? "Update the bank's administrator, institute, and branch details."
              : "Onboard a new bank or NBFC onto the platform."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 px-6 py-6">
          {/* ---------------- Administrator Details ---------------- */}
          <section className="space-y-4">
            <SectionHeading>Administrator Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="First Name" required>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Aarav" />
              </Field>
              <Field label="Middle Name">
                <Input value={form.middleName} onChange={(e) => set("middleName", e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Last Name" required>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Mehta" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee ID" required>
                <Input value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} placeholder="EMP-10241" />
              </Field>
              <Field label="Office Email ID" required error={form.email && !emailValid ? "Enter a valid email address" : undefined}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@organization.com" />
              </Field>
            </div>
            <Field label="Mobile Number" required error={form.mobile && !mobileValid ? "Enter at least 10 digits" : undefined}>
              <Input type="tel" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+91 98200 41253" />
            </Field>
          </section>

          {/* ---------------- Institute Details ---------------- */}
          <section className="space-y-4">
            <SectionHeading>Institute Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Institute Name" required>
                <Input value={form.instituteName} onChange={(e) => set("instituteName", e.target.value)} placeholder="ABC Finance Ltd" />
              </Field>
              <Field label="Institute Type" required>
                <Select value={form.instituteType} onValueChange={(v) => set("instituteType", v as typeof form.instituteType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select institute type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal Name" required>
                <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder="As per certificate of incorporation" />
              </Field>
              <Field label="Short Name">
                <Input value={form.shortName} onChange={(e) => set("shortName", e.target.value)} placeholder="ABC" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Registration Number" required>
                <Input value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} placeholder="CIN / registration no." />
              </Field>
              <Field label="Regulatory Authority">
                <Input value={form.regulatoryAuthority} onChange={(e) => set("regulatoryAuthority", e.target.value)} placeholder="RBI, SEBI, etc." />
              </Field>
            </div>
            <Field label="Website" error={form.website && !websiteValid ? "Enter a valid URL (https://...)" : undefined}>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://www.organization.com" />
            </Field>
            <Field label="Logo Upload">
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Institute logo preview" className="size-14 rounded-lg border border-border object-cover" />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      aria-label="Remove logo"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex size-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">
                    <Upload className="size-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">PNG or JPG, up to 2MB. Square logos work best.</p>
              </div>
            </Field>
          </section>

          {/* ---------------- Registered & Location Details ---------------- */}
          <section className="space-y-4">
            <SectionHeading>Registered &amp; Location Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country" required>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="India" />
              </Field>
              <Field label="State" required>
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Maharashtra" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" required>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" />
              </Field>
              <Field label="PIN Code" required error={form.pinCode && !pinCodeValid ? "Enter a valid 6-digit PIN code" : undefined}>
                <Input value={form.pinCode} onChange={(e) => set("pinCode", e.target.value)} placeholder="400001" />
              </Field>
            </div>
            <Field label="Registered Address" required>
              <Textarea
                value={form.registeredAddress}
                onChange={(e) => {
                  set("registeredAddress", e.target.value);
                  if (form.sameAsRegistered) set("corporateAddress", e.target.value);
                }}
                placeholder="Registered office address"
                rows={2}
              />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Corporate Office Address<span className="ml-0.5 text-destructive">*</span>
                </Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Same as registered address
                  <Switch checked={form.sameAsRegistered} onCheckedChange={toggleSameAsRegistered} />
                </label>
              </div>
              <Textarea
                value={form.corporateAddress}
                onChange={(e) => set("corporateAddress", e.target.value)}
                placeholder="Corporate office address"
                rows={2}
                disabled={form.sameAsRegistered}
              />
            </div>
          </section>

          {/* ---------------- Contact Details ---------------- */}
          <section className="space-y-4">
            <SectionHeading>Contact Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact Email" required error={form.contactEmail && !contactEmailValid ? "Enter a valid email address" : undefined}>
                <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="contact@organization.com" />
              </Field>
              <Field label="Contact Phone" required error={form.contactPhone && !contactPhoneValid ? "Enter at least 10 digits" : undefined}>
                <Input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+91 22 4000 1234" />
              </Field>
            </div>
          </section>

          {/* ---------------- Branches ---------------- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading>Branches</SectionHeading>
              <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Number of Branches: {validBranches.length}
              </span>
            </div>
            <div className="space-y-3">
              {branches.map((branch, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Branch {i + 1}</p>
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
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="IFSC Code" required>
                      <Input
                        value={branch.ifscCode}
                        onChange={(e) => setBranchField(i, "ifscCode", e.target.value)}
                        placeholder="ABCD0123456"
                        maxLength={11}
                        className="uppercase"
                      />
                    </Field>
                    <Field label="Branch Name" required>
                      <Input value={branch.branchName} onChange={(e) => setBranchField(i, "branchName", e.target.value)} placeholder="Andheri East" />
                    </Field>
                    <Field label="Branch Code">
                      <Input value={branch.branchCode} onChange={(e) => setBranchField(i, "branchCode", e.target.value)} placeholder="BR-014" />
                    </Field>
                  </div>
                  <Field label="Address" required>
                    <Textarea value={branch.address} onChange={(e) => setBranchField(i, "address", e.target.value)} placeholder="Branch address" rows={2} />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="City" required>
                      <Input value={branch.city} onChange={(e) => setBranchField(i, "city", e.target.value)} placeholder="Mumbai" />
                    </Field>
                    <Field label="State" required>
                      <Input value={branch.state} onChange={(e) => setBranchField(i, "state", e.target.value)} placeholder="Maharashtra" />
                    </Field>
                    <Field label="PIN Code" required>
                      <Input value={branch.pinCode} onChange={(e) => setBranchField(i, "pinCode", e.target.value)} placeholder="400069" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-accent hover:text-accent" onClick={() => setBranches((prev) => [...prev, { ...emptyBranch }])}>
              <Plus className="size-4" /> Add another branch
            </Button>
          </section>

          {/* ---------------- Designation & Status ---------------- */}
          <section className="space-y-4">
            <SectionHeading>Access</SectionHeading>
            <Field label="Designation" required>
              <Select value={form.designation} onValueChange={(v) => set("designation", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  {form.status === "Active" ? "Tenant can access the platform" : "Tenant access is suspended"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{form.status}</span>
                <Switch checked={form.status === "Active"} onCheckedChange={(c) => set("status", c ? "Active" : "Inactive")} />
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>;
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
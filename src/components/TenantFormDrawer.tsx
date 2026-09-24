import { useEffect, useState } from "react";

import { Plus, Trash2, Loader2, Upload, X } from "lucide-react";

import {
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
  "NBFC",
  "Cooperative Bank",
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

type FormErrors = {
  instituteName?: string;
  instituteType?: string;
  legalName?: string;
  shortName?: string;
  registrationNumber?: string;
  regulatoryAuthority?: string;
  website?: string;
  country?: string;
  state?: string;
  city?: string;
  pinCode?: string;
  registeredAddress?: string;
  corporateAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
};

type BranchErrors = {
  ifscCode?: string;
  branchName?: string;
  branchCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
};

function getFormErrors(values: typeof emptyState): FormErrors {
  const errors: FormErrors = {};

  // ---------------- Institute Name ----------------

  if (!values.instituteName || !values.instituteName.trim()) {
    errors.instituteName = "Institute name is required";
  } else if (values.instituteName.trim().length < 2) {
    errors.instituteName = "Enter a valid institute name";
  }

  // ---------------- Institute Type ----------------

  if (!values.instituteType) {
    errors.instituteType = "Please select an institute type";
  } else if (
    values.instituteType !== "NBFC" &&
    values.instituteType !== "Cooperative Bank"
  ) {
    errors.instituteType =
      "Institute type must be NBFC or Cooperative Bank";
  }

  // ---------------- Legal Name ----------------

  if (!values.legalName || !values.legalName.trim()) {
    errors.legalName = "Legal name is required";
  } else if (values.legalName.trim().length < 2) {
    errors.legalName = "Enter a valid legal name";
  }

  // ---------------- Short Name ----------------

  if (values.shortName.length > 0 && !values.shortName.trim()) {
    errors.shortName = "Short name cannot contain only spaces";
  }

 // ---------------- Registration Number ----------------
// ---------------- Registration Number ----------------

if (
  !values.registrationNumber ||
  !values.registrationNumber.trim()
) {
  errors.registrationNumber =
    "Registration number is required";
} else {
  const registrationNumber =
    values.registrationNumber.trim();

  const registrationNumberPattern =
    /^[A-Za-z0-9][A-Za-z0-9 /-]{2,29}$/;

  if (
    !registrationNumberPattern.test(
      registrationNumber
    )
  ) {
    errors.registrationNumber =
      "Enter a valid registration number (3-30 characters; letters, numbers, / and - only)";
  }
}
  // ---------------- Regulatory Authority ----------------

  if (
    values.regulatoryAuthority.length > 0 &&
    !values.regulatoryAuthority.trim()
  ) {
    errors.regulatoryAuthority =
      "Regulatory authority cannot contain only spaces";
  }

  // ---------------- Website ----------------

  if (
    values.website.trim() &&
    !/^https?:\/\/.+\..+/.test(values.website.trim())
  ) {
    errors.website =
      "Enter a valid URL (https://...)";
  }

  // ---------------- Country ----------------

  if (!values.country || !values.country.trim()) {
    errors.country = "Country is required";
  }

  // ---------------- State ----------------

  if (!values.state || !values.state.trim()) {
    errors.state = "State is required";
  }

  // ---------------- City ----------------

  if (!values.city || !values.city.trim()) {
    errors.city = "City is required";
  }

  // ---------------- PIN Code ----------------

  if (!values.pinCode || !values.pinCode.trim()) {
    errors.pinCode = "PIN code is required";
  } else if (!/^\d{6}$/.test(values.pinCode.trim())) {
    errors.pinCode = "Enter a valid 6-digit PIN code";
  }

  // ---------------- Registered Address ----------------

  if (
    !values.registeredAddress ||
    !values.registeredAddress.trim()
  ) {
    errors.registeredAddress =
      "Registered address is required";
  }

  // ---------------- Corporate Address ----------------

  if (
    !values.sameAsRegistered &&
    (!values.corporateAddress ||
      !values.corporateAddress.trim())
  ) {
    errors.corporateAddress =
      "Corporate office address is required";
  }

  // ---------------- Contact Email ----------------

  if (
    !values.contactEmail ||
    !values.contactEmail.trim()
  ) {
    errors.contactEmail =
      "Contact email is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      values.contactEmail.trim()
    )
  ) {
    errors.contactEmail =
      "Enter a valid email address";
  }

  // ---------------- Contact Phone ----------------

  if (
    !values.contactPhone ||
    !values.contactPhone.trim()
  ) {
    errors.contactPhone =
      "Contact phone is required";
  } else {
    const phone = values.contactPhone.trim();

    // Indian mobile:
    // exactly 10 digits
    // first digit must be 6, 7, 8 or 9
    const isMobile = /^[6-9]\d{9}$/.test(phone);

    // Telephone / landline:
    // 7 to 15 digits
    const isTelephone = /^\d{7,15}$/.test(phone);

    if (!isMobile && !isTelephone) {
      errors.contactPhone =
        "Enter a valid mobile number (10 digits starting with 6-9) or telephone number (7-15 digits)";
    }
  }

  return errors;
}

const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function getBranchErrors(
  branchList: BranchInput[]
): BranchErrors[] {
  return branchList.map((b) => {
    const errors: BranchErrors = {};

    // ---------------- IFSC ----------------

    if (!b.ifscCode || !b.ifscCode.trim()) {
      errors.ifscCode = "IFSC code is required";
    } else if (
      !ifscPattern.test(
        b.ifscCode.trim().toUpperCase()
      )
    ) {
      errors.ifscCode =
        "Enter a valid 11-character IFSC code (e.g. ABCD0123456)";
    }

    // ---------------- Branch Name ----------------

    if (!b.branchName || !b.branchName.trim()) {
      errors.branchName =
        "Branch name is required";
    }

    // ---------------- Branch Code ----------------

    if (
      b.branchCode.length > 0 &&
      !b.branchCode.trim()
    ) {
      errors.branchCode =
        "Branch code cannot contain only spaces";
    }

    // ---------------- Branch Address ----------------

    if (!b.address || !b.address.trim()) {
      errors.address =
        "Branch address is required";
    }

    // ---------------- Branch City ----------------

    if (!b.city || !b.city.trim()) {
      errors.city = "City is required";
    }

    // ---------------- Branch State ----------------

    if (!b.state || !b.state.trim()) {
      errors.state = "State is required";
    }

    // ---------------- Branch PIN ----------------

    if (!b.pinCode || !b.pinCode.trim()) {
      errors.pinCode =
        "PIN code is required";
    } else if (
      !/^\d{6}$/.test(b.pinCode.trim())
    ) {
      errors.pinCode =
        "Enter a valid 6-digit PIN code";
    }

    return errors;
  });
}

export function TenantFormDrawer({
  open,
  onOpenChange,
  tenant,
  onSubmit,
}: Props) {
  const [form, setForm] = useState(emptyState);

  const [branches, setBranches] =
    useState<BranchInput[]>([emptyBranch]);

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [touched, setTouched] =
    useState<
      Partial<
        Record<
          keyof typeof emptyState,
          boolean
        >
      >
    >({});

  const [touchedBranches, setTouchedBranches] =
    useState<
      Record<
        number,
        Partial<
          Record<keyof BranchInput, boolean>
        >
      >
    >({});

  const [submitted, setSubmitted] =
    useState(false);

  // ---------------- Load Form ----------------

  useEffect(() => {
    if (!open) return;

    setTouched({});
    setTouchedBranches({});
    setSubmitted(false);

    if (tenant) {
      const t =
        tenant as unknown as
          Partial<typeof emptyState> &
          Partial<Tenant>;

      setForm({
        ...emptyState,
        ...t,
        organization: undefined as never,
      } as typeof emptyState);

      setBranches(
        (tenant.branches as unknown as Partial<BranchInput>[])
          ?.length
          ? (tenant.branches as unknown as BranchInput[])
          : [{ ...emptyBranch }]
      );

      setLogoFile(null);

      setLogoPreview(
        (tenant as unknown as {
          logoUrl?: string;
        }).logoUrl ?? null
      );
    } else {
      setForm(emptyState);
      setBranches([{ ...emptyBranch }]);
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [open, tenant]);

  // ---------------- Logo Cleanup ----------------

  useEffect(() => {
    return () => {
      if (
        logoPreview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // ---------------- Set Form Field ----------------

  const set = <
    K extends keyof typeof form
  >(
    key: K,
    value: (typeof form)[K]
  ) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  // ---------------- Set Branch Field ----------------

  const setBranchField = (
    index: number,
    key: keyof BranchInput,
    value: string
  ) =>
    setBranches((prev) =>
      prev.map((b, i) =>
        i === index
          ? {
              ...b,
              [key]:
                key === "ifscCode"
                  ? value.toUpperCase()
                  : value,
            }
          : b
      )
    );

  // ---------------- Logo Change ----------------

  const handleLogoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      logoPreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(
      URL.createObjectURL(file)
    );
  };

  // ---------------- Remove Logo ----------------

  const removeLogo = () => {
    if (
      logoPreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(null);
    setLogoPreview(null);
  };

  // ---------------- Same Address ----------------

  const toggleSameAsRegistered = (
    checked: boolean
  ) => {
    set("sameAsRegistered", checked);

    if (checked) {
      set(
        "corporateAddress",
        form.registeredAddress
      );
    }
  };

  // ---------------- Mark Touched ----------------

  const markTouched = (
    key: keyof typeof emptyState
  ) =>
    setTouched((prev) => ({
      ...prev,
      [key]: true,
    }));

  const markBranchTouched = (
    index: number,
    key: keyof BranchInput
  ) =>
    setTouchedBranches((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [key]: true,
      },
    }));

  // ---------------- Remove Branch ----------------

  const removeBranch = (index: number) => {
    setBranches((prev) =>
      prev.filter(
        (_, idx) => idx !== index
      )
    );

    setTouchedBranches((prev) => {
      const next: Record<
        number,
        Partial<
          Record<keyof BranchInput, boolean>
        >
      > = {};

      Object.keys(prev)
        .map(Number)
        .filter((idx) => idx !== index)
        .forEach((idx) => {
          const val = prev[idx];

          if (val) {
            const newIdx =
              idx > index ? idx - 1 : idx;

            next[newIdx] = val;
          }
        });

      return next;
    });
  };

  // ---------------- Validation ----------------

  const formErrors =
    getFormErrors(form);

  const branchErrorsList =
    getBranchErrors(branches);

  const validBranches =
    branches.filter(
      (_, i) =>
        Object.keys(
          branchErrorsList[i] || {}
        ).length === 0
    );

  const isFormValid =
    Object.keys(formErrors).length === 0 &&
    branches.length > 0 &&
    validBranches.length ===
      branches.length;

  const getFieldError = (
    key: keyof FormErrors
  ) => {
    return submitted || touched[key]
      ? formErrors[key]
      : undefined;
  };

  const getBranchError = (
    index: number,
    key: keyof BranchErrors
  ) => {
    return submitted ||
      touchedBranches[index]?.[key]
      ? branchErrorsList[index]?.[key]
      : undefined;
  };

  // ---------------- Submit ----------------

  const submit = () => {
    setSubmitted(true);

    if (!isFormValid) return;

    setBusy(true);

    setTimeout(() => {
      setBusy(false);

      const payload = {
        // Institute
        instituteName:
          form.instituteName.trim(),

        organization:
          form.instituteName.trim(),

        instituteType:
          form.instituteType,

        legalName:
          form.legalName.trim(),

        shortName:
          form.shortName.trim(),

        registrationNumber:
          form.registrationNumber.trim(),

        regulatoryAuthority:
          form.regulatoryAuthority.trim(),

        website:
          form.website.trim(),

        logoFile,

        // Registered / Location
        country:
          form.country.trim(),

        state:
          form.state.trim(),

        city:
          form.city.trim(),

        pinCode:
          form.pinCode.trim(),

        registeredAddress:
          form.registeredAddress.trim(),

        corporateAddress:
          form.sameAsRegistered
            ? form.registeredAddress.trim()
            : form.corporateAddress.trim(),

        // Contact
        contactEmail:
          form.contactEmail.trim(),

        contactPhone:
          form.contactPhone.trim(),

        // Branches
        branches,

        designation:
          form.designation,

        status:
          form.status,
      };

      onSubmit(
        payload as unknown as TenantInput
      );

      onOpenChange(false);
    }, 500);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl">

        {/* ---------------- Header ---------------- */}

        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-lg">
            {tenant
              ? "Edit Bank"
              : "Create Bank"}
          </SheetTitle>

          <SheetDescription>
            {tenant
              ? "Update the bank's institute and branch details."
              : "Onboard a new bank or NBFC onto the platform."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 px-6 py-6">

          {/* ---------------- Institute Details ---------------- */}

          <section className="space-y-4">
            <SectionHeading>
              Institute Details
            </SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Institute Name"
                required
                error={getFieldError(
                  "instituteName"
                )}
              >
                <Input
                  value={
                    form.instituteName
                  }
                  onChange={(e) =>
                    set(
                      "instituteName",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "instituteName"
                    )
                  }
                />
              </Field>

              <Field
                label="Institute Type"
                required
                error={getFieldError(
                  "instituteType"
                )}
              >
                <Select
                  value={
                    form.instituteType
                  }
                  onValueChange={(v) => {
                    set(
                      "instituteType",
                      v as typeof form.instituteType
                    );

                    markTouched(
                      "instituteType"
                    );
                  }}
                >
                  <SelectTrigger
                    onBlur={() =>
                      markTouched(
                        "instituteType"
                      )
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {INSTITUTE_TYPES.map(
                      (t) => (
                        <SelectItem
                          key={t}
                          value={t}
                        >
                          {t}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Legal Name"
                required
                error={getFieldError(
                  "legalName"
                )}
              >
                <Input
                  value={form.legalName}
                  onChange={(e) =>
                    set(
                      "legalName",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "legalName"
                    )
                  }
                />
              </Field>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Registration Number"
                required
                error={getFieldError(
                  "registrationNumber"
                )}
              >
                <Input
                  value={
                    form.registrationNumber
                  }
                  onChange={(e) =>
                    set(
                      "registrationNumber",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "registrationNumber"
                    )
                  }
                />
              </Field>

              <Field
                label="Regulatory Authority"
                error={getFieldError(
                  "regulatoryAuthority"
                )}
              >
                <Input
                  value={
                    form.regulatoryAuthority
                  }
                  onChange={(e) =>
                    set(
                      "regulatoryAuthority",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "regulatoryAuthority"
                    )
                  }
                />
              </Field>

            </div>

            <Field
              label="Website"
              error={getFieldError(
                "website"
              )}
            >
              <Input
                value={form.website}
                onChange={(e) =>
                  set(
                    "website",
                    e.target.value
                  )
                }
                onBlur={() =>
                  markTouched("website")
                }
              />
            </Field>

            {/* ---------------- Logo ---------------- */}

            <Field label="Logo Upload">
              <div className="flex items-center gap-3">

                {logoPreview ? (
                  <div className="relative">

                    <img
                      src={logoPreview}
                      alt="Institute logo preview"
                      className="size-14 rounded-lg border border-border object-cover"
                    />

                    <button
                      type="button"
                      onClick={
                        removeLogo
                      }
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      aria-label="Remove logo"
                    >
                      <X className="size-3" />
                    </button>

                  </div>
                ) : (
                  <label className="flex size-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">

                    <Upload className="size-5" />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={
                        handleLogoChange
                      }
                    />

                  </label>
                )}

                <p className="text-xs text-muted-foreground">
                  PNG or JPG, up to 2MB.
                  Square logos work best.
                </p>

              </div>
            </Field>

          </section>

          {/* ---------------- Registered & Location Details ---------------- */}

          <section className="space-y-4">

            <SectionHeading>
              Registered &amp; Location Details
            </SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Country"
                required
                error={getFieldError(
                  "country"
                )}
              >
                <Input
                  value={form.country}
                  onChange={(e) =>
                    set(
                      "country",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "country"
                    )
                  }
                />
              </Field>

              <Field
                label="State"
                required
                error={getFieldError(
                  "state"
                )}
              >
                <Input
                  value={form.state}
                  onChange={(e) =>
                    set(
                      "state",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched("state")
                  }
                />
              </Field>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="City"
                required
                error={getFieldError(
                  "city"
                )}
              >
                <Input
                  value={form.city}
                  onChange={(e) =>
                    set(
                      "city",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched("city")
                  }
                />
              </Field>

              <Field
                label="PIN Code"
                required
                error={getFieldError(
                  "pinCode"
                )}
              >
                <Input
                  value={form.pinCode}
                  maxLength={6}
                  inputMode="numeric"
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    set(
                      "pinCode",
                      value
                    );
                  }}
                  onBlur={() =>
                    markTouched(
                      "pinCode"
                    )
                  }
                />
              </Field>

            </div>

            <Field
              label="Registered Address"
              required
              error={getFieldError(
                "registeredAddress"
              )}
            >
              <Textarea
                value={
                  form.registeredAddress
                }
                onChange={(e) => {
                  set(
                    "registeredAddress",
                    e.target.value
                  );

                  if (
                    form.sameAsRegistered
                  ) {
                    set(
                      "corporateAddress",
                      e.target.value
                    );
                  }
                }}
                onBlur={() =>
                  markTouched(
                    "registeredAddress"
                  )
                }
                rows={2}
              />
            </Field>

            <div className="space-y-2">

              <div className="flex items-center justify-between">

                <Label className="text-sm">
                  Corporate Office Address
                  <span className="ml-0.5 text-destructive">
                    *
                  </span>
                </Label>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Same as registered address

                  <Switch
                    checked={
                      form.sameAsRegistered
                    }
                    onCheckedChange={
                      toggleSameAsRegistered
                    }
                  />
                </label>

              </div>

              <Textarea
                value={
                  form.corporateAddress
                }
                onChange={(e) =>
                  set(
                    "corporateAddress",
                    e.target.value
                  )
                }
                onBlur={() =>
                  markTouched(
                    "corporateAddress"
                  )
                }
                rows={2}
                disabled={
                  form.sameAsRegistered
                }
              />

              {getFieldError(
                "corporateAddress"
              ) && (
                <p className="text-xs text-destructive">
                  {getFieldError(
                    "corporateAddress"
                  )}
                </p>
              )}

            </div>

          </section>

          {/* ---------------- Contact Details ---------------- */}

          <section className="space-y-4">

            <SectionHeading>
              Contact Details
            </SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Contact Email"
                required
                error={getFieldError(
                  "contactEmail"
                )}
              >
                <Input
                  type="email"
                  value={
                    form.contactEmail
                  }
                  onChange={(e) =>
                    set(
                      "contactEmail",
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "contactEmail"
                    )
                  }
                />
              </Field>

              <Field
                label="Contact Phone"
                required
                error={getFieldError(
                  "contactPhone"
                )}
              >
                <Input
                  type="tel"
                  value={
                    form.contactPhone
                  }
                  maxLength={15}
                  inputMode="numeric"
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    set(
                      "contactPhone",
                      value
                    );
                  }}
                  onBlur={() =>
                    markTouched(
                      "contactPhone"
                    )
                  }
                />
              </Field>

            </div>

          </section>

          {/* ---------------- Branches ---------------- */}

          <section className="space-y-4">

            <div className="flex items-center justify-between">

              <SectionHeading>
                Branches
              </SectionHeading>

              <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Number of Branches:{" "}
                {validBranches.length}
              </span>

            </div>

            <div className="space-y-3">

              {branches.map(
                (branch, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4"
                  >

                    <div className="flex items-center justify-between">

                      <p className="text-sm font-medium">
                        Branch {i + 1}
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={
                          branches.length ===
                          1
                        }
                        onClick={() =>
                          removeBranch(i)
                        }
                        aria-label="Remove branch"
                      >
                        <Trash2 className="size-4" />
                      </Button>

                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">

                      <Field
                        label="IFSC Code"
                        required
                        error={getBranchError(
                          i,
                          "ifscCode"
                        )}
                      >
                        <Input
                          value={
                            branch.ifscCode
                          }
                          onChange={(e) =>
                            setBranchField(
                              i,
                              "ifscCode",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            markBranchTouched(
                              i,
                              "ifscCode"
                            )
                          }
                          maxLength={11}
                          className="uppercase"
                        />
                      </Field>

                      <Field
                        label="Branch Name"
                        required
                        error={getBranchError(
                          i,
                          "branchName"
                        )}
                      >
                        <Input
                          value={
                            branch.branchName
                          }
                          onChange={(e) =>
                            setBranchField(
                              i,
                              "branchName",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            markBranchTouched(
                              i,
                              "branchName"
                            )
                          }
                        />
                      </Field>

                      <Field
                        label="Branch Code"
                        error={getBranchError(
                          i,
                          "branchCode"
                        )}
                      >
                        <Input
                          value={
                            branch.branchCode
                          }
                          onChange={(e) =>
                            setBranchField(
                              i,
                              "branchCode",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            markBranchTouched(
                              i,
                              "branchCode"
                            )
                          }
                        />
                      </Field>

                    </div>

                    <Field
                      label="Address"
                      required
                      error={getBranchError(
                        i,
                        "address"
                      )}
                    >
                      <Textarea
                        value={
                          branch.address
                        }
                        onChange={(e) =>
                          setBranchField(
                            i,
                            "address",
                            e.target.value
                          )
                        }
                        onBlur={() =>
                          markBranchTouched(
                            i,
                            "address"
                          )
                        }
                        rows={2}
                      />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-3">

                      <Field
                        label="City"
                        required
                        error={getBranchError(
                          i,
                          "city"
                        )}
                      >
                        <Input
                          value={
                            branch.city
                          }
                          onChange={(e) =>
                            setBranchField(
                              i,
                              "city",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            markBranchTouched(
                              i,
                              "city"
                            )
                          }
                        />
                      </Field>

                      <Field
                        label="State"
                        required
                        error={getBranchError(
                          i,
                          "state"
                        )}
                      >
                        <Input
                          value={
                            branch.state
                          }
                          onChange={(e) =>
                            setBranchField(
                              i,
                              "state",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            markBranchTouched(
                              i,
                              "state"
                            )
                          }
                        />
                      </Field>

                      <Field
                        label="PIN Code"
                        required
                        error={getBranchError(
                          i,
                          "pinCode"
                        )}
                      >
                        <Input
                          value={
                            branch.pinCode
                          }
                          maxLength={6}
                          inputMode="numeric"
                          onChange={(e) => {
                            const value =
                              e.target.value.replace(
                                /\D/g,
                                ""
                              );

                            setBranchField(
                              i,
                              "pinCode",
                              value
                            );
                          }}
                          onBlur={() =>
                            markBranchTouched(
                              i,
                              "pinCode"
                            )
                          }
                        />
                      </Field>

                    </div>

                  </div>
                )
              )}

            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-accent hover:text-accent"
              onClick={() =>
                setBranches(
                  (prev) => [
                    ...prev,
                    { ...emptyBranch },
                  ]
                )
              }
            >
              <Plus className="size-4" />
              Add another branch
            </Button>

          </section>

        </div>

        {/* ---------------- Footer ---------------- */}

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card px-6 py-4">

          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={busy}
          >
            {busy && (
              <Loader2 className="size-4 animate-spin" />
            )}

            {tenant
              ? "Save Changes"
              : "Create Bank"}
          </Button>

        </div>

      </SheetContent>
    </Sheet>
  );
}

// ---------------- Section Heading ----------------

function SectionHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

// ---------------- Field ----------------

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

        {required && (
          <span className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </Label>

      {children}

      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}

    </div>
  );
}
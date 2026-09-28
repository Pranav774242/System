import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  type InstituteType,
  type Tenant,
  type BankInput,
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

import { Switch } from "@/components/ui/switch";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BranchInput = {
  ifscCode: string;
  branchName: string;
  branchCode: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant;
  onSubmit: (input: BankInput) => void;
};

/* -------------------------------------------------------------------------- */
/* Empty Values                                                               */
/* -------------------------------------------------------------------------- */

const emptyBranch: BranchInput = {
  ifscCode: "",
  branchName: "",
  branchCode: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
};

const emptyForm = {
  instituteName: "",
  instituteType: "" as InstituteType | "",

  legalName: "",
  shortName: "",
  registrationNumber: "",
  regulatoryAuthority: "",
  website: "",

  country: "India",
  state: "",
  city: "",
  pinCode: "",

  registeredAddress: "",
  corporateAddress: "",
  sameAsRegistered: false,

  contactEmail: "",
  contactPhone: "",

  designation: "",
  status: "Active" as TenantStatus,
};

/* -------------------------------------------------------------------------- */
/* Validation Types                                                           */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function getFormErrors(
  form: typeof emptyForm,
): FormErrors {
  const errors: FormErrors = {};

  /* Institute Name */
  if (!form.instituteName.trim()) {
    errors.instituteName =
      "Institute name is required";
  } else if (
    form.instituteName.trim().length < 2
  ) {
    errors.instituteName =
      "Enter a valid institute name";
  }

  /* Institute Type */
  if (!form.instituteType) {
    errors.instituteType =
      "Institute type is required";
  }

  /* Legal Name */
  if (!form.legalName.trim()) {
    errors.legalName =
      "Legal name is required";
  } else if (
    form.legalName.trim().length < 2
  ) {
    errors.legalName =
      "Enter a valid legal name";
  }

  /* Short Name */
  // if (
  //   form.shortName.length > 0 &&
  //   !form.shortName.trim()
  // ) {
  //   errors.shortName =
  //     "Short name cannot contain only spaces";
  // }

  /* Registration Number */
  if (!form.registrationNumber.trim()) {
    errors.registrationNumber =
      "Registration number is required";
  } else {
    const registrationPattern =
      /^[A-Za-z0-9][A-Za-z0-9 /-]{2,29}$/;

    if (
      !registrationPattern.test(
        form.registrationNumber.trim(),
      )
    ) {
      errors.registrationNumber =
        "Enter a valid registration number";
    }
  }

  /* Regulatory Authority */
  if (
    form.regulatoryAuthority.length > 0 &&
    !form.regulatoryAuthority.trim()
  ) {
    errors.regulatoryAuthority =
      "Regulatory authority cannot contain only spaces";
  }

  /* Website */
  if (
    form.website.trim() &&
    !/^https?:\/\/.+\..+/.test(
      form.website.trim(),
    )
  ) {
    errors.website =
      "Enter a valid URL starting with http:// or https://";
  }

  /* Country */
  if (!form.country.trim()) {
    errors.country = "Country is required";
  }

  /* State */
  if (!form.state.trim()) {
    errors.state = "State is required";
  }

  /* City */
  if (!form.city.trim()) {
    errors.city = "City is required";
  }

  /* PIN */
  if (!form.pinCode.trim()) {
    errors.pinCode =
      "PIN code is required";
  } else if (
    !/^\d{6}$/.test(
      form.pinCode.trim(),
    )
  ) {
    errors.pinCode =
      "Enter a valid 6-digit PIN code";
  }

  /* Registered Address */
  if (!form.registeredAddress.trim()) {
    errors.registeredAddress =
      "Registered address is required";
  }

  /* Corporate Address */
  if (
    !form.sameAsRegistered &&
    !form.corporateAddress.trim()
  ) {
    errors.corporateAddress =
      "Corporate office address is required";
  }

  /* Contact Email */
  if (!form.contactEmail.trim()) {
    errors.contactEmail =
      "Contact email is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.contactEmail.trim(),
    )
  ) {
    errors.contactEmail =
      "Enter a valid email address";
  }

  /* Contact Phone */
  if (!form.contactPhone.trim()) {
    errors.contactPhone =
      "Contact phone is required";
  } else if (
    !/^[6-9]\d{9}$/.test(
      form.contactPhone.trim(),
    )
  ) {
    errors.contactPhone =
      "Enter a valid 10-digit mobile number starting with 6-9";
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Branch Validation                                                          */
/* -------------------------------------------------------------------------- */

function getBranchErrors(
  branches: BranchInput[],
): BranchErrors[] {
  return branches.map((branch) => {
    const errors: BranchErrors = {};

    /* IFSC */
    if (!branch.ifscCode.trim()) {
      errors.ifscCode =
        "IFSC code is required";
    } else if (
      !ifscPattern.test(
        branch.ifscCode
          .trim()
          .toUpperCase(),
      )
    ) {
      errors.ifscCode =
        "Enter a valid 11-character IFSC code";
    }

    /* Branch Name */
    if (!branch.branchName.trim()) {
      errors.branchName =
        "Branch name is required";
    }

    /* Branch Code */
    if (
      branch.branchCode.length > 0 &&
      !branch.branchCode.trim()
    ) {
      errors.branchCode =
        "Branch code cannot contain only spaces";
    }

    /* Address */
    if (!branch.address.trim()) {
      errors.address =
        "Branch address is required";
    }

    /* City */
    if (!branch.city.trim()) {
      errors.city =
        "City is required";
    }

    /* State */
    if (!branch.state.trim()) {
      errors.state =
        "State is required";
    }

    /* PIN */
    if (!branch.pinCode.trim()) {
      errors.pinCode =
        "PIN code is required";
    } else if (
      !/^\d{6}$/.test(
        branch.pinCode.trim(),
      )
    ) {
      errors.pinCode =
        "Enter a valid 6-digit PIN code";
    }

    return errors;
  });
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function TenantFormDrawer({
  open,
  onOpenChange,
  tenant,
  onSubmit,
}: Props) {
  const [form, setForm] =
    useState(emptyForm);

  const [branches, setBranches] =
    useState<BranchInput[]>([
      { ...emptyBranch },
    ]);

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [busy, setBusy] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [touched, setTouched] =
    useState<
      Partial<
        Record<
          keyof typeof emptyForm,
          boolean
        >
      >
    >({});

  const [touchedBranches, setTouchedBranches] =
    useState<
      Record<
        number,
        Partial<
          Record<
            keyof BranchInput,
            boolean
          >
        >
      >
    >({});

  /* ------------------------------------------------------------------------ */
  /* Load Existing Tenant                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) return;

    setSubmitted(false);
    setTouched({});
    setTouchedBranches({});
    setBusy(false);

    if (!tenant) {
      setForm({
        ...emptyForm,
      });

      setBranches([
        { ...emptyBranch },
      ]);

      setLogoFile(null);
      setLogoPreview(null);

      return;
    }

    /*
     * Tenant currently contains only the fields
     * defined in admin-store.ts.
     *
     * Therefore we safely map the existing fields
     * into this form.
     */

    setForm({
      instituteName:
        tenant.instituteName ||
        tenant.organization ||
        "",

      instituteType:
        tenant.instituteType || "",

      legalName:
        "",

      shortName:
        "",

      registrationNumber:
        tenant.registrationNumber ||
        tenant.employeeId ||
        "",

      regulatoryAuthority:
        "",

      website:
        "",

      country:
        "India",

      state:
        "",

      city:
        "",

      pinCode:
        "",

      registeredAddress:
        "",

      corporateAddress:
        "",

      sameAsRegistered:
        false,

      contactEmail:
        tenant.contactEmail ||
        tenant.email ||
        "",

      contactPhone:
        tenant.contactPhone ||
        tenant.mobile ||
        "",

      designation:
        tenant.designation ||
        "Relationship Manager",

      status:
        tenant.status ||
        "Active",
    });

    /*
     * Existing store stores branches as:
     *
     * { id, location }[]
     *
     * Convert them into the form structure.
     */

    if (
      tenant.branches &&
      tenant.branches.length > 0
    ) {
      setBranches(
        tenant.branches.map(
          (branch) => ({
            ...emptyBranch,
            branchName:
              branch.location || "",
          }),
        ),
      );
    } else {
      setBranches([
        { ...emptyBranch },
      ]);
    }

    setLogoFile(null);
    setLogoPreview(null);
  }, [open, tenant]);

  /* ------------------------------------------------------------------------ */
  /* Logo Cleanup                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      if (
        logoPreview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          logoPreview,
        );
      }
    };
  }, [logoPreview]);

  /* ------------------------------------------------------------------------ */
  /* Form Setter                                                              */
  /* ------------------------------------------------------------------------ */

  const set = <
    K extends keyof typeof emptyForm,
  >(
    key: K,
    value: (typeof emptyForm)[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Branch Setter                                                            */
  /* ------------------------------------------------------------------------ */

  const setBranchField = (
    index: number,
    key: keyof BranchInput,
    value: string,
  ) => {
    setBranches((previous) =>
      previous.map(
        (branch, branchIndex) => {
          if (branchIndex !== index) {
            return branch;
          }

          return {
            ...branch,
            [key]:
              key === "ifscCode"
                ? value.toUpperCase()
                : value,
          };
        },
      ),
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Logo Upload                                                              */
  /* ------------------------------------------------------------------------ */

  const handleLogoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    if (
      logoPreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        logoPreview,
      );
    }

    setLogoFile(file);

    setLogoPreview(
      URL.createObjectURL(file),
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Remove Logo                                                              */
  /* ------------------------------------------------------------------------ */

  const removeLogo = () => {
    if (
      logoPreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        logoPreview,
      );
    }

    setLogoFile(null);
    setLogoPreview(null);
  };

  /* ------------------------------------------------------------------------ */
  /* Same Address                                                             */
  /* ------------------------------------------------------------------------ */

  const toggleSameAsRegistered = (
    checked: boolean,
  ) => {
    set(
      "sameAsRegistered",
      checked,
    );

    if (checked) {
      set(
        "corporateAddress",
        form.registeredAddress,
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Mark Form Touched                                                        */
  /* ------------------------------------------------------------------------ */

  const markTouched = (
    key: keyof typeof emptyForm,
  ) => {
    setTouched((previous) => ({
      ...previous,
      [key]: true,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Mark Branch Touched                                                      */
  /* ------------------------------------------------------------------------ */

  const markBranchTouched = (
    index: number,
    key: keyof BranchInput,
  ) => {
    setTouchedBranches(
      (previous) => ({
        ...previous,
        [index]: {
          ...(previous[index] || {}),
          [key]: true,
        },
      }),
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Remove Branch                                                            */
  /* ------------------------------------------------------------------------ */

  const removeBranch = (
    index: number,
  ) => {
    if (branches.length === 1) {
      return;
    }

    setBranches(
      (previous) =>
        previous.filter(
          (_, branchIndex) =>
            branchIndex !== index,
        ),
    );

    setTouchedBranches(
      (previous) => {
        const next: Record<
          number,
          Partial<
            Record<
              keyof BranchInput,
              boolean
            >
          >
        > = {};

        Object.keys(previous)
          .map(Number)
          .filter(
            (branchIndex) =>
              branchIndex !== index,
          )
          .forEach((branchIndex) => {
            const value =
              previous[branchIndex];

            if (value) {
              const newIndex =
                branchIndex > index
                  ? branchIndex - 1
                  : branchIndex;

              next[newIndex] = value;
            }
          });

        return next;
      },
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Validation                                                               */
  /* ------------------------------------------------------------------------ */

  const formErrors =
    getFormErrors(form);

  const branchErrors =
    getBranchErrors(branches);

  const isFormValid =
    Object.keys(formErrors)
      .length === 0 &&
    branches.length > 0 &&
    branchErrors.every(
      (errors) =>
        Object.keys(errors).length === 0,
    );

  /* ------------------------------------------------------------------------ */
  /* Get Form Error                                                           */
  /* ------------------------------------------------------------------------ */

  const getFieldError = (
    key: keyof FormErrors,
  ) => {
    if (
      submitted ||
      touched[
        key as keyof typeof emptyForm
      ]
    ) {
      return formErrors[key];
    }

    return undefined;
  };

  /* ------------------------------------------------------------------------ */
  /* Get Branch Error                                                          */
  /* ------------------------------------------------------------------------ */

  const getBranchError = (
    index: number,
    key: keyof BranchErrors,
  ) => {
    if (
      submitted ||
      touchedBranches[index]?.[
        key as keyof BranchInput
      ]
    ) {
      return branchErrors[index]?.[key];
    }

    return undefined;
  };

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  const submit = () => {
    setSubmitted(true);

    if (!isFormValid) {
      return;
    }

    setBusy(true);

    /*
     * IMPORTANT:
     *
     * BankInput in your actual admin-store.ts
     * accepts branches: string[].
     *
     * Therefore we convert each branch into
     * a string instead of sending an object.
     */

    const branchLocations =
      branches.map((branch) => {
        const name =
          branch.branchName.trim();

        const city =
          branch.city.trim();

        if (city) {
          return `${name} — ${city}`;
        }

        return name;
      });

    const payload: BankInput = {
      instituteName:
        form.instituteName.trim(),

      instituteType:
        form.instituteType,

      registrationNumber:
        form.registrationNumber.trim(),

      contactEmail:
        form.contactEmail.trim(),

      contactPhone:
        form.contactPhone.trim(),

      branches:
        branchLocations,

      legalName:
        form.legalName.trim(),

      shortName:
        form.shortName.trim(),

      regulatoryAuthority:
        form.regulatoryAuthority.trim(),

      website:
        form.website.trim(),

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

      designation:
        form.designation,

      status:
        form.status,
    };

    try {
      onSubmit(payload);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l bg-background p-0 sm:max-w-3xl"
      >
        {/* ================================================================== */}
        {/* Header                                                             */}
        {/* ================================================================== */}

        <SheetHeader className="shrink-0 border-b bg-background px-6 py-5">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {tenant
              ? "Edit Bank"
              : "Create Bank"}
          </SheetTitle>

          <SheetDescription className="text-sm text-muted-foreground">
            {tenant
              ? "Update the institute and branch information."
              : "Add a new bank or NBFC to the platform."}
          </SheetDescription>
        </SheetHeader>

        {/* ================================================================== */}
        {/* Scrollable Content                                                 */}
        {/* ================================================================== */}

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 px-6 py-6">

            {/* ================================================================ */}
            {/* Institute Details                                                */}
            {/* ================================================================ */}

            <section className="space-y-5">
              <SectionHeading>
                Institute Details
              </SectionHeading>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="Institute Name"
                  required
                  error={getFieldError(
                    "instituteName",
                  )}
                >
                  <Input
                    value={
                      form.instituteName
                    }
                    onChange={(event) =>
                      set(
                        "instituteName",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "instituteName",
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Institute Type"
                  required
                  error={getFieldError(
                    "instituteType",
                  )}
                >
                  <select
                    value={
                      form.instituteType
                    }
                    onChange={(event) =>
                      set(
                        "instituteType",
                        event.target
                          .value as
                          | InstituteType
                          | "",
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "instituteType",
                      )
                    }
                    className={selectClass}
                  >
                    <option value="">
                      Select institute type
                    </option>

                    <option value="NBFC">
                      NBFC
                    </option>

                    <option value="Cooperative Bank">
                      Cooperative Bank
                    </option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="Legal Name"
                  required
                  error={getFieldError(
                    "legalName",
                  )}
                >
                  <Input
                    value={
                      form.legalName
                    }
                    onChange={(event) =>
                      set(
                        "legalName",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "legalName",
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                {/* <Field
                  label="Short Name"
                  error={getFieldError(
                    "shortName",
                  )}
                >
                  <Input
                    value={
                      form.shortName
                    }
                    onChange={(event) =>
                      set(
                        "shortName",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "shortName",
                      )
                    }
                    className={inputClass}
                  />
                </Field> */}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="Registration Number"
                  required
                  error={getFieldError(
                    "registrationNumber",
                  )}
                >
                  <Input
                    value={
                      form.registrationNumber
                    }
                    onChange={(event) =>
                      set(
                        "registrationNumber",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "registrationNumber",
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Regulatory Authority"
                  error={getFieldError(
                    "regulatoryAuthority",
                  )}
                >
                  <Input
                    value={
                      form.regulatoryAuthority
                    }
                    onChange={(event) =>
                      set(
                        "regulatoryAuthority",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "regulatoryAuthority",
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Website"
                error={getFieldError(
                  "website",
                )}
              >
                <Input
                  type="url"
                  value={
                    form.website
                  }
                  onChange={(event) =>
                    set(
                      "website",
                      event.target.value,
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "website",
                    )
                  }
                  className={inputClass}
                />
              </Field>

              {/* Logo */}

              <Field label="Institute Logo">
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">

                  {logoPreview ? (
                    <div className="relative shrink-0">
                      <img
                        src={
                          logoPreview
                        }
                        alt="Institute logo preview"
                        className="size-16 rounded-xl border border-border bg-background object-cover"
                      />

                      <button
                        type="button"
                        onClick={
                          removeLogo
                        }
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                        aria-label="Remove logo"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex size-16 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-background text-muted-foreground transition hover:border-accent hover:text-accent">
                      <Upload className="size-5" />

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={
                          handleLogoChange
                        }
                      />
                    </label>
                  )}

                  <div>
                    <p className="text-sm font-medium">
                      Upload institute logo
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG or JPG, maximum
                      2MB.
                    </p>
                  </div>
                </div>
              </Field>
            </section>

            {/* ================================================================ */}
            {/* Registered Office                                                 */}
            {/* ================================================================ */}

            <section className="space-y-5">
              <SectionHeading>
                Registered & Location Details
              </SectionHeading>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="Country"
                  required
                  error={getFieldError(
                    "country",
                  )}
                >
                  <Input
                    value={
                      form.country
                    }
                    onChange={(event) =>
                      set(
                        "country",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "country",
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="State"
                  required
                  error={getFieldError(
                    "state",
                  )}
                >
                  <Input
                    value={
                      form.state
                    }
                    onChange={(event) =>
                      set(
                        "state",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "state",
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="City"
                  required
                  error={getFieldError(
                    "city",
                  )}
                >
                  <Input
                    value={
                      form.city
                    }
                    onChange={(event) =>
                      set(
                        "city",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "city",
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="PIN Code"
                  required
                  error={getFieldError(
                    "pinCode",
                  )}
                >
                  <Input
                    value={
                      form.pinCode
                    }
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(event) =>
                      set(
                        "pinCode",
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "pinCode",
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Registered Address"
                required
                error={getFieldError(
                  "registeredAddress",
                )}
              >
                <Textarea
                  value={
                    form.registeredAddress
                  }
                  rows={3}
                  onChange={(event) => {
                    set(
                      "registeredAddress",
                      event.target.value,
                    );

                    if (
                      form.sameAsRegistered
                    ) {
                      set(
                        "corporateAddress",
                        event.target.value,
                      );
                    }
                  }}
                  onBlur={() =>
                    markTouched(
                      "registeredAddress",
                    )
                  }
                  className={textareaClass}
                />
              </Field>

              {/* Corporate Address */}

              <div className="space-y-3">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <Label className="text-sm font-medium">
                    Corporate Office Address
                    <span className="ml-1 text-destructive">
                      *
                    </span>
                  </Label>

                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
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
                  rows={3}
                  disabled={
                    form.sameAsRegistered
                  }
                  onChange={(event) =>
                    set(
                      "corporateAddress",
                      event.target.value,
                    )
                  }
                  onBlur={() =>
                    markTouched(
                      "corporateAddress",
                    )
                  }
                  className={`${textareaClass} ${
                    form.sameAsRegistered
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                />

                {getFieldError(
                  "corporateAddress",
                ) && (
                  <p className="text-xs font-medium text-destructive">
                    {
                      getFieldError(
                        "corporateAddress",
                      )
                    }
                  </p>
                )}
              </div>
            </section>

            {/* ================================================================ */}
            {/* Contact Details                                                   */}
            {/* ================================================================ */}

            <section className="space-y-5">
              <SectionHeading>
                Contact Details
              </SectionHeading>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field
                  label="Contact Email"
                  required
                  error={getFieldError(
                    "contactEmail",
                  )}
                >
                  <Input
                    type="email"
                    value={
                      form.contactEmail
                    }
                    onChange={(event) =>
                      set(
                        "contactEmail",
                        event.target.value,
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "contactEmail",
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Contact Phone"
                  required
                  error={getFieldError(
                    "contactPhone",
                  )}
                >
                  <Input
                    type="tel"
                    value={
                      form.contactPhone
                    }
                    maxLength={10}
                    inputMode="numeric"
                    onChange={(event) =>
                      set(
                        "contactPhone",
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    onBlur={() =>
                      markTouched(
                        "contactPhone",
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <Field label="Designation">
                  <Input
                    value={
                      form.designation
                    }
                    onChange={(event) =>
                      set(
                        "designation",
                        event.target.value,
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      set(
                        "status",
                        event.target
                          .value as TenantStatus,
                      )
                    }
                    className={selectClass}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </Field>
              </div>
            </section>

            {/* ================================================================ */}
            {/* Branches                                                         */}
            {/* ================================================================ */}

            <section className="space-y-5">

              <div className="flex items-center justify-between">
                <SectionHeading>
                  Branch Information
                </SectionHeading>

                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {branches.length}{" "}
                  {branches.length === 1
                    ? "Branch"
                    : "Branches"}
                </span>
              </div>

              <div className="space-y-4">

                {branches.map(
                  (branch, index) => (
                    <div
                      key={index}
                      className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm"
                    >

                      {/* Branch Header */}

                      <div className="flex items-center justify-between border-b border-border pb-3">

                        <div>
                          <p className="text-sm font-semibold">
                            Branch{" "}
                            {index + 1}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Branch identification
                            and location details
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          disabled={
                            branches.length ===
                            1
                          }
                          onClick={() =>
                            removeBranch(
                              index,
                            )
                          }
                          aria-label="Remove branch"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {/* Branch Identification */}

                      <div className="grid gap-5 sm:grid-cols-3">

                        <Field
                          label="IFSC Code"
                          required
                          error={getBranchError(
                            index,
                            "ifscCode",
                          )}
                        >
                          <Input
                            value={
                              branch.ifscCode
                            }
                            maxLength={11}
                            onChange={(
                              event,
                            ) =>
                              setBranchField(
                                index,
                                "ifscCode",
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={() =>
                              markBranchTouched(
                                index,
                                "ifscCode",
                              )
                            }
                            className={`${inputClass} uppercase`}
                          />
                        </Field>

                        <Field
                          label="Branch Name"
                          required
                          error={getBranchError(
                            index,
                            "branchName",
                          )}
                        >
                          <Input
                            value={
                              branch.branchName
                            }
                            onChange={(
                              event,
                            ) =>
                              setBranchField(
                                index,
                                "branchName",
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={() =>
                              markBranchTouched(
                                index,
                                "branchName",
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field
                          label="Branch Code"
                          error={getBranchError(
                            index,
                            "branchCode",
                          )}
                        >
                          <Input
                            value={
                              branch.branchCode
                            }
                            onChange={(
                              event,
                            ) =>
                              setBranchField(
                                index,
                                "branchCode",
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={() =>
                              markBranchTouched(
                                index,
                                "branchCode",
                              )
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      {/* Branch Address */}

                      <Field
                        label="Branch Address"
                        required
                        error={getBranchError(
                          index,
                          "address",
                        )}
                      >
                        <Textarea
                          value={
                            branch.address
                          }
                          rows={3}
                          onChange={(
                            event,
                          ) =>
                            setBranchField(
                              index,
                              "address",
                              event.target
                                .value,
                            )
                          }
                          onBlur={() =>
                            markBranchTouched(
                              index,
                              "address",
                            )
                          }
                          className={
                            textareaClass
                          }
                        />
                      </Field>

                      {/* Branch Location */}

                      <div className="grid gap-5 sm:grid-cols-3">

                        <Field
                          label="City"
                          required
                          error={getBranchError(
                            index,
                            "city",
                          )}
                        >
                          <Input
                            value={
                              branch.city
                            }
                            onChange={(
                              event,
                            ) =>
                              setBranchField(
                                index,
                                "city",
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={() =>
                              markBranchTouched(
                                index,
                                "city",
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field
                          label="State"
                          required
                          error={getBranchError(
                            index,
                            "state",
                          )}
                        >
                          <Input
                            value={
                              branch.state
                            }
                            onChange={(
                              event,
                            ) =>
                              setBranchField(
                                index,
                                "state",
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={() =>
                              markBranchTouched(
                                index,
                                "state",
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field
                          label="PIN Code"
                          required
                          error={getBranchError(
                            index,
                            "pinCode",
                          )}
                        >
                          <Input
                            value={
                              branch.pinCode
                            }
                            maxLength={6}
                            inputMode="numeric"
                            onChange={(
                              event,
                            ) =>
                              setBranchField(
                                index,
                                "pinCode",
                                event.target.value.replace(
                                  /\D/g,
                                  "",
                                ),
                              )
                            }
                            onBlur={() =>
                              markBranchTouched(
                                index,
                                "pinCode",
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Add Branch */}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  setBranches(
                    (previous) => [
                      ...previous,
                      {
                        ...emptyBranch,
                      },
                    ],
                  )
                }
              >
                <Plus className="size-4" />
                Add another branch
              </Button>
            </section>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Footer                                                             */}
        {/* ================================================================== */}

        <div className="flex shrink-0 justify-end gap-3 border-t bg-background px-6 py-4">

          <Button
            type="button"
            variant="outline"
            className="min-w-24"
            disabled={busy}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="min-w-32 gap-2"
            disabled={busy}
            onClick={submit}
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

/* -------------------------------------------------------------------------- */
/* Styling                                                                    */
/* -------------------------------------------------------------------------- */

const inputClass =
  "h-10 rounded-lg border-input bg-background text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20";

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20";

const textareaClass =
  "min-h-20 resize-none rounded-lg border-input bg-background text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20";

/* -------------------------------------------------------------------------- */
/* Section Heading                                                            */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {children}
      </h3>

      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

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
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </Label>

      {children}

      {error && (
        <p className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
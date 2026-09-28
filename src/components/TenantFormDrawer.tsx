import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  type InstituteType,
  type Tenant,
  type BankInput,
  type TenantStatus,
} from "@/lib/admin-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postAdminJson } from "@/lib/admin-api";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  regulatoryAuthorityId: "",
  regulatoryStatus: "ACTIVE" as "ACTIVE" | "INACTIVE",
  PAN: "",
  CIN: "",
  website: "",
  logo: "",
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
/* API Payload                                                                */
/* -------------------------------------------------------------------------- */

type BankOnboardPayload = {
  institution_name: string;
  legal_name: string;
  institution_type:

    | "NBFC"
    | "BANK";
  registration_number: string;
  PAN: string;
  CIN: string;
  website: string;
  logo: string;
  regulatory_authority_id: string;
  regulatory_status: "ACTIVE" | "INACTIVE";
  country: string;
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
  regulatoryAuthorityId?: string;
  regulatoryStatus?: string;
  PAN?: string;
  CIN?: string;
  logo?: string;
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
/* Validation Helpers                                                         */
/* -------------------------------------------------------------------------- */

const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function getFormErrors(
  form: typeof emptyForm,
  creating: boolean,
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

  /* Website */

  if (
    form.website.trim() &&
    !isHttpUrl(form.website.trim())
  ) {
    errors.website =
      "Enter a valid URL starting with http:// or https://";
  }

  /* Country */

  if (!form.country.trim()) {
    errors.country =
      "Country is required";
  }

  /*
   * CREATE BANK VALIDATION
   */

  if (creating) {
    /* PAN */

    if (
      form.PAN.trim() &&
      !/^[A-Z]{5}\d{4}[A-Z]$/.test(
        form.PAN.trim().toUpperCase(),
      )
    ) {
      errors.PAN =
        "Enter a valid 10-character Indian PAN";
    }

    /* CIN */

    if (
      form.CIN.trim() &&
      !/^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(
        form.CIN.trim().toUpperCase(),
      )
    ) {
      errors.CIN =
        "Enter a valid 21-character CIN";
    }

    /* Regulatory Authority ID */

    if (!form.regulatoryAuthorityId.trim()) {
      errors.regulatoryAuthorityId =
        "Regulatory authority ID is required";
    } else if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        form.regulatoryAuthorityId.trim(),
      )
    ) {
      errors.regulatoryAuthorityId =
        "Enter a valid UUID";
    }

    /* Regulatory Status */

    if (!form.regulatoryStatus) {
      errors.regulatoryStatus =
        "Regulatory status is required";
    }

    /* Logo */

    if (
      form.logo.trim() &&
      !isHttpUrl(form.logo.trim())
    ) {
      errors.logo =
        "Enter a valid logo URL starting with http:// or https://";
    }
  } else {
    /* EDIT VALIDATION */

    if (
      form.regulatoryAuthority.length > 0 &&
      !form.regulatoryAuthority.trim()
    ) {
      errors.regulatoryAuthority =
        "Regulatory authority cannot contain only spaces";
    }

    if (!form.state.trim()) {
      errors.state =
        "State is required";
    }

    if (!form.city.trim()) {
      errors.city =
        "City is required";
    }

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

    if (!form.registeredAddress.trim()) {
      errors.registeredAddress =
        "Registered address is required";
    }

    if (
      !form.sameAsRegistered &&
      !form.corporateAddress.trim()
    ) {
      errors.corporateAddress =
        "Corporate office address is required";
    }

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
    if (!open) {
      return;
    }

    setSubmitted(false);
    setTouched({});
    setTouchedBranches({});
    setBusy(false);

    /* CREATE */

    if (!tenant) {
      setForm({
        ...emptyForm,
      });

      setBranches([
        { ...emptyBranch },
      ]);

      return;
    }

    /* EDIT */

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

      regulatoryAuthorityId:
        "",

      regulatoryStatus:
        "ACTIVE",

      PAN:
        "",

      CIN:
        "",

      website:
        "",

      logo:
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
  }, [open, tenant]);

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
  /* Validation                                                               */
  /* ------------------------------------------------------------------------ */

  const formErrors =
    getFormErrors(form, !tenant);

  const branchErrors =
    getBranchErrors(branches);

  const isFormValid =
    Object.keys(formErrors).length === 0 &&
    (!tenant ||
      (
        branches.length > 0 &&
        branchErrors.every(
          (errors) =>
            Object.keys(errors).length === 0,
        )
      ));

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
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  const submit = async () => {
    setSubmitted(true);

    if (!isFormValid) {
      return;
    }

    setBusy(true);

    const branchLocations =
      branches
        .filter(
          (branch) =>
            branch.branchName.trim() ||
            branch.city.trim(),
        )
        .map((branch) => {
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
      /* ================================================================ */
      /* CREATE BANK API                                                  */
      /* ================================================================ */

      if (!tenant) {
        const apiPayload: BankOnboardPayload = {
          institution_name:
            form.instituteName.trim(),

          legal_name:
            form.legalName.trim(),

          institution_type:
            form.instituteType as BankOnboardPayload["institution_type"],

          registration_number:
            form.registrationNumber.trim(),

          PAN:
            form.PAN.trim().toUpperCase(),

          CIN:
            form.CIN.trim().toUpperCase(),

          website:
            form.website.trim(),

          logo:
            form.logo.trim(),

          regulatory_authority_id:
            form.regulatoryAuthorityId.trim(),

          regulatory_status:
            form.regulatoryStatus,

          country:
            form.country.trim(),
        };

        await postAdminJson(
          "https://los-backend-355v.onrender.com/api/v1/administration/banks/onboard",
          apiPayload,
        );
      }

      /* ================================================================ */
      /* Update Frontend Store                                            */
      /* ================================================================ */

      onSubmit(payload);

      toast.success(
        tenant
          ? "Bank updated successfully"
          : "Bank created successfully",
      );

      /* Reset */

      setForm({
        ...emptyForm,
      });

      setBranches([
        { ...emptyBranch },
      ]);

      setSubmitted(false);
      setTouched({});
      setTouchedBranches({});

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save bank",
      );
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
        {/* Header */}

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

        {/* Scrollable Content */}

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 px-6 py-6">

            {/* ============================================================ */}
            {/* Institute Details                                            */}
            {/* ============================================================ */}

            <section className="space-y-5">
              <SectionHeading>
                Institute Details
              </SectionHeading>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Institute Name */}

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

                {/* Institute Type */}

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
                        event.target.value as
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

                    <option value="BANK">
                       Bank
                    </option>
                  </select>
                </Field>
              </div>

              {/* Legal Name */}

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
              </div>

              {/* Registration + PAN */}

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
                  label="PAN"
                  error={getFieldError("PAN")}
                >
                  <Input
                    value={form.PAN}
                    onChange={(event) =>
                      set(
                        "PAN",
                        event.target.value.toUpperCase(),
                      )
                    }
                    onBlur={() =>
                      markTouched("PAN")
                    }
                    maxLength={10}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* CIN + Regulatory Authority ID */}

              {!tenant && (
                <div className="grid gap-5 sm:grid-cols-2">

                  <Field
                    label="CIN"
                    error={getFieldError("CIN")}
                  >
                    <Input
                      value={form.CIN}
                      onChange={(event) =>
                        set(
                          "CIN",
                          event.target.value.toUpperCase(),
                        )
                      }
                      onBlur={() =>
                        markTouched("CIN")
                      }
                      maxLength={21}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Regulatory Authority ID"
                    required
                    error={getFieldError(
                      "regulatoryAuthorityId",
                    )}
                  >
                    <Input
                      value={
                        form.regulatoryAuthorityId
                      }
                      onChange={(event) =>
                        set(
                          "regulatoryAuthorityId",
                          event.target.value,
                        )
                      }
                      onBlur={() =>
                        markTouched(
                          "regulatoryAuthorityId",
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {/* Website */}

              <Field
                label="Website"
                error={getFieldError(
                  "website",
                )}
              >
                <Input
                  type="url"
                  value={form.website}
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

              {/* Logo + Regulatory Status */}

              {!tenant && (
                <div className="grid gap-5 sm:grid-cols-2">

                  <Field
                    label="Logo URL"
                    error={getFieldError(
                      "logo",
                    )}
                  >
                    <Input
                      type="url"
                      value={form.logo}
                      onChange={(event) =>
                        set(
                          "logo",
                          event.target.value,
                        )
                      }
                      onBlur={() =>
                        markTouched("logo")
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Regulatory Status"
                    required
                    error={getFieldError(
                      "regulatoryStatus",
                    )}
                  >
                    <select
                      value={
                        form.regulatoryStatus
                      }
                      onChange={(event) =>
                        set(
                          "regulatoryStatus",
                          event.target.value as
                            | "ACTIVE"
                           
                        )
                      }
                      className={selectClass}
                    >
                      <option value="ACTIVE">
                        Active
                      </option>

                  
                    </select>
                  </Field>
                </div>
              )}
            </section>

            {/* ============================================================ */}
            {/* Location Details                                             */}
            {/* ============================================================ */}

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
                    value={form.country}
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

              
              </div>

              
            </section>
          </div>
        </div>

        {/* Footer */}

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
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
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
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type BankType = "NBFC" | "Cooperative Bank";

type Page = 1 | 2 | 3;

type YesNo = "" | "Yes" | "No";

type RegulatoryDetails = {
  directClgMember: YesNo;
  directMemberIftas: YesNo;

  micr1: string;
  micrNumber: string;
  micr2: string;
  micr3: string;

  ifscCode: string;

  noOfBranches: string;

  sponsorBankClg: string;
  sponsorBankIftas: string;
};

type AddressDetails = {
  addressType: string;
  unitGala: string;
  streetRoad: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant;
  onSubmit: (input: BankInput) => void | Promise<void>;
};

/* -------------------------------------------------------------------------- */
/* EMPTY VALUES                                                               */
/* -------------------------------------------------------------------------- */

const emptyRegulatory: RegulatoryDetails = {
  directClgMember: "",
  directMemberIftas: "",

  micr1: "",
  micrNumber: "",
  micr2: "",
  micr3: "",

  ifscCode: "",

  noOfBranches: "",

  sponsorBankClg: "",
  sponsorBankIftas: "",
};

const emptyAddress: AddressDetails = {
  addressType: "",
  unitGala: "",
  streetRoad: "",
  landmark: "",
  city: "",
  state: "",
  pinCode: "",
};

const emptyForm = {
  bankCode: "",
  bankName: "",
  bankType: "" as BankType | "",
  legalName: "",
  PAN: "",
  GST: "",
  CIN: "",
  licenseNo: "",
  website: "",
  logo: "",
  status: "Active" as TenantStatus,
};

/* -------------------------------------------------------------------------- */
/* ERROR TYPES                                                                */
/* -------------------------------------------------------------------------- */

type FormErrors = {
  bankCode?: string;
  bankName?: string;
  bankType?: string;
  legalName?: string;
  PAN?: string;
  GST?: string;
  CIN?: string;
  licenseNo?: string;
  website?: string;
  logo?: string;
  status?: string;
};

type RegulatoryErrors = Partial<
  Record<keyof RegulatoryDetails, string>
>;

type AddressErrors = Partial<
  Record<keyof AddressDetails, string>
>;

/* -------------------------------------------------------------------------- */
/* API PAYLOAD                                                                */
/* -------------------------------------------------------------------------- */

type BankOnboardPayload = {
  bankName: string;
  bankType: "BANK" | "NBFC";

  bankCode: string;
  legalName: string;

  pan: string;
  gstNo: string;
  cin: string;
  licenseNo: string;

  website: string;
  logoUrl: string;

  status: "ACTIVE" | "INACTIVE";
  regulatoryStatus: "ACTIVE" | "INACTIVE";

  directClgMember: boolean;
  directMemberIftas: boolean;

  micr1: string;
  micrNumber: string;
  micr2: string;
  micr3: string;

  ifscCode: string;
  noOfBranches: string;

  sponsorBankClg: string;
  sponsorBankIftas: string;

  addressType: string;
  unitGala: string;
  streetRoad: string;
  landmark: string;

  city: string;
  state: string;
  pinCode: string;

  country: string;
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function yesNoToBoolean(value: YesNo): boolean {
  return value === "Yes";
}

function isHttpUrl(value: string): boolean {
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

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const cinPattern =
  /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

const panPattern =
  /^[A-Z]{5}\d{4}[A-Z]$/;

const gstPattern =
  /^[0-9A-Z]{15}$/;

function getPage1Errors(
  form: typeof emptyForm,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.bankCode.trim()) {
    errors.bankCode = "Bank code is required";
  }

  if (!form.bankName.trim()) {
    errors.bankName = "Bank name is required";
  } else if (
    form.bankName.trim().length < 2
  ) {
    errors.bankName = "Enter a valid bank name";
  }

  if (!form.bankType) {
    errors.bankType = "Bank type is required";
  }

  if (!form.legalName.trim()) {
    errors.legalName = "Legal name is required";
  }

  if (
    form.PAN.trim() &&
    !panPattern.test(
      form.PAN.trim().toUpperCase(),
    )
  ) {
    errors.PAN =
      "Enter a valid 10-character Indian PAN";
  }

  if (
    form.GST.trim() &&
    !gstPattern.test(
      form.GST.trim().toUpperCase(),
    )
  ) {
    errors.GST =
      "Enter a valid 15-character GST number";
  }

  if (!form.CIN.trim()) {
    errors.CIN = "CIN number is required";
  } else if (
    !cinPattern.test(
      form.CIN.trim().toUpperCase(),
    )
  ) {
    errors.CIN =
      "Enter a valid 21-character CIN number";
  }

  if (!form.licenseNo.trim()) {
    errors.licenseNo =
      "License number is required";
  }

  if (
    form.website.trim() &&
    !isHttpUrl(form.website.trim())
  ) {
    errors.website =
      "Enter a valid URL starting with http:// or https://";
  }

  if (
    form.logo.trim() &&
    !isHttpUrl(form.logo.trim())
  ) {
    errors.logo =
      "Enter a valid logo URL starting with http:// or https://";
  }

  if (!form.status) {
    errors.status = "Status is required";
  }

  return errors;
}

function getPage2Errors(
  regulatory: RegulatoryDetails,
): RegulatoryErrors {
  const errors: RegulatoryErrors = {};

  if (!regulatory.directClgMember) {
    errors.directClgMember =
      "Please select an option";
  }

  if (!regulatory.directMemberIftas) {
    errors.directMemberIftas =
      "Please select an option";
  }

  if (!regulatory.micr1.trim()) {
    errors.micr1 =
      "MICR detail is required";
  }

  if (!regulatory.micrNumber.trim()) {
    errors.micrNumber =
      "MICR number is required";
  }

  if (!regulatory.micr2.trim()) {
    errors.micr2 =
      "MICR city code is required";
  }

  if (!regulatory.micr3.trim()) {
    errors.micr3 =
      "MICR branch code is required";
  }

  if (!regulatory.ifscCode.trim()) {
    errors.ifscCode =
      "IFSC code is required";
  } else if (
    !ifscPattern.test(
      regulatory.ifscCode
        .trim()
        .toUpperCase(),
    )
  ) {
    errors.ifscCode =
      "Enter a valid 11-character IFSC code";
  }

  if (!regulatory.noOfBranches.trim()) {
    errors.noOfBranches =
      "Number of branches is required";
  } else if (
    !/^\d+$/.test(
      regulatory.noOfBranches.trim(),
    )
  ) {
    errors.noOfBranches =
      "Enter a valid number";
  }

  if (!regulatory.sponsorBankClg.trim()) {
    errors.sponsorBankClg =
      "Sponsor bank for CLG is required";
  }

  if (!regulatory.sponsorBankIftas.trim()) {
    errors.sponsorBankIftas =
      "Sponsor bank for IFTAS is required";
  }

  return errors;
}

function getPage3Errors(
  address: AddressDetails,
): AddressErrors {
  const errors: AddressErrors = {};

  if (!address.addressType.trim()) {
    errors.addressType =
      "Address type is required";
  }

  if (!address.unitGala.trim()) {
    errors.unitGala =
      "Unit / Gala Name & No. is required";
  }

  if (!address.streetRoad.trim()) {
    errors.streetRoad =
      "Street / Road is required";
  }

  if (!address.landmark.trim()) {
    errors.landmark =
      "Land mark is required";
  }

  if (!address.city.trim()) {
    errors.city = "City is required";
  }

  if (!address.state.trim()) {
    errors.state = "State is required";
  }

  if (!address.pinCode.trim()) {
    errors.pinCode =
      "PIN code is required";
  } else if (
    !/^\d{6}$/.test(
      address.pinCode.trim(),
    )
  ) {
    errors.pinCode =
      "Enter a valid 6-digit PIN code";
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export function TenantFormDrawer({
  open,
  onOpenChange,
  tenant,
  onSubmit,
}: Props) {
  const [form, setForm] =
    useState({ ...emptyForm });

  const [regulatory, setRegulatory] =
    useState<RegulatoryDetails>({
      ...emptyRegulatory,
    });

  const [address, setAddress] =
    useState<AddressDetails>({
      ...emptyAddress,
    });

  const [page, setPage] =
    useState<Page>(1);

  const [busy, setBusy] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const submittingRef =
    useRef(false);

  /* ------------------------------------------------------------------------ */
  /* LOAD FORM                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) {
      return;
    }

    setPage(1);
    setSubmitted(false);
    setBusy(false);
    submittingRef.current = false;

    if (!tenant) {
      setForm({ ...emptyForm });
      setRegulatory({
        ...emptyRegulatory,
      });
      setAddress({
        ...emptyAddress,
      });

      return;
    }

    const existingBankType: BankType =
      tenant.bankType === "NBFC"
        ? "NBFC"
        : "Cooperative Bank";

    setForm({
      bankCode:
        tenant.bankCode ?? "",

      bankName:
        tenant.bankName ||
        tenant.instituteName ||
        tenant.organization ||
        "",

      bankType:
        existingBankType,

      legalName:
        tenant.legalName ?? "",

      PAN:
        tenant.panNo ?? "",

      GST:
        tenant.gstNo ?? "",

      CIN:
        tenant.cin ?? "",

      licenseNo:
        tenant.licenseNo ||
        tenant.registrationNumber ||
        tenant.employeeId ||
        "",

      website:
        tenant.website ?? "",

      logo:
        tenant.logoUrl ?? "",

      status:
        tenant.status || "Active",
    });

    setRegulatory({
      directClgMember:
        tenant.regulatoryDetails
          ?.directClgMember === "Yes"
          ? "Yes"
          : tenant.regulatoryDetails
              ?.directClgMember === "No"
            ? "No"
            : "",

      directMemberIftas:
        tenant.regulatoryDetails
          ?.directMemberIftas === "Yes"
          ? "Yes"
          : tenant.regulatoryDetails
              ?.directMemberIftas === "No"
            ? "No"
            : "",

      micr1:
        tenant.regulatoryDetails
          ?.micrCode ?? "",

      micrNumber:
        tenant.regulatoryDetails
          ?.micrNumber ?? "",

      micr2:
        tenant.regulatoryDetails
          ?.micrCityCode ?? "",

      micr3:
        tenant.regulatoryDetails
          ?.micrBranchCode ?? "",

      ifscCode:
        tenant.regulatoryDetails
          ?.ifscCode ?? "",

      noOfBranches:
        tenant.regulatoryDetails
          ?.numberOfBranches ?? "",

      sponsorBankClg:
        tenant.regulatoryDetails
          ?.sponsorBankForClg ?? "",

      sponsorBankIftas:
        tenant.regulatoryDetails
          ?.sponsorBankForIftas ?? "",
    });

    setAddress({
      addressType:
        tenant.addressDetails
          ?.addressType ?? "",

      unitGala:
        tenant.addressDetails
          ?.unitGalaNameNo ?? "",

      streetRoad:
        tenant.addressDetails
          ?.streetRoad ?? "",

      landmark:
        tenant.addressDetails
          ?.landMark ?? "",

      city:
        tenant.addressDetails?.city ?? "",

      state:
        tenant.addressDetails?.state ?? "",

      pinCode:
        tenant.addressDetails?.pinCode ?? "",
    });
  }, [open, tenant]);

  /* ------------------------------------------------------------------------ */
  /* FIELD HELPERS                                                            */
  /* ------------------------------------------------------------------------ */

  const setFormField = <
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

  const setRegulatoryField = <
    K extends keyof RegulatoryDetails,
  >(
    key: K,
    value: RegulatoryDetails[K],
  ) => {
    setRegulatory((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const setAddressField = <
    K extends keyof AddressDetails,
  >(
    key: K,
    value: AddressDetails[K],
  ) => {
    setAddress((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* ERRORS                                                                   */
  /* ------------------------------------------------------------------------ */

  const page1Errors =
    getPage1Errors(form);

  const page2Errors =
    getPage2Errors(regulatory);

  const page3Errors =
    getPage3Errors(address);

  const getError = (
    errors: Record<
      string,
      string | undefined
    >,
    key: string,
  ): string | undefined =>
    submitted
      ? errors[key]
      : undefined;

  /* ------------------------------------------------------------------------ */
  /* NEXT                                                                      */
  /* ------------------------------------------------------------------------ */

  const goNext = () => {
    setSubmitted(true);

    if (page === 1) {
      if (
        Object.keys(page1Errors).length > 0
      ) {
        return;
      }

      setSubmitted(false);
      setPage(2);
      return;
    }

    if (page === 2) {
      if (
        Object.keys(page2Errors).length > 0
      ) {
        return;
      }

      setSubmitted(false);
      setPage(3);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* PREVIOUS                                                                  */
  /* ------------------------------------------------------------------------ */

  const goPrevious = () => {
    setSubmitted(false);

    setPage(
      (current): Page =>
        current === 1
          ? 1
          : ((current - 1) as Page),
    );
  };

  /* ------------------------------------------------------------------------ */
  /* SUBMIT                                                                    */
  /* ------------------------------------------------------------------------ */

  const submit = async () => {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitted(true);

    const currentPage1Errors =
      getPage1Errors(form);

    const currentPage2Errors =
      getPage2Errors(regulatory);

    const currentPage3Errors =
      getPage3Errors(address);

    if (
      Object.keys(currentPage1Errors).length >
      0
    ) {
      setPage(1);
      submittingRef.current = false;
      return;
    }

    if (
      Object.keys(currentPage2Errors).length >
      0
    ) {
      setPage(2);
      submittingRef.current = false;
      return;
    }

    if (
      Object.keys(currentPage3Errors).length >
      0
    ) {
      setPage(3);
      submittingRef.current = false;
      return;
    }

    setBusy(true);

    const bankType: "BANK" | "NBFC" =
      form.bankType === "NBFC"
        ? "NBFC"
        : "BANK";

    const directClgMember =
      yesNoToBoolean(
        regulatory.directClgMember,
      );

    const directMemberIftas =
      yesNoToBoolean(
        regulatory.directMemberIftas,
      );

    const storePayload: BankInput = {
      bankCode:
        form.bankCode.trim(),

      bankName:
        form.bankName.trim(),

      bankType,

      legalName:
        form.legalName.trim(),

      panNo:
        form.PAN
          .trim()
          .toUpperCase(),

      gstNo:
        form.GST
          .trim()
          .toUpperCase(),

      cin:
        form.CIN
          .trim()
          .toUpperCase(),

      licenseNo:
        form.licenseNo.trim(),

      website:
        form.website.trim(),

      logoUrl:
        form.logo.trim(),

      regulatoryDetails: {
        directClgMember:
          regulatory.directClgMember,

        directMemberIftas:
          regulatory.directMemberIftas,

        micrCode:
          regulatory.micr1.trim(),

        micrNumber:
          regulatory.micrNumber.trim(),

        micrCityCode:
          regulatory.micr2.trim(),

        micrBranchCode:
          regulatory.micr3.trim(),

        ifscCode:
          regulatory.ifscCode
            .trim()
            .toUpperCase(),

        numberOfBranches:
          regulatory.noOfBranches.trim(),

        sponsorBankForClg:
          regulatory.sponsorBankClg.trim(),

        sponsorBankForIftas:
          regulatory.sponsorBankIftas.trim(),
      },

      addressDetails: {
        addressType:
          address.addressType.trim(),

        unitGalaNameNo:
          address.unitGala.trim(),

        streetRoad:
          address.streetRoad.trim(),

        landMark:
          address.landmark.trim(),

        city:
          address.city.trim(),

        state:
          address.state.trim(),

        pinCode:
          address.pinCode.trim(),
      },

      contactEmail: "",
      contactPhone: "",
      branches: [],

      instituteName:
        form.bankName.trim(),

      instituteType:
        bankType,

      registrationNumber:
        form.licenseNo.trim(),

      country: "India",

      state:
        address.state.trim(),

      city:
        address.city.trim(),

      pinCode:
        address.pinCode.trim(),

      registeredAddress:
        [
          address.unitGala.trim(),
          address.streetRoad.trim(),
          address.landmark.trim(),
        ]
          .filter(Boolean)
          .join(", "),

      corporateAddress:
        [
          address.unitGala.trim(),
          address.streetRoad.trim(),
          address.landmark.trim(),
        ]
          .filter(Boolean)
          .join(", "),

      designation: "",

      status:
        form.status,
    };

    try {
      /* -------------------------------------------------------------------- */
      /* CREATE BANK                                                          */
      /* -------------------------------------------------------------------- */

      if (!tenant) {
        const apiPayload: BankOnboardPayload = {
          bankName:
            form.bankName.trim(),

          bankType,

          bankCode:
            form.bankCode.trim(),

          legalName:
            form.legalName.trim(),

          pan:
            form.PAN
              .trim()
              .toUpperCase(),

          gstNo:
            form.GST
              .trim()
              .toUpperCase(),

          cin:
            form.CIN
              .trim()
              .toUpperCase(),

          licenseNo:
            form.licenseNo.trim(),

          website:
            form.website.trim(),

          logoUrl:
            form.logo.trim(),

          status:
            form.status === "Active"
              ? "ACTIVE"
              : "INACTIVE",

          regulatoryStatus:
            form.status === "Active"
              ? "ACTIVE"
              : "INACTIVE",

          directClgMember,

          directMemberIftas,

          micr1:
            regulatory.micr1.trim(),

          micrNumber:
            regulatory.micrNumber.trim(),

          micr2:
            regulatory.micr2.trim(),

          micr3:
            regulatory.micr3.trim(),

          ifscCode:
            regulatory.ifscCode
              .trim()
              .toUpperCase(),

          noOfBranches:
            regulatory.noOfBranches.trim(),

          sponsorBankClg:
            regulatory.sponsorBankClg.trim(),

          sponsorBankIftas:
            regulatory.sponsorBankIftas.trim(),

          addressType:
            address.addressType.trim(),

          unitGala:
            address.unitGala.trim(),

          streetRoad:
            address.streetRoad.trim(),

          landmark:
            address.landmark.trim(),

          city:
            address.city.trim(),

          state:
            address.state.trim(),

          pinCode:
            address.pinCode.trim(),

          country: "India",
        };

        console.log(
          "CREATE BANK REQUEST:",
          apiPayload,
        );

        await postAdminJson(
          "https://los-backend-355v.onrender.com/api/v1/administration/banks/onboard",
          apiPayload,
        );
      }

      /* -------------------------------------------------------------------- */
      /* FRONTEND STORE                                                       */
      /* -------------------------------------------------------------------- */

      await onSubmit(storePayload);

      toast.success(
        tenant
          ? "Bank updated successfully"
          : "Bank created successfully",
      );

      setForm({
        ...emptyForm,
      });

      setRegulatory({
        ...emptyRegulatory,
      });

      setAddress({
        ...emptyAddress,
      });

      setPage(1);
      setSubmitted(false);

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Bank onboarding failed:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Bank onboarding failed.",
      );
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy || nextOpen) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l bg-background p-0 sm:max-w-3xl"
      >
        <SheetHeader className="shrink-0 border-b bg-background px-6 py-5">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {tenant
              ? "Edit Bank"
              : "Create Bank"}
          </SheetTitle>

          <SheetDescription className="text-sm text-muted-foreground">
            {tenant
              ? "Update bank details."
              : "Add a new bank or NBFC to the platform."}
          </SheetDescription>

          <div className="pt-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <StepIndicator
                number={1}
                label="Bank Details"
                active={page === 1}
                completed={page > 1}
              />

              <div className="h-px flex-1 bg-border" />

              <StepIndicator
                number={2}
                label="Regulatory Details"
                active={page === 2}
                completed={page > 2}
              />

              <div className="h-px flex-1 bg-border" />

              <StepIndicator
                number={3}
                label="Address"
                active={page === 3}
                completed={false}
              />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8 px-6 py-6">
            {/* ================================================================= */}
            {/* PAGE 1 - BANK DETAILS                                             */}
            {/* ================================================================= */}

            {page === 1 && (
              <section className="space-y-5">
                <SectionHeading>
                  Bank Details
                </SectionHeading>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Bank Code"
                    required
                    error={getError(
                      page1Errors,
                      "bankCode",
                    )}
                  >
                    <Input
                      value={form.bankCode}
                      onChange={(event) =>
                        setFormField(
                          "bankCode",
                          event.target.value.toUpperCase(),
                        )
                      }
                      maxLength={30}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Bank Name"
                    required
                    error={getError(
                      page1Errors,
                      "bankName",
                    )}
                  >
                    <Input
                      value={form.bankName}
                      onChange={(event) =>
                        setFormField(
                          "bankName",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Bank Type"
                    required
                    error={getError(
                      page1Errors,
                      "bankType",
                    )}
                  >
                    <select
                      value={form.bankType}
                      onChange={(event) =>
                        setFormField(
                          "bankType",
                          event.target.value as
                            | BankType
                            | "",
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">
                        Select bank type
                      </option>

                      <option value="NBFC">
                        NBFC
                      </option>

                      <option value="Cooperative Bank">
                        Cooperative Bank
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Legal Name"
                    required
                    error={getError(
                      page1Errors,
                      "legalName",
                    )}
                  >
                    <Input
                      value={form.legalName}
                      onChange={(event) =>
                        setFormField(
                          "legalName",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="PAN No."
                    error={getError(
                      page1Errors,
                      "PAN",
                    )}
                  >
                    <Input
                      value={form.PAN}
                      onChange={(event) =>
                        setFormField(
                          "PAN",
                          event.target.value.toUpperCase(),
                        )
                      }
                      maxLength={10}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="GST No."
                    error={getError(
                      page1Errors,
                      "GST",
                    )}
                  >
                    <Input
                      value={form.GST}
                      onChange={(event) =>
                        setFormField(
                          "GST",
                          event.target.value.toUpperCase(),
                        )
                      }
                      maxLength={15}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="CIN No."
                    required
                    error={getError(
                      page1Errors,
                      "CIN",
                    )}
                  >
                    <Input
                      value={form.CIN}
                      onChange={(event) =>
                        setFormField(
                          "CIN",
                          event.target.value.toUpperCase(),
                        )
                      }
                      maxLength={21}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="License No."
                    required
                    error={getError(
                      page1Errors,
                      "licenseNo",
                    )}
                  >
                    <Input
                      value={form.licenseNo}
                      onChange={(event) =>
                        setFormField(
                          "licenseNo",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Website"
                    error={getError(
                      page1Errors,
                      "website",
                    )}
                  >
                    <Input
                      type="url"
                      value={form.website}
                      onChange={(event) =>
                        setFormField(
                          "website",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Logo URL"
                    error={getError(
                      page1Errors,
                      "logo",
                    )}
                  >
                    <Input
                      type="url"
                      value={form.logo}
                      onChange={(event) =>
                        setFormField(
                          "logo",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Status"
                    required
                    error={getError(
                      page1Errors,
                      "status",
                    )}
                  >
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setFormField(
                          "status",
                          event.target.value as TenantStatus,
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
            )}

            {/* ================================================================= */}
            {/* PAGE 2 - REGULATORY DETAILS                                      */}
            {/* ================================================================= */}

            {page === 2 && (
              <section className="space-y-5">
                <SectionHeading>
                  Regulatory Details
                </SectionHeading>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Direct Clg Member"
                    required
                    error={getError(
                      page2Errors,
                      "directClgMember",
                    )}
                  >
                    <select
                      value={
                        regulatory.directClgMember
                      }
                      onChange={(event) =>
                        setRegulatoryField(
                          "directClgMember",
                          event.target.value as YesNo,
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">
                        Select option
                      </option>

                      <option value="Yes">
                        Yes
                      </option>

                      <option value="No">
                        No
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Direct Member IFTAS"
                    required
                    error={getError(
                      page2Errors,
                      "directMemberIftas",
                    )}
                  >
                    <select
                      value={
                        regulatory.directMemberIftas
                      }
                      onChange={(event) =>
                        setRegulatoryField(
                          "directMemberIftas",
                          event.target.value as YesNo,
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">
                        Select option
                      </option>

                      <option value="Yes">
                        Yes
                      </option>

                      <option value="No">
                        No
                      </option>
                    </select>
                  </Field>
                </div>

                <SectionHeading>
                  MICR Details
                </SectionHeading>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="MICR Code"
                    required
                    error={getError(
                      page2Errors,
                      "micr1",
                    )}
                  >
                    <Input
                      value={regulatory.micr1}
                      onChange={(event) =>
                        setRegulatoryField(
                          "micr1",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="MICR Number"
                    required
                    error={getError(
                      page2Errors,
                      "micrNumber",
                    )}
                  >
                    <Input
                      value={
                        regulatory.micrNumber
                      }
                      onChange={(event) =>
                        setRegulatoryField(
                          "micrNumber",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="MICR City Code"
                    required
                    error={getError(
                      page2Errors,
                      "micr2",
                    )}
                  >
                    <Input
                      value={regulatory.micr2}
                      onChange={(event) =>
                        setRegulatoryField(
                          "micr2",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="MICR Branch Code"
                    required
                    error={getError(
                      page2Errors,
                      "micr3",
                    )}
                  >
                    <Input
                      value={regulatory.micr3}
                      onChange={(event) =>
                        setRegulatoryField(
                          "micr3",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="IFSC Code"
                    required
                    error={getError(
                      page2Errors,
                      "ifscCode",
                    )}
                  >
                    <Input
                      value={regulatory.ifscCode}
                      onChange={(event) =>
                        setRegulatoryField(
                          "ifscCode",
                          event.target.value.toUpperCase(),
                        )
                      }
                      maxLength={11}
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="No. of Branches"
                    required
                    error={getError(
                      page2Errors,
                      "noOfBranches",
                    )}
                  >
                    <Input
                      type="number"
                      min={0}
                      value={
                        regulatory.noOfBranches
                      }
                      onChange={(event) =>
                        setRegulatoryField(
                          "noOfBranches",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Sponsor Bank for Clg"
                    required
                    error={getError(
                      page2Errors,
                      "sponsorBankClg",
                    )}
                  >
                    <Input
                      value={
                        regulatory.sponsorBankClg
                      }
                      onChange={(event) =>
                        setRegulatoryField(
                          "sponsorBankClg",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Sponsor Bank for IFTAS"
                    required
                    error={getError(
                      page2Errors,
                      "sponsorBankIftas",
                    )}
                  >
                    <Input
                      value={
                        regulatory.sponsorBankIftas
                      }
                      onChange={(event) =>
                        setRegulatoryField(
                          "sponsorBankIftas",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* PAGE 3 - ADDRESS                                                  */}
            {/* ================================================================= */}

            {page === 3 && (
              <section className="space-y-5">
                <SectionHeading>
                  Address
                </SectionHeading>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Address Type"
                    required
                    error={getError(
                      page3Errors,
                      "addressType",
                    )}
                  >
                    <select
                      value={
                        address.addressType
                      }
                      onChange={(event) =>
                        setAddressField(
                          "addressType",
                          event.target.value,
                        )
                      }
                      className={selectClass}
                    >
                      <option value="">
                        Select address type
                      </option>

                      <option value="Registered Office">
                        Registered Office
                      </option>

                      <option value="Corporate Office">
                        Corporate Office
                      </option>

                      <option value="Head Office">
                        Head Office
                      </option>

                      <option value="Branch Office">
                        Branch Office
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Unit / Gala Name & No."
                    required
                    error={getError(
                      page3Errors,
                      "unitGala",
                    )}
                  >
                    <Input
                      value={address.unitGala}
                      onChange={(event) =>
                        setAddressField(
                          "unitGala",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Street / Road"
                    required
                    error={getError(
                      page3Errors,
                      "streetRoad",
                    )}
                  >
                    <Input
                      value={address.streetRoad}
                      onChange={(event) =>
                        setAddressField(
                          "streetRoad",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Land Mark"
                    required
                    error={getError(
                      page3Errors,
                      "landmark",
                    )}
                  >
                    <Input
                      value={address.landmark}
                      onChange={(event) =>
                        setAddressField(
                          "landmark",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Field
                    label="City"
                    required
                    error={getError(
                      page3Errors,
                      "city",
                    )}
                  >
                    <Input
                      value={address.city}
                      onChange={(event) =>
                        setAddressField(
                          "city",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="State"
                    required
                    error={getError(
                      page3Errors,
                      "state",
                    )}
                  >
                    <Input
                      value={address.state}
                      onChange={(event) =>
                        setAddressField(
                          "state",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="PIN Code"
                    required
                    error={getError(
                      page3Errors,
                      "pinCode",
                    )}
                  >
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={address.pinCode}
                      onChange={(event) =>
                        setAddressField(
                          "pinCode",
                          event.target.value.replace(
                            /\D/g,
                            "",
                          ),
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* FOOTER                                                             */}
        {/* ------------------------------------------------------------------ */}

        <div className="flex shrink-0 justify-between gap-3 border-t bg-background px-6 py-4">
          <div>
            {page > 1 && (
              <Button
                type="button"
                variant="outline"
                className="min-w-24"
                disabled={busy}
                onClick={goPrevious}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-3">
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

            {page < 3 ? (
              <Button
                type="button"
                className="min-w-24"
                disabled={busy}
                onClick={goNext}
              >
                Next
              </Button>
            ) : (
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
                  : busy
                    ? "Creating..."
                    : "Create Bank"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLING                                                                    */
/* -------------------------------------------------------------------------- */

const inputClass =
  "h-10 rounded-lg border-input bg-background text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20";

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20";

/* -------------------------------------------------------------------------- */
/* STEP INDICATOR                                                             */
/* -------------------------------------------------------------------------- */

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={
        active || completed
          ? "flex items-center gap-2 text-foreground"
          : "flex items-center gap-2 text-muted-foreground"
      }
    >
      <span
        className={
          active || completed
            ? "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            : "flex size-7 items-center justify-center rounded-full border text-xs font-semibold"
        }
      >
        {number}
      </span>

      <span className="hidden whitespace-nowrap sm:inline">
        {label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION HEADING                                                            */
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
/* FIELD                                                                      */
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
  children: ReactNode;
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
import {
  type Tenant,
  type RegulatoryDetails,
  type AddressDetails,
  type InstituteType,
  type TenantStatus,
} from "@/lib/admin-store";

/* -------------------------------------------------------------------------- */
/* BACKEND ORGANIZATION RESPONSE                                              */
/* -------------------------------------------------------------------------- */

export type OrganizationApiResponse = {
  id?: string | number;
  pkid?: number | string;

  /* Bank details */
  bank_code?: string | null;
  bankCode?: string | null;

  bank_name?: string | null;
  bankName?: string | null;

  bank_type?: string | null;
  bankType?: string | null;

  name?: string | null;
  type?: string | null;

  institution_name?: string | null;
  institution_type?: string | null;

  legal_name?: string | null;
  legalName?: string | null;

  short_name?: string | null;
  shortName?: string | null;

  pan_no?: string | null;
  pan_number?: string | null;
  pan?: string | null;
  panNo?: string | null;

  gst_no?: string | null;
  gst_number?: string | null;
  gst?: string | null;
  gstNo?: string | null;

  license_no?: string | null;
  license_number?: string | null;
  licenseNo?: string | null;

  registration_number?: string | null;
  registration_id?: string | null;
  registrationId?: string | null;

  CIN?: string | null;
  cin?: string | null;
  cin_no?: string | null;
  cin_number?: string | null;

  website?: string | null;

  logo_url?: string | null;
  logoUrl?: string | null;

  /* Regulatory authority */
  regulatory_authority?: string | null;
  regulatory_authority_id?: string | null;
  regulatoryAuthorityId?: string | null;

  /* Status */
  regulatory_status?: string | null;
  status?: string | null;

  /* ---------------------------------------------------------------------- */
  /* Regulatory details                                                     */
  /* ---------------------------------------------------------------------- */

  direct_clg_member?: string | null;
  direct_member_iftas?: string | null;

  micr_code?: string | null;
  micr_number?: string | null;

  micr_city_code?: string | null;
  micr_branch_code?: string | null;

  ifsc_code?: string | null;

  number_of_branches?: string | number | null;
  no_of_branches?: string | number | null;

  sponsor_bank_for_clg?: string | null;
  sponsor_bank_for_iftas?: string | null;

  /*
   * Some backend responses can return regulatory information
   * inside a nested regulatory_details object.
   */
  regulatory_details?: {
    direct_clg_member?: string | null;
    direct_member_iftas?: string | null;

    micr_code?: string | null;
    micr_number?: string | null;

    micr_city_code?: string | null;
    micr_branch_code?: string | null;

    ifsc_code?: string | null;

    number_of_branches?: string | number | null;
    no_of_branches?: string | number | null;

    sponsor_bank_for_clg?: string | null;
    sponsor_bank_for_iftas?: string | null;
  } | null;

  /*
   * Backend can also return MICR information as an object.
   */
  micr_details?: Record<string, unknown> | null;

  /* ---------------------------------------------------------------------- */
  /* Address                                                                */
  /* ---------------------------------------------------------------------- */

  country?: string | null;
  state?: string | null;
  city?: string | null;
  pin_code?: string | null;
  pinCode?: string | null;

  address_type?: string | null;
  unit_gala_name_no?: string | null;
  street_road?: string | null;
  land_mark?: string | null;
  landmark?: string | null;

  registered_address?: string | null;
  corporate_address?: string | null;

  /* Contact */
  contact_email?: string | null;
  contact_phone?: string | null;

  /* Dates */
  created_at?: string | null;
  updated_at?: string | null;

  /* Database information */
  db_name?: string | null;
  db_host?: string | null;
  db_port?: number | null;

  /* Branches */
  branches?: unknown[] | null;
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function firstString(
  ...values: unknown[]
): string {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }

  return "";
}

function firstValue(
  ...values: unknown[]
): unknown {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return undefined;
}

function normalizeBankType(
  value?: string | null,
): InstituteType {
  const normalized =
    value?.trim().toUpperCase() ?? "";

  if (normalized === "NBFC") {
    return "NBFC";
  }

  return "BANK";
}

function normalizeStatus(
  value?: string | null,
): TenantStatus {
  const normalized =
    value?.trim().toUpperCase();

  if (
    normalized === "INACTIVE" ||
    normalized === "DISABLED"
  ) {
    return "Inactive";
  }

  return "Active";
}

function toStringValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

/* -------------------------------------------------------------------------- */
/* BRANCH MAPPING                                                             */
/* -------------------------------------------------------------------------- */

function mapBranches(
  branches: unknown,
): {
  id: string;
  location: string;
}[] {
  if (!Array.isArray(branches)) {
    return [];
  }

  return branches.map(
    (branch, index) => {
      if (
        typeof branch === "string"
      ) {
        return {
          id: `branch-${index + 1}`,
          location: branch,
        };
      }

      if (
        branch &&
        typeof branch === "object"
      ) {
        const item =
          branch as Record<string, unknown>;

        const branchName =
          firstString(
            item["branch_name"],
            item["branchName"],
            item["name"],
            item["location"],
          );

        const city =
          firstString(
            item["city"],
          );

        const location =
          city && branchName
            ? `${branchName} — ${city}`
            : branchName;

        return {
          id:
            firstString(
              item["id"],
              item["pkid"],
            ) ||
            `branch-${index + 1}`,

          location,
        };
      }

      return {
        id: `branch-${index + 1}`,
        location: "",
      };
    },
  );
}

/* -------------------------------------------------------------------------- */
/* MAP ORGANIZATION TO TENANT                                                  */
/* -------------------------------------------------------------------------- */

export function mapOrganizationToTenant(
  organization: OrganizationApiResponse,
): Tenant {
  const pkidValue =
    firstValue(
      organization.pkid,
      organization.id,
    );

  const pkid =
    pkidValue !== undefined
      ? Number(pkidValue)
      : undefined;

  /* ---------------------------------------------------------------------- */
  /* Bank details                                                           */
  /* ---------------------------------------------------------------------- */

  const bankName =
    firstString(
      organization.bank_name,
      organization.bankName,
      organization.institution_name,
      organization.name,
    );

  const bankType =
    normalizeBankType(
      firstString(
        organization.bank_type,
        organization.bankType,
        organization.institution_type,
        organization.type,
      ),
    );

  const bankCode =
    firstString(
      organization.bank_code,
      organization.bankCode,
    );

  const legalName =
    firstString(
      organization.legal_name,
      organization.legalName,
    );

  const panNo =
    firstString(
      organization.pan_no,
      organization.pan_number,
      organization.pan,
      organization.panNo,
    );

  const gstNo =
    firstString(
      organization.gst_no,
      organization.gst_number,
      organization.gst,
      organization.gstNo,
    );

  const licenseNo =
    firstString(
      organization.license_no,
      organization.license_number,
      organization.licenseNo,
      organization.registration_number,
      organization.registration_id,
      organization.registrationId,
    );

  const cin =
    firstString(
      organization.CIN,
      organization.cin_no,
      organization.cin_number,
      organization.cin,
    );

  const website =
    firstString(
      organization.website,
    );

  const logoUrl =
    firstString(
      organization.logo_url,
      organization.logoUrl,
    );

  /* ---------------------------------------------------------------------- */
  /* Regulatory details                                                     */
  /* ---------------------------------------------------------------------- */

  const nestedRegulatory =
    organization.regulatory_details ?? {};

  const micrDetails =
    organization.micr_details ?? {};

  const directClgMember =
    firstString(
      organization.direct_clg_member,
      nestedRegulatory.direct_clg_member,
    );

  const directMemberIftas =
    firstString(
      organization.direct_member_iftas,
      nestedRegulatory.direct_member_iftas,
    );

  const micrCode =
    firstString(
      organization.micr_code,
      nestedRegulatory.micr_code,
      micrDetails["micr_code"],
      micrDetails["micr"],
    );

  /*
   * IMPORTANT:
   * micr_number is now retained.
   */
  const micrNumber =
    firstString(
      organization.micr_number,
      nestedRegulatory.micr_number,
      micrDetails["micr_number"],
    );

  const micrCityCode =
    firstString(
      organization.micr_city_code,
      nestedRegulatory.micr_city_code,
      micrDetails["micr_city_code"],
      micrDetails["city_code"],
    );

  const micrBranchCode =
    firstString(
      organization.micr_branch_code,
      nestedRegulatory.micr_branch_code,
      micrDetails["micr_branch_code"],
      micrDetails["branch_code"],
    );

  const ifscCode =
    firstString(
      organization.ifsc_code,
      nestedRegulatory.ifsc_code,
    );

  const numberOfBranchesValue =
    firstValue(
      organization.number_of_branches,
      organization.no_of_branches,
      nestedRegulatory.number_of_branches,
      nestedRegulatory.no_of_branches,
    );

  const numberOfBranches =
    numberOfBranchesValue !== undefined
      ? String(numberOfBranchesValue)
      : "";

  const sponsorBankForClg =
    firstString(
      organization.sponsor_bank_for_clg,
      nestedRegulatory.sponsor_bank_for_clg,
    );

  const sponsorBankForIftas =
    firstString(
      organization.sponsor_bank_for_iftas,
      nestedRegulatory.sponsor_bank_for_iftas,
    );

  const regulatoryDetails: RegulatoryDetails =
    {
      directClgMember,
      directMemberIftas,

      micrCode,
      micrNumber,

      micrCityCode,
      micrBranchCode,

      ifscCode,

      numberOfBranches,

      sponsorBankForClg,
      sponsorBankForIftas,
    };

  /* ---------------------------------------------------------------------- */
  /* Address                                                                */
  /* ---------------------------------------------------------------------- */

  const addressDetails: AddressDetails =
    {
      addressType:
        firstString(
          organization.address_type,
        ),

      unitGalaNameNo:
        firstString(
          organization.unit_gala_name_no,
        ),

      streetRoad:
        firstString(
          organization.street_road,
        ),

      landMark:
        firstString(
          organization.land_mark,
          organization.landmark,
        ),

      city:
        firstString(
          organization.city,
        ),

      state:
        firstString(
          organization.state,
        ),

      pinCode:
        firstString(
          organization.pin_code,
          organization.pinCode,
        ),
    };

  /* ---------------------------------------------------------------------- */
  /* Status                                                                 */
  /* ---------------------------------------------------------------------- */

  const status =
    normalizeStatus(
      firstString(
        organization.status,
        organization.regulatory_status,
      ),
    );

  /* ---------------------------------------------------------------------- */
  /* Final tenant                                                           */
  /* ---------------------------------------------------------------------- */

  return {
    id:
      String(
        pkid ??
          organization.id ??
          `tenant-${Date.now()}`,
      ),

    ...(pkid !== undefined ? { pkid } : {}),

    firstName: bankName,
    middleName: "",
    lastName: "",

    employeeId: licenseNo,

    email:
      firstString(
        organization.contact_email,
      ),

    mobile:
      firstString(
        organization.contact_phone,
      ),

    organization: bankName,

    branches:
      mapBranches(
        organization.branches,
      ),

    designation:
      "Relationship Manager",

    status,

    createdAt:
      firstString(
        organization.created_at,
      ) ||
      new Date().toISOString(),

    activity: [],

    /* Bank */
    bankCode,
    bankName,
    bankType,

    legalName,

    panNo,
    gstNo,
    licenseNo,

    website,
    logoUrl,

    /* Regulatory */
    regulatoryDetails,

    /* Address */
    addressDetails,

    /* Contact */
    contactEmail:
      firstString(
        organization.contact_email,
      ),

    contactPhone:
      firstString(
        organization.contact_phone,
      ),

    /* Compatibility */
    instituteName: bankName,
    instituteType: bankType,

    registrationNumber:
      firstString(
        organization.registration_id,
        organization.registration_number,
        licenseNo,
      ),

    cin,

    regulatoryAuthorityId:
      firstString(
        organization.regulatory_authority_id,
        organization.regulatoryAuthorityId,
        organization.regulatory_authority,
      ),
  };
}
import type {
  AddressDetails,
  InstituteType,
  RegulatoryDetails,
  Tenant,
} from "@/lib/admin-store";

export type OrganizationApiResponse = {
  id?: string;
  pkid?: number | string | null;

  name?: string | null;
  type?: string | null;

  bank_code?: string | null;
  bankCode?: string | null;
  bank_name?: string | null;
  bankName?: string | null;
  bank_type?: string | null;
  bankType?: string | null;

  institution_name?: string | null;
  institution_type?: string | null;

  legal_name?: string | null;

  pan_no?: string | null;
  pan_number?: string | null;
  pan?: string | null;
  PAN?: string | null;

  gst_no?: string | null;
  gst_number?: string | null;
  gst?: string | null;

  cin?: string | null;
  CIN?: string | null;
  cin_no?: string | null;
  cin_number?: string | null;

  license_no?: string | null;
  license_number?: string | null;
  licenseNo?: string | null;

  registration_number?: string | null;
  registrationNumber?: string | null;
  registration_id?: string | null;
  registrationId?: string | null;

  website?: string | null;

  logo?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;

  status?: string | null;
  regulatory_status?: string | null;
  regulatory_authority?: string | null;
  regulatory_authority_id?: string | null;
  regulatoryAuthorityId?: string | null;

  contact_email?: string | null;
  contact_phone?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  pin_code?: string | null;
  pincode?: string | null;

  registered_address?: string | null;
  corporate_address?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  direct_clg_member?: string | null;
  direct_member_iftas?: string | null;

  micr_code?: string | null;
  micr_number?: string | null;
  micr_city_code?: string | null;
  micr_branch_code?: string | null;
  micr_details?: unknown;

  ifsc_code?: string | null;

  number_of_branches?: string | number | null;

  sponsor_bank_for_clg?: string | null;
  sponsor_bank_for_iftas?: string | null;

  address_type?: string | null;
  unit_gala_name_no?: string | null;
  unit_gala_name_and_number?: string | null;
  street_road?: string | null;
  land_mark?: string | null;
  landmark?: string | null;
};

function normalizeBankType(value?: string | null): InstituteType {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (normalized === "NBFC") {
    return "NBFC";
  }

  return "BANK";
}

function normalizeStatus(value?: string | null): Tenant["status"] {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (normalized === "ACTIVE") {
    return "Active";
  }

  return "Inactive";
}

export function mapOrganizationToTenant(
  o: OrganizationApiResponse,
): Tenant {
  const pkid =
    typeof o.pkid === "number"
      ? o.pkid
      : typeof o.pkid === "string" &&
          Number.isFinite(Number(o.pkid))
        ? Number(o.pkid)
        : undefined;

  const micrDetails =
    typeof o.micr_details === "object" &&
    o.micr_details !== null &&
    !Array.isArray(o.micr_details)
      ? o.micr_details as Record<string, unknown>
      : {};
  const micrValue = (...values: unknown[]): string =>
    values.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ) ?? "";

  const bankName =
    o.bank_name ??
    o.bankName ??
    o.institution_name ??
    o.name ??
    "";

  const bankType = normalizeBankType(
    o.bank_type ??
    o.bankType ??
    o.institution_type ??
    o.type,
  );

  const bankCode =
    o.bank_code ??
    o.bankCode ??
    "";

  const legalName =
    o.legal_name ??
    bankName;

  const panNo =
    o.pan_no ??
    o.pan_number ??
    o.pan ??
    o.PAN ??
    "";

  const gstNo =
    o.gst_no ??
    o.gst_number ??
    o.gst ??
    "";

  const cin =
    o.CIN ??
    o.cin_no ??
    o.cin_number ??
    o.cin ??
    "";

  const licenseNo =
    o.license_no ??
    o.license_number ??
    o.licenseNo ??
    o.registration_number ??
    o.registrationNumber ??
    o.registration_id ??
    o.registrationId ??
    "";

  const registrationNumber =
    o.registration_id ??
    o.registrationId ??
    o.registration_number ??
    o.registrationNumber ??
    licenseNo;

  const status = normalizeStatus(
    o.status ??
    o.regulatory_status ??
    "ACTIVE",
  );

  const regulatoryDetails: RegulatoryDetails = {
    directClgMember:o.direct_clg_member ?? "",

    directMemberIftas:o.direct_member_iftas ?? "",

    micrCode:micrValue(
      o.micr_code,
      o.micr_number,
      micrDetails["micr_code"],
      micrDetails["micr_number"],
      micrDetails["micr"],
      typeof o.micr_details === "string" ? o.micr_details : undefined,
    ),

    micrCityCode:micrValue(
      o.micr_city_code,
      micrDetails["micr_city_code"],
      micrDetails["city_code"],
    ),

    micrBranchCode:micrValue(
      o.micr_branch_code,
      micrDetails["micr_branch_code"],
      micrDetails["branch_code"],
    ),

    ifscCode:o.ifsc_code ?? "",

    numberOfBranches:o.number_of_branches != null
        ? String(o.number_of_branches)
        : "",

    sponsorBankForClg:o.sponsor_bank_for_clg ?? "",

    sponsorBankForIftas:o.sponsor_bank_for_iftas ?? "",
  };

  const addressDetails: AddressDetails = {
    addressType:o.address_type ?? "",

    unitGalaNameNo:o.unit_gala_name_no ?? o.unit_gala_name_and_number ?? "",

    streetRoad:o.street_road ?? "",

    landMark:o.land_mark ?? o.landmark ?? "",

    city:o.city ?? "",

    state:o.state ?? "",

    pinCode:o.pin_code ?? o.pincode ?? "",
  };

  const tenant: Tenant = {
    id:o.id ??String(  pkid ??
        crypto.randomUUID(),
      ),

    ...(pkid !== undefined
      ? { pkid }
      : {}),

    firstName: bankName,
    middleName: "",
    lastName: "",

    employeeId: licenseNo,

    email:o.contact_email ?? "",

    mobile:o.contact_phone ?? "",

    organization: bankName,

    branches: [],

    designation:
      "Relationship Manager",

    status,

    createdAt:
      o.created_at ??
      new Date().toISOString(),

    activity: [],

    bankCode,
    bankName,
    bankType,
    legalName,
    panNo,
    gstNo,
    licenseNo,

    website:
      o.website ?? "",

    logoUrl:
      o.logo ??
      o.logo_url ??
      o.logoUrl ??
      "",

    regulatoryDetails,
    addressDetails,

    contactEmail:
      o.contact_email ?? "",

    contactPhone:
      o.contact_phone ?? "",

    instituteName:
      bankName,

    instituteType:
      bankType,

    registrationNumber:
      registrationNumber,

    cin:
      cin,

    regulatoryAuthorityId:
      o.regulatory_authority_id ??
      o.regulatoryAuthorityId ??
      o.regulatory_authority ??
      "",
  };

  return tenant;
}
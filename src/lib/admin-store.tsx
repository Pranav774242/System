import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* -------------------------------------------------------------------------- */
/* BASIC TYPES                                                                */
/* -------------------------------------------------------------------------- */

export type TenantStatus = "Active" | "Inactive";

export type InstituteType = "BANK" | "NBFC";

export type Branch = {
  id: string;
  location: string;
};

/* -------------------------------------------------------------------------- */
/* REGULATORY DETAILS                                                         */
/* -------------------------------------------------------------------------- */

export type RegulatoryDetails = {
  directClgMember: string;
  directMemberIftas: string;

  micrCode: string;
  micrCityCode: string;
  micrBranchCode: string;

  ifscCode: string;

  numberOfBranches: string;

  sponsorBankForClg: string;
  sponsorBankForIftas: string;

  /*
   * Optional because Regulatory Authority ID is not part
   * of the Create Bank frontend form.
   */
  regulatoryAuthorityId?: string;
};

/* -------------------------------------------------------------------------- */
/* ADDRESS DETAILS                                                            */
/* -------------------------------------------------------------------------- */

export type AddressDetails = {
  addressType: string;
  unitGalaNameNo: string;
  streetRoad: string;
  landMark: string;
  city: string;
  state: string;
  pinCode: string;
};

/* -------------------------------------------------------------------------- */
/* TENANT                                                                     */
/* -------------------------------------------------------------------------- */

export type Tenant = {
  id: string;

  firstName: string;
  middleName?: string;
  lastName: string;

  employeeId: string;

  email: string;
  mobile: string;

  organization: string;

  branches: Branch[];

  designation: string;

  status: TenantStatus;

  createdAt: string;

  pkid?: number;

  activity: {
    id: string;
    text: string;
    at: string;
  }[];

  bankCode: string;
  bankName: string;
  bankType: InstituteType;

  legalName: string;

  panNo: string;
  gstNo: string;
  licenseNo: string;

  website: string;
  logoUrl: string;

  regulatoryDetails: RegulatoryDetails;

  addressDetails: AddressDetails;

  contactEmail: string;
  contactPhone: string;

  instituteName: string;
  instituteType: InstituteType;

  registrationNumber: string;

  cin: string;

  /*
   * IMPORTANT:
   * Regulatory Authority ID is optional.
   *
   * The Create Bank form does not contain this field,
   * so Tenant must not require it.
   */
  regulatoryAuthorityId?: string;
};

/* -------------------------------------------------------------------------- */
/* BANK INPUT                                                                 */
/* -------------------------------------------------------------------------- */

export type BankInput = {
  bankCode: string;
  bankName: string;
  bankType: InstituteType;

  legalName: string;

  panNo: string;
  gstNo: string;
  cin: string;
  licenseNo: string;

  website: string;
  logoUrl: string;

  regulatoryDetails: RegulatoryDetails;

  addressDetails: AddressDetails;

  contactEmail: string;
  contactPhone: string;

  branches: Branch[];

  instituteName: string;
  instituteType: InstituteType;

  registrationNumber: string;

  /*
   * Optional.
   * Do not force Create Bank to provide this value.
   */
  regulatoryAuthorityId?: string;

  regulatoryAuthority?: string;

  country?: string;
  state?: string;
  city?: string;
  pinCode?: string;

  registeredAddress?: string;
  corporateAddress?: string;

  designation?: string;
  status?: TenantStatus;
};

/* -------------------------------------------------------------------------- */
/* USER                                                                       */
/* -------------------------------------------------------------------------- */

export type User = {
  id: string;

  bankId: string;
  bankName: string;

  firstName: string;
  middleName?: string;
  lastName: string;

  employeeId: string;
  designation: string;

  officialEmail: string;
  mobileNumber: string;

  branch: string;

  organization: "Head Quarter" | "Branch";

  createdAt: string;
};

export type UserInput = Omit<
  User,
  "id" | "createdAt"
>;

/* -------------------------------------------------------------------------- */
/* ACTIVITY                                                                   */
/* -------------------------------------------------------------------------- */

export type ActivityItem = {
  id: string;
  text: string;
  at: string;
  kind:
    | "created"
    | "updated"
    | "status"
    | "info";
};

/* -------------------------------------------------------------------------- */
/* DESIGNATIONS                                                               */
/* -------------------------------------------------------------------------- */

export const DESIGNATIONS = [
  "Relationship Manager",
  "Branch Manager",
  "Operations Head",
  "Credit Analyst",
  "Regional Director",
  "Compliance Officer",
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

export function tenantFullName(
  tenant: Tenant,
) {
  return [
    tenant.firstName,
    tenant.middleName,
    tenant.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function initials(
  tenant: Tenant,
) {
  return `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase();
}

let idSeq = 1000;

export const nextId = (
  prefix = "id",
) => `${prefix}-${++idSeq}`;

const daysAgo = (
  days: number,
) =>
  new Date(
    Date.now() -
      days * 86_400_000,
  ).toISOString();

/* -------------------------------------------------------------------------- */
/* EMPTY VALUES                                                               */
/* -------------------------------------------------------------------------- */

const emptyRegulatoryDetails =
  (): RegulatoryDetails => ({
    directClgMember: "",
    directMemberIftas: "",
    micrCode: "",
    micrCityCode: "",
    micrBranchCode: "",
    ifscCode: "",
    numberOfBranches: "",
    sponsorBankForClg: "",
    sponsorBankForIftas: "",
  });

const emptyAddressDetails =
  (): AddressDetails => ({
    addressType: "",
    unitGalaNameNo: "",
    streetRoad: "",
    landMark: "",
    city: "",
    state: "",
    pinCode: "",
  });

/* -------------------------------------------------------------------------- */
/* CREATE SEED TENANT                                                         */
/* -------------------------------------------------------------------------- */

function makeTenant(
  partial: Omit<
    Tenant,
    | "id"
    | "createdAt"
    | "activity"
    | "branches"
    | "bankCode"
    | "bankName"
    | "bankType"
    | "legalName"
    | "panNo"
    | "gstNo"
    | "licenseNo"
    | "website"
    | "logoUrl"
    | "regulatoryDetails"
    | "addressDetails"
    | "instituteName"
    | "instituteType"
    | "registrationNumber"
    | "contactEmail"
    | "contactPhone"
    | "cin"
    | "regulatoryAuthorityId"
  > & {
    branches: string[];

    bankCode?: string;
    bankName?: string;
    bankType?: InstituteType;

    legalName?: string;

    panNo?: string;
    gstNo?: string;
    cin?: string;
    licenseNo?: string;

    website?: string;
    logoUrl?: string;

    regulatoryDetails?: RegulatoryDetails;
    addressDetails?: AddressDetails;
  },
  createdDaysAgo: number,
): Tenant {
  const createdAt =
    daysAgo(createdDaysAgo);

  const bankName =
    partial.bankName ??
    partial.organization;

  const bankType =
    partial.bankType ?? "NBFC";

  const licenseNo =
    partial.licenseNo ??
    partial.employeeId;

  const contactEmail =
    partial.email;

  const contactPhone =
    partial.mobile;

  const regulatoryDetails =
    partial.regulatoryDetails ??
    emptyRegulatoryDetails();

  const addressDetails =
    partial.addressDetails ??
    emptyAddressDetails();

  return {
    ...partial,

    bankCode:
      partial.bankCode ?? "",

    bankName,

    bankType,

    legalName:
      partial.legalName ??
      bankName,

    panNo:
      partial.panNo ?? "",

    gstNo:
      partial.gstNo ?? "",

    licenseNo,

    website:
      partial.website ?? "",

    logoUrl:
      partial.logoUrl ?? "",

    regulatoryDetails,

    addressDetails,

    contactEmail,

    contactPhone,

    instituteName:
      bankName,

    instituteType:
      bankType,

    registrationNumber:
      licenseNo,

    cin:
      partial.cin ?? "",

    id: nextId("tnt"),

    branches:
      partial.branches.map(
        (location) => ({
          id: nextId("br"),
          location,
        }),
      ),

    createdAt,

    activity: [
      {
        id: nextId("act"),
        text: "Bank account created",
        at: createdAt,
      },
      {
        id: nextId("act"),
        text: `Status set to ${partial.status}`,
        at: daysAgo(
          Math.max(
            createdDaysAgo - 1,
            0,
          ),
        ),
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* SEED TENANTS                                                               */
/* -------------------------------------------------------------------------- */

const SEED_TENANTS: Tenant[] = [
  makeTenant(
    {
      firstName: "Aarav",
      middleName: "K",
      lastName: "Mehta",
      employeeId: "EMP-10241",
      email:
        "aarav.mehta@abcfinance.in",
      mobile:
        "+91 98200 41253",
      organization:
        "ABC Finance Ltd",
      branches: [
        "Mumbai — Andheri East",
        "Mumbai — Lower Parel",
        "Pune — Kothrud",
      ],
      designation:
        "Regional Director",
      status: "Active",
      bankCode: "ABC001",
      bankName:
        "ABC Finance Ltd",
      bankType: "NBFC",
      legalName:
        "ABC Finance Ltd",
      licenseNo:
        "EMP-10241",
    },
    62,
  ),

  makeTenant(
    {
      firstName: "Priya",
      lastName: "Raghavan",
      employeeId: "EMP-10388",
      email:
        "priya.raghavan@sundarbancorp.com",
      mobile:
        "+91 99401 77812",
      organization:
        "Sundar Bank Corp",
      branches: [
        "Chennai — T Nagar",
        "Coimbatore — RS Puram",
      ],
      designation:
        "Branch Manager",
      status: "Active",
      bankCode: "SBC001",
      bankName:
        "Sundar Bank Corp",
      bankType: "BANK",
      legalName:
        "Sundar Bank Corp",
      licenseNo:
        "EMP-10388",
    },
    54,
  ),

  makeTenant(
    {
      firstName: "Rohit",
      middleName: "S",
      lastName: "Deshpande",
      employeeId: "EMP-10412",
      email:
        "rohit.deshpande@vistaracredit.in",
      mobile:
        "+91 98670 22110",
      organization:
        "Vistara Credit NBFC",
      branches: [
        "Nagpur — Sitabuldi",
      ],
      designation:
        "Operations Head",
      status: "Inactive",
      bankCode: "VCN001",
      bankName:
        "Vistara Credit NBFC",
      bankType: "NBFC",
      legalName:
        "Vistara Credit NBFC",
      licenseNo:
        "EMP-10412",
    },
    47,
  ),

  makeTenant(
    {
      firstName: "Neha",
      lastName: "Kulkarni",
      employeeId: "EMP-10503",
      email:
        "neha.kulkarni@grihafinserv.com",
      mobile:
        "+91 93726 55401",
      organization:
        "Griha Finserv",
      branches: [
        "Bengaluru — Indiranagar",
        "Bengaluru — Whitefield",
        "Mysuru — Saraswathipuram",
      ],
      designation:
        "Relationship Manager",
      status: "Active",
      bankCode: "GF001",
      bankName:
        "Griha Finserv",
      bankType: "NBFC",
      legalName:
        "Griha Finserv",
      licenseNo:
        "EMP-10503",
    },
    38,
  ),

  makeTenant(
    {
      firstName: "Imran",
      middleName: "A",
      lastName: "Qureshi",
      employeeId: "EMP-10577",
      email:
        "imran.qureshi@northstarbank.in",
      mobile:
        "+91 90045 31287",
      organization:
        "Northstar Bank",
      branches: [
        "Delhi — Connaught Place",
        "Noida — Sector 62",
      ],
      designation:
        "Credit Analyst",
      status: "Active",
      bankCode: "NSB001",
      bankName:
        "Northstar Bank",
      bankType: "BANK",
      legalName:
        "Northstar Bank",
      licenseNo:
        "EMP-10577",
    },
    30,
  ),

  makeTenant(
    {
      firstName: "Sneha",
      lastName: "Iyer",
      employeeId: "EMP-10644",
      email:
        "sneha.iyer@auricapital.com",
      mobile:
        "+91 98450 11239",
      organization:
        "Auri Capital",
      branches: [
        "Hyderabad — Banjara Hills",
      ],
      designation:
        "Compliance Officer",
      status: "Inactive",
      bankCode: "AC001",
      bankName:
        "Auri Capital",
      bankType: "NBFC",
      legalName:
        "Auri Capital",
      licenseNo:
        "EMP-10644",
    },
    24,
  ),

  makeTenant(
    {
      firstName: "Vikram",
      middleName: "R",
      lastName: "Nair",
      employeeId: "EMP-10702",
      email:
        "vikram.nair@keralagold.in",
      mobile:
        "+91 94470 87654",
      organization:
        "Kerala Gold Finance",
      branches: [
        "Kochi — MG Road",
        "Thrissur — Round West",
        "Kozhikode — Mavoor Road",
      ],
      designation:
        "Branch Manager",
      status: "Active",
      bankCode: "KGF001",
      bankName:
        "Kerala Gold Finance",
      bankType: "NBFC",
      legalName:
        "Kerala Gold Finance",
      licenseNo:
        "EMP-10702",
    },
    17,
  ),

  makeTenant(
    {
      firstName: "Ananya",
      lastName: "Bose",
      employeeId: "EMP-10788",
      email:
        "ananya.bose@bengalcreditunion.in",
      mobile:
        "+91 98310 45560",
      organization:
        "Bengal Credit Union",
      branches: [
        "Kolkata — Salt Lake",
        "Howrah — Shibpur",
      ],
      designation:
        "Operations Head",
      status: "Active",
      bankCode: "BCU001",
      bankName:
        "Bengal Credit Union",
      bankType: "BANK",
      legalName:
        "Bengal Credit Union",
      licenseNo:
        "EMP-10788",
    },
    11,
  ),

  makeTenant(
    {
      firstName: "Karan",
      lastName: "Sethi",
      employeeId: "EMP-10841",
      email:
        "karan.sethi@punjabagrifin.in",
      mobile:
        "+91 98140 99021",
      organization:
        "Punjab Agri Finance",
      branches: [
        "Ludhiana — Model Town",
      ],
      designation:
        "Relationship Manager",
      status: "Active",
      bankCode: "PAF001",
      bankName:
        "Punjab Agri Finance",
      bankType: "NBFC",
      legalName:
        "Punjab Agri Finance",
      licenseNo:
        "EMP-10841",
    },
    5,
  ),

  makeTenant(
    {
      firstName: "Meera",
      middleName: "J",
      lastName: "Pillai",
      employeeId: "EMP-10902",
      email:
        "meera.pillai@zenithhousing.com",
      mobile:
        "+91 99000 76432",
      organization:
        "Zenith Housing Finance",
      branches: [
        "Ahmedabad — Navrangpura",
        "Surat — Adajan",
      ],
      designation:
        "Credit Analyst",
      status: "Active",
      bankCode: "ZHF001",
      bankName:
        "Zenith Housing Finance",
      bankType: "NBFC",
      legalName:
        "Zenith Housing Finance",
      licenseNo:
        "EMP-10902",
    },
    2,
  ),
];

/* -------------------------------------------------------------------------- */
/* ACTIVITY                                                                   */
/* -------------------------------------------------------------------------- */

const SEED_ACTIVITY: ActivityItem[] =
  [
    {
      id: nextId("f"),
      text:
        "Bank 'Zenith Housing Finance' created",
      at: daysAgo(2),
      kind: "created",
    },
    {
      id: nextId("f"),
      text:
        "Product 'Gold Loan' updated",
      at: daysAgo(3),
      kind: "updated",
    },
    {
      id: nextId("f"),
      text:
        "Rule 'Max LTV 75%' assigned to Gold Loan",
      at: daysAgo(4),
      kind: "info",
    },
    {
      id: nextId("f"),
      text:
        "Bank 'Auri Capital' status changed to Inactive",
      at: daysAgo(6),
      kind: "status",
    },
    {
      id: nextId("f"),
      text:
        "Bank 'Punjab Agri Finance' created",
      at: daysAgo(5),
      kind: "created",
    },
    {
      id: nextId("f"),
      text:
        "Product 'Vehicle Loan' created",
      at: daysAgo(8),
      kind: "created",
    },
    {
      id: nextId("f"),
      text:
        "Rule 'Min CIBIL 700' assigned to Personal Loan",
      at: daysAgo(9),
      kind: "info",
    },
  ];

/* -------------------------------------------------------------------------- */
/* DASHBOARD DATA                                                             */
/* -------------------------------------------------------------------------- */

export const ONBOARDING_TREND = [
  { month: "Jan", tenants: 2 },
  { month: "Feb", tenants: 3 },
  { month: "Mar", tenants: 5 },
  { month: "Apr", tenants: 4 },
  { month: "May", tenants: 7 },
  { month: "Jun", tenants: 6 },
  { month: "Jul", tenants: 9 },
  { month: "Aug", tenants: 11 },
  { month: "Sep", tenants: 10 },
];

export const PRODUCT_USAGE = [
  {
    product: "Gold Loan",
    tenants: 9,
  },
  {
    product: "Personal Loan",
    tenants: 7,
  },
  {
    product: "Business Loan",
    tenants: 5,
  },
  {
    product: "Vehicle Loan",
    tenants: 4,
  },
  {
    product: "Home Loan",
    tenants: 3,
  },
];

export type TenantInput = BankInput;

/* -------------------------------------------------------------------------- */
/* ADMIN STORE TYPE                                                           */
/* -------------------------------------------------------------------------- */

type AdminStore = {
  authed: boolean;

  adminName: string;

  login: (
    accessToken: string,
  ) => void;

  logout: () => void;

  theme: "light" | "dark";

  toggleTheme: () => void;

  tenants: Tenant[];

  users: User[];

  activity: ActivityItem[];

  createTenant: (
    input: BankInput,
  ) => Tenant;

  updateTenant: (
    id: string,
    input: BankInput,
  ) => void;

  toggleTenantStatus: (
    id: string,
  ) => void;

  createUser: (
    input: UserInput,
  ) => User;
};

const Ctx =
  createContext<AdminStore | null>(
    null,
  );

/* -------------------------------------------------------------------------- */
/* ACCESS TOKEN                                                               */
/* -------------------------------------------------------------------------- */

export function getAccessToken(): string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const storedToken =
    window.localStorage.getItem(
      "accessToken",
    );

  if (!storedToken) {
    return null;
  }

  const token =
    storedToken
      .trim()
      .replace(
        /^Bearer\s+/i,
        "",
      )
      .trim();

  return token || null;
}

/* -------------------------------------------------------------------------- */
/* ORGANIZATION API TYPE                                                      */
/* -------------------------------------------------------------------------- */

type OrganizationApiResponse = {
  id?: string;
  pkid?: number;

  name?: string;
  type?: string;

  bank_code?: string;
  bankCode?: string;

  bank_name?: string;
  bankName?: string;

  bank_type?: string;
  bankType?: string;

  institution_name?: string;
  institution_type?: string;

  legal_name?: string;
  legalName?: string;

  pan_no?: string;
  pan_number?: string;
  pan?: string;
  panNo?: string;

  gst_no?: string;
  gst_number?: string;
  gst?: string;
  gstNo?: string;

  license_no?: string;
  license_number?: string;
  licenseNo?: string;

  registration_number?: string;
  registration_id?: string;

  website?: string;

  logo_url?: string;
  logoUrl?: string;

  regulatory_authority?: string;

  /*
   * Optional.
   * It can still be received from GET API,
   * but it is not required by the frontend model.
   */
  regulatory_authority_id?: string;
  regulatoryAuthorityId?: string;

  CIN?: string;
  cin?: string;
  cin_no?: string;
  cin_number?: string;

  regulatory_status?: string;
  status?: string;

  country?: string;
  state?: string;
  city?: string;
  pin_code?: string;
  pincode?: string;

  registered_address?: string;
  corporate_address?: string;

  contact_email?: string;
  contact_phone?: string;

  created_at?: string;
  updated_at?: string;

  direct_clg_member?: string;
  direct_member_iftas?: string;

  micr_code?: string;
  micr_city_code?: string;
  micr_branch_code?: string;

  ifsc_code?: string;

  number_of_branches?:
    | string
    | number;

  sponsor_bank_for_clg?: string;
  sponsor_bank_for_iftas?: string;

  address_type?: string;

  unit_gala_name_no?: string;
  unit_gala_name_and_number?: string;

  street_road?: string;

  land_mark?: string;
  landmark?: string;

  branches?: unknown[];
};

/* -------------------------------------------------------------------------- */
/* NORMALIZE BANK TYPE                                                        */
/* -------------------------------------------------------------------------- */

function normalizeBankType(
  value?: string,
): InstituteType {
  const normalized =
    value
      ?.trim()
      .toUpperCase() ?? "";

  return normalized === "NBFC"
    ? "NBFC"
    : "BANK";
}

/* -------------------------------------------------------------------------- */
/* MAP ORGANIZATION                                                           */
/* -------------------------------------------------------------------------- */

function mapOrganizationToTenant(
  organization: OrganizationApiResponse,
): Tenant {
  const bankName =
    organization.bank_name ??
    organization.bankName ??
    organization.institution_name ??
    organization.name ??
    "";

  const bankType =
    normalizeBankType(
      organization.bank_type ??
        organization.bankType ??
        organization.institution_type ??
        organization.type,
    );

  const bankCode =
    organization.bank_code ??
    organization.bankCode ??
    "";

  const licenseNo =
    organization.license_no ??
    organization.licenseNo ??
    organization.license_number ??
    organization.registration_number ??
    organization.registration_id ??
    "";

  const gstNo =
    organization.gst_no ??
    organization.gstNo ??
    organization.gst_number ??
    organization.gst ??
    "";

  const cin =
    organization.CIN ??
    organization.cin_no ??
    organization.cin_number ??
    organization.cin ??
    "";

  const panNo =
    organization.pan_no ??
    organization.panNo ??
    organization.pan_number ??
    organization.pan ??
    "";

  const backendStatus =
    organization.status ??
    organization.regulatory_status ??
    "ACTIVE";

  const status: TenantStatus =
    backendStatus
      .trim()
      .toUpperCase() ===
    "ACTIVE"
      ? "Active"
      : "Inactive";

  const regulatoryDetails: RegulatoryDetails =
    {
      directClgMember:
        organization.direct_clg_member ??
        "",

      directMemberIftas:
        organization.direct_member_iftas ??
        "",

      micrCode:
        organization.micr_code ??
        "",

      micrCityCode:
        organization.micr_city_code ??
        "",

      micrBranchCode:
        organization.micr_branch_code ??
        "",

      ifscCode:
        organization.ifsc_code ??
        "",

      numberOfBranches:
        organization.number_of_branches !=
        null
          ? String(
              organization.number_of_branches,
            )
          : "",

      sponsorBankForClg:
        organization.sponsor_bank_for_clg ??
        "",

      sponsorBankForIftas:
        organization.sponsor_bank_for_iftas ??
        "",
    };

  const addressDetails: AddressDetails =
    {
      addressType:
        organization.address_type ??
        "",

      unitGalaNameNo:
        organization.unit_gala_name_no ??
        organization.unit_gala_name_and_number ??
        "",

      streetRoad:
        organization.street_road ??
        "",

      landMark:
        organization.land_mark ??
        organization.landmark ??
        "",

      city:
        organization.city ??
        "",

      state:
        organization.state ??
        "",

      pinCode:
        organization.pin_code ??
        organization.pincode ??
        "",
    };

  /*
   * Build the Tenant object without requiring
   * regulatoryAuthorityId.
   *
   * If the backend sends the value, we preserve it.
   * If it does not send it, nothing is added.
   */
  const regulatoryAuthorityId =
    organization.regulatory_authority_id ??
    organization.regulatoryAuthorityId;

  return {
    id:
      organization.id ??
      String(
        organization.pkid ??
          nextId("tnt"),
      ),

    firstName: bankName,

    middleName: "",

    lastName: "",

    employeeId: licenseNo,

    email:
      organization.contact_email ??
      "",

    mobile:
      organization.contact_phone ??
      "",

    organization: bankName,

    branches: [],

    designation:
      "Relationship Manager",

    status,

    createdAt:
      organization.created_at ??
      new Date().toISOString(),

    ...(organization.pkid !=
    null
      ? {
          pkid:
            organization.pkid,
        }
      : {}),

    activity: [],

    bankCode,

    bankName,

    bankType,

    legalName:
      organization.legal_name ??
      organization.legalName ??
      bankName,

    panNo,

    gstNo,

    licenseNo,

    website:
      organization.website ??
      "",

    logoUrl:
      organization.logo_url ??
      organization.logoUrl ??
      "",

    regulatoryDetails,

    addressDetails,

    contactEmail:
      organization.contact_email ??
      "",

    contactPhone:
      organization.contact_phone ??
      "",

    instituteName:
      bankName,

    instituteType:
      bankType,

    registrationNumber:
      organization.registration_id ??
      organization.registration_number ??
      licenseNo,

    cin,

    /*
     * Only add regulatoryAuthorityId
     * when the backend actually provides it.
     *
     * No hardcoded value is used.
     */
    ...(regulatoryAuthorityId
      ? {
          regulatoryAuthorityId,
        }
      : {}),
  };
}

/* -------------------------------------------------------------------------- */
/* GET ORGANIZATIONS                                                          */
/* -------------------------------------------------------------------------- */

async function fetchOrganizations(
  token: string,
): Promise<Tenant[] | null> {
  if (!token) {
    return null;
  }

  try {
    console.log(
      "Loading organizations with token:",
      {
        length: token.length,
        start: `${token.substring(
          0,
          12,
        )}...`,
      },
    );

    const response =
      await fetch(
        "https://los-backend-355v.onrender.com/api/v1/administration/organizations",
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        },
      );

    const responseText =
      await response.text();

    console.log(
      "Organizations API response:",
      {
        status:
          response.status,

        statusText:
          response.statusText,
      },
    );

    if (
      response.status === 401
    ) {
      console.error(
        "401 Unauthorized from organizations API.",
        {
          response:
            responseText,
        },
      );

      /*
       * Remove the token only if it is
       * still the currently stored token.
       */
      if (
        getAccessToken() ===
        token
      ) {
        window.localStorage.removeItem(
          "accessToken",
        );
      }

      return null;
    }

    if (!response.ok) {
      console.error(
        "Organizations GET failed:",
        {
          status:
            response.status,

          response:
            responseText,
        },
      );

      return null;
    }

    if (!responseText.trim()) {
      return [];
    }

    let responseData: unknown;

    try {
      responseData =
        JSON.parse(
          responseText,
        );
    } catch (error) {
      console.error(
        "Invalid organizations JSON:",
        error,
      );

      return null;
    }

    let organizations: OrganizationApiResponse[] =
      [];

    if (
      Array.isArray(
        responseData,
      )
    ) {
      organizations =
        responseData as OrganizationApiResponse[];
    } else if (
      responseData &&
      typeof responseData ===
        "object"
    ) {
      const body =
        responseData as {
          data?: unknown;
          organizations?: unknown;
        };

      if (
        Array.isArray(
          body.data,
        )
      ) {
        organizations =
          body.data as OrganizationApiResponse[];
      } else if (
        Array.isArray(
          body.organizations,
        )
      ) {
        organizations =
          body.organizations as OrganizationApiResponse[];
      }
    }

    console.log(
      "Organizations received:",
      organizations.length,
    );

    return organizations.map(
      mapOrganizationToTenant,
    );
  } catch (error) {
    console.error(
      "Failed to fetch organizations:",
      error,
    );

    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* ADMIN STORE PROVIDER                                                       */
/* -------------------------------------------------------------------------- */

export function AdminStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
   * Authentication is driven by the
   * actual access token.
   */
  const [
    accessToken,
    setAccessToken,
  ] = useState<string | null>(
    () => getAccessToken(),
  );

  const authed =
    Boolean(accessToken);

  const [
    theme,
    setTheme,
  ] =
    useState<"light" | "dark">(
      "light",
    );

  const [
    tenants,
    setTenants,
  ] =
    useState<Tenant[]>(
      SEED_TENANTS,
    );

  const [
    users,
    setUsers,
  ] =
    useState<User[]>([]);

  const [
    activity,
    setActivity,
  ] =
    useState<ActivityItem[]>(
      SEED_ACTIVITY,
    );

  const loadingTokenRef =
    useRef<string | null>(
      null,
    );

  /* ------------------------------------------------------------------------ */
  /* LOGIN                                                                    */
  /* ------------------------------------------------------------------------ */

  const login = useCallback(
    (
      receivedAccessToken: string,
    ) => {
      const cleanedToken =
        receivedAccessToken
          .trim()
          .replace(
            /^Bearer\s+/i,
            "",
          )
          .trim();

      if (!cleanedToken) {
        console.error(
          "Login failed: access token is empty.",
        );

        return;
      }

      console.log(
        "LOGIN TOKEN STORED:",
        {
          exists: true,

          length:
            cleanedToken.length,

          start:
            `${cleanedToken.substring(
              0,
              12,
            )}...`,
        },
      );

      window.localStorage.setItem(
        "accessToken",
        cleanedToken,
      );

      /*
       * Force the organization GET
       * to run for the new token.
       */
      loadingTokenRef.current =
        null;

      setAccessToken(
        cleanedToken,
      );
    },
    [],
  );

  /* ------------------------------------------------------------------------ */
  /* LOGOUT                                                                   */
  /* ------------------------------------------------------------------------ */

  const logout =
    useCallback(() => {
      window.localStorage.removeItem(
        "accessToken",
      );

      window.localStorage.removeItem(
        "refreshToken",
      );

      loadingTokenRef.current =
        null;

      setAccessToken(null);

      setTenants(
        SEED_TENANTS,
      );
    }, []);

  /* ------------------------------------------------------------------------ */
  /* LOAD ORGANIZATIONS                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    if (!accessToken) {
      return () => {
        cancelled = true;
      };
    }

    /*
     * Do not call the API twice with
     * the exact same token.
     */
    if (
      loadingTokenRef.current ===
      accessToken
    ) {
      return () => {
        cancelled = true;
      };
    }

    loadingTokenRef.current =
      accessToken;

    const load = async () => {
      const apiTenants =
        await fetchOrganizations(
          accessToken,
        );

      if (cancelled) {
        return;
      }

      if (apiTenants === null) {
        loadingTokenRef.current =
          null;

        return;
      }

      /*
       * Backend data replaces seed data.
       */
      setTenants(
        apiTenants,
      );
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  /* ------------------------------------------------------------------------ */
  /* THEME                                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        "los-theme",
      );

    if (
      stored === "dark" ||
      stored === "light"
    ) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark",
    );

    window.localStorage.setItem(
      "los-theme",
      theme,
    );
  }, [theme]);

  /* ------------------------------------------------------------------------ */
  /* ACTIVITY                                                                 */
  /* ------------------------------------------------------------------------ */

  const pushActivity =
    useCallback(
      (
        text: string,
        kind: ActivityItem["kind"],
      ) => {
        setActivity(
          (previous) => [
            {
              id: nextId("f"),

              text,

              at:
                new Date().toISOString(),

              kind,
            },

            ...previous,
          ],
        );
      },
      [],
    );

  /* ------------------------------------------------------------------------ */
  /* CREATE BANK                                                              */
  /* ------------------------------------------------------------------------ */

  const createTenant =
    useCallback(
      (input: BankInput) => {
        const now =
          new Date().toISOString();

        const tenant: Tenant = {
          id: nextId("tnt"),

          firstName:
            input.bankName,

          middleName: "",

          lastName: "",

          employeeId:
            input.licenseNo,

          email:
            input.contactEmail,

          mobile:
            input.contactPhone,

          organization:
            input.bankName,

          branches:
            input.branches.map(
              (branch) => ({
                id:
                  branch.id ||
                  nextId("br"),

                location:
                  branch.location,
              }),
            ),

          designation:
            input.designation ??
            "Relationship Manager",

          status:
            input.status ??
            "Active",

          createdAt: now,

          activity: [
            {
              id: nextId("act"),

              text:
                "Bank account created",

              at: now,
            },
          ],

          bankCode:
            input.bankCode,

          bankName:
            input.bankName,

          bankType:
            input.bankType,

          legalName:
            input.legalName,

          panNo:
            input.panNo,

          gstNo:
            input.gstNo,

          licenseNo:
            input.licenseNo,

          website:
            input.website,

          logoUrl:
            input.logoUrl,

          regulatoryDetails:
            input.regulatoryDetails,

          addressDetails:
            input.addressDetails,

          contactEmail:
            input.contactEmail,

          contactPhone:
            input.contactPhone,

          instituteName:
            input.bankName,

          instituteType:
            input.bankType,

          registrationNumber:
            input.licenseNo,

          cin:
            input.cin,

          /*
           * No regulatoryAuthorityId is required
           * for creating a Tenant in the frontend.
           *
           * If the API later returns one,
           * mapOrganizationToTenant() will preserve it.
           */
        };

        /*
         * If the caller happens to provide
         * a regulatory authority ID, preserve it.
         *
         * Create Bank does not provide it,
         * so normally this block does nothing.
         */
        if (
          input.regulatoryAuthorityId
        ) {
          tenant.regulatoryAuthorityId =
            input.regulatoryAuthorityId;
        }

        setTenants(
          (previous) => [
            tenant,
            ...previous,
          ],
        );

        pushActivity(
          `Bank '${input.bankName}' created`,
          "created",
        );

        return tenant;
      },
      [pushActivity],
    );

  /* ------------------------------------------------------------------------ */
  /* UPDATE BANK                                                              */
  /* ------------------------------------------------------------------------ */

  const updateTenant =
    useCallback(
      (
        id: string,
        input: BankInput,
      ) => {
        const now =
          new Date().toISOString();

        setTenants(
          (previous) =>
            previous.map(
              (tenant) => {
                if (
                  tenant.id !== id
                ) {
                  return tenant;
                }

                const updatedTenant: Tenant =
                  {
                    ...tenant,

                    bankCode:
                      input.bankCode,

                    bankName:
                      input.bankName,

                    bankType:
                      input.bankType,

                    legalName:
                      input.legalName,

                    panNo:
                      input.panNo,

                    gstNo:
                      input.gstNo,

                    licenseNo:
                      input.licenseNo,

                    website:
                      input.website,

                    logoUrl:
                      input.logoUrl,

                    regulatoryDetails:
                      input.regulatoryDetails,

                    addressDetails:
                      input.addressDetails,

                    contactEmail:
                      input.contactEmail,

                    contactPhone:
                      input.contactPhone,

                    instituteName:
                      input.bankName,

                    instituteType:
                      input.bankType,

                    registrationNumber:
                      input.licenseNo,

                    cin:
                      input.cin,

                    organization:
                      input.bankName,

                    firstName:
                      input.bankName,

                    email:
                      input.contactEmail,

                    mobile:
                      input.contactPhone,

                    employeeId:
                      input.licenseNo,

                    designation:
                      input.designation ??
                      tenant.designation,

                    status:
                      input.status ??
                      tenant.status,

                    branches:
                      input.branches.map(
                        (branch) => ({
                          id:
                            branch.id ||
                            nextId("br"),

                          location:
                            branch.location,
                        }),
                      ),

                    activity: [
                      {
                        id: nextId(
                          "act",
                        ),

                        text:
                          "Bank details updated",

                        at: now,
                      },

                      ...tenant.activity,
                    ],
                  };

                /*
                 * Only update regulatoryAuthorityId
                 * when the input actually contains one.
                 *
                 * Otherwise preserve the existing value.
                 */
                if (
                  input.regulatoryAuthorityId
                ) {
                  updatedTenant.regulatoryAuthorityId =
                    input.regulatoryAuthorityId;
                }

                return updatedTenant;
              },
            ),
        );

        pushActivity(
          `Bank '${input.bankName}' updated`,
          "updated",
        );
      },
      [pushActivity],
    );

  /* ------------------------------------------------------------------------ */
  /* CREATE USER                                                              */
  /* ------------------------------------------------------------------------ */

  const createUser =
    useCallback(
      (input: UserInput) => {
        const user: User = {
          ...input,

          id: nextId("usr"),

          createdAt:
            new Date().toISOString(),
        };

        setUsers(
          (previous) => [
            user,
            ...previous,
          ],
        );

        pushActivity(
          `User '${[
            input.firstName,
            input.middleName,
            input.lastName,
          ]
            .filter(Boolean)
            .join(" ")}' created`,
          "created",
        );

        return user;
      },
      [pushActivity],
    );

  /* ------------------------------------------------------------------------ */
  /* TOGGLE BANK STATUS                                                       */
  /* ------------------------------------------------------------------------ */

  const toggleTenantStatus =
    useCallback(
      (id: string) => {
        const now =
          new Date().toISOString();

        let changedBankName =
          "";

        let changedStatus:
          | TenantStatus
          | null = null;

        setTenants(
          (previous) =>
            previous.map(
              (tenant) => {
                if (
                  tenant.id !== id
                ) {
                  return tenant;
                }

                const newStatus: TenantStatus =
                  tenant.status ===
                  "Active"
                    ? "Inactive"
                    : "Active";

                changedBankName =
                  tenant.bankName;

                changedStatus =
                  newStatus;

                return {
                  ...tenant,

                  status:
                    newStatus,

                  activity: [
                    {
                      id: nextId(
                        "act",
                      ),

                      text:
                        `Status changed to ${newStatus}`,

                      at: now,
                    },

                    ...tenant.activity,
                  ],
                };
              },
            ),
        );

        if (
          changedBankName &&
          changedStatus
        ) {
          pushActivity(
            `Bank '${changedBankName}' status changed to ${changedStatus}`,
            "status",
          );
        }
      },
      [pushActivity],
    );

  /* ------------------------------------------------------------------------ */
  /* THEME                                                                    */
  /* ------------------------------------------------------------------------ */

  const toggleTheme =
    useCallback(() => {
      setTheme(
        (current) =>
          current === "dark"
            ? "light"
            : "dark",
      );
    }, []);

  /* ------------------------------------------------------------------------ */
  /* STORE VALUE                                                              */
  /* ------------------------------------------------------------------------ */

  const value =
    useMemo<AdminStore>(
      () => ({
        authed,

        adminName:
          "Pranav Jangam",

        login,

        logout,

        theme,

        toggleTheme,

        tenants,

        users,

        activity,

        createTenant,

        updateTenant,

        toggleTenantStatus,

        createUser,
      }),
      [
        authed,

        theme,

        tenants,

        users,

        activity,

        login,

        logout,

        toggleTheme,

        createTenant,

        updateTenant,

        toggleTenantStatus,

        createUser,
      ],
    );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* USE ADMIN STORE                                                            */
/* -------------------------------------------------------------------------- */

export function useAdminStore() {
  const ctx =
    useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useAdminStore must be used inside AdminStoreProvider",
    );
  }

  return ctx;
}

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

export function formatRelative(
  iso: string,
) {
  const diff =
    Date.now() -
    new Date(iso).getTime();

  const mins =
    Math.round(
      diff / 60000,
    );

  if (mins < 1) {
    return "just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours =
    Math.round(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.round(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  return new Date(
    iso,
  ).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    },
  );
}

export function formatDate(
  iso: string,
) {
  return new Date(
    iso,
  ).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}
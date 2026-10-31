import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  Building2,
  Edit,
  Mail,
  Phone,
  Plus,
  User,
} from "lucide-react";

import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TenantFormDrawer } from "@/components/TenantFormDrawer";
import { UserFormDrawer } from "@/components/UserFormDrawer";

import { getAccessToken, useAdminStore, type Tenant } from "@/lib/admin-store";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

import {
  mapOrganizationToTenant,
  type OrganizationApiResponse,
} from "@/lib/organization-mapper";

import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/* ROUTE                                                                      */
/* -------------------------------------------------------------------------- */

export const Route = createFileRoute("/tenants/$tenantId")({
  component: TenantDetailsPage,
});

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type TenantFormSubmit = Parameters<
  NonNullable<ComponentProps<typeof TenantFormDrawer>["onSubmit"]>
>[0];

type UserRecord = {
  id?: string | number;
  pkid?: string | number;

  first_name?: string;
  middle_name?: string;
  last_name?: string;

  firstName?: string;
  middleName?: string;
  lastName?: string;

  name?: string;

  email?: string;
  mobile?: string;
  phone?: string;

  employee_id?: string;
  employeeId?: string;

  designation?: string;
  status?: string;

  organization_id?: string | number;
  organizationId?: string | number;
};

type RawOrganization = OrganizationApiResponse & {
  registration_id?: string | null;

  country?: string | null;

  registered_address?: string | null;
  corporate_address?: string | null;

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
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ORGANIZATION_GET_URL = API_ENDPOINTS.organizations;

const BANK_UPDATE_URL = API_ENDPOINTS.banks;

const USERS_URL = API_ENDPOINTS.userManagementUsers;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getProvidedValue(
  source: Record<string, unknown> | undefined,
  keys: string[],
  fallback: unknown,
): unknown {
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }

  return fallback;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNestedRecord(
  source: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const value = source?.[key];

  return isRecord(value) ? value : undefined;
}

function getApiErrorMessage(
  body: unknown,
  status: number,
  action: string,
): string {
  if (isRecord(body)) {
    const message = body["message"] ?? body["error"] ?? body["detail"];
    const validationErrors = body["validationErrors"];
    const validationMessage =
      validationErrors && typeof validationErrors === "object"
        ? ` ${JSON.stringify(validationErrors)}`
        : "";

    if (message !== null && message !== undefined && String(message).trim()) {
      return `${String(message)}${validationMessage}`;
    }

    if (validationMessage) {
      return `Request validation failed.${validationMessage}`;
    }
  } else if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  return `${action} (${status}).`;
}

/* -------------------------------------------------------------------------- */
/* RESPONSE UNWRAPPER                                                         */
/* -------------------------------------------------------------------------- */

function unwrapOrganization(
  body: unknown,
  requestedId: string,
): RawOrganization {
  if (!isRecord(body) || Array.isArray(body)) {
    throw new Error("Invalid bank details response.");
  }

  const data = isRecord(body["data"]) ? body["data"] : undefined;
  const organization = data?.["organization"] ?? body["organization"];
  const bank = data?.["bank"] ?? body["bank"];
  const record =
    (isRecord(organization) && !Array.isArray(organization)
      ? organization
      : undefined) ??
    (isRecord(bank) && !Array.isArray(bank) ? bank : undefined) ??
    data ??
    body;

  if (Array.isArray(record)) {
    throw new Error("Bank details response did not contain a single bank.");
  }

  const numericPkid = Number(record["pkid"]);
  const pkid =
    Number.isSafeInteger(numericPkid) &&
    numericPkid > 0 &&
    String(numericPkid) === String(record["pkid"]).trim()
      ? numericPkid
      : undefined;
  const returnedId = record["id"];
  const id =
    returnedId !== null && returnedId !== undefined && String(returnedId).trim()
      ? String(returnedId).trim()
      : pkid !== undefined
        ? String(pkid)
        : requestedId;

  if (!id) {
    throw new Error("Bank details response did not include a valid bank ID.");
  }

  const hasBankDetails = [
    "bank_name",
    "bankName",
    "name",
    "institution_name",
    "institutionName",
    "bank_code",
    "bankCode",
  ].some((key) => {
    const value = record[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
  if (!hasBankDetails) {
    throw new Error(
      "The bank details response did not contain bank information.",
    );
  }

  return {
    ...(record as RawOrganization),
    id,
    ...(pkid === undefined ? {} : { pkid }),
  };
}

/* -------------------------------------------------------------------------- */
/* BUILD UPDATE PAYLOAD                                                       */
/* -------------------------------------------------------------------------- */

function buildBankUpdatePayload(
  input: TenantFormSubmit,
  currentTenant: Tenant,
  currentRaw?: RawOrganization,
) {
  const source = input as unknown as Record<string, unknown>;

  const regulatory = currentTenant.regulatoryDetails;
  const regulatoryInput = getNestedRecord(source, "regulatoryDetails");
  const addressInput = getNestedRecord(source, "addressDetails");

  const raw = currentRaw as Record<string, unknown> | undefined;

  const nested = getNestedRecord(raw, "regulatory_details");

  const getInput = (keys: string[], fallback: unknown = "") =>
    asString(getProvidedValue(source, keys, fallback)).trim();
  const getRegulatory = (key: string, fallback: unknown) =>
    asString(getProvidedValue(regulatoryInput, [key], fallback)).trim();
  const getAddress = (key: string, fallback: unknown) =>
    asString(getProvidedValue(addressInput, [key], fallback)).trim();
  const status =
    asString(
      getProvidedValue(source, ["status"], currentTenant.status ?? "Active"),
    ).toUpperCase() === "INACTIVE"
      ? "INACTIVE"
      : "ACTIVE";

  return {
    bank_code: getInput(["bankCode"], currentTenant.bankCode),
    bank_name: getInput(
      ["bankName", "instituteName"],
      currentTenant.bankName || currentTenant.instituteName,
    ),
    bank_type:
      getProvidedValue(
        source,
        ["bankType", "instituteType"],
        currentTenant.bankType,
      ) ?? "BANK",
    legal_name: getInput(["legalName"], currentTenant.legalName),
    pan_no: getInput(["panNo", "PAN"], currentTenant.panNo).toUpperCase(),
    gst_no: getInput(["gstNo", "GST"], currentTenant.gstNo).toUpperCase(),
    license_no: getInput(
      ["licenseNo", "registrationNumber"],
      currentTenant.licenseNo || currentTenant.registrationNumber,
    ),
    registration_number: getInput(
      ["registrationNumber", "licenseNo"],
      currentTenant.registrationNumber,
    ),
    cin: getInput(["cin", "CIN"], currentTenant.cin),
    website: getInput(["website"], currentTenant.website),
    logo_url: getInput(["logoUrl", "logo"], currentTenant.logoUrl),
    status,
    contact_email: getInput(["contactEmail"], currentTenant.contactEmail),
    contact_phone: getInput(["contactPhone"], currentTenant.contactPhone),

    direct_clg_member: getRegulatory(
      "directClgMember",
      regulatory?.directClgMember ??
        raw?.["direct_clg_member"] ??
        nested?.["direct_clg_member"],
    ),
    direct_member_iftas: getRegulatory(
      "directMemberIftas",
      regulatory?.directMemberIftas ??
        raw?.["direct_member_iftas"] ??
        nested?.["direct_member_iftas"],
    ),
    micr_code: getRegulatory(
      "micrCode",
      regulatory?.micrCode ?? raw?.["micr_code"] ?? nested?.["micr_code"],
    ),
    micr_number: getRegulatory(
      "micrNumber",
      regulatory?.micrNumber ?? raw?.["micr_number"] ?? nested?.["micr_number"],
    ),
    micr_city_code: getRegulatory(
      "micrCityCode",
      regulatory?.micrCityCode ??
        raw?.["micr_city_code"] ??
        nested?.["micr_city_code"],
    ),
    micr_branch_code: getRegulatory(
      "micrBranchCode",
      regulatory?.micrBranchCode ??
        raw?.["micr_branch_code"] ??
        nested?.["micr_branch_code"],
    ),
    ifsc_code: getRegulatory(
      "ifscCode",
      regulatory?.ifscCode ?? raw?.["ifsc_code"] ?? nested?.["ifsc_code"],
    ).toUpperCase(),
    number_of_branches: getRegulatory(
      "numberOfBranches",
      regulatory?.numberOfBranches ??
        raw?.["number_of_branches"] ??
        raw?.["no_of_branches"] ??
        nested?.["number_of_branches"] ??
        nested?.["no_of_branches"],
    ),
    sponsor_bank_for_clg: getRegulatory(
      "sponsorBankForClg",
      regulatory?.sponsorBankForClg ??
        raw?.["sponsor_bank_for_clg"] ??
        nested?.["sponsor_bank_for_clg"],
    ),
    sponsor_bank_for_iftas: getRegulatory(
      "sponsorBankForIftas",
      regulatory?.sponsorBankForIftas ??
        raw?.["sponsor_bank_for_iftas"] ??
        nested?.["sponsor_bank_for_iftas"],
    ),

    address_type: getAddress(
      "addressType",
      currentTenant.addressDetails?.addressType ?? raw?.["address_type"],
    ),
    unit_gala_name_no: getAddress(
      "unitGalaNameNo",
      currentTenant.addressDetails?.unitGalaNameNo ??
        raw?.["unit_gala_name_no"],
    ),
    street_road: getAddress(
      "streetRoad",
      currentTenant.addressDetails?.streetRoad ?? raw?.["street_road"],
    ),
    land_mark: getAddress(
      "landMark",
      currentTenant.addressDetails?.landMark ??
        raw?.["land_mark"] ??
        raw?.["landmark"],
    ),
    city: getAddress(
      "city",
      currentTenant.addressDetails?.city ?? raw?.["city"],
    ),
    state: getAddress(
      "state",
      currentTenant.addressDetails?.state ?? raw?.["state"],
    ),
    pin_code: getAddress(
      "pinCode",
      currentTenant.addressDetails?.pinCode ?? raw?.["pin_code"],
    ),
    country: getInput(["country"], raw?.["country"]),
    registered_address: getInput(
      ["registeredAddress"],
      raw?.["registered_address"],
    ),
    corporate_address: getInput(
      ["corporateAddress"],
      raw?.["corporate_address"],
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* UPDATE BANK API                                                            */
/* -------------------------------------------------------------------------- */

async function updateBank(
  bankId: string | number,
  payload: unknown,
): Promise<unknown> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Session expired. Please login again.");
  }

  const url = `${BANK_UPDATE_URL.replace(/\/$/, "")}/${encodeURIComponent(
    String(bankId),
  )}`;

  const sendRequest = async (method: "PUT" | "PATCH") => {
    const response = await fetch(url, {
      method,

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });

    const text = await response.text();

    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return {
      response,
      data,
    };
  };

  let result = await sendRequest("PUT");

  if (result.response.status === 405) {
    result = await sendRequest("PATCH");
  }

  if (!result.response.ok) {
    throw new Error(
      getApiErrorMessage(
        result.data,
        result.response.status,
        "Bank update failed",
      ),
    );
  }

  return result.data;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

function TenantDetailsPage() {
  const navigate = useNavigate();

  const { updateTenant } = useAdminStore();

  const params = Route.useParams();

  const tenantId = params.tenantId;

  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [rawBank, setRawBank] = useState<RawOrganization | null>(null);

  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);

  const [userDrawerOpen, setUserDrawerOpen] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* LOAD BANK DETAILS                                                      */
  /* ---------------------------------------------------------------------- */

  const loadBankDetails = useCallback(async () => {
    setTenant(null);
    setRawBank(null);
    setLoading(true);

    const token = getAccessToken();

    if (!token) {
      toast.error("Session expired. Please login again.");

      setLoading(false);
      return;
    }

    const bankId = tenantId.trim();

    if (!bankId) {
      toast.error("Invalid bank ID.");

      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${ORGANIZATION_GET_URL.replace(/\/$/, "")}/${encodeURIComponent(bankId)}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const text = await response.text();

      let body: unknown = null;

      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            body,
            response.status,
            "Failed to load bank details",
          ),
        );
      }

      const raw = unwrapOrganization(body, bankId);

      const mapped = mapOrganizationToTenant(raw);

      setRawBank(raw);
      setTenant(mapped);

      updateTenant(mapped.id, {
        bankCode: mapped.bankCode,

        bankName: mapped.bankName,

        bankType: mapped.bankType,

        legalName: mapped.legalName,

        panNo: mapped.panNo,

        gstNo: mapped.gstNo,

        cin: mapped.cin,

        licenseNo: mapped.licenseNo,

        website: mapped.website,

        logoUrl: mapped.logoUrl,

        regulatoryDetails: mapped.regulatoryDetails,

        addressDetails: mapped.addressDetails,

        contactEmail: mapped.contactEmail,

        contactPhone: mapped.contactPhone,

        branches: mapped.branches,

        instituteName: mapped.instituteName,

        instituteType: mapped.instituteType,

        registrationNumber: mapped.registrationNumber,

        status: mapped.status,

        designation: mapped.designation,
      });
    } catch (error) {
      console.error("Failed to load bank details:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to load bank details.",
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, updateTenant]);

  useEffect(() => {
    void loadBankDetails();
  }, [loadBankDetails]);

  /* ---------------------------------------------------------------------- */
  /* LOAD USERS                                                             */
  /* ---------------------------------------------------------------------- */

  const loadUsers = useCallback(async () => {
    setUsers([]);
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const bankId = tenantId.trim();

    if (!bankId) {
      return;
    }

    try {
      setLoadingUsers(true);

      const response = await fetch(USERS_URL, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to load users (${response.status}).`);
      }

      let body: unknown = null;

      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      let list: unknown = body;

      if (isRecord(body) && Array.isArray(body["data"])) {
        list = body["data"];
      }

      if (!Array.isArray(list)) {
        setUsers([]);
        return;
      }

      const bankUsers = list.filter((item): item is UserRecord => {
        if (!isRecord(item)) {
          return false;
        }

        const organizationId =
          item["organization_id"] ?? item["organizationId"];

        return String(organizationId ?? "") === bankId;
      });

      setUsers(bankUsers);
    } catch (error) {
      console.error("Failed to load users:", error);

      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* ---------------------------------------------------------------------- */
  /* EDIT BANK                                                              */
  /* ---------------------------------------------------------------------- */

  const handleBankUpdate = useCallback(
    async (input: TenantFormSubmit) => {
      if (!tenant) {
        return;
      }

      const bankId = tenant.pkid ?? tenant.id;

      if (!String(bankId).trim()) {
        toast.error("Bank ID is invalid.");

        return;
      }

      try {
        const payload = buildBankUpdatePayload(
          input,
          tenant,
          rawBank ?? undefined,
        );

        await updateBank(bankId, payload);

        const token = getAccessToken();

        if (!token) {
          throw new Error("Session expired. Please login again.");
        }

        const response = await fetch(
          `${ORGANIZATION_GET_URL.replace(/\/$/, "")}/${encodeURIComponent(
            String(bankId),
          )}`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const text = await response.text();

        let body: unknown = null;

        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = null;
          }
        }

        if (!response.ok) {
          throw new Error(
            `Bank was updated, but refreshed details could not be loaded. ${getApiErrorMessage(
              body,
              response.status,
              "Refresh failed",
            )}`,
          );
        }

        const refreshedRaw = unwrapOrganization(body, String(bankId));

        const refreshedTenant = mapOrganizationToTenant(refreshedRaw);

        setRawBank(refreshedRaw);

        setTenant(refreshedTenant);

        updateTenant(refreshedTenant.id, {
          bankCode: refreshedTenant.bankCode,

          bankName: refreshedTenant.bankName,

          bankType: refreshedTenant.bankType,

          legalName: refreshedTenant.legalName,

          panNo: refreshedTenant.panNo,

          gstNo: refreshedTenant.gstNo,

          cin: refreshedTenant.cin,

          licenseNo: refreshedTenant.licenseNo,

          website: refreshedTenant.website,

          logoUrl: refreshedTenant.logoUrl,

          regulatoryDetails: refreshedTenant.regulatoryDetails,

          addressDetails: refreshedTenant.addressDetails,

          contactEmail: refreshedTenant.contactEmail,

          contactPhone: refreshedTenant.contactPhone,

          branches: refreshedTenant.branches,

          instituteName: refreshedTenant.instituteName,

          instituteType: refreshedTenant.instituteType,

          registrationNumber: refreshedTenant.registrationNumber,

          status: refreshedTenant.status,

          designation: refreshedTenant.designation,
        });

        setEditOpen(false);

        toast.success("Bank details updated successfully.");
      } catch (error) {
        console.error("Bank update failed:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update bank details.",
        );

        throw error;
      }
    },
    [tenant, rawBank, updateTenant],
  );

  /* ---------------------------------------------------------------------- */
  /* DISPLAY VALUES                                                         */
  /* ---------------------------------------------------------------------- */

  const regulatory = tenant?.regulatoryDetails;

  const address = tenant?.addressDetails;

  const country = rawBank?.country ?? "-";

  const registeredAddress = rawBank?.registered_address ?? "-";

  const corporateAddress = rawBank?.corporate_address ?? "-";

  const micrNumber = regulatory?.micrNumber || rawBank?.micr_number || "-";

  const bankId = tenant?.pkid ?? tenant?.id ?? tenantId;

  const pageTitle = tenant?.bankName || tenant?.instituteName || "Bank Details";

  const usersCount = useMemo(() => users.length, [users]);

  /* ---------------------------------------------------------------------- */
  /* LOADING                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <AppShell title={pageTitle}>
        <div className="p-6">
          <div className="rounded-xl border bg-white p-8">
            Loading bank details...
          </div>
        </div>
      </AppShell>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* NOT FOUND                                                              */
  /* ---------------------------------------------------------------------- */

  if (!tenant) {
    return (
      <AppShell title={pageTitle}>
        <div className="p-6">
          <div className="rounded-xl border bg-white p-8">
            <p className="mb-4 text-lg font-semibold">Bank not found</p>

            <Button
              onClick={() =>
                navigate({
                  to: "/tenants",
                })
              }
            >
              Back to Banks
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* PAGE                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <AppShell title={pageTitle}>
      <div className="min-h-screen bg-slate-50 p-6">
        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate({
                  to: "/tenants",
                })
              }
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-slate-700" />

                <h1 className="text-2xl font-semibold text-slate-900">
                  {pageTitle}
                </h1>

                <StatusBadge status={tenant.status} />
              </div>

              <p className="mt-1 text-sm text-slate-500">Bank ID: {bankId}</p>
            </div>
          </div>

          <Button onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Bank
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* BANK DETAILS                                                     */}
        {/* ---------------------------------------------------------------- */}

        <section className="mb-6 rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Bank Details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Bank Code" value={tenant.bankCode} />

            <DetailItem
              label="Bank Name"
              value={tenant.bankName || tenant.instituteName}
            />

            <DetailItem label="Bank Type" value={tenant.bankType} />

            <DetailItem label="Legal Name" value={tenant.legalName} />

            <DetailItem label="PAN No." value={tenant.panNo} />

            <DetailItem label="GST No." value={tenant.gstNo} />

            <DetailItem
              label="License No."
              value={tenant.licenseNo || tenant.registrationNumber}
            />

            {/* <DetailItem
              label="CIN No."
              value={
                tenant.cin
              }
            /> */}

            <DetailItem label="Website" value={tenant.website} />

            {/* <DetailItem
              label="Contact Email"
              value={
                tenant.contactEmail
              }
              icon={
                <Mail className="h-4 w-4" />
              }
            />

            <DetailItem
              label="Contact Phone"
              value={
                tenant.contactPhone
              }
              icon={
                <Phone className="h-4 w-4" />
              }
            /> */}

            <DetailItem label="Status" value={tenant.status} />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* REGULATORY DETAILS                                               */}
        {/* ---------------------------------------------------------------- */}

        <section className="mb-6 rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Regulatory Details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="Direct CLG Member"
              value={regulatory?.directClgMember}
            />

            <DetailItem
              label="Direct Member IFTAS"
              value={regulatory?.directMemberIftas}
            />

            <DetailItem label="MICR Code" value={regulatory?.micrCode} />

            <DetailItem label="MICR Number" value={micrNumber} />

            <DetailItem
              label="MICR City Code"
              value={regulatory?.micrCityCode}
            />

            <DetailItem
              label="MICR Branch Code"
              value={regulatory?.micrBranchCode}
            />

            <DetailItem label="IFSC Code" value={regulatory?.ifscCode} />

            <DetailItem
              label="Number of Branches"
              value={regulatory?.numberOfBranches}
            />

            <DetailItem
              label="Sponsor Bank for CLG"
              value={regulatory?.sponsorBankForClg}
            />

            <DetailItem
              label="Sponsor Bank for IFTAS"
              value={regulatory?.sponsorBankForIftas}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* ADDRESS DETAILS                                                  */}
        {/* ---------------------------------------------------------------- */}

        <section className="mb-6 rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Address Details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Address Type" value={address?.addressType} />

            <DetailItem
              label="Unit / Gala Name & No."
              value={address?.unitGalaNameNo}
            />

            <DetailItem label="Street / Road" value={address?.streetRoad} />

            <DetailItem label="Land Mark" value={address?.landMark} />

            <DetailItem label="City" value={address?.city} />

            <DetailItem label="State" value={address?.state} />

            <DetailItem label="PIN Code" value={address?.pinCode} />

            <DetailItem label="Country" value={country} />

            <DetailItem label="Registered Address" value={registeredAddress} />

            <DetailItem label="Corporate Address" value={corporateAddress} />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* USERS                                                             */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Users</h2>

              <p className="text-sm text-slate-500">
                {usersCount} user
                {usersCount === 1 ? "" : "s"} associated with this bank
              </p>
            </div>

            <Button onClick={() => setUserDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {loadingUsers ? (
            <div className="p-6 text-sm text-slate-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <User className="mb-3 h-10 w-10 text-slate-300" />

              <p className="mb-1 font-medium text-slate-700">No users found</p>

              <p className="mb-4 text-sm text-slate-500">
                Add a user to this bank.
              </p>

              <Button onClick={() => setUserDrawerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user, index) => {
                const firstName = user.first_name ?? user.firstName ?? "";

                const lastName = user.last_name ?? user.lastName ?? "";

                const name =
                  user.name ||
                  `${firstName} ${lastName}`.trim() ||
                  "Unnamed User";

                return (
                  <div
                    key={String(user.id ?? user.pkid ?? index)}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{name}</p>

                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                        {user.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {user.email}
                          </span>
                        )}

                        {(user.mobile || user.phone) && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {user.mobile || user.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {user.designation || "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {user.status || "Active"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* EDIT BANK DRAWER                                                   */}
      {/* ------------------------------------------------------------------ */}

      <TenantFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={tenant}
        onSubmit={handleBankUpdate}
      />

      {/* ------------------------------------------------------------------ */}
      {/* ADD USER DRAWER                                                    */}
      {/* ------------------------------------------------------------------ */}

      <UserFormDrawer
        open={userDrawerOpen}
        bank={tenant}
        onOpenChange={(nextOpen) => {
          setUserDrawerOpen(nextOpen);

          if (!nextOpen) {
            void loadUsers();
          }
        }}
      />
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* DETAIL ITEM                                                                */
/* -------------------------------------------------------------------------- */

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number | null | undefined;
  icon?: ReactNode;
}) {
  const display =
    value === null || value === undefined || String(value).trim() === ""
      ? "-"
      : String(value);

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        {icon && <span className="text-slate-400">{icon}</span>}

        <span className="break-words">{display}</span>
      </div>
    </div>
  );
}

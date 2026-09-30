import type { Tenant } from "@/lib/admin-store";

export type OrganizationApiResponse = {
  id?: string;
  pkid?: number;
  name?: string;
  type?: string;
  institution_name?: string;
  institution_type?: string;
  registration_number?: string;
  registration_id?: string;
  regulatory_authority?: string;
  regulatory_authority_id?: string;
  cin?: string;
  cin_no?: string;
  cin_number?: string;
  regulatory_status?: string;
  status?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
};

export function mapOrganizationToTenant(o: OrganizationApiResponse): Tenant {
  const instituteName = o.institution_name ?? o.name ?? "";
  const backendStatus = o.status ?? o.regulatory_status ?? "ACTIVE";

  return {
    id: o.id ?? String(o.pkid ?? crypto.randomUUID()),
    pkid: o.pkid,
    firstName: "",
    middleName: "",
    lastName: "",
    employeeId: "",
    email: o.contact_email ?? "",
    mobile: o.contact_phone ?? "",
    organization: instituteName,
    designation: "Relationship Manager",
    instituteName,
    instituteType: o.institution_type ?? o.type ?? "",
    registrationNumber: o.registration_number ?? o.registration_id ?? "",
    regulatoryAuthorityId: o.regulatory_authority_id ?? o.regulatory_authority ?? "",
    cin: o.cin_no ?? o.cin_number ?? o.cin ?? "",
    contactEmail: o.contact_email ?? "",
    contactPhone: o.contact_phone ?? "",
    status: backendStatus.toUpperCase() === "ACTIVE" ? "Active" : "Inactive",
    createdAt: o.created_at ?? new Date().toISOString(),
    activity: [],
    branches: [],
  } as Tenant;
}

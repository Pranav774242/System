import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { type Branch, type Tenant } from "@/lib/admin-store";
import { AdminApiError, postAdminJson } from "@/lib/admin-api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

type AddUserForm = {
  employee_id: string;
  // name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE" | "OPERATIVE";
  mobile: string;
  date_of_birth: string;
  email: string;
  password: string;
  designation: string;
  role: string;
  failed_login_attempts: string;
  multi_branch_enabled: boolean;
  login_branch: string;
  holiday_login_allowed: boolean;
  login_time: string;
  logout_time: string;
  two_factor_enabled: boolean;
  gender: "MALE" | "FEMALE" | "OTHER";
};

type AddUserPayload = {
  organization_id: number;
  organization_code?: string;
  emp_no: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  status: "ACTIVE" | "INACTIVE" | "OPERATIVE";
  mobile: string;
  dob: string;
  email: string;
  password: string;
  designation: string;
  role: string;
  no_of_bad_logins: number;
  allow_multibranch: number;
  login_branch: number;
  allow_login_in_holidays: number;
  login_time: string;
  logout_time: string;
  "2fA": boolean;
  gender: "MALE" | "FEMALE" | "OTHER";
};

type FormErrors = Partial<Record<keyof AddUserForm, string>>;

const emptyForm: AddUserForm = {
  employee_id: "",
  // name: "",
  firstName: "",
  middleName: "",
  lastName: "",
  status: "OPERATIVE",
  mobile: "",
  date_of_birth: "",
  email: "",
  password: "",
  designation: "",
  role: "",
  failed_login_attempts: "0",
  multi_branch_enabled: false,
  login_branch: "",
  holiday_login_allowed: false,
  login_time: "",
  logout_time: "",
  two_factor_enabled: false,
  gender: "MALE",
};

const DESIGNATIONS = [
  "Relationship Manager",
  "Branch Manager",
  "Operations Head",
  "Credit Analyst",
  "Regional Director",
  "Compliance Officer",
];

const ROLES = ["SUPER_ADMIN", "ADMIN", "MAKER", "CHECKER", "VIEWER"];

function validateForm(
  form: AddUserForm,
  bankPkid: number | undefined,
): FormErrors {
  const errors: FormErrors = {};

  if (bankPkid == null) {
    errors.employee_id = "Selected bank ID is missing";
  }

  const employeeId = form.employee_id.trim();
  if (!employeeId) {
    errors.employee_id = "Employee ID is required";
  } else if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(employeeId)) {
    errors.employee_id =
      "Use letters, numbers, periods, underscores, slashes, or hyphens only";
  }

  const firstName = form.firstName.trim();
  if (!firstName) {
    errors.firstName = "First name is required";
  } else if (!isValidPersonName(firstName)) {
    errors.firstName =
      "Enter a valid name using letters and common punctuation";
  }

  const middleName = form.middleName.trim();
  if (middleName && !isValidPersonName(middleName)) {
    errors.middleName =
      "Enter a valid name using letters and common punctuation";
  }

  const lastName = form.lastName.trim();
  if (!lastName) {
    errors.lastName = "Last name is required";
  } else if (!isValidPersonName(lastName)) {
    errors.lastName = "Enter a valid name using letters and common punctuation";
  }

  if (!["ACTIVE", "INACTIVE", "OPERATIVE"].includes(form.status)) {
    errors.status = "Status is required";
  }

  if (!form.date_of_birth.trim()) {
    errors.date_of_birth = "Date of birth is required";
  } else {
    const dateParts = form.date_of_birth.split("-").map(Number);
    const year = dateParts[0] ?? Number.NaN;
    const month = dateParts[1] ?? Number.NaN;
    const day = dateParts[2] ?? Number.NaN;
    const dateOfBirth = new Date(year, month - 1, day);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth) ||
      dateOfBirth.getFullYear() !== year ||
      dateOfBirth.getMonth() !== month - 1 ||
      dateOfBirth.getDate() !== day
    ) {
      errors.date_of_birth = "Enter a valid date of birth";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateOfBirth > today) {
        errors.date_of_birth = "Date of birth cannot be in the future";
      }
    }
  }

  const email = form.email.trim();
  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!form.password.trim()) {
    errors.password = "Password is required";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  const mobile = form.mobile.trim();
  if (!mobile) {
    errors.mobile = "Mobile number is required";
  } else if (!/^(?:\+91)?[6-9]\d{9}$/.test(mobile)) {
    errors.mobile = "Enter a valid Indian mobile number";
  }

  if (!["MALE", "FEMALE", "OTHER"].includes(form.gender)) {
    errors.gender = "Gender is required";
  }

  if (!DESIGNATIONS.includes(form.designation)) {
    errors.designation = "Designation is required";
  }

  if (!ROLES.includes(form.role)) {
    errors.role = "Role is required";
  }

  const failedLoginAttempts = form.failed_login_attempts.trim();
  if (
    !failedLoginAttempts ||
    !/^\d+$/.test(failedLoginAttempts) ||
    !Number.isSafeInteger(Number(failedLoginAttempts)) ||
    Number(failedLoginAttempts) < 0
  ) {
    errors.failed_login_attempts =
      "Enter a valid number of failed login attempts";
  }

  if (!form.login_time.trim()) {
    errors.login_time = "Login time is required";
  } else if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(form.login_time)) {
    errors.login_time = "Select a valid login time";
  }

  if (!form.logout_time.trim()) {
    errors.logout_time = "Logout time is required";
  } else if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(form.logout_time)) {
    errors.logout_time = "Select a valid logout time";
  }

  return errors;
}

function isValidPersonName(value: string): boolean {
  return (
    /^[\p{L}\p{M}]+(?:[ '\u2019.-][\p{L}\p{M}]+)*$/u.test(value) &&
    /\p{L}/u.test(value)
  );
}

function getServerFieldErrors(
  error: unknown,
): Partial<Record<keyof AddUserForm, string>> {
  if (!(error instanceof AdminApiError) || !error.validationErrors) {
    return {};
  }

  const fieldAliases: Record<string, keyof AddUserForm> = {
    employeeid: "employee_id",
    empno: "employee_id",
    firstname: "firstName",
    middlename: "middleName",
    lastname: "lastName",
    dateofbirth: "date_of_birth",
    dob: "date_of_birth",
    email: "email",
    password: "password",
    mobile: "mobile",
    gender: "gender",
    designation: "designation",
    role: "role",
    status: "status",
    failedloginattempts: "failed_login_attempts",
    noofbadlogins: "failed_login_attempts",
    loginbranch: "login_branch",
    logintime: "login_time",
    logouttime: "logout_time",
  };
  const errors: Partial<Record<keyof AddUserForm, string>> = {};

  for (const [key, value] of Object.entries(error.validationErrors)) {
    const field = fieldAliases[key.toLowerCase().replace(/[^a-z]/g, "")];
    if (!field) continue;

    const message = Array.isArray(value)
      ? value.find((item): item is string => typeof item === "string")
      : typeof value === "string"
        ? value
        : value &&
            typeof value === "object" &&
            "message" in value &&
            typeof value.message === "string"
          ? value.message
          : undefined;

    if (message?.trim()) {
      errors[field] = message.trim();
    }
  }

  return errors;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Pick<Tenant, "id" | "pkid" | "instituteName"> & {
    organization_code?: string;
    branches: Branch[];
  };
};

export function UserFormDrawer({ open, onOpenChange, bank }: Props) {
  const [form, setForm] = useState<AddUserForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof AddUserForm>>(
    () => new Set(),
  );
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<keyof AddUserForm, string>>
  >({});
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    setForm(emptyForm);
    setSubmitted(false);
    setBusy(false);
    setTouchedFields(new Set());
    setServerErrors({});
    submittingRef.current = false;
  }, [open, bank.id, bank.pkid, bank.instituteName, bank.organization_code]);

  const set = <K extends keyof AddUserForm>(key: K, value: AddUserForm[K]) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setServerErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const loginBranchOptions = bank.branches.filter(
    (branch) =>
      /^\d+$/.test(branch.id) && Number.isSafeInteger(Number(branch.id)),
  );
  const errors = validateForm(form, bank.pkid);
  const fieldError = (key: keyof AddUserForm) =>
    submitted || touchedFields.has(key)
      ? (errors[key] ?? serverErrors[key] ?? "")
      : "";
  const save = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitted(true);

    const currentErrors = validateForm(form, bank.pkid);
    if (Object.values(currentErrors).some(Boolean)) {
      submittingRef.current = false;
      return;
    }

    if (bank.pkid == null) {
      toast.error("Selected bank ID is missing");
      submittingRef.current = false;
      return;
    }

    const payload: AddUserPayload = {
      organization_id: bank.pkid,
      ...(bank.organization_code
        ? { organization_code: bank.organization_code }
        : {}),

      emp_no: form.employee_id.trim(),

      first_name: form.firstName.trim(),
      middle_name: form.middleName.trim(),
      last_name: form.lastName.trim(),

      dob: form.date_of_birth,
      email: form.email.trim(),
      password: form.password,
      mobile: form.mobile.trim(),

      gender: form.gender,
      designation: form.designation,
      role: form.role,

      "2fA": form.two_factor_enabled,

      status: form.status,

      allow_multibranch: Number(form.multi_branch_enabled),
      login_branch: Number(form.login_branch),
      allow_login_in_holidays: Number(form.holiday_login_allowed),

      login_time: form.login_time,
      logout_time: form.logout_time,

      no_of_bad_logins: Number(form.failed_login_attempts),
    };
    setBusy(true);

    try {
      await postAdminJson(API_ENDPOINTS.userManagementUsers, payload);

      toast.success("User created successfully");
      setForm(emptyForm);
      setSubmitted(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Create user API error:", error);
      setServerErrors(getServerFieldErrors(error));

      toast.error(
        error instanceof Error ? error.message : "Unable to create user",
      );
    } finally {
      setBusy(false);
      submittingRef.current = false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>Add User</SheetTitle>

          <SheetDescription>
            Create a user for the LOS administration team.
          </SheetDescription>
        </SheetHeader>

        <div
          className="flex-1 space-y-7 px-6 py-6"
          onBlurCapture={(event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const field = target.dataset["validationKey"] as
              keyof AddUserForm | undefined;
            if (field && field in emptyForm) {
              setTouchedFields((previous) => {
                if (previous.has(field)) return previous;
                const next = new Set(previous);
                next.add(field);
                return next;
              });
            }
          }}
        >
          {/* ACCOUNT DETAILS */}
          <section className="space-y-4">
            <SectionHeading>Account Details</SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Employee ID"
                required
                error={fieldError("employee_id")}
              >
                <Input
                  data-validation-key="employee_id"
                  value={form.employee_id}
                  onChange={(event) => set("employee_id", event.target.value)}
                  placeholder="Employee ID"
                />
              </Field>

              <Field label="Bank ID">
                <Input
                  value={bank.pkid != null ? String(bank.pkid) : ""}
                  disabled
                  placeholder="Bank ID"
                />

                {/* <p className="text-xs text-muted-foreground">
                  Automatically taken from selected bank
                  pkid.
                </p> */}
              </Field>

              <Field label="Email ID" required error={fieldError("email")}>
                <Input
                  data-validation-key="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="user@example.com"
                />
              </Field>

              <Field label="Password" required error={fieldError("password")}>
                <Input
                  data-validation-key="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => set("password", event.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </Field>
            </div>
          </section>

          {/* PERSONAL DETAILS */}
          <section className="space-y-4">
            <SectionHeading>Personal Details</SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* <Field
                label="Name of User"
                required
                error={fieldError("name")}
              >
                <Input
                  value={form.name}
                  onChange={(event) =>
                    set(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Full name"
                />
              </Field> */}

              <Field
                label="First Name"
                required
                error={fieldError("firstName")}
              >
                <Input
                  data-validation-key="firstName"
                  value={form.firstName}
                  onChange={(event) => set("firstName", event.target.value)}
                  placeholder="First name"
                />
              </Field>

              <Field label="Middle Name" error={fieldError("middleName")}>
                <Input
                  data-validation-key="middleName"
                  value={form.middleName}
                  onChange={(event) => set("middleName", event.target.value)}
                  placeholder="Middle name"
                />
              </Field>

              <Field label="Last Name" required error={fieldError("lastName")}>
                <Input
                  data-validation-key="lastName"
                  value={form.lastName}
                  onChange={(event) => set("lastName", event.target.value)}
                  placeholder="Last name"
                />
              </Field>

              <Field label="Mobile" required error={fieldError("mobile")}>
                <Input
                  data-validation-key="mobile"
                  type="tel"
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(event) => set("mobile", event.target.value)}
                  placeholder="+919876543210"
                />
              </Field>

              <Field
                label="Date of Birth"
                required
                error={fieldError("date_of_birth")}
              >
                <Input
                  data-validation-key="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) => set("date_of_birth", event.target.value)}
                />
              </Field>

              <Field label="Gender" required error={fieldError("gender")}>
                <Select
                  value={form.gender}
                  onValueChange={(value) =>
                    set("gender", value as AddUserForm["gender"])
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    data-validation-key="gender"
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>

                    <SelectItem value="FEMALE">Female</SelectItem>

                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* ORGANIZATION DETAILS */}
          <section className="space-y-4">
            <SectionHeading>Organization Details</SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Designation"
                required
                error={fieldError("designation")}
              >
                <Select
                  value={form.designation}
                  onValueChange={(value) => set("designation", value)}
                >
                  <SelectTrigger
                    className="w-full"
                    data-validation-key="designation"
                  >
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>

                  <SelectContent>
                    {DESIGNATIONS.map((designation) => (
                      <SelectItem key={designation} value={designation}>
                        {designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="User Role" required error={fieldError("role")}>
                <Select
                  value={form.role}
                  onValueChange={(value) => set("role", value)}
                >
                  <SelectTrigger className="w-full" data-validation-key="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>

                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status" required error={fieldError("status")}>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    set("status", value as AddUserForm["status"])
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    data-validation-key="status"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="OPERATIVE">OPERATIVE</SelectItem>

                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>

                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="No. of Bad Login"
                required
                error={fieldError("failed_login_attempts")}
              >
                <Input
                  data-validation-key="failed_login_attempts"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.failed_login_attempts}
                  onChange={(event) =>
                    set("failed_login_attempts", event.target.value)
                  }
                  placeholder="0"
                />
              </Field>
            </div>
          </section>

          {/* BRANCH SETTINGS */}
          <section className="space-y-4">
            <SectionHeading>Branch Settings</SectionHeading>

            <div className="grid gap-4">
              <BooleanField
                label="Allow MultiBranch"
                checked={form.multi_branch_enabled}
                onCheckedChange={(checked) =>
                  set("multi_branch_enabled", checked)
                }
              />

              <Field label="Login Branch">
                <Select
                  value={form.login_branch}
                  onValueChange={(value) => set("login_branch", value)}
                >
                  <SelectTrigger
                    className="w-full"
                    data-validation-key="login_branch"
                  >
                    <SelectValue placeholder="Select Login Branch" />
                  </SelectTrigger>

                  <SelectContent>
                    {loginBranchOptions.length === 0 ? (
                      <div
                        className="px-2 py-1.5 text-sm text-muted-foreground"
                        role="status"
                      >
                        No branches are available.
                      </div>
                    ) : (
                      loginBranchOptions.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* LOGIN SETTINGS */}
          <section className="space-y-4">
            <SectionHeading>Login Settings</SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Login Time"
                required
                error={fieldError("login_time")}
              >
                <Input
                  data-validation-key="login_time"
                  type="time"
                  value={form.login_time}
                  onChange={(event) => set("login_time", event.target.value)}
                />
              </Field>

              <Field
                label="Logout Time"
                required
                error={fieldError("logout_time")}
              >
                <Input
                  data-validation-key="logout_time"
                  type="time"
                  value={form.logout_time}
                  onChange={(event) => set("logout_time", event.target.value)}
                />
              </Field>

              <BooleanField
                label="Allow Login on Holidays"
                checked={form.holiday_login_allowed}
                onCheckedChange={(checked) =>
                  set("holiday_login_allowed", checked)
                }
              />

              <BooleanField
                label="Allow 2FA Authentication"
                checked={form.two_factor_enabled}
                onCheckedChange={(checked) =>
                  set("two_factor_enabled", checked)
                }
              />
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-card px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button className="w-full sm:w-auto" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save User"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
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
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label>
        {label}

        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {children}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function BooleanField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-border px-3">
      <Label>{label}</Label>

      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
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

import { useAdminStore, type Tenant, type UserInput } from "@/lib/admin-store";
import { postAdminJson } from "@/lib/admin-api";

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
  bank_id: number;
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
  failed_login_attempts: number;
  multi_branch_enabled: boolean;
  login_branch: string;
  holiday_login_allowed: boolean;
  login_time: string;
  logout_time: string;
  two_factor_enabled: boolean;
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

const BRANCH_OPTIONS = [
  { label: "Head Office", value: 0 },
  { label: "Branch 001", value: 1 },
  { label: "Branch 002", value: 2 },
  { label: "Branch 003", value: 3 },
  { label: "Branch 004", value: 4 },
];

function validateForm(form: AddUserForm, bankPkid: number | undefined): FormErrors {
  const errors: FormErrors = {};

  if (bankPkid == null) {
    errors.employee_id = "Selected bank ID is missing";
  }

  if (!form.employee_id.trim()) {
    errors.employee_id = "Employee ID is required";
  }

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required";
  }

  // if (!form.middleName.trim()) {
  //   errors.middleName = "Middle name is required";
  // }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!form.status) {
    errors.status = "Status is required";
  }

  if (!form.date_of_birth) {
    errors.date_of_birth = "Date of birth is required";
  } else if (new Date(`${form.date_of_birth}T00:00:00`) > new Date()) {
    errors.date_of_birth = "Date of birth cannot be in the future";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!form.mobile.trim()) {
    errors.mobile = "Mobile number is required";
  } else if (!/^(?:\+91)?[6-9]\d{9}$/.test(form.mobile.trim())) {
    errors.mobile = "Enter a valid Indian mobile number";
  }

  if (!form.gender) {
    errors.gender = "Gender is required";
  }

  if (!form.designation) {
    errors.designation = "Designation is required";
  }

  if (!form.role) {
    errors.role = "Role is required";
  }

  if (!form.failed_login_attempts.trim() || !/^\d+$/.test(form.failed_login_attempts)) {
    errors.failed_login_attempts = "Enter a valid number of failed login attempts";
  }

  if (!form.login_branch) {
    errors.login_branch = "Login branch is required";
  }

  if (!form.login_time) {
    errors.login_time = "Login time is required";
  }

  if (!form.logout_time) {
    errors.logout_time = "Logout time is required";
  }

  return errors;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Pick<Tenant, "id" | "pkid" | "instituteName">;
};

export function UserFormDrawer({ open, onOpenChange, bank }: Props) {
  const { createUser } = useAdminStore();

  const [form, setForm] = useState<AddUserForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(emptyForm);
    setSubmitted(false);
    setBusy(false);
  }, [open, bank]);

  const set = <K extends keyof AddUserForm>(key: K, value: AddUserForm[K]) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const errors = validateForm(form, bank.pkid);

  const fieldError = (key: keyof AddUserForm) => (submitted ? errors[key] : "");

  const toggleBranch = (branch: string) => {
    setForm((previous) => {
      const exists = previous.multi_branch_enabled.includes(branch);

      return {
        ...previous,
        multi_branch_enabled: exists
          ? previous.multi_branch_enabled.filter((item) => item !== branch)
          : [...previous.multi_branch_enabled, branch],
      };
    });
  };
  const save = async () => {
    setSubmitted(true);

    if (Object.values(errors).some(Boolean)) return;

    if (bank.pkid == null) {
      toast.error("Selected bank ID is missing");
      return;
    }

    // const payload: AddUserPayload = {
    //   organization_id: bank.pkid,
    //   employee_id: form.employee_id.trim(),

    //   first_name: form.firstName.trim(),
    //   middle_name: form.middleName.trim(),
    //   last_name: form.lastName.trim(),

    //   status: form.status,
    //   mobile: form.mobile.trim(),
    //   dob: form.date_of_birth,
    //   email: form.email.trim(),
    //   password: form.password,
    //   designation: form.designation,
    //   role: form.role,
    //   failed_login_attempts: Number(form.failed_login_attempts),
    //   multi_branch_enabled: form.multi_branch_enabled,

    //   // FIX
    //   login_branch: Number(form.login_branch),

    //   holiday_login_allowed: form.holiday_login_allowed,
    //   login_time: form.login_time,
    //   logout_time: form.logout_time,
    //   2fA: form.two_factor_enabled,
    //   gender: form.gender,
    // };

    const payload: AddUserPayload = {
      organization_id: bank.pkid,
      organization_code: bank.organization_code,

      emp_no: form.employee_id.trim(),

      first_name: form.firstName.trim(),
      middle_name: form.middleName.trim(),
      last_name: form.lastName.trim(),

      dob: form.date_of_birth,
      // username: form.username.trim(),
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
    console.log("Create User Payload:", payload);

    setBusy(true);

    try {
      await postAdminJson(
        "https://los-backend-355v.onrender.com/api/v1/administration/user-management/users",
        payload,
      );

      toast.success("User created successfully");
      setForm(emptyForm);
      setSubmitted(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Create user API error:", error);

      toast.error(error instanceof Error ? error.message : "Unable to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>Add User</SheetTitle>

          <SheetDescription>Create a user for the LOS administration team.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 px-6 py-6">
          {/* ACCOUNT DETAILS */}
          <section className="space-y-4">
            <SectionHeading>Account Details</SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee ID" required error={fieldError("employee_id")}>
                <Input
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
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="user@example.com"
                />
              </Field>

              <Field label="Password" required error={fieldError("password")}>
                <Input
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

              <Field label="First Name" required error={fieldError("firstName")}>
                <Input
                  value={form.firstName}
                  onChange={(event) => set("firstName", event.target.value)}
                  placeholder="First name"
                />
              </Field>

              <Field label="Middle Name">
                <Input
                  value={form.middleName}
                  onChange={(event) => set("middleName", event.target.value)}
                  placeholder="Middle name"
                />
              </Field>

              <Field label="Last Name" required error={fieldError("lastName")}>
                <Input
                  value={form.lastName}
                  onChange={(event) => set("lastName", event.target.value)}
                  placeholder="Last name"
                />
              </Field>

              <Field label="Mobile" required error={fieldError("mobile")}>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(event) =>
                    set("mobile", event.target.value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, ""))
                  }
                  placeholder="+919876543210"
                />
              </Field>

              <Field label="Date of Birth" required error={fieldError("date_of_birth")}>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) => set("date_of_birth", event.target.value)}
                />
              </Field>

              <Field label="Gender" required error={fieldError("gender")}>
                <Select
                  value={form.gender}
                  onValueChange={(value) => set("gender", value as AddUserForm["gender"])}
                >
                  <SelectTrigger className="w-full">
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
              <Field label="Designation" required error={fieldError("designation")}>
                <Select
                  value={form.designation}
                  onValueChange={(value) => set("designation", value)}
                >
                  <SelectTrigger className="w-full">
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
                <Select value={form.role} onValueChange={(value) => set("role", value)}>
                  <SelectTrigger className="w-full">
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
                  onValueChange={(value) => set("status", value as AddUserForm["status"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="OPERATIVE">OPERATIVE</SelectItem>

                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>

                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="No. of Bad Login" required error={fieldError("failed_login_attempts")}>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.failed_login_attempts}
                  onChange={(event) => set("failed_login_attempts", event.target.value)}
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
                onCheckedChange={(checked) => set("multi_branch_enabled", checked)}
              />

              <Field label="Login Branch" required error={fieldError("login_branch")}>
                <select
                  value={form.login_branch}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      login_branch: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Login Branch</option>

                  {BRANCH_OPTIONS.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* LOGIN SETTINGS */}
          <section className="space-y-4">
            <SectionHeading>Login Settings</SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Login Time" required error={fieldError("login_time")}>
                <Input
                  type="time"
                  value={form.login_time}
                  onChange={(event) => set("login_time", event.target.value)}
                />
              </Field>

              <Field label="Logout Time" required error={fieldError("logout_time")}>
                <Input
                  type="time"
                  value={form.logout_time}
                  onChange={(event) => set("logout_time", event.target.value)}
                />
              </Field>

              <BooleanField
                label="Allow Login on Holidays"
                checked={form.holiday_login_allowed}
                onCheckedChange={(checked) => set("holiday_login_allowed", checked)}
              />

              <BooleanField
                label="Allow 2FA Authentication"
                checked={form.two_factor_enabled}
                onCheckedChange={(checked) => set("two_factor_enabled", checked)}
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

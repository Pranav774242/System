import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAdminStore, type Tenant, type UserInput } from "@/lib/admin-store";
import { postAdminJson } from "@/lib/admin-api";

type AddUserForm = {
  employeeNumber: string;
  bankId: string;
  email: string;
  password: string;
  twoFactorEnabled: boolean;
  status: "ACTIVE" | "INACTIVE";
  name: string;
  dateOfBirth: string;
  mobile: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  designation: string;
  role: "SUPER_ADMIN";
  mainBranchAccess: boolean;
  loginBranch: string;
  holidayLogin: boolean;
};

type AddUserPayload = {
  EmpNo: string;
  bank_id: number;
  email: string;
  password: string;
  "2fA": boolean;
  Status: "ACTIVE" | "INACTIVE";
  Name: string;
  DOB: string;
  Mobile: string;
  Gender: "MALE" | "FEMALE" | "OTHER";
  Designation: string;
  Role: "SUPER_ADMIN";
  M_Br_access: boolean;
  Login_Branch: string;
  Holiday_Login: boolean;
};

type FormErrors = Partial<Record<keyof AddUserForm, string>>;

const emptyForm: AddUserForm = {
  employeeNumber: "",
  bankId: "",
  email: "",
  password: "",
  twoFactorEnabled: false,
  status: "ACTIVE",
  name: "",
  dateOfBirth: "",
  mobile: "",
  gender: "MALE",
  designation: "",
  role: "SUPER_ADMIN",
  mainBranchAccess: false,
  loginBranch: "",
  holidayLogin: false,
};

function validateForm(form: AddUserForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.employeeNumber.trim()) errors.employeeNumber = "Employee number is required";

  const bankId = Number(form.bankId);
  if (!form.bankId.trim()) {
    errors.bankId = "Bank ID is required";
  } else if (!Number.isSafeInteger(bankId) || bankId <= 0) {
    errors.bankId = "Enter a valid numeric bank ID";
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

  if (!form.status) errors.status = "Status is required";
  if (!form.name.trim()) errors.name = "Name is required";

  if (!form.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required";
  } else if (new Date(`${form.dateOfBirth}T00:00:00`) > new Date()) {
    errors.dateOfBirth = "Date of birth cannot be in the future";
  }

  if (!/^(?:\+91)?[6-9]\d{9}$/.test(form.mobile.trim())) {
    errors.mobile = "Enter a valid Indian mobile number";
  }
  if (!form.gender) errors.gender = "Gender is required";
  if (!form.designation.trim()) errors.designation = "Designation is required";
  if (!form.role) errors.role = "Role is required";
  if (!form.loginBranch.trim()) errors.loginBranch = "Login branch is required";
  return errors;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Pick<Tenant, "id" | "instituteName">;
};

export function UserFormDrawer({ open, onOpenChange, bank }: Props) {
  const { createUser } = useAdminStore();
  const [form, setForm] = useState<AddUserForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm,
      bankId: /^\d+$/.test(bank.id) ? bank.id : "",
    });
    setSubmitted(false);
    setBusy(false);
  }, [open, bank]);

  const set = <K extends keyof AddUserForm>(key: K, value: AddUserForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const errors = validateForm(form);
  const fieldError = (key: keyof AddUserForm) => (submitted ? errors[key] : "");

  const save = async () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;

    const payload: AddUserPayload = {
      EmpNo: form.employeeNumber.trim(),
      bank_id: Number(form.bankId),
      email: form.email.trim(),
      password: form.password,
      "2fA": form.twoFactorEnabled,
      Status: form.status,
      Name: form.name.trim(),
      DOB: form.dateOfBirth,
      Mobile: form.mobile.trim(),
      Gender: form.gender,
      Designation: form.designation.trim(),
      Role: form.role,
      M_Br_access: form.mainBranchAccess,
      Login_Branch: form.loginBranch.trim(),
      Holiday_Login: form.holidayLogin,
    };

    setBusy(true);
    try {
      await postAdminJson(
        "https://los-backend-355v.onrender.com/api/v1/administration/user-management/users",
        payload,
      );

      const localUser: UserInput = {
        bankId: String(payload.bank_id),
        bankName: bank.instituteName,
        firstName: payload.Name,
        middleName: "",
        lastName: "",
        employeeId: payload.EmpNo,
        designation: payload.Designation,
        officialEmail: payload.email,
        mobileNumber: payload.Mobile,
        branch: payload.Login_Branch,
        organization: payload.M_Br_access ? "Head Quarter" : "Branch",
      };
      createUser(localUser);
      toast.success("User created successfully");
      setForm(emptyForm);
      setSubmitted(false);
      onOpenChange(false);
    } catch (error) {
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
          <section className="space-y-4">
            <SectionHeading>Account Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee Number" required error={fieldError("employeeNumber")}>
                <Input value={form.employeeNumber} onChange={(event) => set("employeeNumber", event.target.value)} />
              </Field>
              <Field label="Bank ID" required error={fieldError("bankId")}>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={form.bankId}
                  onChange={(event) => set("bankId", event.target.value)}
                  placeholder="Numeric bank ID"
                />
              </Field>
              <Field label="Email" required error={fieldError("email")}>
                <Input type="email" autoComplete="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
              </Field>
              <Field label="Password" required error={fieldError("password")}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => set("password", event.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading>Personal Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={fieldError("name")}>
                <Input value={form.name} onChange={(event) => set("name", event.target.value)} />
              </Field>
              <Field label="Date of Birth" required error={fieldError("dateOfBirth")}>
                <Input type="date" value={form.dateOfBirth} onChange={(event) => set("dateOfBirth", event.target.value)} />
              </Field>
              <Field label="Mobile" required error={fieldError("mobile")}>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(event) => set("mobile", event.target.value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, ""))}
                  placeholder="+919876543210"
                />
              </Field>
              <Field label="Gender" required error={fieldError("gender")}>
                <Select value={form.gender} onValueChange={(value) => set("gender", value as AddUserForm["gender"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading>Organization Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Designation" required error={fieldError("designation")}>
                <Input value={form.designation} onChange={(event) => set("designation", event.target.value)} />
              </Field>
              <Field label="Role" required error={fieldError("role")}>
                <Select value={form.role} onValueChange={(value) => set("role", value as AddUserForm["role"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SUPER_ADMIN">Super Admin</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Status" required error={fieldError("status")}>
                <Select value={form.status} onValueChange={(value) => set("status", value as AddUserForm["status"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Login Branch" required error={fieldError("loginBranch")}>
                <Input value={form.loginBranch} onChange={(event) => set("loginBranch", event.target.value)} placeholder="Branch code" />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading>Access Settings</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <BooleanField label="2FA" checked={form.twoFactorEnabled} onCheckedChange={(checked) => set("twoFactorEnabled", checked)} />
              <BooleanField label="Main Branch Access" checked={form.mainBranchAccess} onCheckedChange={(checked) => set("mainBranchAccess", checked)} />
              <BooleanField label="Holiday Login" checked={form.holidayLogin} onCheckedChange={(checked) => set("holidayLogin", checked)} />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-card px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="outline" className="w-full sm:w-auto" disabled={busy} onClick={() => onOpenChange(false)}>
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
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>;
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
      <Label>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
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

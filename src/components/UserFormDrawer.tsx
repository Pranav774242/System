import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminStore, type Tenant, type UserInput } from "@/lib/admin-store";

const emptyForm: UserInput = {
  bankId: "",
  bankName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  employeeId: "",
  designation: "",
  officialEmail: "",
  mobileNumber: "",
  branch: "",
  organization: "Head Quarter",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Pick<Tenant, "id" | "instituteName">;
};

export function UserFormDrawer({ open, onOpenChange, bank }: Props) {
  const { createUser } = useAdminStore();
  const [form, setForm] = useState<UserInput>(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setForm((previous) => ({ ...previous, bankId: bank.id, bankName: bank.instituteName }));
      setSubmitted(false);
    }
  }, [open, bank]);

  const set = <K extends keyof UserInput>(key: K, value: UserInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const errors = {
    firstName: !form.firstName.trim() ? "First name is required" : "",
    lastName: !form.lastName.trim() ? "Last name is required" : "",
    employeeId: !form.employeeId.trim() ? "Employee ID is required" : "",
    designation: !form.designation.trim() ? "Designation is required" : "",
    officialEmail: !form.officialEmail.trim()
      ? "Official email is required"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail.trim())
        ? "Enter a valid email address"
        : "",
    mobileNumber: !/^[6-9]\d{9}$/.test(form.mobileNumber.trim())
      ? "Enter a valid 10-digit mobile number starting with 6-9"
      : "",
    branch: !form.branch.trim() ? "Branch is required" : "",
    organization: !form.organization ? "Organization is required" : "",
  };

  const save = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
   createUser({
  ...form,
  firstName: form.firstName.trim(),
  middleName: form.middleName?.trim() || "",
  lastName: form.lastName.trim(),
  employeeId: form.employeeId.trim(),
  designation: form.designation.trim(),
  officialEmail: form.officialEmail.trim(),
  mobileNumber: form.mobileNumber.trim(),
  branch: form.branch.trim(),
});
    toast.success("User created successfully");
    setForm(emptyForm);
    setSubmitted(false);
    onOpenChange(false);
  };

  const fieldError = (key: keyof typeof errors) => (submitted ? errors[key] : "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>Add User</SheetTitle>
          <SheetDescription>Create a user for the LOS administration team.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-7 px-6 py-6">
          <section className="space-y-4">
            <SectionHeading>Personal Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="First Name" required error={fieldError("firstName")}><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
              <Field label="Middle Name"><Input value={form.middleName} onChange={(e) => set("middleName", e.target.value)} /></Field>
              <Field label="Last Name" required error={fieldError("lastName")}><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
            </div>
          </section>
          <section className="space-y-4">
            <SectionHeading>Employee Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Employee ID" required error={fieldError("employeeId")}><Input value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} /></Field>
              <Field label="Designation" required error={fieldError("designation")}><Input value={form.designation} onChange={(e) => set("designation", e.target.value)} /></Field>
            </div>
          </section>
          <section className="space-y-4">
            <SectionHeading>Contact Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Official Email" required error={fieldError("officialEmail")}><Input type="email" value={form.officialEmail} onChange={(e) => set("officialEmail", e.target.value)} /></Field>
              <Field label="Mobile Number" required error={fieldError("mobileNumber")}><Input inputMode="numeric" maxLength={10} value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value.replace(/\D/g, ""))} /></Field>
            </div>
          </section>
          <section className="space-y-4">
            <SectionHeading>Organization Details</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Branch" required error={fieldError("branch")}><Input value={form.branch} onChange={(e) => set("branch", e.target.value)} /></Field>
              <Field label="Organization" required error={fieldError("organization")}>
                <Select value={form.organization} onValueChange={(value) => set("organization", value as UserInput["organization"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Head Quarter">Head Quarter</SelectItem><SelectItem value="Branch">Branch</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save User</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

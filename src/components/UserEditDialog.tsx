import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAccessToken } from "@/lib/admin-store";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

/* ========================================================= */
/* TYPES                                                      */
/* ========================================================= */

export type EditableUser = {
  id: number;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  gender?: string;
  date_of_birth?: string;
  dob?: string;
  designation?: string;
  multi_branch_access?: boolean;
  allow_multibranch?: boolean;
  two_fa_enabled?: boolean;
  holiday_login?: boolean;
  allow_login_in_holidays?: boolean;
  inactive_session_timeout?: number;
};

type FormState = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  mobile: string;
  gender: string;
  dob: string;
  designation: string;
  multi_branch_access: boolean;
  two_fa_enabled: boolean;
  holiday_login: boolean;
  inactive_session_timeout: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EditableUser;
  organizationId: number; // Added organizationId prop
  /** Called after a successful save so the page can refresh its data */
  onSaved?: () => void;
};

/* ========================================================= */
/* API                                                        */
/* ========================================================= */

async function updateUser(id: number, payload: Record<string, unknown>) {
  const token = getAccessToken();
  if (!token) throw new Error("Unauthorized / session expired");

  const response = await fetch(
    `${API_ENDPOINTS.legacyUsers}/${encodeURIComponent(String(id))}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (response.status === 401)
    throw new Error("Unauthorized / session expired");
  if (response.status === 403)
    throw new Error("You do not have permission to edit this user");

  let body: { success?: boolean; message?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    // ignore invalid JSON
  }

  if (!response.ok || body?.success === false) {
    throw new Error(
      body?.message || `Unable to update user (${response.status})`,
    );
  }

  return body;
}

/* ========================================================= */
/* HELPERS                                                    */
/* ========================================================= */

function toForm(u: EditableUser): FormState {
  return {
    first_name: u.first_name ?? "",
    middle_name: u.middle_name ?? "",
    last_name: u.last_name ?? "",
    email: u.email ?? "",
    mobile: u.mobile ?? "",
    gender: u.gender ?? "",
    dob: u.date_of_birth || u.dob || "",
    designation: u.designation ?? "",
    multi_branch_access: u.multi_branch_access ?? u.allow_multibranch ?? false,
    two_fa_enabled: u.two_fa_enabled ?? false,
    holiday_login: u.holiday_login ?? u.allow_login_in_holidays ?? false,
    inactive_session_timeout: String(u.inactive_session_timeout ?? ""),
  };
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* ========================================================= */
/* COMPONENT                                                  */
/* ========================================================= */

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  organizationId,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(user));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [saving, setSaving] = useState(false);

  console.log(organizationId, "organizationId in UserEditDialog");

  // Reset the form to the latest user data every time the popup opens
  useEffect(() => {
    if (open) {
      setForm(toForm(user));
      setErrors({});
    }
  }, [open, user]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.first_name.trim()) next.first_name = "First name is required";
    if (!form.last_name.trim()) next.last_name = "Last name is required";

    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address";

    if (form.mobile.trim() && !/^\d{10}$/.test(form.mobile.trim()))
      next.mobile = "Enter a 10-digit mobile number";

    if (form.inactive_session_timeout) {
      const n = Number(form.inactive_session_timeout);
      if (!Number.isInteger(n) || n < 60)
        next.inactive_session_timeout = "Minimum 60 seconds";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      organization_id: organizationId, // Include organizationId in the payload
      mobile: form.mobile.trim(),
      gender: form.gender || undefined,
      dob: form.dob || undefined,
      designation: form.designation.trim(),
      multi_branch_access: form.multi_branch_access,
      two_fa_enabled: form.two_fa_enabled,
      holiday_login: form.holiday_login,
      inactive_session_timeout: form.inactive_session_timeout
        ? Number(form.inactive_session_timeout)
        : undefined,
    };

    try {
      setSaving(true);
      await updateUser(user.id, payload);
      toast.success("User updated successfully");
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update personal details and login settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Personal */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">Personal details</h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="First name" required error={errors.first_name}>
                <input
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </Field>
              <Field label="Middle name">
                <input
                  className={inputClass}
                  value={form.middle_name}
                  onChange={(e) => set("middle_name", e.target.value)}
                />
              </Field>
              <Field label="Last name" required error={errors.last_name}>
                <input
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Mobile number" error={errors.mobile}>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                  value={form.mobile}
                  onChange={(e) =>
                    set("mobile", e.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
              <Field label="Gender">
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Date of birth">
                <input
                  type="date"
                  className={inputClass}
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Designation">
              <input
                className={inputClass}
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
              />
            </Field>
          </section>

          {/* Access */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Login & access</h3>

            <ToggleRow
              label="Two-factor authentication"
              description="Ask for a verification code at login."
              checked={form.two_fa_enabled}
              onChange={(v) => set("two_fa_enabled", v)}
            />
            <ToggleRow
              label="Multi-branch access"
              description="Allow this user to work across branches."
              checked={form.multi_branch_access}
              onChange={(v) => set("multi_branch_access", v)}
            />
            <ToggleRow
              label="Holiday login"
              description="Allow login on bank holidays."
              checked={form.holiday_login}
              onChange={(v) => set("holiday_login", v)}
            />

            <div className="sm:w-1/2">
              <Field
                label="Session timeout (seconds)"
                error={errors.inactive_session_timeout}
              >
                <input
                  inputMode="numeric"
                  className={inputClass}
                  value={form.inactive_session_timeout}
                  onChange={(e) =>
                    set(
                      "inactive_session_timeout",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                />
              </Field>
            </div>
          </section>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

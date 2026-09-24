import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ShieldCheck, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — System Administrator Panel" },
      {
        name: "description",
        content:
          "Secure two-factor sign in to the Banking LOS System Administrator Panel: email, password and one-time passcode.",
      },
      { property: "og:title", content: "Sign in — System Administrator Panel" },
      {
        property: "og:description",
        content: "Secure two-factor sign in to the Banking LOS System Administrator Panel.",
      },
    ],
  }),
  component: LoginPage,
});

function BrandPanel() {
  return (
    <div className="brand-gradient relative hidden flex-col justify-between p-12 lg:flex">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-white/10 backdrop-blur">
          <ShieldCheck className="size-6 text-accent" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">Banking LOS</p>
          <p className="text-xs text-white/60">Loan Origination Platform</p>
        </div>
      </div>

      <div className="max-w-md">
        <h2 className="text-4xl font-bold leading-tight text-white">
          The control room for your <span className="text-gradient-accent">lending network</span>.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Onboard NBFCs and banks, administer branches and keep every tenant of your origination
          platform in view — from one panel.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            ["10", "Tenants"],
            ["18", "Branches"],
            ["99.9%", "Uptime"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xl font-bold text-white">{v}</p>
              <p className="text-xs text-white/60">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/40">
        Demo environment — no real credentials are stored or verified.
      </p>
    </div>
  );
}

function LoginPage() {
  const { login, authed } = useAdminStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("admin@bankinglos.com");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (authed) navigate({ to: "/dashboard", replace: true });
  }, [authed, navigate]);

  useEffect(() => {
    if (step !== 2 || seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const otpValue = otp.join("");

const submitCredentials = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!emailValid || password.length < 6) return;

  setBusy(true);

  try {
    const response = await fetch(
      "https://los-backend-355v.onrender.com/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "Login failed");
      return;
    }

    console.log("Login API response:", data);

    setStep(2);
    setSeconds(30);

    toast.success("OTP sent to your registered email and mobile");

    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 150);
  } catch (error) {
    console.error("Login API error:", error);
    toast.error("Unable to connect to server");
  } finally {
    setBusy(false);
  }
};

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      login();
      toast.success("Welcome back, Administrator");
      navigate({ to: "/dashboard" });
    }, 800);
  };

  const setDigit = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setOtp((prev) => prev.map((d, idx) => (idx === i ? "" : d)));
      return;
    }
    setOtp((prev) => {
      const next = [...prev];
      digits.split("").forEach((d, offset) => {
        if (i + offset < 6) next[i + offset] = d;
      });
      return next;
    });
    const target = Math.min(i + digits.length, 5);
    inputs.current[target]?.focus();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <p className="font-semibold">Banking LOS</p>
          </div>

          <div className="mb-8 flex items-center gap-2">
            {[1, 2].map((s) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  step >= s ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>

          {step === 1 ? (
            <form onSubmit={submitCredentials} className="animate-rise space-y-5" key="step1">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">System Administrator Panel</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to manage tenants across your origination platform.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="admin@yourbank.com"
                  />
                </div>
                {email.length > 0 && !emailValid && (
                  <p className="text-xs text-destructive">Enter a valid email address.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-9"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={busy || !emailValid || password.length < 6}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Login"}
                {!busy && <ArrowRight className="size-4" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="animate-rise space-y-6" key="step2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Verify it's you</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the OTP sent to your registered email/mobile.
                </p>
              </div>

              <div className="flex gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
                    }}
                    className="h-14 w-full rounded-xl border border-input bg-card text-center text-lg font-semibold outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                {seconds > 0 ? (
                  <span className="text-muted-foreground">Resend OTP in {seconds}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSeconds(30);
                      toast.success("A new OTP has been sent");
                    }}
                    className="font-medium text-accent hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Change email
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={busy || otpValue.length !== 6}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

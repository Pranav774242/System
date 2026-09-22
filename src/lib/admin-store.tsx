import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TenantStatus = "Active" | "Inactive";

export type Branch = { id: string; location: string };

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
  activity: { id: string; text: string; at: string }[];
};

export type ActivityItem = {
  id: string;
  text: string;
  at: string;
  kind: "created" | "updated" | "status" | "info";
};

export const DESIGNATIONS = [
  "Relationship Manager",
  "Branch Manager",
  "Operations Head",
  "Credit Analyst",
  "Regional Director",
  "Compliance Officer",
];

export function tenantFullName(t: Tenant) {
  return [t.firstName, t.middleName, t.lastName].filter(Boolean).join(" ");
}

export function initials(t: Tenant) {
  return `${t.firstName[0] ?? ""}${t.lastName[0] ?? ""}`.toUpperCase();
}

let idSeq = 1000;
export const nextId = (prefix = "id") => `${prefix}-${++idSeq}`;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function makeTenant(
  partial: Omit<Tenant, "id" | "createdAt" | "activity" | "branches"> & { branches: string[] },
  createdDaysAgo: number,
): Tenant {
  const createdAt = daysAgo(createdDaysAgo);
  return {
    ...partial,
    id: nextId("tnt"),
    branches: partial.branches.map((location) => ({ id: nextId("br"), location })),
    createdAt,
    activity: [
      { id: nextId("act"), text: "Tenant account created", at: createdAt },
      {
        id: nextId("act"),
        text: `Status set to ${partial.status}`,
        at: daysAgo(Math.max(createdDaysAgo - 1, 0)),
      },
    ],
  };
}

const SEED_TENANTS: Tenant[] = [
  makeTenant(
    {
      firstName: "Aarav",
      middleName: "K",
      lastName: "Mehta",
      employeeId: "EMP-10241",
      email: "aarav.mehta@abcfinance.in",
      mobile: "+91 98200 41253",
      organization: "ABC Finance Ltd",
      branches: ["Mumbai — Andheri East", "Mumbai — Lower Parel", "Pune — Kothrud"],
      designation: "Regional Director",
      status: "Active",
    },
    62,
  ),
  makeTenant(
    {
      firstName: "Priya",
      lastName: "Raghavan",
      employeeId: "EMP-10388",
      email: "priya.raghavan@sundarbancorp.com",
      mobile: "+91 99401 77812",
      organization: "Sundar Bank Corp",
      branches: ["Chennai — T Nagar", "Coimbatore — RS Puram"],
      designation: "Branch Manager",
      status: "Active",
    },
    54,
  ),
  makeTenant(
    {
      firstName: "Rohit",
      middleName: "S",
      lastName: "Deshpande",
      employeeId: "EMP-10412",
      email: "rohit.deshpande@vistaracredit.in",
      mobile: "+91 98670 22110",
      organization: "Vistara Credit NBFC",
      branches: ["Nagpur — Sitabuldi"],
      designation: "Operations Head",
      status: "Inactive",
    },
    47,
  ),
  makeTenant(
    {
      firstName: "Neha",
      lastName: "Kulkarni",
      employeeId: "EMP-10503",
      email: "neha.kulkarni@grihafinserv.com",
      mobile: "+91 93726 55401",
      organization: "Griha Finserv",
      branches: ["Bengaluru — Indiranagar", "Bengaluru — Whitefield", "Mysuru — Saraswathipuram"],
      designation: "Relationship Manager",
      status: "Active",
    },
    38,
  ),
  makeTenant(
    {
      firstName: "Imran",
      middleName: "A",
      lastName: "Qureshi",
      employeeId: "EMP-10577",
      email: "imran.qureshi@northstarbank.in",
      mobile: "+91 90045 31287",
      organization: "Northstar Bank",
      branches: ["Delhi — Connaught Place", "Noida — Sector 62"],
      designation: "Credit Analyst",
      status: "Active",
    },
    30,
  ),
  makeTenant(
    {
      firstName: "Sneha",
      lastName: "Iyer",
      employeeId: "EMP-10644",
      email: "sneha.iyer@auricapital.com",
      mobile: "+91 98450 11239",
      organization: "Auri Capital",
      branches: ["Hyderabad — Banjara Hills"],
      designation: "Compliance Officer",
      status: "Inactive",
    },
    24,
  ),
  makeTenant(
    {
      firstName: "Vikram",
      middleName: "R",
      lastName: "Nair",
      employeeId: "EMP-10702",
      email: "vikram.nair@keralagold.in",
      mobile: "+91 94470 87654",
      organization: "Kerala Gold Finance",
      branches: ["Kochi — MG Road", "Thrissur — Round West", "Kozhikode — Mavoor Road"],
      designation: "Branch Manager",
      status: "Active",
    },
    17,
  ),
  makeTenant(
    {
      firstName: "Ananya",
      lastName: "Bose",
      employeeId: "EMP-10788",
      email: "ananya.bose@bengalcreditunion.in",
      mobile: "+91 98310 45560",
      organization: "Bengal Credit Union",
      branches: ["Kolkata — Salt Lake", "Howrah — Shibpur"],
      designation: "Operations Head",
      status: "Active",
    },
    11,
  ),
  makeTenant(
    {
      firstName: "Karan",
      lastName: "Sethi",
      employeeId: "EMP-10841",
      email: "karan.sethi@punjabagrifin.in",
      mobile: "+91 98140 99021",
      organization: "Punjab Agri Finance",
      branches: ["Ludhiana — Model Town"],
      designation: "Relationship Manager",
      status: "Active",
    },
    5,
  ),
  makeTenant(
    {
      firstName: "Meera",
      middleName: "J",
      lastName: "Pillai",
      employeeId: "EMP-10902",
      email: "meera.pillai@zenithhousing.com",
      mobile: "+91 99000 76432",
      organization: "Zenith Housing Finance",
      branches: ["Ahmedabad — Navrangpura", "Surat — Adajan"],
      designation: "Credit Analyst",
      status: "Active",
    },
    2,
  ),
];

const SEED_ACTIVITY: ActivityItem[] = [
  { id: nextId("f"), text: "Tenant 'Zenith Housing Finance' created", at: daysAgo(2), kind: "created" },
  { id: nextId("f"), text: "Product 'Gold Loan' updated", at: daysAgo(3), kind: "updated" },
  {
    id: nextId("f"),
    text: "Rule 'Max LTV 75%' assigned to Gold Loan",
    at: daysAgo(4),
    kind: "info",
  },
  {
    id: nextId("f"),
    text: "Tenant 'Auri Capital' status changed to Inactive",
    at: daysAgo(6),
    kind: "status",
  },
  { id: nextId("f"), text: "Tenant 'Punjab Agri Finance' created", at: daysAgo(5), kind: "created" },
  { id: nextId("f"), text: "Product 'Vehicle Loan' created", at: daysAgo(8), kind: "created" },
  {
    id: nextId("f"),
    text: "Rule 'Min CIBIL 700' assigned to Personal Loan",
    at: daysAgo(9),
    kind: "info",
  },
];

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
  { product: "Gold Loan", tenants: 9 },
  { product: "Personal Loan", tenants: 7 },
  { product: "Business Loan", tenants: 5 },
  { product: "Vehicle Loan", tenants: 4 },
  { product: "Home Loan", tenants: 3 },
];

export type TenantInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  employeeId: string;
  email: string;
  mobile: string;
  organization: string;
  branches: string[];
  designation: string;
  status: TenantStatus;
};

type AdminStore = {
  authed: boolean;
  adminName: string;
  login: () => void;
  logout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  tenants: Tenant[];
  activity: ActivityItem[];
  createTenant: (input: TenantInput) => Tenant;
  updateTenant: (id: string, input: TenantInput) => void;
  toggleTenantStatus: (id: string) => void;
};

const Ctx = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tenants, setTenants] = useState<Tenant[]>(SEED_TENANTS);
  const [activity, setActivity] = useState<ActivityItem[]>(SEED_ACTIVITY);

  useEffect(() => {
    const stored = window.localStorage.getItem("los-theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("los-theme", theme);
  }, [theme]);

  const pushActivity = useCallback((text: string, kind: ActivityItem["kind"]) => {
    setActivity((prev) => [
      { id: nextId("f"), text, at: new Date().toISOString(), kind },
      ...prev,
    ]);
  }, []);

  const createTenant = useCallback(
    (input: TenantInput) => {
      const now = new Date().toISOString();
      const tenant: Tenant = {
        ...input,
        id: nextId("tnt"),
        branches: input.branches.map((location) => ({ id: nextId("br"), location })),
        createdAt: now,
        activity: [{ id: nextId("act"), text: "Tenant account created", at: now }],
      };
      setTenants((prev) => [tenant, ...prev]);
      pushActivity(`Tenant '${input.organization}' created`, "created");
      return tenant;
    },
    [pushActivity],
  );

  const updateTenant = useCallback(
    (id: string, input: TenantInput) => {
      const now = new Date().toISOString();
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...input,
                branches: input.branches.map((location) => ({ id: nextId("br"), location })),
                activity: [
                  { id: nextId("act"), text: "Tenant details updated", at: now },
                  ...t.activity,
                ],
              }
            : t,
        ),
      );
      pushActivity(`Tenant '${input.organization}' updated`, "updated");
    },
    [pushActivity],
  );

  const toggleTenantStatus = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const status: TenantStatus = t.status === "Active" ? "Inactive" : "Active";
          return {
            ...t,
            status,
            activity: [
              { id: nextId("act"), text: `Status changed to ${status}`, at: now },
              ...t.activity,
            ],
          };
        }),
      );
      const t = tenants.find((x) => x.id === id);
      if (t) {
        pushActivity(
          `Tenant '${t.organization}' status changed to ${t.status === "Active" ? "Inactive" : "Active"}`,
          "status",
        );
      }
    },
    [pushActivity, tenants],
  );

  const value = useMemo<AdminStore>(
    () => ({
      authed,
      adminName: "Pranav Jangam",
      login: () => setAuthed(true),
      logout: () => setAuthed(false),
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      tenants,
      activity,
      createTenant,
      updateTenant,
      toggleTenantStatus,
    }),
    [authed, theme, tenants, activity, createTenant, updateTenant, toggleTenantStatus],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be used inside AdminStoreProvider");
  return ctx;
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

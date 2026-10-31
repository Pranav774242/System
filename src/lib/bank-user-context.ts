export type BankUserContext = {
  organizationId: string;
  bankName?: string;
  organizationCode?: string;
  branches?: { id: string; location: string }[];
};

export const BANK_USER_CONTEXT_STORAGE_KEY = "bank-users-context";

export function storeBankUserContext(context: BankUserContext): void {
  try {
    sessionStorage.setItem(
      BANK_USER_CONTEXT_STORAGE_KEY,
      JSON.stringify(context),
    );
  } catch {
    // Session storage may be unavailable in restricted browser contexts.
  }
}

export function getStoredBankUserContext(): BankUserContext | null {
  try {
    const stored = sessionStorage.getItem(BANK_USER_CONTEXT_STORAGE_KEY);
    if (!stored) return null;

    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== "object") return null;

    const context = value as Record<string, unknown>;
    const organizationId = context["organizationId"];
    if (
      (typeof organizationId !== "string" &&
        typeof organizationId !== "number") ||
      String(organizationId).trim() === ""
    ) {
      return null;
    }

    return {
      organizationId: String(organizationId),
      ...(typeof context["bankName"] === "string" && {
        bankName: context["bankName"],
      }),
      ...(typeof context["organizationCode"] === "string" && {
        organizationCode: context["organizationCode"],
      }),
      ...(Array.isArray(context["branches"])
        ? {
            branches: context["branches"].flatMap((branch) => {
              if (!branch || typeof branch !== "object") return [];
              const candidate = branch as Record<string, unknown>;
              if (
                typeof candidate["id"] !== "string" ||
                typeof candidate["location"] !== "string"
              ) {
                return [];
              }
              return [
                {
                  id: candidate["id"],
                  location: candidate["location"],
                },
              ];
            }),
          }
        : {}),
    };
  } catch {
    return null;
  }
}

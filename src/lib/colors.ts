import type { AccountType } from "./types";

/** Color estable por tipo de cuenta (las cuentas no tienen color propio). */
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ahorros: "#0D9488",
  corriente: "#2563EB",
  fiduciaria: "#7C3AED",
  billetera: "#DB2777",
  efectivo: "#059669",
  tarjeta_credito: "#EA580C",
  otro: "#64748B",
};

export function accountColor(accountType: AccountType): string {
  return ACCOUNT_TYPE_COLORS[accountType] ?? "#64748B";
}

export const TYPE_COLORS: Record<string, string> = {
  income: "#15803d",
  expense: "#c2410c",
  transfer: "#2563EB",
  debt_payment: "#868E96",
  savings_contribution: "#0D9488",
  savings_withdrawal: "#B45309",
  space_contribution: "#7C3AED",
};

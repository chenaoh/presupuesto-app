import { DEFAULT_ACCENT } from "./brand";
import type { AccountType, CategoryKind } from "./types";

export const STORAGE_KEY = "presupuesto-app:v1";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ahorros: "Ahorros",
  corriente: "Corriente",
  fiduciaria: "Fiduciaria",
  billetera: "Billetera digital",
  efectivo: "Efectivo",
  tarjeta_credito: "Tarjeta de crédito",
  otro: "Otro",
};

export const BASE_INSTITUTIONS = [
  "Bancolombia",
  "Davivienda",
  "BBVA",
  "Nequi",
  "Daviplata",
  "Fiduciaria",
  "Efectivo",
  "Otro",
];

export const BASE_CATEGORIES: Array<{
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}> = [
  { name: "Salario", kind: "income", icon: "Briefcase", color: "#2F9E44" },
  { name: "Comisiones", kind: "income", icon: "Percent", color: "#37B24D" },
  { name: "Freelance", kind: "income", icon: "Laptop", color: "#40C057" },
  { name: "Intereses", kind: "income", icon: "TrendingUp", color: "#51CF66" },
  { name: "Devoluciones", kind: "income", icon: "RotateCcw", color: "#69DB7C" },
  { name: "Otros ingresos", kind: "income", icon: "PlusCircle", color: "#8CE99A" },
  { name: "Vivienda", kind: "expense", icon: "Home", color: "#E03131" },
  { name: "Alimentación", kind: "expense", icon: "Utensils", color: "#F76707" },
  { name: "Transporte", kind: "expense", icon: "Car", color: "#F59F00" },
  { name: "Servicios", kind: "expense", icon: "Zap", color: "#FAB005" },
  { name: "Salud", kind: "expense", icon: "HeartPulse", color: "#E64980" },
  { name: "Entretenimiento", kind: "expense", icon: "Clapperboard", color: "#AE3EC9" },
  { name: "Suscripciones", kind: "expense", icon: "Repeat", color: "#7950F2" },
  { name: "Educación", kind: "expense", icon: "GraduationCap", color: "#4C6EF5" },
  { name: "Deudas", kind: "expense", icon: "Landmark", color: "#868E96" },
  { name: "Otros gastos", kind: "expense", icon: "MoreHorizontal", color: "#ADB5BD" },
];

export const ACCENT_PRESETS = [
  DEFAULT_ACCENT,
  "#0D9488",
  "#1F6B4F",
  "#2563EB",
  "#D97706",
  "#E11D48",
];

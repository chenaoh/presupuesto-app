export type PaymentMethod =
  | "efectivo"
  | "datafono"
  | "transferencia"
  | "pse"
  | "debito_automatico"
  | "otro";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  datafono: "Datáfono / tarjeta",
  transferencia: "Transferencia",
  pse: "PSE",
  debito_automatico: "Débito automático",
  otro: "Otro",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

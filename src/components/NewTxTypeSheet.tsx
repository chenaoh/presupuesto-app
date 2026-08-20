"use client";

import {
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { useApp } from "@/lib/store";
import type { TransactionType } from "@/lib/types";

const OPTIONS: Array<{
  value: TransactionType;
  label: string;
  hint: string;
  icon: typeof TrendingDown;
  color: string;
  bg: string;
}> = [
  {
    value: "expense",
    label: "Gasto",
    hint: "Salida de dinero",
    icon: TrendingDown,
    color: "#c2410c",
    bg: "#fff1e8",
  },
  {
    value: "income",
    label: "Ingreso",
    hint: "Entrada de dinero",
    icon: TrendingUp,
    color: "#047857",
    bg: "#ecfdf5",
  },
  {
    value: "transfer",
    label: "Transferencia",
    hint: "Entre tus cuentas",
    icon: ArrowLeftRight,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    value: "debt_payment",
    label: "Deuda",
    hint: "Abono a una deuda",
    icon: Landmark,
    color: "#57534e",
    bg: "#f5f5f4",
  },
  {
    value: "savings_contribution",
    label: "Ahorro",
    hint: "Aporte a una meta",
    icon: PiggyBank,
    color: "#0d9488",
    bg: "#f0fdfa",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (type: TransactionType) => void;
};

export function NewTxTypeSheet({ open, onClose, onPick }: Props) {
  const { workspace, sharedWorkspaces } = useApp();
  const showSpace =
    workspace?.type === "shared" || sharedWorkspaces().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="¿Qué quieres registrar?"
      hideFooter
    >
      <ul className="space-y-1.5">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <li key={opt.value}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-[color-mix(in_oklab,var(--border)_35%,transparent)]"
                onClick={() => onPick(opt.value)}
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl"
                  style={{ background: opt.bg, color: opt.color }}
                >
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="muted text-xs">{opt.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
        {showSpace && (
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-[color-mix(in_oklab,var(--border)_35%,transparent)]"
              onClick={() => onPick("space_contribution")}
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl"
                style={{ background: "#f5f3ff", color: "#7c3aed" }}
              >
                <Users size={20} />
              </span>
              <span>
                <span className="block text-sm font-semibold">Aporte a espacio</span>
                <span className="muted text-xs">Alimenta el presupuesto del espacio</span>
              </span>
            </button>
          </li>
        )}
      </ul>
    </Modal>
  );
}

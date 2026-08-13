"use client";

import Link from "next/link";
import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  message?: string;
};

export function RequireAccountsDialog({
  open,
  onClose,
  message = "Para continuar debes crear al menos una cuenta.",
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Se necesita una cuenta">
      <div className="space-y-4">
        <p className="text-sm muted">{message}</p>
        <p className="text-sm">
          Ve a <strong>Cuentas</strong>, crea una institución si hace falta y luego agrega tu primera
          cuenta.
        </p>
        <Link
          href="/accounts"
          className="btn btn-primary w-full"
          onClick={onClose}
        >
          Ir a crear cuenta
        </Link>
      </div>
    </Modal>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "dialog" | "sheet";
  hideFooter?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "dialog",
  hideFooter = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const isSheet = variant === "sheet";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={clsx("modal-root", isSheet && "is-sheet")} role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-panel"
      >
        {isSheet && <div className="sheet-handle" aria-hidden />}
        <header className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {!hideFooter && (
          <footer className="modal-footer">
            <button type="button" className="btn btn-ghost modal-footer-btn" onClick={onClose}>
              Cerrar
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

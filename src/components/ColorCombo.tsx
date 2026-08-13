"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type ColorOption = {
  value: string;
  label: string;
  color?: string;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ColorOption[];
  required?: boolean;
  placeholder?: string;
};

export function ColorCombo({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Selecciona",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="color-combo">
      <label className="label">{label}</label>
      <input
        tabIndex={-1}
        className="color-combo-required"
        value={value}
        required={required}
        onChange={() => undefined}
        aria-hidden
      />
      <button
        type="button"
        className={`color-combo-trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="color-combo-swatch"
          style={{ background: selected?.color || "var(--border)" }}
        />
        <span className={`color-combo-label ${selected ? "" : "is-placeholder"}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className="color-combo-chevron" />
      </button>

      {open && (
        <ul id={listId} role="listbox" className="color-combo-menu">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`color-combo-option ${!value ? "is-selected" : ""}`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <span className="color-combo-swatch is-empty" />
              <span className="color-combo-label is-placeholder">{placeholder}</span>
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={`color-combo-option ${value === opt.value ? "is-selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span
                  className="color-combo-swatch"
                  style={{ background: opt.color || "var(--border)" }}
                />
                <span className="color-combo-label">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

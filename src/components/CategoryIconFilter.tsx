"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Modal } from "@/components/Modal";

export type CategoryIconOption = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CategoryIconOption[];
  placeholder?: string;
};

export function CategoryIconFilter({
  label,
  value,
  onChange,
  options,
  placeholder = "Todas las categorías",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div>
      <p className="label">{label}</p>
      <button
        type="button"
        className="input flex w-full items-center gap-2 text-left"
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <CategoryIcon icon={selected.icon} color={selected.color} size={14} />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[color-mix(in_oklab,var(--border)_45%,transparent)] muted">
            <LayoutGrid size={14} />
          </span>
        )}
        <span className={`min-w-0 flex-1 truncate ${selected ? "" : "muted"}`}>
          {selected?.name ?? placeholder}
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={label} variant="sheet">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            type="button"
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${
              !value ? "border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]" : "border-border"
            }`}
            onClick={() => pick("")}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_oklab,var(--border)_45%,transparent)] muted">
              <LayoutGrid size={18} />
            </span>
            <span className="text-[11px] font-semibold leading-tight">Todas</span>
          </button>
          {options.map((c) => {
            const active = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${
                  active
                    ? "border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
                    : "border-border"
                }`}
                onClick={() => pick(c.id)}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={18} />
                <span className="w-full truncate text-[11px] font-semibold leading-tight" title={c.name}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

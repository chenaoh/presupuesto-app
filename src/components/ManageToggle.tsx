"use client";

type Props = {
  active: boolean;
  onChange: (active: boolean) => void;
  label?: string;
};

export function ManageToggle({ active, onChange, label = "Gestionar" }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-accent bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-fg"
          : "border-border bg-[var(--bg-elevated)] text-muted"
      }`}
    >
      {active ? "Listo" : label}
    </button>
  );
}

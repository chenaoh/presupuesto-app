"use client";

import { getCategoryIcon } from "@/lib/categoryIcons";
import { clsx } from "@/lib/format";

type Props = {
  icon?: string | null;
  color?: string;
  size?: number;
  className?: string;
};

/** Icono de categoría tintado con el color de la categoría. */
export function CategoryIcon({ icon, color = "var(--accent)", size = 18, className }: Props) {
  const Icon = getCategoryIcon(icon);
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{
        width: size + 14,
        height: size + 14,
        background: `color-mix(in oklab, ${color} 18%, var(--bg-elevated))`,
        color,
      }}
      aria-hidden
    >
      <Icon size={size} strokeWidth={2.2} />
    </span>
  );
}

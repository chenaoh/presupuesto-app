"use client";

import { User } from "lucide-react";
import { clsx } from "@/lib/format";

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  /** Color propio (p. ej. acento del espacio) para listas donde el global aún no aplica. */
  accent?: string;
};

export function UserAvatar({
  src,
  name,
  size = 36,
  className,
  accent,
}: Props) {
  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--accent)_18%,white)] text-accent",
        className,
      )}
      style={{
        width: size,
        height: size,
        ...(accent
          ? {
              background: `color-mix(in oklab, ${accent} 18%, white)`,
              color: accent,
              boxShadow: `0 0 0 2px ${accent}`,
            }
          : undefined),
      }}
      aria-hidden={!name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : initials ? (
        <span className="text-[0.65em] font-bold" style={{ fontSize: size * 0.34 }}>
          {initials}
        </span>
      ) : (
        <User size={size * 0.48} strokeWidth={2.2} />
      )}
    </span>
  );
}

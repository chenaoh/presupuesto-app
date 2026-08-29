"use client";

export function SplashScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="splash" role="status" aria-live="polite" aria-label={label}>
      <div className="splash-glow" aria-hidden />
      <div className="splash-orb splash-orb-a" aria-hidden />
      <div className="splash-orb splash-orb-b" aria-hidden />
      <div className="splash-mark">
        <div className="splash-logo-ring">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt=""
            width={168}
            height={168}
            className="splash-logo"
          />
        </div>
        <p className="brand splash-title">Presupuesto</p>
        <p className="splash-caption">{label}</p>
      </div>
    </div>
  );
}

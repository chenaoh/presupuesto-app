"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

type Props = {
  className?: string;
  variant?: "primary" | "ghost";
};

export function InstallPwaButton({ className = "", variant = "primary" }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      deferredRef.current = ev;
      setDeferred(ev);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      deferredRef.current = null;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className={`muted text-sm ${className}`}>La app ya está instalada en este dispositivo.</p>
    );
  }

  async function onInstall() {
    const promptEvent = deferredRef.current || deferred;
    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      return;
    }
    setShowIosHelp(true);
  }

  const btnClass = variant === "primary" ? "btn btn-primary" : "btn btn-ghost";

  return (
    <div className={className}>
      <button type="button" className={`${btnClass} w-full sm:w-auto`} onClick={onInstall}>
        <Download size={16} />
        Descargar app
      </button>
      {showIosHelp && (
        <div className="mt-3 rounded-xl border border-border bg-[var(--bg-elevated)] p-3 text-left text-sm">
          <p className="font-semibold">Instalar en tu celular</p>
          {isIos() ? (
            <ol className="muted mt-2 list-decimal space-y-1 pl-4 text-xs">
              <li>
                Toca <Share size={12} className="inline align-text-bottom" /> Compartir en Safari
              </li>
              <li>Elige “Añadir a pantalla de inicio”</li>
              <li>Confirma con “Añadir”</li>
            </ol>
          ) : (
            <p className="muted mt-2 text-xs">
              En Chrome o Edge: menú ⋮ → “Instalar app” o “Añadir a pantalla de inicio”.
            </p>
          )}
          <button
            type="button"
            className="btn btn-ghost mt-2 text-xs"
            onClick={() => setShowIosHelp(false)}
          >
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}

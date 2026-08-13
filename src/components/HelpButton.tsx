"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { Modal } from "@/components/Modal";
import { helpForPath } from "@/lib/help";

export function HelpButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const help = helpForPath(pathname);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost px-1.5 py-1"
        onClick={() => setOpen(true)}
        aria-label={`Ayuda: ${help.title}`}
        title="Ayuda"
      >
        <CircleHelp size={15} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Ayuda · ${help.title}`}>
        <div className="space-y-3 text-sm">
          <p className="muted">{help.summary}</p>
          <ol className="list-decimal space-y-1.5 pl-4">
            {help.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {help.tip && (
            <p className="rounded-md border border-border bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-3 py-2 text-xs">
              {help.tip}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

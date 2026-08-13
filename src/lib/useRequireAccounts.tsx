"use client";

import { useCallback, useState } from "react";
import { useApp } from "@/lib/store";
import { RequireAccountsDialog } from "@/components/RequireAccountsDialog";

export function useRequireAccounts(message?: string) {
  const { allAccounts } = useApp();
  const [open, setOpen] = useState(false);
  const hasAccounts = allAccounts().length > 0;

  const guard = useCallback(
    (action: () => void) => {
      if (!hasAccounts) {
        setOpen(true);
        return;
      }
      action();
    },
    [hasAccounts],
  );

  const dialog = (
    <RequireAccountsDialog
      open={open}
      onClose={() => setOpen(false)}
      message={message}
    />
  );

  return { guard, dialog, hasAccounts, openGate: () => setOpen(true) };
}

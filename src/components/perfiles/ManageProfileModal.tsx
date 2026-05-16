"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ManageProfileFormPanel } from "./ManageProfileFormPanel";
import type { DelegateClubPickerOption } from "./PerfilesHubHeader";

type ManageProfileModalProps = {
  clubOptions: DelegateClubPickerOption[];
  renderTrigger: (open: () => void) => ReactNode;
};

/**
 * Patrón split: `panelKey` fuerza remontaje de `ManageProfileFormPanel` al pasar de cerrado → abierto.
 */
export function ManageProfileModal({ clubOptions, renderTrigger }: ManageProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (open && !wasOpenRef.current) {
      setPanelKey((k) => k + 1);
    }
    wasOpenRef.current = open;
  }, [open]);

  return (
    <>
      {renderTrigger(() => setOpen(true))}
      {open ? (
        <ManageProfileFormPanel
          key={panelKey}
          clubOptions={clubOptions}
          onRequestClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

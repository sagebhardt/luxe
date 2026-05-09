"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Portal-rendered modal. Mounts under document.body so it escapes any
 * parent's transform / filter / contain stacking context. Also scrolls
 * the page to lock-style on open.
 */
export function Modal({
  open,
  onClose,
  ariaLabel,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    /* Lock body scroll while open. */
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className={`modal-card${className ? ` ${className}` : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

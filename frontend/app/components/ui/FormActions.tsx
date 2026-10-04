"use client";

import React from "react";

export function FormActions({
  onCancel,
  label = "Save",
  disabled = false,
  busy = false,
  busyLabel,
}: {
  onCancel: () => void;
  label?: string;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button className="primary-button" disabled={disabled || busy}>
        {busy ? (busyLabel ?? "Saving…") : label}
      </button>
    </div>
  );
}

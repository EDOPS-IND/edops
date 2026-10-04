"use client";

import React from "react";

export function Banner({
  text,
  variant = "error",
}: {
  text: string;
  variant?: "error" | "success";
}) {
  if (variant === "success") {
    return <div className="form-success product-success" role="status">{text}</div>;
  }
  return <div className="form-error product-error" role="alert">{text}</div>;
}

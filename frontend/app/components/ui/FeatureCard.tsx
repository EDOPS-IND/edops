"use client";

import React from "react";

export function FeatureCard({
  title,
  copy,
  action,
  children,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="feature-surface">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        {action}
      </header>
      <div className="feature-body">{children}</div>
    </section>
  );
}

"use client";

import type { ReactNode } from "react";

/** <select> inside a GET form that submits on change (the form's button remains for no-JS users). */
export function AutoSubmitSelect({ name, defaultValue, className, children }: { name: string; defaultValue: string; className?: string; children: ReactNode }) {
  return (
    <select name={name} defaultValue={defaultValue} className={className} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
      {children}
    </select>
  );
}

"use client";

import type { ReactNode } from "react";

export function FeatureShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return <>
    <header className="product-header"><div><p>AssetFlow</p><h1>{title}</h1></div>{actions}</header>
    {children}
  </>;
}

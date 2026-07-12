"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { currentUser } from "../lib/localAuth";

export function FeatureShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!currentUser()) router.replace("/login");
    else setReady(true);
  }, [router]);
  if (!ready) return <main className="session-loading">Opening workspace…</main>;
  return <main className="product-shell"><AppSidebar /><section className="product-content"><header className="product-header"><div><p>AssetFlow</p><h1>{title}</h1></div>{actions}</header>{children}</section></main>;
}

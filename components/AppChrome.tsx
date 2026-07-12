"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { currentUser } from "../lib/localAuth";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/login";
  const [authorized, setAuthorized] = useState(isLoginRoute);

  useEffect(() => {
    if (isLoginRoute) {
      setAuthorized(true);
      return;
    }

    if (!currentUser()) {
      setAuthorized(false);
      router.replace("/login");
      return;
    }

    setAuthorized(true);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [isLoginRoute, pathname, router]);

  if (isLoginRoute) return <>{children}</>;
  if (!authorized) return <main className="session-loading">Opening workspace...</main>;

  return <main className="product-shell">
    <AppSidebar />
    <section className="product-content page-transition" key={pathname}>
      {children}
    </section>
  </main>;
}

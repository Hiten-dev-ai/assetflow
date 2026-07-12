"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Boxes, Building2, CalendarDays, ClipboardCheck, Gauge, LogOut, Moon, PackageCheck, Sun, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { currentUser, refreshCurrentUser, signOut, type LocalUser } from "../lib/localAuth";

const primary = [{ label:"Overview", href:"/", icon:Gauge }, { label:"Assets", href:"/assets", icon:Boxes }, { label:"Allocations", href:"/allocations", icon:PackageCheck }, { label:"Bookings", href:"/bookings", icon:CalendarDays }, { label:"Maintenance", href:"/maintenance", icon:Wrench }, { label:"Audits", href:"/audits", icon:ClipboardCheck }, { label:"Reports", href:"/reports", icon:BarChart3 }];
const secondary = [{ label:"Organization", href:"/organization", icon:Building2 }, { label:"Activity log", href:"/activity", icon:Activity }];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [dark, setDark] = useState(() => typeof window === "undefined" || localStorage.getItem("assetflow-theme") !== "light");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const timer = window.setTimeout(() => {
      setUser(currentUser());
      void refreshCurrentUser().then(setUser);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dark]);

  const isCurrent = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const renderLink = ({ label, href, icon: Icon }: (typeof primary)[number]) => <Link className={`sidebar-link${isCurrent(href) ? " is-current" : ""}`} href={href} key={href} aria-label={label} title={label} aria-current={isCurrent(href) ? "page" : undefined}><Icon size={18} strokeWidth={1.8}/><span>{label}</span></Link>;
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "HK";

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("assetflow-theme", next ? "dark" : "light");
  }

  return <aside className="app-sidebar" aria-label="Application sidebar">
    <div className="sidebar-top">
      <Link className="sidebar-brand" href="/">
        <span className="sidebar-logo">AF</span>
        <strong>Asset Flow</strong>
      </Link>
    </div>
    <nav className="sidebar-primary" aria-label="Primary navigation">{primary.map(renderLink)}</nav>
    <div className="sidebar-footer">
      <button className="sidebar-theme-toggle" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>{dark ? <Sun size={17}/> : <Moon size={17}/>}<span>{dark ? "Light theme" : "Dark theme"}</span></button>
      <nav className="sidebar-secondary" aria-label="Administration">{secondary.map(renderLink)}</nav>
      <div className="sidebar-account"><span className="sidebar-avatar">{initials}</span><span><strong>{user?.name ?? "AssetFlow User"}</strong><small>{user?.employeeRole ?? (user?.role === "ADMIN" ? "Admin" : "Employee")}</small></span></div>
      <button className="sidebar-logout" onClick={() => { void signOut().finally(() => router.push("/login")); }} aria-label="Sign out"><LogOut size={16}/><span>Sign out</span></button>
    </div>
  </aside>;
}

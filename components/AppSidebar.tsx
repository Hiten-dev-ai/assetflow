"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Boxes, Building2, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, Gauge, LogOut, PackageCheck, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { currentUser, signOut, type LocalUser } from "../lib/localAuth";

const primary = [{ label:"Overview", href:"/", icon:Gauge }, { label:"Assets", href:"/assets", icon:Boxes }, { label:"Allocations", href:"/allocations", icon:PackageCheck }, { label:"Bookings", href:"/bookings", icon:CalendarDays }, { label:"Maintenance", href:"/maintenance", icon:Wrench }, { label:"Audits", href:"/audits", icon:ClipboardCheck }, { label:"Reports", href:"/reports", icon:BarChart3 }];
const secondary = [{ label:"Organization", href:"/organization", icon:Building2 }, { label:"Activity log", href:"/activity", icon:Activity }];

export function AppSidebar() {
  const pathname = usePathname(); const router = useRouter(); const [expanded, setExpanded] = useState(true); const [user, setUser] = useState<LocalUser | null>(null);
  useEffect(() => { document.documentElement.dataset.theme = "dark"; const timer = window.setTimeout(() => setUser(currentUser()), 0); return () => window.clearTimeout(timer); }, []);
  const isCurrent = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const renderLink = ({ label, href, icon: Icon }: (typeof primary)[number]) => <Link className={`sidebar-link${isCurrent(href) ? " is-current" : ""}`} href={href} key={href} aria-current={isCurrent(href) ? "page" : undefined}><Icon size={16} strokeWidth={1.8}/><span>{label}</span></Link>;
  const initials = user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "HK";
  return <aside className={`app-sidebar${expanded ? "" : " is-collapsed"}`} aria-label="Application sidebar">
    <div className="sidebar-top"><Link className="sidebar-brand" href="/"><span className="sidebar-logo">AF</span><strong>AssetFlow</strong></Link><button className="sidebar-collapse" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse navigation" : "Expand navigation"}>{expanded ? <ChevronLeft size={17}/> : <ChevronRight size={17}/>}</button></div>
    <nav className="sidebar-primary" aria-label="Primary navigation">{primary.map(renderLink)}</nav>
    <div className="sidebar-footer"><nav className="sidebar-secondary" aria-label="Administration">{secondary.map(renderLink)}</nav><div className="sidebar-account"><span className="sidebar-avatar">{initials}</span><span><strong>{user?.name ?? "Hiten Kumar"}</strong><small>{user?.role === "ADMIN" ? "Administrator" : "Employee"}</small></span><button onClick={() => { signOut(); router.push("/login"); }} aria-label="Sign out"><LogOut size={15}/></button></div></div>
  </aside>;
}

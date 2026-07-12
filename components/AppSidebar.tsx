"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Boxes, Building2, CalendarDays, ChevronRight, ClipboardCheck, Gauge, Moon, PackageCheck, Settings2, Sun, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

const primary = [
  { label:"Overview", href:"/", icon:Gauge }, { label:"Assets", href:"/assets", icon:Boxes },
  { label:"Allocations", href:"/allocations", icon:PackageCheck }, { label:"Bookings", href:"/bookings", icon:CalendarDays },
  { label:"Maintenance", href:"/maintenance", icon:Wrench }, { label:"Audits", href:"/audits", icon:ClipboardCheck },
  { label:"Reports", href:"/reports", icon:BarChart3 },
];
const secondary = [
  { label:"Organization setup", href:"/organization", icon:Building2 }, { label:"Activity log", href:"/activity", icon:Activity },
];

export function AppSidebar(){
  const pathname=usePathname();
  const[dark,setDark]=useState(false);
  useEffect(()=>{const stored=localStorage.getItem("assetflow-theme");const next=stored?stored==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;const timer=window.setTimeout(()=>setDark(next),0);document.documentElement.dataset.theme=next?"dark":"light";return()=>window.clearTimeout(timer)},[]);
  const toggleTheme=()=>{const next=!dark;setDark(next);document.documentElement.dataset.theme=next?"dark":"light";localStorage.setItem("assetflow-theme",next?"dark":"light")};
  const isCurrent=(href:string)=>href==="/"?pathname==="/":pathname===href||pathname.startsWith(`${href}/`);
  const renderLink=({label,href,icon:Icon}:(typeof primary)[number])=><Link className={`sidebar-link${isCurrent(href)?" is-current":""}`} href={href} key={href} aria-current={isCurrent(href)?"page":undefined} title={label}><span className="sidebar-icon"><Icon aria-hidden="true" size={19} strokeWidth={1.8}/></span><span className="sidebar-label">{label}</span><ChevronRight className="sidebar-chevron" aria-hidden="true" size={14}/></Link>;
  return <aside className="app-sidebar" aria-label="Application sidebar">
    <Link className="sidebar-brand" href="/" aria-label="AssetFlow overview"><span className="sidebar-logo">A</span><span className="sidebar-brand-copy"><strong>AssetFlow</strong><small>Operations workspace</small></span></Link>
    <nav className="sidebar-primary" aria-label="Primary navigation">{primary.map(renderLink)}</nav>
    <div className="sidebar-footer"><nav className="sidebar-secondary" aria-label="Administration">{secondary.map(renderLink)}</nav>
      <button className="sidebar-link theme-switch" onClick={toggleTheme} aria-label={`Switch to ${dark?"light":"dark"} theme`} title={`Switch to ${dark?"light":"dark"} theme`}><span className="sidebar-icon">{dark?<Sun aria-hidden="true" size={19}/>:<Moon aria-hidden="true" size={19}/>}</span><span className="sidebar-label">{dark?"Light theme":"Dark theme"}</span><span className={`theme-track${dark?" on":""}`}><i/></span></button>
      <div className="sidebar-account"><span className="sidebar-avatar">HK</span><span className="sidebar-account-copy"><strong>Hiten Kumar</strong><small>Administrator</small></span><button aria-label="Account settings" title="Account settings"><Settings2 size={16}/></button></div>
    </div>
  </aside>;
}

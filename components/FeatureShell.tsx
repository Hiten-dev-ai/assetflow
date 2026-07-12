import Link from "next/link";
import type { ReactNode } from "react";

export function FeatureShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return <main className="feature-shell">
    <aside className="feature-sidebar">
      <Link className="feature-brand" href="/"><span>A</span>AssetFlow</Link>
      <nav><Link href="/">Overview</Link><Link href="/assets">Assets</Link><Link href="/allocations">Allocations</Link><Link href="/bookings">Bookings</Link><Link href="/maintenance">Maintenance</Link><Link href="/audits">Audits</Link><Link href="/reports">Reports</Link></nav>
      <div className="feature-user"><strong>Hiten Kumar</strong><small>Asset Manager</small></div>
    </aside>
    <section className="feature-content">
      <header className="feature-header"><div><p className="eyebrow">Operations workspace</p><h1>{title}</h1></div>{actions}</header>
      {children}
    </section>
  </main>;
}

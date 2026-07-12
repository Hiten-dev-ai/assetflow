import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
export function FeatureShell({title,children,actions}:{title:string;children:ReactNode;actions?:ReactNode}){return <main className="feature-shell shell-with-sidebar"><AppSidebar/><section className="feature-content"><header className="feature-header"><div><p className="eyebrow">Operations workspace</p><h1>{title}</h1></div>{actions}</header>{children}</section></main>}

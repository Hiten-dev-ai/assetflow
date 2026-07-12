"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn, signUp } from "../lib/localAuth";

const demoAccounts = [
  { name: "Hiten S", initials: "HS", role: "Administrator", email: "hiten.s@assetflow.demo", password: "Hiten@2026" },
  { name: "Sujith Kumar P", initials: "SP", role: "Asset Manager", email: "sujith.p@assetflow.demo", password: "Sujith@2026" },
  { name: "Maha Lakshmi", initials: "ML", role: "Department Head", email: "maha.l@assetflow.demo", password: "Maha@2026" },
];

type LoginScreenProps = { onAuthenticated?: () => void };

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [name, setName] = useState("");
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [selectedEmail, setSelectedEmail] = useState(demoAccounts[0].email);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  function selectAccount(account: (typeof demoAccounts)[number]) {
    setSelectedEmail(account.email);
    setEmail(account.email);
    setPassword(account.password);
    setMessage("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      if (password.length < 8) throw new Error("Password must have at least 8 characters.");
      const user = mode === "login" ? signIn(email, password) : signUp(name, email, password);
      setMessage(`Welcome back, ${user.name}.`);
      if (onAuthenticated) {
        onAuthenticated();
      } else {
        router.push("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    }
  }

  return <main className="login-page">
    <section className="login-story">
      <Link className="login-brand" href="/"><span>AF</span>AssetFlow</Link>
      <div className="login-copy">
        <p className="login-kicker">Asset operations, refined</p>
        <h1>Every operational signal, <em>in one clear view.</em></h1>
        <p>AssetFlow gives teams a calm, accountable command center for every allocation, booking, and service event.</p>
      </div>
      <div className="login-visual" aria-label="AssetFlow operational snapshot">
        <div className="signal-card signal-card-main"><span>Portfolio health</span><strong>96.4%</strong><small>compliance across active assets</small><i><b /></i></div>
        <div className="signal-card signal-card-side"><span>Live queue</span><strong>18</strong><small>items need attention</small></div>
        <div className="login-orbit login-orbit-one" /><div className="login-orbit login-orbit-two" />
      </div>
      <p className="login-footer">Structured access. Clear accountability. Better decisions.</p>
    </section>
    <section className="login-access">
      <div className="access-card">
        <div className="access-heading"><p className="login-kicker">Secure workspace</p><h2>{mode === "login" ? "Sign in to AssetFlow" : "Create your employee account"}</h2><p>{mode === "login" ? "Choose a demo profile and open the dashboard." : "New accounts are created as employees; protected roles are assigned by an administrator."}</p></div>
        {mode === "login" && <div className="demo-list" aria-label="Demo accounts">{demoAccounts.map((account) => <button type="button" className={selectedEmail === account.email ? "demo-account selected" : "demo-account"} key={account.email} onClick={() => selectAccount(account)}><span className="demo-avatar">{account.initials}</span><span><strong>{account.name}</strong><small>{account.role}</small></span><i>Select</i></button>)}</div>}
        <form className="login-form" onSubmit={submit}>
          {mode === "signup" && <label><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" required /></label>}
          <label><span>Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "login" ? "Enter demo password" : "At least 8 characters"} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          <div className="login-form-row"><label className="login-checkbox"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember this device</span></label><button type="button" className="login-help" onClick={() => setMessage("Demo access is pre-filled. For a real account, contact your administrator to reset the password.")}>Forgot password?</button></div>
          <button className="login-submit" type="submit">{mode === "login" ? "Open workspace" : "Create employee account"} <span>-&gt;</span></button>
          <p className={message.startsWith("Welcome") ? "login-message success" : "login-message"} role="status">{message}</p>
        </form>
        {mode === "login" && <p className="demo-hint">Selecting a demo profile fills its credentials automatically.</p>}
        <p className="login-switch">{mode === "login" ? "New to AssetFlow?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Create account" : "Sign in"}</button></p>
      </div>
    </section>
  </main>;
}

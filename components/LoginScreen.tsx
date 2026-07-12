"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn, signUp } from "../lib/localAuth";

type LoginScreenProps = { onAuthenticated?: () => void };

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    try {
      const user = mode === "login" ? signIn(username, password) : signUp(name, username, password);
      setSuccess(true);
      setMessage(mode === "login" ? `Welcome back, ${user.name}.` : `Account created for ${user.name}.`);
      if (onAuthenticated) {
        onAuthenticated();
      } else {
        router.push("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setMessage("");
    setSuccess(false);
    setPassword("");
  }

  return <main className="login-page">
    <section className="login-card" aria-label="Assets Flow authentication">
      <div className="login-card-brand">
        <span>AF</span>
        <div>
          <p>Assets Flow</p>
          <small>Enterprise asset operations</small>
        </div>
      </div>

      <div className="login-card-heading">
        <p>{mode === "login" ? "Secure sign in" : "Create account"}</p>
        <h1>{mode === "login" ? "Welcome back" : "Start your workspace"}</h1>
      </div>

      <form className="login-form" onSubmit={submit}>
        {mode === "signup" && <label>
          <span>Full name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Hiten Kumar" autoComplete="name" />
        </label>}
        <label>
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="name@company.com" autoComplete="username" required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        </label>

        <button className="login-submit" type="submit">{mode === "login" ? "Login" : "Create account"}</button>
        {message && <p className={success ? "login-message success" : "login-message"} role="status">{message}</p>}
      </form>

      <p className="login-switch">
        {mode === "login" ? "No account yet?" : "Already have an account?"}
        <button type="button" onClick={switchMode}>{mode === "login" ? "Create one" : "Sign in"}</button>
      </p>
    </section>
  </main>;
}

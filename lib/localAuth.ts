export type LocalUser = { id: string; name: string; email: string; password: string; role: "ADMIN" | "EMPLOYEE" };
const USERS_KEY = "assetflow-users";
const SESSION_KEY = "assetflow-session";
const administrator: LocalUser = { id: "admin-assetflow", name: "Hiten Kumar", email: "admin@assetflow.local", password: "AssetFlow123!", role: "ADMIN" };
function readUsers(): LocalUser[] { const saved = localStorage.getItem(USERS_KEY); if (!saved) { localStorage.setItem(USERS_KEY, JSON.stringify([administrator])); return [administrator]; } try { return JSON.parse(saved) as LocalUser[]; } catch { return [administrator]; } }
export function signUp(name: string, email: string, password: string): LocalUser { const users = readUsers(); if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) throw new Error("An account with this email already exists."); const user: LocalUser = { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), password, role: "EMPLOYEE" }; localStorage.setItem(USERS_KEY, JSON.stringify([...users, user])); localStorage.setItem(SESSION_KEY, user.id); return user; }
export function signIn(email: string, password: string): LocalUser { const user = readUsers().find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password); if (!user) throw new Error("Incorrect email or password."); localStorage.setItem(SESSION_KEY, user.id); return user; }
export function currentUser(): LocalUser | null { const id = localStorage.getItem(SESSION_KEY); return readUsers().find((user) => user.id === id) ?? null; }
export function signOut() { localStorage.removeItem(SESSION_KEY); }

export type LocalUser = {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeRole: "Employee" | "Department Head" | "Asset Manager" | "Admin";
  status: "Active" | "Inactive";
  departmentId: string;
  departmentName: string;
};

const USER_CACHE_KEY = "assetflow-current-user";

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cacheUser(user: LocalUser | null) {
  if (!hasStorage()) return;
  if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_CACHE_KEY);
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T & { error?: string };
  if (!response.ok) throw new Error(payload?.error ?? "Unable to continue.");
  return payload;
}

export function currentUser(): LocalUser | null {
  if (!hasStorage()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? "null") as LocalUser | null;
  } catch {
    return null;
  }
}

export async function refreshCurrentUser(): Promise<LocalUser | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) {
    cacheUser(null);
    return null;
  }
  const payload = await response.json() as { user: LocalUser | null };
  cacheUser(payload.user);
  return payload.user;
}

export async function signUp(name: string, username: string, password: string) {
  await readJson(await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, password }),
  }));
  return { username: username.trim().toLowerCase() };
}

export async function signIn(username: string, password: string): Promise<LocalUser> {
  const payload = await readJson<{ user: LocalUser }>(await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }));
  cacheUser(payload.user);
  return payload.user;
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  cacheUser(null);
}

export type LocalUser = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: "ADMIN" | "EMPLOYEE";
  createdAt: string;
};

type StoredUser = Partial<LocalUser> & { email?: string; password?: string };

const USERS_KEY = "assetflow-users";
const SESSION_KEY = "assetflow-session";
const PASSWORD_SALT = "assetflow-local-auth-v2";
const legacyDemoUsernames = new Set([
  "hiten.s@assetflow.demo",
  "sujith.p@assetflow.demo",
  "maha.l@assetflow.demo",
  "admin@assetflow.local",
]);

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function hashPassword(password: string) {
  let hash = 2166136261;
  const source = `${PASSWORD_SALT}:${password}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `v2:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function cleanName(name: string, username: string) {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  return username.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "AssetFlow User";
}

function readRawUsers(): StoredUser[] {
  if (!hasStorage()) return [];
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function normalizeStoredUser(user: StoredUser): LocalUser | null {
  const username = normalizeUsername(user.username ?? user.email ?? "");
  if (!username || legacyDemoUsernames.has(username)) return null;

  const passwordHash = user.passwordHash ?? (user.password ? hashPassword(user.password) : "");
  if (!passwordHash) return null;

  return {
    id: user.id ?? crypto.randomUUID(),
    name: cleanName(user.name ?? "", username),
    username,
    passwordHash,
    role: user.role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
    createdAt: user.createdAt ?? new Date().toISOString(),
  };
}

function writeUsers(users: LocalUser[]) {
  if (!hasStorage()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function readUsers(): LocalUser[] {
  const users = readRawUsers().map(normalizeStoredUser).filter((user): user is LocalUser => Boolean(user));
  writeUsers(users);
  return users;
}

export function signUp(name: string, username: string, password: string): LocalUser {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) throw new Error("Enter a username or work email.");
  if (password.length < 8) throw new Error("Password must have at least 8 characters.");

  const users = readUsers();
  if (users.some((user) => user.username === normalizedUsername)) {
    throw new Error("An account with this username already exists.");
  }

  const user: LocalUser = {
    id: crypto.randomUUID(),
    name: cleanName(name, normalizedUsername),
    username: normalizedUsername,
    passwordHash: hashPassword(password),
    role: users.length === 0 ? "ADMIN" : "EMPLOYEE",
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, user]);
  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

export function signIn(username: string, password: string): LocalUser {
  const users = readUsers();
  if (users.length === 0) throw new Error("Create your first AssetFlow account to continue.");

  const normalizedUsername = normalizeUsername(username);
  const passwordHash = hashPassword(password);
  const user = users.find((candidate) => candidate.username === normalizedUsername && candidate.passwordHash === passwordHash);
  if (!user) throw new Error("Incorrect username or password.");

  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

export function currentUser(): LocalUser | null {
  if (!hasStorage()) return null;
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return readUsers().find((user) => user.id === id) ?? null;
}

export function signOut() {
  if (!hasStorage()) return;
  localStorage.removeItem(SESSION_KEY);
}

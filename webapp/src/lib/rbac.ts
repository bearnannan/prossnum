export type AppRole = "admin" | "user";

const ADMIN_CREDENTIAL_IDENTIFIERS = new Set(["admin", "admin@example.com"]);

function parseList(value: string | undefined) {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

export function resolveCredentialRole(identifier: string | null | undefined): AppRole {
  const normalized = normalize(identifier);
  if (ADMIN_CREDENTIAL_IDENTIFIERS.has(normalized)) return "admin";
  return "user";
}

export function resolveLineRole(input: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
}): AppRole {
  const adminLineIds = parseList(process.env.ADMIN_LINE_USER_IDS);
  const adminEmails = parseList(process.env.ADMIN_EMAILS);
  const adminNames = parseList(process.env.ADMIN_LINE_NAMES);

  if (input.id && adminLineIds.has(normalize(input.id))) return "admin";
  if (input.email && adminEmails.has(normalize(input.email))) return "admin";
  if (input.name && adminNames.has(normalize(input.name))) return "admin";

  return "user";
}

export function isAdminRole(role: AppRole | null | undefined) {
  return role === "admin";
}

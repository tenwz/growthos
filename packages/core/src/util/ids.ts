import { ulid } from "ulid";

export type IdPrefix = "sig" | "memo" | "exp" | "run" | "job" | "eval" | "learn";

const ULID_PATTERN = "[0-9A-HJKMNP-TV-Z]{26}";

export const ID_PATTERN = new RegExp(`^(sig|memo|exp|run|job|eval|learn)_${ULID_PATTERN}$`);

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${ulid()}`;
}

export function idPattern(prefix: IdPrefix): RegExp {
  return new RegExp(`^${prefix}_${ULID_PATTERN}$`);
}

export function isId(value: unknown, prefix?: IdPrefix): value is string {
  if (typeof value !== "string") return false;
  return prefix ? idPattern(prefix).test(value) : ID_PATTERN.test(value);
}

export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
}

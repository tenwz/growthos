import fs from "node:fs";
import path from "node:path";

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function readText(file: string): string {
  return fs.readFileSync(file, "utf8");
}

export function writeText(file: string, content: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

export function exists(target: string): boolean {
  return fs.existsSync(target);
}

export function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

export function listFilesRecursive(dir: string, extensions?: string[]): string[] {
  if (!isDirectory(dir)) return [];
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".") && entry.name !== ".gitkeep") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) {
          out.push(full);
        }
      }
    }
  };
  walk(dir);
  return out.sort();
}

export function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  fs.cpSync(src, dest, { recursive: true });
}

export function removeDir(target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
}

export function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

export function relativePath(root: string, file: string): string {
  return toPosix(path.relative(root, file));
}

export function findUp(start: string, names: string[]): string | null {
  let current = path.resolve(start);
  for (let i = 0; i < 40; i += 1) {
    for (const name of names) {
      if (exists(path.join(current, name))) return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return null;
}

export function slugify(input: string, maxLength = 48): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "signal";
}

export function uniqueFilePath(dir: string, base: string, ext = ".md"): string {
  let candidate = path.join(dir, `${base}${ext}`);
  let counter = 2;
  while (exists(candidate)) {
    candidate = path.join(dir, `${base}-${counter}${ext}`);
    counter += 1;
  }
  return candidate;
}

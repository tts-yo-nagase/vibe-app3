export const WORD_LIST: string[] = [
  "react",
  "nextjs",
  "typescript",
  "javascript",
  "component",
  "function",
  "variable",
  "interface",
  "database",
  "keyboard",
  "monitor",
  "developer",
  "programming",
  "framework",
  "library",
  "server",
  "client",
  "browser",
  "promise",
  "async",
  "await",
  "module",
  "import",
  "export",
  "default",
  "state",
  "props",
  "effect",
  "render",
  "hooks",
  "context",
  "provider",
  "memoize",
  "callback",
  "deploy",
  "build",
  "package",
  "install",
  "config",
  "environment",
];

export function pickRandomWord(exclude?: string): string {
  const candidates = exclude
    ? WORD_LIST.filter((w) => w !== exclude)
    : WORD_LIST;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const teamDisplayMap: Record<string, string> = {
  "AIK Stockholm": "AIK",
};

const teamShortMap: Record<string, string> = {
  "AIK Stockholm": "AIK",
  "Brommapojkarna": "BP",
};

export function displayName(name: string): string {
  return teamDisplayMap[name] ?? name;
}

export function shortName(name: string): string {
  return teamShortMap[name] ?? name;
}

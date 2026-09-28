// The name shown publicly (leaderboards, competition views): the student's
// alias when set and not disabled by a supervisor/admin, otherwise the real name.
export function publicName(u: { name: string; alias?: string | null; aliasDisabled?: boolean }): string {
  if (u.alias && u.alias.trim() && !u.aliasDisabled) return u.alias;
  return u.name;
}

export function formatBirthDate(birthDate: string | null): string {
  if (!birthDate) {
    return "// UNKNOWN";
  }

  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) {
    return birthDate;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

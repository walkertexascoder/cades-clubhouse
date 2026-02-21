export function getTodayCentral(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
}

export function getYesterdayCentral(): string {
  // Subtract 24 hours, then format in Central Time
  const yesterday = new Date(Date.now() - 86400000);
  return yesterday.toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
}

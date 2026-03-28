export function generateCSV(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[]
): string {
  const header = columns.map((c) => escapeCSV(c.label)).join(",");

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (Array.isArray(value)) return escapeCSV(value.join(", "));
        return escapeCSV(String(value));
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

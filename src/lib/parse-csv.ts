import Papa from "papaparse";

export function parseCSV(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data as Record<string, string>[],
  };
}

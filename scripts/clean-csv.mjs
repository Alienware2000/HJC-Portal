import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const SRC = "/home/alienware2000/dev/healing-jesus-project/CURRENT HJC BOARD LIST - ALL INFO.csv";
const OUT = "/home/alienware2000/dev/healing-jesus-project/CURRENT HJC BOARD LIST - CLEANED.csv";

const raw = fs.readFileSync(SRC, "utf8");
// Drop the title row (line 1: ",HJC BOARD MEMBERS,...") so the real header
// becomes the first line. Splitting on a single newline is fine here because
// no fields in row 1 contain newlines.
const withoutTitle = raw.split("\n").slice(1).join("\n");

const parsed = Papa.parse(withoutTitle, { header: true, skipEmptyLines: true });
if (parsed.errors.length > 0) {
  console.error("Parse errors:", parsed.errors.slice(0, 5));
}

// The leading "#" column has no header, so papaparse names it "" (empty key).
// We drop it entirely from the output for a cleaner CSV.

const COUNTRY_MAP = new Map(
  Object.entries({
    "Cote": "Côte d'Ivoire",
    "Cote D'ivoire": "Côte d'Ivoire",
    "Cote D'ivoire -": "Côte d'Ivoire",
    "Côte d'Ivoire": "Côte d'Ivoire",
    "Drc": "D.R. Congo",
    "D. R. Congo": "D.R. Congo",
    "Usa": "USA",
    "C.A.R": "Central African Republic",
    "Swaziland": "Eswatini",
    "Ivory Coast": "Côte d'Ivoire",
    "Netherland": "Netherlands",
  })
);

const normalizeCountry = (raw) => {
  if (!raw) return raw;
  const trimmed = raw.trim();
  return COUNTRY_MAP.get(trimmed) ?? trimmed;
};

let rows = parsed.data.map((r) => ({
  NAME: (r["NAME"] || "").trim(),
  COUNTRY: normalizeCountry(r["COUNTRY"] || ""),
  CITY: (r["CITY"] || "").trim(),
  LANGUAGE: (r["LANGUAGE"] || "").trim(),
  MINISTRY: (r["MINISTRY"] || "").trim(),
  "PHONE NUMBER": (r["PHONE NUMBER"] || "").trim(),
  "EMAIL ADDRESS": (r["EMAIL ADDRESS"] || "").trim(),
  "YR JOINED": (r["YR JOINED"] || "").trim(),
}));

// Targeted fixes by name (more robust than row index).
const fixes = [
  {
    match: (r) => /Juliana Ondo/i.test(r.NAME),
    apply: (r) => { r["EMAIL ADDRESS"] = "julianabless@gmail.com"; },
  },
  {
    // Mbazaboua's two emails are space-separated in the source; the importer
    // splits on comma/semicolon only, so without this fix the second email
    // would be lost.
    match: (r) => /Mbazaboua/i.test(r.NAME),
    apply: (r) => {
      r["EMAIL ADDRESS"] = r["EMAIL ADDRESS"].replace(/\s+/g, ", ");
    },
  },
];
for (const r of rows) for (const f of fixes) if (f.match(r)) f.apply(r);

// Sawadogo dedupe: rows 17 (2024) and 18 (2025) are the same person.
// Keep the 2025 row, drop the 2024 row.
const sawadogos = rows.filter((r) => /Emmanuel Sawadogo/i.test(r.NAME));
if (sawadogos.length === 2) {
  const keep = sawadogos.find((r) => r["YR JOINED"] === "2025") ?? sawadogos[0];
  rows = rows.filter((r) => r === keep || !/Emmanuel Sawadogo/i.test(r.NAME));
}

// Sanity: warn on any remaining email without @ that isn't empty.
const malformed = rows.filter((r) => {
  const e = r["EMAIL ADDRESS"];
  if (!e) return false;
  // Allow comma/semicolon-separated multi-emails; check each piece.
  return e.split(/[,;]/).some((p) => p.trim() && !p.includes("@"));
});

const out = Papa.unparse(rows, { header: true });
fs.writeFileSync(OUT, out + "\n");

console.log(`Wrote ${rows.length} rows to ${path.basename(OUT)}`);
console.log(`Countries normalized:`, [...new Set(rows.map((r) => r.COUNTRY))].sort().length, "distinct");
if (malformed.length > 0) {
  console.log(`Still-malformed emails (${malformed.length}):`);
  for (const r of malformed) console.log(`  ${r.NAME} → ${r["EMAIL ADDRESS"]}`);
}
const noEmail = rows.filter((r) => !r["EMAIL ADDRESS"]).length;
console.log(`Rows with no email: ${noEmail}`);

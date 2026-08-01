/** Escape CSV cell and prevent spreadsheet formula injection. */
export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  const needsPrefix = /^[=+\-@\t\r]/.test(raw);
  const safe = needsPrefix ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export function buildCsvContent(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  exportedAt: string,
): string {
  const meta = `# Exported at ${exportedAt}`;
  const headerRow = buildCsvRow(headers);
  const dataRows = rows.map((r) => buildCsvRow(r));
  return [meta, headerRow, ...dataRows].join("\r\n");
}

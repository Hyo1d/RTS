export interface CsvColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: T[keyof T], row: T) => string | number | null | undefined;
}

const escapeCsv = (value: string) => {
  const escaped = value.replace(/"/g, "\"\"");
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

export function downloadCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string
) {
  const header = columns.map((col) => escapeCsv(col.label)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const rawValue = col.format ? col.format(row[col.key], row) : row[col.key];
        if (rawValue === null || rawValue === undefined) return "";
        return escapeCsv(String(rawValue));
      })
      .join(",")
  );

  const csvContent = [header, ...lines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

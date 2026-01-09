import { format } from "date-fns";

export const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd/MM/yyyy");
};

export const formatDateRange = (start?: string | null, end?: string | null) => {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  if (startLabel === "-" && endLabel === "-") return "-";
  if (startLabel === "-") return endLabel;
  if (endLabel === "-") return startLabel;
  return `${startLabel} - ${endLabel}`;
};

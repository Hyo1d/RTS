export type EffectiveEmployeeStatus = "active" | "on_leave" | "vacation" | "inactive";

const INACTIVE_STATUSES = new Set(["inactive", "disabled"]);

const toDateKey = (value?: string | null) => {
  if (!value) return null;
  return value.slice(0, 10);
};

export const getTodayKey = () => new Date().toISOString().slice(0, 10);

export function getEffectiveStatus(employee: {
  status?: string | null;
  vacation_start?: string | null;
  vacation_end?: string | null;
}): EffectiveEmployeeStatus {
  const baseStatus = employee.status ?? "active";
  if (INACTIVE_STATUSES.has(baseStatus)) {
    return "inactive";
  }
  if (baseStatus === "on_leave") {
    return "on_leave";
  }
  if (baseStatus === "vacation") {
    return "vacation";
  }

  const today = getTodayKey();
  const start = toDateKey(employee.vacation_start);
  const end = toDateKey(employee.vacation_end);

  if (start && end && today >= start && today <= end) {
    return "vacation";
  }

  return "active";
}

export function getStatusLabel(status: EffectiveEmployeeStatus) {
  switch (status) {
    case "active":
      return "Activo";
    case "on_leave":
      return "Licencia";
    case "vacation":
      return "Vacaciones";
    case "inactive":
      return "Desactivado";
    default:
      return "Desconocido";
  }
}

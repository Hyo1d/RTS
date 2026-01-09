import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const optionalNullableString = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().nullable().optional()
);

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional()
);

export const attendanceSchema = z.object({
  employee_id: z.string().uuid("Empleado invalido"),
  attendance_date: optionalString,
  status: z
    .enum(["present", "absent", "late", "remote", "vacation", "sick_leave", "holiday"])
    .optional(),
  check_in: optionalNullableString,
  check_out: optionalNullableString,
  break_minutes: optionalNumber,
  notes: optionalNullableString,
  source: z.enum(["manual", "import", "correction"]).optional()
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

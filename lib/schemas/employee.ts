import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().email("Email invalido").optional()
);
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());

export const employeeSchema = z.object({
  employee_number: optionalText,
  first_name: optionalText,
  last_name: optionalText,
  email: optionalEmail,
  phone: optionalText,
  position: optionalText,
  department: optionalText,
  status: z.preprocess(
    emptyToUndefined,
    z.enum(["active", "inactive", "on_leave", "vacation", "disabled"]).optional()
  ),
  start_date: optionalDate,
  end_date: optionalDate,
  date_of_birth: optionalDate,
  gender: optionalText,
  address: optionalText,
  city: optionalText,
  country: optionalText,
  postal_code: optionalText,
  emergency_contact_name: optionalText,
  emergency_contact_phone: optionalText,
  emergency_contact_relationship: optionalText,
  profile_image_url: optionalUrl,
  cv_url: optionalUrl,
  vacation_start: optionalDate,
  vacation_end: optionalDate
});

export type EmployeeSchema = z.infer<typeof employeeSchema>;

export type MedicalCertificateStatus = "valid" | "expired" | "missing";

export const getMedicalCertificateExpiry = (uploadedAt?: string | null) => {
  if (!uploadedAt) return null;
  const issuedAt = new Date(uploadedAt);
  if (Number.isNaN(issuedAt.getTime())) return null;
  const expiry = new Date(issuedAt);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
};

export const getMedicalCertificateStatus = (
  uploadedAt?: string | null,
  referenceDate: Date = new Date()
): MedicalCertificateStatus => {
  const expiry = getMedicalCertificateExpiry(uploadedAt);
  if (!expiry) return "missing";
  return expiry.getTime() < referenceDate.getTime() ? "expired" : "valid";
};


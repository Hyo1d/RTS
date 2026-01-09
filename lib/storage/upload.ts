"use client";

const uploadFormData = async (url: string, formData: FormData) => {
  const response = await fetch(url, { method: "POST", body: formData });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload.error === "string" ? payload.error : "Error al subir archivo";
    throw new Error(message);
  }
  return payload;
};

export async function uploadProfileImage(file: File, ownerId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("owner_id", ownerId);
  const payload = await uploadFormData("/api/storage/profile-image", formData);
  return { path: payload.path as string, publicUrl: payload.publicUrl as string };
}

export async function uploadEmployeeDocument(
  file: File,
  employeeId: string,
  documentType: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("employee_id", employeeId);
  formData.append("document_type", documentType);
  const payload = await uploadFormData("/api/storage/employee-documents", formData);
  return { path: payload.path as string };
}

export async function uploadSalaryReceipt(file: File, employeeId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("employee_id", employeeId);
  const payload = await uploadFormData("/api/storage/salary-receipts", formData);
  return { path: payload.path as string };
}

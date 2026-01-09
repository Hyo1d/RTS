alter table employee_documents
  add column if not exists signature_data_url text;

alter table salary_receipts
  add column if not exists signature_data_url text;

-- Storage policies for employee documents and salary receipts
-- Requires storage owner role in Supabase

set role supabase_storage_admin;

alter table storage.objects enable row level security;

drop policy if exists "Employee documents read" on storage.objects;
drop policy if exists "Employee documents insert" on storage.objects;
drop policy if exists "Employee documents admin update" on storage.objects;
drop policy if exists "Employee documents admin delete" on storage.objects;

drop policy if exists "Salary receipts read" on storage.objects;
drop policy if exists "Salary receipts admin insert" on storage.objects;
drop policy if exists "Salary receipts admin update" on storage.objects;
drop policy if exists "Salary receipts admin delete" on storage.objects;

create policy "Employee documents read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'employee-documents'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.employees
        where employees.user_id = auth.uid()
          and employees.id::text = split_part(name, '/', 1)
      )
    )
  );

create policy "Employee documents insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'employee-documents'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.employees
        where employees.user_id = auth.uid()
          and employees.id::text = split_part(name, '/', 1)
      )
    )
  );

create policy "Employee documents admin update" on storage.objects
  for update to authenticated
  using (public.is_admin() and bucket_id = 'employee-documents')
  with check (public.is_admin() and bucket_id = 'employee-documents');

create policy "Employee documents admin delete" on storage.objects
  for delete to authenticated
  using (public.is_admin() and bucket_id = 'employee-documents');

create policy "Salary receipts read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'salary-receipts'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.employees
        where employees.user_id = auth.uid()
          and employees.id::text = split_part(name, '/', 1)
      )
    )
  );

create policy "Salary receipts admin insert" on storage.objects
  for insert to authenticated
  with check (public.is_admin() and bucket_id = 'salary-receipts');

create policy "Salary receipts admin update" on storage.objects
  for update to authenticated
  using (public.is_admin() and bucket_id = 'salary-receipts')
  with check (public.is_admin() and bucket_id = 'salary-receipts');

create policy "Salary receipts admin delete" on storage.objects
  for delete to authenticated
  using (public.is_admin() and bucket_id = 'salary-receipts');

reset role;

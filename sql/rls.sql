-- RLS migration for user-scoped access

alter table profiles enable row level security;
alter table employees enable row level security;
alter table employee_documents enable row level security;
alter table salaries enable row level security;
alter table salary_receipts enable row level security;

do $$
begin
  if to_regclass('public.attendance_records') is not null then
    alter table public.attendance_records enable row level security;
  end if;
end $$;

-- Employees: link to auth users
alter table employees add column if not exists user_id uuid references auth.users;
create index if not exists idx_employees_user_id on employees(user_id);

update employees
set user_id = auth_users.id
from auth.users as auth_users
where employees.user_id is null
  and employees.email is not null
  and lower(employees.email) = lower(auth_users.email);

-- Profiles: ensure role is set when missing
update profiles
set role = 'employee'
where role is null;

-- Helper function for admin checks
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Reset RLS policies
drop policy if exists "Profiles self select" on profiles;
drop policy if exists "Profiles self insert" on profiles;
drop policy if exists "Profiles self update" on profiles;
drop policy if exists "Profiles admin select" on profiles;
drop policy if exists "Profiles admin insert" on profiles;
drop policy if exists "Profiles admin update" on profiles;
drop policy if exists "Profiles admin delete" on profiles;

drop policy if exists "Employees select own or admin" on employees;
drop policy if exists "Employees admin insert" on employees;
drop policy if exists "Employees admin update" on employees;
drop policy if exists "Employees admin delete" on employees;

drop policy if exists "Employee documents select" on employee_documents;
drop policy if exists "Employee documents insert" on employee_documents;
drop policy if exists "Employee documents update" on employee_documents;
drop policy if exists "Employee documents delete" on employee_documents;

do $$
begin
  if to_regclass('public.attendance_records') is not null then
    drop policy if exists "Attendance select" on attendance_records;
    drop policy if exists "Attendance insert" on attendance_records;
    drop policy if exists "Attendance update" on attendance_records;
    drop policy if exists "Attendance delete" on attendance_records;
  end if;
end $$;

drop policy if exists "Salaries admin select" on salaries;
drop policy if exists "Salaries admin insert" on salaries;
drop policy if exists "Salaries admin update" on salaries;
drop policy if exists "Salaries admin delete" on salaries;

drop policy if exists "Salary receipts select" on salary_receipts;
drop policy if exists "Salary receipts insert" on salary_receipts;
drop policy if exists "Salary receipts update" on salary_receipts;
drop policy if exists "Salary receipts delete" on salary_receipts;

create policy "Profiles self select" on profiles
  for select to authenticated using (id = auth.uid());

create policy "Profiles self insert" on profiles
  for insert to authenticated with check (id = auth.uid());

create policy "Profiles self update" on profiles
  for update to authenticated using (id = auth.uid());

create policy "Profiles admin select" on profiles
  for select to authenticated using (is_admin());

create policy "Profiles admin insert" on profiles
  for insert to authenticated with check (is_admin());

create policy "Profiles admin update" on profiles
  for update to authenticated using (is_admin());

create policy "Profiles admin delete" on profiles
  for delete to authenticated using (is_admin());

create policy "Employees select own or admin" on employees
  for select to authenticated
  using (is_admin() or user_id = auth.uid());

create policy "Employees admin insert" on employees
  for insert to authenticated with check (is_admin());

create policy "Employees admin update" on employees
  for update to authenticated using (is_admin());

create policy "Employees admin delete" on employees
  for delete to authenticated using (is_admin());

create policy "Employee documents select" on employee_documents
  for select to authenticated
  using (
    is_admin()
    or employee_id in (select id from employees where user_id = auth.uid())
  );

create policy "Employee documents insert" on employee_documents
  for insert to authenticated
  with check (
    is_admin()
    or (
      employee_id in (select id from employees where user_id = auth.uid())
      and document_type in (
        'certificado_medico',
        'certificados_medicos',
        'medical_certificate'
      )
    )
  );

create policy "Employee documents update" on employee_documents
  for update to authenticated
  using (
    is_admin()
    or employee_id in (select id from employees where user_id = auth.uid())
  )
  with check (
    is_admin()
    or employee_id in (select id from employees where user_id = auth.uid())
  );

create policy "Employee documents delete" on employee_documents
  for delete to authenticated using (is_admin());

do $$
begin
  if to_regclass('public.attendance_records') is not null then
    create policy "Attendance select" on attendance_records
      for select to authenticated
      using (
        is_admin()
        or employee_id in (select id from employees where user_id = auth.uid())
      );

    create policy "Attendance insert" on attendance_records
      for insert to authenticated
      with check (
        is_admin()
        or employee_id in (select id from employees where user_id = auth.uid())
      );

    create policy "Attendance update" on attendance_records
      for update to authenticated
      using (
        is_admin()
        or employee_id in (select id from employees where user_id = auth.uid())
      )
      with check (
        is_admin()
        or employee_id in (select id from employees where user_id = auth.uid())
      );

    create policy "Attendance delete" on attendance_records
      for delete to authenticated using (is_admin());
  end if;
end $$;

create policy "Salaries admin select" on salaries
  for select to authenticated using (is_admin());

create policy "Salaries admin insert" on salaries
  for insert to authenticated with check (is_admin());

create policy "Salaries admin update" on salaries
  for update to authenticated using (is_admin());

create policy "Salaries admin delete" on salaries
  for delete to authenticated using (is_admin());

create policy "Salary receipts select" on salary_receipts
  for select to authenticated
  using (
    is_admin()
    or employee_id in (select id from employees where user_id = auth.uid())
  );

create policy "Salary receipts insert" on salary_receipts
  for insert to authenticated with check (is_admin());

create policy "Salary receipts update" on salary_receipts
  for update to authenticated
  using (
    is_admin()
    or employee_id in (select id from employees where user_id = auth.uid())
  )
  with check (
    is_admin()
    or employee_id in (select id from employees where user_id = auth.uid())
  );

create policy "Salary receipts delete" on salary_receipts
  for delete to authenticated using (is_admin());

-- Storage policies
-- Storage policies live in sql/storage-policies.sql and require storage owner

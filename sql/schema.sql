-- Employee Management System schema for Supabase

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  dni text,
  phone text,
  date_of_birth date,
  role text default 'employee',
  avatar_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Employees
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  employee_number text unique,
  first_name text,
  last_name text,
  email text unique,
  phone text,
  position text,
  department text,
  status text default 'active',
  start_date date,
  end_date date,
  date_of_birth date,
  gender text,
  address text,
  city text,
  country text,
  postal_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  profile_image_url text,
  cv_url text,
  vacation_start date,
  vacation_end date,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  created_by uuid references profiles(id)
);

-- Employee documents
create table if not exists employee_documents (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  document_type text not null,
  document_name text not null,
  file_url text not null,
  file_size integer,
  signed_at timestamp,
  signed_by uuid references profiles(id),
  signed_name text,
  signature_data_url text,
  uploaded_at timestamp default now(),
  uploaded_by uuid references profiles(id)
);

-- Attendance records
create table if not exists attendance_records (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  attendance_date date default current_date,
  status text default 'present',
  check_in time,
  check_out time,
  break_minutes integer default 0,
  notes text,
  source text default 'manual',
  created_at timestamp default now(),
  created_by uuid references profiles(id)
);

-- Salaries
create table if not exists salaries (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  base_salary decimal(10,2) not null,
  currency text default 'USD',
  payment_frequency text default 'monthly',
  bonuses decimal(10,2) default 0,
  deductions decimal(10,2) default 0,
  bank_account text,
  effective_date date not null,
  end_date date,
  is_current boolean default true,
  notes text,
  created_at timestamp default now(),
  created_by uuid references profiles(id)
);

-- Salary receipts
create table if not exists salary_receipts (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  salary_id uuid references salaries(id),
  period_start date not null,
  period_end date not null,
  payment_date date not null,
  gross_amount decimal(10,2) not null,
  net_amount decimal(10,2) not null,
  bonuses decimal(10,2) default 0,
  deductions decimal(10,2) default 0,
  receipt_file_url text,
  status text default 'pending',
  signed_at timestamp,
  signed_by uuid references profiles(id),
  signed_name text,
  signature_data_url text,
  created_at timestamp default now(),
  created_by uuid references profiles(id)
);

-- Indexes
create index if not exists idx_employees_department on employees(department);
create index if not exists idx_employees_status on employees(status);
create index if not exists idx_employees_employee_number on employees(employee_number);
create index if not exists idx_employees_user_id on employees(user_id);
create index if not exists idx_attendance_employee_date on attendance_records(employee_id, attendance_date);
create index if not exists idx_salaries_employee_current on salaries(employee_id, is_current);
create index if not exists idx_salary_receipts_employee on salary_receipts(employee_id);

-- Row Level Security
alter table profiles enable row level security;
alter table employees enable row level security;
alter table employee_documents enable row level security;
alter table attendance_records enable row level security;
alter table salaries enable row level security;
alter table salary_receipts enable row level security;

-- Policies and helper functions are defined in sql/rls.sql

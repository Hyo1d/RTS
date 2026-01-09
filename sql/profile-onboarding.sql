-- Add onboarding fields to profiles

alter table profiles add column if not exists dni text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists date_of_birth date;

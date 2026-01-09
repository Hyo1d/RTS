alter table employees
  alter column employee_number drop not null,
  alter column first_name drop not null,
  alter column last_name drop not null,
  alter column email drop not null,
  alter column position drop not null,
  alter column department drop not null,
  alter column start_date drop not null;

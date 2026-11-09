create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  age integer,
  created_at timestamptz not null default now(),
  constraint profiles_age_range check (age is null or age between 0 and 150)
);

alter table public.profiles add column if not exists age integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_age_range'
  ) then
    alter table public.profiles
      add constraint profiles_age_range
      check (age is null or age between 0 and 150);
  end if;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, age)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'age' ~ '^[0-9]{1,3}$'
      then case
        when (new.raw_user_meta_data ->> 'age')::integer between 1 and 120
        then (new.raw_user_meta_data ->> 'age')::integer
        else null
      end
      else null
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.glucose_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  val numeric not null check (val > 0),
  moment text not null check (
    moment in (
      'Ayunas',
      'Antes de comer',
      'Después de comer',
      'Noche',
      'Automática'
    )
  ),
  date timestamptz not null default now(),
  status text generated always as (
    case
      when val < 70 then 'low'
      when val <= 140 then 'normal'
      else 'high'
    end
  ) stored
);

alter table public.glucose_records
  drop constraint if exists glucose_records_moment_check;
alter table public.glucose_records
  add constraint glucose_records_moment_check
  check (
    moment in (
      'Ayunas',
      'Antes de comer',
      'Después de comer',
      'Noche',
      'Automática'
    )
  );

create index if not exists glucose_records_user_date_idx
  on public.glucose_records (user_id, date desc);

alter table public.glucose_records enable row level security;

drop policy if exists "Users can read their own glucose records" on public.glucose_records;
create policy "Users can read their own glucose records"
  on public.glucose_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own glucose records" on public.glucose_records;
create policy "Users can create their own glucose records"
  on public.glucose_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own glucose records" on public.glucose_records;
create policy "Users can update their own glucose records"
  on public.glucose_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own glucose records" on public.glucose_records;
create policy "Users can delete their own glucose records"
  on public.glucose_records for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.blood_pressure_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  systolic integer not null check (systolic > 0),
  diastolic integer not null check (diastolic > 0),
  pulse integer check (pulse is null or pulse > 0),
  notes text not null default '',
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists blood_pressure_records_user_date_idx
  on public.blood_pressure_records (user_id, date desc);

alter table public.blood_pressure_records enable row level security;

drop policy if exists "Users can read their own blood pressure records" on public.blood_pressure_records;
create policy "Users can read their own blood pressure records"
  on public.blood_pressure_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own blood pressure records" on public.blood_pressure_records;
create policy "Users can create their own blood pressure records"
  on public.blood_pressure_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own blood pressure records" on public.blood_pressure_records;
create policy "Users can update their own blood pressure records"
  on public.blood_pressure_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own blood pressure records" on public.blood_pressure_records;
create policy "Users can delete their own blood pressure records"
  on public.blood_pressure_records for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  dosage text not null default '',
  frequency text not null default '',
  schedules jsonb not null default '[]'::jsonb,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medications_user_active_idx
  on public.medications (user_id, active, name);

alter table public.medications enable row level security;

drop policy if exists "Users can read their own medications" on public.medications;
create policy "Users can read their own medications"
  on public.medications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own medications" on public.medications;
create policy "Users can create their own medications"
  on public.medications for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own medications" on public.medications;
create policy "Users can update their own medications"
  on public.medications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own medications" on public.medications;
create policy "Users can delete their own medications"
  on public.medications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.reminder_preferences enable row level security;

drop policy if exists "Users can read their own reminder preferences" on public.reminder_preferences;
create policy "Users can read their own reminder preferences"
  on public.reminder_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own reminder preferences" on public.reminder_preferences;
create policy "Users can create their own reminder preferences"
  on public.reminder_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own reminder preferences" on public.reminder_preferences;
create policy "Users can update their own reminder preferences"
  on public.reminder_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.meal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text not null default '',
  calories numeric check (calories is null or calories >= 0),
  protein numeric check (protein is null or protein >= 0),
  carbohydrates numeric check (
    carbohydrates is null or carbohydrates >= 0
  ),
  potassium numeric check (potassium is null or potassium >= 0),
  notes text not null default '',
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.meal_records
  add column if not exists protein numeric check (protein is null or protein >= 0),
  add column if not exists potassium numeric check (potassium is null or potassium >= 0);

create index if not exists meal_records_user_date_idx
  on public.meal_records (user_id, date desc);

alter table public.meal_records enable row level security;

drop policy if exists "Users can read their own meal records" on public.meal_records;
create policy "Users can read their own meal records"
  on public.meal_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own meal records" on public.meal_records;
create policy "Users can create their own meal records"
  on public.meal_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own meal records" on public.meal_records;
create policy "Users can update their own meal records"
  on public.meal_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own meal records" on public.meal_records;
create policy "Users can delete their own meal records"
  on public.meal_records for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.glucose_records to authenticated;
grant select, insert, update, delete on public.blood_pressure_records to authenticated;
grant select, insert, update, delete on public.medications to authenticated;
grant select, insert, update on public.reminder_preferences to authenticated;
grant select, insert, update, delete on public.meal_records to authenticated;

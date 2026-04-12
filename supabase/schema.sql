-- Kairos Supabase schema + RLS
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  date date not null default current_date,
  status text not null check (status in ('present', 'late', 'absent')),
  marked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, class_id, date)
);

create index if not exists idx_classes_teacher on public.classes(teacher_id);
create index if not exists idx_enrollments_class on public.class_enrollments(class_id);
create index if not exists idx_enrollments_student on public.class_enrollments(student_id);
create index if not exists idx_attendance_class_date on public.attendance(class_id, date);
create index if not exists idx_attendance_student_date on public.attendance(student_id, date);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'student'))
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.sync_student_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_name text;
begin
  if new.role = 'student' then
    derived_name := initcap(replace(split_part(new.email, '@', 1), '.', ' '));

    insert into public.students (id, name, email)
    values (new.id, coalesce(derived_name, 'Student'), new.email)
    on conflict (id) do update
      set email = excluded.email,
          name = coalesce(public.students.name, excluded.name);
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_sync_student on public.profiles;
create trigger on_profile_sync_student
after insert or update of role, email on public.profiles
for each row execute function public.sync_student_from_profile();

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.attendance enable row level security;

-- Profiles
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Students
create policy "students_select_own"
on public.students for select
using (id = auth.uid());

create policy "students_select_teacher_classes"
on public.students for select
using (
  exists (
    select 1
    from public.class_enrollments ce
    join public.classes c on c.id = ce.class_id
    where ce.student_id = public.students.id
      and c.teacher_id = auth.uid()
  )
);

create policy "students_upsert_own"
on public.students for all
using (id = auth.uid())
with check (id = auth.uid());

-- Classes
create policy "classes_select_teacher"
on public.classes for select
using (teacher_id = auth.uid());

create policy "classes_manage_teacher"
on public.classes for all
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "classes_select_student_enrolled"
on public.classes for select
using (
  exists (
    select 1
    from public.class_enrollments ce
    where ce.class_id = public.classes.id
      and ce.student_id = auth.uid()
  )
);

-- Class enrollments
create policy "enrollments_select_teacher"
on public.class_enrollments for select
using (
  exists (
    select 1 from public.classes c
    where c.id = public.class_enrollments.class_id
      and c.teacher_id = auth.uid()
  )
);

create policy "enrollments_manage_teacher"
on public.class_enrollments for all
using (
  exists (
    select 1 from public.classes c
    where c.id = public.class_enrollments.class_id
      and c.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = public.class_enrollments.class_id
      and c.teacher_id = auth.uid()
  )
);

create policy "enrollments_select_student_self"
on public.class_enrollments for select
using (student_id = auth.uid());

-- Attendance
create policy "attendance_select_student_self"
on public.attendance for select
using (student_id = auth.uid());

create policy "attendance_select_teacher_classes"
on public.attendance for select
using (
  exists (
    select 1 from public.classes c
    where c.id = public.attendance.class_id
      and c.teacher_id = auth.uid()
  )
);

create policy "attendance_manage_teacher_classes"
on public.attendance for all
using (
  exists (
    select 1 from public.classes c
    where c.id = public.attendance.class_id
      and c.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = public.attendance.class_id
      and c.teacher_id = auth.uid()
  )
);

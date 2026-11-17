-- Chạy một lần trong Supabase: SQL Editor → New query → dán file này → Run.
-- Mỗi tài khoản phụ huynh có một dòng, chứa toàn bộ tiến độ của bé dạng JSON.

create table if not exists public.progress (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Phụ huynh chỉ đọc/ghi được dòng của chính mình.
drop policy if exists "progress_select_own" on public.progress;
create policy "progress_select_own" on public.progress
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own" on public.progress
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own" on public.progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Lớp học cho giáo viên ----------
-- Giáo viên (một tài khoản đăng nhập bằng email như phụ huynh) tạo lớp, được một mã 6 ký tự.
-- Phụ huynh nhập mã cho bé ở Góc phụ huynh: website gửi tóm tắt tiến độ của bé (sao, lượt chơi, màn hay sai)
-- vào class_members, giáo viên chỉ xem được tóm tắt này, không xem email hay toàn bộ dữ liệu của gia đình.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  grade int check (grade between 1 and 5),
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kid_id text not null,
  class_name text not null,
  kid_name text not null,
  avatar text not null default '🙂',
  summary jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (class_id, user_id, kid_id)
);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

-- Giáo viên xem, đổi tên, xóa lớp của mình. Tạo lớp qua hàm create_class (để sinh mã không trùng).
drop policy if exists "classes_teacher" on public.classes;
create policy "classes_teacher" on public.classes
  for select to authenticated using (teacher_id = auth.uid());
drop policy if exists "classes_teacher_update" on public.classes;
create policy "classes_teacher_update" on public.classes
  for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "classes_teacher_delete" on public.classes;
create policy "classes_teacher_delete" on public.classes
  for delete to authenticated using (teacher_id = auth.uid());

-- Phụ huynh xem, cập nhật, rời lớp các dòng của con mình; giáo viên xem và xóa học sinh khỏi lớp của mình.
-- Vào lớp qua hàm join_class (phụ huynh không xem được danh sách lớp).
drop policy if exists "members_select" on public.class_members;
create policy "members_select" on public.class_members
  for select to authenticated using (
    user_id = auth.uid() or class_id in (select id from public.classes where teacher_id = auth.uid())
  );
drop policy if exists "members_update_own" on public.class_members;
create policy "members_update_own" on public.class_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "members_delete" on public.class_members;
create policy "members_delete" on public.class_members
  for delete to authenticated using (
    user_id = auth.uid() or class_id in (select id from public.classes where teacher_id = auth.uid())
  );

-- Tạo lớp với mã ngẫu nhiên (bỏ các chữ dễ nhầm 0/O, 1/I/L).
create or replace function public.create_class(p_name text, p_grade int)
returns public.classes
language plpgsql security definer set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text;
  row public.classes;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  if (select count(*) from public.classes where teacher_id = auth.uid()) >= 20 then
    raise exception 'Mỗi tài khoản tạo tối đa 20 lớp';
  end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where code = new_code);
  end loop;
  insert into public.classes (teacher_id, name, grade, code)
    values (auth.uid(), trim(p_name), p_grade, new_code)
    returning * into row;
  return row;
end;
$$;

-- Phụ huynh cho bé vào lớp bằng mã. Trả về tên lớp; mã sai thì báo lỗi.
create or replace function public.join_class(p_code text, p_kid_id text, p_kid_name text, p_avatar text, p_summary jsonb)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  cls public.classes;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  select * into cls from public.classes where code = upper(trim(p_code));
  if cls.id is null then raise exception 'CLASS_NOT_FOUND'; end if;
  if (select count(*) from public.class_members where class_id = cls.id) >= 60 then
    raise exception 'CLASS_FULL';
  end if;
  insert into public.class_members (class_id, user_id, kid_id, class_name, kid_name, avatar, summary)
    values (cls.id, auth.uid(), p_kid_id, cls.name, p_kid_name, p_avatar, coalesce(p_summary, '{}'::jsonb))
    on conflict (class_id, user_id, kid_id) do update
      set kid_name = excluded.kid_name, avatar = excluded.avatar, summary = excluded.summary, updated_at = now();
  return cls.name;
end;
$$;

revoke all on function public.create_class(text, int) from public, anon;
revoke all on function public.join_class(text, text, text, text, jsonb) from public, anon;
grant execute on function public.create_class(text, int) to authenticated;
grant execute on function public.join_class(text, text, text, text, jsonb) to authenticated;

-- ---------- Bài giao cho cả lớp ----------
-- Giáo viên giao một màn (hoặc cả game, l = -1) cho lớp, có thể kèm hạn nộp (due). Bài mới nhất của lớp, nếu chưa
-- "thôi giao" (closed), là bài đang giao; các bài cũ được giữ lại để cô xem lại.
-- Phụ huynh có bé trong lớp đọc được bài để hiện ở "Thử thách hôm nay"; bé làm xong thì tóm tắt (summary.asg, asgd) báo lại.

create table if not exists public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  g text not null check (char_length(g) between 1 and 40),
  l int not null default -1 check (l >= -1 and l < 100),
  level_name text not null default '' check (char_length(level_name) <= 80),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
alter table public.class_assignments add column if not exists due date;
alter table public.class_assignments add column if not exists closed boolean not null default false;
create index if not exists class_assignments_class on public.class_assignments (class_id, created_at desc);

alter table public.class_assignments enable row level security;

drop policy if exists "assign_teacher" on public.class_assignments;
create policy "assign_teacher" on public.class_assignments
  for all to authenticated
  using (class_id in (select id from public.classes where teacher_id = auth.uid()))
  with check (class_id in (select id from public.classes where teacher_id = auth.uid()));

drop policy if exists "assign_members_read" on public.class_assignments;
create policy "assign_members_read" on public.class_assignments
  for select to authenticated
  using (class_id in (select class_id from public.class_members where user_id = auth.uid()));

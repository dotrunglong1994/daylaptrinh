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

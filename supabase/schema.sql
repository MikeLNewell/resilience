-- Household Resilience: run in a NEW dedicated Supabase project.
create table if not exists public.households (
 id uuid primary key default gen_random_uuid(),
 name text not null default 'Our household',
 created_by uuid not null references auth.users(id) default auth.uid(),
 created_at timestamptz not null default now()
);
create table if not exists public.household_members (
 household_id uuid not null references public.households(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'member' check (role in ('owner','member')),
 primary key(household_id,user_id)
);
create table if not exists public.household_settings (
 household_id uuid primary key references public.households(id) on delete cascade,
 monthly_budget numeric(10,2) not null default 50 check (monthly_budget>=0),
 planning_months integer not null default 12 check (planning_months in (6,9,12)),
 target_days integer not null default 14 check (target_days between 1 and 90),
 rollover boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.inventory (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households(id) on delete cascade,
 catalogue_id integer,
 name text not null,
 category text not null default 'Other',
 quantity numeric(12,2) not null default 0 check (quantity>=0),
 unit text not null default 'each',
 expires_on date,
 storage_location text,
 notes text,
 updated_at timestamptz not null default now(),
 unique(household_id,catalogue_id)
);
create table if not exists public.purchases (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households(id) on delete cascade,
 catalogue_id integer,
 item_name text not null,
 quantity numeric(12,2) not null check(quantity>0),
 total_cost numeric(10,2) not null check(total_cost>=0),
 purchased_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id) default auth.uid()
);
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_settings enable row level security;
alter table public.inventory enable row level security;
alter table public.purchases enable row level security;
-- Member lookup uses a non-recursive ownership predicate for the household itself.
create policy "household owner select" on public.households for select to authenticated
 using(created_by=(select auth.uid()));
create policy "household owner insert" on public.households for insert to authenticated
 with check(created_by=(select auth.uid()));
create policy "household owner update" on public.households for update to authenticated
 using(created_by=(select auth.uid())) with check(created_by=(select auth.uid()));
create policy "household owner delete" on public.households for delete to authenticated
 using(created_by=(select auth.uid()));
create policy "owner member select" on public.household_members for select to authenticated
 using(user_id=(select auth.uid()) or exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())));
create policy "owner member insert" on public.household_members for insert to authenticated
 with check(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())));
create policy "owner member delete" on public.household_members for delete to authenticated
 using(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())));
-- Owner-only access for initial release. Shared household editing is not enabled until
-- an audited membership access function is introduced.
create policy "owner settings all" on public.household_settings for all to authenticated
 using(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())))
 with check(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())));
create policy "owner inventory all" on public.inventory for all to authenticated
 using(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())))
 with check(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())));
create policy "owner purchases all" on public.purchases for all to authenticated
 using(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())))
 with check(exists(select 1 from public.households h where h.id=household_id and h.created_by=(select auth.uid())));
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.households,public.household_members,public.household_settings,public.inventory,public.purchases to authenticated;

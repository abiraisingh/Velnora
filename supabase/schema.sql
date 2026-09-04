create type public.order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type public.payment_method as enum ('cod', 'upi');
create type public.payment_status as enum ('pending', 'paid', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  phone text not null,
  address text not null,
  items jsonb not null,
  total integer not null check (total > 0),
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  status public.order_status not null default 'pending',
  cashfree_order_id text unique,
  cashfree_payment_id text,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create policy "Users can read their profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "Users can read their orders" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "Users can create their orders" on public.orders for insert with check (user_id = auth.uid());
create policy "Admins can update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "Anyone can submit contact messages" on public.contact_messages for insert with check (true);
create policy "Admins can read contact messages" on public.contact_messages for select using (public.is_admin());
create policy "Admins can update contact messages" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

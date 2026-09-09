-- Fix RLS write policies that compared users.id to auth.uid().
--
-- auth.uid() returns the Supabase Auth user id, which this schema stores in
-- users.auth_id -- users.id is a separate application-side primary key. Every
-- policy below therefore evaluated to false for every caller, so all writes
-- from the anon/authenticated clients were rejected with 403. Symptom that
-- surfaced this: "Initialize Pharmacy Inventory" failed with a redacted
-- Server Components error because the pharmacy_inventory insert 403'd.
--
-- Writes issued through createAdminClient() (service role) were unaffected,
-- which is why the suggestion tables appeared to work.

-- Admin + pharmacist writable tables
do $$
declare t text;
begin
  foreach t in array array[
    'brand_names',
    'dosage_forms',
    'dosage_strengths',
    'generic_names',
    'packaging_types',
    'product_categories',
    'volumes'
  ] loop
    execute format('drop policy if exists suggestion_tables_write on public.%I', t);
    execute format($f$
      create policy suggestion_tables_write on public.%I
        as permissive for all to authenticated
        using (
          exists (
            select 1 from public.users
            where users.auth_id = auth.uid()
              and users.role = any (array['admin'::text, 'pharmacist'::text])
          )
        )
        with check (
          exists (
            select 1 from public.users
            where users.auth_id = auth.uid()
              and users.role = any (array['admin'::text, 'pharmacist'::text])
          )
        )
    $f$, t);
  end loop;
end $$;

drop policy if exists pi_write on public.pharmacy_inventory;
create policy pi_write on public.pharmacy_inventory
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  );

drop policy if exists po_write on public.purchase_orders;
create policy po_write on public.purchase_orders
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  );

drop policy if exists poi_write on public.purchase_order_items;
create policy poi_write on public.purchase_order_items
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  );

drop policy if exists sa_write on public.stock_adjustments;
create policy sa_write on public.stock_adjustments
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid()
        and users.role = any (array['admin'::text, 'pharmacist'::text])
    )
  );

-- Admin-only writable tables
drop policy if exists st_write on public.stock_transfers;
create policy st_write on public.stock_transfers
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  );

drop policy if exists sti_write on public.stock_transfer_items;
create policy sti_write on public.stock_transfer_items
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  );

drop policy if exists wi_write on public.warehouse_inventory;
create policy wi_write on public.warehouse_inventory
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  );

drop policy if exists wr_write on public.warehouse_receipts;
create policy wr_write on public.warehouse_receipts
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  );

drop policy if exists wri_write on public.warehouse_receipt_items;
create policy wri_write on public.warehouse_receipt_items
  as permissive for all to authenticated
  using (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.auth_id = auth.uid() and users.role = 'admin'::text
    )
  );

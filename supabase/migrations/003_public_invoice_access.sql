-- Allow unauthenticated (anon) users to read invoices by ID.
-- Required so payment links work for recipients who are not logged in.
CREATE POLICY "invoices_anon_read" ON public.invoices
  FOR SELECT TO anon USING (true);

-- Allow unauthenticated users to mark an invoice as paid after on-chain payment.
-- USING: only targets invoices not already paid (prevents double-marking).
-- WITH CHECK: the resulting row must have status='paid' (restricts what can be changed).
CREATE POLICY "invoices_anon_mark_paid" ON public.invoices
  FOR UPDATE TO anon
  USING  (status != 'paid')
  WITH CHECK (status = 'paid');

CREATE TABLE IF NOT EXISTS public.pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  owner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage pharmacies"
ON public.pharmacies
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

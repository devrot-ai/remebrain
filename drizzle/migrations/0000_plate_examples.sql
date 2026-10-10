CREATE TABLE public.plate_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  violation_id uuid,
  ai_plate text,
  correct_plate text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plate_examples TO authenticated;
GRANT ALL ON public.plate_examples TO service_role;
ALTER TABLE public.plate_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plate examples" ON public.plate_examples FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX plate_examples_owner_idx ON public.plate_examples(owner_id, created_at DESC);
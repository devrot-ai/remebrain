
CREATE POLICY "own frame objects read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'frames' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own frame objects write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'frames' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own frame objects delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'frames' AND auth.uid()::text = (storage.foldername(name))[1]);

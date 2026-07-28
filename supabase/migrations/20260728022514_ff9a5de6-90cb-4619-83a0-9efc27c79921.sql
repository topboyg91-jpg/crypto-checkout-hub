CREATE POLICY "product images readable" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product images insertable" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product images updatable" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product images deletable" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'product-images');
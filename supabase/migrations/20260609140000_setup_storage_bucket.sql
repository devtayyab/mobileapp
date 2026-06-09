-- Create the product-images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product-images' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Auth Users Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated users to update their own images
CREATE POLICY "Auth Users Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated users to delete their own images
CREATE POLICY "Auth Users Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Migration: Setup Avatars Storage Bucket
-- Creates a storage bucket for profile avatars if it doesn't exist and applies policies.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access controls for storage.
-- Policy: Anyone can read an avatar
CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'avatars' );

-- Policy: Users can upload an avatar
CREATE POLICY "Users can upload an avatar." 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar." 
  ON storage.objects FOR UPDATE 
  USING ( bucket_id = 'avatars' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar." 
  ON storage.objects FOR DELETE 
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );

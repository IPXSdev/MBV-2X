-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('music-submissions', 'music-submissions', false),
('host-images', 'host-images', true),
('platform-assets', 'platform-assets', true),
('user-avatars', 'user-avatars', true);

-- Storage policies for music submissions (private)
CREATE POLICY "Users can upload their own music" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'music-submissions' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own music" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'music-submissions' AND 
        (auth.uid()::text = (storage.foldername(name))[1] OR 
         EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev')))
    );

-- Storage policies for public assets
CREATE POLICY "Anyone can view host images" ON storage.objects
    FOR SELECT USING (bucket_id = 'host-images');

CREATE POLICY "Anyone can view platform assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'platform-assets');

CREATE POLICY "Anyone can view user avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-avatars');

-- Admin upload policies
CREATE POLICY "Admins can upload host images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'host-images' AND 
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'master_dev'))
    );

CREATE POLICY "Users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Insert master dev users
INSERT INTO users (id, email, name, tier, submission_credits, role, is_verified) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '2668harris@gmail.com',
    'Harris (Master Dev)',
    'pro',
    999,
    'master_dev',
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'ipxsdev@gmail.com',
    'IPXS Dev (Master Dev)',
    'pro',
    999,
    'master_dev',
    true
);

-- Insert hosts
INSERT INTO hosts (id, name, role, bio, image_url, specialties, years_experience, notable_works) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'Big Tank',
    'Producer & Music Supervisor',
    'Dynamic force in entertainment - producer, music supervisor, and composer who has collaborated with Rihanna, Missy Elliott, Ne-Yo, and Christina Aguilera. Former Senior VP at Sony Music with extensive TV/Film credits including BMF, Power, and Raising Kanan.',
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/big-tank.jpg-xE31OY2snwDBTIiSTMnhQLuIuJO5um.jpeg',
    ARRAY['Hip-Hop', 'R&B', 'Pop', 'Music Supervision'],
    20,
    ARRAY['BMF', 'Power', 'Raising Kanan', 'Rihanna collaborations']
),
(
    '10000000-0000-0000-0000-000000000002',
    'Rockwilder',
    'Grammy-Winning Producer',
    'Grammy Award-winning music producer whose signature sound has shaped hip-hop, R&B, and pop for over two decades. Known for iconic productions like ''Lady Marmalade'' and collaborations with Jay-Z, Eminem, Dr. Dre, and Christina Aguilera.',
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rockwilder.jpg-HjJq9vvv7hAyRf7me8lM3NKuBGYUkQ.jpeg',
    ARRAY['Hip-Hop', 'R&B', 'Pop', 'Rock'],
    25,
    ARRAY['Lady Marmalade', 'Jay-Z productions', 'Eminem collaborations']
),
(
    '10000000-0000-0000-0000-000000000003',
    'Mr. Porter',
    'Multi-Platinum Producer',
    '2x Grammy Award-winning producer and former D12 member. His revolutionary sound has contributed to nearly 40 million records sold, with collaborations spanning from Eminem and Jay Electronica to Sting and Burt Bacharach.',
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mr-porter-hrLGzmZl4A5TslwAu7nsodLy7THcom.png',
    ARRAY['Hip-Hop', 'Pop', 'Alternative', 'Electronic'],
    22,
    ARRAY['D12', 'Eminem productions', 'Jay Electronica collaborations']
);

-- Insert podcast episodes
INSERT INTO podcast_episodes (title, description, youtube_video_id, episode_number, is_featured, guest_hosts, topics, published_at) VALUES
(
    'Industry Insights Episode 1',
    'Behind the scenes with industry legends',
    's_fqfPiJmb0',
    1,
    true,
    ARRAY['10000000-0000-0000-0000-000000000001'],
    ARRAY['Music Industry', 'Production', 'Behind the Scenes'],
    NOW() - INTERVAL '30 days'
),
(
    'Industry Insights Episode 2',
    'Exclusive conversations with top producers',
    'VLeqmbdnAUs',
    2,
    true,
    ARRAY['10000000-0000-0000-0000-000000000002'],
    ARRAY['Grammy Awards', 'Production Techniques', 'Industry Stories'],
    NOW() - INTERVAL '15 days'
),
(
    'Industry Insights Episode 3',
    'The future of music production',
    'VjXv6SHHkEo',
    3,
    true,
    ARRAY['10000000-0000-0000-0000-000000000003'],
    ARRAY['Future of Music', 'Technology', 'Innovation'],
    NOW() - INTERVAL '7 days'
);

-- Insert sample placements
INSERT INTO placements (track_id, title, type, network, description) VALUES
(
    NULL, -- We'll add actual tracks later
    'Power Book II: Ghost',
    'tv_show',
    'Starz',
    'Featured in dramatic scene during season finale'
),
(
    NULL,
    'BMF',
    'tv_show', 
    'Starz',
    'Opening credits theme variation'
),
(
    NULL,
    'Raising Kanan',
    'tv_show',
    'Starz',
    'Background music during key emotional scene'
);

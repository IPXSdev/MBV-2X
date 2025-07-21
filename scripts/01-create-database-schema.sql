-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('free', 'creator', 'pro');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'master_dev');
CREATE TYPE track_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'placed');
CREATE TYPE submission_status AS ENUM ('submitted', 'reviewing', 'feedback_given', 'accepted', 'declined');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tier user_tier DEFAULT 'free',
    submission_credits INTEGER DEFAULT 2,
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    profile_image_url TEXT,
    bio TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hosts table
CREATE TABLE hosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    social_links JSONB DEFAULT '{}',
    specialties TEXT[],
    years_experience INTEGER,
    notable_works TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks table
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    duration INTEGER, -- in seconds
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    artwork_url TEXT,
    description TEXT,
    lyrics TEXT,
    bpm INTEGER,
    key_signature VARCHAR(10),
    status track_status DEFAULT 'pending',
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table (tracks submitted to specific hosts)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status submission_status DEFAULT 'submitted',
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    feedback_given_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(track_id, host_id) -- Prevent duplicate submissions
);

-- Placements table (successful placements in media)
CREATE TABLE placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- TV show, movie, etc.
    type VARCHAR(100) NOT NULL, -- 'tv_show', 'movie', 'commercial', etc.
    network VARCHAR(100),
    episode_info TEXT,
    air_date DATE,
    placement_fee DECIMAL(10,2),
    royalty_percentage DECIMAL(5,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Podcast episodes table
CREATE TABLE podcast_episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_video_id VARCHAR(50),
    duration INTEGER, -- in seconds
    episode_number INTEGER,
    season_number INTEGER DEFAULT 1,
    is_featured BOOLEAN DEFAULT false,
    guest_hosts UUID[], -- Array of host IDs
    topics TEXT[],
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for custom auth)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master dev keys table (secure storage)
CREATE TABLE master_dev_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL, -- Hashed version of the key
    key_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tracks_user_id ON tracks(user_id);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_submissions_track_id ON submissions(track_id);
CREATE INDEX idx_submissions_host_id ON submissions(host_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON hosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_podcast_episodes_updated_at BEFORE UPDATE ON podcast_episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

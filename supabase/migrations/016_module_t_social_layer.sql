-- =========================================================
-- MODULE T — SOCIAL LAYER
-- Friends, social feed, posts, likes, comments, social challenges, activity feed
-- =========================================================

-- 1. TABLES -----------------------------------------------

-- T1 — friends
-- Friend relationships between users
CREATE TABLE IF NOT EXISTS friends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending', -- pending, accepted, blocked
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- T2 — posts (social feed)
-- Users can share workouts, meals, mood, sleep, journal entries, or pure text
CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- meal, workout, mood, sleep, journal, progress, text
    content jsonb NOT NULL,
    visibility text NOT NULL DEFAULT 'friends', -- private, friends, public
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- T3 — post_likes
-- Likes on posts
CREATE TABLE IF NOT EXISTS post_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(post_id, user_id)
);

-- T4 — post_comments
-- Comments on posts
CREATE TABLE IF NOT EXISTS post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- T5 — social_challenges
-- Social challenges (steps, hydration, workouts, meditation, mood, sleep)
-- Separate from Module P's gamification challenges
CREATE TABLE IF NOT EXISTS social_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL, -- steps, water, workout, meditation, mood, sleep, habit
    goal_value integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public boolean DEFAULT true,
    description text,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- T6 — social_challenge_participants
-- Participants in social challenges
CREATE TABLE IF NOT EXISTS social_challenge_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL REFERENCES social_challenges(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    progress integer DEFAULT 0, -- updated daily
    completed boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now()),
    UNIQUE(challenge_id, user_id)
);

-- T7 — activity_feed (optional, power feature)
-- Auto-generated events (workouts done, steps goal reached, streaks, etc.)
CREATE TABLE IF NOT EXISTS activity_feed (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- workout_completed, steps_goal, water_goal, streak, mood_logged, meditation_completed
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc', now())
);

-- 2. INDEXES ----------------------------------------------

CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_challenges_type ON social_challenges(type);
CREATE INDEX IF NOT EXISTS idx_social_challenges_dates ON social_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_social_challenge_participants_challenge ON social_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_social_challenge_participants_user ON social_challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

-- 3. RLS (Row-Level Security) ----------------------------

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Policies
-- Friends: users can see their own friend relationships
CREATE POLICY "users_manage_own_friends"
ON friends
FOR ALL
USING (auth.uid() = user_id OR auth.uid() = friend_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Posts: users can see posts based on visibility
CREATE POLICY "users_view_posts"
ON posts
FOR SELECT
USING (
    visibility = 'public' OR
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM friends
        WHERE (user_id = posts.user_id AND friend_id = auth.uid() AND status = 'accepted')
           OR (user_id = auth.uid() AND friend_id = posts.user_id AND status = 'accepted')
    )) OR
    user_id = auth.uid()
);

CREATE POLICY "users_create_own_posts"
ON posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_posts"
ON posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_posts"
ON posts
FOR DELETE
USING (auth.uid() = user_id);

-- Post likes: users can like posts they can see
CREATE POLICY "users_like_visible_posts"
ON post_likes
FOR ALL
USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user_id = posts.user_id AND friend_id = auth.uid() AND status = 'accepted')
               OR (user_id = auth.uid() AND friend_id = posts.user_id AND status = 'accepted')
        )) OR
        posts.user_id = auth.uid()
    ))
)
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user_id = posts.user_id AND friend_id = auth.uid() AND status = 'accepted')
               OR (user_id = auth.uid() AND friend_id = posts.user_id AND status = 'accepted')
        )) OR
        posts.user_id = auth.uid()
    ))
);

-- Post comments: users can comment on posts they can see
CREATE POLICY "users_comment_visible_posts"
ON post_comments
FOR ALL
USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user_id = posts.user_id AND friend_id = auth.uid() AND status = 'accepted')
               OR (user_id = auth.uid() AND friend_id = posts.user_id AND status = 'accepted')
        )) OR
        posts.user_id = auth.uid()
    ))
)
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND (
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user_id = posts.user_id AND friend_id = auth.uid() AND status = 'accepted')
               OR (user_id = auth.uid() AND friend_id = posts.user_id AND status = 'accepted')
        )) OR
        posts.user_id = auth.uid()
    ))
);

-- Social challenges: public challenges visible to all, private to creator and participants
CREATE POLICY "users_view_public_challenges"
ON social_challenges
FOR SELECT
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "users_create_challenges"
ON social_challenges
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "users_update_own_challenges"
ON social_challenges
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Challenge participants: users can see participants of challenges they're in or created
CREATE POLICY "users_manage_challenge_participation"
ON social_challenge_participants
FOR ALL
USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM social_challenges WHERE id = challenge_id AND created_by = auth.uid())
)
WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM social_challenges WHERE id = challenge_id AND created_by = auth.uid())
);

-- Activity feed: users can only see their own activity
CREATE POLICY "users_view_own_activity"
ON activity_feed
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_create_own_activity"
ON activity_feed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS ---------------------------------------

-- T-RPC1 — send_friend_request(user_id, friend_id)
-- Sends a friend request
CREATE OR REPLACE FUNCTION send_friend_request(
    p_user uuid,
    p_friend uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    existing_status text;
BEGIN
    -- Check if relationship already exists
    SELECT status INTO existing_status
    FROM friends
    WHERE (user_id = p_user AND friend_id = p_friend)
       OR (user_id = p_friend AND friend_id = p_user);
    
    IF existing_status IS NOT NULL THEN
        IF existing_status = 'accepted' THEN
            RETURN jsonb_build_object('error', 'Already friends');
        ELSIF existing_status = 'pending' THEN
            RETURN jsonb_build_object('error', 'Friend request already sent');
        ELSIF existing_status = 'blocked' THEN
            RETURN jsonb_build_object('error', 'User is blocked');
        END IF;
    END IF;
    
    -- Create friend request
    INSERT INTO friends (user_id, friend_id, status)
    VALUES (p_user, p_friend, 'pending')
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'status', 'pending');
END;
$$;

-- T-RPC2 — accept_friend_request(user_id, friend_id)
-- Accepts a friend request
CREATE OR REPLACE FUNCTION accept_friend_request(
    p_user uuid,
    p_friend uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the friend request to accepted
    UPDATE friends
    SET status = 'accepted'
    WHERE user_id = p_friend AND friend_id = p_user AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Friend request not found');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'status', 'accepted');
END;
$$;

-- T-RPC3 — reject_friend_request(user_id, friend_id)
-- Rejects or removes a friend request
CREATE OR REPLACE FUNCTION reject_friend_request(
    p_user uuid,
    p_friend uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM friends
    WHERE (user_id = p_friend AND friend_id = p_user AND status = 'pending')
       OR (user_id = p_user AND friend_id = p_friend AND status = 'pending');
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- T-RPC4 — block_user(user_id, friend_id)
-- Blocks a user
CREATE OR REPLACE FUNCTION block_user(
    p_user uuid,
    p_friend uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update or insert blocked relationship
    INSERT INTO friends (user_id, friend_id, status)
    VALUES (p_user, p_friend, 'blocked')
    ON CONFLICT (user_id, friend_id)
    DO UPDATE SET status = 'blocked';
    
    RETURN jsonb_build_object('success', true, 'status', 'blocked');
END;
$$;

-- T-RPC5 — create_post(user_id, type, content, visibility)
-- Creates a social post
CREATE OR REPLACE FUNCTION create_post(
    p_user uuid,
    p_type text,
    p_content jsonb,
    p_visibility text DEFAULT 'friends'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_id uuid;
    post_count int;
    is_premium boolean;
BEGIN
    -- Check if user is premium (for post limits)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_user;
    
    -- Check daily post count (free users limited to 3/day)
    IF NOT is_premium THEN
        SELECT COUNT(*) INTO post_count
        FROM posts
        WHERE user_id = p_user
          AND DATE(created_at) = CURRENT_DATE;
        
        IF post_count >= 3 THEN
            RAISE EXCEPTION 'Free users limited to 3 posts per day. Upgrade to premium for unlimited posts.';
        END IF;
    END IF;
    
    -- Create post
    INSERT INTO posts (user_id, type, content, visibility)
    VALUES (p_user, p_type, p_content, p_visibility)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- T-RPC6 — like_post(user_id, post_id)
-- Likes a post
CREATE OR REPLACE FUNCTION like_post(
    p_user uuid,
    p_post_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO post_likes (post_id, user_id)
    VALUES (p_post_id, p_user)
    ON CONFLICT (post_id, user_id) DO NOTHING;
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- T-RPC7 — unlike_post(user_id, post_id)
-- Unlikes a post
CREATE OR REPLACE FUNCTION unlike_post(
    p_user uuid,
    p_post_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM post_likes
    WHERE post_id = p_post_id AND user_id = p_user;
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- T-RPC8 — add_comment(user_id, post_id, comment)
-- Adds a comment to a post
CREATE OR REPLACE FUNCTION add_comment(
    p_user uuid,
    p_post_id uuid,
    p_comment text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    comment_id uuid;
BEGIN
    INSERT INTO post_comments (post_id, user_id, comment)
    VALUES (p_post_id, p_user, p_comment)
    RETURNING id INTO comment_id;
    
    RETURN comment_id;
END;
$$;

-- T-RPC9 — create_social_challenge(name, type, goal_value, start_date, end_date, created_by, is_public, description)
-- Creates a social challenge
CREATE OR REPLACE FUNCTION create_social_challenge(
    p_name text,
    p_type text,
    p_goal_value integer,
    p_start_date date,
    p_end_date date,
    p_created_by uuid,
    p_is_public boolean DEFAULT true,
    p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    challenge_id uuid;
    is_premium boolean;
BEGIN
    -- Check if user is premium (only premium can create challenges)
    SELECT COALESCE(is_premium, false) INTO is_premium
    FROM user_subscriptions
    WHERE user_id = p_created_by;
    
    IF NOT is_premium THEN
        RAISE EXCEPTION 'Creating challenges requires premium subscription.';
    END IF;
    
    -- Create challenge
    INSERT INTO social_challenges (name, type, goal_value, start_date, end_date, created_by, is_public, description)
    VALUES (p_name, p_type, p_goal_value, p_start_date, p_end_date, p_created_by, p_is_public, p_description)
    RETURNING id INTO challenge_id;
    
    -- Auto-join creator
    INSERT INTO social_challenge_participants (challenge_id, user_id)
    VALUES (challenge_id, p_created_by)
    ON CONFLICT (challenge_id, user_id) DO NOTHING;
    
    RETURN challenge_id;
END;
$$;

-- T-RPC10 — join_social_challenge(user_id, challenge_id)
-- Joins a social challenge
CREATE OR REPLACE FUNCTION join_social_challenge(
    p_user uuid,
    p_challenge_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    challenge_record RECORD;
BEGIN
    -- Get challenge
    SELECT * INTO challenge_record
    FROM social_challenges
    WHERE id = p_challenge_id;
    
    IF challenge_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Challenge not found');
    END IF;
    
    -- Check if challenge is active
    IF challenge_record.end_date < CURRENT_DATE THEN
        RETURN jsonb_build_object('error', 'Challenge has ended');
    END IF;
    
    IF challenge_record.start_date > CURRENT_DATE THEN
        RETURN jsonb_build_object('error', 'Challenge has not started yet');
    END IF;
    
    -- Join challenge
    INSERT INTO social_challenge_participants (challenge_id, user_id)
    VALUES (p_challenge_id, p_user)
    ON CONFLICT (challenge_id, user_id) DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'challenge', challenge_record.name);
END;
$$;

-- T-RPC11 — update_challenge_progress(user_id, challenge_id, progress_increment)
-- Updates social challenge progress
CREATE OR REPLACE FUNCTION update_social_challenge_progress(
    p_user uuid,
    p_challenge_id uuid,
    p_progress_increment integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    challenge_record RECORD;
    current_progress integer;
    goal_value integer;
    completed boolean;
BEGIN
    -- Get challenge
    SELECT * INTO challenge_record
    FROM social_challenges
    WHERE id = p_challenge_id;
    
    IF challenge_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Challenge not found');
    END IF;
    
    -- Get current progress
    SELECT progress, completed INTO current_progress, completed
    FROM social_challenge_participants
    WHERE user_id = p_user AND challenge_id = p_challenge_id;
    
    IF current_progress IS NULL THEN
        RETURN jsonb_build_object('error', 'User not in challenge');
    END IF;
    
    IF completed THEN
        RETURN jsonb_build_object('error', 'Challenge already completed');
    END IF;
    
    -- Update progress
    current_progress := current_progress + p_progress_increment;
    goal_value := challenge_record.goal_value;
    
    IF current_progress >= goal_value THEN
        completed := true;
    END IF;
    
    UPDATE social_challenge_participants
    SET progress = current_progress,
        completed = completed
    WHERE user_id = p_user AND challenge_id = p_challenge_id;
    
    RETURN jsonb_build_object(
        'progress', current_progress,
        'goal', goal_value,
        'completed', completed
    );
END;
$$;

-- T-RPC12 — get_friends_feed(user_id, limit_count)
-- Gets social feed from friends
CREATE OR REPLACE FUNCTION get_friends_feed(
    p_user uuid,
    p_limit_count int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    type text,
    content jsonb,
    visibility text,
    created_at timestamptz,
    likes_count bigint,
    comments_count bigint,
    user_liked boolean
)
LANGUAGE sql
AS $$
    SELECT 
        p.id,
        p.user_id,
        p.type,
        p.content,
        p.visibility,
        p.created_at,
        COUNT(DISTINCT pl.id) as likes_count,
        COUNT(DISTINCT pc.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = p_user) as user_liked
    FROM posts p
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    LEFT JOIN post_comments pc ON pc.post_id = p.id
    WHERE (
        p.visibility = 'public' OR
        (p.visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friends
            WHERE (user_id = p.user_id AND friend_id = p_user AND status = 'accepted')
               OR (user_id = p_user AND friend_id = p.user_id AND status = 'accepted')
        )) OR
        p.user_id = p_user
    )
    GROUP BY p.id, p.user_id, p.type, p.content, p.visibility, p.created_at
    ORDER BY p.created_at DESC
    LIMIT p_limit_count;
$$;

-- T-RPC13 — log_activity(user_id, event_type, metadata)
-- Logs an activity feed event
CREATE OR REPLACE FUNCTION log_activity(
    p_user uuid,
    p_event_type text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    activity_id uuid;
BEGIN
    INSERT INTO activity_feed (user_id, event_type, metadata)
    VALUES (p_user, p_event_type, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$;

-- T-RPC14 — get_friends_list(user_id)
-- Gets list of friends
CREATE OR REPLACE FUNCTION get_friends_list(p_user uuid)
RETURNS TABLE (
    friend_id uuid,
    status text,
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        CASE 
            WHEN user_id = p_user THEN friend_id
            ELSE user_id
        END as friend_id,
        status,
        created_at
    FROM friends
    WHERE (user_id = p_user OR friend_id = p_user)
      AND status = 'accepted'
    ORDER BY created_at DESC;
$$;

-- T-RPC15 — get_pending_friend_requests(user_id)
-- Gets pending friend requests
CREATE OR REPLACE FUNCTION get_pending_friend_requests(p_user uuid)
RETURNS TABLE (
    friend_id uuid,
    direction text, -- 'sent' or 'received'
    created_at timestamptz
)
LANGUAGE sql
AS $$
    SELECT 
        CASE 
            WHEN user_id = p_user THEN friend_id
            ELSE user_id
        END as friend_id,
        CASE 
            WHEN user_id = p_user THEN 'sent'
            ELSE 'received'
        END as direction,
        created_at
    FROM friends
    WHERE (user_id = p_user OR friend_id = p_user)
      AND status = 'pending'
    ORDER BY created_at DESC;
$$;


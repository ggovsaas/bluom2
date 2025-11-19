# ✅ MODULE T — SOCIAL LAYER — COMPLETE

## 📋 Overview

Module T creates the **social layer** for Bluöm, transforming it from a personal health tracker into a **community-driven experience**. This module includes friends, social feed, posts, likes, comments, social challenges, and activity feed. All features are premium-friendly with appropriate gating.

## 🎯 What This Module Adds

### Core Features
- **Friends System** - Add friends, send/accept/reject requests, block users
- **Social Feed** - Share meals, workouts, mood, sleep, journal entries, or text posts
- **Likes & Comments** - Engage with posts through likes and comments
- **Social Challenges** - Create and join challenges (steps, water, workouts, meditation, mood, sleep, habit)
- **Activity Feed** - Auto-generated events (workouts, goals reached, streaks)
- **Privacy Controls** - Posts can be private, friends-only, or public
- **Premium Gating** - Some features require premium (create challenges, unlimited posts)

## 📊 Database Schema

### New Tables

1. **`friends`**
   - Friend relationships between users
   - Fields: id, user_id, friend_id, status (pending, accepted, blocked), created_at
   - Unique constraint on (user_id, friend_id)
   - Check constraint: user_id != friend_id

2. **`posts`**
   - Social feed posts
   - Fields: id, user_id, type (meal, workout, mood, sleep, journal, progress, text), content (jsonb), visibility (private, friends, public), created_at
   - Example content:
     ```json
     {
       "mood": "happy",
       "meal": "Chicken and rice",
       "calories": 540
     }
     ```

3. **`post_likes`**
   - Likes on posts
   - Fields: id, post_id, user_id, created_at
   - Unique constraint on (post_id, user_id)

4. **`post_comments`**
   - Comments on posts
   - Fields: id, post_id, user_id, comment, created_at

5. **`social_challenges`**
   - Social challenges (separate from Module P's gamification challenges)
   - Fields: id, name, type (steps, water, workout, meditation, mood, sleep, habit), goal_value, start_date, end_date, created_by, is_public, description, created_at

6. **`social_challenge_participants`**
   - Participants in social challenges
   - Fields: id, challenge_id, user_id, progress, completed, created_at
   - Unique constraint on (challenge_id, user_id)

7. **`activity_feed`**
   - Auto-generated events
   - Fields: id, user_id, event_type, metadata (jsonb), created_at
   - Event types: workout_completed, steps_goal, water_goal, streak, mood_logged, meditation_completed

## 🔧 RPC Functions

### Friend Functions

1. **`send_friend_request(user_id, friend_id)`**
   - Sends a friend request
   - Returns: success, status
   - Handles existing relationships (already friends, pending, blocked)

2. **`accept_friend_request(user_id, friend_id)`**
   - Accepts a friend request
   - Returns: success, status

3. **`reject_friend_request(user_id, friend_id)`**
   - Rejects or removes a friend request
   - Returns: success

4. **`block_user(user_id, friend_id)`**
   - Blocks a user
   - Returns: success, status

5. **`get_friends_list(user_id)`**
   - Gets list of accepted friends
   - Returns: friend_id, status, created_at

6. **`get_pending_friend_requests(user_id)`**
   - Gets pending friend requests (sent and received)
   - Returns: friend_id, direction (sent/received), created_at

### Post Functions

7. **`create_post(user_id, type, content, visibility)`**
   - Creates a social post
   - **Premium Check**: Free users limited to 3 posts/day, premium unlimited
   - Returns: post_id

8. **`like_post(user_id, post_id)`**
   - Likes a post
   - Returns: success

9. **`unlike_post(user_id, post_id)`**
   - Unlikes a post
   - Returns: success

10. **`add_comment(user_id, post_id, comment)`**
    - Adds a comment to a post
    - Returns: comment_id

11. **`get_friends_feed(user_id, limit_count)`**
    - Gets social feed from friends
    - Returns: post details with likes_count, comments_count, user_liked
    - Respects visibility settings

### Challenge Functions

12. **`create_social_challenge(name, type, goal_value, start_date, end_date, created_by, is_public, description)`**
    - Creates a social challenge
    - **Premium Only**: Only premium users can create challenges
    - Auto-joins creator
    - Returns: challenge_id

13. **`join_social_challenge(user_id, challenge_id)`**
    - Joins a social challenge
    - Validates challenge is active
    - Returns: success, challenge name

14. **`update_social_challenge_progress(user_id, challenge_id, progress_increment)`**
    - Updates challenge progress
    - Checks for completion
    - Returns: progress, goal, completed

### Activity Functions

15. **`log_activity(user_id, event_type, metadata)`**
    - Logs an activity feed event
    - Returns: activity_id

## 🔐 Security (RLS)

All tables have Row Level Security enabled:

- **friends** - Users can see their own friend relationships
- **posts** - Users can see posts based on visibility (public, friends, private)
- **post_likes** - Users can like posts they can see
- **post_comments** - Users can comment on posts they can see
- **social_challenges** - Public challenges visible to all, private to creator
- **social_challenge_participants** - Users can see participants of challenges they're in or created
- **activity_feed** - Users can only see their own activity

## 🎮 Premium Gating

| Feature                      | Free               | Premium   |
| ---------------------------- | ------------------ | --------- |
| Add friends                  | ✔️                 | ✔️        |
| Join challenges              | ✔️                 | ✔️        |
| Post to feed                 | ✔️ limited (3/day) | unlimited |
| View unlimited feed          | ✔️                 | ✔️        |
| Comment                      | ✔️                 | ✔️        |
| Emoji reacts                 | ✔️                 | ✔️        |
| Create challenges            | ❌                  | ✔️        |
| Advanced challenge analytics | ❌                  | ✔️        |
| Global leaderboard           | ❌                  | ✔️        |
| Share journal entries        | ❌                  | ✔️        |
| AI challenge suggestions     | ❌                  | ✔️        |

## 🔗 Cross-Module Integrations

### Auto-Create Posts

Automatically create posts when user:
- Logs a workout → `create_post(user_id, 'workout', {...})`
- Completes a habit → `create_post(user_id, 'progress', {...})`
- Hits water target → `create_post(user_id, 'progress', {...})`
- Hits steps target → `create_post(user_id, 'progress', {...})`
- Hits a sleep streak → `create_post(user_id, 'streak', {...})`
- Logs strong mood → `create_post(user_id, 'mood', {...})`
- Completes meditation → `create_post(user_id, 'meditation', {...})`
- Achieves a streak (Module P) → `create_post(user_id, 'streak', {...})`

### Auto-Challenge Updates

Update challenge progress every midnight:
- Steps → `update_social_challenge_progress()` from `steps_tracking`
- Water → `update_social_challenge_progress()` from `meal_logs` (water)
- Workouts → `update_social_challenge_progress()` from `workout_logs`
- Meditation minutes → `update_social_challenge_progress()` from `meditation_logs`
- Mood streak → `update_social_challenge_progress()` from `moods`
- Habit streak → `update_social_challenge_progress()` from `habit_logs`

### AI Coach Integration (Module K)

AI Coach can generate:
- Friend suggestions based on similar goals/activity
- Challenge recommendations based on user progress
- "Social Health Score" based on engagement

### Notification Hooks (Module H)

Push notifications:
- "Your friend ___ invited you to a challenge."
- "New comment on your post."
- "___ liked your workout."
- "You're falling behind in your challenge."
- "3 days left in your meditation challenge."

## 📈 Performance

### Indexes Created
- `idx_friends_user` - Fast friend queries
- `idx_friends_friend` - Fast friend lookups
- `idx_friends_status` - Fast status filtering
- `idx_posts_user` - Fast user posts
- `idx_posts_type` - Fast type filtering
- `idx_posts_created` - Fast chronological feed
- `idx_posts_visibility` - Fast visibility filtering
- `idx_post_likes_post` - Fast like counts
- `idx_post_likes_user` - Fast user likes
- `idx_post_comments_post` - Fast comment counts
- `idx_post_comments_user` - Fast user comments
- `idx_social_challenges_type` - Fast challenge type filtering
- `idx_social_challenges_dates` - Fast active challenge queries
- `idx_social_challenge_participants_challenge` - Fast participant queries
- `idx_social_challenge_participants_user` - Fast user challenge queries
- `idx_activity_feed_user` - Fast user activity
- `idx_activity_feed_type` - Fast event type filtering
- `idx_activity_feed_created` - Fast chronological activity

## ✅ Migration File

**File**: `supabase/migrations/016_module_t_social_layer.sql`

### How to Apply

1. Open Supabase SQL Editor
2. Copy the entire contents of `016_module_t_social_layer.sql`
3. Paste into SQL Editor
4. Click **Run**

### What It Does

- Creates 7 new tables (friends, posts, post_likes, post_comments, social_challenges, social_challenge_participants, activity_feed)
- Creates 15 RPC functions (friend management, post management, challenge management, activity logging)
- Sets up RLS policies with complex visibility logic
- Creates performance indexes
- Handles premium gating for post limits and challenge creation

### Dependencies

- **Module S** (Subscriptions) - Checks `is_premium` for post limits and challenge creation
- **All Modules** - Can auto-create posts from any activity
- **Module P** (Rewards) - Can integrate challenge rewards
- **Module H** (Notifications) - Can send social notifications
- **Module K** (AI Coach) - Can generate friend/challenge suggestions

## 🎯 Next Steps

1. **Frontend Integration** - Build Friends tab, Social Feed, Challenges tab
2. **Auto-Post Integration** - Add `create_post()` calls to activity logging endpoints
3. **Challenge Updates** - Set up daily CRON to update challenge progress
4. **Activity Feed** - Add `log_activity()` calls throughout the app
5. **Notification Integration** - Connect to Module H for social notifications
6. **AI Integration** - Connect to Module K for friend/challenge suggestions
7. **Premium Checks** - Add premium checks for challenge creation and post limits

## 🎨 UI/UX Blueprint

### Friends Tab
- Friend Requests (sent/received)
- Add Friends (search emails/usernames)
- Friend List
- Blocked List

### Social Feed
- Profile picture
- Username
- Time
- Type icon (meal/mood/workout/journal)
- Content preview
- Emoji reactions
- Comments
- Share button (premium-only)

### Challenges Tab
- Categories: Steps, Hydration, Workouts, Meditation, Mood streak, Habit streak
- Sections: Featured Challenges, Friends Challenges, My Challenges, Completed
- Challenge Screen: Goal progress ring, Leaderboard (friends only or global), Share progress to feed

## 🎉 Module T Status: COMPLETE

This module creates the **social layer** that transforms Bluöm into a **community-driven experience** with:
- ✅ Friends system
- ✅ Social feed with posts
- ✅ Likes and comments
- ✅ Social challenges
- ✅ Activity feed
- ✅ Privacy controls
- ✅ Premium gating
- ✅ Full RLS security
- ✅ Performance optimized

Bluöm now has the social features to compete with **Strava, MyFitnessPal Community, and other social fitness apps**! 👥🎯


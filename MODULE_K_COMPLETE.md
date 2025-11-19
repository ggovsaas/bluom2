# ✅ Module K - AI Coach Engine - COMPLETE

## 📦 What Was Created

### 1. Database Migration
- **File**: `supabase/migrations/008_module_k_ai_coach_engine.sql`
- **Status**: Ready to run in Supabase SQL Editor
- **Contains**: All AI coach tables, RPC functions, RLS policies, indexes, triggers

## 🎯 Module K Tables Created (5 tables)

1. **ai_coach_context** - What the AI knows about each user
   - Profile JSONB (age, weight, goal, preferences)
   - Nutrition JSONB (calories, macros, diet preference)
   - Fitness JSONB (workout split, schedules)
   - Wellness JSONB (sleep target, mood baseline, habits)
   - Recent logs JSONB (last 7 days of data)
   - Insights JSONB (AI-generated insights saved weekly)
   - Auto-updated timestamp

2. **ai_messages** - Chat history between user and AI
   - Role: user, assistant, or system
   - Message text
   - Metadata JSONB
   - Keeps only last 30 messages per user (auto-cleanup)

3. **ai_daily_coach_queue** - Scheduled daily coaching messages
   - Delivery time (when to send)
   - Type: motivation, nutrition, fitness, wellness, habit, accountability
   - Payload JSONB (text, action, etc.)
   - Delivered flag

4. **ai_weekly_reports** - Weekly AI-generated check-in summaries
   - Report JSONB (full 360° analysis)
   - Week start/end dates
   - Generated every Sunday at 7pm

5. **ai_insights_saved** - AI-generated insights from pattern detection
   - Category: sleep, mood, workout_consistency, nutrition_patterns, hydration, stress
   - Insight text
   - Severity (1-5 scale)
   - Metadata JSONB

## 🔧 RPC Functions (12 functions)

### Context Management
1. **`update_coach_context(...)`** - Update AI coach context
   - Updates profile, nutrition, fitness, wellness, recent_logs, insights
   - Upserts (creates if doesn't exist)
   - SECURITY DEFINER for backend access

2. **`get_coach_context(user_id)`** - Get AI coach context
   - Returns all context JSONB fields
   - SECURITY DEFINER for backend access

### Chat Management
3. **`add_ai_message(user_id, role, message, metadata)`** - Add message to chat
   - Supports user, assistant, system roles
   - Returns message UUID

4. **`get_recent_messages(user_id, limit)`** - Get last N messages
   - Default limit: 30 messages
   - Ordered by created_at DESC (most recent first)
   - Used for chat context

5. **`cleanup_old_messages(user_id)`** - Keep only last 30 messages
   - Deletes older messages
   - SECURITY DEFINER for backend automation

### Daily Coaching
6. **`queue_daily_coach_message(...)`** - Queue daily coaching message
   - Sets delivery_time, type, payload
   - Returns queue UUID
   - SECURITY DEFINER for backend access

7. **`get_pending_coach_messages(limit)`** - Get messages ready for delivery
   - Returns undelivered messages where delivery_time <= now
   - Ordered by delivery_time ASC
   - SECURITY DEFINER for backend access

8. **`mark_coach_message_delivered(message_id)`** - Mark as delivered
   - Updates delivered flag
   - SECURITY DEFINER for backend access

### Weekly Reports
9. **`save_weekly_report(...)`** - Save weekly AI report
   - Stores report JSONB with week dates
   - Returns report UUID
   - SECURITY DEFINER for backend access

10. **`get_latest_weekly_report(user_id)`** - Get most recent report
    - Returns latest report ordered by week_start DESC
    - Used in UI to display weekly summary

### Insights
11. **`save_ai_insight(...)`** - Save AI-generated insight
    - Stores category, insight text, severity, metadata
    - Returns insight UUID
    - SECURITY DEFINER for backend access

12. **`get_user_insights(user_id, category_filter)`** - Get insights
    - Optional category filter
    - Ordered by created_at DESC
    - Used in Insights tab

## 🔒 Security Features

- **RLS Enabled**: All tables have Row Level Security
- **User Isolation**: Users can only access their own data
- **Policies**: 
  - Users manage their own context and messages
  - Users view their own reports and insights
  - Backend can insert reports and insights (via service role)
- **SECURITY DEFINER**: Backend functions use DEFINER for service access

## ⚡ Performance Optimizations

Indexes created for:
- `ai_messages(user_id, created_at DESC)` - Fast chat history queries
- `ai_daily_coach_queue(user_id, delivery_time)` - Fast queue lookups
- `ai_daily_coach_queue(delivered, delivery_time)` - Fast pending messages
- `ai_weekly_reports(user_id, week_start DESC)` - Fast report queries
- `ai_insights_saved(user_id, category)` - Fast insight filtering
- `ai_insights_saved(user_id, created_at DESC)` - Fast recent insights

## 🧠 AI Coach Integration

### Context Building
The AI coach context combines:
- User profile (from Module A)
- Personalized plan (from Module A)
- Last 7 days logs:
  - Meal logs (from Module B)
  - Workouts (from Module D)
  - Steps (from Module D)
  - Mood (from Module C)
  - Sleep (from Module C)
  - Habits (from Module C)
- Analytics summaries (from Module E)
- Insights (from Module E)

### Daily Coaching Pipeline
1. **Morning (8:30 AM)** → Nutrition target reminder
2. **Noon (12:30 PM)** → Meal reminder
3. **Afternoon (3:00 PM)** → Movement reminder
4. **Evening (8:00 PM)** → Recovery + sleep reminder

Messages are queued in `ai_daily_coach_queue` and delivered via Module H (Notifications).

### Weekly Report Pipeline
Every Sunday at 7pm:
1. AI analyzes week's data
2. Generates summary, trends, patterns, recommendations
3. Saves to `ai_weekly_reports`
4. Sends notification to user

### Insight Detection
AI automatically detects:
- **Sleep debt pattern**: "3 days of <6h sleep → higher stress score"
- **Mood-sleep correlation**: "Poor sleep on same days as low mood"
- **Workout inconsistency**: "2 missed workouts → propose lower volume"
- **Nutrition mismatch**: "Calories hit but protein 40% below target"

## 📱 Frontend Integration

### Chat Interface
```typescript
// Get recent messages for context
const messages = await supabase.rpc('get_recent_messages', {
  user_id_param: userId,
  limit_count: 30
});

// Add user message
await supabase.rpc('add_ai_message', {
  user_id_param: userId,
  role_param: 'user',
  message_param: userMessage
});

// Add AI response
await supabase.rpc('add_ai_message', {
  user_id_param: userId,
  role_param: 'assistant',
  message_param: aiResponse
});
```

### Daily Coaching
```typescript
// Queue morning message
await supabase.rpc('queue_daily_coach_message', {
  user_id_param: userId,
  delivery_time_param: nextMorning,
  type_param: 'nutrition',
  payload_param: {
    text: `Good morning! Your target today is ${calories} calories.`,
    action: 'openFuel'
  }
});
```

## ⚠️ Important Notes

- **Message Limits**: Chat history automatically trimmed to last 30 messages
- **Context Updates**: Backend should update context daily or when significant data changes
- **Daily Queue**: Messages are queued and delivered via Module H notifications
- **Weekly Reports**: Generated automatically every Sunday (backend cron job)
- **Insights**: AI generates insights based on pattern detection (backend logic)
- **Integration**: This module integrates with ALL previous modules (A-H)

## ✅ Status

**Module K is complete and ready for Supabase migration.**

This module provides the complete AI Coach system:
- AI chat with context-aware responses
- Daily automated coaching messages
- Weekly AI-generated reports
- Smart insights from pattern detection
- Full integration with all data modules

**🎉 The AI Coach Engine is now ready to power personalized coaching across Fitness, Nutrition, Wellness, Habits, Sleep, and Accountability!**


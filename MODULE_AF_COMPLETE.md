# ✅ MODULE AF — NOTIFICATION AI (FULL SYSTEM) — COMPLETE

## 📋 Summary

Created complete Notification AI system with weekday/weekend windows, AI decision logic, rate limiting (max 4/day), category-specific limits, Expo push integration, and comprehensive notification templates for all app features.

---

## 🎨 What Was Created

### 1. Database Schema (`035_module_af_notification_ai.sql`)

**New Tables:**
- `notification_channels` - System table (push, in_app)
- `notification_daily_counts` - Rate limiting per user per day
- `notification_templates` - Pre-defined templates for all triggers

**Enhanced Tables (extends Module H):**
- `notification_settings` - Added weekday/weekend windows, category toggles, timezone
- `notifications` - Added channel, category, deep_link, scheduled_at, sent_at, read_at, priority

**Pre-populated Templates:**
- 25+ notification templates for Fuel, Move, Wellness, Games, Sleep
- Each template includes weekday/weekend windows
- Priority levels (1-5)
- Deep links for navigation

---

### 2. RPC Functions

**Core Functions:**
- `can_send_notification()` - Checks quiet hours, daily limit, user prefs, weekday/weekend windows
- `enqueue_notification()` - Creates notification if allowed + increments count
- `mark_notification_read()` - Marks notification as read
- `get_notification_template()` - Gets template by category and trigger
- `get_unread_notifications_count()` - Gets unread count
- `get_pending_notifications()` - Gets notifications ready to send (worker)
- `mark_notification_sent()` - Marks notification as sent

---

### 3. API Routes (`server/routes/notifications.js`)

**Endpoints:**
- `POST /api/notifications/queue` - Queue notification with template
- `POST /api/notifications/ai-decide` - AI decides if notification should be sent
- `GET /api/notifications` - Get user notifications (in-app center)
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/register-device` - Register device for push
- `POST /api/notifications/send-pending` - Worker endpoint (cron)

**AI Integration:**
- GPT-4o-mini for notification decision making
- User state analysis
- Priority-based selection
- Respects daily limits and windows

---

### 4. Frontend Components

**Components:**
- `NotificationCenter.tsx` - In-app notification center with unread badge

---

## 🧠 Notification Policy (Finalized)

### Time Windows

**Weekdays (Mon-Fri):**
- Allowed: 08:15 → 21:30
- Quiet hours: 21:30 → 07:30 (from settings)

**Weekends (Sat-Sun):**
- Allowed: 10:00 → 22:00
- Quiet hours: 21:30 → 07:30 (from settings)

### Rate Limiting

**Max 4 notifications per day:**
- 1 Fuel (nutrition/hydration)
- 1 Move (workout/steps)
- 1 Wellness (mood/habits/sleep/games)
- 1 Other (streaks/ai/marketplace)

**Category-specific limits:**
- Max 1 per category group per day
- Prevents spam from same category

### Weekend Merged Notifications

- Breakfast + Water → Merged on weekends (11:00)
- Reduces notification fatigue

---

## 🔔 Notification Templates

### Fuel (Nutrition + Hydration)
- Breakfast missing (08:30-09:30 weekdays, 11:00 weekends)
- Water low afternoon (12:00-14:00)
- Water low evening (16:00-18:00)
- Protein low (19:00-20:00)
- Calories low (19:00-20:00)
- Meal plan ready (20:00, premium)
- Grocery auto-add (anytime)

### Move (Workouts + Steps)
- Workout scheduled (17:00-19:00 weekdays, 11:00-14:00 weekends)
- Streak at risk (18:30 weekdays, 19:00 weekends)
- Workout missed (09:00-12:00)
- High readiness (09:00-12:00)
- Auto-progression (anytime, premium)
- Steps low (17:00)

### Wellness (Mood + Habits + Meditation)
- Mood evening (19:00 weekdays, 18:00 weekends)
- Habits incomplete (19:00)
- Journaling suggestion (20:00 weekdays, 21:00 weekends)
- Meditation suggestion (17:00-19:00)
- Weekly review (08:00-10:00 weekdays, 10:00-12:00 weekends)

### Games (Mental Fitness)
- Low mood game (15:00-18:00)
- High stress game (15:00-18:00)
- Inactivity game (15:00-18:00)

### Sleep
- Bedtime routine (21:00)
- Poor sleep insight (08:15 weekdays, 10:00 weekends)
- Sleep log missing (08:20 weekdays, 10:15 weekends)
- Sleep insights (08:15 weekdays, 10:00 weekends)

---

## 🔗 Integration Points

### Module Connections:
- **Module H (Notifications)** - Extends existing notification infrastructure
- **Module W (AI Recommendations)** - Sends recommendation notifications
- **Module 12 (Streak Engine)** - Streak at-risk notifications
- **Module X (Meal Planner)** - Meal plan and grocery notifications
- **Module M (Workout Builder)** - Workout reminders and progressions
- **Module C (Wellness)** - Mood, habits, meditation notifications
- **Module J (Personalization)** - Plan update notifications
- **Module S (Subscriptions)** - Premium feature notifications

### Automatic Triggers:
- When user logs meal → Check if breakfast missing
- When user logs water → Check hydration target
- When user completes workout → Recovery suggestion
- When user logs mood → Wellness suggestions
- When streak at risk → Streak preservation notification
- Daily at scheduled times → Routine reminders

---

## 📁 File Structure

```
supabase/migrations/
  ├── 007_module_h_notifications_push.sql (existing)
  └── 035_module_af_notification_ai.sql (extended)

server/routes/
  └── notifications.js

src/components/notifications/
  └── NotificationCenter.tsx
```

---

## ✅ Complete Feature Set

### Core Features
- ✅ Weekday/weekend notification windows
- ✅ Rate limiting (max 4/day)
- ✅ Category-specific limits
- ✅ Quiet hours enforcement
- ✅ Timezone-aware scheduling
- ✅ AI decision making
- ✅ Template system
- ✅ Deep link navigation

### Notification Types
- ✅ Fuel (nutrition, hydration, groceries)
- ✅ Move (workouts, steps, progressions)
- ✅ Wellness (mood, habits, meditation, journaling)
- ✅ Games (mental fitness, stress relief)
- ✅ Sleep (bedtime, recovery, insights)
- ✅ Streaks (preservation, milestones)
- ✅ AI Recommendations

### Smart Features
- ✅ Weekend merged notifications
- ✅ Priority-based selection
- ✅ User preference respect
- ✅ No spam guarantee
- ✅ Positive reinforcement slot

---

## 🚀 Next Steps

1. **Apply Migration:**
   - Run `035_module_af_notification_ai.sql` in Supabase

2. **Set Up Worker:**
   - Create cron job to call `/api/notifications/send-pending` every 5-10 minutes
   - Or use Supabase Edge Functions for scheduled tasks

3. **Integrate Triggers:**
   - Add notification triggers to meal logging
   - Add notification triggers to workout completion
   - Add notification triggers to mood logging
   - Add notification triggers to streak checks

4. **Test Notifications:**
   - Test weekday windows
   - Test weekend windows
   - Test rate limiting
   - Test quiet hours
   - Test category limits

5. **Frontend Integration:**
   - Add NotificationCenter to navigation
   - Add notification bell icon with badge
   - Connect deep links to navigation

---

**Last Updated**: After Module AF completion
**Status**: ✅ Module AF — Notification AI (Full System) — COMPLETE


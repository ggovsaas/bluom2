# ✅ Module H - Notifications & Push System - COMPLETE

## 📦 What Was Created

### 1. Database Migration
- **File**: `supabase/migrations/007_module_h_notifications_push.sql`
- **Status**: Ready to run in Supabase SQL Editor
- **Contains**: All notification tables, RPC functions, RLS policies, indexes, triggers

## 🎯 Module H Tables Created (5 tables)

1. **user_devices** - Device token management
   - Stores Expo push tokens or FCM tokens
   - Supports iOS, Android, Web
   - Unique constraint on push_token (auto-updates if device re-registers)
   - Tracks device_type and timestamps

2. **notification_settings** - User notification preferences
   - Per-type toggles: hydration, meals, steps, workouts, sleep, mindfulness, marketing
   - Quiet hours: do_not_disturb_start (default 21:00), do_not_disturb_end (default 08:00)
   - Unique constraint on user_id (one row per user)

3. **notifications** - Notification history
   - Tracks all sent notifications
   - Fields: title, body, type, delivered status
   - Used for analytics and debugging

4. **scheduled_notifications** - User-set reminders
   - Supports: meals, hydration, sleep, habits, medication
   - Schedule: time of day
   - Repeat: daily, hourly, weekly, once
   - Enabled/disabled toggle

5. **smart_triggers** - AI/autonomic notifications
   - Trigger types: hydration, sleep, mood, steps, workout, nutrition
   - Stores metadata as JSONB
   - Tracks when triggered and if notification was sent

## 🔧 RPC Functions (8 functions)

### Device Management
1. **`register_device(device_type, push_token)`** - Register device for push
   - Upserts on push_token (updates if exists)
   - Returns device UUID
   - Auto-sets user_id from auth

2. **`get_user_push_tokens(user_id)`** - Get all active tokens
   - Returns device_id, device_type, push_token
   - Used by backend to send notifications
   - SECURITY DEFINER for backend access

### Settings Management
3. **`update_notification_settings(...)`** - Update preferences
   - All parameters optional (only updates provided ones)
   - Upserts (creates if doesn't exist)
   - Sets defaults if not provided

### Notification Management
4. **`should_notify_now(user_id, check_time)`** - Check if should notify
   - Respects quiet hours
   - Handles timezone from users table
   - Handles midnight-spanning quiet hours (21:00-08:00)
   - Returns boolean

5. **`create_scheduled_notification(...)`** - Create reminder
   - Returns notification UUID
   - Auto-sets user_id from auth

6. **`log_notification(user_id, title, body, type)`** - Log sent notification
   - Creates history record
   - Returns notification UUID
   - SECURITY DEFINER for backend access

7. **`mark_notification_delivered(notification_id)`** - Mark as delivered
   - Updates delivered flag
   - User can only update their own notifications

### Smart Triggers
8. **`create_smart_trigger(user_id, trigger_type, metadata)`** - Create AI trigger
   - Stores trigger with metadata JSONB
   - SECURITY DEFINER for backend/AI access
   - Returns trigger UUID

## 🔒 Security Features

- **RLS Enabled**: All tables have Row Level Security
- **User Isolation**: Users can only access their own data
- **Policies**: 
  - Users manage their own devices and settings
  - Users view their own notifications
  - Users manage their own scheduled notifications
  - Backend can insert smart triggers (via service role)
- **SECURITY DEFINER**: Backend functions use DEFINER for service access

## ⚡ Performance Optimizations

Indexes created for:
- `user_devices(user_id)` - Fast device lookups
- `user_devices(push_token)` - Fast token lookups
- `notification_settings(user_id)` - Fast settings lookup
- `notifications(user_id, created_at)` - Fast history queries
- `notifications(delivered)` - Fast undelivered queries
- `scheduled_notifications(user_id)` - Fast scheduled lookup
- `scheduled_notifications(enabled)` - Fast active reminders
- `smart_triggers(user_id, triggered_at)` - Fast trigger queries

## 🧠 Smart Notification Logic

### Hydration Reminders
- Trigger if: < 40% hydration by mid-day
- Trigger if: No hydration logged for 4 hours
- Trigger if: AI detects dehydration pattern

### Sleep Reminders
- Trigger if: Sleep < 6h two nights in a row
- Trigger if: Low mood + poor sleep
- Trigger if: Off-track from sleep goal

### Steps Reminders
- Trigger if: No walking by 15:00
- Trigger if: Behind weekly trend

### Mood Reminders
- Trigger if: 3 negative moods in 3 days
- Trigger if: Mood drop after poor sleep
- Trigger if: Mood drop after missed workouts

## 📱 Client Implementation (Expo)

### Example: Register Device
```typescript
import * as Notifications from "expo-notifications";

const registerDevice = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.rpc('register_device', {
    device_type_param: Platform.OS,
    push_token_param: token
  });
};
```

## ⚠️ Important Notes

- **Quiet Hours Logic**: Handles both normal hours (10:00-14:00) and midnight-spanning hours (21:00-08:00)
- **Time-Zone Aware**: Uses timezone from `users` table, defaults to UTC if not set
- **Push Token Management**: Tokens are unique - re-registering updates existing record
- **Notification Settings**: One row per user (unique constraint)
- **Smart Triggers**: Backend/AI generates triggers based on analytics data
- **Notification History**: All sent notifications are logged for analytics

## ✅ Status

**Module H is complete and ready for Supabase migration.**

This module provides the complete notification system:
- Cross-platform push notifications (iOS, Android, Web)
- User notification preferences
- Quiet hours enforcement
- Scheduled reminders
- AI-powered smart notifications
- Notification history and analytics

**🎉 ALL CORE DATABASE MODULES (A-H) ARE NOW COMPLETE!**

The entire Supabase schema for Blüom/AI Fitness App is ready for production use.


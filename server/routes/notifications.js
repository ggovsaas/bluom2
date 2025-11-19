// server/routes/notifications.js
// Module AF: Notification AI API Routes
// Handles notification queuing, AI decision logic, Expo push, and notification center

import express from 'express';
import { supabase } from '../supabase/client.js';
import OpenAI from 'openai';
import { sendPush, sendBatchPush, canSendNotification, deliverQueuedNotifications } from '../utils/sendPush.js';
import { getNotificationMessage, getNotificationTitle } from '../utils/notificationTones.js';

const router = express.Router();

// Lazy initialization of OpenAI client
let openai = null;
function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      throw new Error('OPENAI_API_KEY not set in .env');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Middleware to authenticate user
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// POST /api/notifications/queue
// Queue a notification (with AI decision)
router.post('/queue', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { category, trigger_type, data } = req.body;

    if (!category || !trigger_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category and trigger_type required' 
      });
    }

    // Get template
    const { data: template } = await supabase
      .rpc('get_notification_template', {
        p_category: category,
        p_trigger_type: trigger_type
      });

    if (!template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }

    // Get user tone preference
    const { data: tone } = await supabase
      .rpc('get_user_tone_preference', { p_user_id: userId });

    const userTone = tone || 'friendly';

    // Get notification message with tone variant
    let title = getNotificationTitle(category, trigger_type, userTone);
    let body = getNotificationMessage(category, trigger_type, userTone, data || {});
    
    // Fallback to template if tone variant not available
    if (!title || title === 'Notification') {
      title = template.title_template;
    }
    if (!body || body === 'Notification') {
      body = template.body_template;
    }
    
    // Replace template variables
    if (data) {
      Object.keys(data).forEach(key => {
        title = title.replace(`{${key}}`, data[key]);
        body = body.replace(`{${key}}`, data[key]);
      });
    }

    // Queue notification
    const { data: notificationId, error } = await supabase
      .rpc('enqueue_notification', {
        p_user_id: userId,
        p_channel: 'push',
        p_category: category,
        p_title: title,
        p_body: body,
        p_deep_link: template.deep_link,
        p_scheduled_at: null,
        p_priority: template.priority
      });

    if (error) {
      console.error('Error queuing notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to queue notification' 
      });
    }

    res.json({ 
      success: true, 
      notification_id: notificationId 
    });

  } catch (error) {
    console.error('Error queuing notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to queue notification' 
    });
  }
});

// POST /api/notifications/ai-decide
// AI decides if notification should be sent
router.post('/ai-decide', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Build user state
    const { data: userState } = await supabase
      .rpc('build_user_state', {
        p_user_id: userId,
        p_days: 14
      });

    // Get daily notification count
    const { data: dailyCount } = await supabase
      .from('notification_daily_counts')
      .select('count')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    // AI decision
    const decision = await makeAIDecision(userState, dailyCount?.count || 0);

    if (decision.send) {
      // Queue the notification
      const { data: notificationId } = await supabase
        .rpc('enqueue_notification', {
          p_user_id: userId,
          p_channel: 'push',
          p_category: decision.category,
          p_title: decision.title,
          p_body: decision.body,
          p_deep_link: decision.deep_link || null,
          p_priority: decision.priority || 1
        });

      res.json({ 
        success: true, 
        decision: decision,
        notification_id: notificationId 
      });
    } else {
      res.json({ 
        success: true, 
        decision: { send: false },
        message: 'No notification needed at this time' 
      });
    }

  } catch (error) {
    console.error('Error in AI decision:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to make AI decision' 
    });
  }
});

// GET /api/notifications
// Get user notifications (in-app center)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, unread_only = false } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (unread_only === 'true') {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting notifications:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get notifications' 
      });
    }

    res.json({ 
      success: true, 
      notifications: data || [] 
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get notifications' 
    });
  }
});

// GET /api/notifications/unread-count
// Get unread notifications count
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_unread_notifications_count', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error getting unread count:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get unread count' 
      });
    }

    res.json({ 
      success: true, 
      count: data || 0 
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get unread count' 
    });
  }
});

// POST /api/notifications/:id/read
// Mark notification as read
router.post('/:id/read', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const { error } = await supabase
      .rpc('mark_notification_read', {
        p_id: id
      });

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to mark notification as read' 
      });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to mark notification as read' 
    });
  }
});

// POST /api/notifications/register-device
// Register device for push notifications
router.post('/register-device', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { expo_push_token, platform } = req.body;

    if (!expo_push_token || !platform) {
      return res.status(400).json({ 
        success: false, 
        error: 'expo_push_token and platform required' 
      });
    }

    const { data, error } = await supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        device_type: platform,
        push_token: expo_push_token,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'push_token',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering device:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to register device' 
      });
    }

    res.json({ 
      success: true, 
      device: data 
    });

  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to register device' 
    });
  }
});

// POST /api/notifications/send-pending
// Worker endpoint: Send pending notifications (called by cron)
router.post('/send-pending', async (req, res) => {
  try {
    const results = await deliverQueuedNotifications(supabase);

    if (results.error) {
      return res.status(500).json({ 
        success: false, 
        error: results.error 
      });
    }

    res.json({ 
      success: true, 
      sent_count: results.sent.length,
      failed_count: results.failed.length,
      skipped_count: results.skipped.length,
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped
    });

  } catch (error) {
    console.error('Error sending pending notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send pending notifications' 
    });
  }
});

// POST /api/notifications/tone
// Update user notification tone preference
router.post('/tone', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { tone } = req.body;

    if (!tone || !['motivational', 'friendly', 'minimal'].includes(tone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tone must be: motivational, friendly, or minimal' 
      });
    }

    const { error } = await supabase
      .rpc('update_user_tone_preference', {
        p_user_id: userId,
        p_tone: tone
      });

    if (error) {
      console.error('Error updating tone preference:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update tone preference' 
      });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error updating tone preference:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update tone preference' 
    });
  }
});

// GET /api/notifications/tone
// Get user notification tone preference
router.get('/tone', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_user_tone_preference', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error getting tone preference:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get tone preference' 
      });
    }

    res.json({ 
      success: true, 
      tone: data || 'friendly' 
    });

  } catch (error) {
    console.error('Error getting tone preference:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get tone preference' 
    });
  }
});

// Helper function: AI decision making
async function makeAIDecision(userState, dailyCount) {
  try {
    const prompt = `You are Blüom Notification AI. Decide the single MOST valuable notification for the user RIGHT NOW, or decide to send nothing.

User State:
${JSON.stringify(userState, null, 2)}

Daily notifications sent: ${dailyCount}/4

Rules:
- Max 4 notifications per day
- Weekdays: 08:15 → 21:30
- Weekends: 10:00 → 22:00
- Respect quiet hours
- Only send if clearly helpful
- Be encouraging, never shaming

Respond in JSON:
{
  "send": true | false,
  "category": "nutrition" | "hydration" | "workout" | "sleep" | "mood" | "habits" | "wellness" | "streaks" | "ai",
  "title": "string",
  "body": "string",
  "deep_link": "/fuel" | "/move" | "/wellness" | null,
  "priority": 1-5
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a health notification AI. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const responseText = completion.choices[0].message.content;
    const decision = JSON.parse(responseText);

    return decision;

  } catch (error) {
    console.error('Error in AI decision:', error);
    return { send: false };
  }
}

export default router;


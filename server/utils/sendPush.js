// server/utils/sendPush.js
// Expo Push Notification Utility
// Handles sending push notifications via Expo Push Notification API

/**
 * Send push notification via Expo Push Notification API
 * @param {string} expoPushToken - Expo push token
 * @param {object} message - Message object with title, body, data
 * @returns {Promise<object>} Receipt or error
 */
export async function sendPush(expoPushToken, message) {
  // Validate Expo token format
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    console.log('Invalid Expo Token:', expoPushToken);
    return { error: 'Invalid token format' };
  }

  const payload = {
    to: expoPushToken,
    sound: 'default',
    title: message.title || '',
    body: message.body || '',
    data: message.data || {},
    priority: message.priority || 'default',
    badge: message.badge || null
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo push error:', errorText);
      return { error: errorText };
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Push error:', error);
    return { error: error.message };
  }
}

/**
 * Send batch push notifications
 * @param {Array} messages - Array of {token, title, body, data}
 * @returns {Promise<Array>} Receipts
 */
export async function sendBatchPush(messages) {
  const validMessages = messages.filter(msg => 
    msg.token && msg.token.startsWith('ExponentPushToken')
  );

  if (validMessages.length === 0) {
    return { error: 'No valid tokens' };
  }

  const payloads = validMessages.map(msg => ({
    to: msg.token,
    sound: 'default',
    title: msg.title || '',
    body: msg.body || '',
    data: msg.data || {},
    priority: msg.priority || 'default'
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloads)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo batch push error:', errorText);
      return { error: errorText };
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Batch push error:', error);
    return { error: error.message };
  }
}

/**
 * Check if notification can be sent (rate limiting + timezone)
 * @param {object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Can send
 */
export async function canSendNotification(supabase, userId) {
  try {
    // Check daily count
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyCount } = await supabase
      .from('notification_daily_counts')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (dailyCount && dailyCount.count >= 4) {
      return false;
    }

    // Check if can send (includes timezone, quiet hours, etc.)
    const { data, error } = await supabase
      .rpc('can_send_notification', {
        p_user_id: userId,
        p_category: 'general' // Generic check
      });

    if (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }

    return data === true;

  } catch (error) {
    console.error('Error in canSendNotification:', error);
    return false;
  }
}

/**
 * Deliver queued notifications (called by cron/worker)
 * @param {object} supabase - Supabase client
 * @returns {Promise<object>} Delivery results
 */
export async function deliverQueuedNotifications(supabase) {
  try {
    // Get pending notifications
    const { data: queue, error: queueError } = await supabase
      .from('queued_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (queueError) {
      console.error('Error getting queued notifications:', queueError);
      return { error: queueError.message };
    }

    const results = {
      sent: [],
      failed: [],
      skipped: []
    };

    for (const notif of queue || []) {
      // Check if can send
      const canSend = await canSendNotification(supabase, notif.user_id);
      
      if (!canSend) {
        results.skipped.push(notif.id);
        continue;
      }

      // Get user devices
      const { data: devices, error: devicesError } = await supabase
        .from('user_devices')
        .select('push_token, device_type')
        .eq('user_id', notif.user_id);

      if (devicesError || !devices || devices.length === 0) {
        results.skipped.push(notif.id);
        continue;
      }

      // Send to all devices
      const messages = devices
        .filter(d => d.push_token && d.push_token.startsWith('ExponentPushToken'))
        .map(device => ({
          token: device.push_token,
          title: notif.payload?.title || '',
          body: notif.payload?.body || '',
          data: { ...notif.payload?.data, notification_id: notif.id }
        }));

      if (messages.length > 0) {
        const pushResult = await sendBatchPush(messages);
        
        if (pushResult.error) {
          // Mark as failed
          await supabase
            .from('queued_notifications')
            .update({ status: 'failed' })
            .eq('id', notif.id);
          
          results.failed.push(notif.id);
        } else {
          // Mark as sent
          await supabase.rpc('mark_notification_sent', {
            p_queued_id: notif.id,
            p_sent_payload: notif.payload
          });
          
          results.sent.push(notif.id);
        }
      } else {
        results.skipped.push(notif.id);
      }
    }

    return results;

  } catch (error) {
    console.error('Error delivering queued notifications:', error);
    return { error: error.message };
  }
}


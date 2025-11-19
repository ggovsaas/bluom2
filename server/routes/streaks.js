// server/routes/streaks.js
// Module 12: Unified Streak Engine API Routes
// Handles all streak tracking across all app activities

import express from 'express';
import { supabase } from '../supabase/client.js';

const router = express.Router();

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

// POST /api/streaks/log
// Log a streak event (master function)
router.post('/log', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { streak_type, event_date, source, metadata } = req.body;

    if (!streak_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Streak type required' 
      });
    }

    const { data, error } = await supabase
      .rpc('log_streak_event', {
        p_user_id: userId,
        p_streak_type_name: streak_type,
        p_event_date: event_date || null,
        p_source: source || null,
        p_metadata: metadata || {}
      });

    if (error) {
      console.error('Error logging streak:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to log streak' 
      });
    }

    // Award XP if streak was updated (integrate with Module P)
    if (data?.streak_updated && data?.reward_xp) {
      await supabase.rpc('add_xp', {
        p_user_id: userId,
        p_amount: data.reward_xp,
        p_source: 'streak',
        p_source_id: streak_type,
        p_description: `Streak milestone: ${data.streak} days`
      });
    }

    res.json({ 
      success: true, 
      streak: data 
    });

  } catch (error) {
    console.error('Error logging streak:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to log streak' 
    });
  }
});

// GET /api/streaks
// Get all streaks for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_all_user_streaks', { p_user_id: userId });

    if (error) {
      console.error('Error getting streaks:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get streaks' 
      });
    }

    res.json({ 
      success: true, 
      streaks: data 
    });

  } catch (error) {
    console.error('Error getting streaks:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get streaks' 
    });
  }
});

// GET /api/streaks/:type
// Get specific streak type
router.get('/:type', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const streakType = req.params.type;

    const { data, error } = await supabase
      .rpc('log_streak_event', {
        p_user_id: userId,
        p_streak_type_name: streakType,
        p_event_date: CURRENT_DATE,
        p_source: null,
        p_metadata: {}
      });

    // Just get the streak info, don't log
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select(`
        *,
        streak_types (
          name,
          description,
          category,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('streak_types.name', streakType)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting streak:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get streak' 
      });
    }

    res.json({ 
      success: true, 
      streak: streaks || null 
    });

  } catch (error) {
    console.error('Error getting streak:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get streak' 
    });
  }
});

// GET /api/streaks/:type/history
// Get streak history (calendar view)
router.get('/:type/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const streakType = req.params.type;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start and end dates required' 
      });
    }

    const { data, error } = await supabase
      .rpc('get_streak_history', {
        p_user_id: userId,
        p_streak_type_name: streakType,
        p_start_date: start_date,
        p_end_date: end_date
      });

    if (error) {
      console.error('Error getting streak history:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get streak history' 
      });
    }

    res.json({ 
      success: true, 
      history: data 
    });

  } catch (error) {
    console.error('Error getting streak history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get streak history' 
    });
  }
});

// GET /api/streaks/at-risk
// Get streaks at risk (for notifications)
router.get('/at-risk', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_streaks_at_risk', { p_user_id: userId });

    if (error) {
      console.error('Error getting streaks at risk:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get streaks at risk' 
      });
    }

    res.json({ 
      success: true, 
      streaks_at_risk: data 
    });

  } catch (error) {
    console.error('Error getting streaks at risk:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get streaks at risk' 
    });
  }
});

// Convenience endpoints for specific streak types
router.post('/meal', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { event_date } = req.body;

    const { data, error } = await supabase
      .rpc('log_meal_streak', {
        p_user_id: userId,
        p_event_date: event_date || null
      });

    if (error) {
      console.error('Error logging meal streak:', error);
      return res.status(500).json({ success: false, error: 'Failed to log meal streak' });
    }

    res.json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/water', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { event_date } = req.body;

    const { data, error } = await supabase
      .rpc('log_water_streak', {
        p_user_id: userId,
        p_event_date: event_date || null
      });

    if (error) {
      console.error('Error logging water streak:', error);
      return res.status(500).json({ success: false, error: 'Failed to log water streak' });
    }

    res.json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/mood', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { event_date } = req.body;

    const { data, error } = await supabase
      .rpc('log_mood_streak', {
        p_user_id: userId,
        p_event_date: event_date || null
      });

    if (error) {
      console.error('Error logging mood streak:', error);
      return res.status(500).json({ success: false, error: 'Failed to log mood streak' });
    }

    res.json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sleep', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { event_date } = req.body;

    const { data, error } = await supabase
      .rpc('log_sleep_streak', {
        p_user_id: userId,
        p_event_date: event_date || null
      });

    if (error) {
      console.error('Error logging sleep streak:', error);
      return res.status(500).json({ success: false, error: 'Failed to log sleep streak' });
    }

    res.json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/workout', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { event_date } = req.body;

    const { data, error } = await supabase
      .rpc('log_workout_streak', {
        p_user_id: userId,
        p_event_date: event_date || null
      });

    if (error) {
      console.error('Error logging workout streak:', error);
      return res.status(500).json({ success: false, error: 'Failed to log workout streak' });
    }

    res.json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/meditation', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { event_date } = req.body;

    const { data, error } = await supabase
      .rpc('log_meditation_streak', {
        p_user_id: userId,
        p_event_date: event_date || null
      });

    if (error) {
      console.error('Error logging meditation streak:', error);
      return res.status(500).json({ success: false, error: 'Failed to log meditation streak' });
    }

    res.json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;


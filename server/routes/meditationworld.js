// server/routes/meditationworld.js
// Module AC: Gamified Meditation World API Routes
// Handles worlds, levels, sessions, progression, and game integration

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

// GET /api/meditationworld/worlds
// Get all worlds with unlock status
router.get('/worlds', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_user_worlds', { p_user_id: userId });

    if (error) {
      console.error('Error getting worlds:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get worlds' 
      });
    }

    res.json({ 
      success: true, 
      worlds: data 
    });

  } catch (error) {
    console.error('Error getting worlds:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get worlds' 
    });
  }
});

// GET /api/meditationworld/worlds/:worldId/levels
// Get levels for a world
router.get('/worlds/:worldId/levels', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { worldId } = req.params;

    const { data, error } = await supabase
      .rpc('get_world_levels', {
        p_user_id: userId,
        p_world_id: worldId
      });

    if (error) {
      console.error('Error getting levels:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get levels' 
      });
    }

    res.json({ 
      success: true, 
      levels: data 
    });

  } catch (error) {
    console.error('Error getting levels:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get levels' 
    });
  }
});

// POST /api/meditationworld/sessions/start
// Start a meditation session
router.post('/sessions/start', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { level_id, mood_before, stress_before } = req.body;

    if (!level_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Level ID required' 
      });
    }

    const { data, error } = await supabase
      .rpc('start_meditation_session', {
        p_user_id: userId,
        p_level_id: level_id,
        p_mood_before: mood_before || null,
        p_stress_before: stress_before || null
      });

    if (error) {
      console.error('Error starting session:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to start session' 
      });
    }

    res.json({ 
      success: true, 
      session_id: data 
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to start session' 
    });
  }
});

// POST /api/meditationworld/sessions/:sessionId/complete
// Complete a meditation session
router.post('/sessions/:sessionId/complete', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { mood_after, stress_after, duration_seconds } = req.body;

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('meditation_sessions_ac')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Session not found or access denied' 
      });
    }

    const { data, error } = await supabase
      .rpc('complete_meditation_session', {
        p_session_id: sessionId,
        p_mood_after: mood_after || null,
        p_stress_after: stress_after || null,
        p_duration_seconds: duration_seconds || null
      });

    if (error) {
      console.error('Error completing session:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to complete session' 
      });
    }

    res.json({ 
      success: true, 
      result: data 
    });

  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to complete session' 
    });
  }
});

// GET /api/meditationworld/progress
// Get user progress
router.get('/progress', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_user_progress', { p_user_id: userId });

    if (error) {
      console.error('Error getting progress:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get progress' 
      });
    }

    res.json({ 
      success: true, 
      progress: data 
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get progress' 
    });
  }
});

// POST /api/meditationworld/worlds/:worldId/unlock
// Unlock a world
router.post('/worlds/:worldId/unlock', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { worldId } = req.params;

    const { data, error } = await supabase
      .rpc('unlock_world', {
        p_user_id: userId,
        p_world_id: worldId
      });

    if (error) {
      console.error('Error unlocking world:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to unlock world' 
      });
    }

    res.json({ 
      success: true, 
      result: data 
    });

  } catch (error) {
    console.error('Error unlocking world:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to unlock world' 
    });
  }
});

// POST /api/meditationworld/games/complete
// Complete a mind game session
router.post('/games/complete', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { game_id, score, duration_seconds } = req.body;

    if (!game_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Game ID required' 
      });
    }

    const { data, error } = await supabase
      .rpc('complete_game_session', {
        p_user_id: userId,
        p_game_id: game_id,
        p_score: score || null,
        p_duration_seconds: duration_seconds || null
      });

    if (error) {
      console.error('Error completing game:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to complete game' 
      });
    }

    res.json({ 
      success: true, 
      result: data 
    });

  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to complete game' 
    });
  }
});

export default router;


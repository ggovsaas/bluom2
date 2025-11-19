// server/routes/realtime.js
// Phase 7: Real-Time Dynamic Optimizer API Routes
// Handles real-time state updates and AI-generated actions

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

// GET /api/realtime/state
// Get current realtime state and AI actions
router.get('/state', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    if (error) {
      console.error('Error getting realtime state:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get realtime state' 
      });
    }

    res.json({ 
      success: true, 
      state: data 
    });

  } catch (error) {
    console.error('Error getting realtime state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get realtime state' 
    });
  }
});

// POST /api/realtime/meal
// Update state after meal log
router.post('/meal', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { calories, protein, carbs, fats } = req.body;

    if (!calories || !protein || !carbs || !fats) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing nutrition data' 
      });
    }

    const { error } = await supabase
      .rpc('update_state_after_meal', {
        p_user_id: userId,
        p_calories: parseInt(calories),
        p_protein: parseInt(protein),
        p_carbs: parseInt(carbs),
        p_fats: parseInt(fats)
      });

    if (error) {
      console.error('Error updating state after meal:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update state' 
      });
    }

    // Get updated state
    const { data: updatedState } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    res.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating meal state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update meal state' 
    });
  }
});

// POST /api/realtime/workout
// Update state after workout log
router.post('/workout', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { workout_load, duration_minutes } = req.body;

    if (!workout_load) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing workout load' 
      });
    }

    const { error } = await supabase
      .rpc('update_state_after_workout', {
        p_user_id: userId,
        p_workout_load: parseInt(workout_load),
        p_duration_minutes: duration_minutes ? parseInt(duration_minutes) : 0
      });

    if (error) {
      console.error('Error updating state after workout:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update state' 
      });
    }

    // Get updated state
    const { data: updatedState } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    res.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating workout state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update workout state' 
    });
  }
});

// POST /api/realtime/steps
// Update state after steps log
router.post('/steps', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { steps } = req.body;

    if (!steps) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing steps' 
      });
    }

    const { error } = await supabase
      .rpc('update_state_after_steps', {
        p_user_id: userId,
        p_steps: parseInt(steps)
      });

    if (error) {
      console.error('Error updating state after steps:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update state' 
      });
    }

    // Get updated state
    const { data: updatedState } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    res.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating steps state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update steps state' 
    });
  }
});

// POST /api/realtime/sleep
// Update state after sleep log
router.post('/sleep', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { sleep_hours } = req.body;

    if (!sleep_hours) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing sleep hours' 
      });
    }

    const { error } = await supabase
      .rpc('update_state_after_sleep', {
        p_user_id: userId,
        p_sleep_hours: parseFloat(sleep_hours)
      });

    if (error) {
      console.error('Error updating state after sleep:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update state' 
      });
    }

    // Get updated state
    const { data: updatedState } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    res.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating sleep state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update sleep state' 
    });
  }
});

// POST /api/realtime/mood
// Update state after mood/stress log
router.post('/mood', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { mood, stress } = req.body;

    if (!mood) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing mood' 
      });
    }

    const { error } = await supabase
      .rpc('update_state_after_mood', {
        p_user_id: userId,
        p_mood: parseInt(mood),
        p_stress: stress ? parseInt(stress) : null
      });

    if (error) {
      console.error('Error updating state after mood:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update state' 
      });
    }

    // Get updated state
    const { data: updatedState } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    res.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating mood state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update mood state' 
    });
  }
});

// POST /api/realtime/hydration
// Update state after hydration log
router.post('/hydration', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { hydration_ml } = req.body;

    if (!hydration_ml) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing hydration amount' 
      });
    }

    const { error } = await supabase
      .rpc('update_state_after_hydration', {
        p_user_id: userId,
        p_hydration_ml: parseInt(hydration_ml)
      });

    if (error) {
      console.error('Error updating state after hydration:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update state' 
      });
    }

    // Get updated state
    const { data: updatedState } = await supabase
      .rpc('get_realtime_state', { p_user_id: userId });

    res.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating hydration state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update hydration state' 
    });
  }
});

// POST /api/realtime/action/execute
// Mark an AI action as executed
router.post('/action/execute', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { action_id } = req.body;

    if (!action_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing action ID' 
      });
    }

    const { error } = await supabase
      .from('ai_daily_actions')
      .update({ executed: true })
      .eq('id', action_id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error executing action:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to execute action' 
      });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to execute action' 
    });
  }
});

export default router;


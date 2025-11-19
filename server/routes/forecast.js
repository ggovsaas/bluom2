// server/routes/forecast.js
// Phase 8: Workout Intensity Forecaster API Routes
// Handles workout forecasting and training history

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

// POST /api/forecast/update-history
// Update training history after workout log
router.post('/update-history', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { error } = await supabase
      .rpc('update_training_history', { p_user_id: userId });

    if (error) {
      console.error('Error updating training history:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update training history' 
      });
    }

    // Generate tomorrow's forecast after updating history
    const { data: forecast, error: forecastError } = await supabase
      .rpc('generate_tomorrow_forecast', { p_user_id: userId });

    if (forecastError) {
      console.error('Error generating forecast:', forecastError);
    }

    res.json({ 
      success: true,
      forecast: forecast || null
    });

  } catch (error) {
    console.error('Error updating training history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update training history' 
    });
  }
});

// GET /api/forecast/tomorrow
// Get tomorrow's workout forecast
router.get('/tomorrow', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_tomorrow_forecast', { p_user_id: userId });

    if (error) {
      console.error('Error getting forecast:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get forecast' 
      });
    }

    res.json({ 
      success: true, 
      forecast: data 
    });

  } catch (error) {
    console.error('Error getting forecast:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get forecast' 
    });
  }
});

// POST /api/forecast/generate
// Manually trigger forecast generation
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('generate_tomorrow_forecast', { p_user_id: userId });

    if (error) {
      console.error('Error generating forecast:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate forecast' 
      });
    }

    res.json({ 
      success: true, 
      forecast: data 
    });

  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate forecast' 
    });
  }
});

// GET /api/forecast/history
// Get training history summary
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const days = parseInt(req.query.days) || 30;

    const { data, error } = await supabase
      .rpc('get_training_history_summary', { 
        p_user_id: userId,
        p_days: days
      });

    if (error) {
      console.error('Error getting history:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get history' 
      });
    }

    res.json({ 
      success: true, 
      history: data 
    });

  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get history' 
    });
  }
});

// POST /api/forecast/soreness
// Update soreness level
router.post('/soreness', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { soreness, date } = req.body;

    if (!soreness || soreness < 1 || soreness > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Soreness must be between 1 and 5' 
      });
    }

    const { error } = await supabase
      .rpc('update_soreness_level', {
        p_user_id: userId,
        p_soreness: parseInt(soreness),
        p_date: date || null
      });

    if (error) {
      console.error('Error updating soreness:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update soreness' 
      });
    }

    // Regenerate forecast if updating today
    if (!date || date === new Date().toISOString().split('T')[0]) {
      await supabase.rpc('generate_tomorrow_forecast', { p_user_id: userId });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error updating soreness:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update soreness' 
    });
  }
});

export default router;


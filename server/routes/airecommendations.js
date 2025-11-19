// server/routes/airecommendations.js
// Module W Extended: AI Recommendation Engine API Routes
// Handles AI recommendation generation, user state building, embedding vectors, and rule evaluation

import express from 'express';
import { supabase } from '../supabase/client.js';
import OpenAI from 'openai';

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

// GET /api/airecommendations
// Get active recommendations for user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit } = req.query;

    const { data, error } = await supabase
      .rpc('get_active_recommendations', {
        p_user_id: userId,
        p_limit_count: limit ? parseInt(limit) : 10
      });

    if (error) {
      console.error('Error getting recommendations:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get recommendations' 
      });
    }

    res.json({ 
      success: true, 
      recommendations: data || [] 
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get recommendations' 
    });
  }
});

// POST /api/airecommendations/generate
// Generate AI recommendations using GPT
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Build user state
    const { data: userState, error: stateError } = await supabase
      .rpc('build_user_state', {
        p_user_id: userId,
        p_days: 14
      });

    if (stateError) {
      console.error('Error building user state:', stateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to build user state' 
      });
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .rpc('get_personalization_profile', { p_user: userId });

    // Generate recommendations with GPT
    const recommendations = await generateAIRecommendations(userState, preferences);

    // Store recommendations
    const storedRecs = [];
    for (const rec of recommendations) {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          action: rec.action || {},
          score: rec.score || 0.8,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .select()
        .single();

      if (!error && data) {
        storedRecs.push(data);
      }
    }

    res.json({ 
      success: true, 
      recommendations: storedRecs,
      count: storedRecs.length
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate recommendations' 
    });
  }
});

// POST /api/airecommendations/interact
// Log recommendation interaction
router.post('/interact', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { recommendation_id, clicked, dismissed, completed } = req.body;

    if (!recommendation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recommendation ID required' 
      });
    }

    const { error } = await supabase
      .rpc('log_recommendation_interaction', {
        p_reco_id: recommendation_id,
        p_user_id: userId,
        p_clicked: clicked || false,
        p_dismissed: dismissed || false,
        p_completed: completed || false
      });

    if (error) {
      console.error('Error logging interaction:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to log interaction' 
      });
    }

    res.json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to log interaction' 
    });
  }
});

// GET /api/airecommendations/state
// Get user state object
router.get('/state', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { days } = req.query;

    const { data, error } = await supabase
      .rpc('build_user_state', {
        p_user_id: userId,
        p_days: days ? parseInt(days) : 14
      });

    if (error) {
      console.error('Error building user state:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to build user state' 
      });
    }

    res.json({ 
      success: true, 
      state: data 
    });

  } catch (error) {
    console.error('Error building user state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to build user state' 
    });
  }
});

// POST /api/airecommendations/evaluate-rules
// Evaluate rule-based triggers
router.post('/evaluate-rules', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('evaluate_ai_rules', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error evaluating rules:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to evaluate rules' 
      });
    }

    res.json({ 
      success: true, 
      recommendations_created: data || 0
    });

  } catch (error) {
    console.error('Error evaluating rules:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to evaluate rules' 
    });
  }
});

// POST /api/airecommendations/context
// Generate contextual recommendation from trigger
router.post('/context', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { trigger_type, payload } = req.body;

    if (!trigger_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Trigger type required' 
      });
    }

    const { data, error } = await supabase
      .rpc('generate_context_recommendation', {
        p_user: userId,
        p_trigger: trigger_type,
        p_payload: payload || {}
      });

    if (error) {
      console.error('Error generating context recommendation:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to generate context recommendation' 
      });
    }

    res.json({ 
      success: true, 
      recommendation_id: data 
    });

  } catch (error) {
    console.error('Error generating context recommendation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate context recommendation' 
    });
  }
});

// Helper function: Generate AI recommendations using GPT
async function generateAIRecommendations(userState, preferences) {
  try {
    const prompt = `You are Bluöm AI Recommendation Engine. Analyze this user's health data and generate 3-5 personalized recommendations.

User State:
- Average Calories: ${userState?.calorie_avg || 2000}
- Average Protein: ${userState?.protein_avg || 100}g
- Average Sleep: ${userState?.sleep_avg || 7} hours
- Average Mood: ${userState?.mood_avg || 3}/5
- Average Water: ${userState?.water_avg || 2000}ml
- Average Steps: ${userState?.steps_avg || 7000}
- Workout Load: ${userState?.workout_load || 0} sessions
- Goal: ${userState?.goal || 'maintain'}
- Diet Type: ${userState?.diet_type || 'balanced'}
- Weak Zones: ${JSON.stringify(userState?.weak_zones || [])}
- Streaks: ${JSON.stringify(userState?.streaks || {})}

Preferences: ${JSON.stringify(preferences || {})}

Generate recommendations in JSON array format:
[
  {
    "category": "nutrition|workout|sleep|recovery|hydration|wellness|habit",
    "title": "Short title",
    "description": "Detailed description with actionable advice",
    "action": {"type": "open_page", "target": "/path"},
    "score": 0.0-1.0,
    "priority": 1-5
  }
]

Focus on:
1. Addressing weak zones
2. Supporting user's goal
3. Improving streaks
4. Providing actionable, specific advice
5. Balancing all health dimensions`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a health and fitness AI coach. Return only valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const responseText = completion.choices[0].message.content;
    const recommendations = JSON.parse(responseText);

    return Array.isArray(recommendations) ? recommendations : [];

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    // Return fallback recommendations
    return [
      {
        category: 'nutrition',
        title: 'Track Your Macros',
        description: 'Keep logging your meals to maintain consistency.',
        action: { type: 'open_page', target: '/fuel' },
        score: 0.7,
        priority: 3
      }
    ];
  }
}

export default router;


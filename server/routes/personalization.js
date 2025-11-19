// server/routes/personalization.js
// Phase 6: AI Personalization Engine API Routes
// Handles personalization generation, meal plans, workout plans, and weekly revisions

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

// POST /api/personalize
// Generate full personalization from onboarding answers
router.post('/personalize', authenticateUser, async (req, res) => {
  try {
  const userId = req.userId;

    // Get profile answers
    const { data: answersData, error: answersError } = await supabase
      .rpc('get_profile_answers', { p_user_id: userId });

    if (answersError) {
      console.error('Error getting profile answers:', answersError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get profile answers' 
      });
    }

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get user profile' 
      });
    }

    // Build AI prompt
    const prompt = buildPersonalizationPrompt(userProfile, answersData || {});

    // Call OpenAI
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Blüom AI Coach, a fitness and wellness personalization expert. 
          Generate personalized nutrition, workout, and wellness plans based on user data.
          Always return valid JSON with the exact structure specified.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Save goals
    if (aiResponse.goals) {
      await supabase
        .from('personalized_goals')
        .upsert({
          user_id: userId,
          primary_goal: aiResponse.goals.primary_goal,
          calorie_target: aiResponse.goals.calorie_target,
          protein_target: aiResponse.goals.protein_target,
          carbs_target: aiResponse.goals.carbs_target,
          fats_target: aiResponse.goals.fats_target,
          workout_focus: aiResponse.goals.workout_focus,
          wellness_focus: aiResponse.goals.wellness_focus
        }, {
          onConflict: 'user_id'
        });
    }

    // Save meal plan
    if (aiResponse.meal_plan && Array.isArray(aiResponse.meal_plan)) {
      for (const meal of aiResponse.meal_plan) {
        await supabase
          .from('personalized_meal_plan')
          .upsert({
            user_id: userId,
            day_index: meal.day_index,
            meal_label: meal.meal_label,
            items: meal.items
          }, {
            onConflict: 'user_id,day_index,meal_label'
          });
      }
    }

    // Save workout plan
    if (aiResponse.workout_plan && Array.isArray(aiResponse.workout_plan)) {
      for (const workout of aiResponse.workout_plan) {
        await supabase
          .from('personalized_workout_plan')
          .upsert({
            user_id: userId,
            day_index: workout.day_index,
            workout_type: workout.workout_type,
            exercises: workout.exercises
          }, {
            onConflict: 'user_id,day_index'
          });
      }
    }

    res.json({ 
      success: true, 
      personalization: aiResponse 
    });

  } catch (error) {
    console.error('Error generating personalization:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate personalization' 
    });
  }
});

// GET /api/personalize
// Get current personalization
router.get('/personalize', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .rpc('get_complete_personalization', { p_user_id: userId });

    if (error) {
      console.error('Error getting personalization:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get personalization' 
      });
    }

    res.json({ 
      success: true, 
      personalization: data 
    });

  } catch (error) {
    console.error('Error getting personalization:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get personalization' 
    });
  }
});

// POST /api/personalize/revise
// Weekly revision - update personalization based on user behavior
router.post('/revise', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Check if revision is due
    const { data: isDue, error: checkError } = await supabase
      .rpc('is_revision_due', { p_user_id: userId });

    if (checkError) {
      console.error('Error checking revision due:', checkError);
    }

    if (!isDue) {
      return res.json({ 
        success: true, 
        status: 'not_due',
        message: 'Revision not due yet' 
      });
    }

    // Get user data for last 7 days
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const { data: userData, error: dataError } = await supabase
      .rpc('get_user_revision_data', { 
        p_user_id: userId,
        p_week_start: weekStart.toISOString().split('T')[0]
      });

    if (dataError) {
      console.error('Error getting user data:', dataError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get user data' 
      });
    }

    // Get current personalization
    const { data: currentPlan, error: planError } = await supabase
      .rpc('get_complete_personalization', { p_user_id: userId });

    if (planError) {
      console.error('Error getting current plan:', planError);
    }

    // Build revision prompt
    const prompt = buildRevisionPrompt(userData, currentPlan);

    // Call OpenAI
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Blüom AI Coach. You revise the user's fitness, nutrition, and wellness plan once per week.
          Analyze their behavior and make intelligent adjustments. Always return valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Calculate adherence score
    const adherenceScore = calculateAdherenceScore(userData, currentPlan);

    // Calculate averages
    const caloriesAvg = calculateAverage(userData.meals, 'calories');
    const proteinAvg = calculateAverage(userData.meals, 'protein');
    const sleepAvg = calculateAverage(userData.sleep, 'hours');
    const moodAvg = calculateAverage(userData.mood, 'mood');
    const workoutsCompleted = userData.workouts?.length || 0;

    // Save revision
    const { data: revisionId, error: saveError } = await supabase
      .rpc('save_weekly_revision', {
        p_user_id: userId,
        p_week_start: weekStart.toISOString().split('T')[0],
        p_week_end: new Date().toISOString().split('T')[0],
        p_summary: aiResponse.summary || '',
        p_changes: aiResponse.changes || {},
        p_adherence_score: adherenceScore,
        p_weight_change: aiResponse.weight_change || 0,
        p_calories_avg: caloriesAvg,
        p_protein_avg: proteinAvg,
        p_workouts_completed: workoutsCompleted,
        p_sleep_avg: sleepAvg,
        p_mood_avg: moodAvg
      });

    if (saveError) {
      console.error('Error saving revision:', saveError);
    }

    // Update personalization with new values
    if (aiResponse.goals) {
      await supabase
        .from('personalized_goals')
        .update({
          calorie_target: aiResponse.goals.calorie_target,
          protein_target: aiResponse.goals.protein_target,
          carbs_target: aiResponse.goals.carbs_target,
          fats_target: aiResponse.goals.fats_target,
          wellness_focus: aiResponse.goals.wellness_focus
        })
        .eq('user_id', userId);
    }

    res.json({ 
      success: true, 
      revision: aiResponse,
      revision_id: revisionId 
    });

  } catch (error) {
    console.error('Error revising personalization:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to revise personalization' 
    });
  }
});

// GET /api/personalize/revisions
// Get revision history
router.get('/revisions', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    const { data, error } = await supabase
      .rpc('get_revision_history', { 
        p_user_id: userId,
        p_limit: limit
      });

    if (error) {
      console.error('Error getting revisions:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get revisions' 
      });
    }

    res.json({ 
      success: true, 
      revisions: data 
    });

  } catch (error) {
    console.error('Error getting revisions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get revisions' 
    });
  }
});

// Helper functions

function buildPersonalizationPrompt(userProfile, answers) {
  return `Generate a complete personalization plan for this user:

USER PROFILE:
- Age: ${calculateAge(userProfile.birthday)}
- Gender: ${userProfile.gender || 'not specified'}
- Weight: ${userProfile.weight_kg || 'not specified'} kg
- Height: ${userProfile.height_cm || 'not specified'} cm
- Activity Level: ${userProfile.activity_level || 'not specified'}
- Goal: ${userProfile.goal || 'not specified'}

ONBOARDING ANSWERS:
${JSON.stringify(answers, null, 2)}

Generate a JSON response with this exact structure:
{
  "goals": {
    "primary_goal": "lose_fat" | "gain_muscle" | "recomposition" | "maintain",
    "calorie_target": number,
    "protein_target": number,
    "carbs_target": number,
    "fats_target": number,
    "workout_focus": "hypertrophy" | "weight_loss" | "endurance" | "strength",
    "wellness_focus": "stress" | "sleep" | "mindset" | "balance"
  },
  "meal_plan": [
    {
      "day_index": 1-7,
      "meal_label": "breakfast" | "lunch" | "dinner" | "snack",
      "items": [
        {
          "food": "string",
          "grams": number,
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ]
    }
  ],
  "workout_plan": [
    {
      "day_index": 1-7,
      "workout_type": "push" | "pull" | "legs" | "cardio" | "upper" | "lower" | "full_body",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string (e.g., '8-12' or 'AMRAP')",
          "rest": number (seconds)
        }
      ]
    }
  ]
}

Rules:
- Use Mifflin-St Jeor for BMR: BMR = 10 × weight + 6.25 × height - 5 × age + (5 for male, -161 for female)
- TDEE = BMR × activity_multiplier (sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9)
- For fat loss: calories = TDEE - 20%, protein = 2.2g/kg, fats = 25% calories, carbs = remainder
- For muscle gain: calories = TDEE + 15%, protein = 2.0g/kg, fats = 25% calories, carbs = remainder
- Respect food allergies and dislikes from answers
- Create meal plan for all 7 days
- Create workout plan matching user's available days per week
- Consider user's equipment availability
- Consider user's experience level`;
}

function buildRevisionPrompt(userData, currentPlan) {
  return `Revise the user's personalization plan based on their last 7 days of behavior:

LAST 7 DAYS DATA:
${JSON.stringify(userData, null, 2)}

CURRENT PLAN:
${JSON.stringify(currentPlan, null, 2)}

Generate a JSON response with this exact structure:
{
  "summary": "string - AI summary of the week",
  "changes": {
    "calorie_adjustment": number (change in calories),
    "macro_adjustments": {
      "protein": number (change),
      "carbs": number (change),
      "fats": number (change)
    },
    "workout_changes": "string - description of changes",
    "meal_plan_changes": "string - description of changes"
  },
  "goals": {
    "calorie_target": number,
    "protein_target": number,
    "carbs_target": number,
    "fats_target": number,
    "wellness_focus": "stress" | "sleep" | "mindset" | "balance"
  },
  "recommendations": [
    {
      "type": "nutrition" | "workout" | "wellness",
      "message": "string",
      "action": "string"
    }
  ],
  "weight_change": number (kg change, estimate if not available)
}

Rules:
- If weight loss has stalled for 2+ weeks → reduce calories by 120-150
- If user under-eats by >25% → increase adherence strategy, not calories
- If user oversleeps/undersleeps → adjust recovery plan
- If stress high → push "mindfulness" path
- If workouts skipped → reduce volume or simplify split
- If consistently hitting macros → increase progression
- If low steps → add baseline walking plan
- No extreme changes
- Keep plans sustainable`;
}

function calculateAdherenceScore(userData, currentPlan) {
  // Simple adherence calculation
  // This can be enhanced with more sophisticated logic
  let score = 100;
  
  if (currentPlan?.goals?.calorie_target) {
    const avgCalories = calculateAverage(userData.meals, 'calories');
    const target = currentPlan.goals.calorie_target;
    const diff = Math.abs(avgCalories - target) / target;
    score -= diff * 30; // Penalize for calorie deviation
  }
  
  const workoutsTarget = currentPlan?.workout_plan?.length || 0;
  const workoutsCompleted = userData.workouts?.length || 0;
  if (workoutsTarget > 0) {
    const workoutAdherence = workoutsCompleted / workoutsTarget;
    score -= (1 - workoutAdherence) * 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateAverage(array, field) {
  if (!array || array.length === 0) return 0;
  const sum = array.reduce((acc, item) => acc + (item[field] || 0), 0);
  return sum / array.length;
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default router;

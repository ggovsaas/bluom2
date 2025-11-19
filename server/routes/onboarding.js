// server/routes/onboarding.js
// Onboarding API routes using Supabase

import express from 'express';
import { supabase } from '../supabase/client.js';

const router = express.Router();

// Middleware: Extract user from Supabase session
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No authorization token' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// POST /api/onboarding/answers
// Save onboarding answers and trigger personalization
router.post('/answers', authenticateUser, async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.userId;
    
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Answers object required' 
      });
    }
    
    // Save onboarding answers to Module A table
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('onboarding_answers')
      .insert({
        user_id: userId,
        answers: answers,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (onboardingError) {
      console.error('Error saving onboarding answers:', onboardingError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save onboarding answers' 
      });
    }
    
    // Update user profile with basic info from answers
    const profileUpdate = {};
    if (answers.age) profileUpdate.birthday = new Date(new Date().getFullYear() - answers.age, 0, 1).toISOString();
    if (answers.gender || answers.sex) profileUpdate.gender = answers.gender || answers.sex;
    if (answers.height) profileUpdate.height_cm = answers.height;
    if (answers.weight) profileUpdate.weight_kg = answers.weight;
    if (answers.activity_level) profileUpdate.activity_level = answers.activity_level;
    if (answers.goal) profileUpdate.goal = answers.goal;
    if (answers.timezone) profileUpdate.timezone = answers.timezone;
    
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('users')
        .update(profileUpdate)
        .eq('id', userId);
      
      if (profileError) {
        console.error('Error updating user profile:', profileError);
      }
    }
    
    // Mark onboarding as completed
    await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', userId);
    
    // Trigger personalization build
    const { data: personalizationData, error: personalizationError } = await supabase
      .rpc('build_personalization_plan', {
        p_user_id: userId,
        p_onboarding_answers: answers
      });
    
    if (personalizationError) {
      console.error('Error building personalization plan:', personalizationError);
      // Still return success for onboarding, but log the error
      return res.json({
        success: true,
        message: 'Onboarding completed. Personalization may need to be regenerated.',
        onboarding: onboardingData,
        personalization_error: personalizationError.message
      });
    }
    
    res.json({
      success: true,
      message: 'Onboarding completed and personalization plan generated',
      onboarding: onboardingData,
      personalization: personalizationData
    });
    
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// GET /api/onboarding/recommendation
// Get personalized recommendations based on onboarding
router.get('/recommendation', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user personalization
    const { data: personalization, error } = await supabase
      .rpc('get_user_personalization', {
        p_user_id: userId
      });
    
    if (error) {
      console.error('Error getting personalization:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get recommendations' 
      });
    }
    
    if (!personalization || !personalization.macros) {
      return res.status(404).json({ 
        success: false, 
        error: 'Personalization not found. Please complete onboarding first.' 
      });
    }
    
    res.json({
      success: true,
      data: {
        macros: {
          calories: personalization.macros.calories,
          protein: personalization.macros.protein,
          carbs: personalization.macros.carbs,
          fat: personalization.macros.fat,
          water_target_liters: personalization.macros.water_target_liters
        },
        workout_plan: personalization.workout,
        wellness_plan: personalization.wellness,
        recommendations: personalization.recommendations || []
      }
    });
    
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;


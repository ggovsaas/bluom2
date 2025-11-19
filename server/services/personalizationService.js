// server/services/personalizationService.js
import pool from '../db.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Basic personalization helpers and plan generator.
 * Designed to be drop-in. Cursor can refactor to TypeScript if needed.
 */

/* ---------------------- Helpers ---------------------- */

function calcBMR({ sex = 'male', weightKg = 75, heightCm = 175, age = 30 }) {
  // Mifflin-St Jeor
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

function tdeeFromBMR(bmr, activityLevel = 'light') {
  const map = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very: 1.9,
  };
  return Math.round(bmr * (map[activityLevel] || 1.375));
}

function adjustForGoal(tdee, goal = 'maintain') {
  if (goal === 'lose' || goal === 'Lose Weight') return Math.round(tdee * 0.8); // -20%
  if (goal === 'gain' || goal === 'Build Muscle') return Math.round(tdee * 1.15); // +15%
  return tdee;
}

function macrosFromCalories(calories, preference = 'balanced', weightKg = 75) {
  const proteinG = Math.round(weightKg * (preference === 'muscle' || preference === 'High Protein' ? 2.0 : 1.6));
  const proteinCals = proteinG * 4;
  let carbPerc = 0.45,
    fatPerc = 0.3;

  if (preference === 'lowcarb' || preference === 'Low-Carb') {
    carbPerc = 0.25;
    fatPerc = 0.45;
  }
  if (preference === 'highcarb' || preference === 'High-Carb') {
    carbPerc = 0.55;
    fatPerc = 0.25;
  }
  if (preference === 'keto' || preference === 'Keto') {
    carbPerc = 0.1;
    fatPerc = 0.7;
  }

  const remainCals = Math.max(0, calories - proteinCals);
  const carbsG = Math.round((remainCals * carbPerc) / 4);
  const fatG = Math.round((remainCals * fatPerc) / 9);

  return { proteinG, carbsG, fatG };
}

function generateMealTemplates(calories, meals = 3) {
  const perMeal = Math.max(150, Math.round(calories / meals));
  return Array.from({ length: meals }).map((_, i) => ({
    id: i + 1,
    calories: perMeal,
    suggested: [], // fill later via recipe query
  }));
}

function generateWorkoutPlan({ goal = 'maintain', experience = 'beginner', daysPerWeek = 3, equipment = [] }) {
  const plans = {
    2: ['Full Body', 'Full Body'],
    3: ['Full Body', 'Full Body', 'Accessory'],
    4: ['Upper', 'Lower', 'Upper', 'Lower'],
    5: ['Push', 'Pull', 'Legs', 'Upper Accessory', 'Mobility'],
  };

  const selected = plans[daysPerWeek] || plans[3];

  // simple template
  return selected.map((title, idx) => ({
    id: idx + 1,
    title,
    exercises: [
      { name: 'Primary compound (e.g., Squat/Deadlift)', sets: 3, reps: '6-10' },
      { name: 'Secondary push/pull (e.g., Bench/Row)', sets: 3, reps: '8-12' },
      { name: 'Accessory / core', sets: 2, reps: '12-15' },
    ],
    notes: `Equipment: ${Array.isArray(equipment) ? equipment.join(', ') : equipment || 'bodyweight'}`,
  }));
}

function generateWellnessPlan({ sleepHours = 7, stressLevel = 4, timeAvailable = 10 }) {
  const routines = [];

  if (sleepHours < 6)
    routines.push({
      type: 'sleepPrep',
      duration: 10,
      action: 'Wind-down breathing + dim lights',
    });
  if (stressLevel >= 7)
    routines.push({
      type: 'anxietyRelief',
      duration: 5,
      action: 'Grounding + quick journal prompt',
    });
  routines.push({
    type: 'dailyGratitude',
    duration: 3,
    action: 'Write 3 things you are grateful for',
  });
  routines.push({
    type: 'microMeditation',
    duration: Math.min(10, timeAvailable),
    action: 'Mindful breathing',
  });

  return routines;
}

/* ---------------------- DB Helpers ---------------------- */

async function fetchUser(userId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
  return rows[0];
}

async function savePlan(userId, planJson) {
  const { rows } = await pool.query(
    `INSERT INTO personalized_plans (user_id, plan) VALUES ($1, $2) RETURNING *`,
    [userId, JSON.stringify(planJson)]
  );
  return rows[0];
}

async function latestSavedPlan(userId) {
  const { rows } = await pool.query(
    `SELECT plan FROM personalized_plans WHERE user_id=$1 ORDER BY generated_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0]?.plan || null;
}

/* ---------------------- Product Reco (simple rules engine) ---------------------- */

function generateProductRecommendations(user = {}) {
  const recs = [];

  if ((user.avg_sleep_hours || 0) < 6)
    recs.push({ sku: 'sleep_mask_01', title: 'Weighted Sleep Mask', category: 'sleep' });
  if (
    (user.water_goal || 0) &&
    (user.water_logged_today || 0) < (user.water_goal * 0.6)
  )
    recs.push({ sku: 'smart_bottle_01', title: 'Smart Water Bottle', category: 'hydration' });
  if (user.goal === 'gain' || user.goal === 'Build Muscle')
    recs.push({ sku: 'protein_shake_01', title: 'High-Protein Shake', category: 'nutrition' });

  return recs;
}

/* ---------------------- Main Plan Generator ---------------------- */

export async function generatePersonalizedPlan(userId) {
  const user = await fetchUser(userId);
  if (!user) throw new Error('User not found');

  // Basic user fields with fallbacks
  const sex = user.sex || user.gender || 'male';
  const weightKg = Number(user.weight) || Number(user.weightInKg) || 75;
  const heightCm = Number(user.height) || Number(user.heightInCm) || 175;
  const age = Number(user.age) || 30;
  const activity = user.activity_level || user.activityLevel || 'light';
  const goal = user.goal || user.fitnessGoal || 'maintain';
  const pref = user.diet_pref || user.nutritionPreference || 'balanced';
  const experience = user.fitness_experience || user.experience || 'beginner';
  const daysPerWeek = Number(user.workout_days) || 3;
  const equipment = user.equipment || [];
  const sleepHours = Number(user.avg_sleep_hours) || Number(user.sleepHours) || 7;
  const stressLevel = Number(user.self_reported_stress) || Number(user.stressLevel) || 4;
  const timeAvailable = Number(user.available_minutes) || 10;
  const mealsPerDay = Number(user.meals_per_day) || 3;

  // Nutrition calculations
  const bmr = Math.round(calcBMR({ sex, weightKg, heightCm, age }));
  const tdee = Math.round(tdeeFromBMR(bmr, activity));
  const calorieTarget = adjustForGoal(tdee, goal);
  const macros = macrosFromCalories(calorieTarget, pref, weightKg);
  const meals = generateMealTemplates(calorieTarget, mealsPerDay);

  // Workout
  const workoutPlan = generateWorkoutPlan({ goal, experience, daysPerWeek, equipment });

  // Wellness
  const wellnessPlan = generateWellnessPlan({ sleepHours, stressLevel, timeAvailable });

  // Product recs
  const productRecs = generateProductRecommendations(user);

  const plan = {
    meta: { generatedAt: new Date().toISOString(), userId, bmr, tdee, calorieTarget },
    nutrition: { calories: calorieTarget, macros, meals },
    workouts: workoutPlan,
    wellness: wellnessPlan,
    recommendations: productRecs,
  };

  // Save to DB
  await savePlan(userId, plan);

  return plan;
}

export async function getLatestPlan(userId) {
  return await latestSavedPlan(userId);
}

// Expose helper functions if needed elsewhere
export const helpers = {
  calcBMR,
  tdeeFromBMR,
  adjustForGoal,
  macrosFromCalories,
  generateMealTemplates,
  generateWorkoutPlan,
  generateWellnessPlan,
};



const { Pool } = require('pg');
const cors = require('cors');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_6C7yObkFEKru@ep-weathered-band-adozf8ay-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        age INTEGER,
        weight DECIMAL(5,2),
        height DECIMAL(5,2),
        activity_level VARCHAR(50),
        goals TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create food_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        food_name VARCHAR(255) NOT NULL,
        calories DECIMAL(8,2),
        protein DECIMAL(8,2),
        carbs DECIMAL(8,2),
        fat DECIMAL(8,2),
        quantity DECIMAL(8,2),
        meal_type VARCHAR(50),
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create exercise_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exercise_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        exercise_name VARCHAR(255) NOT NULL,
        duration_minutes INTEGER,
        calories_burned DECIMAL(8,2),
        sets INTEGER,
        reps INTEGER,
        weight DECIMAL(8,2),
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create daily_data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date DATE DEFAULT CURRENT_DATE,
        calories INTEGER DEFAULT 0,
        protein DECIMAL(8,2) DEFAULT 0,
        carbs DECIMAL(8,2) DEFAULT 0,
        fat DECIMAL(8,2) DEFAULT 0,
        water INTEGER DEFAULT 0,
        steps INTEGER DEFAULT 0,
        exercise_minutes INTEGER DEFAULT 0,
        calories_burned INTEGER DEFAULT 0,
        sleep_hours DECIMAL(4,2) DEFAULT 0,
        mood VARCHAR(50),
        weight DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `);

    // Create gratitude_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gratitude_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        entry TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create journal_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        mood_tag VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create meditation_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meditation_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        duration INTEGER,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create meditation_library table (for admin-uploaded meditations)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meditation_library (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        duration INTEGER,
        description TEXT,
        audio_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_gratitude_user_date ON gratitude_logs(user_id, created_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, created_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_meditation_user_date ON meditation_sessions(user_id, created_at DESC)
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
initializeDatabase();

module.exports = async (req, res) => {
  // Enable CORS
  const corsHandler = cors({
    origin: ['https://aifitnessapp.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Promise((resolve) => {
      corsHandler(req, res, () => {
        res.status(200).end();
        resolve();
      });
    });
  }

  // Apply CORS to all requests
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  const { method, url } = req;
  const path = url.split('?')[0];

  try {
    // Health check
    if (path === '/api/health') {
      return res.json({ status: 'OK', message: 'BloomYou API is running' });
    }

    // User registration
    if (path === '/api/auth/register' && method === 'POST') {
      const { email, name, password } = req.body;
      
      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Email, name, and password are required' });
      }

      try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Create new user
        const result = await pool.query(
          'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name, created_at',
          [email, name]
        );

        return res.json({
          success: true,
          message: 'Account created successfully',
          user: result.rows[0]
        });
      } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Registration failed' });
      }
    }

    // User login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        // Find user by email
        const result = await pool.query('SELECT id, email, name, created_at FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'No account found with this email' });
        }

        const user = result.rows[0];
        
        return res.json({
          success: true,
          message: 'Login successful',
          user: user
        });
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
      }
    }

    // Get user profile
    if (path === '/api/auth/profile' && method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      try {
        const result = await pool.query('SELECT id, email, name, age, weight, height, activity_level, goals, created_at FROM users WHERE id = $1', [userId]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
          success: true,
          user: result.rows[0]
        });
      } catch (error) {
        console.error('Profile error:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
    }

    // Food search
    if (path === '/api/foods/search' && method === 'GET') {
      const { q } = req.query;
      
      if (!q) {
        return res.json([]);
      }

      // Search in food_entries for user-created foods
      const result = await pool.query(
        'SELECT DISTINCT food_name, calories, protein, carbs, fat FROM food_entries WHERE food_name ILIKE $1',
        [`%${q}%`]
      );

      // Mock foods for demo
      const mockFoods = [
        { id: 1, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, brand: 'Generic', serving_size: '100g' },
        { id: 2, name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, brand: 'Generic', serving_size: '1 cup cooked' },
        { id: 3, name: 'Avocado', calories: 234, protein: 2.9, carbs: 12, fat: 21, brand: 'Generic', serving_size: '1 medium' },
        { id: 4, name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0, brand: 'Chobani', serving_size: '1 container' },
        { id: 5, name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, brand: 'Generic', serving_size: '1 medium' }
      ];

      const filteredFoods = mockFoods.filter(food =>
        food.name.toLowerCase().includes(q.toLowerCase())
      );

      return res.json([...result.rows, ...filteredFoods]);
    }

    // Log food entry
    if (path === '/api/user/log-food' && method === 'POST') {
      const { foodName, calories, protein, carbs, fat, quantity, mealType, userId = 1 } = req.body;

      const result = await pool.query(
        'INSERT INTO food_entries (user_id, food_name, calories, protein, carbs, fat, quantity, meal_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [userId, foodName, calories, protein, carbs, fat, quantity, mealType]
      );

      return res.json({
        success: true,
        message: 'Food logged successfully',
        data: result.rows[0]
      });
    }

    // Get food entries
    if (path === '/api/user/log-food' && method === 'GET') {
      const { userId = 1, date } = req.query;
      
      let query = 'SELECT * FROM food_entries WHERE user_id = $1';
      let params = [userId];
      
      if (date) {
        query += ' AND date = $2';
        params.push(date);
      }
      
      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      
      return res.json({
        success: true,
        logs: result.rows
      });
    }

    // Log exercise entry
    if (path === '/api/user/log-exercise' && method === 'POST') {
      const { exerciseName, duration, calories, sets, reps, weight, userId = 1 } = req.body;

      const result = await pool.query(
        'INSERT INTO exercise_entries (user_id, exercise_name, duration_minutes, calories_burned, sets, reps, weight) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, exerciseName, duration, calories, sets, reps, weight]
      );

      return res.json({
        success: true,
        message: 'Exercise logged successfully',
        data: result.rows[0]
      });
    }

    // Update daily data
    if (path === '/api/user/daily-data' && method === 'POST') {
      const { 
        userId = 1, 
        calories, 
        protein, 
        carbs, 
        fat, 
        water, 
        steps, 
        exerciseMinutes, 
        caloriesBurned, 
        sleepHours, 
        mood, 
        weight 
      } = req.body;

      const result = await pool.query(
        `INSERT INTO daily_data (user_id, calories, protein, carbs, fat, water, steps, exercise_minutes, calories_burned, sleep_hours, mood, weight)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id, date) 
         DO UPDATE SET 
           calories = EXCLUDED.calories,
           protein = EXCLUDED.protein,
           carbs = EXCLUDED.carbs,
           fat = EXCLUDED.fat,
           water = EXCLUDED.water,
           steps = EXCLUDED.steps,
           exercise_minutes = EXCLUDED.exercise_minutes,
           calories_burned = EXCLUDED.calories_burned,
           sleep_hours = EXCLUDED.sleep_hours,
           mood = EXCLUDED.mood,
           weight = EXCLUDED.weight
         RETURNING *`,
        [userId, calories, protein, carbs, fat, water, steps, exerciseMinutes, caloriesBurned, sleepHours, mood, weight]
      );

      return res.json({
        success: true,
        message: 'Daily data updated successfully',
        data: result.rows[0]
      });
    }

    // Get daily data
    if (path === '/api/user/daily-data' && method === 'GET') {
      const { userId = 1, date } = req.query;
      
      const result = await pool.query(
        'SELECT * FROM daily_data WHERE user_id = $1 AND date = $2',
        [userId, date || new Date().toISOString().split('T')[0]]
      );

      if (result.rows.length === 0) {
        // Return default data if no entry exists
        return res.json({
          success: true,
          data: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            water: 0,
            steps: 0,
            exerciseMinutes: 0,
            caloriesBurned: 0,
            sleepHours: 0,
            mood: '',
            weight: 0
          }
        });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    }

    // Mock food recognition (placeholder)
    if (path === '/api/foods/recognize' && method === 'POST') {
      // This would normally handle image upload and AI recognition
      // For now, return mock data
      const mockFoods = [
        { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving_size: '1 medium (182g)' },
        { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_size: '100g' },
        { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving_size: '1 cup (91g)' }
      ];
      
      const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      
      return res.json({
        success: true,
        food: randomFood
      });
    }

    // Mock recipes endpoint
    if (path === '/api/recipes' && method === 'GET') {
      const mockRecipes = [
        {
          id: 1,
          title: 'Protein Pancakes',
          image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
          cookTime: 15,
          servings: 2,
          calories: 340,
          protein: 22,
          carbs: 35,
          fat: 12,
          difficulty: 'Easy',
          tags: ['Breakfast', 'High Protein'],
          rating: 4.8,
          reviews: 124,
          ingredients: ['2 eggs', '1 scoop protein powder', '1/2 cup oats', '1 banana'],
          instructions: ['Mix ingredients', 'Cook on griddle', 'Serve hot'],
          category: 'Breakfast'
        }
      ];

      return res.json(mockRecipes);
    }

    // Mock workouts endpoint
    if (path === '/api/workouts' && method === 'GET') {
      const mockWorkouts = [
        {
          id: 1,
          title: 'Full Body HIIT Blast',
          thumbnail: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
          duration: 20,
          calories: 250,
          difficulty: 'Intermediate',
          category: 'HIIT',
          equipment: ['None'],
          rating: 4.8,
          reviews: 342,
          instructor: 'Sarah Johnson',
          description: 'High-intensity interval training that targets all major muscle groups.',
          exercises: [
            { name: 'Jumping Jacks', duration: 45, description: 'Full body cardio movement' },
            { name: 'Burpees', duration: 30, description: 'Complete body exercise' },
            { name: 'Mountain Climbers', duration: 45, description: 'Core and cardio combination' }
          ],
          isPremium: false
        }
      ];

      return res.json(mockWorkouts);
    }

    // ==================== AIMind API Endpoints ====================

    // Post gratitude entry
    if (path === '/api/aimind/gratitude' && method === 'POST') {
      const { userId = 1, entry } = req.body;
      
      if (!entry || !entry.trim()) {
        return res.status(400).json({ error: 'Gratitude entry is required' });
      }

      try {
        const result = await pool.query(
          'INSERT INTO gratitude_logs (user_id, entry) VALUES ($1, $2) RETURNING *',
          [userId, entry.trim()]
        );

        return res.json({
          success: true,
          message: 'Gratitude entry saved successfully',
          data: result.rows[0]
        });
      } catch (error) {
        console.error('Gratitude save error:', error);
        return res.status(500).json({ error: 'Failed to save gratitude entry' });
      }
    }

    // Get gratitude entries
    if (path === '/api/aimind/gratitude' && method === 'GET') {
      const { userId = 1, limit = 10 } = req.query;

      try {
        const result = await pool.query(
          'SELECT * FROM gratitude_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
          [userId, parseInt(limit)]
        );

        return res.json({
          success: true,
          entries: result.rows
        });
      } catch (error) {
        console.error('Gratitude fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch gratitude entries' });
      }
    }

    // Post journal entry
    if (path === '/api/aimind/journal' && method === 'POST') {
      const { userId = 1, content, moodTag } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Journal content is required' });
      }

      try {
        const result = await pool.query(
          'INSERT INTO journal_entries (user_id, content, mood_tag) VALUES ($1, $2, $3) RETURNING *',
          [userId, content.trim(), moodTag || null]
        );

        return res.json({
          success: true,
          message: 'Journal entry saved successfully',
          data: result.rows[0]
        });
      } catch (error) {
        console.error('Journal save error:', error);
        return res.status(500).json({ error: 'Failed to save journal entry' });
      }
    }

    // Get journal entries
    if (path === '/api/aimind/journal' && method === 'GET') {
      const { userId = 1, limit = 5 } = req.query;

      try {
        const result = await pool.query(
          'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
          [userId, parseInt(limit)]
        );

        return res.json({
          success: true,
          entries: result.rows
        });
      } catch (error) {
        console.error('Journal fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch journal entries' });
      }
    }

    // Start meditation session
    if (path === '/api/aimind/meditation/start' && method === 'POST') {
      const { userId = 1, title, duration } = req.body;

      try {
        const result = await pool.query(
          'INSERT INTO meditation_sessions (user_id, title, duration, completed) VALUES ($1, $2, $3, false) RETURNING *',
          [userId, title || 'Meditation Session', duration || 10]
        );

        return res.json({
          success: true,
          message: 'Meditation session started',
          session: result.rows[0]
        });
      } catch (error) {
        console.error('Meditation start error:', error);
        return res.status(500).json({ error: 'Failed to start meditation session' });
      }
    }

    // Complete meditation session
    if (path === '/api/aimind/meditation/complete' && method === 'POST') {
      const { sessionId, userId = 1 } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      try {
        const result = await pool.query(
          'UPDATE meditation_sessions SET completed = true WHERE id = $1 AND user_id = $2 RETURNING *',
          [sessionId, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Session not found' });
        }

        return res.json({
          success: true,
          message: 'Meditation session completed',
          session: result.rows[0]
        });
      } catch (error) {
        console.error('Meditation complete error:', error);
        return res.status(500).json({ error: 'Failed to complete meditation session' });
      }
    }

    // Get meditation sessions
    if (path === '/api/aimind/meditation' && method === 'GET') {
      const { userId = 1, limit = 10 } = req.query;

      try {
        const result = await pool.query(
          'SELECT * FROM meditation_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
          [userId, parseInt(limit)]
        );

        return res.json({
          success: true,
          sessions: result.rows
        });
      } catch (error) {
        console.error('Meditation fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch meditation sessions' });
      }
    }

    // Get AIMind insights (correlations between sleep, mood, habits)
    if (path === '/api/aimind/insights' && method === 'GET') {
      const { userId = 1 } = req.query;

      try {
        // Get user's data from last 7 days
        const [dailyDataResult, meditationResult, gratitudeResult, journalResult] = await Promise.all([
          pool.query(
            `SELECT * FROM daily_data 
             WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
             ORDER BY date DESC`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as count FROM meditation_sessions 
             WHERE user_id = $1 AND completed = true 
             AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as count FROM gratitude_logs 
             WHERE user_id = $1 
             AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as count FROM journal_entries 
             WHERE user_id = $1 
             AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
            [userId]
          )
        ]);

        const dailyData = dailyDataResult.rows;
        const meditationCount = parseInt(meditationResult.rows[0]?.count || 0);
        const gratitudeCount = parseInt(gratitudeResult.rows[0]?.count || 0);
        const journalCount = parseInt(journalResult.rows[0]?.count || 0);

        // Calculate insights
        const totalDays = dailyData.length || 1;
        const avgSleep = dailyData.length > 0
          ? dailyData.reduce((sum, day) => sum + parseFloat(day.sleep_hours || 0), 0) / dailyData.length
          : 0;
        
        const goodMoodDays = dailyData.filter(day => 
          ['excellent', 'good'].includes(day.mood)
        ).length;
        
        const moodStability = totalDays > 0 ? (goodMoodDays / totalDays) * 100 : 0;

        // Calculate calmness score (based on meditation, gratitude, journal, and mood stability)
        const calmnessScore = Math.min(100, 
          Math.round(
            (meditationCount * 10) + 
            (gratitudeCount * 5) + 
            (journalCount * 5) + 
            (moodStability * 0.5) +
            (avgSleep >= 7 ? 20 : avgSleep >= 6 ? 10 : 0)
          )
        );

        // Generate insights
        const insights = {
          calmnessScore,
          avgSleep: avgSleep.toFixed(1),
          moodStability: moodStability.toFixed(1),
          meditationCount,
          gratitudeCount,
          journalCount,
          totalDays,
          recommendations: []
        };

        // Add recommendations based on data
        if (avgSleep < 7) {
          insights.recommendations.push({
            type: 'sleep',
            message: `Your average sleep is ${avgSleep.toFixed(1)} hours. Aim for 7-9 hours for optimal wellness.`,
            action: 'Try a 10-minute meditation before bed'
          });
        }

        if (moodStability < 50) {
          insights.recommendations.push({
            type: 'mood',
            message: 'Your mood has been fluctuating. Regular gratitude practice can help stabilize your mood.',
            action: 'Log 3 things you're grateful for today'
          });
        }

        if (meditationCount === 0) {
          insights.recommendations.push({
            type: 'meditation',
            message: 'You haven\'t meditated this week. Even 5 minutes can make a difference.',
            action: 'Start a 10-minute meditation session'
          });
        }

        if (insights.recommendations.length === 0) {
          insights.recommendations.push({
            type: 'positive',
            message: 'Great job! You\'re maintaining consistent wellness habits.',
            action: 'Keep up the excellent work!'
          });
        }

        return res.json({
          success: true,
          insights
        });
      } catch (error) {
        console.error('Insights fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch insights' });
      }
    }

    // Meditation Library endpoints
    // Get all meditations from library
    if (path === '/api/aimind/meditation/library' && method === 'GET') {
      const { category } = req.query;
      
      try {
        let query = 'SELECT * FROM meditation_library';
        let params = [];
        
        if (category) {
          query += ' WHERE category = $1';
          params.push(category);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        
        return res.json({
          success: true,
          meditations: result.rows
        });
      } catch (error) {
        console.error('Meditation library fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch meditation library' });
      }
    }

    // Admin: Add meditation to library
    if (path === '/api/admin/meditation' && method === 'POST') {
      const { username, password } = req.headers;
      if (username !== 'admin' || password !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, category, duration, description, audioUrl } = req.body;
      
      if (!title || !category || !duration || !audioUrl) {
        return res.status(400).json({ error: 'Title, category, duration, and audioUrl are required' });
      }

      try {
        const result = await pool.query(
          'INSERT INTO meditation_library (title, category, duration, description, audio_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [title, category, duration, description || null, audioUrl]
        );

        return res.json({
          success: true,
          message: 'Meditation added to library',
          meditation: result.rows[0]
        });
      } catch (error) {
        console.error('Meditation library add error:', error);
        return res.status(500).json({ error: 'Failed to add meditation to library' });
      }
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

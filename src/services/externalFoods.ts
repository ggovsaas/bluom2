// src/services/externalFoods.ts
// External food APIs: FatSecret, USDA, Google Vision

import axios from 'axios';

const FATSECRET_API_KEY = process.env.EXPO_PUBLIC_FATSECRET_API_KEY || '';
const FATSECRET_API_SECRET = process.env.EXPO_PUBLIC_FATSECRET_API_SECRET || '';
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || '';
const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';

// FatSecret OAuth token (simplified - in production, use proper OAuth flow)
let fatSecretToken: string | null = null;

async function getFatSecretToken() {
  if (fatSecretToken) return fatSecretToken;

  try {
    // Simplified token request (use proper OAuth in production)
    const response = await axios.post('https://oauth.fatsecret.com/connect/token', {
      grant_type: 'client_credentials',
      scope: 'basic',
    }, {
      auth: {
        username: FATSECRET_API_KEY,
        password: FATSECRET_API_SECRET,
      },
    });

    fatSecretToken = response.data.access_token;
    return fatSecretToken;
  } catch (error) {
    console.error('FatSecret token error:', error);
    return null;
  }
}

// Search FatSecret foods
export async function searchFatSecret(query: string) {
  try {
    const token = await getFatSecretToken();
    if (!token) return [];

    const response = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      params: {
        method: 'foods.search',
        search_expression: query,
        format: 'json',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const foods = response.data?.foods?.food || [];
    return foods.map((food: any) => ({
      id: `fatsecret_${food.food_id}`,
      name: food.food_name,
      brand: food.brand_name,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbohydrate || 0,
      fat: food.fat || 0,
      serving_size: food.serving_size || '100g',
      source: 'fatsecret',
    }));
  } catch (error) {
    console.error('FatSecret search error:', error);
    return [];
  }
}

// Search FatSecret by barcode
export async function searchFatSecretBarcode(barcode: string) {
  try {
    const token = await getFatSecretToken();
    if (!token) return null;

    const response = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      params: {
        method: 'food.find_id_for_barcode',
        barcode: barcode,
        format: 'json',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const foodId = response.data?.food_id;
    if (!foodId) return null;

    // Get food details
    const foodResponse = await axios.get('https://platform.fatsecret.com/rest/server.api', {
      params: {
        method: 'food.get',
        food_id: foodId,
        format: 'json',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const food = foodResponse.data?.food;
    if (!food) return null;

    return {
      id: `fatsecret_${food.food_id}`,
      name: food.food_name,
      brand: food.brand_name,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbohydrate || 0,
      fat: food.fat || 0,
      serving_size: food.serving_size || '100g',
      barcode: barcode,
      source: 'fatsecret',
    };
  } catch (error) {
    console.error('FatSecret barcode error:', error);
    return null;
  }
}

// Search USDA foods
export async function searchUSDA(query: string) {
  try {
    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        api_key: USDA_API_KEY,
        query: query,
        pageSize: 20,
      },
    });

    const foods = response.data?.foods || [];
    return foods.map((food: any) => {
      const nutrients = food.foodNutrients || [];
      const calories = nutrients.find((n: any) => n.nutrientId === 1008)?.value || 0;
      const protein = nutrients.find((n: any) => n.nutrientId === 1003)?.value || 0;
      const carbs = nutrients.find((n: any) => n.nutrientId === 1005)?.value || 0;
      const fat = nutrients.find((n: any) => n.nutrientId === 1004)?.value || 0;

      return {
        id: `usda_${food.fdcId}`,
        name: food.description,
        brand: food.brandOwner || null,
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        serving_size: '100g',
        source: 'usda',
      };
    });
  } catch (error) {
    console.error('USDA search error:', error);
    return [];
  }
}

// Google Vision AI - Analyze food image
export async function analyzeFoodImage(base64Image: string) {
  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'TEXT_DETECTION', maxResults: 10 },
            ],
          },
        ],
      }
    );

    const labels = response.data?.responses?.[0]?.labelAnnotations || [];
    const texts = response.data?.responses?.[0]?.textAnnotations || [];

    // Extract food-related labels
    const foodLabels = labels
      .filter((label: any) => label.score > 0.7)
      .map((label: any) => label.description);

    // Extract text (nutritional info from labels)
    const textContent = texts[0]?.description || '';

    return {
      labels: foodLabels,
      text: textContent,
      suggestions: foodLabels.slice(0, 3), // Top 3 food suggestions
    };
  } catch (error) {
    console.error('Vision API error:', error);
    return {
      labels: [],
      text: '',
      suggestions: [],
    };
  }
}

